const express = require('express');
const jwt = require('jsonwebtoken');
const Station = require('../models/Station');
const router = express.Router();

// Middleware to verify the user is logged in
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

// 1. PUBLIC ROUTE: Get all VERIFIED stations for the Live Map
router.get('/', async (req, res) => {
  try {
    // Only send stations to the map that have been approved by the admin!
    const stations = await Station.find({ isVerified: true });
    res.status(200).json(stations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. POST Route: Register a new station
router.post('/register', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'host') {
      return res.status(403).json({ message: "Only registered Hosts can add stations." });
    }
    const newStation = new Station({
      ...req.body,
      hostId: req.user.userId 
    });
    await newStation.save();
    res.status(201).json({ message: "Station registered successfully! Pending Admin Verification." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. GET Route: Admin fetch all pending stations
router.get('/pending', verifyToken, async (req, res) => {
  try {
    const pendingStations = await Station.find({ isVerified: false });
    res.status(200).json(pendingStations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. PUT Route: Admin approve a station
router.put('/approve/:id', verifyToken, async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true });
    if (!station) return res.status(404).json({ message: "Station not found" });
    res.status(200).json({ message: "Station Approved and is now Live!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;