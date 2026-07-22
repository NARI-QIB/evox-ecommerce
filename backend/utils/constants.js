// filepath: backend/utils/constants.js
module.exports = {
  PAGINATION: {
    PRODUCTS_PER_PAGE: 30,
    ORDERS_PER_PAGE: 15,
    USERS_PER_PAGE: 15,
    REVIEWS_PER_PAGE: 5,
  },
  JWT: {
    EXPIRES_IN: '30d',
    COOKIE_MAX_AGE: 30 * 24 * 60 * 60 * 1000, // 30 يوماً بالمللي ثانية
    VERIFICATION_EXPIRES_IN: '15m',
  },
  OTP: {
    TTL_SECONDS: 600, // 10 دقائق
  }
};