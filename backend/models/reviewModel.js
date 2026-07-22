// filepath: backend/models/reviewModel.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product', 
    },
    name: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🌟 حماية معماريّة (DB-Level Constraint): منع المستخدم من تقييم المنتج أكثر من مرة
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// 🌟 دالة ثابتة لحساب متوسط التقييمات وتحديث المنتج فوراً
reviewSchema.statics.calcAverageRatings = async function (productId) {
  const stats = await this.aggregate([
    { $match: { product: productId } },
    {
      $group: {
        _id: '$product',
        nRating: { $avg: '$rating' },
        nNumReviews: { $sum: 1 },
      },
    },
  ]);

  // تحديث الـ Product بناءً على نتيجة التجميع
  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].nRating * 10) / 10, // تقريب لأقرب كسر عشري (مثلاً 4.5)
      numReviews: stats[0].nNumReviews,
    });
  } else {
    // في حال تم حذف كل التقييمات، يرجع للصفر
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      rating: 0,
      numReviews: 0,
    });
  }
};

// 🌟 Mongoose Hooks (Triggers)
// استدعاء دالة الحساب تلقائياً بعد إضافة أو تحديث تقييم
reviewSchema.post('save', function () {
  this.constructor.calcAverageRatings(this.product);
});

// استدعاء دالة الحساب تلقائياً بعد حذف تقييم عبر Query (مثل findByIdAndDelete)
reviewSchema.post(/^findOneAnd/, async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.product);
  }
});

// استدعاء دالة الحساب تلقائياً عند حذف تقييم مباشرة من הـ Document
reviewSchema.post('deleteOne', { document: true, query: false }, function () {
  this.constructor.calcAverageRatings(this.product);
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;