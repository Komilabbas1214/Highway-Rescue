import React from 'react';
import { Link } from 'react-router-dom';

const EmergencyBanner = ({ onEmergencyRequestClick }) => {
  return (
    <div
      className="card rescue-card border-0 shadow-sm my-4 overflow-hidden position-relative"
      style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #153356 100%)' }}
    >
      <div className="card-body p-4 p-md-5 text-white">
        <div className="row align-items-center g-4">
          <div className="col-lg-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">
                <i className="bi bi-shield-check me-1"></i> 24x7 Roadside Assistance
              </span>
              <span className="badge bg-white bg-opacity-10 text-white border border-white border-opacity-25 px-2 py-1 rounded-pill small">
                Ahmedabad & Gujarat Highways
              </span>
            </div>
            <h3 className="fw-bold text-white mb-2">Highway Rescue Roadside Support</h3>
            <p className="text-white-50 mb-4" style={{ maxWidth: '650px' }}>
              Stranded due to a flat tyre, dead battery, overheating engine, or empty fuel?
              Our network of verified local mechanics and flatbed towing operators are on standby 24/7 with rapid GPS dispatch.
            </p>

            <div className="d-flex flex-wrap gap-3">
              <div className="d-flex align-items-center gap-2 text-white-50 small">
                <i className="bi bi-check-circle-fill text-warning"></i>
                <span className="text-white">Live GPS Tracking</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-white-50 small">
                <i className="bi bi-check-circle-fill text-warning"></i>
                <span className="text-white">Verified Mechanics Only</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-white-50 small">
                <i className="bi bi-check-circle-fill text-warning"></i>
                <span className="text-white">Fair & Transparent Rates</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-white-50 small">
                <i className="bi bi-check-circle-fill text-warning"></i>
                <span className="text-white">Fast 15-30 Min Arrival</span>
              </div>
            </div>
          </div>

          <div className="col-lg-4 text-lg-end">
            <div className="d-flex flex-column flex-sm-row flex-lg-column gap-2 justify-content-lg-end">
              {onEmergencyRequestClick ? (
                <button
                  className="btn btn-primary-rescue btn-lg fw-bold shadow d-flex align-items-center justify-content-center gap-2"
                  onClick={onEmergencyRequestClick}
                >
                  <i className="bi bi-lightning-charge-fill"></i> Request Priority Dispatch
                </button>
              ) : (
                <Link
                  to="/nearby?priority=emergency"
                  className="btn btn-primary-rescue btn-lg fw-bold shadow d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="bi bi-lightning-charge-fill"></i> Request Priority Dispatch
                </Link>
              )}

              <Link
                to="/nearby"
                className="btn btn-outline-light btn-lg fw-semibold d-flex align-items-center justify-content-center gap-2"
              >
                <i className="bi bi-geo-alt-fill"></i> Find Nearby Mechanics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmergencyBanner;
