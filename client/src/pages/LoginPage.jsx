import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res?.success) {
      const role = res.user.role;
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'mechanic') navigate('/mechanic/dashboard');
      else navigate('/customer/dashboard');
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="py-5" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8">
            <div className="card rescue-card p-4 p-md-5 border-0 shadow-lg">
              <div className="text-center mb-4">
                <span className="badge bg-danger rounded-circle p-2 text-white mb-2">
                  <i className="bi bi-shield-lock-fill fs-4"></i>
                </span>
                <h3 className="fw-bold text-navy mb-1">Welcome Back</h3>
                <p className="text-muted small">
                  Sign in to your Highway Rescue account to manage bookings or garage dispatches.
                </p>
              </div>

              {/* Demo Credentials Helper Box */}
              <div className="p-3 rounded-3 bg-light border mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-bold text-muted text-uppercase">One-Click Demo Accounts:</small>
                </div>
                <div className="d-flex flex-wrap gap-1">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm flex-fill"
                    style={{ fontSize: '0.74rem' }}
                    onClick={() => handleFillDemo('rahul.sharma@example.com', 'Customer@123')}
                  >
                    🚗 Customer Demo
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-warning text-dark btn-sm flex-fill"
                    style={{ fontSize: '0.74rem' }}
                    onClick={() => handleFillDemo('patel.auto@example.com', 'Mechanic@123')}
                  >
                    🔧 Mechanic Demo
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm flex-fill"
                    style={{ fontSize: '0.74rem' }}
                    onClick={() => handleFillDemo('admin@highwayrescue.in', 'Admin@123')}
                  >
                    🛡️ Admin Demo
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-bold small">Email Address *</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control"
                      placeholder="e.g. name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label fw-bold small mb-0">Password *</label>
                  </div>
                  <div className="input-group">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                      Signing In...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right"></i> Sign In
                    </>
                  )}
                </button>
              </form>

              <hr className="my-4" />

              <div className="text-center small">
                <span className="text-muted">Don't have an account yet?</span> <br />
                <div className="d-flex justify-content-center gap-3 mt-2">
                  <Link to="/register/customer" className="text-primary fw-bold text-decoration-none">
                    Register as Driver / Customer
                  </Link>
                  <span>•</span>
                  <Link to="/register/mechanic" className="text-warning text-dark fw-bold text-decoration-none">
                    Register as Mechanic
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
