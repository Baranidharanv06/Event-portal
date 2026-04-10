import React, { useState, useEffect } from 'react';

function Admin() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [slots, setSlots] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const res = await fetch('http://localhost:5001/api/events', {
      credentials: 'include'
    });
    const data = await res.json();
    setEvents(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || !date || !venue || !slots) {
      setError('All fields are required');
      return;
    }
    if (slots < 1) {
      setError('Slots must be at least 1');
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description, date, venue, slots: Number(slots) })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Event created successfully');
        setTitle(''); setDescription(''); setDate(''); setVenue(''); setSlots('');
        fetchEvents();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error. Try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
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

  return (
    <div>
      <h2 className="mb-4">Admin Panel</h2>
      {message && <div className="alert alert-success">{message}</div>}

      <div className="card shadow p-4 mb-5">
        <h4 className="mb-3">Create New Event</h4>
        {error && <div className="alert alert-danger">{error}</div>}
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
            <div className="col-md-6 mb-3">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date}
                onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Slots</label>
              <input type="number" className="form-control" value={slots}
                onChange={(e) => setSlots(e.target.value)} placeholder="Number of slots" />
            </div>
            <div className="col-12 mb-3">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event description" rows={3} />
            </div>
          </div>
          <button type="submit" className="btn btn-dark">Create Event</button>
        </form>
      </div>

      <h4 className="mb-3">All Events</h4>
      <div className="table-responsive">
        <table className="table table-bordered table-hover">
          <thead className="table-dark">
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Venue</th>
              <th>Slots</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map(event => (
              <tr key={event._id}>
                <td>{event.title}</td>
                <td>{new Date(event.date).toLocaleDateString()}</td>
                <td>{event.venue}</td>
                <td>{event.slots}</td>
                <td>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(event._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Admin;