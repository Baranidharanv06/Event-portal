const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Middleware to check login
const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().populate('category');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('category');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (admin only)
router.post('/', isAuth, async (req, res) => {
  try {
    const { title, description, date, venue, category, slots } = req.body;
    const event = await Event.create({
      title, description, date, venue, category, slots,
      createdBy: req.session.userId
    });
    res.json({ message: 'Event created', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (admin only)
router.delete('/:id', isAuth, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;