const mongoose = require('mongoose');

const waitlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  position: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['waiting', 'promoted', 'cancelled'],
    default: 'waiting'
  }
}, { timestamps: true });

module.exports = mongoose.model('Waitlist', waitlistSchema);