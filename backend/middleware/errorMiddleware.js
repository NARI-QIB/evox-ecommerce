// filepath: backend/middleware/errorMiddleware.js
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Not Found - ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name; 

  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid ID format.`;
    error = new AppError(message, 400);
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400);
  }
  
  if (err.code === 11000) {
    const message = 'Duplicate field value entered. This record already exists.';
    error = new AppError(message, 400);
  }

  // <-- اصطياد خطأ مكتبة Multer عند تجاوز الحد المسموح به للصورة -->
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File is too large. Maximum allowed size is 5MB.';
    error = new AppError(message, 400);
  }

  const statusCode = error.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);

  res.status(statusCode).json({
    success: false,
    status: error.status || 'error',
    message: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { notFound, errorHandler };