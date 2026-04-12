import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MyRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [lateRequests, setLateRequests] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [regRes, waitRes, lateRes] = await Promise.all([
        fetch('http://localhost:5001/api/registrations/my', { credentials: 'include' }),
        fetch('http://localhost:5001/api/registrations/my/waitlist', { credentials: 'include' }),
        fetch('http://localhost:5001/api/late-requests/my', { credentials: 'include' })
      ]);
      const [regData, waitData, lateData] = await Promise.all([
        regRes.json(), waitRes.json(), lateRes.json()
      ]);
      if (regRes.status === 401) { navigate('/login'); return; }
      setRegistrations(regData);
      setWaitlist(waitData);
      setLateRequests(lateData);
      setLoading(false);
    } catch (err) {
      setMessage('Failed to load data');
      setLoading(false);
    }
  };

  const handleCancel = async (regId, eventId) => {
    try {
      const res = await fetch(`http://localhost:5001/api/registrations/${regId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      setMessage(data.message);
      setRegistrations(registrations.filter(r => r._id !== regId));
    } catch (err) {
      setMessage('Something went wrong');
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
      <h2 className="mb-4">My Registrations</h2>
      {message && <div className="alert alert-info">{message}</div>}

      {/* Registered Events */}
      <h4 className="mb-3">Registered Events</h4>
      {registrations.length === 0 ? (
        <div className="alert alert-warning mb-4">No registrations yet.</div>
      ) : (
        <div className="row mb-4">
          {registrations.map(reg => (
            <div className="col-md-4 mb-4" key={reg._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{reg.event?.title}</h5>
                  <p className="mb-1"><strong>Date:</strong> {new Date(reg.event?.date).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Venue:</strong> {reg.event?.venue}</p>
                  <p className="mb-3">
                    <strong>Status:</strong>{' '}
                    <span className="badge bg-success">{reg.status}</span>
                  </p>
                  <div className="d-flex gap-2">
                    <button className="btn btn-danger w-100" onClick={() => handleCancel(reg._id, reg.event?._id)}>
                      Cancel
                    </button>
                    <button className="btn btn-outline-dark w-100" onClick={() => navigate(`/feedback/${reg.event?._id}`)}>
                      Feedback
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Waitlist */}
      <h4 className="mb-3">My Waitlist</h4>
      {waitlist.length === 0 ? (
        <div className="alert alert-warning mb-4">Not on any waitlist.</div>
      ) : (
        <div className="row mb-4">
          {waitlist.map(w => (
            <div className="col-md-4 mb-4" key={w._id}>
              <div className="card h-100 shadow-sm border-warning">
                <div className="card-body">
                  <h5 className="card-title">{w.event?.title}</h5>
                  <p className="mb-1"><strong>Date:</strong> {new Date(w.event?.date).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Venue:</strong> {w.event?.venue}</p>
                  <p className="mb-0">
                    <strong>Waitlist Position:</strong>{' '}
                    <span className="badge bg-warning text-dark">#{w.position}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Late Requests */}
      <h4 className="mb-3">Late Registration Requests</h4>
      {lateRequests.length === 0 ? (
        <div className="alert alert-warning">No late requests submitted.</div>
      ) : (
        <div className="row">
          {lateRequests.map(req => (
            <div className="col-md-4 mb-4" key={req._id}>
              <div className="card h-100 shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">{req.event?.title}</h5>
                  <p className="mb-1"><strong>Date:</strong> {new Date(req.event?.date).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Venue:</strong> {req.event?.venue}</p>
                  <p className="mb-1"><strong>Reason:</strong> {req.reason}</p>
                  <p className="mb-1"><strong>Status:</strong> {getStatusBadge(req.status)}</p>
                  {req.status === 'rejected' && req.rejectionReason && (
                    <p className="mb-0 text-danger"><strong>Rejection reason:</strong> {req.rejectionReason}</p>
                  )}
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