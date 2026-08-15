// filepath: frontend/src/components/Product.jsx
import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';

const optimizeCloudinaryUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('/upload/') && !url.includes('f_auto')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return url;
};

const Product = ({ product }) => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang, getDBText } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [localToast, setLocalToast] = useState({ show: false, msg: '', type: 'success' });

  const showFeedback = (msg, type = 'success') => {
    setLocalToast({ show: true, msg, type });
    setTimeout(() => setLocalToast({ show: false, msg: '', type: 'success' }), 2000);
  };

  const { data: wishlist = [] } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: async () => {
      const { data } = await axios.get('/api/users/profile/wishlist');
      return data;
    },
    enabled: !!userInfo,
    staleTime: 5 * 60 * 1000,
  });

  // 🌟 تم الإصلاح: مطابقة معرفات المفضلة تحسباً لاختلاف النوع بين String و ObjectId
  const isWishlisted = wishlist.some(item => {
    const itemId = typeof item === 'object' ? item._id : item;
    return String(itemId) === String(product?._id);
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.post('/api/users/profile/wishlist', { productId: product._id });
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['myWishlist'] });
      const previousWishlist = queryClient.getQueryData(['myWishlist']) || [];

      let updatedWishlist;
      if (isWishlisted) {
        updatedWishlist = previousWishlist.filter(item => {
          const itemId = typeof item === 'object' ? item._id : item;
          return String(itemId) !== String(product._id);
        });
      } else {
        updatedWishlist = [...previousWishlist, product];
      }

      queryClient.setQueryData(['myWishlist'], updatedWishlist);
      return { previousWishlist };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfileStats'] });
    },
    onError: (error, variables, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['myWishlist'], context.previousWishlist);
      }
      showFeedback(lang === 'ar' ? 'حدث خطأ!' : 'Error occurred!', 'error');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
    }
  });

  if (!product) return null;

  const toggleWishlistHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userInfo) {
      showFeedback(lang === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in first', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }

    if (!toggleWishlistMutation.isPending) {
      toggleWishlistMutation.mutate();
      if (isWishlisted) {
        showFeedback(lang === 'ar' ? 'تمت الإزالة' : 'Removed', 'success');
      } else {
        showFeedback(lang === 'ar' ? 'أضيفت للمفضلة' : 'Added to wishlist', 'success');
      }
    }
  };

  const baseName = getDBText(product.name, 'Unknown Product');
  const colorName = getDBText(product.color?.name);
  const fullProductName = colorName ? `${ baseName } - ${ colorName }` : baseName;

  let rawImage = '/images/placeholder.png';
  if (product.image && !product.image.includes('sample.jpg') && product.image.trim() !== '') {
    rawImage = product.image;
  } else if (product.images && product.images.length > 0) {
    rawImage = product.images[0];
  }
  const safeImage = optimizeCloudinaryUrl(rawImage);

  return (
    <div className="group flex flex-col h-full relative cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-transparent hover:border-gray-100">
      <AnimatePresence>
        {localToast.show && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className={`absolute bottom-24 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-20 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-center shadow-lg whitespace-nowrap flex items-center gap-1.5 ${ localToast.type === 'error' ? 'bg-red-500 text-white' : 'bg-dark text-white' }`}
          >
            {localToast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle className="text-primary" />}
            {localToast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={toggleWishlistHandler}
        disabled={toggleWishlistMutation.isPending}
        className="absolute top-3 end-3 z-10 p-2 transition-transform duration-300 hover:scale-110 focus:outline-none cursor-pointer"
      >
        {isWishlisted ? (
          <FaHeart className="text-red-500 text-xl drop-shadow-sm" />
        ) : (
          <FaRegHeart className="text-gray-400 hover:text-red-500 text-xl transition-colors" />
        )}
      </button>

      {product.countInStock === 0 && (
        <div className="absolute top-3 start-3 z-10 bg-dark text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm">
          {t('productCard.sold_out', 'Sold Out')}
        </div>
      )}

      <Link to={`/product/${ product._id }`} className="relative w-full aspect-square flex items-center justify-center overflow-hidden">
        <img src={safeImage} alt={fullProductName} loading="lazy" className="w-full h-full object-contain mix-blend-darken p-1 sm:p-2 group-hover:scale-105 transition-transform duration-500 ease-out" />
      </Link>

      <div className="px-4 pb-4 pt-1 flex flex-col flex-grow">
        <Link to={`/product/${ product._id }`} className="flex flex-col">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1 truncate">
            {product.brand || 'EVOX'}
          </span>
          <h3 className="text-[13px] sm:text-[14px] font-medium text-gray-800 leading-snug line-clamp-2 group-hover:underline decoration-1 underline-offset-2 transition-all capitalize">
            {fullProductName.toLowerCase()}
          </h3>
        </Link>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-[14px] sm:text-[15px] font-bold text-dark" dir="ltr">
            ${product.price?.toFixed(2) || '0.00'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Product;