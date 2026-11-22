import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';

const EmergencyPage = () => {
  const navigate = useNavigate();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ show: false, number: '', title: '' });

  const initiateCall = (number, title) => {
    setConfirmModal({ show: true, number, title });
  };

  const handleConfirmCall = () => {
    window.location.href = `tel:${confirmModal.number}`;
    setConfirmModal({ show: false, number: '', title: '' });
  };

  return (
    <div className="py-5" style={{ backgroundColor: '#fff5f5' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="badge bg-danger text-white fw-bold px-3 py-1 rounded-pill mb-2">
            Official Indian Emergency Help & Safety
          </span>
          <h1 className="fw-bold text-danger display-5">Emergency Assistance Protocol</h1>
          <p className="lead text-muted" style={{ maxWidth: '750px', margin: '0 auto' }}>
            Immediate government emergency contacts and critical safety procedures for drivers stranded or in distress on Indian highways.
          </p>
        </div>

        {/* 2 Primary Official Emergency Numbers */}
        <div className="row g-4 mb-5">
          {/* 112 ERSS */}
          <div className="col-lg-6">
            <div className="card rescue-card border-danger border-3 p-4 h-100 shadow-sm position-relative">
              <span className="position-absolute top-0 end-0 bg-danger text-white px-3 py-1 rounded-bottom-start fw-bold small">
                NATIONAL ERSS
              </span>
              <div className="d-flex align-items-center gap-3 mb-3">
                <span className="badge bg-danger text-white fs-2 px-3 py-2 rounded-4">
                  112
                </span>
                <div>
                  <h3 className="fw-bold text-danger mb-0">112 – National Emergency</h3>
                  <small className="text-muted fw-bold">Emergency Response Support System (ERSS)</small>
                </div>
              </div>

              <div className="alert alert-danger py-2 small mb-3">
                <strong>India's Unified Single Emergency Number:</strong> Covers Police, Fire Services, and Ambulance across all 28 states and union territories.
              </div>

              <p className="text-muted small mb-4">
                Dial 112 immediately if you or others on the highway are experiencing:
                serious road traffic accidents, personal injuries, physical harassment, highway robberies, vehicle fire, or severe life-threatening situations.
                Calls are GPS-geolocated by the state police command center for instant interceptor dispatch.
              </p>

              <button
                className="btn btn-danger btn-lg w-100 fw-bold shadow mt-auto d-flex align-items-center justify-content-center gap-2"
                onClick={() => initiateCall('112', '112 - National Emergency Response Support System')}
              >
                <i className="bi bi-telephone-fill"></i> Click to Call 112 Now
              </button>
            </div>
          </div>

          {/* 100 Police Helpline */}
          <div className="col-lg-6">
            <div className="card rescue-card border-secondary border-2 p-4 h-100 shadow-sm position-relative">
              <span className="position-absolute top-0 end-0 bg-dark text-white px-3 py-1 rounded-bottom-start fw-bold small">
                STATE POLICE
              </span>
              <div className="d-flex align-items-center gap-3 mb-3">
                <span className="badge bg-dark text-white fs-2 px-3 py-2 rounded-4">
                  100
                </span>
                <div>
                  <h3 className="fw-bold text-dark mb-0">100 – Police Emergency</h3>
                  <small className="text-muted fw-bold">Direct State Police Control Helpline</small>
                </div>
              </div>

              <div className="alert alert-secondary py-2 small mb-3">
                <strong>Direct Highway Police Line:</strong> Traditional helpline connecting directly to the nearest City / Highway Patrol control room.
              </div>

              <p className="text-muted small mb-4">
                Dial 100 for immediate police intervention regarding highway blockades, hit-and-run incidents, suspicious activities, or road rage. 
                <em>(Note: While 112 is the primary national integrated helpline, 100 remains operational across India).</em>
              </p>

              <button
                className="btn btn-dark btn-lg w-100 fw-bold shadow mt-auto d-flex align-items-center justify-content-center gap-2"
                onClick={() => initiateCall('100', '100 - Police Control Room')}
              >
                <i className="bi bi-shield-fill"></i> Click to Call 100 Now
              </button>
            </div>
          </div>
        </div>

        {/* Priority Private Roadside Dispatch Section */}
        <div className="card rescue-card p-4 p-md-5 mb-5 border-0 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #1a3f6d 100%)' }}>
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2">
                Private Roadside Vehicle Assistance
              </span>
              <h2 className="fw-bold text-white mb-2">
                Facing Mechanical Breakdown? Request Priority Rescue
              </h2>
              <p className="text-white-50 mb-0">
                Official emergency numbers (112 / 100) are reserved for law enforcement, fire, and medical crises.
                If your vehicle is simply immobilized due to flat tyres, transmission stall, empty fuel, or dead battery,
                launch a Priority Highway Rescue request.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button
                className="btn btn-primary-rescue btn-lg px-4 py-3 fw-bold w-100 w-lg-auto shadow"
                onClick={() => setShowBookingModal(true)}
              >
                <i className="bi bi-lightning-charge-fill me-2"></i> Priority Roadside Dispatch
              </button>
            </div>
          </div>
        </div>

        {/* Highway Breakdown Safety Checklist */}
        <div className="card bg-white p-4 p-md-5 rounded-4 border-0 shadow-sm mb-5">
          <h3 className="fw-bold text-navy mb-4">
            <i className="bi bi-shield-check text-success me-2"></i> Highway Breakdown Safety Checklist
          </h3>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="d-flex align-items-start gap-3">
                <span className="badge bg-danger rounded-circle p-2 text-white">1</span>
                <div>
                  <h6 className="fw-bold mb-1">Steer to Left Highway Shoulder</h6>
                  <p className="text-muted small mb-0">
                    Never stop in active travel lanes or near blind flyover curves. Coast gently onto the left paved shoulder or emergency breakdown lay-by.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-start gap-3">
                <span className="badge bg-danger rounded-circle p-2 text-white">2</span>
                <div>
                  <h6 className="fw-bold mb-1">Switch On Hazard Lights</h6>
                  <p className="text-muted small mb-0">
                    Immediately press your red hazard triangle button (double indicators) so oncoming fast-moving traffic is alerted from a distance.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-start gap-3">
                <span className="badge bg-danger rounded-circle p-2 text-white">3</span>
                <div>
                  <h6 className="fw-bold mb-1">Place Red Warning Triangle</h6>
                  <p className="text-muted small mb-0">
                    Carefully place your reflective warning triangle at least 50 meters (approx. 60-70 steps) behind your vehicle to give drivers stopping distance.
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex align-items-start gap-3">
                <span className="badge bg-danger rounded-circle p-2 text-white">4</span>
                <div>
                  <h6 className="fw-bold mb-1">Stay Behind the Highway Barrier</h6>
                  <p className="text-muted small mb-0">
                    Never stay seated inside an immobilized vehicle on high-speed expressways. Exit from the left passenger door and wait behind the steel crash barrier.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to ensure no accidental calls */}
      {confirmModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Confirm Emergency Call</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setConfirmModal({ show: false, number: '', title: '' })}></button>
              </div>
              <div className="modal-body p-4">
                <h6 className="fw-bold text-danger mb-2">{confirmModal.title}</h6>
                <p className="text-muted small mb-3">
                  Highway Rescue does not auto-dial. Clicking below will open your mobile telephone dialer to place a call to <strong>{confirmModal.number}</strong>.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setConfirmModal({ show: false, number: '', title: '' })}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger rounded-pill px-4 fw-bold" onClick={handleConfirmCall}>
                  Proceed to Call {confirmModal.number}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Priority Booking Modal */}
      <BookingModal
        show={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        preselectedService={{ name: 'General Vehicle Repair' }}
        onBookingSuccess={() => navigate('/customer/dashboard?tab=bookings')}
      />
    </div>
  );
};

export default EmergencyPage;
