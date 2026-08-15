// filepath: backend/controllers/orderController.js
const asyncHandler = require('../utils/asyncHandler');
const Order = require('../models/orderModel');
const User = require('../models/userModel');
const mongoose = require('mongoose'); 
const crypto = require('crypto');
const { processAndVerifyOrder, restoreInventory, cancelExpiredOrders } = require('../services/orderService');
const { verifyPayPalPayment } = require('../utils/paypal'); 
const AppError = require('../utils/AppError');
const escapeRegex = require('../utils/escapeRegex'); 

const startSafeTransaction = async () => {
  if (process.env.NODE_ENV !== 'production' && process.env.MONGO_URI && process.env.MONGO_URI.includes('localhost')) {
      console.warn("⚠️ Bypassing MongoDB Transactions for local development.");
      return null;
  }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    return session;
  } catch (error) {
    console.warn("⚠️ MongoDB Transactions not supported (Standalone Mode). Proceeding with atomic updates only.");
    return null;
  }
};

const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body;

  if (!orderItems || orderItems.length === 0) { res.status(400); throw new AppError('No order items found', 400); }
  
  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.country || !shippingAddress.phoneNumber) { 
    res.status(400); throw new AppError('Incomplete shipping address. Phone number and address details are required.', 400); 
  }
  
  if (!paymentMethod) { res.status(400); throw new AppError('Payment method is required', 400); }

  const session = await startSafeTransaction();
  let orderDetails = null;

  try {
    orderDetails = await processAndVerifyOrder(orderItems, session);

    const order = new Order({
      ...orderDetails,
      user: req.user._id,
      customer: { name: req.user.name, email: req.user.email },
      isGuest: false,
      shippingAddress,
      paymentMethod,
    });

    const options = session ? { session } : {};
    const createdOrder = await order.save(options);
    
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    } else if (orderDetails && orderDetails.verifiedOrderItems) {
      await restoreInventory(orderDetails.verifiedOrderItems, null);
    }
    res.status(400); throw new AppError(error.message, 400);
  }
});

const addGuestOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, guestCustomer } = req.body;

  if (!orderItems || orderItems.length === 0) { res.status(400); throw new AppError('No order items found', 400); }
  if (!guestCustomer || !guestCustomer.name || !guestCustomer.email) { res.status(400); throw new AppError('Guest customer details are required', 400); }

  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.country || !shippingAddress.phoneNumber) { 
    res.status(400); throw new AppError('Incomplete shipping address. Phone number and address details are required.', 400); 
  }

  const session = await startSafeTransaction();
  let orderDetails = null;

  try {
    orderDetails = await processAndVerifyOrder(orderItems, session);
    
    const guestTrackingToken = crypto.randomBytes(32).toString('hex');

    const order = new Order({
      ...orderDetails,
      customer: { name: guestCustomer.name, email: guestCustomer.email },
      isGuest: true,
      guestTrackingToken, 
      shippingAddress,
      paymentMethod,
    });

    const options = session ? { session } : {};
    const createdOrder = await order.save(options);
    
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(201).json({
      ...createdOrder.toObject(),
      guestTrackingToken 
    });
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    } else if (orderDetails && orderDetails.verifiedOrderItems) {
      await restoreInventory(orderDetails.verifiedOrderItems, null);
    }
    res.status(400); throw new AppError(error.message, 400);
  }
});

const getOrderById = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id).populate('user', 'name email');

  if (order) {
    if (order.isGuest) {
      if (req.user.isAdmin) { res.status(200).json(order); } 
      else { res.status(401); throw new AppError('Not authorized to view this guest order', 401); }
    } else {
      if ((order.user && order.user._id.toString() === req.user._id.toString()) || req.user.isAdmin) {
        res.status(200).json(order);
      } else {
        res.status(401); throw new AppError('Not authorized to view this order', 401);
      }
    }
  } else {
    res.status(404); throw new AppError('Order not found', 404);
  }
});

const updateOrderToPaid = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id);

  if (order) {
    if (order.isCancelled) {
      res.status(400); 
      throw new AppError('This order has been cancelled due to payment timeout. You cannot pay for a cancelled order.', 400);
    }

    if (order.isPaid) {
      res.status(400); 
      throw new AppError('Order is already paid.', 400);
    }

    if (req.body.status !== 'COMPLETED') {
      res.status(400); throw new AppError('Payment was not completed', 400);
    }

    const isValidPayment = await verifyPayPalPayment(req.body.id, order.totalPrice);
    if (!isValidPayment) {
      res.status(400); 
      throw new AppError('Security Alert: Invalid payment amount or fraudulent transaction detected.', 400);
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id,
      status: req.body.status,
      update_time: req.body.update_time,
      email_address: req.body.email_address,
    };

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } else {
    res.status(404); throw new AppError('Order not found', 404);
  }
});

const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1, _id: -1 });
  res.status(200).json(orders);
});

const getOrders = asyncHandler(async (req, res) => {
  const pageSize = 15; 
  const page = Math.max(1, Number(req.query.pageNumber) || 1);
  const keywordStr = req.query.keyword ? req.query.keyword.trim() : '';

  let filter = {};
  
  if (keywordStr) {
    const safeKeyword = escapeRegex(keywordStr);

    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safeKeyword, $options: 'i' } },
        { email: { $regex: safeKeyword, $options: 'i' } },
      ]
    }).select('_id');
    
    const userIds = matchingUsers.map(user => user._id);

    filter.$or = [
      { 'customer.name': { $regex: safeKeyword, $options: 'i' } },
      { 'customer.email': { $regex: safeKeyword, $options: 'i' } },
      { user: { $in: userIds } } 
    ];

    if (keywordStr.match(/^[0-9a-fA-F]{24}$/)) { filter.$or.push({ _id: keywordStr }); }
  }

  let count;
  if (Object.keys(filter).length === 0) {
     count = await Order.estimatedDocumentCount();
  } else {
     count = await Order.countDocuments(filter);
  }
  
  const orders = await Order.find(filter)
    .populate('user', 'id name email')
    .sort({ createdAt: -1, _id: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.status(200).json({ orders, page, pages: Math.ceil(count / pageSize) });
});

const updateOrderToDelivered = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id);

  if (order) {
    if (order.isCancelled) {
       res.status(400); throw new AppError('Cannot deliver a cancelled order.', 400);
    }

    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = 'Delivered';

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } else {
    res.status(404); throw new AppError('Order not found', 404);
  }
});

const trackGuestOrder = asyncHandler(async (req, res) => {
  const { orderId, trackingToken } = req.body;

  if (!orderId || !trackingToken) { 
    res.status(400); throw new AppError('Order ID and Secure Tracking Token are required', 400); 
  }
  
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    res.status(400); throw new AppError('Invalid Order ID format.', 400);
  }

  const order = await Order.findById(orderId).select('+guestTrackingToken');

  if (order) {
    if (!order.isGuest) { 
      res.status(401); throw new AppError('This is a registered user order. Please log in to track it.', 401); 
    }
    
    if (!order.guestTrackingToken || order.guestTrackingToken !== trackingToken) { 
      res.status(401); throw new AppError('Security Alert: Invalid tracking token. Access denied.', 401); 
    }
    
    const safeOrderData = order.toObject();
    delete safeOrderData.guestTrackingToken;

    res.status(200).json(safeOrderData);
  } else {
    res.status(404); throw new AppError('Order not found', 404);
  }
});

const cancelGuestOrder = asyncHandler(async (req, res) => {
  const { trackingToken } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id).select('+guestTrackingToken');

  if (order) {
    if (!order.isGuest) { res.status(401); throw new AppError('Cannot cancel registered order from guest portal.', 401); }
    if (!order.guestTrackingToken || order.guestTrackingToken !== trackingToken) { 
      res.status(401); throw new AppError('Security Alert: Invalid tracking token.', 401); 
    }
    
    if (order.isDelivered || order.status === 'Shipped' || order.isCancelled) { 
      res.status(400); throw new AppError('Order cannot be cancelled. It has already been shipped or processed.', 400); 
    }

    const session = await startSafeTransaction();

    try {
      order.isCancelled = true; order.cancelledAt = Date.now(); order.status = 'Cancelled';
      const options = session ? { session } : {};
      const updatedOrder = await order.save(options);

      await restoreInventory(order.orderItems, session); 

      if(session) { await session.commitTransaction(); session.endSession(); }
      res.status(200).json(updatedOrder);
    } catch (error) {
      if(session) { await session.abortTransaction(); session.endSession(); }
      res.status(400); throw new AppError(error.message, 400);
    }
  } else {
    res.status(404); throw new AppError('Order not found', 404);
  }
});

const cancelOrder = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id);

  if (order) {
    // 🌟 تم الإصلاح: السماح للمدير (Admin) أو صاحب الطلب بإلغاء الطلب
    const isOwner = order.user && order.user.toString() === req.user._id.toString();
    if (order.isGuest || (!isOwner && !req.user.isAdmin)) { 
      res.status(401); throw new AppError('Not authorized to cancel this order.', 401); 
    }
    
    if (order.isDelivered || order.status === 'Shipped' || order.isCancelled) { 
      res.status(400); throw new AppError('Order cannot be cancelled. It has already been shipped or processed.', 400); 
    }

    const session = await startSafeTransaction();

    try {
      order.isCancelled = true; order.cancelledAt = Date.now(); order.status = 'Cancelled';
      const options = session ? { session } : {};
      const updatedOrder = await order.save(options);

      await restoreInventory(order.orderItems, session); 

      if(session) { await session.commitTransaction(); session.endSession(); }
      res.status(200).json(updatedOrder);
    } catch (error) {
      if(session) { await session.abortTransaction(); session.endSession(); }
      res.status(400); throw new AppError(error.message, 400);
    }
  } else {
    res.status(404); throw new AppError('Order not found', 404);
  }
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id);

  if (order) {
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) { res.status(400); throw new AppError('Invalid status.', 400); }

    if (order.isCancelled && status !== 'Cancelled') {
      res.status(400); 
      throw new AppError('Cannot change the status of a cancelled order. It is locked to maintain inventory integrity. Please create a new order instead.', 400);
    }

    const session = await startSafeTransaction();

    try {
      order.status = status;

      if (status === 'Delivered') { 
        order.isDelivered = true; 
        order.deliveredAt = Date.now(); 
      } else if (status !== 'Cancelled') {
        order.isDelivered = false; 
        order.deliveredAt = null;
      }
      
      if (status === 'Cancelled' && !order.isCancelled) {
        order.isCancelled = true; order.cancelledAt = Date.now();
        await restoreInventory(order.orderItems, session); 
      }

      const options = session ? { session } : {};
      const updatedOrder = await order.save(options);
      
      if(session) { await session.commitTransaction(); session.endSession(); }
      res.status(200).json(updatedOrder);
    } catch (error) {
      if(session) { await session.abortTransaction(); session.endSession(); }
      res.status(400); throw new AppError(error.message, 400);
    }
  } else {
    res.status(404); throw new AppError('Order not found', 404);
  }
});

const updateOrderNotes = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id);
  if (order) { order.adminNotes = adminNotes || ''; const updatedOrder = await order.save(); res.status(200).json(updatedOrder); } 
  else { res.status(404); throw new AppError('Order not found', 404); }
});

const updateOrderPaymentStatus = asyncHandler(async (req, res) => {
  const { isPaid } = req.body;
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    res.status(400); throw new AppError('Invalid Order ID format', 400);
  }

  const order = await Order.findById(req.params.id);
  
  if (order && order.isCancelled && isPaid) {
    res.status(400); 
    throw new AppError('Cannot mark a cancelled order as paid.', 400);
  }

  if (order) {
    order.isPaid = isPaid;
    if (isPaid) {
      order.paidAt = Date.now();
      order.paymentResult = { id: 'Manual_Admin_Update', status: 'Completed', update_time: new Date().toISOString(), email_address: req.user.email };
    } else {
      order.paidAt = null; order.paymentResult = {};
    }
    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } else { res.status(404); throw new AppError('Order not found', 404); }
});

const triggerCancelExpiredOrders = asyncHandler(async (req, res) => {
  const cronSecret = process.env.CRON_SECRET || 'evox-super-secret-cron-key-123';
  if (req.headers['x-cron-secret'] !== cronSecret) {
    res.status(401); 
    throw new AppError('Unauthorized Cron Request', 401);
  }

  await cancelExpiredOrders();
  res.status(200).json({ message: 'Expired orders cleanup executed successfully.' });
});

module.exports = {
  addOrderItems, addGuestOrderItems, getOrderById, updateOrderToPaid, getMyOrders, getOrders,
  updateOrderToDelivered, trackGuestOrder, cancelGuestOrder, cancelOrder, updateOrderStatus,
  updateOrderNotes, updateOrderPaymentStatus, triggerCancelExpiredOrders
};