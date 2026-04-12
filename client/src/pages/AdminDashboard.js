import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, eventsRes, regsRes, statsRes] = await Promise.all([
        fetch('http://localhost:5001/api/admin/users', { credentials: 'include' }),
        fetch('http://localhost:5001/api/admin/events', { credentials: 'include' }),
        fetch('http://localhost:5001/api/admin/registrations', { credentials: 'include' }),
        fetch('http://localhost:5001/api/admin/stats', { credentials: 'include' })
      ]);
      if (usersRes.status === 401) { navigate('/login'); return; }
      if (usersRes.status === 403) { navigate('/events'); return; }
      const [usersData, eventsData, regsData, statsData] = await Promise.all([
        usersRes.json(), eventsRes.json(), regsRes.json(), statsRes.json()
      ]);
      setUsers(usersData);
      setEvents(eventsData);
      setRegistrations(regsData);
      setStats(statsData);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      const res = await fetch(`http://localhost:5001/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setUsers(users.map(u => u._id === userId ? { ...u, role } : u));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      const endpoint = isActive ? 'deactivate' : 'activate';
      const res = await fetch(`http://localhost:5001/api/admin/users/${userId}/${endpoint}`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        setUsers(users.map(u => u._id === userId ? { ...u, isActive: !isActive } : u));
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/events/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      setMessage(data.message);
      setEvents(events.filter(e => e._id !== id));
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') return <span className="badge bg-warning">Pending</span>;
    if (status === 'approved') return <span className="badge bg-success">Approved</span>;
    if (status === 'rejected') return <span className="badge bg-danger">Rejected</span>;
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

  return (
    <div>
      <h2 className="mb-4">Admin Dashboard</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {['stats', 'users', 'events', 'registrations'].map(tab => (
          <li className="nav-item" key={tab}>
            <button
              className={`nav-link ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Stats Tab */}
      {activeTab === 'stats' && stats && (
        <div>
          <div className="row mb-4">
            {[
              { label: 'Total Users', value: stats.totalUsers, color: 'primary' },
              { label: 'Total Events', value: stats.totalEvents, color: 'success' },
              { label: 'Total Registrations', value: stats.totalRegistrations, color: 'info' },
              { label: 'Pending Events', value: stats.pendingEvents, color: 'warning' },
              { label: 'On Waitlist', value: stats.totalWaitlist, color: 'secondary' },
              { label: 'Late Requests', value: stats.pendingLateRequests, color: 'danger' },
            ].map(stat => (
              <div className="col-md-4 mb-3" key={stat.label}>
                <div className={`card border-${stat.color} text-center p-3`}>
                  <h2 className={`text-${stat.color}`}>{stat.value}</h2>
                  <p className="mb-0 text-muted">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
          <h5 className="mb-3">Users by Role</h5>
          <table className="table table-bordered w-auto">
            <thead className="table-dark">
              <tr><th>Role</th><th>Count</th></tr>
            </thead>
            <tbody>
              {stats.usersByRole.map(r => (
                <tr key={r._id}>
                  <td className="text-capitalize">{r._id}</td>
                  <td>{r.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      className="form-select form-select-sm"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user._id, e.target.value)}
                    >
                      {['guest', 'student', 'organizer', 'coordinator', 'admin'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {user.isActive
                      ? <span className="badge bg-success">Active</span>
                      : <span className="badge bg-danger">Inactive</span>
                    }
                  </td>
                  <td>
                    <button
                      className={`btn btn-sm ${user.isActive ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => handleToggleActive(user._id, user.isActive)}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Title</th>
                <th>Organizer</th>
                <th>Date</th>
                <th>Slots Left</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {events.map(event => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{event.organizer?.name}</td>
                  <td>{new Date(event.date).toLocaleDateString()}</td>
                  <td>{event.slotsRemaining}/{event.slots}</td>
                  <td>{getStatusBadge(event.status)}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteEvent(event._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registrations Tab */}
      {activeTab === 'registrations' && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => (
                <tr key={reg._id}>
                  <td>{reg.user?.name}</td>
                  <td>{reg.user?.email}</td>
                  <td>{reg.event?.title}</td>
                  <td>{new Date(reg.event?.date).toLocaleDateString()}</td>
                  <td><span className="badge bg-success">{reg.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;