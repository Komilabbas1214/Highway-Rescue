import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="py-5 text-center d-flex align-items-center justify-content-center" style={{ minHeight: '70vh' }}>
      <div className="container">
        <span className="badge bg-danger rounded-circle p-3 text-white mb-3">
          <i className="bi bi-cone-striped fs-1"></i>
        </span>
        <h1 className="fw-bold display-4 text-navy">404 - Highway Roadblock</h1>
        <p className="lead text-muted mb-4">
          The page or route you were looking for seems to have taken an exit.
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/" className="btn btn-primary-rescue fw-bold px-4">
            <i className="bi bi-house-door-fill me-1"></i> Return to Homepage
          </Link>
          <Link to="/nearby" className="btn btn-navy-rescue fw-semibold px-4">
            <i className="bi bi-geo-alt-fill me-1"></i> Find Nearby Assistance
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
