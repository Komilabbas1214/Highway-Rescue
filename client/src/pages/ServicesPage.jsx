import React, { useState, useEffect } from 'react';
import ServiceCard from '../components/ServiceCard';
import BookingModal from '../components/BookingModal';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const ServicesPage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        if (res.data.success) {
          setServices(res.data.data);
        }
      } catch (err) {
        console.warn('Error fetching services:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleBook = (srv) => {
    if (srv.name === 'Nearby Petrol Pumps') {
      navigate('/petrol-pumps');
      return;
    }
    setSelectedService(srv);
    setShowBookingModal(true);
  };

  const filteredServices = services.filter((srv) => {
    const matchCat = filterCategory === 'All' || srv.category === filterCategory;
    const matchSearch =
      srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      srv.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = ['All', ...new Set(services.map((s) => s.category).filter(Boolean))];

  return (
    <div className="py-5" style={{ minHeight: '80vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill mb-2">
            Highway Vehicle Assistance Catalog
          </span>
          <h1 className="fw-bold text-navy">All 10 Roadside Services</h1>
          <p className="text-muted" style={{ maxWidth: '650px', margin: '0 auto' }}>
            From emergency puncture fixes and high-voltage jump starts to flatbed towing and fuel delivery,
            we cover all highway breakdown eventualities.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="card rescue-card p-3 mb-5 border-0 shadow-sm">
          <div className="row g-3 align-items-center">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search services (e.g. puncture, towing, battery, engine)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-6">
              <div className="d-flex flex-wrap gap-1 justify-content-md-end">
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    className={`btn btn-sm rounded-pill ${filterCategory === cat ? 'btn-navy-rescue' : 'btn-outline-secondary'}`}
                    onClick={() => setFilterCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="text-muted mt-2">Loading highway services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-3 border">
            <i className="bi bi-search fs-1 text-muted"></i>
            <h5 className="fw-bold mt-2">No Services Found</h5>
            <p className="text-muted">Try adjusting your search query or filter category.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredServices.map((service) => (
              <div key={service._id} className="col-lg-4 col-md-6">
                <ServiceCard service={service} onBookClick={handleBook} />
              </div>
            ))}
          </div>
        )}

        {/* Emergency Callout Box */}
        <div className="mt-5 p-4 rounded-3 text-white d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 shadow" style={{ backgroundColor: '#0b1e36' }}>
          <div>
            <h5 className="fw-bold mb-1 text-white">Can't Find What You Need?</h5>
            <p className="text-white-50 small mb-0">
              Our 24x7 emergency control team can arrange specialized recovery cranes and commercial vehicle assistance.
            </p>
          </div>
          <div className="d-flex gap-2">
            <a href="tel:112" className="btn btn-danger fw-bold rounded-pill px-4">
              <i className="bi bi-telephone-fill me-1"></i> Call 112 ERSS
            </a>
            <button
              className="btn btn-primary-rescue fw-bold rounded-pill px-4"
              onClick={() => handleBook({ name: 'General Vehicle Repair' })}
            >
              Request Custom Help
            </button>
          </div>
        </div>
      </div>

      <BookingModal
        show={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        preselectedService={selectedService}
        onBookingSuccess={() => navigate('/customer/dashboard?tab=bookings')}
      />
    </div>
  );
};

export default ServicesPage;
