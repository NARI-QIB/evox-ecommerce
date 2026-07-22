// filepath: frontend/src/pages/ProductScreen.jsx
import { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import Rating from '../components/Rating';
import ProductGallery from '../components/ProductGallery';
import ProductReviews from '../components/ProductReviews';
import Button from '../components/ui/Button';
import { FaShoppingCart, FaExclamationCircle, FaPlus, FaMinus, FaHeart, FaRegHeart, FaCheckCircle } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import Product from '../components/Product';

const ProductScreen = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { userInfo } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { lang, getDBText } = useLanguage();
  const queryClient = useQueryClient();

  const [qty, setQty] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [variantError, setVariantError] = useState('');

  const [showStickyBar, setShowStickyBar] = useState(false);
  const mainBtnRef = useRef(null);
  const reviewsRef = useRef(null);

  const [localToast, setLocalToast] = useState({ show: false, msg: '', type: 'success' });

  const showFeedback = (msg, type = 'success') => {
    setLocalToast({ show: true, msg, type });
    setTimeout(() => setLocalToast({ show: false, msg: '', type: 'success' }), 2000);
  };

  // 🌟 رفع الشاشة لأعلى عند الدخول لمنتج جديد (مفيدة جداً عند التنقل بين الألوان)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [productId]);

  const {
    data: product,
    isLoading: isLoadingProduct,
    isError: isErrorProduct,
    error: errorProduct
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/products/${ productId }`);
      return data;
    },
  });

  const { data: relatedProducts, isLoading: isLoadingRelated } = useQuery({
    queryKey: ['relatedProducts', productId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/products/${ productId }/related`);
      return data;
    },
    enabled: !!product
  });

  // 🌟 استعلام جديد لجلب باقي الألوان التي تمتلك نفس الـ styleCode
  const { data: colorVariants = [] } = useQuery({
    queryKey: ['colorVariants', product?.styleCode],
    queryFn: async () => {
      try {
        // محاولة جلب الألوان عبر مسار مخصص (إن وجد)
        const { data } = await axios.get(`/api/products/style/${ product.styleCode }`);
        return data;
      } catch (error) {
        // بديل: استخدام مسار البحث العام لضمان عدم ظهور أخطاء
        const { data } = await axios.get(`/api/products?keyword=${ product.styleCode }`);
        const productsList = data.products || data;
        return productsList.filter(p => p.styleCode === product.styleCode);
      }
    },
    enabled: !!product?.styleCode
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: async () => {
      const { data } = await axios.get('/api/users/profile/wishlist');
      return data;
    },
    enabled: !!userInfo,
    staleTime: 5 * 60 * 1000,
  });

  const isWishlisted = wishlist.some(item => (item._id || item) === product?._id);

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
        updatedWishlist = previousWishlist.filter(item => (item._id || item) !== product._id);
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

  const toggleWishlistHandler = (e) => {
    e.preventDefault();
    if (!userInfo) {
      showFeedback(lang === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in first', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    if (!toggleWishlistMutation.isPending) {
      toggleWishlistMutation.mutate();
      if (isWishlisted) showFeedback(lang === 'ar' ? 'تمت الإزالة' : 'Removed', 'success');
      else showFeedback(lang === 'ar' ? 'أضيفت للمفضلة' : 'Added to wishlist', 'success');
    }
  };

  useEffect(() => {
    if (product) {
      setSelectedVariants({});
      setQty(1);
      setVariantError('');
    }
  }, [product, productId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0 }
    );
    if (mainBtnRef.current) observer.observe(mainBtnRef.current);
    return () => {
      if (mainBtnRef.current) observer.disconnect();
    };
  }, [product]);

  const addToCartHandler = () => {
    if (product.selectableOptions?.length > 0) {
      const requiredOptionsCount = product.selectableOptions.length;
      const selectedOptionsCount = Object.keys(selectedVariants).length;

      if (selectedOptionsCount < requiredOptionsCount) {
        setVariantError(t('product.select_required_options', 'Please select all required options.'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    const variantString = Object.entries(selectedVariants)
      .map(([key, value]) => `${ key }: ${ value }`)
      .join(' | ');

    addToCart(product, qty, variantString);
    navigate('/cart');
  };

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
      </div>
    );
  }

  if (isErrorProduct) {
    return (
      <div className="container mx-auto px-4 py-24 text-center animate-fade-in-up min-h-[50vh] flex flex-col justify-center items-center">
        <FaExclamationCircle className="text-6xl text-red-500 mb-6" />
        <h2 className="text-3xl font-extrabold text-dark mb-4">{t('product.not_found', 'Product Not Found')}</h2>
        <p className="text-gray-500 max-w-md font-medium mb-8 text-sm">{errorProduct?.response?.data?.message || errorProduct.message}</p>
        <Button onClick={() => navigate('/')} variant="outline" size="lg">
          {t('home.back_to_home', 'Return to Store')}
        </Button>
      </div>
    );
  }

  const fullImageGallery = [product.image, ...(product.images || [])].filter(Boolean);
  const maxAllowedQty = Math.min(product.countInStock, 10);

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fade-in-up pb-24 md:pb-8 relative">

        <AnimatePresence>
          {localToast.show && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className={`fixed top-24 inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-bold shadow-2xl whitespace-nowrap flex items-center gap-2 ${ localToast.type === 'error' ? 'bg-red-500 text-white' : 'bg-dark text-white' }`}
            >
              {localToast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle className="text-primary" />}
              {localToast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 mb-12 relative overflow-hidden">
          <button
            onClick={toggleWishlistHandler}
            disabled={toggleWishlistMutation.isPending}
            className="absolute top-6 inset-e-6 z-10 p-3 bg-white/80 backdrop-blur border border-gray-100 rounded-full shadow-sm hover:shadow-md transition-all duration-300 hover:scale-110 focus:outline-none cursor-pointer"
          >
            {isWishlisted ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-gray-400 hover:text-red-500 text-xl" />}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="w-full">
              <ProductGallery images={fullImageGallery} productName={product.name?.en || product.name} />
            </div>

            <div className="flex flex-col text-start">
              <h1 className="text-3xl md:text-4xl font-black text-dark mb-2 uppercase tracking-tight">
                {getDBText(product.name)}
              </h1>
              <p className="text-gray-500 font-bold mb-4 uppercase tracking-widest text-sm">
                {product.brand} | {product.styleCode}
              </p>

              <button
                onClick={scrollToReviews}
                className="flex items-center gap-4 mb-6 w-fit hover:opacity-80 hover:bg-gray-50 px-2 py-1 -ms-2 rounded-lg transition-all focus:outline-none cursor-pointer"
              >
                <Rating value={product.rating} text={`${ product.numReviews } ${ t('product.reviews') }`} />
              </button>

              <div className="text-4xl font-black text-primary mb-6" dir="ltr">
                ${product.price.toFixed(2)}
              </div>

              {/* 🌟 قسم عرض الألوان المتاحة */}
              {colorVariants.length > 1 && (
                <div className="mb-8">
                  <h3 className="font-bold text-dark text-sm mb-3 uppercase tracking-wider">
                    {t('product.available_colors') || (lang === 'ar' ? 'الألوان المتاحة' : 'Available Colors')}:
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {colorVariants.map((variant) => (
                      <Link
                        key={variant._id}
                        to={`/product/${ variant._id }`}
                        title={getDBText(variant.color?.name) || variant.styleCode}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${ variant._id === product._id
                            ? 'border-primary shadow-md scale-105'
                            : 'border-transparent hover:border-gray-300 hover:scale-105 opacity-70 hover:opacity-100'
                          }`}
                      >
                        <img
                          src={variant.image}
                          alt={getDBText(variant.name) || 'Color Variant'}
                          className="w-full h-full object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-gray-600 leading-relaxed mb-8">
                {getDBText(product.description)}
              </p>

              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 mb-8">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold text-dark">{t('product.status', 'Status')}:</span>
                  <span className={`font-black uppercase tracking-wider ${ product.countInStock > 0 ? 'text-green-600' : 'text-red-500' }`}>
                    {product.countInStock > 0 ? t('product.in_stock') : t('product.out_of_stock')}
                  </span>
                </div>

                {product.countInStock > 0 && (
                  <div className="space-y-5">
                    {product.selectableOptions?.map((option, index) => {
                      const optionName = option.name?.en || option.name;
                      const displayOptionName = getDBText(option.name);

                      return (
                        <div key={index} className="flex flex-col gap-2">
                          <label className="font-bold text-dark text-sm">{displayOptionName}:</label>
                          <div className="flex flex-wrap gap-2">
                            {option.values?.map((val, idx) => {
                              const optionValue = val.en || val;
                              const displayOptionValue = getDBText(val);
                              const isSelected = selectedVariants[optionName] === optionValue;

                              return (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    setSelectedVariants(prev => ({ ...prev, [optionName]: optionValue }));
                                    setVariantError('');
                                  }}
                                  className={`px-4 py-2 rounded-lg font-bold border-2 transition-all duration-300 cursor-pointer ${ isSelected
                                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                    : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 bg-white'
                                    }`}
                                >
                                  {displayOptionValue}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}

                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200/60">
                      <span className="font-bold text-dark text-sm">{t('product.quantity', 'Quantity')}:</span>
                      <div className="flex items-center border-2 border-gray-200 hover:border-primary/40 rounded-xl bg-white overflow-hidden shadow-sm transition-colors duration-300" dir="ltr">
                        <button
                          type="button"
                          onClick={() => setQty(Math.max(1, qty - 1))}
                          disabled={qty <= 1}
                          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white active:bg-dark disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all duration-200 focus:outline-none cursor-pointer"
                        >
                          <FaMinus className="text-xs sm:text-sm" />
                        </button>
                        <span className="w-10 sm:w-12 text-center font-heading font-bold text-lg text-dark select-none">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(Math.min(maxAllowedQty, qty + 1))}
                          disabled={qty >= maxAllowedQty}
                          className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-500 hover:bg-primary hover:text-white active:bg-dark disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500 transition-all duration-200 focus:outline-none cursor-pointer"
                        >
                          <FaPlus className="text-xs sm:text-sm" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {variantError && (
                <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up shadow-sm">
                  <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
                  <span className="text-red-700 font-bold text-sm text-start">{variantError}</span>
                </div>
              )}

              <Button
                ref={mainBtnRef}
                onClick={addToCartHandler}
                disabled={product.countInStock === 0}
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<FaShoppingCart />}
              >
                {product.countInStock > 0 ? t('product.add_to_cart') : t('product.out_of_stock')}
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <ProductReviews
            ref={reviewsRef}
            productId={productId}
            productRating={product.rating}
            numReviews={product.numReviews}
          />
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <h2 className="text-2xl md:text-3xl font-black text-dark mb-8 uppercase tracking-tight text-start">
            {t('product.you_might_also_like', 'You Might Also Like')}
          </h2>

          {isLoadingRelated ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div></div>
          ) : relatedProducts && relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 5).map(rp => (
                <Product key={rp._id} product={rp} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-3xl text-center border border-gray-100">
              <p className="text-gray-500 font-bold">{t('product.no_related', 'No related products found.')}</p>
            </div>
          )}
        </div>
      </div>

      <div className={`md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 z-40 transition-transform duration-500 ease-out shadow-[0_-10px_30px_rgba(0,0,0,0.08)] ${ showStickyBar ? 'translate-y-0' : 'translate-y-full' }`}>
        <div className="flex justify-between items-center gap-4 max-w-7xl mx-auto">
          <div className="flex-1 min-w-0 text-start">
            <p className="text-xs text-gray-500 font-bold truncate uppercase tracking-widest">{getDBText(product.name)}</p>
            <p className="text-lg font-black text-primary" dir="ltr">${product.price.toFixed(2)}</p>
          </div>
          <Button
            onClick={addToCartHandler}
            disabled={product.countInStock === 0}
            variant="primary"
            size="sm"
            className="shrink-0"
          >
            {product.countInStock > 0 ? t('product.add_to_cart') : t('product.out_of_stock')}
          </Button>
        </div>
      </div>
    </>
  );
};

export default ProductScreen;