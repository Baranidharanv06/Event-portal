import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Events() {
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/events', {
        credentials: 'include'
      });
      const data = await res.json();
      setEvents(data);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to load events');
      setLoading(false);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/registrations/${eventId}`, {
        method: 'POST',
        credentials: 'include'
      });
      const data = await res.json();
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      setMessage(data.message);
    } catch (err) {
      setMessage('Something went wrong');
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"/></div>;

  return (
    <div>
      <h2 className="mb-4">Upcoming Events</h2>
      {message && <div className="alert alert-info">{message}</div>}
      {events.length === 0 ? (
        <div className="alert alert-warning">No events found. Add some from the admin panel.</div>
      ) : (
        <div className="row">
          {events.map(event => (
            <div className="col-md-4 mb-4" key={event._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{event.title}</h5>
                  <p className="card-text text-muted">{event.description}</p>
                  <p className="mb-1"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Venue:</strong> {event.venue}</p>
                  <p className="mb-3"><strong>Slots:</strong> {event.slots}</p>
                  <button
                    className="btn btn-dark w-100"
                    onClick={() => handleRegister(event._id)}
                  >
                    Register
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Events;
