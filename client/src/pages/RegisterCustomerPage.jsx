import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const RegisterCustomerPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    vehicleType: 'Car',
    vehicleNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { registerCustomer } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    const res = await registerCustomer({
      ...formData,
      vehicleNumber: formData.vehicleNumber.trim().toUpperCase(),
    });
    setSubmitting(false);

    if (res?.success) {
      navigate('/customer/dashboard');
    }
  };

  return (
    <div className="py-5" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-9">
            <div className="card rescue-card p-4 p-md-5 border-0 shadow-lg">
              <div className="text-center mb-4">
                <span className="badge bg-primary rounded-circle p-2 text-white mb-2">
                  <i className="bi bi-car-front-fill fs-4"></i>
                </span>
                <h3 className="fw-bold text-navy mb-1">Vehicle Owner Registration</h3>
                <p className="text-muted small">
                  Create your Highway Rescue driver account for instant 24x7 roadside assistance anywhere on highways.
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rahul Sharma"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Mobile Number *</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="e.g. +91 98250 12345"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-bold small">Email Address *</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="e.g. rahul@example.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Primary Vehicle Type *</label>
                    <select
                      className="form-select"
                      name="vehicleType"
                      value={formData.vehicleType}
                      onChange={handleChange}
                      required
                    >
                      <option value="Car">Car (Sedan, Hatchback, SUV)</option>
                      <option value="Bike">Motorcycle / Bike</option>
                      <option value="Scooter">Scooter</option>
                      <option value="Truck">Truck / Commercial Goods</option>
                      <option value="Bus">Bus</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Vehicle Number (e.g. GJ-01-AB-1234) *</label>
                    <input
                      type="text"
                      className="form-control text-uppercase"
                      placeholder="GJ-01-XX-0000"
                      name="vehicleNumber"
                      value={formData.vehicleNumber}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="At least 6 characters"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-bold small">Confirm Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Repeat password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
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
                      Registering Account...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-check-fill"></i> Create Driver Account
                    </>
                  )}
                </button>
              </form>

              <hr className="my-4" />

              <div className="text-center small text-muted">
                Already registered? <Link to="/login" className="text-primary fw-bold text-decoration-none">Sign In Here</Link> <br />
                Are you a mechanic/garage? <Link to="/register/mechanic" className="text-warning text-dark fw-bold text-decoration-none">Register as Mechanic</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterCustomerPage;
