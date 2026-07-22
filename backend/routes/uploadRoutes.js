// filepath: backend/routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary, deleteCloudinaryImage } = require('../config/cloudinary'); 
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_FOLDERS = ['categories', 'settings', 'products', 'misc'];

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const rawFolder = req.body.folder ? String(req.body.folder).trim().toLowerCase() : '';
    const safeFolder = ALLOWED_FOLDERS.includes(rawFolder) ? rawFolder : 'misc';
    
    let folderName = `evox/${safeFolder}`;

    if (req.body.styleCode) {
      const sanitizedStyleCode = String(req.body.styleCode).replace(/[^a-zA-Z0-9-]/g, '').trim();
      if (sanitizedStyleCode) {
        folderName += `/${sanitizedStyleCode}`;
      }
    }

    return {
      folder: folderName,
      // 🌟 حصر الصيغ الآمنة فقط
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      public_id: `${file.fieldname}-${Date.now()}`,
    };
  },
});

// 🌟 فحص نوع الملف المرفوع لمنع رفوعات الـ Executable SVG و الـ Scripts
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Security Alert: Invalid file type. Only JPEG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // حد أقصى 5 ميجابايت
  fileFilter: fileFilter
});

router.post('/single', protect, admin, upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No image file provided');
  }
  res.status(200).json({ message: 'Image Uploaded Successfully', image: req.file.path });
});

router.post('/', protect, admin, upload.array('images', 20), (req, res) => {
  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No image files provided');
  }
  const imagePaths = req.files.map((file) => file.path);
  res.status(200).json({ message: 'Images Uploaded Successfully', images: imagePaths });
});

router.post('/destroy', protect, admin, async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required' });
  }
  
  try {
    await deleteCloudinaryImage(imageUrl);
    res.status(200).json({ message: 'Image deleted from cloud' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete image' });
  }
});

module.exports = router;