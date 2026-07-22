// filepath: backend/models/settingModel.js
const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    isGlobal: { 
      type: Boolean, 
      default: true, 
      unique: true 
    },
    // شعار الواجهة الأمامية
    storeLogo: { type: String, default: '' },
    // 🌟 شعار لوحة التحكم (الجديد)
    adminLogo: { type: String, default: '' },
    
    heroTitle: {
      en: { type: String, default: 'Push Your Limits' },
      ar: { type: String, default: 'اكتشف قدراتك' },
    },
    heroSubtitle: {
      en: { type: String, default: 'Discover elite gear designed for peak performance.' },
      ar: { type: String, default: 'اكتشف أفضل المعدات الرياضية المصممة للأداء العالي.' },
    },
    heroBannerDesktop: { type: String, default: '/images/hero-bg.webp' },
    heroBannerMobile: { type: String, default: '/images/hero-mobile.webp' },
    
    loginBanner: { type: String, default: '/images/mazraoui.jpg' },
    registerBanner: { type: String, default: '/images/mazraoui-2.jpg' },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model('Setting', settingSchema);
module.exports = Setting;