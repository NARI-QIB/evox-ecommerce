// filepath: backend/middleware/csrfMiddleware.js
const crypto = require('crypto');

// 1. دالة لتوليد رمز CSRF وإرساله ككوكيز محمي و JSON
const generateCsrfToken = (req, res) => {
  // 🌟 الإصلاح المعماري الأهم: إعادة استخدام الرمز الموجود لمنع تضارب الـ Race Conditions
  let csrfToken = req.cookies['_csrfAuth'];
  
  if (!csrfToken) {
    // توليد رمز عشوائي قوي فقط إذا لم يكن موجوداً
    csrfToken = crypto.randomBytes(32).toString('hex');
    
    // حفظ الرمز في HttpOnly Cookie
    res.cookie('_csrfAuth', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 ساعة
    });
  }

  // إرسال الرمز كبيانات لكي تحتفظ به الواجهة الأمامية
  res.status(200).json({ csrfToken });
};

// 2. ميدل وير للتحقق من تطابق الـ Header مع الـ Cookie
const csrfProtection = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies['_csrfAuth'];
  const headerToken = req.headers['x-csrf-token']; 

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403);
    const err = new Error('Security Restriction: Invalid CSRF Token!');
    return next(err);
  }
  
  next();
};

module.exports = { generateCsrfToken, csrfProtection };