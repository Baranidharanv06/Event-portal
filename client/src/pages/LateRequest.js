import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function LateRequest() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvent();
  }, []);

  const fetchEvent = async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/events/${eventId}`, {
        credentials: 'include'
      });
      const data = await res.json();
      setEvent(data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Please provide a reason for late registration');
      return;
    }
    if (reason.length < 20) {
      setError('Reason must be at least 20 characters');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5001/api/late-requests/${eventId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Request submitted successfully! You will be notified once reviewed.');
        setTimeout(() => navigate('/my-registrations'), 2500);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error. Try again.');
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow p-4 mt-4">
          <h3 className="mb-2">Late Registration Request</h3>
          {event && (
            <div className="alert alert-secondary mb-4">
              <strong>{event.title}</strong><br />
              <small>Date: {new Date(event.date).toLocaleDateString()} | Venue: {event.venue}</small><br />
              <small className="text-danger">Deadline passed: {new Date(event.deadline).toLocaleDateString()}</small>
            </div>
          )}
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Why do you want to register late?</label>
              <textarea
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain your reason (minimum 20 characters)..."
                rows={5}
              />
              <small className="text-muted">{reason.length} characters</small>
            </div>
            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-dark w-100">Submit Request</button>
              <button type="button" className="btn btn-outline-secondary w-100" onClick={() => navigate('/events')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LateRequest;
