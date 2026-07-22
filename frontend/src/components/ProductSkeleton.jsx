// filepath: frontend/src/components/ProductSkeleton.jsx
const ProductSkeleton = () => {
  return (
    <div className="flex flex-col h-full relative bg-white rounded-xl shadow-sm overflow-hidden animate-pulse border border-transparent">

      {/* 🌟 مكان زر المفضلة التخيلي مطابق تماماً للبطاقة الحقيقية (top-3 end-3 p-2) */}
      <div className="absolute top-3 end-3 z-10 p-2">
        <div className="w-5 h-5 bg-gray-200 rounded-full"></div>
      </div>

      {/* 🌟 مساحة الصورة الكبيرة بنسبة أبعاد مطابقة 100% (aspect-square) */}
      <div className="relative w-full aspect-square flex items-center justify-center overflow-hidden bg-gray-50 p-1 sm:p-2">
        <svg className="w-12 h-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>

      {/* 🌟 المعلومات السفلية (نفس الـ Padding والهيكلية px-4 pb-4 pt-1) */}
      <div className="px-4 pb-4 pt-1 flex flex-col flex-grow">
        <div className="flex flex-col mt-2">
          {/* Brand Skeleton */}
          <div className="w-14 h-3 bg-gray-200 rounded-full mb-2"></div>

          {/* Title Skeleton (سطرين لتمثيل العنوان) */}
          <div className="w-full h-4 bg-gray-200 rounded-full mb-2"></div>
          <div className="w-3/4 h-4 bg-gray-200 rounded-full"></div>
        </div>

        {/* Price Skeleton (في أسفل البطاقة تماماً عبر mt-auto) */}
        <div className="mt-auto pt-3 flex items-center justify-between">
          <div className="w-16 h-5 bg-gray-200 rounded-md"></div>
        </div>
      </div>

    </div>
  );
};

export default ProductSkeleton;