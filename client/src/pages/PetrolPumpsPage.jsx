import React, { useState, useEffect } from 'react';
import PetrolPumpCard from '../components/PetrolPumpCard';
import MapView from '../components/MapView';
import api from '../services/api';
import { toast } from 'react-toastify';

const PetrolPumpsPage = () => {
  const [pumps, setPumps] = useState([]);
  const [fuelFilter, setFuelFilter] = useState('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [radius, setRadius] = useState(30);
  const [loading, setLoading] = useState(true);

  const [userLocation, setUserLocation] = useState({
    lat: 23.0338,
    lng: 72.5186,
    address: 'SG Highway, Ahmedabad',
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Live GPS Location',
          });
        },
        () => {}
      );
    }
  }, []);

  useEffect(() => {
    const fetchPumps = async () => {
      setLoading(true);
      try {
        const res = await api.get('/petrol-pumps/nearby', {
          params: {
            lat: userLocation.lat,
            lng: userLocation.lng,
            radius,
            fuelType: fuelFilter !== 'All' ? fuelFilter : undefined,
          },
        });
        if (res.data.success) {
          setPumps(res.data.data);
        }
      } catch (err) {
        console.warn('Failed to load petrol pumps:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPumps();
  }, [userLocation.lat, userLocation.lng, radius, fuelFilter]);

  const filteredPumps = pumps.filter((p) => {
    return brandFilter === 'All' || p.brand === brandFilter;
  });

  return (
    <div className="py-5" style={{ minHeight: '80vh', backgroundColor: '#f8fafc' }}>
      <div className="container">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="badge bg-danger bg-opacity-10 text-danger fw-bold px-3 py-1 rounded-pill mb-2">
            Highway Fuel & Energy Finder
          </span>
          <h1 className="fw-bold text-navy">24x7 Nearby Petrol Pumps & EV Stations</h1>
          <p className="text-muted" style={{ maxWidth: '650px', margin: '0 auto' }}>
            Find verified fuel stations along Gujarat highways with verified fuel types (Petrol, Diesel, CNG, and EV Fast Charging) and emergency air/nitrogen facilities.
          </p>
        </div>

        {/* Responsible Verification Note */}
        <div className="alert alert-info border-info d-flex align-items-center gap-2 mb-4 rounded-3 shadow-sm">
          <i className="bi bi-info-circle-fill text-info fs-5"></i>
          <small className="text-dark">
            <strong>Transparency Notice:</strong> All listed highway stations are verified physical locations.
            Opening status and fuel types reflect verified station capabilities. To confirm real-time stock for CNG or EV chargers during peak hours, use the direct call button provided.
          </small>
        </div>

        {/* Filter Controls */}
        <div className="card rescue-card p-3 mb-4 border-0 shadow-sm">
          <div className="row g-3 align-items-center">
            <div className="col-md-4">
              <label className="form-label fw-bold small text-muted">Filter By Fuel Type:</label>
              <select
                className="form-select"
                value={fuelFilter}
                onChange={(e) => setFuelFilter(e.target.value)}
              >
                <option value="All">All Fuels (Petrol, Diesel, CNG, EV)</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="EV Fast Charging">EV Fast Charging</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small text-muted">Brand / Company:</label>
              <select
                className="form-select"
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
              >
                <option value="All">All Brands</option>
                <option value="IndianOil">IndianOil</option>
                <option value="HP">HP (Hindustan Petroleum)</option>
                <option value="Bharat Petroleum">Bharat Petroleum</option>
                <option value="Shell">Shell</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label fw-bold small text-muted">Highway Search Radius:</label>
              <select
                className="form-select"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              >
                <option value={10}>Within 10 km</option>
                <option value={20}>Within 20 km</option>
                <option value={30}>Within 30 km (Standard Highway)</option>
                <option value={50}>Within 50 km (Intercity)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="card rescue-card p-2 mb-5 border-0 shadow-sm" style={{ height: '420px' }}>
          <MapView
            userLocation={userLocation}
            petrolPumps={filteredPumps}
            radiusKm={radius}
            height="100%"
          />
        </div>

        {/* Petrol Pumps Cards Grid */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0">
            Available Fuel Stations ({filteredPumps.length})
          </h5>
          <span className="text-muted small">Sorted by closest highway distance</span>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-danger" role="status"></div>
            <p className="text-muted mt-2">Locating nearby pumps...</p>
          </div>
        ) : filteredPumps.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-3 border">
            <i className="bi bi-fuel-pump-slash fs-1 text-muted"></i>
            <h6 className="fw-bold mt-2">No Petrol Pumps Found</h6>
            <p className="text-muted small">Try increasing the radius or resetting fuel filters.</p>
          </div>
        ) : (
          <div className="row g-4">
            {filteredPumps.map((pump) => (
              <div key={pump._id} className="col-lg-4 col-md-6">
                <PetrolPumpCard pump={pump} userLocation={userLocation} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PetrolPumpsPage;
