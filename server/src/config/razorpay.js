const Razorpay = require('razorpay');
const crypto = require('crypto');
const env = require('./env');

let razorpayInstance = null;

const PLACEHOLDER_KEYS = new Set([
  '',
  'rzp_test_sample',
  'rzp_test_ranvi2026',
  'rzp_test_your_key_id',
  'your_key_id',
]);

const PLACEHOLDER_SECRETS = new Set([
  '',
  'rzp_test_secret',
  'your_secret_key',
  'your_key_secret',
]);

const PLACEHOLDER_WEBHOOK_SECRETS = new Set([
  '',
  'rzp_webhook_secret',
  'your_webhook_secret',
]);

const isRazorpayConfigured = () =>
  Boolean(
    razorpayInstance &&
    env.RAZORPAY_KEY_ID &&
    env.RAZORPAY_KEY_SECRET &&
    !PLACEHOLDER_KEYS.has(env.RAZORPAY_KEY_ID.trim()) &&
    !PLACEHOLDER_SECRETS.has(env.RAZORPAY_KEY_SECRET.trim())
  );

try {
  if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }
} catch (error) {
  console.warn('[Razorpay] Failed to initialize Razorpay SDK instance:', error.message);
}

const safeTimingEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

const verifySignature = (orderId, paymentId, signature) => {
  if (!orderId || !paymentId || !signature || !env.RAZORPAY_KEY_SECRET) return false;
  const hmac = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET);
  hmac.update(`${orderId}|${paymentId}`);
  const expectedSignature = hmac.digest('hex');
  return safeTimingEqual(expectedSignature, String(signature).trim());
};

const verifyWebhookSignature = (rawBody, signature) => {
  if (!rawBody || !signature || !env.RAZORPAY_WEBHOOK_SECRET) return false;
  if (env.NODE_ENV === 'production' && PLACEHOLDER_WEBHOOK_SECRETS.has(env.RAZORPAY_WEBHOOK_SECRET.trim())) {
    return false;
  }
  const hmac = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET);
  hmac.update(rawBody);
  const expectedSignature = hmac.digest('hex');
  return safeTimingEqual(expectedSignature, String(signature).trim());
};

module.exports = {
  razorpayInstance,
  isRazorpayConfigured,
  verifySignature,
  verifyWebhookSignature,
};
