require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Category = require('./models/categoryModel');

// 1. الاتصال بقاعدة البيانات
connectDB();

// 2. مصفوفة التصنيفات المطلوبة
const defaultCategories = [
  { name: 'Clothing', description: 'All types of sportswear and jerseys' },
  { name: 'Shoes', description: 'Athletic and football boots' },
  { name: 'Equipment', description: 'Gym accessories and fitness gear' },
  { name: 'Supplements', description: 'Proteins, vitamins, and energy products' }
];

const seed = async () => {
  try {
    // تنظيف الجدول أولاً لمنع التكرار
    await Category.deleteMany();
    
    // حقن البيانات
    await Category.insertMany(defaultCategories);
    
    console.log('Done! All 4 core categories have been inserted successfully. 🚀');
    process.exit();
  } catch (error) {
    console.error(`Error seeding categories: ${error.message}`);
    process.exit(1);
  }
};

seed();