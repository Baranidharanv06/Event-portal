const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Waitlist = require('../models/Waitlist');

const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

const isRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.session.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

// Get all approved events (with search and filter)
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = { status: 'approved' };
    if (search) query.title = { $regex: search, $options: 'i' };
    if (category) query.category = category;
    const events = await Event.find(query).populate('category').populate('organizer', 'name');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('category').populate('organizer', 'name');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (organizer or admin)
router.post('/', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const { title, description, date, deadline, venue, category, slots } = req.body;
    if (!title || !date || !deadline || !venue || !slots) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    const status = req.session.role === 'admin' ? 'approved' : 'pending';
    const event = await Event.create({
      title, description, date, deadline, venue, category, slots,
      slotsRemaining: slots,
      organizer: req.session.userId,
      status
    });
    res.json({ message: req.session.role === 'admin' ? 'Event created and approved' : 'Event submitted for approval', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (organizer owns it or admin)
router.put('/:id', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.session.role === 'organizer' && event.organizer.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ message: 'Not your event' });
    }
    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ message: 'Event updated', event: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (organizer owns it or admin)
router.delete('/:id', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (req.session.role === 'organizer' && event.organizer.toString() !== req.session.userId.toString()) {
      return res.status(403).json({ message: 'Not your event' });
    }
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get organizer's own events
router.get('/organizer/my', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.session.userId }).populate('category');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendees for an event (organizer)
router.get('/:id/attendees', isAuth, isRole('organizer', 'admin'), async (req, res) => {
  try {
    const registrations = await Registration.find({ event: req.params.id })
      .populate('user', 'name email department');
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve event (coordinator or admin)
router.put('/:id/approve', isAuth, isRole('coordinator', 'admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', rejectionReason: '' },
      { new: true }
    );
    res.json({ message: 'Event approved', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject event (coordinator or admin)
router.put('/:id/reject', isAuth, isRole('coordinator', 'admin'), async (req, res) => {
  try {
    const { reason } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason },
      { new: true }
    );
    res.json({ message: 'Event rejected', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending events (coordinator)
router.get('/coordinator/pending', isAuth, isRole('coordinator', 'admin'), async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending' }).populate('organizer', 'name email').populate('category');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;