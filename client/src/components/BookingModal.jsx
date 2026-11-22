import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const AHMEDABAD_PRESETS = [
  { name: 'SG Highway - ISCON Cross Road', lat: 23.0338, lng: 72.5186 },
  { name: 'SP Ring Road - Bopal Flyover', lat: 23.0373, lng: 72.4642 },
  { name: 'SG Highway - Gota Flyover', lat: 23.1092, lng: 72.5348 },
  { name: 'Sanand Highway - GIDC Gate', lat: 22.9856, lng: 72.3912 },
  { name: 'Narol-Naroda NH48 Circle', lat: 22.9754, lng: 72.5982 },
  { name: 'Ashram Road - Vadaj Circle', lat: 23.0581, lng: 72.5714 },
];

const BookingModal = ({
  show,
  onClose,
  preselectedService,
  preselectedMechanic,
  initialLocation,
  onBookingSuccess,
}) => {
  const { user, isAuthenticated } = useAuth();

  const [serviceType, setServiceType] = useState(preselectedService?.name || 'General Vehicle Repair');
  const [vehicleType, setVehicleType] = useState(user?.vehicleType || 'Car');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemImage, setProblemImage] = useState(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState(preselectedMechanic || null);
  const [targetType, setTargetType] = useState(preselectedMechanic ? 'specific' : 'broadcast');

  // Location state
  const [locationMode, setLocationMode] = useState('gps');
  const [coords, setCoords] = useState({
    lat: initialLocation?.lat || 23.0338,
    lng: initialLocation?.lng || 72.5186,
    address: initialLocation?.address || 'Near ISCON Cross Road, SG Highway, Ahmedabad',
  });
  const [detectingGps, setDetectingGps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedService?.name) {
      setServiceType(preselectedService.name);
    }
  }, [preselectedService]);

  useEffect(() => {
    if (preselectedMechanic) {
      setSelectedMechanic(preselectedMechanic);
      setTargetType('specific');
    }
  }, [preselectedMechanic]);

  useEffect(() => {
    if (user?.vehicleNumber && !vehicleNumber) {
      setVehicleNumber(user.vehicleNumber);
    }
    if (user?.vehicleType && !vehicleType) {
      setVehicleType(user.vehicleType);
    }
  }, [user]);

  // GPS detection helper
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.warn('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          address: 'Current GPS Highway Location',
        });
        setDetectingGps(false);
        toast.success('Live GPS coordinates acquired successfully!');
      },
      (err) => {
        setDetectingGps(false);
        console.warn('Geolocation failed:', err.message);
        toast.info('GPS permission denied or unavailable. You can choose a location from presets or enter manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handlePresetSelect = (preset) => {
    setCoords({
      lat: preset.lat,
      lng: preset.lng,
      address: preset.name,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.warn('Please log in or register to request roadside assistance.');
      return;
    }

    if (!vehicleNumber.trim()) {
      toast.error('Please enter your vehicle registration number.');
      return;
    }

    if (!problemDescription.trim()) {
      toast.error('Please briefly describe the breakdown issue.');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('serviceType', serviceType);
      formData.append('vehicleType', vehicleType);
      formData.append('vehicleNumber', vehicleNumber.trim().toUpperCase());
      formData.append('problemDescription', problemDescription.trim());
      formData.append('latitude', coords.lat);
      formData.append('longitude', coords.lng);
      formData.append('address', coords.address);
      formData.append('isEmergency', isEmergency);

      if (targetType === 'specific' && selectedMechanic) {
        formData.append('mechanicId', selectedMechanic._id);
      }

      if (problemImage) {
        formData.append('problemImage', problemImage);
      }

      const res = await api.post('/bookings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        toast.success(`🎉 Assistance requested! Booking ID: ${res.data.booking.bookingId}`);
        if (onBookingSuccess) {
          onBookingSuccess(res.data.booking);
        }
        onClose();
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to submit service request.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header bg-navy-rescue text-white py-3" style={{ backgroundColor: '#0b1e36' }}>
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${isEmergency ? 'bg-danger' : 'bg-warning text-dark'} p-2 rounded-circle`}>
                <i className={`bi ${isEmergency ? 'bi-shield-fill-exclamation' : 'bi-wrench-adjustable'}`}></i>
              </span>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0">
                  {isEmergency ? '🚨 Priority Emergency Breakdown Request' : 'Book Roadside Vehicle Assistance'}
                </h5>
                <small className="text-white-50">Direct Dispatch to Verified Highway Mechanics</small>
              </div>
            </div>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Emergency Toggle Banner */}
              <div className={`p-3 rounded-3 mb-4 d-flex justify-content-between align-items-center ${isEmergency ? 'bg-danger bg-opacity-10 border border-danger' : 'bg-light border'}`}>
                <div className="d-flex align-items-center gap-2">
                  <i className={`bi ${isEmergency ? 'bi-exclamation-octagon-fill text-danger fs-4' : 'bi-info-circle text-muted fs-4'}`}></i>
                  <div>
                    <strong className={isEmergency ? 'text-danger' : 'text-dark'}>
                      {isEmergency ? 'PRIORITY EMERGENCY DISPATCH ACTIVE' : 'Is this an urgent highway emergency?'}
                    </strong>
                    <div className="text-muted small">
                      Prioritizes notification alerts to all nearby mechanics within 25 km.
                    </div>
                  </div>
                </div>
                <div className="form-check form-switch ms-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="emergencySwitch"
                    checked={isEmergency}
                    onChange={(e) => setIsEmergency(e.target.checked)}
                    style={{ cursor: 'pointer', transform: 'scale(1.3)' }}
                  />
                </div>
              </div>

              {/* Service & Vehicle Type */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Service Category *</label>
                  <select
                    className="form-select"
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    required
                  >
                    <option value="Puncture Repair">Puncture Repair</option>
                    <option value="General Vehicle Repair">General Vehicle Repair</option>
                    <option value="Engine Repair">Engine Repair</option>
                    <option value="Battery Jump Start">Battery Jump Start</option>
                    <option value="Battery Replacement">Battery Replacement</option>
                    <option value="Towing Service">Towing Service</option>
                    <option value="Fuel Delivery">Fuel Delivery</option>
                    <option value="Car and Bike Breakdown Assistance">Car and Bike Breakdown Assistance</option>
                    <option value="Truck and Heavy Vehicle Assistance">Truck and Heavy Vehicle Assistance</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Vehicle Type *</label>
                  <select
                    className="form-select"
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    required
                  >
                    <option value="Car">Car (Sedan / Hatchback / SUV)</option>
                    <option value="Bike">Motorcycle / Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Truck">Truck / Commercial Goods Vehicle</option>
                    <option value="Bus">Bus</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Vehicle Registration Number */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold small">Vehicle Number (e.g. GJ-01-AB-1234) *</label>
                  <input
                    type="text"
                    className="form-control text-uppercase"
                    placeholder="GJ-01-XX-0000"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold small">Dispatch Method</label>
                  <div className="d-flex gap-2 mt-1">
                    <button
                      type="button"
                      className={`btn btn-sm flex-fill ${targetType === 'broadcast' ? 'btn-navy-rescue' : 'btn-outline-secondary'}`}
                      onClick={() => {
                        setTargetType('broadcast');
                        setSelectedMechanic(null);
                      }}
                    >
                      <i className="bi bi-broadcast me-1"></i> Nearby Broadcast
                    </button>
                    {selectedMechanic && (
                      <button
                        type="button"
                        className={`btn btn-sm flex-fill ${targetType === 'specific' ? 'btn-primary-rescue' : 'btn-outline-secondary'}`}
                        onClick={() => setTargetType('specific')}
                      >
                        <i className="bi bi-person-check-fill me-1"></i> {selectedMechanic.shopName.slice(0, 15)}...
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Problem Description */}
              <div className="mb-3">
                <label className="form-label fw-bold small">Describe the Breakdown Problem *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="E.g., Flat tyre on front right wheel, engine making knocking noise, clutch wire broken, battery dead, etc."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  required
                ></textarea>
              </div>

              {/* Upload Optional Problem Image */}
              <div className="mb-3">
                <label className="form-label fw-bold small">
                  Vehicle / Problem Photo <span className="text-muted fw-normal">(Optional, helps mechanic bring exact tools)</span>
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setProblemImage(e.target.files[0])}
                />
              </div>

              {/* Location Selector */}
              <div className="border rounded-3 p-3 bg-light mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-dark small">
                    <i className="bi bi-geo-alt-fill text-danger me-1"></i> Breakdown Location
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                    onClick={handleDetectGps}
                    disabled={detectingGps}
                  >
                    <i className="bi bi-crosshair"></i> {detectingGps ? 'Locating...' : 'Use My Live GPS'}
                  </button>
                </div>

                <div className="mb-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Enter landmark or highway mile marker"
                    value={coords.address}
                    onChange={(e) => setCoords({ ...coords, address: e.target.value })}
                  />
                </div>

                {/* Quick Ahmedabad presets */}
                <div className="mt-2">
                  <small className="text-muted d-block mb-1" style={{ fontSize: '0.72rem' }}>
                    Quick Ahmedabad Highway Hotspots:
                  </small>
                  <div className="d-flex flex-wrap gap-1">
                    {AHMEDABAD_PRESETS.map((p, idx) => (
                      <button
                        type="button"
                        key={idx}
                        className="btn btn-white btn-sm border py-0 px-2"
                        style={{ fontSize: '0.7rem' }}
                        onClick={() => handlePresetSelect(p)}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                  Coordinates: Lat {coords.lat.toFixed(4)}, Lng {coords.lng.toFixed(4)}
                </div>
              </div>
            </div>

            <div className="modal-footer bg-light">
              <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose}>
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${isEmergency ? 'btn-danger' : 'btn-primary-rescue'} rounded-pill px-5 fw-bold`}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Submitting Request...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle-fill me-1"></i> Confirm & Request Assistance
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
