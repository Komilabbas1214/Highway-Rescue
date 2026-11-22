import React from 'react';

const MechanicCard = ({ mechanic, onBookClick, userLocation }) => {
  const getDirectionsUrl = () => {
    const mechLng = mechanic.location?.coordinates?.[0];
    const mechLat = mechanic.location?.coordinates?.[1];

    if (userLocation?.lat && userLocation?.lng) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${mechLat},${mechLng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${mechLat},${mechLng}&travelmode=driving`;
  };

  return (
    <div className="card rescue-card p-3 h-100 d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <h6 className="fw-bold mb-1 text-primary text-truncate" title={mechanic.shopName}>
              {mechanic.shopName}
            </h6>
            <div className="text-muted small">
              <i className="bi bi-person-fill me-1"></i> {mechanic.name}
            </div>
          </div>
          <div className="text-end">
            {mechanic.isVerified ? (
              <span className="badge badge-verified mb-1">
                <i className="bi bi-patch-check-fill"></i> Verified
              </span>
            ) : (
              <span className="badge badge-pending mb-1">
                <i className="bi bi-hourglass-split"></i> Pending
              </span>
            )}
            <div>
              <span className={`badge ${mechanic.isOnline ? 'badge-online' : 'badge-offline'} small`}>
                <span className={`status-dot ${mechanic.isOnline ? 'online' : 'offline'}`}></span>
                {mechanic.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 mb-2">
          <span className="badge bg-warning text-dark fw-bold">
            <i className="bi bi-star-fill text-warning me-1"></i> {mechanic.rating || '4.8'}
          </span>
          <span className="text-muted small">({mechanic.totalReviews || 0} reviews)</span>
          {mechanic.distanceKm !== undefined && mechanic.distanceKm !== null && (
            <span className="badge bg-light text-dark border ms-auto">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i> {mechanic.distanceKm} km away
            </span>
          )}
        </div>

        <p className="text-muted small mb-2 line-clamp-2" style={{ fontSize: '0.82rem' }}>
          <i className="bi bi-geo-alt me-1 text-secondary"></i> {mechanic.shopAddress}, {mechanic.city}
        </p>

        {/* Services Badges */}
        <div className="d-flex flex-wrap gap-1 mb-3">
          {mechanic.services?.slice(0, 3).map((srv, idx) => (
            <span key={idx} className="badge bg-light text-secondary border small" style={{ fontSize: '0.72rem' }}>
              {srv}
            </span>
          ))}
          {mechanic.services?.length > 3 && (
            <span className="badge bg-light text-muted border small" style={{ fontSize: '0.72rem' }}>
              +{mechanic.services.length - 3} more
            </span>
          )}
        </div>
      </div>

      <div className="border-top pt-2">
        <div className="row g-2">
          <div className="col-4">
            <a
              href={`tel:${mechanic.phone}`}
              className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              title="Call Mechanic"
            >
              <i className="bi bi-telephone-fill text-success"></i> Call
            </a>
          </div>
          <div className="col-4">
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline-primary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              title="Open Directions in Google Maps"
            >
              <i className="bi bi-map"></i> Maps
            </a>
          </div>
          <div className="col-4">
            <button
              className="btn btn-primary-rescue btn-sm w-100 px-1 fw-bold"
              disabled={!mechanic.isOnline}
              onClick={() => onBookClick && onBookClick(mechanic)}
            >
              Book
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MechanicCard;
