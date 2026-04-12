import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Events from './pages/Events';
import MyRegistrations from './pages/MyRegistrations';
import AdminDashboard from './pages/AdminDashboard';
import OrganizerDashboard from './pages/OrganizerDashboard';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import LateRequest from './pages/LateRequest';
import Feedback from './pages/Feedback';
import Profile from './pages/Profile';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5001/api/auth/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.userId) setUser({ name: data.name, role: data.role });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

  return (
    <Router>
      <Navbar user={user} setUser={setUser} />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<Navigate to="/events" />} />
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/events" />} />
          <Route path="/signup" element={!user ? <Signup setUser={setUser} /> : <Navigate to="/events" />} />
          <Route path="/events" element={<Events user={user} />} />
          <Route path="/my-registrations" element={user ? <MyRegistrations /> : <Navigate to="/login" />} />
          <Route path="/late-request/:eventId" element={user ? <LateRequest /> : <Navigate to="/login" />} />
          <Route path="/feedback/:eventId" element={user ? <Feedback /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/events" />} />
          <Route path="/organizer" element={user?.role === 'organizer' ? <OrganizerDashboard /> : <Navigate to="/events" />} />
          <Route path="/coordinator" element={user?.role === 'coordinator' ? <CoordinatorDashboard /> : <Navigate to="/events" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;