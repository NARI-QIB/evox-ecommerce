// filepath: backend/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
  addOrderItems,
  addGuestOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  getOrders,
  updateOrderToDelivered,
  trackGuestOrder,
  cancelGuestOrder,
  cancelOrder,
  updateOrderStatus,
  updateOrderNotes,
  updateOrderPaymentStatus,
  triggerCancelExpiredOrders
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// حماية إضافية لمنع التخمين العشوائي (Brute Force)
const guestTrackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { message: 'Too many tracking attempts. Please try again after 15 minutes to protect privacy.' }
});

router.route('/guest').post(addGuestOrderItems);
router.route('/guest/track').post(guestTrackLimiter, trackGuestOrder);
router.route('/guest/:id/cancel').put(cancelGuestOrder);

router.route('/cron/cancel-expired').post(triggerCancelExpiredOrders);

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/mine').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/notes').put(protect, admin, updateOrderNotes);

router.route('/:id/payment-status').put(protect, admin, updateOrderPaymentStatus);

module.exports = router;