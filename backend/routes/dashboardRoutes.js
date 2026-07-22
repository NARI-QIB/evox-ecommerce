const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getLatestOrders,
  getBestSellingProducts,
  getMonthlySales,
  getTopCustomers,
  getRecentUsers,
  getLowStockProducts,
  getOutOfStockProducts,
  getPendingOrders,
  getSalesByCategory, // <-- تم الاستدعاء
} = require('../controllers/dashboardController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(protect, admin, getDashboardStats);
router.route('/latest-orders').get(protect, admin, getLatestOrders);
router.route('/best-sellers').get(protect, admin, getBestSellingProducts);
router.route('/monthly-sales').get(protect, admin, getMonthlySales);
router.route('/top-customers').get(protect, admin, getTopCustomers);
router.route('/recent-users').get(protect, admin, getRecentUsers);
router.route('/low-stock').get(protect, admin, getLowStockProducts);
router.route('/out-of-stock').get(protect, admin, getOutOfStockProducts);
router.route('/pending-orders').get(protect, admin, getPendingOrders);

// مسار المبيعات بناءً على الأقسام
router.route('/sales-by-category').get(protect, admin, getSalesByCategory);

module.exports = router;