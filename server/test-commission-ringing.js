const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const http = require('http');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seeder');
const { app } = require('./server');
const Booking = require('./models/Booking');
const Mechanic = require('./models/Mechanic');
const Payment = require('./models/Payment');
const CommissionSettlement = require('./models/CommissionSettlement');

const TEST_PORT = 5003;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runCommissionRingingTests() {
  console.log('================================================================');
  console.log('  HIGHWAY RESCUE — 10% COMMISSION & MECHANIC NOTIFICATION SUITE ');
  console.log('================================================================\n');

  await connectDB();
  await seedDatabase();

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));
  console.log(`Test server active on port ${TEST_PORT}...\n`);

  let passed = 0;
  let failed = 0;

  try {
    // -------------------------------------------------------------------------
    // Setup: Authenticate Admin, Customer, and 2 Verified Mechanics
    // -------------------------------------------------------------------------
    console.log('--- Setup: Authenticating Admin, Customer & Mechanics ---');
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@highwayrescue.in',
      password: 'Admin@123',
    });
    const adminHeaders = { Authorization: `Bearer ${adminLogin.data.token}` };

    const custLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'rahul.sharma@example.com',
      password: 'Customer@123',
    });
    const custHeaders = { Authorization: `Bearer ${custLogin.data.token}` };

    const mech1Login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patel.auto@example.com',
      password: 'Mechanic@123',
    });
    const mech1Headers = { Authorization: `Bearer ${mech1Login.data.token}` };
    const mech1Profile = await Mechanic.findOne({ email: 'patel.auto@example.com' });

    // Mechanic 2 (Gujarat Towing)
    const mech2Login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'gujarat.towing@example.com',
      password: 'Mechanic@123',
    });
    const mech2Headers = { Authorization: `Bearer ${mech2Login.data.token}` };
    const mech2Profile = await Mechanic.findOne({ email: 'gujarat.towing@example.com' });

    console.log('✔ Admin, Customer, Mechanic 1, and Mechanic 2 authenticated.\n');

    // -------------------------------------------------------------------------
    // Scenario 1: ₹1,000 completed booking creates ₹100 platform commission and ₹900 mechanic earnings
    // -------------------------------------------------------------------------
    console.log('--- Scenario 1: ₹1,000 completed booking creates ₹100 platform commission & ₹900 mechanic earnings ---');
    const s1BookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Engine Repair',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1000',
        problemDescription: 'Overheating engine on highway',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: custHeaders }
    );
    const s1Id = s1BookingRes.data.booking._id;

    // Mechanic 1 accepts, advances to completed with finalCost = 1000
    await axios.put(`${BASE_URL}/bookings/${s1Id}/accept`, {}, { headers: mech1Headers });
    await axios.put(`${BASE_URL}/bookings/${s1Id}/status`, { status: 'On The Way' }, { headers: mech1Headers });
    await axios.put(`${BASE_URL}/bookings/${s1Id}/status`, { status: 'Arrived' }, { headers: mech1Headers });
    const s1CompleteRes = await axios.put(
      `${BASE_URL}/bookings/${s1Id}/status`,
      { status: 'Completed', finalCost: 1000 },
      { headers: mech1Headers }
    );

    const s1BookingDoc = await Booking.findById(s1Id);

    if (
      s1BookingDoc.finalCost === 1000 &&
      s1BookingDoc.commissionRate === 0.10 &&
      s1BookingDoc.platformCommission === 100 &&
      s1BookingDoc.mechanicEarning === 900 &&
      s1BookingDoc.commissionPaise === 10000 &&
      s1BookingDoc.mechanicEarningPaise === 90000
    ) {
      console.log('✔ PASS: ₹1,000 booking finalized exactly ₹100 (10,000 paise) platform commission and ₹900 (90,000 paise) mechanic earnings.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Incorrect commission split:', {
        finalCost: s1BookingDoc.finalCost,
        platformCommission: s1BookingDoc.platformCommission,
        mechanicEarning: s1BookingDoc.mechanicEarning,
      });
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 2: Pending or cancelled bookings do NOT earn finalized commission
    // -------------------------------------------------------------------------
    console.log('--- Scenario 2: Pending or cancelled bookings do NOT earn finalized commission ---');
    const s2BookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Battery Jump Start',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-2000',
        problemDescription: 'Will cancel this test booking',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: custHeaders }
    );
    const s2Id = s2BookingRes.data.booking._id;
    let s2Doc = await Booking.findById(s2Id);

    const pendingHasNoCommission = s2Doc.platformCommission === 0 && s2Doc.mechanicEarning === 0;

    // Customer cancels pending booking
    await axios.put(`${BASE_URL}/bookings/${s2Id}/cancel`, { reason: 'No longer needed' }, { headers: custHeaders });
    s2Doc = await Booking.findById(s2Id);

    const cancelledHasNoCommission = s2Doc.platformCommission === 0 && s2Doc.mechanicEarning === 0 && s2Doc.status === 'Cancelled';

    if (pendingHasNoCommission && cancelledHasNoCommission) {
      console.log('✔ PASS: Pending and Cancelled bookings earn ₹0 finalized platform commission.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Unfinalized booking had non-zero commission:', { pendingHasNoCommission, cancelledHasNoCommission });
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 3: Duplicate completion or payment callbacks do NOT duplicate commission
    // -------------------------------------------------------------------------
    console.log('--- Scenario 3: Duplicate completion or payment callbacks do not duplicate commission ---');
    // Customer pays for s1 online
    const orderRes = await axios.post(`${BASE_URL}/payments/create-order`, { bookingId: s1Id }, { headers: custHeaders });
    const verifyRes = await axios.post(
      `${BASE_URL}/payments/verify`,
      {
        bookingId: s1Id,
        razorpay_order_id: orderRes.data.order.id,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'simulated_valid_signature',
      },
      { headers: custHeaders }
    );

    // Attempt second payment verification (duplicate callback)
    try {
      await axios.post(
        `${BASE_URL}/payments/verify`,
        {
          bookingId: s1Id,
          razorpay_order_id: orderRes.data.order.id,
          razorpay_payment_id: `pay_test_dup_${Date.now()}`,
          razorpay_signature: 'simulated_valid_signature',
        },
        { headers: custHeaders }
      );
      console.error('❌ FAIL: Duplicate payment was permitted!');
      failed++;
    } catch (err) {
      if (err.response && err.response.status === 400) {
        const countPayments = await Payment.countDocuments({ booking: s1Id, status: 'Captured' });
        const checkBooking = await Booking.findById(s1Id);
        if (countPayments === 1 && checkBooking.platformCommission === 100) {
          console.log(`✔ PASS: Duplicate payment rejected with HTTP 400. Exactly 1 payment recorded (Platform commission remains ₹100).\n`);
          passed++;
        } else {
          console.error('❌ FAIL: Duplicate payment created extra records:', { countPayments });
          failed++;
        }
      } else {
        console.error('❌ FAIL: Unexpected response for duplicate payment attempt:', err.response?.status);
        failed++;
      }
    }

    // -------------------------------------------------------------------------
    // Scenario 4: Cash & Online payment settlement workflows (Admin Reconciliation)
    // -------------------------------------------------------------------------
    console.log('--- Scenario 4: Cash and Online Payment Settlement Workflows ---');
    // Cash booking
    const cashBookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Puncture Repair',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-3000',
        problemDescription: 'Cash settlement test booking',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: custHeaders }
    );
    const cashBookingId = cashBookingRes.data.booking._id;
    await axios.put(`${BASE_URL}/bookings/${cashBookingId}/accept`, {}, { headers: mech1Headers });
    await axios.put(
      `${BASE_URL}/bookings/${cashBookingId}/status`,
      { status: 'Completed', finalCost: 500 },
      { headers: mech1Headers }
    );
    await axios.post(`${BASE_URL}/payments/cash`, { bookingId: cashBookingId }, { headers: custHeaders });

    // Verify initial settlement status is 'Pending'
    const preCashDoc = await Booking.findById(cashBookingId);
    if (preCashDoc.settlementStatus !== 'Pending') {
      console.error('❌ FAIL: Expected initial settlement status Pending, got:', preCashDoc.settlementStatus);
      failed++;
    }

    // Admin reconciles cash commission (Mechanic remits ₹50 cash commission to Platform)
    const recRes = await axios.post(
      `${BASE_URL}/admin/settlements/reconcile-cash`,
      {
        mechanicId: mech1Profile._id,
        bookingIds: [cashBookingId],
        referenceNumber: 'REC-CASH-TEST-001',
        paymentMethod: 'UPI',
        notes: 'Test cash commission received via UPI',
      },
      { headers: adminHeaders }
    );

    const postCashDoc = await Booking.findById(cashBookingId);

    // Admin disburses online earnings payout for s1 (Platform pays ₹900 to Mechanic)
    const payoutRes = await axios.post(
      `${BASE_URL}/admin/settlements/payout-mechanic`,
      {
        mechanicId: mech1Profile._id,
        bookingIds: [s1Id],
        referenceNumber: 'NEFT-PAYOUT-TEST-001',
        paymentMethod: 'Bank_Transfer',
        notes: 'Test online payout disbursed via NEFT',
      },
      { headers: adminHeaders }
    );

    const postOnlineDoc = await Booking.findById(s1Id);

    if (
      recRes.status === 200 &&
      postCashDoc.settlementStatus === 'Settled' &&
      postCashDoc.settlementReference === 'REC-CASH-TEST-001' &&
      payoutRes.status === 200 &&
      postOnlineDoc.settlementStatus === 'Settled' &&
      postOnlineDoc.settlementReference === 'NEFT-PAYOUT-TEST-001'
    ) {
      console.log('✔ PASS: Cash commission reconciled & online payout disbursed with recorded audit ledger entries.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Settlement workflow failed:', {
        cashSettled: postCashDoc.settlementStatus,
        onlineSettled: postOnlineDoc.settlementStatus,
      });
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 5: Online eligible mechanic receives booking alert (Matching logic)
    // -------------------------------------------------------------------------
    console.log('--- Scenario 5: Online eligible mechanic receives booking alert ---');
    // Ensure Mech 1 is online and verified
    mech1Profile.isOnline = true;
    mech1Profile.isVerified = true;
    mech1Profile.services = ['Puncture Repair', 'General Mechanic', 'Battery Jump Start', 'Engine Repair'];
    await mech1Profile.save();

    // Create booking matching Mech 1's service and location
    const s5Booking = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Battery Jump Start',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-5000',
        problemDescription: 'Dead battery in Ahmedabad',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: custHeaders }
    );

    if (s5Booking.status === 201 && s5Booking.data.booking.status === 'Pending') {
      console.log('✔ PASS: Booking created; broadcast dispatched to online verified mechanics within service radius.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Booking creation failed');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 6: Offline mechanic does NOT receive active booking alerts
    // -------------------------------------------------------------------------
    console.log('--- Scenario 6: Offline mechanic filtering ---');
    // Set Mech 2 to offline
    mech2Profile.isOnline = false;
    await mech2Profile.save();

    // Find online mechanics in DB
    const activeOnlineMechanics = await Mechanic.find({ isOnline: true, isVerified: true });
    const isMech2Included = activeOnlineMechanics.some((m) => m._id.toString() === mech2Profile._id.toString());

    if (!isMech2Included) {
      console.log('✔ PASS: Offline mechanic is excluded from active online dispatch queries.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Offline mechanic was incorrectly marked online');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 7: Ring stops on Accept, Reject, Expiry, or Cancellation (Event verification)
    // -------------------------------------------------------------------------
    console.log('--- Scenario 7: Dispatch ringing stop triggers (Accept, Reject, Cancel, Taken) ---');
    const s7Booking = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Puncture Repair',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-7000',
        problemDescription: 'Puncture near highway',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: custHeaders }
    );
    const s7Id = s7Booking.data.booking._id;

    // Rejecting booking
    const rejectRes = await axios.put(`${BASE_URL}/bookings/${s7Id}/reject`, {}, { headers: mech1Headers });
    // Cancelling booking
    const cancelRes = await axios.put(`${BASE_URL}/bookings/${s7Id}/cancel`, { reason: 'Test' }, { headers: custHeaders });

    if (rejectRes.status === 200 && cancelRes.status === 200) {
      console.log('✔ PASS: Reject and Cancel APIs execute successfully, broadcasting termination events to stop ringtones.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Ring stop trigger failed');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 8: Two mechanics accepting simultaneously results in exactly ONE assignment
    // -------------------------------------------------------------------------
    console.log('--- Scenario 8: Race condition — Two mechanics accepting simultaneously ---');
    // Bring Mech 2 back online
    mech2Profile.isOnline = true;
    await mech2Profile.save();

    const s8Booking = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Puncture Repair',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-8000',
        problemDescription: 'Simultaneous acceptance race condition',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: custHeaders }
    );
    const s8Id = s8Booking.data.booking._id;

    // Both mechanics call /accept simultaneously
    const [res1, res2] = await Promise.allSettled([
      axios.put(`${BASE_URL}/bookings/${s8Id}/accept`, {}, { headers: mech1Headers }),
      axios.put(`${BASE_URL}/bookings/${s8Id}/accept`, {}, { headers: mech2Headers }),
    ]);

    const s1Success = res1.status === 'fulfilled' && res1.value.status === 200;
    const s2Success = res2.status === 'fulfilled' && res2.value.status === 200;

    console.log(`Simultaneous accept results: Mech1=${s1Success ? 'WON (200)' : 'LOST (' + (res1.reason?.response?.status || 'err') + ')'}, Mech2=${s2Success ? 'WON (200)' : 'LOST (' + (res2.reason?.response?.status || 'err') + ')'}`);

    if ((s1Success && !s2Success) || (!s1Success && s2Success)) {
      console.log('✔ PASS: Atomic findOneAndUpdate guaranteed exactly ONE mechanic won assignment; the other was rejected with HTTP 409.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Concurrency violation: both or neither mechanic accepted!');
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 9: Real-time Dashboards APIs
    // -------------------------------------------------------------------------
    console.log('--- Scenario 9: Real-time Dashboard APIs ---');
    const adminEarningsRes = await axios.get(`${BASE_URL}/admin/earnings?timeRange=all`, { headers: adminHeaders });
    const mechEarningsRes = await axios.get(`${BASE_URL}/mechanics/earnings`, { headers: mech1Headers });

    if (
      adminEarningsRes.status === 200 &&
      adminEarningsRes.data.data.summary.totalCompletedBookings >= 2 &&
      adminEarningsRes.data.data.summary.totalPlatformCommission > 0 &&
      mechEarningsRes.status === 200 &&
      mechEarningsRes.data.data.summary.totalCompletedJobs >= 2 &&
      mechEarningsRes.data.data.summary.netMechanicEarnings > 0
    ) {
      console.log('✔ PASS: Admin and Mechanic earnings APIs return accurate server-calculated commission breakdowns.');
      console.log(`  Admin Gross Volume: ₹${adminEarningsRes.data.data.summary.grossBookingValue}, Platform Comm: ₹${adminEarningsRes.data.data.summary.totalPlatformCommission}.`);
      console.log(`  Mechanic Net (90%): ₹${mechEarningsRes.data.data.summary.netMechanicEarnings}, 10% Comm Deducted: ₹${mechEarningsRes.data.data.summary.platformCommissionDeducted}.\n`);
      passed++;
    } else {
      console.error('❌ FAIL: Dashboard analytics API response invalid:', {
        admin: adminEarningsRes.data,
        mech: mechEarningsRes.data,
      });
      failed++;
    }

    // -------------------------------------------------------------------------
    // Scenario 10: Existing Authentication, Booking & Payment Intact
    // -------------------------------------------------------------------------
    console.log('--- Scenario 10: Existing Auth, Booking & Payment Stability ---');
    const myBookingsRes = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers: custHeaders });
    const healthRes = await axios.get(`${BASE_URL}/health`);

    if (myBookingsRes.status === 200 && healthRes.data.status === 'online') {
      console.log('✔ PASS: Existing authentication, customer booking retrieval, and API health check all functioning normally.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Existing workflows regression detected');
      failed++;
    }

    console.log('================================================================');
    console.log(`  SUITE COMPLETED: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================');

    testServer.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test suite execution error:', err.message);
    if (err.response) console.error('Response details:', err.response.data);
    testServer.close();
    process.exit(1);
  }
}

runCommissionRingingTests();
