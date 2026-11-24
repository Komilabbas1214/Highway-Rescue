import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import IncomingOfferModal from '../components/IncomingOfferModal';
import {
  startRingtone,
  stopRingtone,
  unlockAudio,
  isAudioUnlocked,
} from '../utils/ringtoneAudio';

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
    isOnline: mechanic?.isOnline || false,
    isVerified: mechanic?.isVerified || false,
    approvalStatus: mechanic?.approvalStatus || 'Pending',
    rejectionReason: mechanic?.rejectionReason || '',
    suspensionReason: mechanic?.suspensionReason || '',
    rating: mechanic?.rating || 4.8,
  });

  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeJobs, setActiveJobs] = useState([]);
  const [completedJobs, setCompletedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Incoming booking offers queue & ringing sound state
  const [activeOffers, setActiveOffers] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(isAudioUnlocked());

  // Platform Commission & Earnings State
  const [earningsData, setEarningsData] = useState(null);
  const [activeTab, setActiveTab] = useState('dispatch'); // 'dispatch' or 'earnings'

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

  const fetchEarningsData = async () => {
    try {
      const res = await api.get('/mechanics/earnings');
      if (res.data.success) {
        setEarningsData(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to load mechanic earnings:', err);
    }
  };

  useEffect(() => {
    fetchMechanicData();
    fetchEarningsData();
  }, []);

  // Listen to live socket events for incoming requests, cancellations, and taken bookings
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming Booking Offer (Eligible Online Mechanics Only)
    socket.on('newBookingRequest', (payload) => {
      console.log('[Socket] Incoming booking offer received:', payload);
      fetchMechanicData();

      // Immediately queue offer and ring alert
      if (payload?.bookingId) {
        setActiveOffers((prev) => {
          if (prev.some((o) => o.bookingId === payload.bookingId)) return prev;
          return [...prev, payload];
        });
        startRingtone();
      }
    });

    // 2. Booking Taken by Another Mechanic -> Stop Ringing & Dismiss Modal
    socket.on('bookingTaken', ({ bookingId, message }) => {
      setActiveOffers((prev) => {
        const remaining = prev.filter((o) => o.bookingId !== bookingId);
        if (remaining.length === 0) {
          stopRingtone();
        }
        return remaining;
      });
      fetchMechanicData();
    });

    // 3. Customer Cancelled Booking -> Stop Ringing & Dismiss Modal
    socket.on('bookingCancelled', (data) => {
      const bookingId = data?.booking?._id || data?.bookingId;
      if (bookingId) {
        setActiveOffers((prev) => {
          const remaining = prev.filter((o) => o.bookingId !== bookingId.toString());
          if (remaining.length === 0) {
            stopRingtone();
          }
          return remaining;
        });
      }
      fetchMechanicData();
    });

    // 4. Commission / Payout Settlement Updated by Admin
    socket.on('settlementUpdated', ({ message }) => {
      toast.success(message || 'Settlement updated by administrator.');
      fetchEarningsData();
      fetchMechanicData();
    });

    // 5. Real-time Account Approval Events
    socket.on('mechanicApproved', ({ message }) => {
      toast.success(message || '🎉 Your account has been verified and approved by admin!');
      fetchMechanicData();
    });

    socket.on('mechanicRejected', ({ reason, message }) => {
      toast.error(message || `Your application was rejected: ${reason}`);
      fetchMechanicData();
    });

    socket.on('mechanicSuspended', ({ reason, message }) => {
      toast.error(message || `Your account was suspended: ${reason}`);
      fetchMechanicData();
    });

    socket.on('mechanicReactivated', ({ message }) => {
      toast.success(message || 'Your account has been reactivated!');
      fetchMechanicData();
    });

    socket.on('mechanicStatusChanged', () => {
      fetchMechanicData();
    });

    return () => {
      socket.off('newBookingRequest');
      socket.off('bookingTaken');
      socket.off('bookingCancelled');
      socket.off('settlementUpdated');
      socket.off('mechanicApproved');
      socket.off('mechanicRejected');
      socket.off('mechanicSuspended');
      socket.off('mechanicReactivated');
      socket.off('mechanicStatusChanged');
      stopRingtone();
    };
  }, [socket, stats.isOnline, stats.isVerified]);

  // Cleanup ringing audio when unmounting
  useEffect(() => {
    return () => {
      stopRingtone();
    };
  }, []);

  // Unlock audio context on user interaction
  const handleEnableSound = async () => {
    const success = await unlockAudio();
    if (success) {
      setSoundEnabled(true);
      toast.success('🔊 Sound alerts enabled! Incoming dispatches will ring continuously.');
    }
  };

  // Handle Online/Offline toggle with approval validation
  const handleToggleOnline = async () => {
    if (!stats.isOnline) {
      const isApproved =
        (stats.approvalStatus === 'Approved' || stats.approvalStatus === undefined) &&
        stats.isVerified;

      if (!isApproved) {
        if (stats.approvalStatus === 'Pending') {
          toast.warn('Your account is under verification. You will be able to go online once approved by admin.');
        } else if (stats.approvalStatus === 'Rejected') {
          toast.error(`Your application was rejected: ${stats.rejectionReason || 'Please contact support.'}`);
        } else if (stats.approvalStatus === 'Suspended') {
          toast.error(`Your account has been suspended: ${stats.suspensionReason || 'Please contact support.'}`);
        } else {
          toast.warn('Account approval required to go online.');
        }
        return;
      }
    }

    const newStatus = !stats.isOnline;
    const res = await toggleMechanicAvailability(newStatus);
    if (res?.success) {
      setStats((prev) => ({ ...prev, isOnline: newStatus }));
      if (!newStatus) {
        // Going offline immediately stops ringing and dismisses incoming offers
        stopRingtone();
        setActiveOffers([]);
      }
    }
  };

  // Handle Accept Booking from List or Modal
  const handleAcceptBooking = async (bookingId) => {
    try {
      // Stop ringing and remove offer from queue
      setActiveOffers((prev) => {
        const remaining = prev.filter((o) => o.bookingId !== bookingId);
        if (remaining.length === 0) stopRingtone();
        return remaining;
      });

      const res = await api.put(`/bookings/${bookingId}/accept`);
      if (res.data.success) {
        toast.success('🎉 Booking accepted! Customer contact details are now visible.');
        fetchMechanicData();
      }
    } catch (error) {
      stopRingtone();
      toast.error(error.response?.data?.message || 'Failed to accept booking');
    }
  };

  // Handle Reject Booking
  const handleRejectBooking = async (bookingId) => {
    try {
      setActiveOffers((prev) => {
        const remaining = prev.filter((o) => o.bookingId !== bookingId);
        if (remaining.length === 0) stopRingtone();
        return remaining;
      });

      const res = await api.put(`/bookings/${bookingId}/reject`);
      if (res.data.success) {
        toast.info('Booking request declined.');
        fetchMechanicData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject booking');
    }
  };

  // Handle Offer Expiration
  const handleExpireOffer = (bookingId) => {
    setActiveOffers((prev) => {
      const remaining = prev.filter((o) => o.bookingId !== bookingId);
      if (remaining.length === 0) stopRingtone();
      return remaining;
    });
    toast.warn('Dispatch request offer expired.');
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

  // Submit Final Job Completion with Price (Calculates 10% platform commission)
  const handleCompleteJobSubmit = async (e) => {
    e.preventDefault();
    if (!completeJobModal.booking) return;

    try {
      const res = await api.put(`/bookings/${completeJobModal.booking._id}/status`, {
        status: 'Completed',
        finalCost: Number(completeJobModal.finalCost),
      });

      if (res.data.success) {
        toast.success('🎉 Service completed! Final bill generated (10% platform commission applied).');
        setCompleteJobModal({ show: false, booking: null, finalCost: 400 });
        fetchMechanicData();
        fetchEarningsData();
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
        <div
          className="card rescue-card p-4 mb-4 border-0 shadow-sm text-white position-relative"
          style={{ background: 'linear-gradient(135deg, #0b1e36 0%, #153356 100%)' }}
        >
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
                <span className="badge bg-warning text-dark fw-bold">GARAGE PARTNER DISPATCH</span>
                {stats.approvalStatus === 'Approved' ? (
                  <span className="badge bg-success">
                    <i className="bi bi-patch-check-fill me-1"></i> Admin Approved
                  </span>
                ) : stats.approvalStatus === 'Rejected' ? (
                  <span className="badge bg-danger">
                    <i className="bi bi-x-circle-fill me-1"></i> Application Rejected
                  </span>
                ) : stats.approvalStatus === 'Suspended' ? (
                  <span className="badge bg-danger">
                    <i className="bi bi-slash-circle-fill me-1"></i> Account Suspended
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark">
                    <i className="bi bi-hourglass-split me-1"></i> Verification Pending
                  </span>
                )}
                {soundEnabled ? (
                  <span className="badge bg-info text-dark">
                    <i className="bi bi-volume-up-fill me-1"></i> Ringtone Alerts Active
                  </span>
                ) : (
                  <span
                    className="badge bg-light text-danger border cursor-pointer"
                    style={{ cursor: 'pointer' }}
                    onClick={handleEnableSound}
                  >
                    <i className="bi bi-volume-mute-fill me-1"></i> Sound Muted (Click to Enable)
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-outline-warning btn-sm py-0 px-2 fw-semibold"
                  style={{ fontSize: '0.75rem' }}
                  onClick={async () => {
                    await unlockAudio();
                    setSoundEnabled(true);
                    startRingtone();
                    setTimeout(() => {
                      stopRingtone();
                    }, 3000);
                    toast.info('🔊 Playing 3-second test dispatch sound alert...');
                  }}
                  title="Test emergency alert ringtone on speakers"
                >
                  <i className="bi bi-play-circle-fill me-1"></i> Test Ringtone
                </button>
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
                className={`btn btn-sm fw-bold px-3 py-2 ${
                  stats.isOnline
                    ? 'btn-danger'
                    : stats.approvalStatus === 'Approved' && stats.isVerified
                    ? 'btn-success'
                    : 'btn-secondary opacity-75'
                }`}
                onClick={handleToggleOnline}
              >
                {stats.isOnline
                  ? 'Go Offline'
                  : stats.approvalStatus === 'Approved' && stats.isVerified
                  ? 'Go Online'
                  : 'Go Online (Approval Required)'}
              </button>
            </div>
          </div>
        </div>

        {/* Status Lifecycle Alerts */}
        {stats.approvalStatus === 'Pending' && (
          <div className="alert alert-warning border-warning d-flex align-items-center gap-3 p-3 mb-4 rounded-3 shadow-sm">
            <i className="bi bi-hourglass-split fs-2 text-warning flex-shrink-0"></i>
            <div>
              <h5 className="fw-bold mb-1">Your account is under verification</h5>
              <p className="mb-0 text-muted small">
                Thank you for registering! Our administrator is reviewing your garage profile and identity documents. You will be able to go online and receive customer assistance dispatches as soon as your account is approved.
              </p>
            </div>
          </div>
        )}

        {stats.approvalStatus === 'Rejected' && (
          <div className="alert alert-danger border-danger d-flex align-items-center gap-3 p-3 mb-4 rounded-3 shadow-sm">
            <i className="bi bi-x-circle-fill fs-2 text-danger flex-shrink-0"></i>
            <div>
              <h5 className="fw-bold mb-1">Application Rejected</h5>
              <p className="mb-0 text-muted small">
                <strong>Rejection Reason:</strong> {stats.rejectionReason || 'Submitted details or documentation did not meet platform safety requirements.'} Please contact Highway Rescue partner support for assistance.
              </p>
            </div>
          </div>
        )}

        {stats.approvalStatus === 'Suspended' && (
          <div className="alert alert-danger border-danger d-flex align-items-center gap-3 p-3 mb-4 rounded-3 shadow-sm">
            <i className="bi bi-slash-circle-fill fs-2 text-danger flex-shrink-0"></i>
            <div>
              <h5 className="fw-bold mb-1">Account Suspended</h5>
              <p className="mb-0 text-muted small">
                <strong>Suspension Reason:</strong> {stats.suspensionReason || 'Account suspended by platform administration.'} You cannot accept bookings while suspended. Please contact support to resolve this issue.
              </p>
            </div>
          </div>
        )}

        {/* Audio Autoplay Alert Banner if Muted */}
        {!soundEnabled && (
          <div className="alert alert-info border-info d-flex align-items-center justify-content-between mb-4 rounded-3 shadow-sm">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-bell-fill fs-4 text-primary"></i>
              <div>
                <strong className="text-dark">Continuous Ringtone Alerts Available:</strong>
                <div className="text-muted small">
                  Browser autoplay policies require user permission to play alert chimes when a customer books assistance. Click below to enable sound.
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary-rescue btn-sm fw-bold px-4 py-2"
              onClick={handleEnableSound}
            >
              <i className="bi bi-volume-up-fill me-1"></i> Enable Sound Alerts
            </button>
          </div>
        )}

        {/* Navigation Tabs: Jobs Dispatch vs 10% Commission Earnings */}
        <div className="d-flex gap-2 mb-4">
          <button
            className={`btn rounded-pill px-4 fw-bold ${
              activeTab === 'dispatch' ? 'btn-primary-rescue' : 'btn-outline-secondary bg-white'
            }`}
            onClick={() => setActiveTab('dispatch')}
          >
            <i className="bi bi-wrench-adjustable me-2"></i> Live Dispatches & Jobs
          </button>
          <button
            className={`btn rounded-pill px-4 fw-bold ${
              activeTab === 'earnings' ? 'btn-primary-rescue' : 'btn-outline-secondary bg-white'
            }`}
            onClick={() => {
              setActiveTab('earnings');
              fetchEarningsData();
            }}
          >
            <i className="bi bi-cash-coin me-2"></i> Earnings & 10% Commission Breakdown
          </button>
        </div>

        {activeTab === 'dispatch' ? (
          <>
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
                    <span className="text-muted small fw-semibold">Net Mechanic Earnings</span>
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
                      className={`p-3 rounded-3 border ${
                        req.isEmergency ? 'border-danger bg-danger bg-opacity-10' : 'bg-light'
                      }`}
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
                          <p className="text-muted small mb-1">
                            <strong>Problem:</strong> {req.problemDescription}
                          </p>
                          <small className="text-secondary">
                            <i className="bi bi-geo-alt me-1"></i>
                            {req.customerLocation?.address || 'Near Highway Point, Ahmedabad'}
                          </small>
                        </div>

                        <div className="col-lg-2 text-center text-lg-start">
                          <span className="text-muted small d-block">Est. Bill</span>
                          <strong className="fs-5 text-dark">₹{req.estimatedCost || 400}</strong>
                          <span className="badge bg-success bg-opacity-10 text-success d-block mt-1">
                            Net 90%: ₹{Math.round((req.estimatedCost || 400) * 0.9)}
                          </span>
                        </div>

                        <div className="col-lg-3 text-end d-flex gap-2 justify-content-lg-end">
                          <button
                            className="btn btn-outline-danger btn-sm rounded-pill px-3"
                            onClick={() => handleRejectBooking(req._id)}
                          >
                            Decline
                          </button>
                          <button
                            className="btn btn-success btn-sm rounded-pill px-4 fw-bold"
                            onClick={() => handleAcceptBooking(req._id)}
                          >
                            <i className="bi bi-check-circle me-1"></i> Accept Job
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: Ongoing Active Jobs */}
            <div className="card rescue-card p-4 mb-4 border-0 shadow-sm bg-white">
              <h5 className="fw-bold text-navy mb-3">Ongoing Active Jobs ({activeJobs.length})</h5>

              {activeJobs.length === 0 ? (
                <div className="text-center py-4 bg-light rounded-3">
                  <i className="bi bi-check-all fs-2 text-muted"></i>
                  <p className="text-muted small mb-0 mt-2">No jobs currently in progress.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {activeJobs.map((job) => (
                    <div key={job._id} className="card border p-3 rounded-3">
                      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                        <div>
                          <span className="badge bg-navy-rescue me-2">#{job.bookingId}</span>
                          <span className="badge bg-primary me-2">{job.serviceType}</span>
                          <span className="badge bg-warning text-dark fw-bold">{job.status}</span>
                        </div>
                        <div className="text-end">
                          <span className="text-muted small">Customer: </span>
                          <strong className="text-dark">{job.customer?.name}</strong>{' '}
                          <a href={`tel:${job.customer?.phone}`} className="badge bg-success text-white text-decoration-none ms-1">
                            <i className="bi bi-telephone-fill me-1"></i> {job.customer?.phone}
                          </a>
                        </div>
                      </div>

                      <div className="row g-2 mb-3">
                        <div className="col-md-6">
                          <small className="text-muted d-block">
                            <strong>Vehicle:</strong> {job.vehicleType} ({job.vehicleNumber})
                          </small>
                          <small className="text-muted d-block">
                            <strong>Location:</strong> {job.customerLocation?.address}
                          </small>
                        </div>
                        <div className="col-md-6">
                          <small className="text-muted d-block">
                            <strong>Description:</strong> {job.problemDescription}
                          </small>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                        <div>
                          <span className="text-muted small">Est. Amount: </span>
                          <strong className="text-dark">₹{job.finalCost || job.estimatedCost || 400}</strong>
                        </div>

                        {getNextStatus(job.status) && (
                          <button
                            className="btn btn-primary-rescue btn-sm rounded-pill px-4 fw-bold"
                            onClick={() => handleUpdateStatus(job._id, getNextStatus(job.status))}
                          >
                            Mark as {getNextStatus(job.status)} &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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
                        <th>Net (90%)</th>
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
                          <td><strong>₹{cj.finalCost || cj.estimatedCost}</strong></td>
                          <td>
                            <strong className="text-success">
                              ₹{cj.mechanicEarning || Math.round((cj.finalCost || cj.estimatedCost || 400) * 0.9)}
                            </strong>
                          </td>
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
          </>
        ) : (
          /* SECTION 4: 10% Platform Commission & Settlements Tab */
          <div>
            {earningsData ? (
              <>
                {/* 4 Cards: Service Revenue, 10% Commission Deducted, Net Earnings, Settlement Balance */}
                <div className="row g-3 mb-4">
                  <div className="col-lg-3 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white">
                      <span className="text-muted small fw-semibold">Total Completed Jobs</span>
                      <h3 className="fw-bold text-dark mb-0">{earningsData.summary.totalCompletedJobs}</h3>
                      <small className="text-muted">100% completed roadside jobs</small>
                    </div>
                  </div>

                  <div className="col-lg-3 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white">
                      <span className="text-muted small fw-semibold">Gross Service Revenue</span>
                      <h3 className="fw-bold text-primary mb-0">₹{earningsData.summary.totalServiceEarnings}</h3>
                      <small className="text-muted">Total amount billed to customers</small>
                    </div>
                  </div>

                  <div className="col-lg-3 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white">
                      <span className="text-muted small fw-semibold">10% Platform Commission</span>
                      <h3 className="fw-bold text-danger mb-0">₹{earningsData.summary.platformCommissionDeducted}</h3>
                      <small className="text-muted">Deducted for platform fees</small>
                    </div>
                  </div>

                  <div className="col-lg-3 col-sm-6">
                    <div className="card p-3 border-0 shadow-sm rounded-3 bg-white">
                      <span className="text-muted small fw-semibold">Net Mechanic Earnings (90%)</span>
                      <h3 className="fw-bold text-success mb-0">₹{earningsData.summary.netMechanicEarnings}</h3>
                      <small className="text-success fw-semibold">Your total net profit</small>
                    </div>
                  </div>
                </div>

                {/* Settlement Breakdown Card */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="card p-4 border-0 shadow-sm rounded-3 bg-white h-100">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-wallet2 text-primary fs-4"></i>
                        <h6 className="fw-bold text-dark mb-0">Online Payments Settlement</h6>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Gross Online Billed:</span>
                        <strong>₹{earningsData.summary.onlineGross}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Settled / Paid to Your Account:</span>
                        <strong className="text-success">₹{earningsData.summary.onlinePaidOut}</strong>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark small">Pending Payout from Platform:</span>
                        <span className="fs-5 fw-bold text-primary">₹{earningsData.summary.onlinePayoutPending}</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="card p-4 border-0 shadow-sm rounded-3 bg-white h-100">
                      <div className="d-flex align-items-center gap-2 mb-3">
                        <i className="bi bi-cash-stack text-warning fs-4"></i>
                        <h6 className="fw-bold text-dark mb-0">Cash Handover Reconciliation</h6>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Total Cash Collected by You:</span>
                        <strong>₹{earningsData.summary.cashCollected}</strong>
                      </div>
                      <div className="d-flex justify-content-between mb-2">
                        <span className="text-muted small">Cash Commission Reconciled:</span>
                        <strong className="text-success">₹{earningsData.summary.cashCommissionSettled}</strong>
                      </div>
                      <hr className="my-2" />
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-dark small">Cash Commission Payable to Platform:</span>
                        <span className="fs-5 fw-bold text-danger">₹{earningsData.summary.cashCommissionPayable}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Booking-wise Breakdown Table */}
                <div className="card p-4 border-0 shadow-sm rounded-3 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Booking-wise Earnings & Commission Breakdown</h6>
                  {earningsData.bookingWiseEarnings.length === 0 ? (
                    <p className="text-muted small mb-0">No completed bookings logged for commission breakdown.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle small">
                        <thead className="table-light">
                          <tr>
                            <th>Booking</th>
                            <th>Service</th>
                            <th>Date</th>
                            <th>Gross Bill</th>
                            <th>10% Commission</th>
                            <th>Net Earning (90%)</th>
                            <th>Payment</th>
                            <th>Settlement</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earningsData.bookingWiseEarnings.map((item) => (
                            <tr key={item.bookingId}>
                              <td><strong>#{item.bookingNumber}</strong></td>
                              <td>{item.serviceType}</td>
                              <td>{new Date(item.date).toLocaleDateString('en-IN')}</td>
                              <td>₹{item.finalCost}</td>
                              <td className="text-danger">-₹{item.platformCommission}</td>
                              <td className="text-success fw-bold">₹{item.netEarning}</td>
                              <td>
                                <span className={`badge ${item.paymentMethod === 'Online' ? 'bg-info text-dark' : 'bg-secondary'}`}>
                                  {item.paymentMethod} ({item.paymentStatus})
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${item.settlementStatus === 'Settled' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                  {item.settlementStatus}
                                </span>
                                {item.settlementReference && (
                                  <small className="d-block text-muted">{item.settlementReference}</small>
                                )}
                              </td>
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
                <p className="text-muted small mt-2">Loading earnings and commission breakdown...</p>
              </div>
            )}
          </div>
        )}
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
                    <div className="card bg-light border p-2 mt-2">
                      <div className="d-flex justify-content-between small">
                        <span>10% Platform Commission:</span>
                        <span className="text-danger">₹{Math.round(Number(completeJobModal.finalCost || 0) * 0.10)}</span>
                      </div>
                      <div className="d-flex justify-content-between small fw-bold">
                        <span>Your Net Earnings (90%):</span>
                        <span className="text-success">₹{Math.round(Number(completeJobModal.finalCost || 0) * 0.90)}</span>
                      </div>
                    </div>
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

      {/* Prominent Incoming Booking Offer Ringing Alert Modal */}
      <IncomingOfferModal
        offers={activeOffers}
        onAccept={handleAcceptBooking}
        onReject={handleRejectBooking}
        onExpire={handleExpireOffer}
        soundEnabled={soundEnabled}
        onEnableSound={handleEnableSound}
      />
    </div>
  );
};

export default MechanicDashboard;
