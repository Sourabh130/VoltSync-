const express = require('express');
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Station = require('../models/Station');
const router = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Access Denied" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

const getSlotStartTime = (timeStr) => {
  const match = timeStr.match(/(\d+):(\d+)\s+(AM|PM)/);
  if(!match) return new Date();
  let hr = parseInt(match[1]);
  if (match[3] === 'PM' && hr !== 12) hr += 12;
  if (match[3] === 'AM' && hr === 12) hr = 0;
  
  let d = new Date();
  d.setHours(hr, parseInt(match[2]), 0, 0);
  return d;
};

router.get('/my-bookings', verifyToken, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    const bookingsWithLocation = await Promise.all(bookings.map(async (booking) => {
      const station = await Station.findById(booking.stationId);
      const bookingObj = booking.toObject(); 
      if (station) {
        bookingObj.stationLat = station.lat;
        bookingObj.stationLng = station.lng;
        bookingObj.stationName = station.name;
      }
      return bookingObj;
    }));
    res.status(200).json(bookingsWithLocation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/host-active', verifyToken, async (req, res) => {
  try {
    const myStations = await Station.find({ hostId: req.user.userId });
    const stationIds = myStations.map(s => s._id);
    const activeBookings = await Booking.find({ 
      stationId: { $in: stationIds },
      status: { $in: ['confirmed', 'charging'] } 
    });
    res.status(200).json(activeBookings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:stationId/:date', async (req, res) => {
  try {
    const bookings = await Booking.find({ stationId: req.params.stationId, date: req.params.date });
    res.status(200).json(bookings.map(b => b.timeSlot));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lock', verifyToken, async (req, res) => {
  try {
    const { stationId, date, timeSlot } = req.body;
    const existing = await Booking.findOne({ stationId, date, timeSlot });
    if (existing) return res.status(400).json({ message: "Slot just became unavailable." });

    const lockExpiration = new Date(Date.now() + 5 * 60 * 1000); 
    const newLock = new Booking({
      stationId, userId: req.user.userId, date, timeSlot, status: 'locked', lockedUntil: lockExpiration
    });
    await newLock.save();
    res.status(200).json({ bookingId: newLock._id, lockedUntil: lockExpiration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/confirm', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking session expired." });

    booking.status = 'confirmed';
    booking.lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); 
    booking.escrowAmount = 265; // Fixed Escrow Hold
    await booking.save();

    const station = await Station.findById(booking.stationId);
    if (station && station.availablePorts > 0) {
      station.availablePorts -= 1;
      await station.save();
    }
    res.status(200).json({ message: "Payment secured in Escrow! Slot Confirmed." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TASK 1: Cancel before 30 mins
router.post('/cancel', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'confirmed') return res.status(400).json({ message: "Invalid booking." });

    const startStr = booking.timeSlot.split(' - ')[0];
    const startTime = getSlotStartTime(startStr);
    const diffInMinutes = (startTime - new Date()) / (1000 * 60);

    if (diffInMinutes < 30) {
      return res.status(400).json({ message: "Cancellation failed: Less than 30 minutes to start time. Escrow locked." });
    }

    const station = await Station.findById(booking.stationId);
    if (station) { station.availablePorts += 1; await station.save(); }

    booking.status = 'cancelled';
    booking.refundAmount = booking.escrowAmount; 
    await booking.save();

    res.status(200).json({ message: `Success: Booking cancelled. Full refund of ₹${booking.escrowAmount} initiated.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify-arrival', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking || booking.status !== 'confirmed') return res.status(400).json({ message: "Slot not confirmed." });

    booking.status = 'charging';
    booking.chargingStartTime = new Date(); 
    await booking.save();

    res.status(200).json({ message: "Authentication Success! Starting charge.", distance: 10 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TASKS 3, 4, 5: Stop Charge Logic (Prorated vs No Refund)
router.post('/stop-charge', verifyToken, async (req, res) => {
  try {
    const { bookingId, stoppedBy, reason } = req.body; 
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found." });

    const station = await Station.findById(booking.stationId);
    if (station && station.availablePorts < station.totalPorts) {
      station.availablePorts += 1;
      await station.save();
    }

    const startTime = booking.chargingStartTime ? new Date(booking.chargingStartTime) : new Date(Date.now() - 30 * 60000);
    const elapsedMinutes = Math.max(1, Math.round((new Date() - startTime) / 60000)); 
    const escrow = booking.escrowAmount || 265; 

    if (stoppedBy === 'user') {
      // TASK 5: User stops early = NO REFUND
      booking.finalBill = escrow;
      booking.refundAmount = 0;
      booking.stopReason = "User voluntarily ended session early.";
    } else if (stoppedBy === 'host') {
      // TASKS 3 & 4: Host stops early = PRORATED REFUND
      let proratedCost = (escrow / 60) * elapsedMinutes;
      if (proratedCost > escrow) proratedCost = escrow;
      
      booking.finalBill = Math.round(proratedCost);
      booking.refundAmount = escrow - booking.finalBill;
      booking.stopReason = `Host Emergency Stop: ${reason}`;
    }

    booking.status = 'completed';
    await booking.save();

    res.status(200).json({ 
      message: "Session ended.", 
      bill: booking.finalBill, 
      refund: booking.refundAmount,
      reason: booking.stopReason 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;