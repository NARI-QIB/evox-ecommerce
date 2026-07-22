// filepath: backend/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (res, id) => {
  // 🌟 استخدام مفتاح سري خاص بـ Access Token (عمر 15 دقيقة)
  const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  const accessToken = jwt.sign({ id }, accessSecret, {
    expiresIn: '15m',
  });

  // 🌟 استخدام مفتاح سري مختلف خاص بـ Refresh Token (عمر 7 أيام)
  const refreshSecret = process.env.JWT_REFRESH_SECRET || `${process.env.JWT_SECRET}_refresh`;
  const refreshToken = jwt.sign({ id }, refreshSecret, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('jwt', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 دقيقة
  });

  res.cookie('jwt_refresh', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
  });
};

module.exports = generateToken;