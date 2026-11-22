import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom Map center updater component
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Create SVG-based DivIcons for reliable offline/online rendering
const createUserIcon = () =>
  L.divIcon({
    className: 'custom-map-user-pin',
    html: `
      <div style="
        background: #2563eb;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 10px rgba(37,99,235,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 16px;
      ">
        <i class="bi bi-car-front-fill"></i>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const createMechanicIcon = (isVerified) =>
  L.divIcon({
    className: 'custom-map-mech-pin',
    html: `
      <div style="
        background: ${isVerified ? '#10b981' : '#f59e0b'};
        width: 34px;
        height: 34px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 16px;
      ">
        <i class="bi bi-tools"></i>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

const createPetrolIcon = () =>
  L.divIcon({
    className: 'custom-map-petrol-pin',
    html: `
      <div style="
        background: #ef4444;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid #ffffff;
        box-shadow: 0 0 10px rgba(239,68,68,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-size: 16px;
      ">
        <i class="bi bi-fuel-pump-fill"></i>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

const MapView = ({
  userLocation,
  mechanics = [],
  petrolPumps = [],
  radiusKm = 20,
  onSelectMechanic,
  height = '500px',
}) => {
  const center = useMemo(() => {
    return [userLocation?.lat || 23.0338, userLocation?.lng || 72.5186];
  }, [userLocation?.lat, userLocation?.lng]);

  const userIcon = useMemo(() => createUserIcon(), []);
  const petrolIcon = useMemo(() => createPetrolIcon(), []);

  return (
    <div style={{ height, width: '100%', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={center} zoom={12} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User's Current Location Marker & Radius Circle */}
        {userLocation?.lat && userLocation?.lng && (
          <>
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
              <Popup>
                <div className="p-1 text-center">
                  <strong className="text-primary d-block">Your Location</strong>
                  <small className="text-muted">{userLocation.address || 'Detected Highway Location'}</small>
                  <div className="badge bg-primary text-white mt-1">Search Center</div>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#ff6b35',
                fillColor: '#ff6b35',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 4',
              }}
            />
          </>
        )}

        {/* Mechanics Markers */}
        {mechanics.map((mech) => {
          const mCoords = mech.location?.coordinates;
          if (!mCoords || mCoords.length < 2) return null;
          const pos = [mCoords[1], mCoords[0]]; // [lat, lng]

          return (
            <Marker
              key={mech._id}
              position={pos}
              icon={createMechanicIcon(mech.isVerified)}
            >
              <Popup>
                <div style={{ minWidth: '200px' }} className="p-1">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong className="text-dark">{mech.shopName}</strong>
                    <span className={`badge ${mech.isVerified ? 'bg-success' : 'bg-warning text-dark'} small`}>
                      {mech.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                  <div className="text-muted small mb-1">
                    <i className="bi bi-person me-1"></i> {mech.name}
                  </div>
                  {mech.distanceKm !== undefined && (
                    <div className="text-danger small fw-bold mb-2">
                      <i className="bi bi-geo-alt-fill me-1"></i> {mech.distanceKm} km away
                    </div>
                  )}
                  <div className="d-flex gap-1">
                    <a
                      href={`tel:${mech.phone}`}
                      className="btn btn-outline-secondary btn-sm flex-fill"
                    >
                      <i className="bi bi-telephone-fill text-success"></i> Call
                    </a>
                    {onSelectMechanic && (
                      <button
                        className="btn btn-primary-rescue btn-sm flex-fill"
                        onClick={() => onSelectMechanic(mech)}
                      >
                        Book
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Petrol Pumps Markers */}
        {petrolPumps.map((pump) => {
          const pCoords = pump.location?.coordinates;
          if (!pCoords || pCoords.length < 2) return null;
          const pos = [pCoords[1], pCoords[0]];

          return (
            <Marker key={pump._id} position={pos} icon={petrolIcon}>
              <Popup>
                <div style={{ minWidth: '200px' }} className="p-1">
                  <span className="badge bg-danger mb-1">{pump.brand}</span>
                  <strong className="d-block text-dark">{pump.name}</strong>
                  <small className="text-muted d-block mb-1">{pump.address}</small>
                  {pump.distanceKm !== undefined && (
                    <div className="text-primary small fw-bold mb-2">
                      <i className="bi bi-geo-alt-fill me-1"></i> {pump.distanceKm} km away
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${pos[0]},${pos[1]}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-dark btn-sm w-100"
                  >
                    <i className="bi bi-cursor-fill me-1"></i> Open Directions
                  </a>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div
        className="card shadow-sm p-2 position-absolute bottom-0 start-0 m-3 bg-white bg-opacity-95 border small"
        style={{ zIndex: 1000, maxWidth: '240px' }}
      >
        <div className="fw-bold mb-1" style={{ fontSize: '0.78rem' }}>Map Legend:</div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge bg-primary rounded-circle p-1"><i className="bi bi-car-front-fill"></i></span>
          <span className="small">Your Location</span>
        </div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge bg-success rounded-circle p-1"><i className="bi bi-tools"></i></span>
          <span className="small">Verified Mechanic</span>
        </div>
        <div className="d-flex align-items-center gap-2 mb-1">
          <span className="badge bg-danger rounded-circle p-1"><i className="bi bi-fuel-pump-fill"></i></span>
          <span className="small">24x7 Petrol Pump</span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
