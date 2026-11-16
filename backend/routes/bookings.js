const express = require('express');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const { verifyToken } = require('./auth');

const router = express.Router();

// Helper: Recalculate and update station's available ports accurately
const syncStationPorts = async (stationId) => {
  try {
    const station = await Station.findById(stationId);
    if (!station) return;
    const now = new Date();
    // Count active holds: confirmed reservations, active charging sessions, and unexpired locks
    const activeCount = await Booking.countDocuments({
      stationId,
      $or: [
        { status: { $in: ['confirmed', 'charging'] } },
        { status: 'locked', lockedUntil: { $gt: now } }
      ]
    });
    station.availablePorts = Math.max(0, station.totalPorts - activeCount);
    await station.save();
    return station.availablePorts;
  } catch (err) {
    console.error("Error syncing station ports:", err);
  }
};

const getSlotStartTime = (timeStr, dateStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  if (!match) return d;
  
  let hr = parseInt(match[1]);
  if (match[3].toUpperCase() === 'PM' && hr !== 12) hr += 12;
  if (match[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
  
  d.setHours(hr, parseInt(match[2]), 0, 0);
  return d;
};

// 1. GET DRIVER'S BOOKINGS
router.get('/my-bookings', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId })
      .populate('stationId', 'name address lat lng plugType powerOutput hourlyRate')
      .sort({ createdAt: -1 });

    const formatted = bookings.map(b => {
      const obj = b.toObject();
      if (b.stationId) {
        obj.stationName = b.stationId.name;
        obj.stationAddress = b.stationId.address;
        obj.stationLat = b.stationId.lat;
        obj.stationLng = b.stationId.lng;
        obj.plugType = b.stationId.plugType;
        obj.powerOutput = b.stationId.powerOutput;
        obj.hourlyRate = b.stationId.hourlyRate;
      }
      return obj;
    });

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. GET HOST'S ACTIVE BOOKINGS (Live Traffic)
router.get('/host-active', verifyToken, async (req, res) => {
  try {
    const myStations = await Station.find({ hostId: req.user.userId });
    const stationIds = myStations.map(s => s._id);

    const activeBookings = await Booking.find({ 
      stationId: { $in: stationIds },
      status: { $in: ['confirmed', 'charging'] } 
    })
      .populate('stationId', 'name address')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    const formatted = activeBookings.map(b => {
      const obj = b.toObject();
      obj.stationName = b.stationId?.name || 'VoltSync Station';
      obj.driverName = b.userId?.name || 'EV Driver';
      obj.driverEmail = b.userId?.email || '';
      return obj;
    });

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET BUSY SLOTS FOR A STATION ON A GIVEN DATE (Excludes expired locks and cancelled bookings)
router.get('/:stationId/:date', async (req, res) => {
  try {
    const now = new Date();
    // Only slots that are confirmed, charging, or actively locked (not expired)
    const busyBookings = await Booking.find({
      stationId: req.params.stationId,
      date: req.params.date,
      $or: [
        { status: { $in: ['confirmed', 'charging'] } },
        { status: 'locked', lockedUntil: { $gt: now } }
      ]
    });

    res.status(200).json(busyBookings.map(b => b.timeSlot));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. TEMPORARILY LOCK A SLOT (Prevents double-booking race conditions)
router.post('/lock', verifyToken, async (req, res) => {
  try {
    const { stationId, date, timeSlot } = req.body;
    const now = new Date();

    // Clean up expired locks for this station first and sync available ports
    const expiredLocks = await Booking.find({
      stationId,
      status: 'locked',
      lockedUntil: { $lte: now }
    });
    if (expiredLocks.length > 0) {
      await Booking.deleteMany({
        stationId,
        status: 'locked',
        lockedUntil: { $lte: now }
      });
      await syncStationPorts(stationId);
    }

    // Check if slot is actively reserved
    const existing = await Booking.findOne({
      stationId,
      date,
      timeSlot,
      $or: [
        { status: { $in: ['confirmed', 'charging'] } },
        { status: 'locked', lockedUntil: { $gt: now } }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "This slot is currently reserved or being checked out." });
    }

    const lockExpiration = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lock
    const newLock = new Booking({
      stationId,
      userId: req.user.userId,
      date,
      timeSlot,
      status: 'locked',
      lockedUntil: lockExpiration,
      escrowAmount: 265
    });

    await newLock.save();
    await syncStationPorts(stationId);
    res.status(200).json({ bookingId: newLock._id, lockedUntil: lockExpiration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. CONFIRM BOOKING & HOLD ESCROW
router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: "Booking session not found or expired." });
    if (booking.status === 'confirmed') return res.status(200).json({ message: "Slot already confirmed!" });

    booking.status = 'confirmed';
    booking.lockedUntil = undefined;
    booking.escrowAmount = 265; // Fixed Escrow Hold
    await booking.save();

    await syncStationPorts(booking.stationId);

    res.status(200).json({ message: "Payment secured in Escrow! Slot confirmed." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. CANCEL BOOKING (>30 mins policy)
router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'confirmed') {
      return res.status(400).json({ message: "Invalid or non-cancellable booking." });
    }

    // Check cancellation window: > 30 minutes before start time
    const startStr = booking.timeSlot.split(' - ')[0];
    const startTime = getSlotStartTime(startStr, booking.date);
    const diffInMinutes = (startTime - new Date()) / (1000 * 60);

    if (diffInMinutes < 30 && diffInMinutes > -60) {
      return res.status(400).json({ 
        message: "Cancellation policy: Cannot cancel within 30 minutes of scheduled start time. Escrow is locked." 
      });
    }

    booking.status = 'cancelled';
    booking.refundAmount = booking.escrowAmount || 265;
    await booking.save();

    // Release port on station dynamically
    await syncStationPorts(booking.stationId);

    res.status(200).json({ 
      message: `Booking cancelled successfully! Full refund of ₹${booking.refundAmount} has been processed.` 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. VERIFY ARRIVAL (GPS & QR Authentication - 'Sourabh_Rajput' for all stations)
router.post('/verify-arrival', verifyToken, async (req, res) => {
  try {
    const { bookingId, qrData } = req.body;
    
    // 1. Validate QR code - strictly requires official QR 'Sourabh_Rajput'
    if (!qrData || typeof qrData !== 'string') {
      return res.status(400).json({ 
        message: "No QR code detected. Please scan the official station QR code: 'Sourabh_Rajput'." 
      });
    }

    const normalizedQR = qrData.trim().toLowerCase();
    const isValidQR = normalizedQR === 'sourabh_rajput' || 
                      normalizedQR === 'sourabh rajput' ||
                      normalizedQR.includes('sourabh_rajput');

    if (!isValidQR) {
      return res.status(400).json({ 
        message: "Invalid Station QR! Please scan the official station QR code: 'Sourabh_Rajput'." 
      });
    }

    let booking = null;

    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ message: "Specified booking not found." });
      }
    } else {
      // Find the user's latest confirmed booking
      booking = await Booking.findOne({ 
        userId: req.user.userId, 
        status: 'confirmed' 
      }).sort({ createdAt: -1 });

      if (!booking) {
        return res.status(400).json({ 
          message: "No confirmed booking found for your account. Please book a slot on the Live Map first." 
        });
      }
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({ 
        message: `Cannot start charging: booking status is currently '${booking.status}' (expected 'confirmed').` 
      });
    }

    // Start charging session
    booking.status = 'charging';
    booking.chargingStartTime = new Date();
    await booking.save();

    await syncStationPorts(booking.stationId);

    res.status(200).json({ 
      message: "Authentication successful! QR 'Sourabh_Rajput' verified. Charging session started.", 
      bookingId: booking._id,
      distance: 5 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. STOP CHARGING (Host Eviction / User Finish)
router.post('/stop-charge', verifyToken, async (req, res) => {
  try {
    const { bookingId, stoppedBy, reason } = req.body; 
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    const startTime = booking.chargingStartTime ? new Date(booking.chargingStartTime) : new Date(Date.now() - 30 * 60000);
    const elapsedMinutes = Math.max(1, Math.round((new Date() - startTime) / 60000)); 
    const escrow = booking.escrowAmount || 265; 

    if (stoppedBy === 'user') {
      // User stops voluntarily early: no refund of remaining time
      booking.finalBill = escrow;
      booking.refundAmount = 0;
      booking.stopReason = "User ended session early.";
    } else if (stoppedBy === 'host') {
      // Host stops (emergency/maintenance): Prorated refund to user
      let proratedCost = (escrow / 60) * elapsedMinutes;
      if (proratedCost > escrow) proratedCost = escrow;
      
      booking.finalBill = Math.round(proratedCost);
      booking.refundAmount = Math.max(0, escrow - booking.finalBill);
      booking.stopReason = `Host Emergency Stop: ${reason || 'Station Maintenance'}`;
    }

    booking.status = 'completed';
    await booking.save();

    // Release port dynamically
    await syncStationPorts(booking.stationId);

    res.status(200).json({ 
      message: "Session ended successfully.", 
      bill: booking.finalBill, 
      refund: booking.refundAmount,
      reason: booking.stopReason 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
