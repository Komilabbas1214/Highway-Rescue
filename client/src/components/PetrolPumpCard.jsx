import React from 'react';

const PetrolPumpCard = ({ pump, userLocation }) => {
  const getDirectionsUrl = () => {
    const pLng = pump.location?.coordinates?.[0];
    const pLat = pump.location?.coordinates?.[1];

    if (userLocation?.lat && userLocation?.lng) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${pLat},${pLng}&travelmode=driving`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${pLat},${pLng}&travelmode=driving`;
  };

  const getBrandBadgeColor = (brand) => {
    switch (brand) {
      case 'IndianOil':
        return 'bg-warning text-dark';
      case 'HP':
        return 'bg-primary text-white';
      case 'Bharat Petroleum':
        return 'bg-info text-dark';
      case 'Shell':
        return 'bg-danger text-white';
      default:
        return 'bg-secondary text-white';
    }
  };

  return (
    <div className="card rescue-card p-3 h-100 d-flex flex-column justify-content-between">
      <div>
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <span className={`badge ${getBrandBadgeColor(pump.brand)} mb-1 fw-bold`}>
              {pump.brand}
            </span>
            <h6 className="fw-bold mb-1 text-dark line-clamp-1" title={pump.name}>
              {pump.name}
            </h6>
          </div>
          {pump.distanceKm !== undefined && pump.distanceKm !== null && (
            <span className="badge bg-light text-dark border">
              <i className="bi bi-geo-alt-fill text-danger me-1"></i> {pump.distanceKm} km
            </span>
          )}
        </div>

        <p className="text-muted small mb-2 line-clamp-2" style={{ fontSize: '0.82rem' }}>
          <i className="bi bi-geo-alt me-1 text-danger"></i> {pump.address}, {pump.city}
        </p>

        {/* Operating hours & Verified tag */}
        <div className="d-flex align-items-center gap-2 mb-2">
          {pump.is24x7 && (
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
              <i className="bi bi-clock-fill me-1"></i> Open 24x7
            </span>
          )}
          {pump.isVerified && (
            <span className="badge badge-verified small">
              <i className="bi bi-patch-check-fill"></i> Verified Pump
            </span>
          )}
        </div>

        {/* Verified Available Fuel Types */}
        <div className="mb-2">
          <small className="text-muted d-block mb-1 fw-semibold" style={{ fontSize: '0.75rem' }}>
            Available Verified Fuels:
          </small>
          <div className="d-flex flex-wrap gap-1">
            {pump.fuelTypes?.map((fuel, idx) => (
              <span
                key={idx}
                className={`badge ${
                  fuel.includes('EV')
                    ? 'bg-success text-white'
                    : fuel.includes('CNG')
                    ? 'bg-info text-dark'
                    : 'bg-light text-dark border'
                } small`}
                style={{ fontSize: '0.72rem' }}
              >
                {fuel}
              </span>
            ))}
          </div>
        </div>

        {/* Facilities */}
        {pump.facilities && pump.facilities.length > 0 && (
          <div className="mb-3">
            <div className="d-flex flex-wrap gap-1">
              {pump.facilities.slice(0, 3).map((fac, idx) => (
                <span key={idx} className="badge bg-white text-muted border small" style={{ fontSize: '0.7rem' }}>
                  ✓ {fac}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-top pt-2">
        <div className="row g-2">
          {pump.phone ? (
            <div className="col-6">
              <a
                href={`tel:${pump.phone}`}
                className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
              >
                <i className="bi bi-telephone-fill text-success"></i> Call Station
              </a>
            </div>
          ) : (
            <div className="col-6">
              <button className="btn btn-light btn-sm w-100 text-muted" disabled>
                No Phone Listed
              </button>
            </div>
          )}
          <div className="col-6">
            <a
              href={getDirectionsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-navy-rescue btn-sm w-100 d-flex align-items-center justify-content-center gap-1"
            >
              <i className="bi bi-cursor-fill"></i> Directions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetrolPumpCard;
