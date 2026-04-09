import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/registrations/my', {
        credentials: 'include'
      });
      if (res.status === 401) {
        navigate('/login');
        return;
      }
      const data = await res.json();
      setRegistrations(data);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to load registrations');
      setLoading(false);
    }
  };

  const handleCancel = async (regId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/registrations/${regId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      setMessage(data.message);
      // Remove from UI without refetching
      setRegistrations(registrations.filter(r => r._id !== regId));
    } catch (err) {
      setMessage('Something went wrong');
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"/></div>;

  return (
    <div>
      <h2 className="mb-4">My Registrations</h2>
      {message && <div className="alert alert-info">{message}</div>}
      {registrations.length === 0 ? (
        <div className="alert alert-warning">
          You have not registered for any events yet.
        </div>
      ) : (
        <div className="row">
          {registrations.map(reg => (
            <div className="col-md-4 mb-4" key={reg._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{reg.event?.title}</h5>
                  <p className="mb-1">
                    <strong>Date:</strong> {new Date(reg.event?.date).toLocaleDateString()}
                  </p>
                  <p className="mb-1">
                    <strong>Venue:</strong> {reg.event?.venue}
                  </p>
                  <p className="mb-3">
                    <strong>Status:</strong>{' '}
                    <span className="badge bg-success">{reg.status}</span>
                  </p>
                  <button
                    className="btn btn-danger w-100"
                    onClick={() => handleCancel(reg._id)}
                  >
                    Cancel Registration
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

export default MyRegistrations;
