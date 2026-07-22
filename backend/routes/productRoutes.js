// filepath: backend/routes/productRoutes.js
const express = require('express');
const router = express.Router();
const {
  getProducts, getProductById, createProduct, updateProduct, deleteProduct,
  createProductReview, updateProductReview, deleteProductReview, // 🌟 الدوال الجديدة
  getProductReviews, getTopProducts, getCategories, getRelatedProducts,
  getPersonalizedProducts, getFilters
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').get(getProducts).post(protect, admin, createProduct);
router.route('/top').get(getTopProducts);
router.route('/categories').get(getCategories);
router.route('/filters').get(getFilters);
router.route('/personalized').get(getPersonalizedProducts);
router.route('/:id/related').get(getRelatedProducts);

router.route('/:id/reviews')
  .get(getProductReviews)
  .post(protect, createProductReview);

// 🌟 مسار جديد ومحمي للتعديل وحذف التقييمات الفردية
router.route('/:id/reviews/:reviewId')
  .put(protect, updateProductReview)
  .delete(protect, deleteProductReview);

router.route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

module.exports = router;