// filepath: backend/routes/userRoutes.js
const express = require('express');
const {
  registerUser,
  authUser,
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  requestEmailUpdate, 
  verifyEmailUpdate,  
  getUsers,
  adminTestRoute,
  deleteUser,
  getUserById,
  updateUser,
  addUserAddress,
  deleteUserAddress,
  updateUserAddress,
  setDefaultAddress,
  toggleWishlist,
  getWishlist, 
  forgotPassword, 
  verifyOtp,      
  resetPassword, 
  verifyAccount,         
  resendActivationEmail, 
  googleLogin,           
  logoutUser, 
  syncCart,
  refreshAccessToken // 🌟 الدالة الجديدة
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// مسارات الإدارة والتسجيل الأساسية
router.route('/').get(protect, admin, getUsers);
router.route('/register').post(registerUser);
router.route('/login').post(authUser);
router.route('/google').post(googleLogin);
router.route('/logout').post(logoutUser);
router.route('/refresh').post(refreshAccessToken); // 🌟 مسار تجديد الجلسة

// مسارات التحقق واستعادة كلمة المرور
router.route('/verify-account').post(verifyAccount);
router.route('/resend-activation').post(resendActivationEmail);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-otp').post(verifyOtp);
router.route('/reset-password').put(resetPassword);

// مسار تجريبي للإدارة
router.route('/admin-test').get(protect, admin, adminTestRoute);

// 🌟 مسارات الملف الشخصي (Profile)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.route('/profile/password').put(protect, updateUserPassword);

router.route('/profile/email/request').post(protect, requestEmailUpdate);
router.route('/profile/email/verify').put(protect, verifyEmailUpdate);

router
  .route('/profile/wishlist')
  .get(protect, getWishlist)
  .post(protect, toggleWishlist);

// 🌟 مسار مزامنة السلة الهجينة (Hybrid Cart)
router.route('/profile/cart').put(protect, syncCart);

router.route('/profile/addresses').post(protect, addUserAddress);

router
  .route('/profile/addresses/:addressId')
  .delete(protect, deleteUserAddress)
  .put(protect, updateUserAddress); 

router.route('/profile/addresses/:addressId/default').put(protect, setDefaultAddress);

// مسارات إدارة المستخدمين (للمدير)
router
  .route('/:id')
  .delete(protect, admin, deleteUser)
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser);

module.exports = router;