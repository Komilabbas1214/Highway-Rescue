import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MapView from '../components/MapView';
import MechanicCard from '../components/MechanicCard';
import PetrolPumpCard from '../components/PetrolPumpCard';
import BookingModal from '../components/BookingModal';
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

const NearbyServicesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Location State
  const [userLocation, setUserLocation] = useState({
    lat: 23.0338,
    lng: 72.5186,
    address: 'Near ISCON Cross Road, SG Highway, Ahmedabad',
  });
  const [detectingGps, setDetectingGps] = useState(false);

  // Filters State
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [radius, setRadius] = useState(20); // 5, 10, 20, 50 km
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [viewType, setViewType] = useState('all'); // 'all', 'mechanics', 'pumps'

  // Data State
  const [mechanics, setMechanics] = useState([]);
  const [petrolPumps, setPetrolPumps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedMechanic, setSelectedMechanic] = useState(null);

  // Auto-detect GPS on initial load
  useEffect(() => {
    if (navigator.geolocation) {
      setDetectingGps(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            address: 'Live Highway GPS Location',
          });
          setDetectingGps(false);
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          setDetectingGps(false);
        },
        { timeout: 7000 }
      );
    }
  }, []);

  // Fetch Nearby Mechanics & Petrol Pumps
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mechRes, pumpRes] = await Promise.all([
          api.get('/mechanics/nearby', {
            params: {
              lat: userLocation.lat,
              lng: userLocation.lng,
              radius,
              serviceCategory: category !== 'All' ? category : undefined,
              verifiedOnly: verifiedOnly ? 'true' : undefined,
            },
          }),
          api.get('/petrol-pumps/nearby', {
            params: {
              lat: userLocation.lat,
              lng: userLocation.lng,
              radius,
            },
          }),
        ]);

        if (mechRes.data.success) {
          setMechanics(mechRes.data.data);
        }
        if (pumpRes.data.success) {
          setPetrolPumps(pumpRes.data.data);
        }
      } catch (err) {
        console.warn('Failed to fetch nearby services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userLocation.lat, userLocation.lng, radius, category, verifiedOnly]);

  const handleBookMechanic = (mech) => {
    setSelectedMechanic(mech);
    setShowBookingModal(true);
  };

  const handlePresetSelect = (preset) => {
    setUserLocation({
      lat: preset.lat,
      lng: preset.lng,
      address: preset.name,
    });
    toast.info(`Search location updated to: ${preset.name}`);
  };

  return (
    <div className="py-4" style={{ minHeight: '85vh', backgroundColor: '#f8fafc' }}>
      <div className="container-fluid px-lg-4">
        {/* Top Header & Filter Bar */}
        <div className="card rescue-card p-3 mb-4 border-0 shadow-sm">
          <div className="row g-3 align-items-center">
            {/* Title & Location indicator */}
            <div className="col-lg-4">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-danger rounded-circle p-2 text-white">
                  <i className="bi bi-geo-alt-fill fs-5"></i>
                </span>
                <div>
                  <h5 className="fw-bold mb-0 text-navy">Nearby Highway Assistance Finder</h5>
                  <small className="text-muted text-truncate d-block" style={{ maxWidth: '320px' }}>
                    <i className="bi bi-compass me-1"></i> {userLocation.address}
                  </small>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="col-lg-8">
              <div className="d-flex flex-wrap align-items-center gap-2 justify-content-lg-end">
                {/* Live GPS button */}
                <button
                  className="btn btn-outline-primary btn-sm rounded-pill"
                  onClick={() => {
                    if (navigator.geolocation) {
                      setDetectingGps(true);
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setUserLocation({
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            address: 'Live GPS Location',
                          });
                          setDetectingGps(false);
                          toast.success('Live location updated!');
                        },
                        () => setDetectingGps(false)
                      );
                    }
                  }}
                  disabled={detectingGps}
                >
                  <i className="bi bi-crosshair me-1"></i> {detectingGps ? 'Locating...' : 'Use Live GPS'}
                </button>

                {/* Radius Filter */}
                <div className="d-flex align-items-center gap-1">
                  <span className="small text-muted fw-bold">Radius:</span>
                  <select
                    className="form-select form-select-sm"
                    value={radius}
                    onChange={(e) => setRadius(Number(e.target.value))}
                    style={{ width: '105px' }}
                  >
                    <option value={5}>5 km</option>
                    <option value={10}>10 km</option>
                    <option value={20}>20 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="d-flex align-items-center gap-1">
                  <span className="small text-muted fw-bold">Service:</span>
                  <select
                    className="form-select form-select-sm"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '160px' }}
                  >
                    <option value="All">All Services</option>
                    <option value="Puncture Repair">Puncture Repair</option>
                    <option value="Towing Service">Towing Service</option>
                    <option value="Battery Jump Start">Battery Jump Start</option>
                    <option value="General Mechanic">General Repair</option>
                    <option value="Engine Specialist">Engine Specialist</option>
                    <option value="Fuel Delivery">Fuel Delivery</option>
                    <option value="Truck">Truck & Heavy</option>
                  </select>
                </div>

                {/* Verified Only Toggle */}
                <div className="form-check form-switch ms-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="verifiedCheck"
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                  />
                  <label className="form-check-label small fw-bold text-dark" htmlFor="verifiedCheck">
                    Verified Only
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Highway Landmark Preset Buttons */}
          <div className="border-top mt-3 pt-2 d-flex flex-wrap align-items-center gap-2">
            <small className="text-muted fw-bold me-1" style={{ fontSize: '0.75rem' }}>
              Select Ahmedabad Highway Corridor:
            </small>
            {AHMEDABAD_PRESETS.map((p, idx) => (
              <button
                key={idx}
                className="btn btn-light btn-sm border py-0 px-2"
                style={{ fontSize: '0.72rem' }}
                onClick={() => handlePresetSelect(p)}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: Map & Cards split view */}
        <div className="row g-4">
          {/* Interactive Map Column */}
          <div className="col-lg-7">
            <div className="card rescue-card p-2 border-0 shadow-sm" style={{ height: '620px' }}>
              <MapView
                userLocation={userLocation}
                mechanics={mechanics}
                petrolPumps={petrolPumps}
                radiusKm={radius}
                onSelectMechanic={handleBookMechanic}
                height="100%"
              />
            </div>
          </div>

          {/* Results Side Column */}
          <div className="col-lg-5">
            <div className="card rescue-card p-3 border-0 shadow-sm" style={{ height: '620px', display: 'flex', flexDirection: 'column' }}>
              {/* Tab Selector */}
              <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
                <div className="btn-group btn-group-sm">
                  <button
                    className={`btn ${viewType === 'all' ? 'btn-navy-rescue' : 'btn-outline-secondary'}`}
                    onClick={() => setViewType('all')}
                  >
                    All ({mechanics.length + petrolPumps.length})
                  </button>
                  <button
                    className={`btn ${viewType === 'mechanics' ? 'btn-navy-rescue' : 'btn-outline-secondary'}`}
                    onClick={() => setViewType('mechanics')}
                  >
                    Mechanics ({mechanics.length})
                  </button>
                  <button
                    className={`btn ${viewType === 'pumps' ? 'btn-navy-rescue' : 'btn-outline-secondary'}`}
                    onClick={() => setViewType('pumps')}
                  >
                    Petrol Pumps ({petrolPumps.length})
                  </button>
                </div>

                <button
                  className="btn btn-primary-rescue btn-sm fw-bold"
                  onClick={() => handleBookMechanic(null)}
                >
                  <i className="bi bi-plus-circle-fill me-1"></i> Request Dispatch
                </button>
              </div>

              {/* Scrollable list of cards */}
              <div className="overflow-auto pe-1" style={{ flexGrow: 1 }}>
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="text-muted mt-2 small">Scanning nearby highway providers...</p>
                  </div>
                ) : mechanics.length === 0 && petrolPumps.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-shield-slash fs-1 text-muted"></i>
                    <h6 className="fw-bold mt-2">No verified mechanics are currently available in your area.</h6>
                    <p className="text-muted small">
                      Try expanding the search radius or request a direct highway broadcast dispatch.
                    </p>
                    <button
                      className="btn btn-outline-primary btn-sm rounded-pill"
                      onClick={() => setRadius(50)}
                    >
                      Expand to 50 km Radius
                    </button>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {/* Notice if mechanics are empty in selected tab */}
                    {mechanics.length === 0 && (
                      <div className="alert alert-light border small text-muted d-flex align-items-center gap-2 mb-1">
                        <i className="bi bi-info-circle text-primary"></i>
                        <span>No verified mechanics are currently available in your area.</span>
                      </div>
                    )}

                    {/* Mechanics List */}
                    {(viewType === 'all' || viewType === 'mechanics') &&
                      mechanics.map((mech) => (
                        <MechanicCard
                          key={mech._id}
                          mechanic={mech}
                          userLocation={userLocation}
                          onBookClick={handleBookMechanic}
                        />
                      ))}

                    {/* Petrol Pumps List */}
                    {(viewType === 'all' || viewType === 'pumps') &&
                      petrolPumps.map((pump) => (
                        <PetrolPumpCard
                          key={pump._id}
                          pump={pump}
                          userLocation={userLocation}
                        />
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BookingModal
        show={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        preselectedMechanic={selectedMechanic}
        initialLocation={userLocation}
        onBookingSuccess={() => navigate('/customer/dashboard?tab=bookings')}
      />
    </div>
  );
};

export default NearbyServicesPage;
