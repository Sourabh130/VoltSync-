const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('dotenv').config();

const User = require('./models/User');
const { router: authRoutes } = require('./routes/auth');
const stationRoutes = require('./routes/stations');
const bookingRoutes = require('./routes/bookings');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'VoltSync Backend API', timestamp: new Date() });
});

// Seed default Admin if not present
const seedDefaultAdmin = async () => {
  try {
    const adminEmail = 'admin@voltsync.com';
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        name: 'VoltSync Super Admin',
        city: 'Bhopal, MP',
        isVerified: true
      });
      await admin.save();
      console.log('⚡ Default Admin Account Initialized: admin@voltsync.com / admin123');
    } else if (existing.role !== 'admin' || !existing.isVerified) {
      existing.role = 'admin';
      existing.isVerified = true;
      await existing.save();
      console.log('⚡ Verified Admin Account Privileges for admin@voltsync.com');
    }
  } catch (err) {
    console.warn('Admin seed warning:', err.message);
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected to VoltSync Database");
    await seedDefaultAdmin();
  })
  .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ VoltSync Server running on port ${PORT}`);
});
