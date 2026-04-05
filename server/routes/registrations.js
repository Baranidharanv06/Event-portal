const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');

const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

// Register for event
router.post('/:eventId', isAuth, async (req, res) => {
  try {
    const existing = await Registration.findOne({
      user: req.session.userId,
      event: req.params.eventId
    });
    if (existing) return res.status(400).json({ message: 'Already registered' });

    const reg = await Registration.create({
      user: req.session.userId,
      event: req.params.eventId
    });
    res.json({ message: 'Registered successfully', reg });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my registrations
router.get('/my', isAuth, async (req, res) => {
  try {
    const regs = await Registration.find({ user: req.session.userId }).populate('event');
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel registration
router.delete('/:id', isAuth, async (req, res) => {
  try {
    await Registration.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;