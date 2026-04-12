import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Events({ user }) {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchCategories();
  }, []);

  const fetchEvents = async (searchVal = '', categoryVal = '') => {
    try {
      let url = 'http://localhost:5001/api/events?';
      if (searchVal) url += `search=${searchVal}&`;
      if (categoryVal) url += `category=${categoryVal}`;
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to load events');
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/categories', { credentials: 'include' });
      const data = await res.json();
      setCategories(data);
    } catch (err) {}
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    fetchEvents(e.target.value, selectedCategory);
  };

  const handleCategoryFilter = (e) => {
    setSelectedCategory(e.target.value);
    fetchEvents(search, e.target.value);
  };

  const handleRegister = async (eventId) => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await fetch(`http://localhost:5001/api/registrations/${eventId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.status === 401) { navigate('/login'); return; }
      setMessage(data.message);
      fetchEvents(search, selectedCategory);
    } catch (err) {
      setMessage('Something went wrong');
    }
  };

  const handleLateRequest = (eventId) => {
    if (!user) { navigate('/login'); return; }
    navigate(`/late-request/${eventId}`);
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const deadline = new Date(event.deadline);
    if (event.slotsRemaining <= 0 && now <= deadline) return 'full';
    if (now > deadline) return 'deadline-passed';
    return 'open';
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

  return (
    <div>
      <h2 className="mb-4">Upcoming Events</h2>

      {/* Search and Filter */}
      <div className="row mb-4">
        <div className="col-md-6 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search events..."
            value={search}
            onChange={handleSearch}
          />
        </div>
        <div className="col-md-4 mb-2">
          <select className="form-select" value={selectedCategory} onChange={handleCategoryFilter}>
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="col-md-2 mb-2">
          <button className="btn btn-outline-dark w-100" onClick={() => { setSearch(''); setSelectedCategory(''); fetchEvents(); }}>
            Clear
          </button>
        </div>
      </div>

      {message && <div className="alert alert-info">{message}</div>}

      {events.length === 0 ? (
        <div className="alert alert-warning">No events found.</div>
      ) : (
        <div className="row">
          {events.map(event => {
            const status = getEventStatus(event);
            return (
              <div className="col-md-4 mb-4" key={event._id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title mb-0">{event.title}</h5>
                      {event.category && (
                        <span className="badge bg-secondary">{event.category.name}</span>
                      )}
                    </div>
                    <p className="card-text text-muted small">{event.description}</p>
                    <p className="mb-1"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                    <p className="mb-1"><strong>Deadline:</strong> {new Date(event.deadline).toLocaleDateString()}</p>
                    <p className="mb-1"><strong>Venue:</strong> {event.venue}</p>
                    <p className="mb-1"><strong>Organizer:</strong> {event.organizer?.name}</p>
                    <p className="mb-3">
                      <strong>Slots:</strong>{' '}
                      {status === 'full'
                        ? <span className="text-danger">Full</span>
                        : <span className="text-success">{event.slotsRemaining} remaining</span>
                      }
                    </p>

                    {status === 'open' && (
                      <button className="btn btn-dark w-100" onClick={() => handleRegister(event._id)}>
                        Register
                      </button>
                    )}
                    {status === 'full' && (
                      <button className="btn btn-warning w-100" onClick={() => handleRegister(event._id)}>
                        Join Waitlist
                      </button>
                    )}
                    {status === 'deadline-passed' && (
                      <button className="btn btn-outline-danger w-100" onClick={() => handleLateRequest(event._id)}>
                        Request Late Registration
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Events;