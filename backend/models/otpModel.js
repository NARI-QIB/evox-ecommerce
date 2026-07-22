const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['activation', 'resetPassword'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // 🌟 TTL Index: سيتم حذف الوثيقة تلقائياً من MongoDB بعد 600 ثانية (10 دقائق)
  }
});

const Otp = mongoose.model('Otp', otpSchema);
module.exports = Otp;