const axios = require('axios');
const http = require('http');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seeder');
const { app, server } = require('./server');

const BASE_URL = 'http://localhost:5001/api';

async function runTests() {
  console.log('====================================================');
  console.log('  RUNNING BOOKING CANCELLATION VALIDATION SUITE');
  console.log('====================================================\n');

  await connectDB();
  await seedDatabase();

  // Start temporary test server on port 5001
  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(5001, resolve));
  console.log('Test server listening on port 5001...\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Authenticate Customer 1 (Rahul)
    const cust1Login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'rahul.sharma@example.com',
      password: 'Customer@123',
    });
    const cust1Token = cust1Login.data.token;
    const cust1Headers = { Authorization: `Bearer ${cust1Token}` };

    // 2. Authenticate Customer 2 (Create if needed or register)
    let cust2Token;
    try {
      const cust2Login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'priya.customer@example.com',
        password: 'Customer@123',
      });
      cust2Token = cust2Login.data.token;
    } catch (e) {
      const cust2Reg = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Priya Sharma',
        email: 'priya.customer@example.com',
        phone: '+91 98980 99999',
        password: 'Customer@123',
        confirmPassword: 'Customer@123',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-XY-9999',
      });
      cust2Token = cust2Reg.data.token;
    }
    const cust2Headers = { Authorization: `Bearer ${cust2Token}` };

    // 3. Authenticate Mechanic (Patel Auto)
    const mechLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patel.auto@example.com',
      password: 'Mechanic@123',
    });
    const mechToken = mechLogin.data.token;
    const mechHeaders = { Authorization: `Bearer ${mechToken}` };

    console.log('✔ Authentication setup complete for Customer 1, Customer 2, and Mechanic.\n');

    // -------------------------------------------------------------
    // Scenario 1: Customer cancels a Pending booking → Success
    // -------------------------------------------------------------
    console.log('--- Scenario 1: Customer cancels a Pending booking ---');
    const s1BookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Puncture Repair',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1234',
        problemDescription: 'Test puncture near Bodakdev',
        latitude: 23.0338,
        longitude: 72.5186,
        address: 'SG Highway, Bodakdev',
      },
      { headers: cust1Headers }
    );
    const s1Id = s1BookingRes.data.booking._id;

    const s1CancelRes = await axios.put(
      `${BASE_URL}/bookings/${s1Id}/cancel`,
      { reason: 'Found a nearby puncture shop on foot' },
      { headers: cust1Headers }
    );

    if (
      s1CancelRes.status === 200 &&
      s1CancelRes.data.booking.status === 'Cancelled' &&
      s1CancelRes.data.booking.cancelledBy === 'customer'
    ) {
      console.log('✔ PASS: Pending booking cancelled successfully (HTTP 200, status=Cancelled).\n');
      passed++;
    } else {
      console.error('❌ FAIL: Expected status Cancelled, got:', s1CancelRes.data);
      failed++;
    }

    // -------------------------------------------------------------
    // Scenario 2: Customer tries cancelling an Accepted booking → Rejected
    // -------------------------------------------------------------
    console.log('--- Scenario 2: Customer tries cancelling an Accepted booking ---');
    const s2BookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Battery Jump Start',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1234',
        problemDescription: 'Test battery jump start near ISCON',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: cust1Headers }
    );
    const s2Id = s2BookingRes.data.booking._id;

    // Mechanic accepts
    await axios.put(`${BASE_URL}/bookings/${s2Id}/accept`, {}, { headers: mechHeaders });

    // Customer tries to cancel
    try {
      await axios.put(
        `${BASE_URL}/bookings/${s2Id}/cancel`,
        { reason: 'Want to cancel now' },
        { headers: cust1Headers }
      );
      console.error('❌ FAIL: Accepted booking was allowed to be cancelled!');
      failed++;
    } catch (err) {
      if (
        err.response &&
        err.response.status === 409 &&
        err.response.data.message.includes('already accepted')
      ) {
        console.log(`✔ PASS: Cancellation rejected with HTTP 409 Conflict: "${err.response.data.message}"\n`);
        passed++;
      } else {
        console.error('❌ FAIL: Unexpected error response:', err.response?.status, err.response?.data);
        failed++;
      }
    }

    // -------------------------------------------------------------
    // Scenario 3: Customer tries cancelling an Arrived booking → Rejected
    // -------------------------------------------------------------
    console.log('--- Scenario 3: Customer tries cancelling an Arrived booking ---');
    // Advance s2 booking to 'On The Way' then 'Arrived'
    await axios.put(`${BASE_URL}/bookings/${s2Id}/status`, { status: 'On The Way' }, { headers: mechHeaders });
    await axios.put(`${BASE_URL}/bookings/${s2Id}/status`, { status: 'Arrived' }, { headers: mechHeaders });

    try {
      await axios.put(
        `${BASE_URL}/bookings/${s2Id}/cancel`,
        { reason: 'Trying to cancel after arrival' },
        { headers: cust1Headers }
      );
      console.error('❌ FAIL: Arrived booking was allowed to be cancelled!');
      failed++;
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log(`✔ PASS: Cancellation rejected with HTTP 409 Conflict on Arrived status: "${err.response.data.message}"\n`);
        passed++;
      } else {
        console.error('❌ FAIL: Unexpected error response:', err.response?.status, err.response?.data);
        failed++;
      }
    }

    // -------------------------------------------------------------
    // Scenario 4: Customer tries cancelling a Completed booking → Rejected
    // -------------------------------------------------------------
    console.log('--- Scenario 4: Customer tries cancelling a Completed booking ---');
    // Complete s2 booking
    await axios.put(`${BASE_URL}/bookings/${s2Id}/status`, { status: 'Completed', finalCost: 350 }, { headers: mechHeaders });

    try {
      await axios.put(
        `${BASE_URL}/bookings/${s2Id}/cancel`,
        { reason: 'Trying to cancel completed job' },
        { headers: cust1Headers }
      );
      console.error('❌ FAIL: Completed booking was allowed to be cancelled!');
      failed++;
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log(`✔ PASS: Cancellation rejected with HTTP 409 Conflict on Completed status: "${err.response.data.message}"\n`);
        passed++;
      } else {
        console.error('❌ FAIL: Unexpected error response:', err.response?.status, err.response?.data);
        failed++;
      }
    }

    // -------------------------------------------------------------
    // Scenario 5: Customer attempts to cancel another customer's booking → Forbidden
    // -------------------------------------------------------------
    console.log('--- Scenario 5: Customer attempts to cancel another customer\'s booking ---');
    const s5BookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Towing Service',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1234',
        problemDescription: 'Customer 1 vehicle needing towing',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: cust1Headers }
    );
    const s5Id = s5BookingRes.data.booking._id;

    // Customer 2 attempts to cancel Customer 1's booking
    try {
      await axios.put(
        `${BASE_URL}/bookings/${s5Id}/cancel`,
        { reason: 'Malicious cancellation by another user' },
        { headers: cust2Headers }
      );
      console.error('❌ FAIL: Unauthorized customer was allowed to cancel another customer\'s booking!');
      failed++;
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✔ PASS: Cancel attempt rejected with HTTP 403 Forbidden: "${err.response.data.message}"\n`);
        passed++;
      } else {
        console.error('❌ FAIL: Expected 403 Forbidden, got:', err.response?.status, err.response?.data);
        failed++;
      }
    }

    // -------------------------------------------------------------
    // Scenario 6: Mechanic accepts while customer tries cancelling → Only one operation succeeds
    // -------------------------------------------------------------
    console.log('--- Scenario 6: Mechanic accepts while customer tries cancelling (Concurrency Race) ---');
    const s6BookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Fuel Delivery',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1234',
        problemDescription: 'Out of petrol on SG Highway',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: cust1Headers }
    );
    const s6Id = s6BookingRes.data.booking._id;

    // Execute cancel and accept simultaneously
    const [cancelResult, acceptResult] = await Promise.allSettled([
      axios.put(`${BASE_URL}/bookings/${s6Id}/cancel`, { reason: 'Car started' }, { headers: cust1Headers }),
      axios.put(`${BASE_URL}/bookings/${s6Id}/accept`, {}, { headers: mechHeaders }),
    ]);

    const cancelSuccess = cancelResult.status === 'fulfilled' && cancelResult.value.status === 200;
    const acceptSuccess = acceptResult.status === 'fulfilled' && acceptResult.value.status === 200;

    console.log(`Simultaneous operations result: Cancel=${cancelSuccess ? 'SUCCESS (200)' : 'FAILED (' + (cancelResult.reason?.response?.status || 'err') + ')'}, Accept=${acceptSuccess ? 'SUCCESS (200)' : 'FAILED (' + (acceptResult.reason?.response?.status || 'err') + ')'}`);

    // Exactly one must succeed and one must fail
    if ((cancelSuccess && !acceptSuccess) || (!cancelSuccess && acceptSuccess)) {
      console.log('✔ PASS: Atomic conditional update guaranteed exactly ONE operation succeeded.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Both operations succeeded or both failed unexpectedly!');
      failed++;
    }

    // -------------------------------------------------------------
    // Scenario 7: Refresh customer dashboard → Verify state
    // -------------------------------------------------------------
    console.log('--- Scenario 7: Customer Dashboard booking list refresh ---');
    const myBookingsRes = await axios.get(`${BASE_URL}/bookings/my-bookings`, { headers: cust1Headers });
    if (myBookingsRes.status === 200 && Array.isArray(myBookingsRes.data.bookings)) {
      console.log(`✔ PASS: Customer dashboard bookings retrieved successfully (${myBookingsRes.data.bookings.length} total bookings).`);
      console.log(`Active booking status: ${myBookingsRes.data.activeBooking?.status || 'None'}\n`);
      passed++;
    } else {
      console.error('❌ FAIL: Failed to retrieve customer bookings');
      failed++;
    }

    console.log('====================================================');
    console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    testServer.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test execution error:', error.message);
    if (error.response) console.error('Response data:', error.response.data);
    testServer.close();
    process.exit(1);
  }
}

runTests();
