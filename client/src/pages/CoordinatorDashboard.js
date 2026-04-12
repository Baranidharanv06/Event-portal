import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function CoordinatorDashboard() {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingEvents();
    fetchCategories();
  }, []);

  const fetchPendingEvents = async () => {
    try {
      const res = await fetch('http://localhost:5001/api/events/coordinator/pending', { credentials: 'include' });
      if (res.status === 401) { navigate('/login'); return; }
      if (res.status === 403) { navigate('/events'); return; }
      const data = await res.json();
      setPendingEvents(data);
      setLoading(false);
    } catch (err) {
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

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:5001/api/events/${id}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      setMessage(data.message);
      setPendingEvents(pendingEvents.filter(e => e._id !== id));
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason) { setError('Please enter a rejection reason'); return; }
    try {
      const res = await fetch(`http://localhost:5001/api/events/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: rejectReason })
      });
      const data = await res.json();
      setMessage(data.message);
      setPendingEvents(pendingEvents.filter(e => e._id !== id));
      setShowRejectInput(null);
      setRejectReason('');
    } catch (err) {
      setError('Something went wrong');
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory) { setError('Category name is required'); return; }
    try {
      const res = await fetch('http://localhost:5001/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newCategory, description: newCategoryDesc })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Category added');
        setNewCategory('');
        setNewCategoryDesc('');
        fetchCategories();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(`http://localhost:5001/api/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      setMessage(data.message);
      setCategories(categories.filter(c => c._id !== id));
    } catch (err) {
      setError('Something went wrong');
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border" /></div>;

  return (
    <div>
      <h2 className="mb-4">Coordinator Dashboard</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'pending' ? 'active' : ''}`} onClick={() => setActiveTab('pending')}>
            Pending Events {pendingEvents.length > 0 && <span className="badge bg-danger ms-1">{pendingEvents.length}</span>}
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
            Manage Categories
          </button>
        </li>
      </ul>

      {/* Pending Events Tab */}
      {activeTab === 'pending' && (
        <div>
          <h4 className="mb-3">Events Waiting for Approval</h4>
          {pendingEvents.length === 0 ? (
            <div className="alert alert-info">No pending events.</div>
          ) : pendingEvents.map(event => (
            <div className="card mb-3 p-3" key={event._id}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <h5>{event.title}</h5>
                  <p className="mb-1"><strong>Organizer:</strong> {event.organizer?.name} — {event.organizer?.email}</p>
                  <p className="mb-1"><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Deadline:</strong> {new Date(event.deadline).toLocaleDateString()}</p>
                  <p className="mb-1"><strong>Venue:</strong> {event.venue}</p>
                  <p className="mb-1"><strong>Slots:</strong> {event.slots}</p>
                  <p className="mb-1"><strong>Category:</strong> {event.category?.name || 'None'}</p>
                  <p className="mb-2"><strong>Description:</strong> {event.description}</p>
                  {showRejectInput === event._id && (
                    <div className="mb-2">
                      <input
                        type="text"
                        className="form-control mb-2"
                        placeholder="Enter rejection reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                      <button className="btn btn-sm btn-danger me-2" onClick={() => handleReject(event._id)}>
                        Confirm Reject
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setShowRejectInput(null)}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                <div className="d-flex flex-column gap-2">
                  <button className="btn btn-success btn-sm" onClick={() => handleApprove(event._id)}>
                    Approve
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => setShowRejectInput(event._id)}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <h4 className="mb-3">Manage Categories</h4>
          <div className="card p-3 mb-4">
            <h6 className="mb-3">Add New Category</h6>
            <form onSubmit={handleAddCategory}>
              <div className="row">
                <div className="col-md-4 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Category name"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Description (optional)"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                  />
                </div>
                <div className="col-md-2 mb-2">
                  <button type="submit" className="btn btn-dark w-100">Add</button>
                </div>
              </div>
            </form>
          </div>
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan="3" className="text-center">No categories yet</td></tr>
              ) : categories.map(cat => (
                <tr key={cat._id}>
                  <td>{cat.name}</td>
                  <td>{cat.description || '—'}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCategory(cat._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CoordinatorDashboard;