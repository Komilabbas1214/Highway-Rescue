const Razorpay = require('razorpay');
const crypto = require('crypto');

let razorpayInstance = null;

/**
 * Checks whether valid Razorpay credentials (test or live) are configured.
 * Placeholder keys (e.g., demo123) are treated as unconfigured to prevent
 * checkout.js from making unauthenticated requests that trigger Chrome HTTP Basic Auth popups.
 */
const isRazorpayConfigured = () => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || '';

  const hasValidKeyFormat =
    (keyId.startsWith('rzp_test_') || keyId.startsWith('rzp_live_')) &&
    !keyId.includes('demo123') &&
    keyId.length >= 14;

  const hasValidSecret =
    keySecret.length >= 10 &&
    !keySecret.includes('highway_rescue_test');

  return Boolean(hasValidKeyFormat && hasValidSecret);
};

/**
 * Initializes and returns the Razorpay SDK instance using server environment variables.
 * Orders API requests are strictly executed from the Node.js backend.
 */
const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return null;
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

/**
 * Verifies the Razorpay payment signature using HMAC-SHA256 and timing-safe comparison.
 */
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  try {
    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');
    if (genBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (err) {
    return false;
  }
};

/**
 * Verifies Razorpay Webhook signature using timing-safe comparison.
 */
const verifyRazorpayWebhookSignature = (rawBody, signature, webhookSecret) => {
  const secret = webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !rawBody || !signature) {
    return false;
  }

  const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    const genBuf = Buffer.from(generatedSignature, 'utf8');
    const sigBuf = Buffer.from(signature, 'utf8');
    if (genBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (err) {
    return false;
  }
};

module.exports = {
  isRazorpayConfigured,
  getRazorpayInstance,
  verifyRazorpaySignature,
  verifyRazorpayWebhookSignature,
};
