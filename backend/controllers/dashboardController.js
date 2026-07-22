// filepath: backend/controllers/dashboardController.js
const asyncHandler = require('../utils/asyncHandler');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');

const getDashboardStats = asyncHandler(async (req, res) => {
  const salesData = await Order.aggregate([
    { $match: { isPaid: true } },
    { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
  ]);

  const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

  const usersCount = await User.countDocuments();
  const ordersCount = await Order.countDocuments();
  const productsCount = await Product.countDocuments();

  res.status(200).json({
    totalSales,
    ordersCount,
    usersCount,
    productsCount
  });
});

const getLatestOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email');

  if (orders) {
    res.status(200).json(orders);
  } else {
    res.status(404);
    throw new Error('No orders found');
  }
});

const getBestSellingProducts = asyncHandler(async (req, res) => {
  const bestSellers = await Order.aggregate([
    { $match: { isPaid: true } },
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        totalSold: { $sum: '$orderItems.qty' }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        productId: '$_id',
        // 🌟 إرجاع الكائن كاملاً لدعم الترجمة الديناميكية مع دعم المنتجات المحذوفة
        name: { $ifNull: ['$productInfo.name', { en: 'Deleted Product', ar: 'منتج محذوف' }] },
        brand: { $ifNull: ['$productInfo.brand', 'N/A'] },
        totalSold: 1
      }
    }
  ]);

  res.status(200).json(bestSellers);
});

const getMonthlySales = asyncHandler(async (req, res) => {
  const monthlySales = await Order.aggregate([
    { $match: { isPaid: true } },
    {
      $group: {
        _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } },
        totalSales: { $sum: '$totalPrice' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id: 0,
        year: '$_id.year',
        month: '$_id.month',
        totalSales: 1
      }
    }
  ]);

  res.status(200).json(monthlySales);
});

const getTopCustomers = asyncHandler(async (req, res) => {
  const topCustomers = await Order.aggregate([
    { 
      $match: { isPaid: true, user: { $ne: null } } 
    },
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$totalPrice' },
        ordersCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    // 🌟 السماح بالحفاظ على الحسابات المحذوفة لمنع فقدان البيانات الإحصائية
    { $unwind: { path: '$userInfo', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        userId: '$_id',
        name: { $ifNull: ['$userInfo.name', 'Deleted User'] },
        email: { $ifNull: ['$userInfo.email', 'N/A'] },
        totalSpent: 1,
        ordersCount: 1
      }
    }
  ]);

  res.status(200).json(topCustomers);
});

const getRecentUsers = asyncHandler(async (req, res) => {
  const recentUsers = await User.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .select('_id name email isAdmin createdAt');

  if (recentUsers) {
    res.status(200).json(recentUsers);
  } else {
    res.status(404);
    throw new Error('No users found');
  }
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const lowStockProducts = await Product.find({ 
    countInStock: { $lte: 5, $gt: 0 },
    isDeleted: false 
  })
    .select('_id name brand category countInStock price createdAt')
    .sort({ countInStock: 1 })
    .limit(10);

  if (lowStockProducts) {
    res.status(200).json(lowStockProducts);
  } else {
    res.status(404);
    throw new Error('No products found');
  }
});

const getOutOfStockProducts = asyncHandler(async (req, res) => {
  const outOfStockProducts = await Product.find({ 
    countInStock: 0,
    isDeleted: false 
  })
    .select('_id name brand category price countInStock createdAt')
    .sort({ createdAt: -1 });

  if (outOfStockProducts) {
    res.status(200).json(outOfStockProducts);
  } else {
    res.status(404);
    throw new Error('No products found');
  }
});

const getPendingOrders = asyncHandler(async (req, res) => {
  const pendingOrders = await Order.find({ isDelivered: false })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  if (pendingOrders) {
    res.status(200).json(pendingOrders);
  } else {
    res.status(404);
    throw new Error('No pending orders found');
  }
});

const getSalesByCategory = asyncHandler(async (req, res) => {
  const salesByCategory = await Order.aggregate([
    { $match: { isPaid: true } },
    { $unwind: '$orderItems' },
    {
      $lookup: {
        from: 'products',
        localField: 'orderItems.product',
        foreignField: '_id',
        as: 'productInfo'
      }
    },
    { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'categories',
        localField: 'productInfo.category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    { $unwind: { path: '$categoryInfo', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        // 🌟 التجميع بناءً على الـ ID لتجنب تداخل الأقسام التي تملك نفس الاسم
        _id: { $ifNull: ['$categoryInfo._id', 'uncategorized'] },
        categoryName: { $first: '$categoryInfo.name' },
        totalSold: { $sum: '$orderItems.qty' },
        totalRevenue: { $sum: { $multiply: ['$orderItems.qty', '$orderItems.price'] } }
      }
    },
    { $sort: { totalRevenue: -1 } },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        // 🌟 إرجاع كائن الاسم كاملاً لتقوم الواجهة بترجمته
        category: { $ifNull: ['$categoryName', { en: 'Uncategorized', ar: 'غير مصنف' }] },
        totalSold: 1,
        totalRevenue: 1
      }
    }
  ]);

  res.status(200).json(salesByCategory);
});

module.exports = {
  getDashboardStats,
  getLatestOrders,
  getBestSellingProducts,
  getMonthlySales,
  getTopCustomers,
  getRecentUsers,
  getLowStockProducts,
  getOutOfStockProducts,
  getPendingOrders,
  getSalesByCategory,
};