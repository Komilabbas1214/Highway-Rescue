import React, { useState, useEffect } from 'react';

const IncomingOfferModal = ({ offers, onAccept, onReject, onExpire, soundEnabled, onEnableSound }) => {
  const [timeLeft, setTimeLeft] = useState(60);

  const currentOffer = offers && offers.length > 0 ? offers[0] : null;

  useEffect(() => {
    if (!currentOffer) return;

    // Reset countdown for each new top offer
    const totalDuration = currentOffer.timeoutSeconds || 60;
    setTimeLeft(totalDuration);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onExpire) onExpire(currentOffer.bookingId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentOffer?.bookingId]);

  if (!currentOffer) return null;

  const totalDuration = currentOffer.timeoutSeconds || 60;
  const progressPercent = Math.max(0, Math.min(100, (timeLeft / totalDuration) * 100));
  const estimatedPayout = Math.round((currentOffer.estimatedCost || 400) * 0.9);

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: 'rgba(11, 30, 54, 0.85)',
        zIndex: 1090,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header */}
          <div
            className={`py-3 px-4 text-white d-flex align-items-center justify-content-between ${
              currentOffer.isEmergency ? 'bg-danger' : 'bg-navy-rescue'
            }`}
            style={{ backgroundColor: currentOffer.isEmergency ? '#dc3545' : '#0b1e36' }}
          >
            <div className="d-flex align-items-center gap-2">
              <span className="spinner-grow spinner-grow-sm text-warning" role="status"></span>
              <h5 className="modal-title fw-bold text-white mb-0">
                {currentOffer.isEmergency ? '🚨 PRIORITY EMERGENCY DISPATCH' : '⚡ INCOMING SERVICE REQUEST'}
              </h5>
            </div>
            {offers.length > 1 && (
              <span className="badge bg-warning text-dark fw-bold">
                1 of {offers.length} in queue
              </span>
            )}
          </div>

          {/* Progress Countdown Bar */}
          <div className="progress" style={{ height: '5px', borderRadius: 0 }}>
            <div
              className={`progress-bar ${progressPercent < 25 ? 'bg-danger' : progressPercent < 50 ? 'bg-warning' : 'bg-success'}`}
              role="progressbar"
              style={{
                width: `${progressPercent}%`,
                transition: 'width 1s linear',
              }}
            ></div>
          </div>

          <div className="modal-body p-4">
            {/* Audio Autoplay Alert Banner */}
            {!soundEnabled && (
              <div
                className="alert alert-warning py-2 px-3 mb-3 d-flex align-items-center justify-content-between rounded-3 border-warning"
                style={{ cursor: 'pointer' }}
                onClick={onEnableSound}
              >
                <div className="d-flex align-items-center gap-2 small">
                  <i className="bi bi-volume-mute-fill fs-5 text-warning"></i>
                  <span>Sound alerts muted by browser autoplay policy.</span>
                </div>
                <button
                  type="button"
                  className="btn btn-warning btn-sm fw-bold px-3 py-1"
                  onClick={onEnableSound}
                >
                  Enable Sound
                </button>
              </div>
            )}

            {/* Service & Distance Hero Card */}
            <div className="card bg-light border-0 p-3 mb-3 rounded-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <span className="badge bg-primary mb-1">
                    <i className="bi bi-tools me-1"></i> {currentOffer.serviceType}
                  </span>
                  <h4 className="fw-bold text-dark mb-0">{currentOffer.serviceType}</h4>
                  <small className="text-muted">Vehicle Type: {currentOffer.vehicleType}</small>
                </div>
                {currentOffer.distanceKm !== undefined && (
                  <div className="text-end">
                    <span className="badge bg-danger fs-6 px-3 py-2 rounded-pill">
                      <i className="bi bi-geo-alt-fill me-1"></i> {currentOffer.distanceKm} km
                    </span>
                    <small className="text-muted d-block mt-1">Approx. Distance</small>
                  </div>
                )}
              </div>

              <div className="border-top pt-2 mt-2">
                <div className="d-flex align-items-center gap-2 text-dark small mb-1">
                  <i className="bi bi-pin-map-fill text-danger"></i>
                  <strong>Approximate Location:</strong>
                  <span className="text-truncate">{currentOffer.approximateLocation}</span>
                </div>
                <div className="d-flex align-items-center gap-2 text-muted small">
                  <i className="bi bi-chat-left-text-fill text-primary"></i>
                  <span>Problem: {currentOffer.problemDescription}</span>
                </div>
              </div>
            </div>

            {/* Estimated Earnings Card (10% platform commission breakdown) */}
            <div className="row g-2 mb-3">
              <div className="col-6">
                <div className="card p-2 bg-white border text-center rounded-3">
                  <span className="text-muted small">Estimated Bill</span>
                  <strong className="fs-5 text-dark">₹{currentOffer.estimatedCost || 400}</strong>
                </div>
              </div>
              <div className="col-6">
                <div className="card p-2 bg-success bg-opacity-10 border-success text-center rounded-3">
                  <span className="text-success small fw-semibold">Net Payout (90%)</span>
                  <strong className="fs-5 text-success">₹{estimatedPayout}</strong>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center text-muted small px-1">
              <span>
                <i className="bi bi-shield-check text-success me-1"></i> Customer details reveal upon acceptance
              </span>
              <span className={`fw-bold ${timeLeft <= 10 ? 'text-danger' : 'text-primary'}`}>
                <i className="bi bi-stopwatch me-1"></i> {timeLeft}s remaining
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-footer bg-light p-3 d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-danger rounded-pill px-4 fw-semibold"
              onClick={() => onReject(currentOffer.bookingId)}
            >
              <i className="bi bi-x-circle me-1"></i> Decline
            </button>
            <button
              type="button"
              className="btn btn-success rounded-pill px-5 flex-grow-1 fw-bold fs-6 py-2 shadow-sm"
              onClick={() => onAccept(currentOffer.bookingId)}
            >
              <i className="bi bi-check2-circle me-1"></i> Accept Booking Request
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomingOfferModal;
