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
  const [mechanicFilter, setMechanicFilter] = useState('All');
  const [userSearch, setUserSearch] = useState('');

  // Mechanic Lifecycle Modals
  const [mechanicDetailModal, setMechanicDetailModal] = useState({
    show: false,
    mechanic: null,
  });
  const [actionModal, setActionModal] = useState({
    show: false,
    type: 'reject', // 'reject' or 'suspend'
    mechanic: null,
    reason: '',
  });

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

  // Commission & Settlements State
  const [earningsData, setEarningsData] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [settlementModal, setSettlementModal] = useState({
    show: false,
    type: 'reconcile-cash',
    mechanic: null,
    bookingIds: [],
    amount: 0,
    referenceNumber: '',
    paymentMethod: 'UPI',
    notes: '',
  });

  const fetchEarnings = async (range = timeRange) => {
    try {
      const res = await api.get('/admin/earnings', { params: { timeRange: range } });
      if (res.data.success) {
        setEarningsData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load admin earnings:', err);
    }
  };

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
  const fetchMechanics = async (filter = mechanicFilter) => {
    try {
      const params = {};
      if (filter && filter !== 'All') {
        params.approvalStatus = filter;
      }
      const res = await api.get('/admin/mechanics', { params });
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
    if (activeTab === 'earnings') fetchEarnings();
  }, [activeTab, bookingStatusFilter, mechanicFilter]);

  // Open Settlement Modal
  const handleOpenSettlement = (type, report) => {
    const isCash = type === 'reconcile-cash';
    setSettlementModal({
      show: true,
      type,
      mechanic: { _id: report.mechanicId, name: report.name, shopName: report.shopName },
      bookingIds: report.pendingBookingIds || [],
      amount: isCash ? report.cashCommissionOwed : report.onlinePayoutPending,
      referenceNumber: `${isCash ? 'CASH-REC' : 'PAYOUT'}-${Date.now().toString().slice(-6)}`,
      paymentMethod: isCash ? 'Cash_Reconciled' : 'Bank_Transfer',
      notes: isCash ? 'Cash commission reconciled' : 'Online payout disbursed',
    });
  };

  // Submit Settlement
  const handleSettlementSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint =
        settlementModal.type === 'reconcile-cash'
          ? '/admin/settlements/reconcile-cash'
          : '/admin/settlements/payout-mechanic';

      const res = await api.post(endpoint, {
        mechanicId: settlementModal.mechanic._id,
        bookingIds: settlementModal.bookingIds,
        referenceNumber: settlementModal.referenceNumber,
        paymentMethod: settlementModal.paymentMethod,
        notes: settlementModal.notes,
      });

      if (res.data.success) {
        toast.success(res.data.message);
        setSettlementModal((prev) => ({ ...prev, show: false }));
        fetchEarnings();
        fetchDashboard();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Settlement failed');
    }
  };

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

  // Approve Mechanic
  const handleApproveMechanic = async (mechanicId) => {
    try {
      const res = await api.put(`/admin/mechanics/${mechanicId}/approve`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMechanics();
        fetchDashboard();
        if (mechanicDetailModal.show) {
          setMechanicDetailModal((prev) => ({ ...prev, show: false }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve mechanic');
    }
  };

  // Open Reject / Suspend Modal
  const handleOpenActionModal = (type, mech) => {
    setActionModal({
      show: true,
      type,
      mechanic: mech,
      reason: '',
    });
  };

  // Submit Reject / Suspend
  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal.mechanic) return;
    try {
      const endpoint =
        actionModal.type === 'reject'
          ? `/admin/mechanics/${actionModal.mechanic._id}/reject`
          : `/admin/mechanics/${actionModal.mechanic._id}/suspend`;

      const res = await api.put(endpoint, { reason: actionModal.reason });
      if (res.data.success) {
        toast.success(res.data.message);
        setActionModal({ show: false, type: 'reject', mechanic: null, reason: '' });
        fetchMechanics();
        fetchDashboard();
        if (mechanicDetailModal.show) {
          setMechanicDetailModal((prev) => ({ ...prev, show: false }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${actionModal.type} mechanic`);
    }
  };

  // Reactivate Mechanic
  const handleReactivateMechanic = async (mechanicId) => {
    try {
      const res = await api.put(`/admin/mechanics/${mechanicId}/reactivate`);
      if (res.data.success) {
        toast.success(res.data.message);
        fetchMechanics();
        fetchDashboard();
        if (mechanicDetailModal.show) {
          setMechanicDetailModal((prev) => ({ ...prev, show: false }));
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reactivate mechanic');
    }
  };

  // Verify/Reject Mechanic (legacy support)
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
              className={`nav-link rounded-pill fw-semibold ${activeTab === 'earnings' ? 'active bg-navy-rescue' : 'text-dark bg-white border'}`}
              onClick={() => {
                setActiveTab('earnings');
                fetchEarnings();
              }}
            >
              <i className="bi bi-cash-coin me-1"></i> Commission & Settlements
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
              <div>
                <h5 className="fw-bold text-navy mb-1">Ahmedabad Mechanic & Garage Partners ({mechanics.length})</h5>
                <small className="text-muted">Review, verify, approve or suspend roadside assistance service providers</small>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <div className="btn-group btn-group-sm">
                  {['All', 'Pending', 'Approved', 'Rejected', 'Suspended'].map((status) => (
                    <button
                      key={status}
                      className={`btn ${mechanicFilter === status ? 'btn-primary-rescue' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        setMechanicFilter(status);
                        fetchMechanics(status);
                      }}
                    >
                      {status === 'Pending' ? 'Pending Review' : status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle small">
                <thead className="table-light">
                  <tr>
                    <th>Garage & Category</th>
                    <th>Technician Contact</th>
                    <th>Corridor / Address</th>
                    <th>Approval Status</th>
                    <th>Live Status</th>
                    <th>Rating</th>
                    <th>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mechanics.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No mechanics found matching "{mechanicFilter}" status.
                      </td>
                    </tr>
                  ) : (
                    mechanics.map((m) => {
                      const status = m.approvalStatus || (m.isVerified ? 'Approved' : 'Pending');
                      return (
                        <tr key={m._id}>
                          <td>
                            <strong>{m.shopName}</strong>
                            <div className="d-flex align-items-center gap-1 mt-1">
                              <span className="badge bg-secondary" style={{ fontSize: '0.68rem' }}>
                                {m.serviceCategory || 'Both'}
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.72rem' }}>
                                Exp: {m.experience || 2} yrs • {m.serviceRadius || 25} km
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="fw-bold text-dark">{m.name}</div>
                            <div>{m.phone}</div>
                            <small className="text-muted">{m.email}</small>
                          </td>
                          <td>
                            <div className="fw-semibold text-primary">{m.serviceArea || 'Ahmedabad'}</div>
                            <small className="text-muted line-clamp-1">{m.shopAddress}</small>
                          </td>
                          <td>
                            {status === 'Approved' ? (
                              <span className="badge bg-success">
                                <i className="bi bi-patch-check-fill me-1"></i> Approved
                              </span>
                            ) : status === 'Pending' ? (
                              <span className="badge bg-warning text-dark">
                                <i className="bi bi-hourglass-split me-1"></i> Pending
                              </span>
                            ) : status === 'Rejected' ? (
                              <span className="badge bg-danger" title={m.rejectionReason}>
                                <i className="bi bi-x-circle-fill me-1"></i> Rejected
                              </span>
                            ) : (
                              <span className="badge bg-dark" title={m.suspensionReason}>
                                <i className="bi bi-slash-circle-fill me-1"></i> Suspended
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${m.isOnline ? 'badge-online' : 'badge-offline'}`}>
                              {m.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-warning text-dark fw-bold">⭐ {m.rating || '4.8'}</span>
                          </td>
                          <td>
                            <div className="d-flex gap-1 flex-wrap">
                              <button
                                className="btn btn-outline-primary btn-sm py-0 px-2"
                                onClick={() => setMechanicDetailModal({ show: true, mechanic: m })}
                                title="View profile & uploaded ID proof"
                              >
                                View
                              </button>

                              {status === 'Pending' && (
                                <>
                                  <button
                                    className="btn btn-success btn-sm py-0 px-2 fw-bold"
                                    onClick={() => handleApproveMechanic(m._id)}
                                    title="Approve & Verify"
                                  >
                                    ✓ Approve
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm py-0 px-2"
                                    onClick={() => handleOpenActionModal('reject', m)}
                                    title="Reject application"
                                  >
                                    ✗ Reject
                                  </button>
                                </>
                              )}

                              {status === 'Approved' && (
                                <button
                                  className="btn btn-outline-danger btn-sm py-0 px-2"
                                  onClick={() => handleOpenActionModal('suspend', m)}
                                  title="Suspend mechanic account"
                                >
                                  Suspend
                                </button>
                              )}

                              {status === 'Rejected' && (
                                <button
                                  className="btn btn-outline-success btn-sm py-0 px-2 fw-bold"
                                  onClick={() => handleApproveMechanic(m._id)}
                                  title="Re-approve application"
                                >
                                  Approve
                                </button>
                              )}

                              {status === 'Suspended' && (
                                <button
                                  className="btn btn-success btn-sm py-0 px-2 fw-bold"
                                  onClick={() => handleReactivateMechanic(m._id)}
                                  title="Reactivate mechanic account"
                                >
                                  Reactivate
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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

        {/* TAB 8: COMMISSION & SETTLEMENTS */}
        {activeTab === 'earnings' && (
          <div>
            {/* Header & Date Filters */}
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
              <div>
                <h5 className="fw-bold text-navy mb-0">Platform 10% Commission & Financial Settlements</h5>
                <small className="text-muted">
                  Automated 10% platform share deduction, cash commission reconciliation, and mechanic payouts.
                </small>
              </div>

              {/* Date Filters */}
              <div className="btn-group" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${timeRange === 'all' ? 'btn-navy-rescue' : 'btn-outline-secondary bg-white'}`}
                  onClick={() => {
                    setTimeRange('all');
                    fetchEarnings('all');
                  }}
                >
                  All Time
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${timeRange === 'today' ? 'btn-navy-rescue' : 'btn-outline-secondary bg-white'}`}
                  onClick={() => {
                    setTimeRange('today');
                    fetchEarnings('today');
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${timeRange === '7days' ? 'btn-navy-rescue' : 'btn-outline-secondary bg-white'}`}
                  onClick={() => {
                    setTimeRange('7days');
                    fetchEarnings('7days');
                  }}
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${timeRange === '30days' ? 'btn-navy-rescue' : 'btn-outline-secondary bg-white'}`}
                  onClick={() => {
                    setTimeRange('30days');
                    fetchEarnings('30days');
                  }}
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {earningsData ? (
              <>
                {/* 6 Key Financial Metric Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white h-100">
                      <span className="text-muted small fw-semibold">Completed Bookings</span>
                      <h4 className="fw-bold text-dark mb-0 mt-1">{earningsData.summary.totalCompletedBookings}</h4>
                      <small className="text-muted mt-auto">Paid jobs</small>
                    </div>
                  </div>

                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white h-100">
                      <span className="text-muted small fw-semibold">Gross Booking Value</span>
                      <h4 className="fw-bold text-primary mb-0 mt-1">₹{earningsData.summary.grossBookingValue}</h4>
                      <small className="text-muted mt-auto">Total billed</small>
                    </div>
                  </div>

                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white h-100">
                      <span className="text-muted small fw-semibold">10% Platform Commission</span>
                      <h4 className="fw-bold text-success mb-0 mt-1">₹{earningsData.summary.totalPlatformCommission}</h4>
                      <small className="text-success mt-auto">Platform gross share</small>
                    </div>
                  </div>

                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white h-100">
                      <span className="text-muted small fw-semibold">Commission Collected</span>
                      <h4 className="fw-bold text-navy mb-0 mt-1">₹{earningsData.summary.commissionCollected}</h4>
                      <small className="text-muted mt-auto">In platform account</small>
                    </div>
                  </div>

                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white h-100">
                      <span className="text-muted small fw-semibold">Outstanding Cash Comm.</span>
                      <h4 className="fw-bold text-danger mb-0 mt-1">₹{earningsData.summary.outstandingCommission}</h4>
                      <small className="text-danger mt-auto">With mechanics</small>
                    </div>
                  </div>

                  <div className="col-lg-2 col-md-4 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white h-100">
                      <span className="text-muted small fw-semibold">Mechanic Payouts Due</span>
                      <h4 className="fw-bold text-warning text-dark mb-0 mt-1">₹{earningsData.summary.mechanicPayoutsDue}</h4>
                      <small className="text-muted mt-auto">Online 90% share</small>
                    </div>
                  </div>
                </div>

                {/* SECTION: Mechanic-Wise Commission & Settlement Report */}
                <div className="card rescue-card p-4 mb-4 border-0 shadow-sm bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="fw-bold text-dark mb-0">Mechanic-Wise Commission & Payout Status</h6>
                    <span className="badge bg-light text-dark border">
                      {earningsData.mechanicReports.length} Active Partners
                    </span>
                  </div>

                  {earningsData.mechanicReports.length === 0 ? (
                    <p className="text-muted small mb-0">No mechanic reports available for the selected period.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle small">
                        <thead className="table-light">
                          <tr>
                            <th>Mechanic / Garage</th>
                            <th>Jobs</th>
                            <th>Gross Billed</th>
                            <th>10% Comm.</th>
                            <th>90% Earning</th>
                            <th>Cash Held</th>
                            <th>Cash Comm. Owed</th>
                            <th>Online Payout Due</th>
                            <th>Net Balance</th>
                            <th>Reconciliation Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earningsData.mechanicReports.map((report) => (
                            <tr key={report.mechanicId}>
                              <td>
                                <strong className="text-dark d-block">{report.shopName}</strong>
                                <small className="text-muted">{report.name} • {report.phone}</small>
                              </td>
                              <td><span className="badge bg-light text-dark border">{report.totalJobs}</span></td>
                              <td>₹{report.grossRevenue}</td>
                              <td className="text-success fw-bold">₹{report.platformCommission}</td>
                              <td>₹{report.mechanicEarnings}</td>
                              <td>₹{report.cashCollected}</td>
                              <td className="text-danger fw-bold">
                                {report.cashCommissionOwed > 0 ? `₹${report.cashCommissionOwed}` : '₹0'}
                              </td>
                              <td className="text-primary fw-bold">
                                {report.onlinePayoutPending > 0 ? `₹${report.onlinePayoutPending}` : '₹0'}
                              </td>
                              <td>
                                {report.netBalance > 0 ? (
                                  <span className="badge bg-primary">Platform Owes ₹{report.netBalance}</span>
                                ) : report.netBalance < 0 ? (
                                  <span className="badge bg-danger">Mechanic Owes ₹{Math.abs(report.netBalance)}</span>
                                ) : (
                                  <span className="badge bg-success">Settled (₹0)</span>
                                )}
                              </td>
                              <td>
                                <div className="d-flex gap-1">
                                  {report.cashCommissionOwed > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-danger btn-sm py-1 px-2"
                                      title="Reconcile Cash Commission"
                                      onClick={() => handleOpenSettlement('reconcile-cash', report)}
                                    >
                                      Reconcile Cash
                                    </button>
                                  )}
                                  {report.onlinePayoutPending > 0 && (
                                    <button
                                      type="button"
                                      className="btn btn-outline-success btn-sm py-1 px-2"
                                      title="Disburse Online Payout"
                                      onClick={() => handleOpenSettlement('payout-mechanic', report)}
                                    >
                                      Pay Mechanic
                                    </button>
                                  )}
                                  {report.cashCommissionOwed === 0 && report.onlinePayoutPending === 0 && (
                                    <span className="text-muted small">All Settled</span>
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

                {/* SECTION: Settlement History Ledger */}
                <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
                  <h6 className="fw-bold text-dark mb-3">Settlement History Ledger</h6>
                  {earningsData.settlementHistory.length === 0 ? (
                    <p className="text-muted small mb-0">No settlement history logged yet.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle small">
                        <thead className="table-light">
                          <tr>
                            <th>Settlement ID</th>
                            <th>Date</th>
                            <th>Mechanic</th>
                            <th>Settlement Type</th>
                            <th>Amount</th>
                            <th>Payment Method</th>
                            <th>Reference</th>
                            <th>Processed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earningsData.settlementHistory.map((s) => (
                            <tr key={s._id}>
                              <td><strong className="text-navy">{s.settlementId}</strong></td>
                              <td>{new Date(s.createdAt).toLocaleDateString('en-IN')}</td>
                              <td>{s.mechanic?.shopName || s.mechanic?.name}</td>
                              <td>
                                <span
                                  className={`badge ${
                                    s.settlementType === 'Cash_Commission_Reconciliation'
                                      ? 'bg-danger bg-opacity-10 text-danger border border-danger'
                                      : 'bg-success bg-opacity-10 text-success border border-success'
                                  }`}
                                >
                                  {s.settlementType.replace(/_/g, ' ')}
                                </span>
                              </td>
                              <td><strong className="text-dark">₹{s.amount}</strong></td>
                              <td><span className="badge bg-light text-dark border">{s.paymentMethod}</span></td>
                              <td><code>{s.referenceNumber || 'N/A'}</code></td>
                              <td>{s.processedBy?.name || 'Administrator'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted small mt-2">Loading financial analytics & settlements...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Admin Settlement / Reconciliation Modal */}
      {settlementModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1070 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-navy-rescue text-white py-3" style={{ backgroundColor: '#0b1e36' }}>
                <h5 className="modal-title fw-bold text-white mb-0">
                  {settlementModal.type === 'reconcile-cash'
                    ? 'Reconcile 10% Cash Commission'
                    : 'Disburse Online Payout to Mechanic'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSettlementModal({ ...settlementModal, show: false })}
                ></button>
              </div>

              <form onSubmit={handleSettlementSubmit}>
                <div className="modal-body p-4">
                  <div className="card bg-light border-0 p-3 mb-3 rounded-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Mechanic Partner:</span>
                      <strong>{settlementModal.mechanic?.shopName} ({settlementModal.mechanic?.name})</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted small">Bookings in Batch:</span>
                      <span>{settlementModal.bookingIds.length} bookings</span>
                    </div>
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-dark">Total Settlement Amount:</span>
                      <span className={`fs-4 fw-bold ${settlementModal.type === 'reconcile-cash' ? 'text-danger' : 'text-success'}`}>
                        ₹{settlementModal.amount}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Payment / Transfer Method *</label>
                    <select
                      className="form-select"
                      value={settlementModal.paymentMethod}
                      onChange={(e) => setSettlementModal({ ...settlementModal, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Bank_Transfer">NEFT / IMPS / RTGS Bank Transfer</option>
                      <option value="Cash_Reconciled">Cash Collected in Hand</option>
                      <option value="Direct_Offset">Direct Offset / Adjustment</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Transaction Reference / UTR Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settlementModal.referenceNumber}
                      onChange={(e) => setSettlementModal({ ...settlementModal, referenceNumber: e.target.value })}
                      placeholder="e.g. UTR123456789 or REC-2026-001"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Notes / Audit Remarks</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={settlementModal.notes}
                      onChange={(e) => setSettlementModal({ ...settlementModal, notes: e.target.value })}
                      placeholder="Optional settlement remarks..."
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => setSettlementModal({ ...settlementModal, show: false })}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn rounded-pill px-4 fw-bold ${
                      settlementModal.type === 'reconcile-cash' ? 'btn-danger' : 'btn-success'
                    }`}
                  >
                    Confirm Settlement (₹{settlementModal.amount})
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

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

      {/* Reject / Suspend Reason Modal */}
      {actionModal.show && actionModal.mechanic && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-danger text-white py-3">
                <h5 className="modal-title fw-bold">
                  {actionModal.type === 'reject' ? 'Reject Mechanic Application' : 'Suspend Mechanic Account'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setActionModal({ show: false, type: 'reject', mechanic: null, reason: '' })}
                ></button>
              </div>
              <form onSubmit={handleActionSubmit}>
                <div className="modal-body p-4">
                  <p className="small text-muted mb-3">
                    Target Mechanic: <strong>{actionModal.mechanic.name}</strong> ({actionModal.mechanic.shopName})
                  </p>
                  <label className="form-label fw-bold small">
                    {actionModal.type === 'reject' ? 'Reason for Rejection *' : 'Reason for Suspension *'}
                  </label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder={
                      actionModal.type === 'reject'
                        ? 'e.g. Identity document unreadable or garage address unverified in Ahmedabad.'
                        : 'e.g. Repeated customer complaints or invalid license documentation.'
                    }
                    value={actionModal.reason}
                    onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                    required
                  ></textarea>
                  <div className="form-text small text-muted mt-2">
                    This reason will be displayed on the mechanic's dashboard and sent via notification.
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-3"
                    onClick={() => setActionModal({ show: false, type: 'reject', mechanic: null, reason: '' })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger rounded-pill px-4 fw-bold">
                    Confirm {actionModal.type === 'reject' ? 'Rejection' : 'Suspension'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mechanic Full Details Modal (including ID Document proof) */}
      {mechanicDetailModal.show && mechanicDetailModal.mechanic && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-navy text-white py-3">
                <h5 className="modal-title fw-bold">Mechanic Partner Profile & Verification</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setMechanicDetailModal({ show: false, mechanic: null })}
                ></button>
              </div>
              <div className="modal-body p-4">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold">Garage / Shop Name:</label>
                    <div className="fw-bold fs-6">{mechanicDetailModal.mechanic.shopName}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold">Technician Full Name:</label>
                    <div className="fw-bold fs-6">{mechanicDetailModal.mechanic.name}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold">Mobile Phone:</label>
                    <div>{mechanicDetailModal.mechanic.phone}</div>
                  </div>
                  <div className="col-md-6">
                    <label className="text-muted small fw-semibold">Email Address:</label>
                    <div>{mechanicDetailModal.mechanic.email}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Service Category:</label>
                    <div>
                      <span className="badge bg-primary">{mechanicDetailModal.mechanic.serviceCategory || 'Both'}</span>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Ahmedabad Area:</label>
                    <div className="fw-semibold text-dark">{mechanicDetailModal.mechanic.serviceArea || 'Ahmedabad'}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="text-muted small fw-semibold">Radius & Experience:</label>
                    <div>{mechanicDetailModal.mechanic.serviceRadius || 25} km • {mechanicDetailModal.mechanic.experience || 2} yrs exp</div>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small fw-semibold">Garage Address:</label>
                    <div>{mechanicDetailModal.mechanic.shopAddress}, {mechanicDetailModal.mechanic.city}, {mechanicDetailModal.mechanic.state} - {mechanicDetailModal.mechanic.pincode}</div>
                  </div>
                  <div className="col-12">
                    <label className="text-muted small fw-semibold">Services Offered:</label>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {mechanicDetailModal.mechanic.services?.map((s, idx) => (
                        <span key={idx} className="badge bg-light text-dark border">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="col-12 border-top pt-3">
                    <label className="text-muted small fw-semibold">Current Verification Status:</label>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <span className={`badge ${
                        mechanicDetailModal.mechanic.approvalStatus === 'Approved'
                          ? 'bg-success'
                          : mechanicDetailModal.mechanic.approvalStatus === 'Pending'
                          ? 'bg-warning text-dark'
                          : 'bg-danger'
                      }`}>
                        {mechanicDetailModal.mechanic.approvalStatus || (mechanicDetailModal.mechanic.isVerified ? 'Approved' : 'Pending')}
                      </span>
                      {mechanicDetailModal.mechanic.rejectionReason && (
                        <span className="text-danger small">
                          (Rejection reason: {mechanicDetailModal.mechanic.rejectionReason})
                        </span>
                      )}
                      {mechanicDetailModal.mechanic.suspensionReason && (
                        <span className="text-danger small">
                          (Suspension reason: {mechanicDetailModal.mechanic.suspensionReason})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Uploaded ID Document */}
                  <div className="col-12 border-top pt-3">
                    <label className="text-muted small fw-semibold">Identity / Shop Verification Document:</label>
                    {mechanicDetailModal.mechanic.idDocument ? (
                      <div className="mt-2">
                        <a
                          href={mechanicDetailModal.mechanic.idDocument}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm"
                        >
                          <i className="bi bi-file-earmark-check me-1"></i> View Uploaded Proof Document
                        </a>
                      </div>
                    ) : (
                      <div className="text-muted small fst-italic mt-1">No separate document uploaded.</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-light justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-3"
                  onClick={() => setMechanicDetailModal({ show: false, mechanic: null })}
                >
                  Close
                </button>
                <div className="d-flex gap-2">
                  {mechanicDetailModal.mechanic.approvalStatus !== 'Approved' && (
                    <button
                      type="button"
                      className="btn btn-success rounded-pill px-4 fw-bold"
                      onClick={() => handleApproveMechanic(mechanicDetailModal.mechanic._id)}
                    >
                      ✓ Approve Mechanic
                    </button>
                  )}
                  {mechanicDetailModal.mechanic.approvalStatus === 'Pending' && (
                    <button
                      type="button"
                      className="btn btn-danger rounded-pill px-4 fw-bold"
                      onClick={() => handleOpenActionModal('reject', mechanicDetailModal.mechanic)}
                    >
                      ✗ Reject
                    </button>
                  )}
                  {mechanicDetailModal.mechanic.approvalStatus === 'Approved' && (
                    <button
                      type="button"
                      className="btn btn-outline-danger rounded-pill px-4"
                      onClick={() => handleOpenActionModal('suspend', mechanicDetailModal.mechanic)}
                    >
                      Suspend Account
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
