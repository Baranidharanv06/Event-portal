const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  deadline: { type: Date, required: true },
  venue: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slots: { type: Number, default: 50 },
  slotsRemaining: { type: Number, default: 50 },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);