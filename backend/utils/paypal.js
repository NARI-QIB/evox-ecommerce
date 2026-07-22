// filepath: backend/utils/paypal.js
const axios = require('axios');

// التبديل الديناميكي لبيئة العمل لتجنب فخ الـ Sandbox في الإنتاج
const PAYPAL_API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

const getPayPalAccessToken = async () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const appSecret = process.env.PAYPAL_APP_SECRET;

  if (!clientId || !appSecret) {
    console.warn("⚠️ PayPal keys are missing. Skipping server-side verification.");
    return null;
  }

  const auth = Buffer.from(`${clientId}:${appSecret}`).toString('base64');

  try {
    const { data } = await axios.post(
      `${PAYPAL_API_URL}/v1/oauth2/token`,
      'grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    return data.access_token;
  } catch (error) {
    console.error('PayPal Auth Error:', error.message);
    throw new Error('Failed to authenticate with PayPal');
  }
};

const verifyPayPalPayment = async (paypalTransactionId, expectedAmount) => {
  const accessToken = await getPayPalAccessToken();
  if (!accessToken) return true;

  try {
    const { data } = await axios.get(
      `${PAYPAL_API_URL}/v2/checkout/orders/${paypalTransactionId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (data.status !== 'COMPLETED') {
      return false;
    }

    const paidAmount = Number(data.purchase_units[0].amount.value);
    const currency = data.purchase_units[0].amount.currency_code;

    if (currency !== 'USD') {
      console.error(`🚨 Security Alert: Currency mismatch. Expected USD, got ${currency}`);
      return false;
    }

    const isValidAmount = Math.abs(paidAmount - expectedAmount) < 0.05; 
    return isValidAmount;
  } catch (error) {
    console.error('PayPal Verification Error:', error.message);
    return false;
  }
};

module.exports = { verifyPayPalPayment };