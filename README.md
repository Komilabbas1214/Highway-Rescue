# Highway Rescue (Help Is Always Nearby.)

> **24x7 Online Roadside Vehicle Assistance Marketplace for Indian Highways**  
> Initial Launch Market: **Ahmedabad, Gujarat** (SG Highway, Sardar Patel Ring Road, Sanand Industrial Corridor, NH-48) with scalable pan-India architecture.

---

## 🚨 Official Indian Emergency Response Integration
In accordance with Government of India emergency standards, the platform clearly highlights:
- **112 – National Emergency Response Support System (ERSS)**: The unified pan-India helpline for Police, Fire, and Ambulance emergencies.
- **100 – Police Emergency Helpline**: Direct state police control helpline.
- **Highway Breakdown Safety Checklist**: Real-time advice on pulling onto the left shoulder, activating hazard indicators, placing reflective triangles 50m behind, and waiting behind guardrails.
- **Private Vehicle Rescue Distinction**: Official numbers are reserved for life safety; mechanical breakdown, towing, battery, and tyre issues are dispatched to Highway Rescue verified partners.

---

## 🛠️ Technology Stack
- **Frontend**: React.js (Vite), React Router DOM v6, Axios
- **Styling**: Bootstrap 5 + Bootstrap Icons + Custom CSS (Palette: White, Dark Navy Blue `#0b1e36`, Vibrant Orange `#ff6b35`)
- **Maps**: Interactive Leaflet / OpenStreetMap + Google Maps Navigation Directions API Integration
- **Backend**: Node.js & Express.js
- **Database**: MongoDB (Atlas ready) with GeoJSON `Point` coordinates and `2dsphere` geospatial indexing
- **Real-Time Communication**: Socket.IO (bidirectional instant dispatch alerts and step-by-step tracking)
- **Authentication**: JWT & bcryptjs password hashing (Role-Based Access Control)
- **Notifications**: React Toastify
- **Payment Gateway**: Razorpay Integration (Order generation, signature verification, plus Cash on Service option)

---

## 👥 Three Dedicated User Roles

### 1. Customer / Vehicle Owner
- Register with vehicle type (Car, Bike, Scooter, Truck, Bus, Other) and registration plate.
- Share live GPS highway location or choose from Ahmedabad hotspot presets.
- Book any of the 10 roadside services or dispatch an urgent **Emergency Roadside Request**.
- Live booking stepper tracking: `Pending` ➔ `Accepted` ➔ `On The Way` ➔ `Arrived` ➔ `In Progress` ➔ `Completed`.
- Direct phone call to assigned mechanic.
- Settle service bills securely via Razorpay or Cash on Service.
- Rate the mechanic with 1-5 stars and feedback comments.

### 2. Mechanic / Service Provider
- Register garage/shop with service categories, experience, address, GPS coordinates, service radius, and ID verification document upload.
- **Online / Offline Toggle**: Instantly activate or pause receiving nearby dispatches.
- Real-time incoming alerts via Socket.IO with audio-visual notifications, customer distance in km, vehicle details, and problem description.
- Accept or reject jobs with instant conflict prevention.
- Advance job status step-by-step (`On The Way` ➔ `Arrived` ➔ `In Progress` ➔ `Completed`).
- Input final billing amounts and track total platform earnings.

### 3. Super Administrator
- **Dashboard Overview**: Track customers, mechanics, total bookings by status, and platform volume.
- **Mechanic Verification**: Inspect uploaded ID proofs, verify or reject mechanics, activate/deactivate accounts.
- **Customer Management**: Search and block/unblock accounts.
- **Booking Oversight**: Real-time feed of all bookings across Gujarat.
- **Service Catalog CRUD**: Add, edit, or remove services and base pricing.
- **Reviews Moderation**: Delete or flag reported reviews.
- **Enquiries Support**: Manage and reply to Contact Us messages.

---

## 🔑 Demo Accounts (Pre-Seeded)

| Role | Email | Password |
|---|---|---|
| **Administrator** | `admin@highwayrescue.in` | `Admin@123` |
| **Verified Mechanic** | `patel.auto@example.com` | `Mechanic@123` |
| **Towing Specialist** | `gujarat.towing@example.com` | `Mechanic@123` |
| **Driver / Customer** | `rahul.sharma@example.com` | `Customer@123` |

*(Quick 1-click fill buttons are also available on the Login page!)*

---

## 🚀 Getting Started

### 1. Install Dependencies
Run in the root folder, or install backend and frontend separately:

```bash
# In server directory:
cd server
npm install

# In client directory:
cd ../client
npm install
```

### 2. Environment Variables
Both `server/.env` and `client/.env` come pre-configured with defaults.
- If no local MongoDB service is running, the server automatically boots an in-memory MongoDB instance with full GeoJSON and 2dsphere indexing support!
- To connect to MongoDB Atlas, simply update `MONGODB_URI` in `server/.env`.

### 3. Running the Application
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
cd server
npm start
# Server starts on http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser!
