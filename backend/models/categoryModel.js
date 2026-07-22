// filepath: backend/models/categoryModel.js
const mongoose = require('mongoose');
const cache = require('../utils/redisClient'); // استدعاء الكاش هنا

const categorySchema = new mongoose.Schema(
  {
    name: {
      en: { type: String, required: true }, 
      ar: { type: String }, 
    },
    description: {
      en: { type: String },
      ar: { type: String },
    },
    thumbnail: { type: String },      
    bannerDesktop: { type: String },  
    bannerMobile: { type: String },
    isDefault: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

categorySchema.index(
  { 'name.en': 'text', 'name.ar': 'text', 'description.en': 'text', 'description.ar': 'text' },
  { name: 'CategoryTextIndex', weights: { 'name.en': 10, 'name.ar': 10, 'description.en': 5, 'description.ar': 5 } }
);

// Mongoose Middleware لتنظيف الكاش عند الحفظ أو التعديل
categorySchema.post('save', async function () {
  await cache.del('categories_list');
  await cache.del('filters_all');
});

// Mongoose Middleware لتنظيف الكاش عند الحذف
categorySchema.post('deleteOne', { document: true, query: false }, async function () {
  await cache.del('categories_list');
  await cache.del('filters_all');
  await cache.del(`filters_${this._id}`);
  await cache.del('top_products');
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;