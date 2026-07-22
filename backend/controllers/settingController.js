// filepath: backend/controllers/settingController.js
const asyncHandler = require('../utils/asyncHandler');
const Setting = require('../models/settingModel');

const getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne({ isGlobal: true });
  if (!settings) {
    settings = new Setting(); 
  }
  res.status(200).json(settings);
});

const updateSettings = asyncHandler(async (req, res) => {
  const { 
    storeLogo,
    adminLogo, // 🌟 إضافة شعار الإدارة
    heroTitle, 
    heroSubtitle, 
    heroBannerDesktop, 
    heroBannerMobile, 
    loginBanner, 
    registerBanner 
  } = req.body;

  const updateData = {};

  if (storeLogo !== undefined) updateData.storeLogo = storeLogo;
  if (adminLogo !== undefined) updateData.adminLogo = adminLogo; // 🌟 حفظ شعار الإدارة
  if (heroTitle !== undefined) updateData.heroTitle = heroTitle;
  if (heroSubtitle !== undefined) updateData.heroSubtitle = heroSubtitle;
  if (heroBannerDesktop !== undefined) updateData.heroBannerDesktop = heroBannerDesktop;
  if (heroBannerMobile !== undefined) updateData.heroBannerMobile = heroBannerMobile;
  if (loginBanner !== undefined) updateData.loginBanner = loginBanner;
  if (registerBanner !== undefined) updateData.registerBanner = registerBanner;

  const updatedSettings = await Setting.findOneAndUpdate(
    { isGlobal: true }, 
    { $set: updateData },
    { 
      new: true,            
      upsert: true,         
      setDefaultsOnInsert: true, 
      runValidators: true   
    }
  );

  res.status(200).json(updatedSettings);
});

module.exports = { getSettings, updateSettings };