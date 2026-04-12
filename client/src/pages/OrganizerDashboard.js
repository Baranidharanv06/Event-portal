import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function OrganizerDashboard() {
  const [events, setEvents] = useState([]);
  const [lateRequests, setLateRequests] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('events');
  const [categories, setCategories] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(null);

  // Create event form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [venue, setVenue] = useState('');
  const [slots, setSlots] = useState('');
  const [category, setCategory] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchMyEvents();
    fetchLateRequests();
    fetchCategories();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/events/organizer/my', { credentials: 'include' });
      if (res.status === 401) { navigate('/login'); return; }
      if (res.status === 403) { navigate('/events'); return; }
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const fetchLateRequests = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/late-requests/organizer/pending', { credentials: 'include' });
      const data = await res.json();
      setLateRequests(data);
    } catch (err) {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/categories', { credentials: 'include' });
      const data = await res.json();
      setCategories(data);
    } catch (err) {}
  };

  const fetchAttendees = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/events/${eventId}/attendees`, { credentials: 'include' });
      const data = await res.json();
      setAttendees(data);
      setSelectedEvent(eventId);
      setActiveTab('attendees');
    } catch (err) {}
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    if (!title || !date || !deadline || !venue || !slots) {
      setError('All fields are required');
      return;
    }
    if (new Date(deadline) >= new Date(date)) {
      setError('Deadline must be before event date');
      return;
    }
    try {
      const res = await fetch('http://localhost:5001/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description, date, deadline, venue, slots: Number(slots), category })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Event submitted for coordinator approval');
        setTitle(''); setDescription(''); setDate(''); setDeadline('');
        setVenue(''); setSlots(''); setCategory('');
        fetchMyEvents();
        setActiveTab('events');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error');
    }
  };

  const handleDelete = async (id) => {
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

  const handleRemoveAttendee = async (regId) => {
    if (!window.confirm('Remove this attendee?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/registrations/attendee/${regId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      setMessage(data.message);
      setAttendees(attendees.filter(a => a._id !== regId));
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const handleApproveLate = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/late-requests/${id}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      setMessage(data.message);
      setLateRequests(lateRequests.filter(r => r._id !== id));
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const handleRejectLate = async (id) => {
    if (!rejectReason) { setError('Please enter a rejection reason'); return; }
    try {
      const res = await fetch(`http://localhost:5001/api/late-requests/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      setMessage(data.message);
      setLateRequests(lateRequests.filter(r => r._id !== id));
      setShowRejectInput(null);
      setRejectReason('');
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'pending') return <span className="badge bg-warning">Pending Approval</span>;
    if (status === 'approved') return <span className="badge bg-success">Approved</span>;
    if (status === 'rejected') return <span className="badge bg-danger">Rejected</span>;
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

  return (
    <div>
      <h2 className="mb-4">Organizer Dashboard</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
            My Events ({events.length})
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            Create Event
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'late' ? 'active' : ''}`} onClick={() => setActiveTab('late')}>
            Late Requests {lateRequests.length > 0 && <span className="badge bg-danger ms-1">{lateRequests.length}</span>}
          </button>
        </li>
        {selectedEvent && (
          <li className="nav-item">
            <button className={`nav-link ${activeTab === 'attendees' ? 'active' : ''}`} onClick={() => setActiveTab('attendees')}>
              Attendees ({attendees.length})
            </button>
          </li>
        )}
      </ul>

      {/* My Events Tab */}
      {activeTab === 'events' && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Title</th>
                <th>Date</th>
                <th>Deadline</th>
                <th>Venue</th>
                <th>Slots Left</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan="7" className="text-center">No events yet</td></tr>
              ) : events.map(event => (
                <tr key={event._id}>
                  <td>{event.title}</td>
                  <td>{new Date(event.date).toLocaleDateString()}</td>
                  <td>{new Date(event.deadline).toLocaleDateString()}</td>
                  <td>{event.venue}</td>
                  <td>{event.slotsRemaining}/{event.slots}</td>
                  <td>{getStatusBadge(event.status)}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-info" onClick={() => fetchAttendees(event._id)}>
                        Attendees
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(event._id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Event Tab */}
      {activeTab === 'create' && (
        <div className="card p-4">
          <h4 className="mb-3">Create New Event</h4>
          <form onSubmit={handleCreate}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Title</label>
                <input type="text" className="form-control" value={title}
                  onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Venue</label>
                <input type="text" className="form-control" value={venue}
                  onChange={(e) => setVenue(e.target.value)} placeholder="Event venue" />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Event Date</label>
                <input type="date" className="form-control" value={date}
                  onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Registration Deadline</label>
                <input type="date" className="form-control" value={deadline}
                  onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div className="col-md-4 mb-3">
                <label className="form-label">Slots</label>
                <input type="number" className="form-control" value={slots}
                  onChange={(e) => setSlots(e.target.value)} placeholder="Number of slots" />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control" value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Event description" rows={3} />
              </div>
            </div>
            <button type="submit" className="btn btn-dark">Submit for Approval</button>
          </form>
        </div>
      )}

      {/* Late Requests Tab */}
      {activeTab === 'late' && (
        <div>
          <h4 className="mb-3">Pending Late Registration Requests</h4>
          {lateRequests.length === 0 ? (
            <div className="alert alert-info">No pending late requests.</div>
          ) : lateRequests.map(req => (
            <div className="card mb-3 p-3" key={req._id}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h6>{req.user?.name} — <small className="text-muted">{req.user?.email}</small></h6>
                  <p className="mb-1"><strong>Event:</strong> {req.event?.title}</p>
                  <p className="mb-1"><strong>Department:</strong> {req.user?.department || 'N/A'}</p>
                  <p className="mb-2"><strong>Reason:</strong> {req.reason}</p>
                  {showRejectInput === req._id && (
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Enter rejection reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button className="btn btn-sm btn-danger me-2" onClick={() => handleRejectLate(req._id)}>
                        Confirm Reject
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowRejectInput(null)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-success btn-sm" onClick={() => handleApproveLate(req._id)}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowRejectInput(req._id)}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Attendees Tab */}
      {activeTab === 'attendees' && (
        <div>
          <h4 className="mb-3">Attendees</h4>
          {attendees.length === 0 ? (
            <div className="alert alert-info">No attendees yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map(att => (
                    <tr key={att._id}>
                      <td>{att.user?.name}</td>
                      <td>{att.user?.email}</td>
                      <td>{att.user?.department || 'N/A'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleRemoveAttendee(att._id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default OrganizerDashboard;