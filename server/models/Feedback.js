const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  comment: { type: String },
  rating: { type: Number, min: 1, max: 5 }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);