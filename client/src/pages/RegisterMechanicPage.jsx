import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const SERVICE_OPTIONS = [
  'Puncture Repair',
  'General Mechanic',
  'Engine Specialist',
  'Battery Specialist',
  'Towing Service',
  'Car Mechanic',
  'Bike Mechanic',
  'Truck Mechanic',
  'Fuel Delivery',
];

const RegisterMechanicPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    serviceCategory: 'Both',
    shopName: '',
    serviceArea: 'SG Highway, Ahmedabad',
    experience: 3,
    shopAddress: '',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380054',
    latitude: '23.0338',
    longitude: '72.5186',
    serviceRadius: 20,
  });

  const [selectedServices, setSelectedServices] = useState(['Puncture Repair', 'General Mechanic']);
  const [profileImage, setProfileImage] = useState(null);
  const [idDocument, setIdDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const { registerMechanic } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceToggle = (service) => {
    if (selectedServices.includes(service)) {
      if (selectedServices.length === 1) {
        toast.warn('Please select at least one service category.');
        return;
      }
      setSelectedServices(selectedServices.filter((s) => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleDetectShopGps = () => {
    if (!navigator.geolocation) {
      toast.warn('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData({
          ...formData,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        });
        setDetectingGps(false);
        toast.success('Garage GPS coordinates acquired!');
      },
      (err) => {
        setDetectingGps(false);
        toast.info('Could not auto-fetch GPS. You can enter latitude and longitude manually.');
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim() || !formData.email.trim() || !formData.password) {
      toast.error('Please fill in all required registration fields.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match. Please verify your password.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.shopAddress.trim()) {
      toast.error('Please provide your workshop/garage address.');
      return;
    }

    if (selectedServices.length === 0) {
      toast.error('Please select at least one service offered by your shop.');
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    Object.keys(formData).forEach((key) => {
      data.append(key, formData[key]);
    });
    data.append('services', JSON.stringify(selectedServices));

    if (profileImage) data.append('profileImage', profileImage);
    if (idDocument) data.append('idDocument', idDocument);

    const res = await registerMechanic(data);
    setSubmitting(false);

    if (res?.success) {
      toast.info('Your registration has been submitted. Awaiting admin verification.');
      navigate('/mechanic/dashboard');
    }
  };

  return (
    <div className="py-5" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            <div className="card rescue-card p-4 p-md-5 border-0 shadow-lg">
              <div className="text-center mb-4">
                <span className="badge bg-warning rounded-circle p-2 text-dark mb-2">
                  <i className="bi bi-tools fs-4"></i>
                </span>
                <h3 className="fw-bold text-navy mb-1">Mechanic & Garage Partner Registration</h3>
                <p className="text-muted small">
                  Register as an authorized Highway Rescue service partner in Ahmedabad.
                </p>
              </div>

              {/* Admin Verification Notice */}
              <div className="alert alert-warning border-warning small mb-4 d-flex align-items-center gap-2">
                <i className="bi bi-shield-exclamation fs-4 text-warning"></i>
                <div>
                  <strong>Mandatory Verification Notice:</strong> For driver safety on highways, all registered mechanics begin in <strong>Pending</strong> review status. Our administrator verifies your profile before you can go online to receive driver dispatches.
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Personal & Shop Details */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">1. Personal & Business Details</h6>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Technician / Owner Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Ramesh Patel"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Garage / Business Name <span className="text-muted fw-normal">(Optional)</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Patel 24x7 Auto Care"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Mobile Number (Receives Dispatch Calls) *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. 9825012345"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Email Address (Login Account) *</label>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. ramesh.patel@gmail.com"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Account Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Minimum 6 characters"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Confirm Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Re-enter password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Service Category *</label>
                    <select
                      className="form-select"
                      name="serviceCategory"
                      value={formData.serviceCategory}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Both">Both (Cars & Bikes)</option>
                      <option value="Car">Cars Only</option>
                      <option value="Bike">Bikes Only</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Ahmedabad Service Area *</label>
                    <select
                      className="form-select"
                      name="serviceArea"
                      value={formData.serviceArea}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="SG Highway, Ahmedabad">SG Highway (ISCON / Pakwan / Gota)</option>
                      <option value="SP Ring Road - Bopal / Shela">SP Ring Road (Bopal / Shela / Ghuma)</option>
                      <option value="Sanand Highway / Changodar">Sanand Highway / Changodar GIDC</option>
                      <option value="Narol - Naroda NH48 Corridor">Narol - Naroda NH48 Corridor</option>
                      <option value="Ashram Road / Central Ahmedabad">Ashram Road / Central Ahmedabad</option>
                      <option value="Gandhinagar - Sarkhej Corridor">Gandhinagar - Sarkhej Corridor</option>
                      <option value="Ahmedabad Citywide">Ahmedabad (All Corridors)</option>
                    </select>
                  </div>

                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Years of Experience *</label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="50"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Services Multi-Select */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">2. Services Offered (Select All That Apply)</h6>
                <div className="row g-2 mb-4">
                  {SERVICE_OPTIONS.map((srv, idx) => (
                    <div key={idx} className="col-md-4 col-sm-6">
                      <div
                        className={`p-2 rounded-3 border d-flex align-items-center gap-2 cursor-pointer ${
                          selectedServices.includes(srv) ? 'bg-primary bg-opacity-10 border-primary text-primary fw-bold' : 'bg-light'
                        }`}
                        onClick={() => handleServiceToggle(srv)}
                        style={{ cursor: 'pointer' }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input mt-0"
                          checked={selectedServices.includes(srv)}
                          onChange={() => {}}
                        />
                        <small>{srv}</small>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shop Location & Coordinates */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">3. Shop Highway Location & GPS Coordinates</h6>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Detailed Shop Address *</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="e.g. Opposite Rajpath Club, SG Highway, Bodakdev"
                    name="shopAddress"
                    value={formData.shopAddress}
                    onChange={handleInputChange}
                    required
                  ></textarea>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">City</label>
                    <input type="text" className="form-control" name="city" value={formData.city} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">State</label>
                    <input type="text" className="form-control" name="state" value={formData.state} onChange={handleInputChange} />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold small">Pincode</label>
                    <input type="text" className="form-control" name="pincode" value={formData.pincode} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="p-3 bg-light rounded-3 border mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="small fw-bold text-dark">
                      <i className="bi bi-geo-alt-fill text-danger me-1"></i> Exact Shop Coordinates (Used for Nearby Distance Search):
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={handleDetectShopGps}
                      disabled={detectingGps}
                    >
                      <i className="bi bi-crosshair"></i> {detectingGps ? 'Detecting...' : 'Get Current Shop GPS'}
                    </button>
                  </div>
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small text-muted mb-0">Latitude</label>
                      <input type="text" className="form-control form-control-sm" name="latitude" value={formData.latitude} onChange={handleInputChange} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label small text-muted mb-0">Longitude</label>
                      <input type="text" className="form-control form-control-sm" name="longitude" value={formData.longitude} onChange={handleInputChange} required />
                    </div>
                  </div>
                  <div className="mt-2">
                    <label className="form-label small text-muted mb-1">Service Coverage Radius (km):</label>
                    <select
                      className="form-select form-select-sm"
                      name="serviceRadius"
                      value={formData.serviceRadius}
                      onChange={handleInputChange}
                    >
                      <option value={10}>10 km radius</option>
                      <option value={20}>20 km radius (Standard)</option>
                      <option value={35}>35 km radius (Highway Extended)</option>
                      <option value={50}>50 km radius (Towing & Heavy)</option>
                    </select>
                  </div>
                </div>

                {/* Document & Photo Upload */}
                <h6 className="fw-bold text-primary border-bottom pb-2 mb-3">4. Verification Documents & Shop Photo</h6>
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Shop Front / Profile Photo (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*"
                      onChange={(e) => setProfileImage(e.target.files[0])}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Identity / Shop Registration Proof (Aadhaar / GST / Udyam)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*,.pdf"
                      onChange={(e) => setIdDocument(e.target.files[0])}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary-rescue btn-lg w-100 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Submitting Application...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-shield-check"></i> Register Garage & Submit for Verification
                    </>
                  )}
                </button>
              </form>

              <hr className="my-4" />

              <div className="text-center small text-muted">
                Already registered as mechanic? <Link to="/login" className="text-warning text-dark fw-bold text-decoration-none">Sign In Here</Link> <br />
                Looking to request vehicle assistance? <Link to="/register/customer" className="text-primary fw-bold text-decoration-none">Register as Driver</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterMechanicPage;
