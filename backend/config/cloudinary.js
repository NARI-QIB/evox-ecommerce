// filepath: backend/config/cloudinary.js
const { v2: cloudinary } = require('cloudinary');
const FailedImage = require('../models/failedImageModel');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteCloudinaryImage = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;

  try {
    const regex = /\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/;
    const match = imageUrl.match(regex);
    
    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId);
      console.log(`✅ Cleaned up from Cloudinary in background: ${publicId}`);
    }
  } catch (error) {
    console.error(`❌ Failed to delete image from Cloudinary: ${imageUrl}`);
    
    // 🌟 استراتيجية الإنقاذ: حفظ العملية الفاشلة في قاعدة البيانات لمعالجتها لاحقاً
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+?)\.[a-zA-Z0-9]+$/);
    if (match && match[1]) {
       await FailedImage.create({ publicId: match[1], imageUrl }).catch(() => {});
    }
  }
};

// 🌟 وظيفة التنظيف الخلفية
const retryFailedImageDeletions = async () => {
  try {
    const failedImages = await FailedImage.find({ attempts: { $lt: 3 } });
    for (const img of failedImages) {
      try {
        await cloudinary.uploader.destroy(img.publicId);
        await FailedImage.findByIdAndDelete(img._id);
        console.log(`✅ Recovered and deleted orphaned image: ${img.publicId}`);
      } catch (err) {
        img.attempts += 1;
        await img.save();
      }
    }
  } catch (error) {
    console.error("Failed to run image cleanup job", error.message);
  }
};

module.exports = { cloudinary, deleteCloudinaryImage, retryFailedImageDeletions };