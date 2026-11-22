import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-dark text-white pt-5 pb-4 mt-auto" style={{ backgroundColor: '#061220' }}>
      <div className="container">
        <div className="row g-4">
          {/* Brand Info */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-danger rounded-circle p-2 text-white">
                <i className="bi bi-shield-fill-plus fs-5"></i>
              </span>
              <h4 className="text-white mb-0 fw-bold">
                Highway<span className="text-warning">Rescue</span>
              </h4>
            </div>
            <p className="text-white-50 small mb-3">
              India's trusted 24x7 online roadside vehicle assistance marketplace.
              Connecting stranded motorists on highways with nearby mechanics, towing trucks,
              puncture shops, battery technicians, and petrol pumps.
            </p>
            <div className="p-3 rounded-3" style={{ backgroundColor: '#0e233d', border: '1px solid #1a3c66' }}>
              <div className="text-warning fw-bold small mb-1">
                <i className="bi bi-geo-alt-fill me-1"></i> Initial Launch Market:
              </div>
              <div className="text-white small">
                Ahmedabad, Gujarat (SG Highway, SP Ring Road, Sanand & Gandhinagar Corridors) & expanding pan-India.
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-bold mb-3">Quick Navigation</h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 text-white-50">
              <li><Link to="/" className="text-white-50 text-decoration-none hover-white">Home</Link></li>
              <li><Link to="/services" className="text-white-50 text-decoration-none hover-white">All 10 Services</Link></li>
              <li><Link to="/nearby" className="text-white-50 text-decoration-none hover-white">Find Help Near Me</Link></li>
              <li><Link to="/petrol-pumps" className="text-white-50 text-decoration-none hover-white">Petrol Pumps</Link></li>
              <li><Link to="/emergency" className="text-white-50 text-decoration-none hover-white">Emergency Numbers</Link></li>
              <li><Link to="/about" className="text-white-50 text-decoration-none hover-white">About Us</Link></li>
              <li><Link to="/contact" className="text-white-50 text-decoration-none hover-white">Contact Us</Link></li>
            </ul>
          </div>

          {/* Core Services */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Highway Assistance</h6>
            <ul className="list-unstyled small mb-0 d-flex flex-column gap-2 text-white-50">
              <li><i className="bi bi-check2 text-warning me-1"></i> 24x7 Puncture Repair</li>
              <li><i className="bi bi-check2 text-warning me-1"></i> Flatbed Towing Service</li>
              <li><i className="bi bi-check2 text-warning me-1"></i> Battery Booster Jump Start</li>
              <li><i className="bi bi-check2 text-warning me-1"></i> Emergency Fuel Delivery</li>
              <li><i className="bi bi-check2 text-warning me-1"></i> Engine Diagnostic & Mechanical</li>
              <li><i className="bi bi-check2 text-warning me-1"></i> Commercial Truck Breakdown</li>
            </ul>
          </div>

          {/* Emergency Call Box */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold mb-3">Emergency Helplines</h6>
            <div className="card bg-danger text-white border-0 p-3 mb-3 rounded-3 shadow">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="small fw-bold">National Helpline</span>
                <span className="badge bg-white text-danger">Free 24x7</span>
              </div>
              <a href="tel:112" className="btn btn-light fw-bold text-danger w-100 py-2">
                <i className="bi bi-telephone-fill me-2"></i> Call 112 (ERSS)
              </a>
              <small className="mt-2 text-white-50" style={{ fontSize: '0.72rem' }}>
                All-in-one helpline for Police, Fire & Medical Emergencies across India.
              </small>
            </div>

            <div className="card bg-secondary bg-opacity-25 text-white border-0 p-3 rounded-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <span className="small fw-semibold">Police Emergency</span>
                <span className="small text-white-50">Toll Free</span>
              </div>
              <a href="tel:100" className="btn btn-outline-light btn-sm fw-bold">
                <i className="bi bi-telephone me-1"></i> Call 100
              </a>
            </div>
          </div>
        </div>

        <hr className="my-4 border-secondary opacity-25" />

        <div className="row align-items-center text-white-50 small">
          <div className="col-md-6 text-center text-md-start">
            &copy; {new Date().getFullYear()} Highway Rescue India. All rights reserved. Help Is Always Nearby.
          </div>
          <div className="col-md-6 text-center text-md-end mt-2 mt-md-0">
            <span className="me-3">Safety First on Highways</span>
            <span className="badge bg-success text-white">ISO Compliant Operations</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
