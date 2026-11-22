import React from 'react';
import { useNavigate } from 'react-router-dom';

const ServiceCard = ({ service, onBookClick }) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onBookClick) {
      onBookClick(service);
    } else {
      navigate(`/nearby?category=${encodeURIComponent(service.name)}`);
    }
  };

  return (
    <div className="service-feature-card">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <div className="service-icon-box">
          <i className={`bi ${service.icon || 'bi-wrench-adjustable'}`}></i>
        </div>
        {service.isEmergencyEligible && (
          <span className="badge badge-emergency small">
            <i className="bi bi-lightning-fill me-1"></i> 24x7 Emergency
          </span>
        )}
      </div>

      <h5 className="fw-bold mb-1 text-navy">{service.name}</h5>
      <span className="badge bg-light text-secondary border mb-2 align-self-start small">
        {service.category || 'Roadside Assistance'}
      </span>

      <p className="text-muted small flex-grow-1 mb-3">
        {service.description}
      </p>

      {service.estimatedPrice > 0 && (
        <div className="d-flex align-items-center justify-content-between py-2 border-top border-bottom my-2">
          <span className="text-muted small">Standard Inspection Base:</span>
          <span className="fw-bold text-dark">₹{service.estimatedPrice}</span>
        </div>
      )}

      <div className="mt-3">
        <button
          className="btn btn-outline-rescue w-100 d-flex align-items-center justify-content-center gap-2"
          onClick={handleAction}
        >
          <i className="bi bi-search"></i> Find Service
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
