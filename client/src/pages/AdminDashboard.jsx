import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data States
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [contacts, setContacts] = useState([]);

  // Search & Filter States
  const [bookingStatusFilter, setBookingStatusFilter] = useState('All');
  const [mechanicFilter, setMechanicFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Service Create/Edit Modal state
  const [serviceModal, setServiceModal] = useState({
    show: false,
    isEdit: false,
    id: null,
    name: '',
    category: 'Tyre & Wheel',
    description: '',
    estimatedPrice: 300,
  });

  // Load Overview Data
  const fetchDashboard = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.warn('Admin dashboard error:', err);
    }
  };

  // Load Users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users', { params: { search: userSearch } });
      if (res.data.success) setUsers(res.data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  // Load Mechanics
  const fetchMechanics = async () => {
    try {
      const res = await api.get('/admin/mechanics', { params: { verified: mechanicFilter } });
      if (res.data.success) setMechanics(res.data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  // Load Bookings
  const fetchBookings = async () => {
    try {
      const res = await api.get('/admin/bookings', { params: { status: bookingStatusFilter } });
      if (res.data.success) setBookings(res.data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  // Load Services
  const fetchServices = async () => {
    try {
      const res = await api.get('/services');
      if (res.data.success) setServices(res.data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  // Load Reviews
  const fetchReviews = async () => {
    try {
      const res = await api.get('/admin/reviews');
      if (res.data.success) setReviews(res.data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  // Load Contacts
  const fetchContacts = async () => {
    try {
      const res = await api.get('/contact');
      if (res.data.success) setContacts(res.data.data);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchDashboard(), fetchUsers(), fetchMechanics(), fetchBookings(), fetchServices(), fetchReviews(), fetchContacts()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'mechanics') fetchMechanics();
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'services') fetchServices();
    if (activeTab === 'reviews') fetchReviews();
    if (activeTab === 'contacts') fetchContacts();
  }, [activeTab, bookingStatusFilter, mechanicFilter]);

  // Block/Unblock User
  const handleToggleBlock = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/block`);
      if (res.data.success) {
        toast.info(res.data.message);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to change user status');
    }
  };

  // Verify/Reject Mechanic
  const handleVerifyMechanic = async (mechanicId, isVerified) => {
    try {
      const res = await api.put(`/admin/mechanics/${mechanicId}/verify`, { isVerified });
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMechanics();
        fetchDashboard();
      }
    } catch (err) {
      toast.error('Failed to update mechanic verification');
    }
  };

  // Toggle Mechanic Active
  const handleToggleMechanicActive = async (mechanicId) => {
    try {
      const res = await api.put(`/admin/mechanics/${mechanicId}/toggle-active`);
      if (res.data.success) {
        toast.info(res.data.message);
        fetchMechanics();
      }
    } catch (err) {
      toast.error('Failed to toggle active state');
    }
  };

  // Service Save (Create or Update)
  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (serviceModal.isEdit) {
        await api.put(`/services/${serviceModal.id}`, serviceModal);
        toast.success('Service updated!');
      } else {
        await api.post('/services', serviceModal);
        toast.success('New service created!');
      }
      setServiceModal({ show: false, isEdit: false, id: null, name: '', category: 'Tyre & Wheel', description: '', estimatedPrice: 300 });
      fetchServices();
    } catch (err) {
      toast.error('Failed to save service');
    }
  };

  // Delete Service
  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    try {
      await api.delete(`/services/${id}`);
      toast.success('Service deleted.');
      fetchServices();
    } catch (err) {
      toast.error('Failed to delete service');
    }
  };

  // Delete Review
  const handleDeleteReview = async (id) => {
    if (!window.confirm('Remove this review?')) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast.info('Review removed.');
      fetchReviews();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  // Update Contact Status
  const handleUpdateContact = async (id, status) => {
    try {
      await api.put(`/contact/${id}`, { status });
      toast.success('Status updated.');
      fetchContacts();
    } catch (err) {
      toast.error('Failed to update enquiry status');
    }
  };

  return (
    <div className="py-4" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container-fluid px-lg-4">
        {/* Admin Header */}
        <div className="card rescue-card p-4 mb-4 border-0 shadow-sm text-white" style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #061220 100%)' }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <span className="badge bg-danger fw-bold mb-1">SUPER ADMINISTRATOR</span>
              <h3 className="fw-bold text-white mb-0">Highway Rescue Master Control Center</h3>
              <small className="text-white-50">Operations & Verification Dashboard • India Launch Operations</small>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-light btn-sm" onClick={() => fetchDashboard()}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh Metrics
              </button>
            </div>
          </div>
        </div>

        {/* Admin Navigation Pills */}
        <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'overview' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="bi bi-grid-fill me-1"></i> Overview
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'mechanics' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('mechanics')}
            >
              <i className="bi bi-tools me-1"></i> Mechanics & Verification ({mechanics.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'bookings' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('bookings')}
            >
              <i className="bi bi-card-checklist me-1"></i> All Bookings ({bookings.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'users' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="bi bi-people-fill me-1"></i> Customers ({users.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'services' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('services')}
            >
              <i className="bi bi-list-stars me-1"></i> Services Catalog ({services.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'reviews' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('reviews')}
            >
              <i className="bi bi-star-fill text-warning me-1"></i> Reviews ({reviews.length})
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'contacts' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => setActiveTab('contacts')}
            >
              <i className="bi bi-envelope-fill me-1"></i> Enquiries ({contacts.length})
            </button>
          </li>
        </ul>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && dashboardData && (
          <div>
            <div className="row g-3 mb-4">
              <div className="col-lg-3 col-sm-6">
                <div className="stat-card">
                  <div>
                    <span className="text-muted small fw-semibold">Total Customers</span>
                    <h3 className="fw-bold text-primary mb-0">{dashboardData.totalCustomers}</h3>
                  </div>
                  <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                    <i className="bi bi-people-fill"></i>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-sm-6">
                <div className="stat-card">
                  <div>
                    <span className="text-muted small fw-semibold">Mechanics (Verified / Total)</span>
                    <h3 className="fw-bold text-success mb-0">
                      {dashboardData.verifiedMechanics} / {dashboardData.totalMechanics}
                    </h3>
                  </div>
                  <div className="stat-icon bg-success bg-opacity-10 text-success">
                    <i className="bi bi-tools"></i>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-sm-6">
                <div className="stat-card">
                  <div>
                    <span className="text-muted small fw-semibold">Total Bookings</span>
                    <h3 className="fw-bold text-warning mb-0">{dashboardData.totalBookings}</h3>
                  </div>
                  <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                    <i className="bi bi-calendar2-check-fill"></i>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-sm-6">
                <div className="stat-card">
                  <div>
                    <span className="text-muted small fw-semibold">Total Platform Volume</span>
                    <h3 className="fw-bold text-danger mb-0">₹{dashboardData.totalRevenue}</h3>
                  </div>
                  <div className="stat-icon bg-danger bg-opacity-10 text-danger">
                    <i className="bi bi-cash-stack"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Breakdown Bar */}
            <div className="card rescue-card p-4 mb-4 border-0 shadow-sm bg-white">
              <h6 className="fw-bold text-dark mb-3">Booking Status Breakdown</h6>
              <div className="row g-3 text-center">
                <div className="col-3">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small">Pending Dispatches</span>
                    <h4 className="fw-bold text-warning mb-0 mt-1">{dashboardData.pendingBookings}</h4>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small">In-Progress / Active</span>
                    <h4 className="fw-bold text-primary mb-0 mt-1">{dashboardData.activeBookings}</h4>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small">Completed Jobs</span>
                    <h4 className="fw-bold text-success mb-0 mt-1">{dashboardData.completedBookings}</h4>
                  </div>
                </div>
                <div className="col-3">
                  <div className="p-3 rounded-3 bg-light border">
                    <span className="text-muted small">Cancelled</span>
                    <h4 className="fw-bold text-secondary mb-0 mt-1">{dashboardData.cancelledBookings}</h4>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings Feed */}
            <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
              <h5 className="fw-bold text-navy mb-3">Recent 10 Highway Bookings</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle small">
                  <thead className="table-light">
                    <tr>
                      <th>Booking ID</th>
                      <th>Customer</th>
                      <th>Mechanic</th>
                      <th>Service</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentBookings?.map((b) => (
                      <tr key={b._id}>
                        <td><strong>{b.bookingId}</strong></td>
                        <td>{b.customer?.name} ({b.customer?.phone})</td>
                        <td>{b.mechanic?.shopName || 'Pending Assignment'}</td>
                        <td>{b.serviceType}</td>
                        <td>{new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</td>
                        <td>
                          <span className={`badge ${b.status === 'Completed' ? 'bg-success' : b.status === 'Cancelled' ? 'bg-secondary' : 'bg-primary'}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MECHANIC MANAGEMENT */}
        {activeTab === 'mechanics' && (
          <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
              <h5 className="fw-bold text-navy mb-0">Mechanic & Garage Partners ({mechanics.length})</h5>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm"
                  value={mechanicFilter}
                  onChange={(e) => setMechanicFilter(e.target.value)}
                  style={{ width: '180px' }}
                >
                  <option value="">All Verification Status</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Pending Approval</option>
                </select>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Garage Name</th>
                    <th>Technician</th>
                    <th>Phone / Email</th>
                    <th>City / Address</th>
                    <th>Status</th>
                    <th>Rating</th>
                    <th>Verification Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mechanics.map((m) => (
                    <tr key={m._id}>
                      <td>
                        <strong>{m.shopName}</strong>
                        <div className="text-muted small">Exp: {m.experience} yrs • Radius: {m.serviceRadius}km</div>
                      </td>
                      <td>{m.name}</td>
                      <td>
                        <div>{m.phone}</div>
                        <small className="text-muted">{m.email}</small>
                      </td>
                      <td>
                        <small className="text-muted line-clamp-1">{m.shopAddress}, {m.city}</small>
                      </td>
                      <td>
                        <span className={`badge ${m.isOnline ? 'badge-online' : 'badge-offline'} me-1`}>
                          {m.isOnline ? 'Online' : 'Offline'}
                        </span>
                        <span className={`badge ${m.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {m.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-warning text-dark fw-bold">⭐ {m.rating || '4.8'}</span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          {m.isVerified ? (
                            <button
                              className="btn btn-outline-danger btn-sm py-0 px-2"
                              onClick={() => handleVerifyMechanic(m._id, false)}
                              title="Revoke Verification"
                            >
                              Revoke
                            </button>
                          ) : (
                            <button
                              className="btn btn-success btn-sm py-0 px-2 fw-bold"
                              onClick={() => handleVerifyMechanic(m._id, true)}
                            >
                              ✓ Verify
                            </button>
                          )}
                          <button
                            className="btn btn-outline-secondary btn-sm py-0 px-2"
                            onClick={() => handleToggleMechanicActive(m._id)}
                          >
                            {m.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: BOOKING MANAGEMENT */}
        {activeTab === 'bookings' && (
          <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
              <h5 className="fw-bold text-navy mb-0">Highway Booking Management ({bookings.length})</h5>
              <select
                className="form-select form-select-sm"
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                style={{ width: '180px' }}
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Accepted">Accepted</option>
                <option value="On The Way">On The Way</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Mechanic</th>
                    <th>Service</th>
                    <th>Location</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b._id}>
                      <td>
                        <strong>{b.bookingId}</strong>
                        {b.isEmergency && <span className="badge badge-emergency ms-1" style={{ fontSize: '0.65rem' }}>SOS</span>}
                      </td>
                      <td>
                        <div className="fw-semibold small">{b.customer?.name}</div>
                        <small className="text-muted">{b.customer?.phone} • {b.vehicleNumber}</small>
                      </td>
                      <td>
                        {b.mechanic ? (
                          <div>
                            <div className="fw-semibold small">{b.mechanic.shopName}</div>
                            <small className="text-muted">{b.mechanic.phone}</small>
                          </div>
                        ) : (
                          <span className="text-muted small">Unassigned Broadcast</span>
                        )}
                      </td>
                      <td>{b.serviceType}</td>
                      <td><small className="text-muted line-clamp-1">{b.customerLocation?.address}</small></td>
                      <td>
                        <strong>₹{b.finalCost || b.estimatedCost}</strong>
                        <div className="small text-muted">{b.paymentStatus || 'Pending'}</div>
                      </td>
                      <td>
                        <span className={`badge ${b.status === 'Completed' ? 'bg-success' : b.status === 'Cancelled' ? 'bg-secondary' : 'bg-primary'}`}>
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-navy mb-0">Registered Customers ({users.length})</h5>
              <div className="input-group" style={{ maxWidth: '300px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Search customer name / phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <button className="btn btn-outline-secondary btn-sm" onClick={fetchUsers}>
                  Search
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Customer Name</th>
                    <th>Email</th>
                    <th>Mobile</th>
                    <th>Vehicle</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>{u.vehicleType} ({u.vehicleNumber || 'N/A'})</td>
                      <td>
                        <span className={`badge ${u.isBlocked ? 'bg-danger' : 'bg-success'}`}>
                          {u.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm py-0 px-2 ${u.isBlocked ? 'btn-success' : 'btn-outline-danger'}`}
                          onClick={() => handleToggleBlock(u._id)}
                        >
                          {u.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: SERVICE MANAGEMENT */}
        {activeTab === 'services' && (
          <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold text-navy mb-0">Service Catalog ({services.length})</h5>
              <button
                className="btn btn-primary-rescue btn-sm fw-bold"
                onClick={() => setServiceModal({ show: true, isEdit: false, id: null, name: '', category: 'Tyre & Wheel', description: '', estimatedPrice: 300 })}
              >
                + Add New Service
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Service Name</th>
                    <th>Category</th>
                    <th>Base Price</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s._id}>
                      <td><strong>{s.name}</strong></td>
                      <td><span className="badge bg-light text-dark border">{s.category}</span></td>
                      <td>₹{s.estimatedPrice}</td>
                      <td><small className="text-muted line-clamp-1">{s.description}</small></td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-outline-primary btn-sm py-0 px-2"
                            onClick={() => setServiceModal({ show: true, isEdit: true, id: s._id, name: s.name, category: s.category, description: s.description, estimatedPrice: s.estimatedPrice })}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-outline-danger btn-sm py-0 px-2"
                            onClick={() => handleDeleteService(s._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: REVIEWS MANAGEMENT */}
        {activeTab === 'reviews' && (
          <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
            <h5 className="fw-bold text-navy mb-4">Customer Ratings & Reviews ({reviews.length})</h5>
            {reviews.length === 0 ? (
              <p className="text-muted small">No customer reviews logged yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Customer</th>
                      <th>Mechanic</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r._id}>
                        <td><strong>{r.customer?.name}</strong></td>
                        <td>{r.mechanic?.shopName}</td>
                        <td><span className="badge bg-warning text-dark">⭐ {r.rating} / 5</span></td>
                        <td><small className="text-muted">{r.comment || 'No text comment'}</small></td>
                        <td><small className="text-muted">{new Date(r.createdAt).toLocaleDateString('en-IN')}</small></td>
                        <td>
                          <button
                            className="btn btn-outline-danger btn-sm py-0 px-2"
                            onClick={() => handleDeleteReview(r._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: CONTACT ENQUIRIES */}
        {activeTab === 'contacts' && (
          <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
            <h5 className="fw-bold text-navy mb-4">Customer & Driver Enquiries ({contacts.length})</h5>
            {contacts.length === 0 ? (
              <p className="text-muted small">No contact messages received.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Contact Info</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => (
                      <tr key={c._id}>
                        <td><strong>{c.name}</strong></td>
                        <td>
                          <div>{c.phone}</div>
                          <small className="text-muted">{c.email}</small>
                        </td>
                        <td><span className="badge bg-light text-dark border">{c.subject}</span></td>
                        <td><small className="text-muted">{c.message}</small></td>
                        <td>
                          <span className={`badge ${c.status === 'Resolved' ? 'bg-success' : c.status === 'In Progress' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={c.status}
                            onChange={(e) => handleUpdateContact(c._id, e.target.value)}
                            style={{ width: '130px' }}
                          >
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service Modal */}
      {serviceModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-navy-rescue text-white">
                <h5 className="modal-title fw-bold text-white mb-0">
                  {serviceModal.isEdit ? 'Edit Service' : 'Add New Highway Service'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setServiceModal({ ...serviceModal, show: false })}></button>
              </div>

              <form onSubmit={handleServiceSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small">Service Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={serviceModal.name}
                      onChange={(e) => setServiceModal({ ...serviceModal, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold small">Category *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={serviceModal.category}
                        onChange={(e) => setServiceModal({ ...serviceModal, category: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold small">Base Price (₹) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={serviceModal.estimatedPrice}
                        onChange={(e) => setServiceModal({ ...serviceModal, estimatedPrice: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Description *</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={serviceModal.description}
                      onChange={(e) => setServiceModal({ ...serviceModal, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setServiceModal({ ...serviceModal, show: false })}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-rescue rounded-pill px-4 fw-bold">
                    Save Service
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
