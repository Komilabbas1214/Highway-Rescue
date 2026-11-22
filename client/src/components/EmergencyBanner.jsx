import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const EmergencyBanner = ({ onEmergencyRequestClick }) => {
  const [confirmCallModal, setConfirmCallModal] = useState({ show: false, number: '', title: '', desc: '' });

  const handleInitiateCall = (number, title, desc) => {
    // User confirmation required before initiating dialer
    setConfirmCallModal({
      show: true,
      number,
      title,
      desc,
    });
  };

  const confirmCall = () => {
    window.location.href = `tel:${confirmCallModal.number}`;
    setConfirmCallModal({ show: false, number: '', title: '', desc: '' });
  };

  return (
    <div className="card rescue-card border-danger border-2 shadow-sm my-4 overflow-hidden">
      {/* Header bar */}
      <div className="bg-danger text-white px-4 py-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="badge bg-white text-danger fs-6 p-2 rounded-circle">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </span>
          <div>
            <h5 className="mb-0 text-white fw-bold">Emergency Assistance System</h5>
            <small className="text-white-50">Official Government Helplines & Priority Highway Roadside Support</small>
          </div>
        </div>
        <span className="badge bg-warning text-dark fw-bold px-3 py-2">
          <i className="bi bi-clock-history me-1"></i> Available 24 Hours / 365 Days
        </span>
      </div>

      <div className="card-body p-4">
        {/* Critical Safety Notice */}
        <div className="alert alert-warning border-warning d-flex align-items-start gap-3 mb-4 rounded-3">
          <i className="bi bi-cone-striped fs-3 text-warning"></i>
          <div>
            <strong className="text-dark">High-Priority Highway Safety Protocol:</strong>
            <p className="mb-0 text-dark small mt-1">
              If your vehicle has broken down on a highway lane or active traffic corridor:
              <strong> Immediately steer/move your vehicle onto the highway left shoulder or safe breakdown bay</strong> if possible.
              Turn on your vehicle’s <strong>hazard lights (double indicators)</strong>, place the reflective warning triangle 50 meters behind your vehicle, and <strong>step out behind the metal crash barrier</strong> away from high-speed traffic.
            </p>
          </div>
        </div>

        {/* 2 Main Official Helpline Cards */}
        <div className="row g-3 mb-4">
          {/* 112 ERSS */}
          <div className="col-md-6">
            <div className="p-4 rounded-3 h-100 border border-danger bg-danger bg-opacity-10 d-flex flex-column justify-content-between position-relative">
              <span className="position-absolute top-0 end-0 bg-danger text-white text-uppercase px-2 py-1 rounded-bottom-start small fw-bold" style={{ fontSize: '0.7rem' }}>
                Primary Integrated Helpline
              </span>
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-danger text-white fs-5 px-3 py-2 rounded-pill">
                    112
                  </span>
                  <div>
                    <h5 className="mb-0 fw-bold text-danger">National Emergency Response (ERSS)</h5>
                    <small className="text-muted">Single Pan-India Integrated Helpline</small>
                  </div>
                </div>
                <p className="small text-muted mb-3">
                  <strong>Dial 112</strong> for immediate government emergency response covering <strong>Police, Fire Department, and Ambulance</strong>. 
                  This is India’s unified equivalent to 911 / 999 and operates 24x7 with GPS-tracked police interceptors.
                </p>
              </div>
              <button
                className="btn btn-danger btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={() => handleInitiateCall('112', '112 - National Emergency (ERSS)', 'You are about to dial India’s official National Emergency Response Support System for Police, Fire, or Medical emergencies.')}
              >
                <i className="bi bi-telephone-fill"></i> Call 112 Now
              </button>
            </div>
          </div>

          {/* 100 Police Helpline */}
          <div className="col-md-6">
            <div className="p-4 rounded-3 h-100 border border-secondary bg-light d-flex flex-column justify-content-between position-relative">
              <span className="position-absolute top-0 end-0 bg-secondary text-white text-uppercase px-2 py-1 rounded-bottom-start small fw-bold" style={{ fontSize: '0.7rem' }}>
                Police Direct Helpline
              </span>
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-dark text-white fs-5 px-3 py-2 rounded-pill">
                    100
                  </span>
                  <div>
                    <h5 className="mb-0 fw-bold text-dark">Police Emergency Helpline</h5>
                    <small className="text-muted">Direct State Police Control Room</small>
                  </div>
                </div>
                <p className="small text-muted mb-3">
                  <strong>Dial 100</strong> for direct police assistance regarding highway crime, harassment, collisions, or roadblocks. 
                  <em> Note: 112 is the primary national integrated number, but 100 remains directly functional across Gujarat and India.</em>
                </p>
              </div>
              <button
                className="btn btn-dark btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={() => handleInitiateCall('100', '100 - Police Helpline', 'You are about to dial the official State Police Emergency Control Room.')}
              >
                <i className="bi bi-shield-shaded"></i> Call 100 Now
              </button>
            </div>
          </div>
        </div>

        {/* Private Roadside Assistance Distinction Banner */}
        <div className="p-3 rounded-3 border bg-light d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
          <div className="d-flex align-items-start gap-3">
            <div className="p-2 rounded-circle bg-warning bg-opacity-25 text-warning-emphasis">
              <i className="bi bi-wrench-adjustable-circle fs-3 text-warning"></i>
            </div>
            <div>
              <h6 className="mb-1 fw-bold text-dark">
                Vehicle Breakdown Only? Request Highway Rescue Priority Mechanic
              </h6>
              <p className="mb-0 text-muted small">
                <strong>Important Distinction:</strong> Official 112/100 numbers are for life safety, police, and medical emergencies.
                For mechanical failure, tyre blowout, towing, dead battery, or empty fuel, use Highway Rescue's private roadside dispatch network.
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            {onEmergencyRequestClick ? (
              <button
                className="btn btn-primary-rescue fw-bold d-flex align-items-center gap-2"
                onClick={onEmergencyRequestClick}
              >
                <i className="bi bi-lightning-charge-fill"></i> Priority Roadside Dispatch
              </button>
            ) : (
              <Link to="/nearby?priority=emergency" className="btn btn-primary-rescue fw-bold d-flex align-items-center gap-2">
                <i className="bi bi-lightning-charge-fill"></i> Priority Roadside Dispatch
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal to ensure no accidental calls */}
      {confirmCallModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-telephone-outbound-fill me-2"></i> Confirm Emergency Call
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setConfirmCallModal({ show: false, number: '', title: '', desc: '' })}
                ></button>
              </div>
              <div className="modal-body p-4">
                <h6 className="fw-bold text-danger mb-2">{confirmCallModal.title}</h6>
                <p className="text-muted small mb-3">{confirmCallModal.desc}</p>
                <div className="alert alert-secondary small mb-0">
                  <i className="bi bi-info-circle me-1"></i> Highway Rescue does not automatically initiate calls without user confirmation. Clicking Proceed will open your device dialer for <strong>{confirmCallModal.number}</strong>.
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={() => setConfirmCallModal({ show: false, number: '', title: '', desc: '' })}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger rounded-pill px-4 fw-bold"
                  onClick={confirmCall}
                >
                  <i className="bi bi-telephone-fill me-1"></i> Proceed to Call {confirmCallModal.number}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyBanner;
