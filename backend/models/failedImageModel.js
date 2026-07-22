// filepath: backend/models/failedImageModel.js
const mongoose = require('mongoose');

const failedImageSchema = new mongoose.Schema({
  publicId: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  attempts: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model('FailedImage', failedImageSchema);