/*
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const stationRoutes = require('./routes/stations');
const bookingRoutes = require('./routes/bookings');
const Station = require('./models/Station');
require('dotenv').config();

// 1. Import your new auth routes here
const authRoutes = require('./routes/auth');

const app = express();
app.use(cors());
app.use(express.json());

// 2. Tell your app to use the auth routes here
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));
// Real Route to get stations from the Database
app.get('/api/stations', async (req, res) => {
  try {
   
    // Real Route to get stations from the Database
app.get('/api/stations', async (req, res) => {
  try {
    // ONLY fetch stations where isVerified is true!
    const stations = await Station.find({ isVerified: true });
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));*/
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth');
const stationRoutes = require('./routes/stations');
const bookingRoutes = require('./routes/bookings');

const app = express();
app.use(cors());
app.use(express.json());

// Tell Express to use the routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));