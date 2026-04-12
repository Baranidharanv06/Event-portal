const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const app = express();


app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(session({
  secret: 'eventportal_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));


mongoose.connect('mongodb://localhost:27017/eventportal')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const registrationRoutes = require('./routes/registrations');
const feedbackRoutes = require('./routes/feedback');
const categoryRoutes = require('./routes/categories');
const lateRequestRoutes = require('./routes/lateRequests');
const adminRoutes = require('./routes/admin');

app.use('/api/late-requests', lateRequestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));