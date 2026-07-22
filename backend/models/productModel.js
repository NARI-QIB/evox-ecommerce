// filepath: backend/models/productModel.js
const mongoose = require('mongoose');
const cache = require('../utils/redisClient');

const productSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { en: { type: String, required: true }, ar: { type: String } },
    styleCode: { type: String, index: true },
    color: { name: { en: { type: String }, ar: { type: String } } },
    image: { type: String, required: true },
    images: [{ type: String }], 
    brand: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Category' },
    subCategory: { type: String },
    selectableOptions: [{ name: { en: { type: String }, ar: { type: String } }, values: [{ en: { type: String }, ar: { type: String } }] }],
    specifications: [{ name: { en: { type: String }, ar: { type: String } }, value: { en: { type: String }, ar: { type: String } } }],
    features: [{ icon: { type: String }, title: { en: { type: String }, ar: { type: String } }, description: { en: { type: String }, ar: { type: String } } }],
    description: { en: { type: String, required: true }, ar: { type: String } },
    
    // 🌟 Computed Fields: حقول إحصائية تُحدّث تلقائياً من قبل الـ Review Model
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },
    
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date }
  },
  { 
    timestamps: true,
    // 🌟 تمكين Virtuals لتعمل بشكل سليم في المخرجات
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// 🌟 Virtual Populate: ربط وهمي لتقييمات المنتج
// يسمح لنا بجلب مصفوفة الـ reviews وقت الطلب دون تخزينها فعلياً لتجنب التكرار والتضارب
productSchema.virtual('reviews', {
  ref: 'Review',          // المودل المرتبط
  localField: '_id',      // الحقل المرجعي في المنتج
  foreignField: 'product',// الحقل المرتبط في التقييمات
  justOne: false          // إرجاع مصفوفة من التقييمات
});

productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isDeleted: 1 });
productSchema.index(
  { 'name.en': 'text', 'name.ar': 'text', brand: 'text', subCategory: 'text', styleCode: 'text' },
  { name: 'ProductTextIndex', weights: { 'name.en': 10, 'name.ar': 10, brand: 5, styleCode: 5, subCategory: 2 } }
);

productSchema.post('save', async function () {
  await cache.del('top_products');
  await cache.del('filters_all');
  await cache.del('total_active_products_count');
  if (this.category) await cache.del(`filters_${this.category}`);
});

productSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) {
    await cache.del('top_products');
    await cache.del('filters_all');
    await cache.del('total_active_products_count');
    await cache.del(`filters_${doc.category}`);
  }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;