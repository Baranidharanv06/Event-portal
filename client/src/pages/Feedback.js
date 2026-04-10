import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function Feedback() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!comment || !rating) {
      setError('All fields are required');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Rating must be between 1 and 5');
      return;
    }

    try {
      const res = await fetch('http://localhost:5001/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ eventId, comment, rating: Number(rating) })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Feedback submitted successfully!');
        setTimeout(() => navigate('/events'), 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Server error. Try again.');
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <div className="card shadow p-4 mt-5">
          <h3 className="mb-4 text-center">Give Feedback</h3>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-danger">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Rating (1-5)</label>
              <input
                type="number"
                className="form-control"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                placeholder="Enter rating between 1 and 5"
                min="1"
                max="5"
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Comment</label>
              <textarea
                className="form-control"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your feedback here"
                rows={4}
              />
            </div>
            <button type="submit" className="btn btn-dark w-100">Submit Feedback</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Feedback;