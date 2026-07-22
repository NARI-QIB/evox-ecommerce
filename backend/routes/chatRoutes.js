// filepath: backend/routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { generateChatResponse } = require('../controllers/chatController');

// إزالة protect للسماح للزوار بالتحدث مع المساعد الذكي
// الحماية من الاستنزاف مضمونة عبر aiLimiter الموجود في server.js
router.route('/').post(generateChatResponse);

module.exports = router;