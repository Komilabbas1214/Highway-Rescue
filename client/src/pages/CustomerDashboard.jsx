import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import BookingModal from '../components/BookingModal';
import PaymentModal from '../components/PaymentModal';
import RatingModal from '../components/RatingModal';
import EmergencyBanner from '../components/EmergencyBanner';
import { toast } from 'react-toastify';

const STATUS_STEPS = ['Pending', 'Accepted', 'On The Way', 'Arrived', 'In Progress', 'Completed'];

const CustomerDashboard = () => {
  const { user, updateProfile, logout } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [activeBooking, setActiveBooking] = useState(null);
  const [bookingsHistory, setBookingsHistory] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Modals
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState(null);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicleType: user?.vehicleType || 'Car',
    vehicleNumber: user?.vehicleNumber || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Live Location
  const [currentLocation, setCurrentLocation] = useState({
    lat: 23.0338,
    lng: 72.5186,
    address: 'Near ISCON Cross Road, SG Highway, Ahmedabad',
  });
  const [detectingLocation, setDetectingLocation] = useState(false);

  // Load Bookings
  const fetchMyBookings = async () => {
    try {
      const res = await api.get('/bookings/my-bookings');
      if (res.data.success) {
        setActiveBooking(res.data.activeBooking);
        setBookingsHistory(res.data.bookings);
      }
    } catch (error) {
      console.warn('Failed to load customer bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchMyBookings();
  }, []);

  // Listen to live socket updates for customer's bookings
  useEffect(() => {
    if (!socket) return;

    socket.on('bookingStatusUpdated', (data) => {
      fetchMyBookings();
    });

    socket.on('bookingAccepted', (data) => {
      fetchMyBookings();
    });

    socket.on('bookingCancelled', (data) => {
      fetchMyBookings();
    });

    return () => {
      socket.off('bookingStatusUpdated');
      socket.off('bookingAccepted');
      socket.off('bookingCancelled');
    };
  }, [socket]);

  // Handle GPS detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.warn('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: 'Current Live GPS Highway Coordinates',
        });
        setDetectingLocation(false);
        toast.success('Live GPS coordinates updated!');
      },
      (err) => {
        setDetectingLocation(false);
        toast.info('Could not auto-detect GPS. Manual location is maintained.');
      }
    );
  };

  // Handle Booking Cancellation
  const handleCancelBooking = async (bookingId, currentStatus = null) => {
    // Validate booking status before allowing cancellation on the client side
    if (currentStatus && currentStatus !== 'Pending') {
      toast.error('Booking cannot be cancelled because the mechanic has already accepted the request.');
      return;
    }

    const reason = window.prompt('Please enter cancellation reason (e.g. Issue resolved, vehicle started):');
    if (reason === null) return;

    try {
      const res = await api.put(`/bookings/${bookingId}/cancel`, { reason });
      if (res.data.success) {
        toast.info('Booking has been cancelled.');
        fetchMyBookings();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel booking.');
      // Refresh bookings to reflect server-side status (e.g., if mechanic just accepted)
      fetchMyBookings();
    }
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    await updateProfile(profileForm);
    setSavingProfile(false);
  };

  const getStepIndex = (status) => {
    const idx = STATUS_STEPS.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  return (
    <div className="py-4" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Welcome Banner */}
        <div className="card rescue-card p-4 mb-4 border-0 shadow-sm text-white position-relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #153356 100%)' }}>
          <div className="row align-items-center g-3">
            <div className="col-md-8">
              <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill mb-2">
                Driver & Vehicle Owner Hub
              </span>
              <h3 className="fw-bold text-white mb-1">Welcome back, {user?.name}!</h3>
              <p className="text-white-50 small mb-2">
                Registered Vehicle: <strong>{user?.vehicleType || 'Car'}</strong> • Plate: <strong>{user?.vehicleNumber || 'Not Specified'}</strong> • Phone: {user?.phone}
              </p>
              <div className="d-flex align-items-center gap-2 text-white-50 small">
                <i className="bi bi-geo-alt-fill text-danger"></i>
                <span>Current Highway Location: {currentLocation.address}</span>
              </div>
            </div>

            <div className="col-md-4 text-md-end">
              <button
                className="btn btn-primary-rescue fw-bold px-4 py-2 me-2 mb-2 mb-md-0"
                onClick={() => setShowBookingModal(true)}
              >
                <i className="bi bi-lightning-charge-fill me-1"></i> Request Assistance
              </button>
              <button
                className="btn btn-outline-light btn-sm rounded-pill"
                onClick={handleDetectGps}
                disabled={detectingLocation}
              >
                <i className="bi bi-crosshair me-1"></i> {detectingLocation ? 'Locating...' : 'Refresh GPS'}
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Navigation Tabs */}
        <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'overview' ? 'active bg-primary-rescue' : 'text-dark bg-white border'}`}
              onClick={() => {
                setActiveTab('overview');
                setSearchParams({ tab: 'overview' });
              }}
            >
              <i className="bi bi-speedometer2 me-1"></i> Overview & Live Status
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'bookings' ? 'active bg-primary-rescue' : 'text-dark bg-white border'}`}
              onClick={() => {
                setActiveTab('bookings');
                setSearchParams({ tab: 'bookings' });
              }}
            >
              <i className="bi bi-card-checklist me-1"></i> Booking History ({bookingsHistory.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'profile' ? 'active bg-primary-rescue' : 'text-dark bg-white border'}`}
              onClick={() => {
                setActiveTab('profile');
                setSearchParams({ tab: 'profile' });
              }}
            >
              <i className="bi bi-person-gear me-1"></i> Profile & Vehicle
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'emergency' ? 'active bg-danger text-white' : 'text-danger bg-white border border-danger'}`}
              onClick={() => {
                setActiveTab('emergency');
                setSearchParams({ tab: 'emergency' });
              }}
            >
              <i className="bi bi-shield-exclamation me-1"></i> Emergency 112 / 100
            </button>
          </li>
        </ul>

        {/* Tab 1: Overview & Active Booking Tracker */}
        {activeTab === 'overview' && (
          <div>
            {/* Active Booking Card */}
            {activeBooking ? (
              <div className="card rescue-card border-warning border-2 p-4 mb-4 shadow-sm bg-white">
                <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3 gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-danger p-2 rounded-circle">
                      <span className="status-dot online"></span>
                    </span>
                    <div>
                      <span className="badge bg-warning text-dark fw-bold me-2">ACTIVE DISPATCH</span>
                      <strong className="fs-5 text-navy">#{activeBooking.bookingId}</strong>
                      <span className="text-muted small ms-2">• {activeBooking.serviceType}</span>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary fs-6 px-3 py-1">
                      Status: {activeBooking.status}
                    </span>
                    {activeBooking.status === 'Pending' ? (
                      <button
                        className="btn btn-outline-danger btn-sm rounded-pill"
                        onClick={() => handleCancelBooking(activeBooking._id, activeBooking.status)}
                      >
                        <i className="bi bi-x-circle me-1"></i> Cancel Request
                      </button>
                    ) : (
                      <span
                        className="badge bg-light text-secondary border py-2 px-3 small d-inline-flex align-items-center gap-1"
                        title="Cancellation is unavailable once a mechanic has accepted your request."
                      >
                        <i className="bi bi-lock-fill text-muted"></i> Cancellation Unavailable (Mechanic Assigned)
                      </span>
                    )}
                  </div>
                </div>

                {/* Notice when cancellation is unavailable */}
                {activeBooking.status !== 'Pending' && activeBooking.status !== 'Completed' && (
                  <div className="alert alert-secondary py-2 px-3 small my-3 d-flex align-items-center gap-2 rounded-3 border">
                    <i className="bi bi-shield-lock-fill text-warning fs-6"></i>
                    <span>
                      <strong>Cancellation Locked:</strong> Your request has been accepted by the mechanic. Cancellation is no longer permitted once the mechanic is assigned or en route.
                    </span>
                  </div>
                )}

                {/* Progress Stepper */}
                <div className="booking-progress-stepper my-4">
                  {STATUS_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(activeBooking.status);
                    const isCompleted = currentIdx > idx;
                    const isActive = currentIdx === idx;

                    return (
                      <div
                        key={idx}
                        className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                      >
                        <div className="step-icon">
                          {isCompleted ? <i className="bi bi-check-lg"></i> : idx + 1}
                        </div>
                        <div className="step-label">{step}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Assigned Mechanic & Vehicle Details */}
                <div className="row g-3 bg-light p-3 rounded-3 border">
                  <div className="col-md-6 border-end-md">
                    <h6 className="fw-bold text-primary mb-2">
                      <i className="bi bi-tools me-1"></i> Assigned Service Provider
                    </h6>
                    {activeBooking.mechanic ? (
                      <div>
                        <div className="fw-bold text-dark fs-6">{activeBooking.mechanic.shopName}</div>
                        <div className="text-muted small">
                          <i className="bi bi-person-fill me-1"></i> {activeBooking.mechanic.name} • Rating: ⭐ {activeBooking.mechanic.rating || '4.8'}
                        </div>
                        <div className="text-muted small mb-2">
                          <i className="bi bi-geo-alt me-1"></i> {activeBooking.mechanic.shopAddress}
                        </div>
                        <div className="d-flex gap-2 mt-2">
                          <a
                            href={`tel:${activeBooking.mechanic.phone}`}
                            className="btn btn-success btn-sm fw-bold d-flex align-items-center gap-1"
                          >
                            <i className="bi bi-telephone-fill"></i> Call Mechanic ({activeBooking.mechanic.phone})
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-white rounded border text-center">
                        <div className="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
                        <span className="small text-muted">Broadcasting to nearby verified mechanics along the highway...</span>
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-bold text-primary mb-2">
                      <i className="bi bi-car-front me-1"></i> Breakdown Details
                    </h6>
                    <div className="small text-muted mb-1">
                      <strong>Vehicle:</strong> {activeBooking.vehicleType} ({activeBooking.vehicleNumber})
                    </div>
                    <div className="small text-muted mb-1">
                      <strong>Reported Issue:</strong> {activeBooking.problemDescription}
                    </div>
                    <div className="small text-muted mb-2">
                      <strong>Location:</strong> {activeBooking.customerLocation?.address}
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <span className="small text-muted">Estimated Base Price:</span>
                      <strong className="text-danger fs-6">₹{activeBooking.estimatedCost || 350}</strong>
                    </div>
                  </div>
                </div>

                {/* If completed, show payment & rating action buttons */}
                {activeBooking.status === 'Completed' && (
                  <div className="mt-4 p-3 bg-success bg-opacity-10 border border-success rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-2">
                    <div>
                      <strong className="text-success">🎉 Job Completed by Mechanic!</strong>
                      <div className="small text-muted">Please settle the payment and rate your roadside technician.</div>
                    </div>
                    <div className="d-flex gap-2">
                      {activeBooking.paymentStatus !== 'Paid' ? (
                        <button
                          className="btn btn-primary-rescue fw-bold btn-sm"
                          onClick={() => {
                            setSelectedBookingForModal(activeBooking);
                            setShowPaymentModal(true);
                          }}
                        >
                          <i className="bi bi-credit-card me-1"></i> Pay ₹{activeBooking.finalCost || activeBooking.estimatedCost}
                        </button>
                      ) : (
                        <span className="badge bg-success p-2">✓ Paid Online / Cash</span>
                      )}
                      <button
                        className="btn btn-navy-rescue btn-sm fw-bold"
                        onClick={() => {
                          setSelectedBookingForModal(activeBooking);
                          setShowRatingModal(true);
                        }}
                      >
                        <i className="bi bi-star-fill text-warning me-1"></i> Rate Service
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="card rescue-card p-4 mb-4 border-0 shadow-sm bg-white text-center">
                <i className="bi bi-shield-check fs-1 text-success mb-2"></i>
                <h5 className="fw-bold text-dark">No Active Breakdown Request</h5>
                <p className="text-muted small mb-3" style={{ maxWidth: '500px', margin: '0 auto' }}>
                  You currently have no active highway roadside requests. If your vehicle faces any trouble, click below for instant mechanic dispatch.
                </p>
                <div className="d-flex justify-content-center gap-2">
                  <button
                    className="btn btn-primary-rescue fw-bold"
                    onClick={() => setShowBookingModal(true)}
                  >
                    <i className="bi bi-wrench-adjustable me-1"></i> Book Roadside Mechanic
                  </button>
                  <Link to="/nearby" className="btn btn-outline-rescue fw-semibold">
                    <i className="bi bi-search me-1"></i> Explore Nearby Map
                  </Link>
                </div>
              </div>
            )}

            {/* Quick Action Cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-3 col-sm-6">
                <Link to="/nearby?category=Puncture+Repair" className="card rescue-card p-3 text-decoration-none text-dark h-100">
                  <div className="d-flex align-items-center gap-3">
                    <div className="service-icon-box mb-0" style={{ width: '45px', height: '45px', fontSize: '20px' }}>
                      <i className="bi bi-disc"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Puncture</h6>
                      <small className="text-muted">On-spot tyre fix</small>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="col-md-3 col-sm-6">
                <Link to="/nearby?category=Battery+Jump+Start" className="card rescue-card p-3 text-decoration-none text-dark h-100">
                  <div className="d-flex align-items-center gap-3">
                    <div className="service-icon-box mb-0" style={{ width: '45px', height: '45px', fontSize: '20px' }}>
                      <i className="bi bi-lightning-charge"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Battery Jump</h6>
                      <small className="text-muted">12V/24V booster</small>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="col-md-3 col-sm-6">
                <Link to="/nearby?category=Towing+Service" className="card rescue-card p-3 text-decoration-none text-dark h-100">
                  <div className="d-flex align-items-center gap-3">
                    <div className="service-icon-box mb-0" style={{ width: '45px', height: '45px', fontSize: '20px' }}>
                      <i className="bi bi-truck"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Towing Truck</h6>
                      <small className="text-muted">Flatbed recovery</small>
                    </div>
                  </div>
                </Link>
              </div>

              <div className="col-md-3 col-sm-6">
                <Link to="/petrol-pumps" className="card rescue-card p-3 text-decoration-none text-dark h-100">
                  <div className="d-flex align-items-center gap-3">
                    <div className="service-icon-box mb-0" style={{ width: '45px', height: '45px', fontSize: '20px' }}>
                      <i className="bi bi-fuel-pump"></i>
                    </div>
                    <div>
                      <h6 className="fw-bold mb-0">Petrol Pumps</h6>
                      <small className="text-muted">Fuel & EV stations</small>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Bookings History */}
        {activeTab === 'bookings' && (
          <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-navy mb-0">My Roadside Service History</h5>
              <button
                className="btn btn-primary-rescue btn-sm fw-bold"
                onClick={() => setShowBookingModal(true)}
              >
                + New Assistance Request
              </button>
            </div>

            {loadingBookings ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
              </div>
            ) : bookingsHistory.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox fs-1 text-muted"></i>
                <h6 className="fw-bold mt-2">No Bookings Yet</h6>
                <p className="text-muted small">Your previous roadside service records will appear here.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Booking ID</th>
                      <th>Service Type</th>
                      <th>Vehicle</th>
                      <th>Mechanic</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookingsHistory.map((b) => (
                      <tr key={b._id}>
                        <td>
                          <strong>{b.bookingId}</strong>
                          {b.isEmergency && (
                            <span className="badge badge-emergency ms-1" style={{ fontSize: '0.65rem' }}>
                              Emergency
                            </span>
                          )}
                        </td>
                        <td>{b.serviceType}</td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {b.vehicleType} • {b.vehicleNumber}
                          </span>
                        </td>
                        <td>
                          {b.mechanic ? (
                            <div>
                              <div className="fw-semibold small">{b.mechanic.shopName}</div>
                              <small className="text-muted">{b.mechanic.name}</small>
                            </div>
                          ) : (
                            <span className="text-muted small">Pending Assignment</span>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">
                            {new Date(b.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </small>
                        </td>
                        <td>
                          <strong>₹{b.finalCost || b.estimatedCost || 350}</strong>
                          <div>
                            <span className={`badge ${b.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'} small`} style={{ fontSize: '0.65rem' }}>
                              {b.paymentStatus || 'Pending'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            b.status === 'Completed'
                              ? 'bg-success'
                              : b.status === 'Cancelled'
                              ? 'bg-secondary'
                              : 'bg-primary'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {b.status === 'Completed' && (
                              <button
                                className="btn btn-outline-warning btn-sm py-0 px-2"
                                title="Rate Mechanic"
                                onClick={() => {
                                  setSelectedBookingForModal(b);
                                  setShowRatingModal(true);
                                }}
                              >
                                <i className="bi bi-star-fill text-warning"></i>
                              </button>
                            )}
                            {b.status === 'Completed' && b.paymentStatus !== 'Paid' && (
                              <button
                                className="btn btn-primary-rescue btn-sm py-0 px-2"
                                title="Pay Bill"
                                onClick={() => {
                                  setSelectedBookingForModal(b);
                                  setShowPaymentModal(true);
                                }}
                              >
                                Pay
                              </button>
                            )}
                            {b.status === 'Pending' ? (
                              <button
                                className="btn btn-outline-danger btn-sm py-0 px-2"
                                title="Cancel Pending Booking"
                                onClick={() => handleCancelBooking(b._id, b.status)}
                              >
                                Cancel
                              </button>
                            ) : (
                              ['Accepted', 'On The Way', 'Arrived', 'In Progress'].includes(b.status) && (
                                <span
                                  className="badge bg-light text-muted border py-1 px-2 small"
                                  title="Cancellation unavailable once accepted by mechanic."
                                >
                                  <i className="bi bi-lock-fill text-secondary"></i> Locked
                                </span>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Profile & Vehicle Details */}
        {activeTab === 'profile' && (
          <div className="row justify-content-center">
            <div className="col-lg-7">
              <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
                <h5 className="fw-bold text-navy mb-3">Manage Profile & Vehicle Info</h5>
                <p className="text-muted small mb-4">
                  Keep your vehicle details up to date so roadside dispatchers send the correct tools and equipment.
                </p>

                <form onSubmit={handleProfileSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Mobile Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Vehicle Category</label>
                      <select
                        className="form-select"
                        value={profileForm.vehicleType}
                        onChange={(e) => setProfileForm({ ...profileForm, vehicleType: e.target.value })}
                      >
                        <option value="Car">Car</option>
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Truck">Truck</option>
                        <option value="Bus">Bus</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold small">Vehicle Registration Number</label>
                      <input
                        type="text"
                        className="form-control text-uppercase"
                        value={profileForm.vehicleNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, vehicleNumber: e.target.value.toUpperCase() })}
                        placeholder="GJ-01-XX-0000"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <button
                      type="submit"
                      className="btn btn-primary-rescue fw-bold px-4"
                      disabled={savingProfile}
                    >
                      {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={logout}
                    >
                      <i className="bi bi-box-arrow-right me-1"></i> Sign Out
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Emergency Assistance */}
        {activeTab === 'emergency' && (
          <div>
            <EmergencyBanner onEmergencyRequestClick={() => setShowBookingModal(true)} />
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <BookingModal
        show={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        initialLocation={currentLocation}
        onBookingSuccess={() => {
          fetchMyBookings();
          setActiveTab('overview');
        }}
      />

      {/* Payment Modal */}
      <PaymentModal
        show={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedBookingForModal(null);
        }}
        booking={selectedBookingForModal}
        onPaymentSuccess={() => fetchMyBookings()}
      />

      {/* Rating Modal */}
      <RatingModal
        show={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setSelectedBookingForModal(null);
        }}
        booking={selectedBookingForModal}
        onReviewSubmitted={() => fetchMyBookings()}
      />
    </div>
  );
};

export default CustomerDashboard;
