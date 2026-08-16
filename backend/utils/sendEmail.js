// filepath: backend/utils/sendEmail.js
const axios = require('axios');

const sendEmail = async (options) => {
  // 🌟 إرسال الإيميل عبر Google Serverless Microservice (HTTPS Port 443)
  if (process.env.GOOGLE_SCRIPT_URL) {
    try {
      const response = await axios.post(
        process.env.GOOGLE_SCRIPT_URL,
        {
          email: options.email,
          subject: options.subject,
          html: options.html || `<p>${options.message}</p>`,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      if (response.data && response.data.result === 'success') {
        console.log(`✅ Email successfully sent via Google Microservice to: ${options.email}`);
        return;
      } else {
        throw new Error(response.data?.message || 'Failed to send email via Google Script');
      }
    } catch (error) {
      console.error('❌ Google Script Error:', error.message);
      throw error;
    }
  } else {
    throw new Error('GOOGLE_SCRIPT_URL is not defined in environment variables');
  }
};

module.exports = sendEmail;