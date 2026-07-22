const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// استيراد الموديلات للتأكد من حذف المجموعات (Collections) التابعة لها
const Product = require('./models/productModel');
const Category = require('./models/categoryModel');
const Order = require('./models/orderModel'); // احذف هذا السطر إذا لم ترد مسح الطلبات

dotenv.config();
connectDB();

const purgeDatabase = async () => {
  try {
    console.log('⚠️  Starting Database Purge...');

    await Product.deleteMany({});
    console.log('✅ All Products deleted.');

    await Category.deleteMany({});
    console.log('✅ All Categories deleted.');

    // اختياري: إذا أردت مسح الطلبات أيضاً لتبدأ من الصفر تماماً
    await Order.deleteMany({});
    console.log('✅ All Orders deleted.');

    console.log('\n✨ Database is now completely clean! You can now run your seeder safely.');
    process.exit();
  } catch (error) {
    console.error(`❌ Error purging database: ${error.message}`);
    process.exit(1);
  }
};

purgeDatabase();