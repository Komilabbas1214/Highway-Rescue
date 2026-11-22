import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="py-5" style={{ backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Hero Header */}
        <div className="text-center mb-5">
          <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2">
            Our Mission & Story
          </span>
          <h1 className="fw-bold text-navy display-5">Help Is Always Nearby.</h1>
          <p className="lead text-muted" style={{ maxWidth: '750px', margin: '0 auto' }}>
            Highway Rescue was founded with a singular purpose: to ensure that no motorist in India is ever left stranded, helpless, or vulnerable after a vehicle breakdown on a highway.
          </p>
        </div>

        {/* Mission & Problem Statement */}
        <div className="row g-5 align-items-center mb-5">
          <div className="col-lg-6">
            <h3 className="fw-bold mb-3">The Highway Breakdown Crisis</h3>
            <p className="text-muted">
              Every day, thousands of passenger cars, motorcycles, buses, and freight trucks experience tyre blowouts, battery failures, overheating, and mechanical breakdown along high-speed corridors.
            </p>
            <p className="text-muted">
              Stranded drivers often struggle with zero local garage contacts, exorbitant unregulated roadside repair prices, untrusted mechanics, and severe safety hazards from passing high-speed highway traffic.
            </p>
            <div className="p-3 bg-white rounded-3 border-start border-4 border-danger shadow-sm mb-3">
              <strong className="text-danger d-block mb-1">Our Core Commitment:</strong>
              <span className="text-muted small">
                To provide verified, location-aware, fairly priced, and rapid roadside vehicle dispatch backed by live status tracking and integration with India's official 112 emergency services.
              </span>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="p-4 rounded-4 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #153356 100%)' }}>
              <h4 className="fw-bold text-warning mb-3">
                <i className="bi bi-geo-alt-fill me-2"></i> Launch Market: Ahmedabad, Gujarat
              </h4>
              <p className="text-white-50 small mb-3">
                Highway Rescue is kicking off operations across Ahmedabad’s vital highway arteries, including:
              </p>
              <ul className="text-white-50 small mb-4 d-flex flex-column gap-2">
                <li><i className="bi bi-check-circle-fill text-success me-2"></i><strong>Sarkhej-Gandhinagar (SG) Highway:</strong> Connecting Ahmedabad and the state capital.</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i><strong>Sardar Patel Ring Road:</strong> 76 km outer orbital highway connecting all entry corridors.</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i><strong>Ahmedabad-Sanand Industrial Corridor:</strong> Heavy automobile manufacturing and logistics hub.</li>
                <li><i className="bi bi-check-circle-fill text-success me-2"></i><strong>National Highway 48 (Narol-Naroda / Vadodara expressway link):</strong> High freight density.</li>
              </ul>
              <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10 text-center">
                <span className="badge bg-warning text-dark fw-bold mb-1">Expansion Roadmap</span>
                <p className="small text-white mb-0">Phase 2: Vadodara, Surat & Rajkot corridors • Phase 3: Pan-India Golden Quadrilateral & National Expressways.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Pillars of Highway Rescue */}
        <div className="row g-4 mb-5 text-center">
          <div className="col-md-4">
            <div className="card rescue-card p-4 h-100">
              <div className="service-icon-box mx-auto">
                <i className="bi bi-shield-check"></i>
              </div>
              <h5 className="fw-bold">1. Verified Trust</h5>
              <p className="text-muted small mb-0">
                Every technician, puncture shop, and towing operator on Highway Rescue is verified by our administrative team before taking jobs.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card rescue-card p-4 h-100">
              <div className="service-icon-box mx-auto">
                <i className="bi bi-lightning-charge"></i>
              </div>
              <h5 className="fw-bold">2. Real-Time Technology</h5>
              <p className="text-muted small mb-0">
                GeoJSON geospatial querying and WebSockets connect you to the closest available provider within seconds, cutting wait times drastically.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card rescue-card p-4 h-100">
              <div className="service-icon-box mx-auto">
                <i className="bi bi-heart-pulse"></i>
              </div>
              <h5 className="fw-bold">3. Driver Safety First</h5>
              <p className="text-muted small mb-0">
                Immediate access to official national helplines 112 & 100, combined with step-by-step breakdown safety instructions.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card bg-white p-5 text-center shadow-sm rounded-4 border-0">
          <h3 className="fw-bold mb-2">Need Immediate Roadside Assistance?</h3>
          <p className="text-muted mb-4">Our network of verified mechanics is online right now along Gujarat highways.</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/nearby" className="btn btn-primary-rescue btn-lg fw-bold">
              <i className="bi bi-search me-1"></i> Find Nearby Mechanics
            </Link>
            <Link to="/contact" className="btn btn-navy-rescue btn-lg fw-bold">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
