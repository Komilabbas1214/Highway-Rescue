import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmergencyBanner from '../components/EmergencyBanner';
import ServiceCard from '../components/ServiceCard';
import BookingModal from '../components/BookingModal';
import api from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.get('/services');
        if (res.data.success) {
          setServices(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load services:', err);
      }
    };
    fetchServices();
  }, []);

  const handleOpenBooking = (service = null) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section text-white">
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <span className="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill mb-3">
                <i className="bi bi-geo-alt-fill me-1"></i> 24x7 Roadside Assistance Across Gujarat Highways
              </span>
              <h1 className="hero-title">
                Vehicle Breakdown? <br />
                <span className="hero-highlight">Help Is Just One Click Away!</span>
              </h1>
              <p className="lead text-white-50 mb-4" style={{ maxWidth: '600px' }}>
                Stranded on the highway with a flat tyre, dead battery, engine trouble, or empty fuel?
                Highway Rescue instantly connects you to verified nearby mechanics, flatbed towing trucks,
                and petrol pumps with live GPS tracking.
              </p>

              <div className="d-flex flex-wrap gap-3 mb-4">
                <Link to="/nearby" className="btn btn-primary-rescue btn-lg d-flex align-items-center gap-2">
                  <i className="bi bi-geo-alt-fill"></i> Find Help Near Me
                </Link>
                <button
                  className="btn btn-outline-light btn-lg rounded-pill px-4 fw-semibold d-flex align-items-center gap-2"
                  onClick={() => handleOpenBooking()}
                >
                  <i className="bi bi-wrench-adjustable"></i> Book a Mechanic
                </button>
              </div>

              {/* Quick Highway Feature Badges */}
              <div className="d-flex flex-wrap align-items-center gap-4 pt-3 border-top border-secondary border-opacity-50">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-lightning-charge-fill text-warning fs-5"></i>
                  <span className="small text-white">Avg. 15-30 Min Arrival</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-shield-check text-success fs-5"></i>
                  <span className="small text-white">100% Verified Garages</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-cash-coin text-info fs-5"></i>
                  <span className="small text-white">Fair & Transparent Rates</span>
                </div>
              </div>
            </div>

            {/* Hero Quick Assistance Box */}
            <div className="col-lg-5">
              <div className="card rescue-card p-4 shadow-lg border-0" style={{ background: 'rgba(255, 255, 255, 0.98)' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h5 className="fw-bold text-dark mb-0">Quick Roadside Dispatch</h5>
                  <span className="badge bg-danger text-white">
                    <span className="status-dot online"></span> Live Active
                  </span>
                </div>
                <p className="text-muted small mb-3">
                  Select your problem for instant connection with mechanics on SG Highway & SP Ring Road:
                </p>

                <div className="d-grid gap-2 mb-3">
                  <button
                    className="btn btn-light text-start border p-2 d-flex align-items-center justify-content-between hover-shadow"
                    onClick={() => handleOpenBooking({ name: 'Puncture Repair' })}
                  >
                    <span><i className="bi bi-disc text-primary me-2"></i> Puncture / Flat Tyre</span>
                    <span className="badge bg-light text-dark border">~₹250</span>
                  </button>
                  <button
                    className="btn btn-light text-start border p-2 d-flex align-items-center justify-content-between hover-shadow"
                    onClick={() => handleOpenBooking({ name: 'Battery Jump Start' })}
                  >
                    <span><i className="bi bi-lightning-charge text-warning me-2"></i> Dead Battery / Jump Start</span>
                    <span className="badge bg-light text-dark border">~₹350</span>
                  </button>
                  <button
                    className="btn btn-light text-start border p-2 d-flex align-items-center justify-content-between hover-shadow"
                    onClick={() => handleOpenBooking({ name: 'Towing Service' })}
                  >
                    <span><i className="bi bi-truck text-danger me-2"></i> Towing Truck Needed</span>
                    <span className="badge bg-light text-dark border">Flatbed</span>
                  </button>
                  <button
                    className="btn btn-light text-start border p-2 d-flex align-items-center justify-content-between hover-shadow"
                    onClick={() => handleOpenBooking({ name: 'Fuel Delivery' })}
                  >
                    <span><i className="bi bi-fuel-pump text-success me-2"></i> Out of Fuel (Petrol/Diesel)</span>
                    <span className="badge bg-light text-dark border">5-10L</span>
                  </button>
                </div>

                <div className="p-3 rounded-3 bg-light border text-center">
                  <span className="text-muted small d-block mb-1">Facing severe accident or life hazard?</span>
                  <a href="tel:112" className="btn btn-danger btn-sm fw-bold w-100">
                    <i className="bi bi-telephone-fill me-1"></i> Call 112 (National ERSS)
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Assistance Section */}
      <section className="container py-4">
        <EmergencyBanner onEmergencyRequestClick={() => handleOpenBooking({ name: 'General Vehicle Repair' })} />
      </section>

      {/* Popular Services Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill mb-2">
              Comprehensive Highway Services
            </span>
            <h2 className="fw-bold">Popular Assistance Categories</h2>
            <p className="text-muted" style={{ maxWidth: '650px', margin: '0 auto' }}>
              Whether you ride a two-wheeler, drive an SUV, or operate a commercial multi-axle truck,
              our verified highway mechanics are on standby.
            </p>
          </div>

          <div className="row g-4">
            {services.slice(0, 6).map((service) => (
              <div key={service._id} className="col-lg-4 col-md-6">
                <ServiceCard
                  service={service}
                  onBookClick={() => handleOpenBooking(service)}
                />
              </div>
            ))}
          </div>

          <div className="text-center mt-5">
            <Link to="/services" className="btn btn-navy-rescue px-5 py-2 fw-semibold">
              View All 10 Services <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-5" style={{ backgroundColor: '#f1f5f9' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2">
              Simple 4-Step Process
            </span>
            <h2 className="fw-bold">How Highway Rescue Works</h2>
            <p className="text-muted">Fast, transparent, and completely digital roadside assistance in minutes.</p>
          </div>

          <div className="row g-4 text-center">
            <div className="col-lg-3 col-sm-6">
              <div className="card rescue-card p-4 h-100">
                <div className="service-icon-box mx-auto">
                  <i className="bi bi-geo-alt"></i>
                </div>
                <div className="badge bg-primary text-white mb-2 mx-auto">Step 1</div>
                <h5 className="fw-bold">Share Location</h5>
                <p className="text-muted small mb-0">
                  Enable GPS or pick your highway milestone on SG Highway, SP Ring Road, or NH-48.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6">
              <div className="card rescue-card p-4 h-100">
                <div className="service-icon-box mx-auto">
                  <i className="bi bi-tools"></i>
                </div>
                <div className="badge bg-primary text-white mb-2 mx-auto">Step 2</div>
                <h5 className="fw-bold">Select Problem</h5>
                <p className="text-muted small mb-0">
                  Choose from puncture, towing, battery jump-start, or engine troubleshooting.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6">
              <div className="card rescue-card p-4 h-100">
                <div className="service-icon-box mx-auto">
                  <i className="bi bi-broadcast"></i>
                </div>
                <div className="badge bg-primary text-white mb-2 mx-auto">Step 3</div>
                <h5 className="fw-bold">Mechanic Dispatched</h5>
                <p className="text-muted small mb-0">
                  Nearby verified mechanic accepts your job and heads to your exact location.
                </p>
              </div>
            </div>

            <div className="col-lg-3 col-sm-6">
              <div className="card rescue-card p-4 h-100">
                <div className="service-icon-box mx-auto">
                  <i className="bi bi-check2-circle"></i>
                </div>
                <div className="badge bg-primary text-white mb-2 mx-auto">Step 4</div>
                <h5 className="fw-bold">Fixed & Secure</h5>
                <p className="text-muted small mb-0">
                  On-spot repair completed. Pay securely via Razorpay UPI or cash, and rate the service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-success bg-opacity-10 text-success fw-bold px-3 py-1 rounded-pill mb-2">
                Uncompromising Roadside Standards
              </span>
              <h2 className="fw-bold mb-3">Why Highway Rescue Is Trusted By Drivers</h2>
              <p className="text-muted mb-4">
                Highway breakdowns leave drivers vulnerable. We have engineered a platform specifically designed for highway safety, speed, and reliability.
              </p>

              <div className="d-flex flex-column gap-3">
                <div className="d-flex gap-3 align-items-start">
                  <div className="p-2 rounded-circle bg-success bg-opacity-10 text-success">
                    <i className="bi bi-patch-check-fill fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Strict Admin Verification</h6>
                    <p className="text-muted small mb-0">
                      Every mechanic and towing partner undergoes document and identity verification before being approved.
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start">
                  <div className="p-2 rounded-circle bg-primary bg-opacity-10 text-primary">
                    <i className="bi bi-clock-fill fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">24x7 Real-Time Availability</h6>
                    <p className="text-muted small mb-0">
                      Mechanics maintain live online/offline status, ensuring only active providers receive dispatches.
                    </p>
                  </div>
                </div>

                <div className="d-flex gap-3 align-items-start">
                  <div className="p-2 rounded-circle bg-warning bg-opacity-10 text-warning">
                    <i className="bi bi-shield-lock-fill fs-4"></i>
                  </div>
                  <div>
                    <h6 className="fw-bold mb-1">Direct Emergency 112 / 100 Integration</h6>
                    <p className="text-muted small mb-0">
                      Immediate access to official Indian emergency services alongside private vehicle rescue.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="p-4 rounded-4 shadow-lg text-white" style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #16365c 100%)' }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold text-white mb-0">Ahmedabad Corridor Coverage</h5>
                  <span className="badge bg-warning text-dark">Phase 1 Active</span>
                </div>

                <div className="d-flex flex-column gap-3 mb-4">
                  <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10">
                    <div className="d-flex justify-content-between mb-1">
                      <strong>Sarkhej - Gandhinagar (SG) Highway</strong>
                      <span className="badge bg-success">100% Covered</span>
                    </div>
                    <small className="text-white-50">Bodakdev, ISCON, Thaltej, Gota, Vaishno Devi Circle</small>
                  </div>

                  <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10">
                    <div className="d-flex justify-content-between mb-1">
                      <strong>Sardar Patel Ring Road</strong>
                      <span className="badge bg-success">100% Covered</span>
                    </div>
                    <small className="text-white-50">Bopal, Shilaj, Ognaj, Science City, Nikol, Naroda</small>
                  </div>

                  <div className="p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10">
                    <div className="d-flex justify-content-between mb-1">
                      <strong>Sanand Industrial Highway & NH-48</strong>
                      <span className="badge bg-success">100% Covered</span>
                    </div>
                    <small className="text-white-50">Sarkhej Chokdi, Sanand GIDC, Narol-Aslali bypass</small>
                  </div>
                </div>

                <Link to="/nearby" className="btn btn-warning w-100 fw-bold py-2 text-dark">
                  <i className="bi bi-map-fill me-1"></i> Open Interactive Highway Map
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Testimonials Section */}
      <section className="py-5" style={{ backgroundColor: '#fafbfc' }}>
        <div className="container">
          <div className="text-center mb-5">
            <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-3 py-1 rounded-pill mb-2">
              Real Experiences
            </span>
            <h2 className="fw-bold">Rescued Drivers Speak</h2>
            <p className="text-muted">Stories from vehicle owners stranded on Gujarat highways.</p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card rescue-card p-4 h-100">
                <div className="text-warning mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-muted small fst-italic mb-3">
                  "My car had a tyre blowout near Gota Flyover at 11:30 PM. I requested Puncture Repair via Highway Rescue and Patel Auto arrived in 20 minutes with a hydraulic jack and repaired it on the spot!"
                </p>
                <div className="d-flex align-items-center gap-2 mt-auto">
                  <div className="rounded-circle bg-primary text-white fw-bold d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    AK
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">Anand K.</h6>
                    <small className="text-muted">Hyundai Creta • SG Highway</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card rescue-card p-4 h-100">
                <div className="text-warning mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-muted small fst-italic mb-3">
                  "Our battery died completely while stopped at a dhaba on Sanand Highway. The battery technician reached with a booster kit within 25 minutes. Extremely professional and courteous."
                </p>
                <div className="d-flex align-items-center gap-2 mt-auto">
                  <div className="rounded-circle bg-warning text-dark fw-bold d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    PP
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">Priya Patel</h6>
                    <small className="text-muted">Honda City • Sanand Road</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card rescue-card p-4 h-100">
                <div className="text-warning mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-muted small fst-italic mb-3">
                  "Our delivery mini-truck clutch wire snapped on Sardar Patel Ring Road. The flatbed towing was dispatched in 15 minutes and towed safely to the garage. Saved our entire shipment timeline!"
                </p>
                <div className="d-flex align-items-center gap-2 mt-auto">
                  <div className="rounded-circle bg-success text-white fw-bold d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    MS
                  </div>
                  <div>
                    <h6 className="mb-0 fw-bold">Mohanlal Sharma</h6>
                    <small className="text-muted">Tata Ace • SP Ring Road</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Register as a Mechanic CTA Banner */}
      <section className="py-5 text-white" style={{ backgroundColor: '#0b1e36' }}>
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2">
                Mechanic & Garage Partnership
              </span>
              <h2 className="fw-bold text-white">Own a Garage or Towing Service on the Highway?</h2>
              <p className="lead text-white-50 mb-0">
                Join Highway Rescue to receive high-value nearby customer requests directly on your mobile device.
                Set your availability online/offline and grow your business with weekly direct payouts.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/register/mechanic" className="btn btn-primary-rescue btn-lg px-4 fw-bold">
                <i className="bi bi-tools me-2"></i> Register as a Mechanic
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal
        show={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        preselectedService={selectedService}
        onBookingSuccess={() => {
          navigate('/customer/dashboard?tab=bookings');
        }}
      />
    </div>
  );
};

export default HomePage;
