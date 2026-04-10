const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

const isAuth = (req, res, next) => {
  if (!req.session.userId) return res.status(401).json({ message: 'Not logged in' });
  next();
};

// Submit feedback
router.post('/', isAuth, async (req, res) => {
  try {
    const { eventId, comment, rating } = req.body;
    const feedback = await Feedback.create({
      user: req.session.userId,
      event: eventId,
      comment,
      rating
    });
    res.json({ message: 'Feedback submitted', feedback });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get feedback for an event
router.get('/:eventId', async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ event: req.params.eventId }).populate('user', 'name');
    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;