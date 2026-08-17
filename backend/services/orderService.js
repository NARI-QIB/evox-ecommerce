const Product = require('../models/productModel');
const Order = require('../models/orderModel'); 
const AppError = require('../utils/AppError');

const addDecimals = (num) => Math.round(num * 100) / 100;

const restoreInventory = async (orderItems, session) => {
  for (const item of orderItems) {
    const qty = Number(item.qty);
    if (qty > 0) {
      const queryOptions = session ? { session } : {};
      await Product.updateOne(
        { _id: item.product },
        { $inc: { countInStock: qty } },
        queryOptions
      );
    }
  }
};

const processAndVerifyOrder = async (orderItems, session) => {
  let calculatedItemsPrice = 0;
  const verifiedOrderItems = [];

  try {
    for (const item of orderItems) {
      const qty = Number(item.qty);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new AppError(`Security Alert: Invalid quantity detected for product ID: ${item.product}.`, 400);
      }

      const queryOptions = session ? { session, new: true } : { new: true };
      const product = await Product.findOneAndUpdate(
        { _id: item.product, countInStock: { $gte: qty }, isDeleted: false },
        { $inc: { countInStock: -qty } },
        queryOptions
      );
      
      if (!product) {
        const queryCheck = session ? Product.findById(item.product).session(session) : Product.findById(item.product);
        const checkProduct = await queryCheck;
        if (!checkProduct) throw new AppError(`Product not found.`, 404);
        const pName = checkProduct.name?.en || checkProduct.name;
        throw new AppError(`Out of stock or insufficient quantity: ${pName}. Only ${checkProduct.countInStock} items left.`, 400);
      }

      const frontendPrice = Number(item.price);
      if (Math.abs(product.price - frontendPrice) > 0.01) {
        throw new AppError(`Price mismatch for "${product.name?.en || product.name}". The actual price is $${product.price}. Please remove it from your cart and add it again.`, 400);
      }

      calculatedItemsPrice += product.price * qty;

      verifiedOrderItems.push({
        name: item.name, 
        qty: qty,
        image: product.image,
        price: product.price, 
        product: product._id,
        selectedSize: item.selectedSize || ''
      });
    }

    const itemsPrice = addDecimals(calculatedItemsPrice);
    const shippingPrice = addDecimals(itemsPrice > 100 ? 0 : 10);
    const taxPrice = addDecimals(0.15 * itemsPrice);
    const totalPrice = addDecimals(itemsPrice + shippingPrice + taxPrice);

    // 🌟 تم الإصلاح هنا: إرجاع المصفوفة باسم orderItems لكي تتطابق مع المودل
    return { orderItems: verifiedOrderItems, itemsPrice, shippingPrice, taxPrice, totalPrice };

  } catch (error) {
    if (!session && verifiedOrderItems.length > 0) {
      await restoreInventory(verifiedOrderItems, null);
    }
    throw error;
  }
};

// 🌟 الإصلاح الذري والأمن لمنع الـ Zombie Inventory 
const cancelExpiredOrders = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // نجلب الطلبات التي انتهى وقتها
    const expiredOrders = await Order.find({
      isPaid: false,
      status: 'Pending',
      isCancelled: false, // يجب ألا يكون ملغياً مسبقاً
      paymentMethod: { $ne: 'Cash on Delivery' }, 
      createdAt: { $lt: twentyFourHoursAgo }
    });

    let cancelledCount = 0;

    for (const order of expiredOrders) {
      // 🌟 نقوم بالتحديث بناءً على شروط دقيقة (تحديث ذري) لضمان عدم تغير حالة الدفع في أجزاء من الثانية
      const updatedOrder = await Order.findOneAndUpdate(
        { 
          _id: order._id, 
          isPaid: false, 
          status: 'Pending',
          isCancelled: false 
        },
        {
          $set: {
            isCancelled: true,
            status: 'Cancelled',
            cancelledAt: Date.now(),
            adminNotes: 'Auto-cancelled: Payment timeout exceeded.'
          }
        },
        { new: true }
      );

      // إذا نجح التحديث فقط، نعيد المخزون للعمل
      if (updatedOrder) {
        await restoreInventory(updatedOrder.orderItems, null);
        cancelledCount++;
      }
    }
    
    if (cancelledCount > 0) {
      console.log(`🧹 [System] Auto-cancelled ${cancelledCount} expired unpaid orders and restored inventory.`);
    }
  } catch (error) {
    console.error("Failed to cancel expired orders:", error);
  }
};

module.exports = {
  processAndVerifyOrder,
  restoreInventory,
  cancelExpiredOrders
};