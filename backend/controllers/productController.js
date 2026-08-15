// filepath: backend/controllers/productController.js
const asyncHandler = require('../utils/asyncHandler');
const Product = require('../models/productModel');
const Review = require('../models/reviewModel');
const Category = require('../models/categoryModel'); 
const User = require('../models/userModel'); 
const Order = require('../models/orderModel'); 
const mongoose = require('mongoose');
const { autoTranslateJson } = require('../services/aiTranslationService');
const { deleteCloudinaryImage } = require('../config/cloudinary'); 
const AppError = require('../utils/AppError');
const cache = require('../utils/redisClient');
const { PAGINATION } = require('../utils/constants');
const escapeRegex = require('../utils/escapeRegex');

const safeDeleteFile = async (filePath) => {
  if (!filePath) return;
  if (filePath.startsWith('/images/') || !filePath.includes('cloudinary.com')) return;

  try {
    const isUsedInProducts = await Product.exists({ $or: [{ image: filePath }, { images: filePath }] });
    const isUsedInCategories = await Category.exists({ $or: [{ thumbnail: filePath }, { bannerDesktop: filePath }, { bannerMobile: filePath }] });
    
    if (!isUsedInProducts && !isUsedInCategories) {
      await deleteCloudinaryImage(filePath);
    }
  } catch (err) { 
    console.error(`Failed to delete file: ${filePath}`, err); 
  }
};

const getFilters = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const cacheKey = category ? `filters_${category}` : 'filters_all';
  const cachedFilters = await cache.get(cacheKey);
  if (cachedFilters) return res.status(200).json(cachedFilters);

  let matchStage = { isDeleted: false };
  if (category && mongoose.Types.ObjectId.isValid(category)) { matchStage.category = new mongoose.Types.ObjectId(category); }
  
  const filters = await Product.aggregate([
    { $match: matchStage },
    { $facet: {
        brands: [{ $group: { _id: '$brand', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        subCategories: [{ $match: { subCategory: { $ne: null, $ne: "" } } }, { $group: { _id: '$subCategory', count: { $sum: 1 } } }, { $sort: { _id: 1 } }],
        options: [{ $unwind: '$selectableOptions' }, { $unwind: '$selectableOptions.values' }, { $group: { _id: '$selectableOptions.name.en', values: { $addToSet: '$selectableOptions.values.en' } } }, { $sort: { _id: 1 } }]
      }
    }
  ]);

  await cache.set(cacheKey, filters[0], 3600); 
  res.status(200).json(filters[0]);
});

const getProducts = asyncHandler(async (req, res) => {
  const pageSize = PAGINATION.PRODUCTS_PER_PAGE; 
  const page = Math.max(1, Number(req.query.pageNumber) || 1);
  const keywordStr = req.query.keyword ? req.query.keyword.trim() : '';

  let filter = { isDeleted: false };

  // 🌟 تم الإصلاح: التعامل مع معرف القسم بشكل نظيف وآمن
  if (req.query.category) {
    if (mongoose.Types.ObjectId.isValid(req.query.category)) {
      filter.category = new mongoose.Types.ObjectId(req.query.category);
    } else {
      filter.category = req.query.category;
    }
  }

  if (req.query.styleCode) filter.styleCode = req.query.styleCode;
  if (req.query.brands) filter.brand = { $in: req.query.brands.split(',') };
  if (req.query.subCategories) filter.subCategory = { $in: req.query.subCategories.split(',') };
  if (req.query.options) filter['selectableOptions.values.en'] = { $in: req.query.options.split(',') };

  if (keywordStr) {
    if (keywordStr.match(/^[0-9a-fA-F]{24}$/)) {
      filter._id = keywordStr;
    } else {
      const safeKey = escapeRegex(keywordStr);
      const regex = new RegExp(safeKey, 'i');
      filter.$or = [
        { 'name.en': regex },
        { 'name.ar': regex },
        { brand: regex },
        { styleCode: regex },
        { subCategory: regex }
      ];
    }
  }

  const minPrice = req.query.minPrice ? Number(req.query.minPrice) : 0;
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : Infinity;
  if (req.query.minPrice || req.query.maxPrice) { filter.price = { $gte: minPrice, $lte: maxPrice }; }

  let count;
  const isEmptyFilter = Object.keys(filter).length === 1 && filter.isDeleted === false;
  if (isEmptyFilter) {
    const cachedCount = await cache.get('total_active_products_count');
    if (cachedCount) {
      count = cachedCount;
    } else {
      count = await Product.countDocuments(filter);
      await cache.set('total_active_products_count', count, 86400); 
    }
  } else {
    count = await Product.countDocuments(filter);
  }

  const products = await Product.find(filter)
    .populate('category', 'name')
    .select('-reviews')
    .sort({ createdAt: -1, _id: -1 }) 
    .limit(pageSize)
    .skip(pageSize * (page - 1));
    
  res.status(200).json({ products, page, pages: Math.ceil(count / pageSize) });
});

const getProductById = asyncHandler(async (req, res) => {
  // 🌟 تم الإصلاح: عمل populate للـ reviews لإتاحة التقييمات في استجابة الفردية
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false })
    .populate('category', 'name')
    .populate('reviews');
  
  if (!product) throw new AppError('Product not found', 404);
  res.status(200).json(product);
});

const getProductsByStyle = asyncHandler(async (req, res) => {
  const { styleCode } = req.params;
  if (!styleCode) throw new AppError('Style code is required', 400);

  const products = await Product.find({ 
    styleCode: styleCode, 
    isDeleted: false 
  }).select('image name color styleCode _id');

  res.status(200).json(products);
});

const createProduct = asyncHandler(async (req, res) => {
  let defaultCategory = await Category.findOne({ isDefault: true });
  if (!defaultCategory) {
    defaultCategory = await Category.findOne(); 
    if(!defaultCategory) { defaultCategory = await Category.create({ name: { en: 'General', ar: 'عام' }, description: { en: 'System default', ar: 'القسم الافتراضي' }, isDefault: true }); } 
    else { defaultCategory.isDefault = true; await defaultCategory.save(); }
  }

  const product = new Product({
    name: { en: 'Sample name', ar: '' }, price: 0, user: req.user._id, image: '/images/sample.jpg', images: [], brand: 'Sample brand', category: defaultCategory._id, countInStock: 0, numReviews: 0, description: { en: 'Sample description', ar: '' }, styleCode: 'SAMPLE-CODE', color: { name: { en: '', ar: '' } }, selectableOptions: [], specifications: [], features: [],
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  const allowedFields = [
    'name', 'price', 'brand', 'category', 'subCategory', 'countInStock', 
    'description', 'styleCode', 'color', 'image', 'images', 
    'selectableOptions', 'specifications', 'features'
  ];

  const oldImagesArray = [product.image, ...(product.images || [])].filter(Boolean);
  const newImagesArray = [];
  
  if (req.body.image) newImagesArray.push(req.body.image);
  else newImagesArray.push(product.image);

  if (req.body.images && Array.isArray(req.body.images)) { newImagesArray.push(...req.body.images); } 
  else if (req.body.images === undefined) { newImagesArray.push(...(product.images || [])); }

  const orphanedImages = oldImagesArray.filter(oldImg => !newImagesArray.includes(oldImg));

  allowedFields.forEach((key) => { 
    if (req.body[key] !== undefined) { product[key] = req.body[key]; } 
  });
  
  const updatedProduct = await product.save();
  
  Promise.all(orphanedImages.map(img => safeDeleteFile(img))).catch(err => console.error(err));
  
  res.status(200).json(updatedProduct);

  const translatableFields = { 
    name: product.name, 
    description: product.description, 
    color: product.color, 
    selectableOptions: product.selectableOptions, 
    specifications: product.specifications, 
    features: product.features 
  };

  autoTranslateJson(translatableFields).then(async (translatedFields) => {
    await Product.findByIdAndUpdate(product._id, { $set: translatedFields });
  }).catch(err => console.error("Background Translation Error:", err.message));
});

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);

  product.isDeleted = true; product.deletedAt = new Date();
  await product.save();
  
  await User.updateMany({}, { $pull: { wishlist: product._id } });
  await User.updateMany({}, { $pull: { cart: { product: product._id } } });
  
  res.status(200).json({ message: 'Product archived (Soft Deleted) successfully' });
});

const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findOne({ _id: req.params.id, isDeleted: false });
  if (!product) throw new AppError('Product not found', 404);

  const hasPurchased = await Order.exists({ user: req.user._id, 'orderItems.product': req.params.id, isDelivered: true });
  if (!hasPurchased && !req.user.isAdmin) throw new AppError('Business Policy: You must purchase and receive this product before reviewing it.', 403);

  const alreadyReviewed = await Review.findOne({ product: req.params.id, user: req.user._id });
  if (alreadyReviewed) throw new AppError('Product already reviewed', 400);

  await Review.create({ product: req.params.id, user: req.user._id, name: req.user.name, rating: Number(rating), comment });
  
  res.status(201).json({ message: 'Review added successfully' });
});

const updateProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) throw new AppError('Not authorized to update this review', 401);
  
  review.rating = Number(rating) || review.rating;
  review.comment = comment || review.comment;
  
  await review.save();
  res.status(200).json({ message: 'Review updated successfully' });
});

const deleteProductReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) throw new AppError('Review not found', 404);
  if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) throw new AppError('Not authorized to delete this review', 401);
  
  await review.deleteOne();
  res.status(200).json({ message: 'Review deleted successfully' });
});

const getProductReviews = asyncHandler(async (req, res) => {
  const pageSize = PAGINATION.REVIEWS_PER_PAGE; 
  const page = Math.max(1, Number(req.query.pageNumber) || 1);
  const count = await Review.countDocuments({ product: req.params.id });
  const reviews = await Review.find({ product: req.params.id }).limit(pageSize).skip(pageSize * (page - 1)).sort({ createdAt: -1, _id: -1 }); 
  res.status(200).json({ reviews, page, pages: Math.ceil(count / pageSize), totalReviews: count });
});

const getTopProducts = asyncHandler(async (req, res) => {
  const cachedTop = await cache.get('top_products');
  if (cachedTop) return res.status(200).json(cachedTop);

  const products = await Product.find({ isDeleted: false }).sort({ rating: -1 }).limit(3);
  await cache.set('top_products', products, 3600); 
  res.status(200).json(products);
});

const getCategories = asyncHandler(async (req, res) => {
  const cached = await cache.get('categories_list');
  if (cached) return res.status(200).json(cached);

  const categories = await Category.find({});
  await cache.set('categories_list', categories, 86400);
  res.status(200).json(categories);
});

const getRelatedProducts = asyncHandler(async (req, res) => {
  const currentProduct = await Product.findById(req.params.id);
  if (!currentProduct) throw new AppError('Product not found', 404);

  let relatedProducts = []; const limitCount = 5;
  if (currentProduct.subCategory) {
    relatedProducts = await Product.find({ isDeleted: false, category: currentProduct.category, subCategory: currentProduct.subCategory, _id: { $ne: currentProduct._id } }).populate('category', 'name').limit(limitCount);
  }
  if (relatedProducts.length < limitCount) {
    const remainingLimit = limitCount - relatedProducts.length;
    const excludedIds = relatedProducts.map(p => p._id); excludedIds.push(currentProduct._id); 
    const additionalProducts = await Product.find({ isDeleted: false, category: currentProduct.category, _id: { $nin: excludedIds } }).populate('category', 'name').limit(remainingLimit);
    relatedProducts = [...relatedProducts, ...additionalProducts];
  }
  res.status(200).json(relatedProducts);
});

const getPersonalizedProducts = asyncHandler(async (req, res) => {
  const productIds = req.query.productIds ? req.query.productIds.split(',') : [];
  if (productIds.length > 0) {
    const referenceProducts = await Product.find({ _id: { $in: productIds } }).select('category');
    const categoryIds = [...new Set(referenceProducts.map(p => p.category.toString()))];
    const personalizedProducts = await Product.find({ isDeleted: false, category: { $in: categoryIds }, _id: { $nin: productIds } }).populate('category', 'name').sort({ rating: -1 }).limit(5);
    res.status(200).json(personalizedProducts);
  } else { res.status(200).json([]); }
});

module.exports = { 
  getProducts, getProductById, createProduct, updateProduct, deleteProduct, 
  createProductReview, updateProductReview, deleteProductReview, getProductReviews, 
  getTopProducts, getCategories, getRelatedProducts, getPersonalizedProducts, 
  getFilters, getProductsByStyle 
};