const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  address: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  plugType: { type: String, required: true },
  powerOutput: { type: Number, required: true }, // in kW
  hourlyRate: { type: Number, required: true },
  totalPorts: { type: Number, default: 2 },
  availablePorts: { type: Number, default: 2 },
  isVerified: { type: Boolean, default: false }, // Crucial for your Admin flow
  status: { type: String, default: 'available' },
}, { timestamps: true });

module.exports = mongoose.model('Station', stationSchema);