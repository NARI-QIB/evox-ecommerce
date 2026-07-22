// filepath: backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/userModel');
const AppError = require('../utils/AppError');

const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies.jwt;

  if (token) {
    try {
      const accessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, accessSecret);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user || req.user.isDeleted) {
        throw new AppError('Not authorized, user account has been deactivated or deleted', 401);
      }

      if (req.user.passwordChangedAt) {
        const changedTimestamp = parseInt(req.user.passwordChangedAt.getTime() / 1000, 10);
        if (decoded.iat < changedTimestamp) {
          throw new AppError('User recently changed password! Please log in again to sync sessions.', 401);
        }
      }

      next();
    } catch (error) {
      throw new AppError('Not authorized, token failed or expired', 401);
    }
  } else {
    throw new AppError('Not authorized, no token found in cookies', 401);
  }
});

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    throw new AppError('Not authorized as admin', 403);
  }
};

module.exports = { protect, admin };