const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  slots: { type: Number, default: 50 }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);