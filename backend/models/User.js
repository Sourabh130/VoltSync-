const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'driver' }, // 'driver' or 'host'
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  
  // --- NEW ADVANCED PROFILE FIELDS ---
  name: { type: String, default: 'VoltSync User' },
  city: { type: String, default: 'Madhya Pradesh' },
  evCount: { type: Number, default: 1 }
}, { timestamps: true }); // timestamps automatically adds 'createdAt' (Join Date!)

module.exports = mongoose.model('User', userSchema);