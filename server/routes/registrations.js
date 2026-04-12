const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Waitlist = require('../models/Waitlist');

const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

// Register for event
router.post('/:eventId', isAuth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'approved') return res.status(400).json({ message: 'Event is not open for registration' });

    // Check deadline
    const now = new Date();
    if (now > new Date(event.deadline)) {
      return res.status(400).json({ message: 'Registration deadline has passed. You can request late registration.' });
    }

    // Check already registered
    const existing = await Registration.findOne({ user: req.session.userId, event: req.params.eventId });
    if (existing) return res.status(400).json({ message: 'Already registered' });

    // Check waitlist
    const onWaitlist = await Waitlist.findOne({ user: req.session.userId, event: req.params.eventId });
    if (onWaitlist) return res.status(400).json({ message: 'You are already on the waitlist' });

    // Check slots
    if (event.slotsRemaining <= 0) {
      // Add to waitlist
      const waitlistCount = await Waitlist.countDocuments({ event: req.params.eventId, status: 'waiting' });
      const waitlist = await Waitlist.create({
        user: req.session.userId,
        event: req.params.eventId,
        position: waitlistCount + 1
      });
      return res.json({ message: `Event is full. You have been added to the waitlist at position ${waitlist.position}`, waitlist: true });
    }

    // Register and decrease slots
    const reg = await Registration.create({ user: req.session.userId, event: req.params.eventId });
    await Event.findByIdAndUpdate(req.params.eventId, { $inc: { slotsRemaining: -1 } });

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

// Get my waitlist
router.get('/my/waitlist', isAuth, async (req, res) => {
  try {
    const waitlist = await Waitlist.find({ user: req.session.userId, status: 'waiting' }).populate('event');
    res.json(waitlist);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel registration
router.delete('/:id', isAuth, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.id);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });

    await Registration.findByIdAndDelete(req.params.id);

    // Increase slots back
    await Event.findByIdAndUpdate(reg.event, { $inc: { slotsRemaining: 1 } });

    // Promote first person on waitlist
    const nextInLine = await Waitlist.findOne({ event: reg.event, status: 'waiting' }).sort({ position: 1 });
    if (nextInLine) {
      await Registration.create({ user: nextInLine.user, event: reg.event });
      await Event.findByIdAndUpdate(reg.event, { $inc: { slotsRemaining: -1 } });
      await Waitlist.findByIdAndUpdate(nextInLine._id, { status: 'promoted' });
    }

    res.json({ message: 'Registration cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove attendee (organizer)
router.delete('/attendee/:regId', isAuth, async (req, res) => {
  try {
    const reg = await Registration.findById(req.params.regId);
    if (!reg) return res.status(404).json({ message: 'Registration not found' });
    await Registration.findByIdAndDelete(req.params.regId);
    await Event.findByIdAndUpdate(reg.event, { $inc: { slotsRemaining: 1 } });
    res.json({ message: 'Attendee removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;