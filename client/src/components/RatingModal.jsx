import React, { useState } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const RatingModal = ({ show, onClose, booking, onReviewSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!show || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment,
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Review submitted successfully!');
        if (onReviewSubmitted) onReviewSubmitted(res.data.review);
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-navy-rescue text-white py-3" style={{ backgroundColor: '#0b1e36' }}>
            <h5 className="modal-title fw-bold text-white mb-0">
              <i className="bi bi-star-fill text-warning me-2"></i> Rate Roadside Assistance
            </h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 text-center">
              <div className="mb-3">
                <span className="badge bg-light text-dark border p-2 mb-2">
                  Booking #{booking.bookingId} • {booking.serviceType}
                </span>
                <h5 className="fw-bold mb-1">{booking.mechanic?.shopName || 'Mechanic Service'}</h5>
                <p className="text-muted small">How was your roadside assistance experience?</p>
              </div>

              {/* Star Rating Selector */}
              <div className="d-flex justify-content-center gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    className="btn btn-link p-1 text-decoration-none border-0"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    style={{ fontSize: '2.4rem', color: (hoverRating || rating) >= star ? '#f59e0b' : '#cbd5e1' }}
                  >
                    <i className="bi bi-star-fill"></i>
                  </button>
                ))}
              </div>
              <div className="fw-bold text-warning mb-3">
                {rating === 5 && 'Outstanding & Quick Service! ⭐⭐⭐⭐⭐'}
                {rating === 4 && 'Very Good Assistance ⭐⭐⭐⭐'}
                {rating === 3 && 'Average Experience ⭐⭐⭐'}
                {rating === 2 && 'Below Expectation ⭐⭐'}
                {rating === 1 && 'Unsatisfactory ⭐'}
              </div>

              {/* Feedback comment */}
              <div className="text-start mb-3">
                <label className="form-label fw-bold small text-muted">Feedback Comments (Optional)</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Share details about the mechanic's arrival time, technical expertise, and professionalism..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary-rescue rounded-pill px-5 fw-bold"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
