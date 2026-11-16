const express = require('express');
const Station = require('../models/Station');
const { verifyToken, verifyAdmin } = require('./auth');

const router = express.Router();

// 1. PUBLIC ROUTE: Get all VERIFIED stations for the Live Map
router.get('/', async (req, res) => {
  try {
    const stations = await Station.find({ isVerified: true });
    const now = new Date();
    const Booking = require('../models/Booking');

    // Dynamically compute available ports for each station to guarantee real-time accuracy
    const updatedStations = await Promise.all(stations.map(async (st) => {
      const activeCount = await Booking.countDocuments({
        stationId: st._id,
        $or: [
          { status: { $in: ['confirmed', 'charging'] } },
          { status: 'locked', lockedUntil: { $gt: now } }
        ]
      });
      const realAvailable = Math.max(0, st.totalPorts - activeCount);
      if (st.availablePorts !== realAvailable) {
        st.availablePorts = realAvailable;
        await st.save();
      }
      return st;
    }));

    res.status(200).json(updatedStations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. HOST/ADMIN ROUTE: Register a new station
router.post('/register', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'host' && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Only registered Hosts or Admins can register stations." });
    }

    const { name, address, lat, lng, plugType, powerOutput, hourlyRate, totalPorts } = req.body;
    
    if (!name || !address || lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "Missing required station location details." });
    }

    const ports = Number(totalPorts) || 2;
    const isAutoApproved = req.user.role === 'admin';

    const newStation = new Station({
      name,
      address,
      lat: Number(lat),
      lng: Number(lng),
      plugType: plugType || 'CCS2',
      powerOutput: Number(powerOutput) || 50,
      hourlyRate: Number(hourlyRate) || 250,
      totalPorts: ports,
      availablePorts: ports,
      hostId: req.user.userId,
      isVerified: isAutoApproved,
      status: 'available'
    });

    await newStation.save();
    res.status(201).json({ 
      message: isAutoApproved 
        ? "Station registered and approved directly by Admin!" 
        : "Station registered successfully! Pending Admin Verification.",
      station: newStation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. ADMIN ROUTE: Fetch all pending stations
router.get('/pending', verifyAdmin, async (req, res) => {
  try {
    const pendingStations = await Station.find({ isVerified: false }).populate('hostId', 'name email');
    res.status(200).json(pendingStations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. ADMIN ROUTE: Fetch all stations with system overview stats
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    const allStations = await Station.find({}).populate('hostId', 'name email').sort({ createdAt: -1 });
    const pendingCount = allStations.filter(s => !s.isVerified).length;
    const approvedCount = allStations.filter(s => s.isVerified).length;

    res.status(200).json({
      stations: allStations,
      stats: {
        total: allStations.length,
        pending: pendingCount,
        approved: approvedCount
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. ADMIN ROUTE: Approve a station
router.put('/approve/:id', verifyAdmin, async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(
      req.params.id, 
      { isVerified: true, status: 'available' }, 
      { returnDocument: 'after' }
    );
    if (!station) return res.status(404).json({ message: "Station not found." });
    res.status(200).json({ message: `Station '${station.name}' approved and is now live!`, station });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. ADMIN ROUTE: Reject or delete a station
router.delete('/reject/:id', verifyAdmin, async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) return res.status(404).json({ message: "Station not found." });
    res.status(200).json({ message: `Station '${station.name}' has been rejected and removed.` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. HOST ROUTE: Get logged-in host's stations
router.get('/my-stations', verifyToken, async (req, res) => {
  try {
    const stations = await Station.find({ hostId: req.user.userId });
    res.status(200).json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
