const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Waitlist = require('../models/Waitlist');
const LateRequest = require('../models/LateRequest');

const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

const isAdmin = (req, res, next) => {
  if (req.session.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
  next();
};

// Get all users
router.get('/users', isAuth, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change user role
router.put('/users/:id/role', isAuth, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['guest', 'student', 'organizer', 'coordinator', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    res.json({ message: 'Role updated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate user
router.put('/users/:id/deactivate', isAuth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');
    res.json({ message: 'User deactivated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate user
router.put('/users/:id/activate', isAuth, isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');
    res.json({ message: 'User activated', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all events (any status)
router.get('/events', isAuth, isAdmin, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .populate('category');
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all registrations
router.get('/registrations', isAuth, isAdmin, async (req, res) => {
  try {
    const regs = await Registration.find()
      .populate('user', 'name email')
      .populate('event', 'title date venue');
    res.json(regs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system stats
router.get('/stats', isAuth, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalEvents = await Event.countDocuments();
    const totalRegistrations = await Registration.countDocuments();
    const pendingEvents = await Event.countDocuments({ status: 'pending' });
    const totalWaitlist = await Waitlist.countDocuments({ status: 'waiting' });
    const pendingLateRequests = await LateRequest.countDocuments({ status: 'pending' });
    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);
    res.json({
      totalUsers,
      totalEvents,
      totalRegistrations,
      pendingEvents,
      totalWaitlist,
      pendingLateRequests,
      usersByRole
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;