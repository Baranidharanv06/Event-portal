const express = require('express');
const router = express.Router();
const LateRequest = require('../models/LateRequest');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

const isRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.session.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

// Student submits late request
router.post('/:eventId', isAuth, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if deadline has passed
    const now = new Date();
    if (now <= new Date(event.deadline)) {
      return res.status(400).json({ message: 'Deadline has not passed yet. Register normally.' });
    }

    // Check already registered
    const existing = await Registration.findOne({ user: req.session.userId, event: req.params.eventId });
    if (existing) return res.status(400).json({ message: 'You are already registered' });

    // Check already requested
    const existingRequest = await LateRequest.findOne({ user: req.session.userId, event: req.params.eventId });
    if (existingRequest) return res.status(400).json({ message: 'You already have a pending request' });

    const request = await LateRequest.create({
      user: req.session.userId,
      event: req.params.eventId,
      reason
    });

    res.json({ message: 'Late registration request submitted', request });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get my late requests (student)
router.get('/my', isAuth, async (req, res) => {
  try {
    const requests = await LateRequest.find({ user: req.session.userId })
      .populate('event', 'title date venue')
      .populate('reviewedBy', 'name');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get late requests for organizer's events
router.get('/organizer/pending', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const myEvents = await Event.find({ organizer: req.session.userId });
    const eventIds = myEvents.map(e => e._id);
    const requests = await LateRequest.find({ event: { $in: eventIds }, status: 'pending' })
      .populate('user', 'name email department')
      .populate('event', 'title date venue');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve late request (organizer or admin)
router.put('/:id/approve', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const request = await LateRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Register the student
    const existing = await Registration.findOne({ user: request.user, event: request.event });
    if (!existing) {
      await Registration.create({ user: request.user, event: request.event });
      await Event.findByIdAndUpdate(request.event, { $inc: { slotsRemaining: -1 } });
    }

    await LateRequest.findByIdAndUpdate(req.params.id, {
      status: 'approved',
      reviewedBy: req.session.userId
    });

    res.json({ message: 'Late request approved, student registered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject late request (organizer or admin)
router.put('/:id/reject', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    await LateRequest.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: req.session.userId
    });
    res.json({ message: 'Late request rejected' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;