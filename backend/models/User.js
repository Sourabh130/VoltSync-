const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['driver', 'host', 'admin'], default: 'driver' },
  otp: { type: String },
  isVerified: { type: Boolean, default: false },
  
  // Profile Fields
  name: { type: String, default: 'VoltSync User' },
  city: { type: String, default: 'Bhopal, MP' },
  evCount: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
