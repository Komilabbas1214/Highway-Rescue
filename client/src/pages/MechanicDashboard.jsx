import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const STATUS_PROGRESSION = ['Accepted', 'On The Way', 'Arrived', 'In Progress', 'Completed'];

const MechanicDashboard = () => {
  const { user, mechanic, toggleMechanicAvailability } = useAuth();
  const { socket } = useSocket();

  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingRequests: 0,
    acceptedRequests: 0,
    completedJobs: 0,
    totalEarnings: 0,
    isOnline: mechanic?.isOnline || true,
    isVerified: mechanic?.isVerified || false,
    rating: mechanic?.rating || 4.8,
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Completed job final cost input state modal
  const [completeJobModal, setCompleteJobModal] = useState({
    show: false,
    booking: null,
    finalCost: 400,
  });

  const fetchMechanicData = async () => {
    try {
      const [statsRes, requestsRes] = await Promise.all([
        api.get('/mechanics/dashboard/stats'),
        api.get('/bookings/requests'),
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.data);
      }
      if (requestsRes.data.success) {
        setPendingRequests(requestsRes.data.pendingRequests || []);
        setActiveJobs(requestsRes.data.activeJobs || []);
        setCompletedJobs(requestsRes.data.completedJobs || []);
      }
    } catch (err) {
      console.warn('Failed to load mechanic dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMechanicData();
  }, []);

  // Listen to live socket events for incoming requests and status updates
  useEffect(() => {
    if (!socket) return;

    socket.on('newBookingRequest', () => {
      fetchMechanicData();
    });

    socket.on('bookingCancelled', () => {
      fetchMechanicData();
    });

    return () => {
      socket.off('newBookingRequest');
      socket.off('bookingCancelled');
    };
  }, [socket]);

  // Handle Online/Offline toggle
  const handleToggleOnline = async () => {
    const newStatus = !stats.isOnline;
    const res = await toggleMechanicAvailability(newStatus);
    if (res?.success) {
      setStats((prev) => ({ ...prev, isOnline: newStatus }));
    }
  };

  // Handle Accept Booking
  const handleAcceptBooking = async (bookingId) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/accept`);
      if (res.data.success) {
        toast.success('🎉 Booking accepted! Customer contact details are now visible.');
        fetchMechanicData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept booking');
    }
  };

  // Handle Reject Booking
  const handleRejectBooking = async (bookingId) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/reject`);
      if (res.data.success) {
        toast.info('Booking request declined.');
        fetchMechanicData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject booking');
    }
  };

  // Advance Job Status
  const handleUpdateStatus = async (bookingId, nextStatus) => {
    if (nextStatus === 'Completed') {
      const booking = activeJobs.find((b) => b._id === bookingId);
      setCompleteJobModal({
        show: true,
        booking,
        finalCost: booking?.estimatedCost || 400,
      });
      return;
    }

    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: nextStatus });
      if (res.data.success) {
        toast.success(`Job status updated to: ${nextStatus}`);
        fetchMechanicData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update job status');
    }
  };

  // Submit Final Job Completion with Price
  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    if (!completeJobModal.booking) return;

    try {
      const res = await api.put(`/bookings/${completeJobModal.booking._id}/status`, {
        status: 'Completed',
        finalCost: Number(completeJobModal.finalCost),
      });

      if (res.data.success) {
        toast.success('🎉 Service completed! Final bill generated.');
        setCompleteJobModal({ show: false, booking: null, finalCost: 400 });
        fetchMechanicData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete job');
    }
  };

  const getNextStatus = (currentStatus) => {
    const idx = STATUS_PROGRESSION.indexOf(currentStatus);
    if (idx >= 0 && idx < STATUS_PROGRESSION.length - 1) {
      return STATUS_PROGRESSION[idx + 1];
    }
    return null;
  };

  return (
    <div className="py-4" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header with Online/Offline Toggle */}
        <div className="card rescue-card p-4 mb-4 border-0 shadow-sm text-white position-relative" style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #153356 100%)' }}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge bg-warning text-dark fw-bold">GARAGE PARTNER DISPATCH</span>
                {stats.isVerified ? (
                  <span className="badge bg-success">
                    <i className="bi bi-patch-check-fill me-1"></i> Admin Verified
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-hourglass-split me-1"></i> Verification Pending
                  </span>
                )}
              </div>
              <h3 className="fw-bold text-white mb-0">{mechanic?.shopName || 'Mechanic Garage'}</h3>
              <small className="text-white-50">
                Technician: {user?.name} • Service Radius: {mechanic?.serviceRadius || 25} km
              </small>
            </div>

            {/* Online / Offline Switch */}
            <div className="d-flex align-items-center gap-3 bg-white bg-opacity-10 p-3 rounded-3 border border-white border-opacity-10">
              <div className="text-end">
                <div className="small fw-bold text-white">Accepting Highway Jobs:</div>
                <span className={`badge ${stats.isOnline ? 'bg-success' : 'bg-secondary'}`}>
                  <span className={`status-dot ${stats.isOnline ? 'online' : 'offline'}`}></span>
                  {stats.isOnline ? 'ONLINE (Ready for Dispatches)' : 'OFFLINE (Unavailable)'}
                </span>
              </div>
              <button
                className={`btn btn-sm fw-bold px-3 py-2 ${stats.isOnline ? 'btn-danger' : 'btn-success'}`}
                onClick={handleToggleOnline}
              >
                {stats.isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          </div>
        </div>

        {/* Verification Warning Alert if Not Verified */}
        {!stats.isVerified && (
          <div className="alert alert-warning border-warning d-flex align-items-center gap-3 mb-4 rounded-3 shadow-sm">
            <i className="bi bi-shield-exclamation fs-3 text-warning"></i>
            <div>
              <strong className="text-dark">Account Pending Admin Approval:</strong>
              <div className="text-muted small">
                Your garage profile has been submitted. The platform administrator is reviewing your identity and credentials. Once approved, you will be marked with the "Verified" badge and can accept live requests.
              </div>
            </div>
          </div>
        )}

        {/* Performance Statistics Metrics */}
        <div className="row g-3 mb-4">
          <div className="col-lg-3 col-sm-6">
            <div className="stat-card">
              <div>
                <span className="text-muted small fw-semibold">Pending Requests</span>
                <h3 className="fw-bold text-warning mb-0">{pendingRequests.length}</h3>
              </div>
              <div className="stat-icon bg-warning bg-opacity-10 text-warning">
                <i className="bi bi-bell-fill"></i>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-sm-6">
            <div className="stat-card">
              <div>
                <span className="text-muted small fw-semibold">Ongoing Active Jobs</span>
                <h3 className="fw-bold text-primary mb-0">{activeJobs.length}</h3>
              </div>
              <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                <i className="bi bi-wrench-adjustable"></i>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-sm-6">
            <div className="stat-card">
              <div>
                <span className="text-muted small fw-semibold">Jobs Completed</span>
                <h3 className="fw-bold text-success mb-0">{stats.completedJobs || 0}</h3>
              </div>
              <div className="stat-icon bg-success bg-opacity-10 text-success">
                <i className="bi bi-check-circle-fill"></i>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-sm-6">
            <div className="stat-card">
              <div>
                <span className="text-muted small fw-semibold">Total Revenue Earned</span>
                <h3 className="fw-bold text-danger mb-0">₹{stats.totalEarnings || 0}</h3>
              </div>
              <div className="stat-icon bg-danger bg-opacity-10 text-danger">
                <i className="bi bi-cash-stack"></i>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 1: Incoming Pending Booking Requests */}
        <div className="card rescue-card p-4 mb-4 border-0 shadow-sm bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-danger p-2 rounded-circle">
                <i className="bi bi-broadcast"></i>
              </span>
              <h5 className="fw-bold text-navy mb-0">
                Incoming Roadside Assistance Requests ({pendingRequests.length})
              </h5>
            </div>
            <span className="badge bg-light text-muted border small">Real-time GPS Alert Feed</span>
          </div>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-4 bg-light rounded-3">
              <i className="bi bi-clock-history fs-2 text-muted"></i>
              <p className="text-muted small mb-0 mt-2">
                No pending requests right now. Keep your status <strong>ONLINE</strong> to receive nearby dispatches.
              </p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {pendingRequests.map((req) => (
                <div
                  key={req._id}
                  className={`p-3 rounded-3 border ${req.isEmergency ? 'border-danger bg-danger bg-opacity-10' : 'bg-light'}`}
                >
                  <div className="row align-items-center g-3">
                    <div className="col-lg-7">
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <strong className="text-dark fs-6">{req.serviceType}</strong>
                        {req.isEmergency && (
                          <span className="badge badge-emergency">
                            <i className="bi bi-lightning-fill"></i> PRIORITY EMERGENCY
                          </span>
                        )}
                        {req.distanceKm !== undefined && (
                          <span className="badge bg-light text-danger border">
                            <i className="bi bi-geo-alt-fill me-1"></i> {req.distanceKm} km away
                          </span>
                        )}
                      </div>

                      <div className="small text-muted mb-1">
                        <strong>Driver:</strong> {req.customer?.name} • <strong>Vehicle:</strong> {req.vehicleType} ({req.vehicleNumber})
                      </div>

                      <div className="small text-muted mb-1">
                        <strong>Problem Reported:</strong> {req.problemDescription}
                      </div>

                      <div className="small text-secondary">
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        <strong>Location:</strong> {req.customerLocation?.address}
                      </div>
                    </div>

                    <div className="col-lg-5 text-lg-end">
                      <div className="d-flex flex-wrap gap-2 justify-content-lg-end">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${req.customerLocation?.coordinates?.[1]},${req.customerLocation?.coordinates?.[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline-secondary btn-sm"
                        >
                          <i className="bi bi-map"></i> View Map
                        </a>
                        <button
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleRejectBooking(req._id)}
                        >
                          Decline
                        </button>
                        <button
                          className="btn btn-success btn-sm fw-bold px-3"
                          onClick={() => handleAcceptBooking(req._id)}
                        >
                          <i className="bi bi-check-circle-fill me-1"></i> Accept Job
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: Active Ongoing Jobs */}
        <div className="card rescue-card p-4 mb-4 border-0 shadow-sm bg-white">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-primary p-2 rounded-circle">
                <i className="bi bi-wrench"></i>
              </span>
              <h5 className="fw-bold text-navy mb-0">
                Active In-Progress Jobs ({activeJobs.length})
              </h5>
            </div>
          </div>

          {activeJobs.length === 0 ? (
            <div className="text-center py-4 bg-light rounded-3">
              <p className="text-muted small mb-0">No active jobs in progress. Accepted dispatches will appear here.</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {activeJobs.map((job) => {
                const nextStatus = getNextStatus(job.status);
                return (
                  <div key={job._id} className="p-4 rounded-3 border border-primary bg-light">
                    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                      <div>
                        <span className="badge bg-primary me-2">Status: {job.status}</span>
                        <strong className="text-dark fs-6">Booking #{job.bookingId}</strong>
                        <div className="text-muted small mt-1">
                          Service: <strong>{job.serviceType}</strong> • Vehicle: <strong>{job.vehicleType} ({job.vehicleNumber})</strong>
                        </div>
                      </div>

                      {/* Customer Contact Card */}
                      <div className="text-lg-end">
                        <div className="small text-muted">Customer Contact:</div>
                        <strong className="text-dark fs-6">{job.customer?.name}</strong>
                        <div>
                          <a href={`tel:${job.customer?.phone}`} className="btn btn-success btn-sm fw-bold mt-1">
                            <i className="bi bi-telephone-fill me-1"></i> Call {job.customer?.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-white rounded-3 border mb-3">
                      <div className="small text-muted mb-1">
                        <strong>Reported Problem:</strong> {job.problemDescription}
                      </div>
                      <div className="small text-muted">
                        <i className="bi bi-geo-alt-fill text-danger me-1"></i>
                        <strong>Breakdown Spot:</strong> {job.customerLocation?.address}
                      </div>
                    </div>

                    {/* Step Advance Controls */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-top pt-3">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${job.customerLocation?.coordinates?.[1]},${job.customerLocation?.coordinates?.[0]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                      >
                        <i className="bi bi-cursor-fill me-1"></i> Open GPS Navigation in Google Maps
                      </a>

                      <div className="d-flex gap-2">
                        {nextStatus && (
                          <button
                            className="btn btn-primary-rescue btn-sm fw-bold px-4"
                            onClick={() => handleUpdateStatus(job._id, nextStatus)}
                          >
                            Mark As: "{nextStatus}" <i className="bi bi-arrow-right ms-1"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Completed Jobs History */}
        <div className="card rescue-card p-4 border-0 shadow-sm bg-white">
          <h5 className="fw-bold text-navy mb-3">Completed Jobs History ({completedJobs.length})</h5>

          {completedJobs.length === 0 ? (
            <p className="text-muted small mb-0">No completed jobs logged yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Vehicle</th>
                    <th>Date</th>
                    <th>Billed Amount</th>
                    <th>Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {completedJobs.map((cj) => (
                    <tr key={cj._id}>
                      <td><strong>{cj.bookingId}</strong></td>
                      <td>
                        <div className="fw-semibold small">{cj.customer?.name}</div>
                        <small className="text-muted">{cj.customer?.phone}</small>
                      </td>
                      <td>{cj.serviceType}</td>
                      <td>
                        <span className="badge bg-light text-dark border">{cj.vehicleNumber}</span>
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(cj.updatedAt).toLocaleDateString('en-IN')}
                        </small>
                      </td>
                      <td><strong className="text-success">₹{cj.finalCost || cj.estimatedCost}</strong></td>
                      <td>
                        <span className={`badge ${cj.paymentStatus === 'Paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {cj.paymentStatus || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Complete Job & Billing Modal */}
      {completeJobModal.show && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-navy-rescue text-white py-3" style={{ backgroundColor: '#0b1e36' }}>
                <h5 className="modal-title fw-bold text-white mb-0">Complete Job & Final Bill</h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setCompleteJobModal({ show: false, booking: null, finalCost: 400 })}
                ></button>
              </div>

              <form onSubmit={handleCompleteJobSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <span className="badge bg-light text-dark border p-2 mb-2">
                      Booking #{completeJobModal.booking?.bookingId}
                    </span>
                    <h6 className="fw-bold mb-1">
                      Customer: {completeJobModal.booking?.customer?.name} ({completeJobModal.booking?.vehicleNumber})
                    </h6>
                    <p className="text-muted small">Service: {completeJobModal.booking?.serviceType}</p>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-bold small">Total Service Amount to Charge (₹) *</label>
                    <input
                      type="number"
                      className="form-control form-control-lg"
                      min="50"
                      max="50000"
                      value={completeJobModal.finalCost}
                      onChange={(e) => setCompleteJobModal({ ...completeJobModal, finalCost: e.target.value })}
                      required
                    />
                    <small className="text-muted">
                      Includes on-spot labor, consumables, and callout charges.
                    </small>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => setCompleteJobModal({ show: false, booking: null, finalCost: 400 })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold">
                    Confirm Completion & Bill ₹{completeJobModal.finalCost}
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

export default MechanicDashboard;
