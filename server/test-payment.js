const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const axios = require('axios');
const http = require('http');
const crypto = require('crypto');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seeder');
const { app } = require('./server');
const {
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
} = require('./config/razorpay');

const TEST_PORT = 5002;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

async function runPaymentTests() {
  console.log('====================================================');
  console.log('  RUNNING RAZORPAY PAYMENT & COMMISSION TEST SUITE  ');
  console.log('====================================================\n');

  await connectDB();
  await seedDatabase();

  const testServer = http.createServer(app);
  await new Promise((resolve) => testServer.listen(TEST_PORT, resolve));
  console.log(`Test server running on port ${TEST_PORT}...\n`);

  let passed = 0;
  let failed = 0;

  try {
    // -------------------------------------------------------------------------
    // Test 1: Cryptographic Razorpay Signature Verification
    // -------------------------------------------------------------------------
    console.log('--- Test 1: HMAC-SHA256 Razorpay Signature Verification ---');
    const dummyOrderId = 'order_DA1234567890';
    const dummyPaymentId = 'pay_DA9876543210';
    const secret = process.env.RAZORPAY_KEY_SECRET || 'razorpay_secret_highway_rescue_test';

    const validSig = crypto
      .createHmac('sha256', secret)
      .update(`${dummyOrderId}|${dummyPaymentId}`)
      .digest('hex');

    const isValid = verifyRazorpaySignature(dummyOrderId, dummyPaymentId, validSig);
    const isTamperedInvalid = verifyRazorpaySignature(dummyOrderId, dummyPaymentId, 'invalid_signature_hex_12345');

    if (isValid === true && isTamperedInvalid === false) {
      console.log('✔ PASS: Cryptographic signature verification accepts authentic signature and rejects tampered signature.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Signature verification logic failed:', { isValid, isTamperedInvalid });
      failed++;
    }

    // -------------------------------------------------------------------------
    // Test 2: Webhook Signature Verification
    // -------------------------------------------------------------------------
    console.log('--- Test 2: Razorpay Webhook Signature Verification ---');
    const webhookSecret = 'test_webhook_secret_key_123';
    const webhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_test_wh', amount: 50000 } } },
    });

    const validWebhookSig = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookPayload)
      .digest('hex');

    const isWebhookValid = verifyRazorpayWebhookSignature(webhookPayload, validWebhookSig, webhookSecret);
    const isWebhookTampered = verifyRazorpayWebhookSignature(webhookPayload, 'bad_signature_123', webhookSecret);

    if (isWebhookValid === true && isWebhookTampered === false) {
      console.log('✔ PASS: Webhook signature verification verified authentic webhook payload and rejected tampered payload.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Webhook signature check failed:', { isWebhookValid, isWebhookTampered });
      failed++;
    }

    // -------------------------------------------------------------------------
    // Authenticate Customer 1, Customer 2, and Mechanic
    // -------------------------------------------------------------------------
    const cust1Login = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'rahul.sharma@example.com',
      password: 'Customer@123',
    });
    const cust1Token = cust1Login.data.token;
    const cust1Headers = { Authorization: `Bearer ${cust1Token}` };

    let cust2Token;
    try {
      const cust2Login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'priya.customer@example.com',
        password: 'Customer@123',
      });
      cust2Token = cust2Login.data.token;
    } catch {
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

    const mechLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patel.auto@example.com',
      password: 'Mechanic@123',
    });
    const mechToken = mechLogin.data.token;
    const mechHeaders = { Authorization: `Bearer ${mechToken}` };

    // -------------------------------------------------------------------------
    // Create a Test Booking for Customer 1
    // -------------------------------------------------------------------------
    const bookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Battery Jump Start',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1234',
        problemDescription: 'Dead battery on SG Highway',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: cust1Headers }
    );
    const booking = bookingRes.data.booking;
    const bookingId = booking._id;

    // Mechanic accepts booking and marks as In Progress with finalCost = 500
    await axios.put(`${BASE_URL}/bookings/${bookingId}/accept`, {}, { headers: mechHeaders });
    await axios.put(`${BASE_URL}/bookings/${bookingId}/status`, { status: 'On The Way' }, { headers: mechHeaders });
    await axios.put(`${BASE_URL}/bookings/${bookingId}/status`, { status: 'Arrived' }, { headers: mechHeaders });
    await axios.put(
      `${BASE_URL}/bookings/${bookingId}/status`,
      { status: 'Completed', finalCost: 500 },
      { headers: mechHeaders }
    );

    // -------------------------------------------------------------------------
    // Test 3: Backend Order Creation & Server-Calculated Amount
    // -------------------------------------------------------------------------
    console.log('--- Test 3: Backend Order Creation & 10% Commission Calculation ---');
    const orderRes = await axios.post(
      `${BASE_URL}/payments/create-order`,
      { bookingId },
      { headers: cust1Headers }
    );

    if (
      orderRes.status === 200 &&
      orderRes.data.success &&
      orderRes.data.order &&
      orderRes.data.bookingDetails.amount === 500 &&
      orderRes.data.bookingDetails.commission.rate === 0.10 &&
      orderRes.data.bookingDetails.commission.commissionAmount === 50 &&
      orderRes.data.bookingDetails.commission.mechanicPayout === 450
    ) {
      console.log('✔ PASS: Order created securely on backend with server-calculated amount (₹500).');
      console.log(`  Commission Breakdown: Platform (10%)=₹50, Mechanic Payout (90%)=₹450.\n`);
      passed++;
    } else {
      console.error('❌ FAIL: Order creation response invalid:', orderRes.data);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Test 4: Access Control - Unauthorized Customer cannot create order
    // -------------------------------------------------------------------------
    console.log('--- Test 4: Access Control: Customer 2 cannot initiate payment for Customer 1 ---');
    try {
      await axios.post(
        `${BASE_URL}/payments/create-order`,
        { bookingId },
        { headers: cust2Headers }
      );
      console.error('❌ FAIL: Unauthorized user was able to create payment order!');
      failed++;
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(`✔ PASS: Unauthorized user rejected with HTTP 403 Forbidden: "${err.response.data.message}"\n`);
        passed++;
      } else {
        console.error('❌ FAIL: Unexpected error code:', err.response?.status);
        failed++;
      }
    }

    // -------------------------------------------------------------------------
    // Test 5: Verify Payment & Update Booking to 'Paid'
    // -------------------------------------------------------------------------
    console.log('--- Test 5: Verify Payment & Mark Booking as Paid ---');
    const orderData = orderRes.data.order;
    const verifyRes = await axios.post(
      `${BASE_URL}/payments/verify`,
      {
        bookingId,
        razorpay_order_id: orderData.id,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: 'simulated_valid_signature',
      },
      { headers: cust1Headers }
    );

    if (
      verifyRes.status === 200 &&
      verifyRes.data.success &&
      verifyRes.data.booking.paymentStatus === 'Paid' &&
      verifyRes.data.payment.commissionAmount === 50 &&
      verifyRes.data.payment.mechanicPayout === 450
    ) {
      console.log('✔ PASS: Payment verified, booking marked as Paid, Payment record saved with 10% commission.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Payment verification output invalid:', verifyRes.data);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Test 6: Prevent Duplicate Payment for already Paid booking
    // -------------------------------------------------------------------------
    console.log('--- Test 6: Prevent duplicate payment on already Paid booking ---');
    try {
      await axios.post(
        `${BASE_URL}/payments/create-order`,
        { bookingId },
        { headers: cust1Headers }
      );
      console.error('❌ FAIL: Allowed duplicate order creation for already paid booking!');
      failed++;
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.message.includes('already been paid')) {
        console.log(`✔ PASS: Duplicate payment prevented with HTTP 400: "${err.response.data.message}"\n`);
        passed++;
      } else {
        console.error('❌ FAIL: Unexpected response for duplicate payment attempt:', err.response?.status);
        failed++;
      }
    }

    // -------------------------------------------------------------------------
    // Test 7: Cash On Delivery / Handover Payment Flow
    // -------------------------------------------------------------------------
    console.log('--- Test 7: Cash Payment Option with 10% Platform Commission ---');
    const cashBookingRes = await axios.post(
      `${BASE_URL}/bookings`,
      {
        serviceType: 'Puncture Repair',
        vehicleType: 'Car',
        vehicleNumber: 'GJ-01-AB-1234',
        problemDescription: 'Cash payment test booking',
        latitude: 23.0338,
        longitude: 72.5186,
      },
      { headers: cust1Headers }
    );
    const cashBookingId = cashBookingRes.data.booking._id;

    // Complete booking with finalCost = 300
    await axios.put(`${BASE_URL}/bookings/${cashBookingId}/accept`, {}, { headers: mechHeaders });
    await axios.put(
      `${BASE_URL}/bookings/${cashBookingId}/status`,
      { status: 'Completed', finalCost: 300 },
      { headers: mechHeaders }
    );

    const cashPayRes = await axios.post(
      `${BASE_URL}/payments/cash`,
      { bookingId: cashBookingId },
      { headers: cust1Headers }
    );

    if (
      cashPayRes.status === 200 &&
      cashPayRes.data.booking.paymentStatus === 'Paid' &&
      cashPayRes.data.booking.paymentMethod === 'Cash' &&
      cashPayRes.data.payment.commissionAmount === 30 &&
      cashPayRes.data.payment.mechanicPayout === 270
    ) {
      console.log('✔ PASS: Cash payment successfully logged with status Paid and 10% commission breakdown.\n');
      passed++;
    } else {
      console.error('❌ FAIL: Cash payment recording failed:', cashPayRes.data);
      failed++;
    }

    // -------------------------------------------------------------------------
    // Test 8: Payment Transaction History
    // -------------------------------------------------------------------------
    console.log('--- Test 8: Payment Transaction History ---');
    const historyRes = await axios.get(`${BASE_URL}/payments/history`, { headers: cust1Headers });
    if (historyRes.status === 200 && Array.isArray(historyRes.data.data) && historyRes.data.data.length >= 2) {
      console.log(`✔ PASS: Payment history successfully returned ${historyRes.data.data.length} transactions.\n`);
      passed++;
    } else {
      console.error('❌ FAIL: Failed to retrieve payment history:', historyRes.data);
      failed++;
    }

    console.log('====================================================');
    console.log(`  PAYMENT SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    testServer.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err.message);
    if (err.response) console.error('Response details:', err.response.data);
    testServer.close();
    process.exit(1);
  }
}

runPaymentTests();
