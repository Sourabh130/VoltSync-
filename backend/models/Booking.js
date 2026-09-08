const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  // Relational Links
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Basic Booking Info
  date: { type: String, required: true },
  timeSlot: { type: String, required: true },
  
  // Status Tracking
  status: { 
    type: String, 
    enum: ['locked', 'confirmed', 'charging', 'completed', 'cancelled'], 
    default: 'locked' 
  },
  lockedUntil: { type: Date },
  
  // --- HACKATHON JURY TASK FIELDS ---
  escrowAmount: { type: Number },     
  finalBill: { type: Number },        
  refundAmount: { type: Number },     
  chargingStartTime: { type: Date },  // Required for Live Timer & Prorating
  stopReason: { type: String }        // Required for Host Eviction Message

}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);