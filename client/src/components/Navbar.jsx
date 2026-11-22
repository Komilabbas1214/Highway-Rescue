import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, mechanic, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      {/* Top Emergency & Highway Helpline Bar */}
      <div className="emergency-topbar py-2">
        <div className="container d-flex flex-wrap justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-white text-danger fw-bold px-2 py-1">
              <i className="bi bi-shield-exclamation me-1"></i> 24x7 HIGHWAY EMERGENCY
            </span>
            <span className="d-none d-md-inline text-white-50">
              Official Indian Emergency Services:
            </span>
            <a href="tel:112" className="text-white text-decoration-none fw-bold me-2">
              <i className="bi bi-telephone-fill me-1"></i> 112 (ERSS - Police/Fire/Ambulance)
            </a>
            <span className="text-white-50 d-none d-sm-inline">|</span>
            <a href="tel:100" className="text-white text-decoration-none fw-bold d-none d-sm-inline">
              <i className="bi bi-telephone me-1"></i> 100 (Police Helpline)
            </a>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Link to="/emergency" className="badge bg-warning text-dark text-decoration-none fw-bold py-1 px-2">
              <i className="bi bi-info-circle-fill me-1"></i> Emergency Protocol
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-rescue sticky-top">
        <div className="container">
          <Link className="navbar-brand-rescue" to="/">
            <span className="badge bg-danger rounded-circle p-2 text-white me-1">
              <i className="bi bi-shield-fill-plus"></i>
            </span>
            <div>
              <div className="lh-1">Highway<span>Rescue</span></div>
              <small className="text-muted d-block" style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.5px' }}>
                HELP IS ALWAYS NEARBY
              </small>
            </div>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarContent"
            aria-controls="navbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarContent">
            <ul className="navbar-nav me-auto ms-lg-4 mb-2 mb-lg-0 gap-lg-1">
              <li className="nav-item">
                <NavLink className="nav-link fw-semibold px-2" to="/">
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link fw-semibold px-2" to="/services">
                  Services
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link fw-semibold px-2" to="/nearby">
                  <i className="bi bi-geo-alt-fill text-danger me-1"></i> Find Help Near Me
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link fw-semibold px-2" to="/petrol-pumps">
                  <i className="bi bi-fuel-pump-fill text-primary me-1"></i> Petrol Pumps
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link fw-semibold px-2" to="/about">
                  About Us
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link fw-semibold px-2" to="/contact">
                  Contact
                </NavLink>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              <Link to="/emergency" className="btn btn-emergency btn-sm d-none d-xl-flex">
                <i className="bi bi-telephone-outbound-fill"></i> Emergency 112 / 100
              </Link>

              {isAuthenticated ? (
                <div className="dropdown">
                  <button
                    className="btn btn-navy-rescue btn-sm dropdown-toggle d-flex align-items-center gap-2"
                    type="button"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    <i className="bi bi-person-circle"></i>
                    <span>{user?.name?.split(' ')[0]}</span>
                    <span className="badge bg-warning text-dark text-capitalize" style={{ fontSize: '0.7rem' }}>
                      {user?.role}
                    </span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                    <li className="dropdown-header">
                      <strong>{user?.name}</strong>
                      <div className="text-muted small">{user?.email}</div>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    {user?.role === 'customer' && (
                      <>
                        <li>
                          <Link className="dropdown-item py-2" to="/customer/dashboard">
                            <i className="bi bi-speedometer2 me-2 text-primary"></i> Customer Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item py-2" to="/customer/dashboard?tab=bookings">
                            <i className="bi bi-card-checklist me-2 text-success"></i> My Bookings
                          </Link>
                        </li>
                      </>
                    )}
                    {user?.role === 'mechanic' && (
                      <>
                        <li>
                          <Link className="dropdown-item py-2" to="/mechanic/dashboard">
                            <i className="bi bi-wrench-adjustable me-2 text-warning"></i> Mechanic Dashboard
                          </Link>
                        </li>
                        {mechanic && (
                          <li className="px-3 py-1">
                            <span className={`badge ${mechanic.isOnline ? 'bg-success' : 'bg-secondary'} w-100`}>
                              {mechanic.isOnline ? '● Accepting Requests (Online)' : '○ Offline'}
                            </span>
                          </li>
                        )}
                      </>
                    )}
                    {user?.role === 'admin' && (
                      <li>
                        <Link className="dropdown-item py-2" to="/admin/dashboard">
                          <i className="bi bi-shield-lock me-2 text-danger"></i> Admin Dashboard
                        </Link>
                      </li>
                    )}
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger py-2" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Link to="/login" className="btn btn-outline-rescue btn-sm">
                    Login
                  </Link>
                  <div className="dropdown">
                    <button
                      className="btn btn-primary-rescue btn-sm dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      Register
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                      <li>
                        <Link className="dropdown-item py-2" to="/register/customer">
                          <i className="bi bi-car-front me-2 text-primary"></i> As Vehicle Owner (Customer)
                        </Link>
                      </li>
                      <li>
                        <Link className="dropdown-item py-2" to="/register/mechanic">
                          <i className="bi bi-tools me-2 text-warning"></i> As Mechanic / Garage Provider
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
