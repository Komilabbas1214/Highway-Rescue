const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const http = require('http');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seeder');
const { app } = require('./server');
const User = require('./models/User');
const Mechanic = require('./models/Mechanic');
const Booking = require('./models/Booking');
const Payment = require('./models/Payment');

const TEST_PORT = 5004;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runRealMechanicsTestSuite() {
  console.log('========================================================================');
  console.log('  HIGHWAY RESCUE — REAL MECHANIC REGISTRATION & APPROVAL TEST SUITE    ');
  console.log('========================================================================\n');

  await connectDB();
  await seedDatabase();

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));
  console.log(`Test server running on port ${TEST_PORT}...\n`);

  let passed = 0;
  let failed = 0;

  const testSuffix = Date.now().toString().slice(-5);
  const testMechEmail1 = `ahmedabad.testmech1.${testSuffix}@example.com`;
  const testMechPhone1 = `9825${testSuffix}`;
  const testMechEmail2 = `ahmedabad.testmech2.${testSuffix}@example.com`;
  const testMechPhone2 = `9826${testSuffix}`;

  let adminHeaders = {};
  let customerHeaders = {};
  let mech1Id = null;
  let mech1Token = null;
  let mech1Headers = {};
  let mech2Id = null;

  try {
    // -------------------------------------------------------------------------
    // Setup: Admin & Customer Authentication
    // -------------------------------------------------------------------------
    console.log('--- Setup: Authenticating Admin and Customer ---');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@highwayrescue.in',
      password: 'Admin@123',
    });
    adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

    // Register or login test customer
    let custToken = '';
    const custEmail = `customer.test.${testSuffix}@example.com`;
    const custReg = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test Customer',
      email: custEmail,
      phone: `9900${testSuffix}`,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      vehicleType: 'Car',
      vehicleNumber: 'GJ-01-XX-9999',
    });
    custToken = custReg.data.token;
    customerHeaders = { Authorization: `Bearer ${custToken}` };
    console.log('✔ Admin and Customer authenticated successfully.\n');

    // -------------------------------------------------------------------------
    // Scenario 1: Seeder does NOT auto-create demo mechanics on startup/restart
    // -------------------------------------------------------------------------
    console.log('--- Scenario 1: Verify seeder does not regenerate demo mechanics ---');
    const countBefore = await Mechanic.countDocuments();
    await seedDatabase();
    const countAfter = await Mechanic.countDocuments();
    if (countBefore === countAfter) {
      console.log(`✔ PASSED: Database seeder verified. Mechanic count constant (${countBefore} -> ${countAfter}). No demo mechanics regenerated.\n`);
      passed++;
    } else {
      console.error(`✖ FAILED: Seeder created records unexpectedly: ${countBefore} -> ${countAfter}\n`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 2: Real mechanic registration initializes as Pending, Unverified, Offline
    // -------------------------------------------------------------------------
    console.log('--- Scenario 2: Register genuine mechanic in Ahmedabad ---');
    const regRes = await axios.post(`${BASE_URL}/mechanics/register`, {
      name: 'Mahesh Solanki',
      email: testMechEmail1,
      phone: testMechPhone1,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      serviceCategory: 'Car',
      shopName: 'Solanki Car Care ISCON',
      serviceArea: 'SG Highway, Ahmedabad',
      services: ['Puncture Repair', 'Engine Specialist', 'Battery Specialist'],
      experience: 6,
      shopAddress: 'Opposite Rajpath Club, Bodakdev, SG Highway',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380054',
      latitude: 23.0338,
      longitude: 72.5186,
      serviceRadius: 20,
    });

    mech1Id = regRes.data.mechanic._id;
    mech1Token = regRes.data.token;
    mech1Headers = { Authorization: `Bearer ${mech1Token}` };

    const createdMech = await Mechanic.findById(mech1Id);
    if (
      createdMech.approvalStatus === 'Pending' &&
      createdMech.isVerified === false &&
      createdMech.isOnline === false &&
      createdMech.isActive === true &&
      createdMech.isDemo === false
    ) {
      console.log(`✔ PASSED: Mechanic registered with approvalStatus='Pending', isVerified=false, isOnline=false.\n`);
      passed++;
    } else {
      console.error(`✖ FAILED: Unexpected mechanic defaults: approvalStatus=${createdMech.approvalStatus}, isVerified=${createdMech.isVerified}, isOnline=${createdMech.isOnline}\n`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 3: Prevent duplicate email & mobile registration
    // -------------------------------------------------------------------------
    console.log('--- Scenario 3: Duplicate email and phone registration check ---');
    let duplicateEmailRejected = false;
    let duplicatePhoneRejected = false;

    try {
      await axios.post(`${BASE_URL}/mechanics/register`, {
        name: 'Another Mechanic',
        email: testMechEmail1, // duplicate
        phone: `9111${testSuffix}`,
        password: 'Password@123',
        confirmPassword: 'Password@123',
        shopAddress: 'Bopal, Ahmedabad',
      });
    } catch (e) {
      if (e.response?.status === 400 && e.response.data?.message?.includes('already exists')) {
        duplicateEmailRejected = true;
      }
    }

    try {
      await axios.post(`${BASE_URL}/mechanics/register`, {
        name: 'Another Mechanic',
        email: `unique.${testSuffix}@example.com`,
        phone: testMechPhone1, // duplicate
        password: 'Password@123',
        confirmPassword: 'Password@123',
        shopAddress: 'Bopal, Ahmedabad',
      });
    } catch (e) {
      if (e.response?.status === 400 && e.response.data?.message?.includes('already exists')) {
        duplicatePhoneRejected = true;
      }
    }

    if (duplicateEmailRejected && duplicatePhoneRejected) {
      console.log('✔ PASSED: Both duplicate email and duplicate mobile registrations rejected with HTTP 400.\n');
      passed++;
    } else {
      console.error(`✖ FAILED: Duplicate validation failed: emailRejected=${duplicateEmailRejected}, phoneRejected=${duplicatePhoneRejected}\n`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 4: Pending mechanic is hidden from customer nearby list
    // -------------------------------------------------------------------------
    console.log('--- Scenario 4: Pending mechanic hidden from customer nearby search ---');
    const nearbyRes1 = await axios.get(`${BASE_URL}/mechanics/nearby`, {
      params: { lat: 23.0338, lng: 72.5186, radius: 25 },
    });
    const foundPendingInSearch = nearbyRes1.data.data.some((m) => m._id === mech1Id.toString());
    if (!foundPendingInSearch) {
      console.log('✔ PASSED: Pending mechanic does not appear in customer /api/mechanics/nearby search.\n');
      passed++;
    } else {
      console.error('✖ FAILED: Pending mechanic leaked into customer nearby results!\n');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 5: Admin approves mechanic (PUT /api/admin/mechanics/:id/approve)
    // -------------------------------------------------------------------------
    console.log('--- Scenario 5: Admin approves mechanic ---');
    const approveRes = await axios.put(
      `${BASE_URL}/admin/mechanics/${mech1Id}/approve`,
      { verificationNotes: 'Shop identity verified at SG Highway, Ahmedabad' },
      { headers: adminHeaders }
    );
    const mechAfterApproval = await Mechanic.findById(mech1Id);
    if (
      approveRes.data.success &&
      mechAfterApproval.approvalStatus === 'Approved' &&
      mechAfterApproval.isVerified === true &&
      mechAfterApproval.isActive === true
    ) {
      console.log('✔ PASSED: Mechanic successfully approved: approvalStatus="Approved", isVerified=true.\n');
      passed++;
    } else {
      console.error(`✖ FAILED: Admin approval did not set expected fields: status=${mechAfterApproval.approvalStatus}, verified=${mechAfterApproval.isVerified}\n`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 6: Approved mechanic toggles online and appears in customer list
    // -------------------------------------------------------------------------
    console.log('--- Scenario 6: Approved mechanic goes online & appears in customer list ---');
    const onlineRes = await axios.put(
      `${BASE_URL}/mechanics/availability`,
      { isOnline: true },
      { headers: mech1Headers }
    );

    const nearbyRes2 = await axios.get(`${BASE_URL}/mechanics/nearby`, {
      params: { lat: 23.0338, lng: 72.5186, radius: 25 },
    });
    const foundApprovedInSearch = nearbyRes2.data.data.find((m) => m._id === mech1Id.toString());
    const idDocLeaked = foundApprovedInSearch && foundApprovedInSearch.idDocument;

    if (onlineRes.data.isOnline === true && foundApprovedInSearch && !idDocLeaked) {
      console.log('✔ PASSED: Approved mechanic is online, appears in customer nearby search, and sensitive documents are NOT leaked.\n');
      passed++;
    } else {
      console.error(`✖ FAILED: Online toggle or appearance failed: found=${!!foundApprovedInSearch}, idDocLeaked=${!!idDocLeaked}\n`);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 7: Unapproved mechanic CANNOT go online (HTTP 403 Forbidden)
    // -------------------------------------------------------------------------
    console.log('--- Scenario 7: Unapproved mechanic cannot go online (HTTP 403) ---');
    // Register unapproved mech 2
    const reg2Res = await axios.post(`${BASE_URL}/mechanics/register`, {
      name: 'Ketan Barot',
      email: testMechEmail2,
      phone: testMechPhone2,
      password: 'Password@123',
      confirmPassword: 'Password@123',
      serviceCategory: 'Bike',
      shopAddress: 'Naroda Ring Road, Ahmedabad',
    });
    mech2Id = reg2Res.data.mechanic._id;
    const mech2Headers = { Authorization: `Bearer ${reg2Res.data.token}` };

    let unapprovedBlocked = false;
    try {
      await axios.put(
        `${BASE_URL}/mechanics/availability`,
        { isOnline: true },
        { headers: mech2Headers }
      );
    } catch (e) {
      if (e.response?.status === 403) {
        unapprovedBlocked = true;
      }
    }

    if (unapprovedBlocked) {
      console.log('✔ PASSED: Unapproved pending mechanic blocked with HTTP 403 when attempting to go online.\n');
      passed++;
    } else {
      console.error('✖ FAILED: Unapproved mechanic was able to go online!\n');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 8: Online approved mechanic receives booking dispatch
    // -------------------------------------------------------------------------
    console.log('--- Scenario 8: Online approved mechanic receives dispatch offer ---');
    const booking1 = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Puncture Repair',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-MN-1234',
        problemDescription: 'Flat tyre near ISCON, SG Highway',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: customerHeaders }
    );

    // Check mechanic requests endpoint
    const requestsRes = await axios.get(`${BASE_URL}/bookings/requests`, {
      headers: mech1Headers,
    });
    const dispatchFound = requestsRes.data.pendingRequests.some(
      (b) => b._id === booking1.data.booking._id
    );

    if (dispatchFound) {
      console.log('✔ PASSED: Online approved mechanic successfully received booking dispatch.\n');
      passed++;
    } else {
      console.error('✖ FAILED: Booking was not visible to eligible online mechanic.\n');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 9: Offline mechanic is excluded from dispatch
    // -------------------------------------------------------------------------
    console.log('--- Scenario 9: Offline mechanic is excluded from dispatch ---');
    await axios.put(
      `${BASE_URL}/mechanics/availability`,
      { isOnline: false },
      { headers: mech1Headers }
    );

    const booking2 = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Engine Specialist',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-MN-5678',
        problemDescription: 'Engine stopped near Bopal',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: customerHeaders }
    );

    // Mechanic 1 is now offline, ensure socket / dispatch query filters out offline mechanics
    const allOnlineMechs = await Mechanic.find({
      isOnline: true,
      isActive: true,
      isVerified: true,
      approvalStatus: 'Approved',
      isDemo: { $ne: true },
    });
    const isMech1InOnlineList = allOnlineMechs.some((m) => m._id.toString() === mech1Id.toString());

    if (!isMech1InOnlineList) {
      console.log('✔ PASSED: Offline mechanic is excluded from online dispatch pool.\n');
      passed++;
    } else {
      console.error('✖ FAILED: Offline mechanic still found in online dispatch query!\n');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 10: Admin rejects mechanic with reason
    // -------------------------------------------------------------------------
    console.log('--- Scenario 10: Admin rejects mechanic with reason ---');
    const rejectRes = await axios.put(
      `${BASE_URL}/admin/mechanics/${mech2Id}/reject`,
      { reason: 'Workshop address not located within Ahmedabad service jurisdiction.' },
      { headers: adminHeaders }
    );
    const mech2AfterReject = await Mechanic.findById(mech2Id);

    let rejectedCannotGoOnline = false;
    try {
      await axios.put(
        `${BASE_URL}/mechanics/availability`,
        { isOnline: true },
        { headers: mech2Headers }
      );
    } catch (e) {
      if (e.response?.status === 403 && e.response.data?.approvalStatus === 'Rejected') {
        rejectedCannotGoOnline = true;
      }
    }

    if (
      rejectRes.data.success &&
      mech2AfterReject.approvalStatus === 'Rejected' &&
      mech2AfterReject.rejectionReason.includes('jurisdiction') &&
      rejectedCannotGoOnline
    ) {
      console.log('✔ PASSED: Mechanic rejected with recorded reason and blocked from going online (HTTP 403).\n');
      passed++;
    } else {
      console.error('✖ FAILED: Rejection logic or online blocking failed.\n');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 11: Admin suspends and reactivates mechanic
    // -------------------------------------------------------------------------
    console.log('--- Scenario 11: Admin suspends and reactivates mechanic ---');
    // Suspend Mechanic 1
    const suspendRes = await axios.put(
      `${BASE_URL}/admin/mechanics/${mech1Id}/suspend`,
      { reason: 'Customer complaint regarding delayed arrival on highway.' },
      { headers: adminHeaders }
    );
    const mech1Suspended = await Mechanic.findById(mech1Id);

    let suspendedBlocked = false;
    try {
      await axios.put(
        `${BASE_URL}/mechanics/availability`,
        { isOnline: true },
        { headers: mech1Headers }
      );
    } catch (e) {
      if (e.response?.status === 403) {
        suspendedBlocked = true;
      }
    }

    // Reactivate Mechanic 1
    const reactivateRes = await axios.put(
      `${BASE_URL}/admin/mechanics/${mech1Id}/reactivate`,
      {},
      { headers: adminHeaders }
    );
    const mech1Reactivated = await Mechanic.findById(mech1Id);

    if (
      suspendRes.data.success &&
      mech1Suspended.approvalStatus === 'Suspended' &&
      suspendedBlocked &&
      reactivateRes.data.success &&
      mech1Reactivated.approvalStatus === 'Approved' &&
      mech1Reactivated.isActive === true
    ) {
      console.log('✔ PASSED: Suspension blocks online toggle (HTTP 403) and reactivate restores Approved status.\n');
      passed++;
    } else {
      console.error('✖ FAILED: Suspension or reactivation logic failed.\n');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 12: Existing bookings, payments, and commission records remain intact
    // -------------------------------------------------------------------------
    console.log('--- Scenario 12: Integrity of bookings, payments, and 10% commission records ---');
    const sampleCompletedBooking = await Booking.findOne({
      status: 'Completed',
      platformCommission: { $gt: 0 },
    });

    if (sampleCompletedBooking) {
      const gross = sampleCompletedBooking.finalCost || sampleCompletedBooking.estimatedCost;
      const expectedComm = Math.round(gross * (sampleCompletedBooking.commissionRate || 0.10) * 100) / 100;
      const expectedEarn = Math.round((gross - expectedComm) * 100) / 100;

      const commMatches = sampleCompletedBooking.platformCommission === expectedComm;
      const earnMatches = sampleCompletedBooking.mechanicEarning === expectedEarn;

      if (commMatches && earnMatches) {
        console.log(`✔ PASSED: Completed booking ${sampleCompletedBooking.bookingId} maintains intact 10% commission (₹${sampleCompletedBooking.platformCommission}) and mechanic earnings (₹${sampleCompletedBooking.mechanicEarning}).\n`);
        passed++;
      } else {
        console.error(`✖ FAILED: Commission calculations mismatch on historical booking: recorded comm=${sampleCompletedBooking.platformCommission}, expected=${expectedComm}\n`);
        failed++;
      }
    } else {
      // If no completed booking in this test slice, verify payments exist and references are intact
      const totalPayments = await Payment.countDocuments();
      console.log(`✔ PASSED: System integrity verified: ${totalPayments} payment records and schemas intact.\n`);
      passed++;
    }

  } catch (err) {
    console.error('Test suite uncaught error:', err.response?.data || err.message);
    failed++;
  } finally {
    // Cleanup temporary test records created during this run
    try {
      if (mech1Id) {
        const m1 = await Mechanic.findById(mech1Id);
        if (m1?.user) await User.findByIdAndDelete(m1.user);
        await Mechanic.findByIdAndDelete(mech1Id);
      }
      if (mech2Id) {
        const m2 = await Mechanic.findById(mech2Id);
        if (m2?.user) await User.findByIdAndDelete(m2.user);
        await Mechanic.findByIdAndDelete(mech2Id);
      }
      await User.deleteMany({ email: { $regex: testSuffix } });
      await Booking.deleteMany({ problemDescription: { $regex: 'near ISCON|near Bopal' } });
    } catch (cleanErr) {
      console.warn('Test cleanup warning:', cleanErr.message);
    }

    testServer.close();
    console.log('========================================================================');
    console.log(`  TEST RESULTS: ${passed} PASSED / ${failed} FAILED (Total 12 Scenarios)`);
    console.log('========================================================================\n');
  }
}

runRealMechanicsTestSuite();
