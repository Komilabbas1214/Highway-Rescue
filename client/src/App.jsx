import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public Pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import NearbyServicesPage from './pages/NearbyServicesPage';
import PetrolPumpsPage from './pages/PetrolPumpsPage';
import EmergencyPage from './pages/EmergencyPage';
import LoginPage from './pages/LoginPage';
import RegisterCustomerPage from './pages/RegisterCustomerPage';
import RegisterMechanicPage from './pages/RegisterMechanicPage';
import NotFoundPage from './pages/NotFoundPage';

// Dashboards
import CustomerDashboard from './pages/CustomerDashboard';
import MechanicDashboard from './pages/MechanicDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/nearby" element={<NearbyServicesPage />} />
          <Route path="/petrol-pumps" element={<PetrolPumpsPage />} />
          <Route path="/emergency" element={<EmergencyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register/customer" element={<RegisterCustomerPage />} />
          <Route path="/register/mechanic" element={<RegisterMechanicPage />} />

          {/* Protected Customer Routes */}
          <Route
            path="/customer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Mechanic Routes */}
          <Route
            path="/mechanic/dashboard"
            element={
              <ProtectedRoute allowedRoles={['mechanic']}>
                <MechanicDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
