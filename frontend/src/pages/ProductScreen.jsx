// filepath: frontend/src/pages/ProductScreen.jsx
import { useState, useContext, useEffect, useRef } from 'react';
// 🌟 تم الإصلاح هنا: الاستيراد الصحيح من react-router-dom
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
import {
  FaShoppingCart, FaExclamationCircle, FaPlus, FaMinus,
  FaHeart, FaRegHeart, FaCheckCircle, FaInfoCircle, FaListUl, FaFire
} from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import Product from '../components/Product';

const optimizeCloudinaryUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('/upload/') && !url.includes('f_auto')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return url;
};

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

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [productId]);

  const { data: product, isLoading: isLoadingProduct, isError: isErrorProduct, error: errorProduct } = useQuery({
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

  const { data: colorVariants = [] } = useQuery({
    queryKey: ['colorVariants', product?.styleCode],
    queryFn: async () => {
      try {
        const { data } = await axios.get(`/api/products/style/${ product.styleCode }`);
        return data;
      } catch {
        const { data } = await axios.get(`/api/products?keyword=${ product.styleCode }`);
        return (data.products || data).filter(p => p.styleCode === product.styleCode);
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
      queryClient.setQueryData(['myWishlist'], isWishlisted
        ? previousWishlist.filter(item => (item._id || item) !== product._id)
        : [...previousWishlist, product]);
      return { previousWishlist };
    },
    onError: (err, vars, ctx) => {
      queryClient.setQueryData(['myWishlist'], ctx?.previousWishlist);
      showFeedback(lang === 'ar' ? 'حدث خطأ!' : 'Error!', 'error');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['myWishlist'] }),
  });

  const toggleWishlistHandler = (e) => {
    e.preventDefault();
    if (!userInfo) {
      showFeedback(lang === 'ar' ? 'يرجى تسجيل الدخول' : 'Please sign in', 'error');
      setTimeout(() => navigate('/login'), 1500);
      return;
    }
    toggleWishlistMutation.mutate();
    showFeedback(isWishlisted ? (lang === 'ar' ? 'تمت الإزالة' : 'Removed') : (lang === 'ar' ? 'أضيفت للمفضلة' : 'Added to wishlist'));
  };

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowStickyBar(!entry.isIntersecting), { threshold: 0 });
    if (mainBtnRef.current) observer.observe(mainBtnRef.current);
    return () => mainBtnRef.current && observer.disconnect();
  }, [product]);

  const addToCartHandler = () => {
    if (product.selectableOptions?.length > 0 && Object.keys(selectedVariants).length < product.selectableOptions.length) {
      setVariantError(t('product.select_required_options', 'Please select all options.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const variantString = Object.entries(selectedVariants).map(([k, v]) => `${ k }: ${ v }`).join(' | ');
    addToCart(product, qty, variantString);
    navigate('/cart');
  };

  if (isLoadingProduct) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div></div>;
  if (isErrorProduct) return <div className="container mx-auto px-4 py-24 text-center flex flex-col items-center"><FaExclamationCircle className="text-6xl text-red-500 mb-6" /><h2 className="text-3xl font-black mb-4">{t('product.not_found', 'Product Not Found')}</h2><Button onClick={() => navigate('/')} variant="outline">{t('home.back_to_home', 'Back to Home')}</Button></div>;

  const fullImageGallery = [product.image, ...(product.images || [])].filter(Boolean);
  const maxAllowedQty = Math.min(product.countInStock, 10);

  const isLowStock = product.countInStock > 0 && product.countInStock <= 20;

  return (
    <>
      <div className="container mx-auto px-4 py-8 animate-fade-in-up pb-24 md:pb-8 relative">
        <AnimatePresence>
          {localToast.show && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className={`fixed top-24 inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-bold shadow-2xl flex items-center gap-2 ${ localToast.type === 'error' ? 'bg-red-500 text-white' : 'bg-dark text-white' }`}>
              {localToast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle className="text-primary" />}
              {localToast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Product Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 mb-12 relative overflow-hidden">

          <button onClick={toggleWishlistHandler} className="absolute top-6 start-6 z-20 p-3 bg-white/80 backdrop-blur border border-gray-100 rounded-full shadow-sm hover:scale-110 transition-all cursor-pointer">
            {isWishlisted ? <FaHeart className="text-red-500 text-xl" /> : <FaRegHeart className="text-gray-400 hover:text-red-500 text-xl" />}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <ProductGallery images={fullImageGallery} productName={product.name?.en || product.name} />

            <div className="flex flex-col text-start">
              <h1 className="text-3xl md:text-4xl font-black text-dark mb-2 uppercase tracking-tight">{getDBText(product.name)}</h1>
              <p className="text-gray-500 font-bold mb-4 uppercase tracking-widest text-sm">{product.brand} | {product.styleCode}</p>
              <button onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-4 mb-6 w-fit hover:bg-gray-50 px-2 py-1 rounded-lg transition-all cursor-pointer">
                <Rating value={product.rating} text={`${ product.numReviews } ${ t('product.reviews', 'Reviews') }`} />
              </button>
              <div className="text-4xl font-black text-primary mb-6" dir="ltr">${product.price.toFixed(2)}</div>

              {colorVariants.length > 1 && (
                <div className="mb-8">
                  <h3 className="font-bold text-dark text-sm mb-3 uppercase tracking-wider">{t('product.available_colors', 'Available Colors')}:</h3>
                  <div className="flex flex-wrap gap-3">
                    {colorVariants.map((variant) => (
                      <Link key={variant._id} to={`/product/${ variant._id }`} className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${ variant._id === product._id ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105' }`}>
                        <img src={variant.image} alt="Variant" className="w-full h-full object-cover" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-gray-600 leading-relaxed mb-8">{getDBText(product.description)}</p>

              <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100 mb-8">

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-gray-200/60">
                  <span className="font-bold text-gray-500 uppercase tracking-widest text-xs sm:text-sm">{t('product.status', 'Availability')}:</span>
                  <span className={`inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm border ${ product.countInStock > 0 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200' }`}>
                    {product.countInStock > 0 ? t('product.in_stock', 'IN STOCK - SHIPS IMMEDIATELY') : t('product.out_of_stock', 'SOLD OUT')}
                  </span>
                </div>

                {isLowStock && (
                  <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3.5 rounded-xl mb-6 shadow-sm">
                    <FaFire className="text-xl shrink-0 animate-pulse text-orange-500" />
                    <span className="text-sm font-bold leading-tight">
                      {lang === 'ar'
                        ? `سارع بالشراء! تبقى ${ product.countInStock } قطع فقط من هذا المنتج قبل انتهاء الكمية.`
                        : `Hurry up! Only ${ product.countInStock } items left in stock before it's gone.`}
                    </span>
                  </div>
                )}

                {product.countInStock > 0 && (
                  <div className="space-y-5">
                    {product.selectableOptions?.map((option, index) => (
                      <div key={index} className="flex flex-col gap-2">
                        <label className="font-bold text-dark text-sm uppercase tracking-wide">{getDBText(option.name)}:</label>
                        <div className="flex flex-wrap gap-2">
                          {option.values?.map((val, idx) => {
                            const optionValue = val.en || val;
                            const isSelected = selectedVariants[option.name?.en || option.name] === optionValue;
                            return (
                              <button key={idx} onClick={() => { setSelectedVariants(prev => ({ ...prev, [option.name?.en || option.name]: optionValue })); setVariantError(''); }}
                                className={`px-4 py-2 rounded-lg font-bold border-2 transition-all cursor-pointer ${ isSelected ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary bg-white' }`}>
                                {getDBText(val)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-4 pt-4 border-t border-gray-200/60">
                      <span className="font-bold text-dark text-sm uppercase tracking-wide">{t('product.quantity', 'Quantity')}:</span>
                      <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm" dir="ltr">
                        <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} className="w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-30 transition-all cursor-pointer"><FaMinus /></button>
                        <span className="w-10 text-center font-bold text-lg">{qty}</span>
                        <button onClick={() => setQty(Math.min(maxAllowedQty, qty + 1))} disabled={qty >= maxAllowedQty} className="w-10 h-10 flex items-center justify-center hover:bg-primary hover:text-white disabled:opacity-30 transition-all cursor-pointer"><FaPlus /></button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {variantError && <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up"><FaExclamationCircle className="text-red-500" /><span className="text-red-700 font-bold text-sm">{variantError}</span></div>}

              <Button ref={mainBtnRef} onClick={addToCartHandler} disabled={product.countInStock === 0} variant="primary" size="lg" fullWidth leftIcon={<FaShoppingCart />}>
                {product.countInStock > 0 ? t('product.add_to_cart', 'Add To Cart') : t('product.out_of_stock', 'Out of Stock')}
              </Button>
            </div>
          </div>
        </div>

        {/* World-Class Details Section (Features & Specs) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 space-y-8">
            {product.features && product.features.length > 0 && (
              <section className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6">
                  <FaCheckCircle className="text-primary text-2xl" />
                  <h2 className="text-2xl font-black text-dark uppercase tracking-tight">{lang === 'ar' ? 'مميزات المنتج' : 'Key Features'}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.features.map((f, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                      <h4 className="font-bold text-dark mb-2 group-hover:text-primary transition-colors">{getDBText(f.title)}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{getDBText(f.description)}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {product.specifications && product.specifications.length > 0 && (
              <section className="animate-fade-in-up">
                <div className="flex items-center gap-3 mb-6">
                  <FaListUl className="text-primary text-2xl" />
                  <h2 className="text-2xl font-black text-dark uppercase tracking-tight">{lang === 'ar' ? 'المواصفات التقنية' : 'Technical Specs'}</h2>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                  <table className="w-full text-start border-collapse">
                    <tbody className="divide-y divide-gray-100">
                      {product.specifications.map((spec, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-bold text-dark bg-gray-50/50 w-1/3 text-sm">{getDBText(spec.name)}</td>
                          <td className="p-4 text-gray-600 text-sm">{getDBText(spec.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>

          <div className="bg-[var(--color-dark)] text-white rounded-3xl p-8 h-fit sticky top-24 shadow-xl shadow-slate-200 transition-all duration-300 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <FaInfoCircle className="text-[var(--color-primary)] text-2xl" />
              <h3 className="text-xl font-bold">{lang === 'ar' ? 'معلومات إضافية' : 'Additional Info'}</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {lang === 'ar' ? 'جميع منتجاتنا أصلية 100% وتأتي مع ضمان المصنع الرسمي.' : 'All our products are 100% authentic and come with the official manufacturer warranty.'}
            </p>
            <div className="space-y-3 text-sm font-medium">
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">{t('product.shipping', 'Shipping')}</span>
                <span className="text-[var(--color-primary)] font-black">Free</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/10">
                <span className="text-slate-400">{t('product.returns', 'Returns')}</span>
                <span className="text-[var(--color-primary)] font-black">30 Days</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-12"><ProductReviews ref={reviewsRef} productId={productId} productRating={product.rating} numReviews={product.numReviews} /></div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <h2 className="text-2xl md:text-3xl font-black text-dark mb-8 uppercase tracking-tight text-start">{t('product.you_might_also_like', 'You Might Also Like')}</h2>
          {isLoadingRelated ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div></div> : relatedProducts?.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {relatedProducts.slice(0, 5).map(rp => <Product key={rp._id} product={rp} />)}
            </div>
          ) : <div className="bg-gray-50 p-8 rounded-3xl text-center border border-gray-100"><p className="text-gray-500 font-bold">{t('product.no_related', 'No related products found.')}</p></div>}
        </div>
      </div>

      <div className={`md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 z-40 transition-transform duration-500 ease-out shadow-2xl ${ showStickyBar ? 'translate-y-0' : 'translate-y-full' }`}>
        <div className="flex justify-between items-center gap-4 max-w-7xl mx-auto">
          <div className="flex-1 min-w-0 text-start">
            <p className="text-xs text-gray-500 font-bold truncate uppercase tracking-widest">{getDBText(product.name)}</p>
            <p className="text-lg font-black text-primary" dir="ltr">${product.price.toFixed(2)}</p>
          </div>
          <Button onClick={addToCartHandler} disabled={product.countInStock === 0} variant="primary" size="sm" className="shrink-0">{product.countInStock > 0 ? t('product.add_to_cart', 'Add To Cart') : t('product.out_of_stock', 'Out of Stock')}</Button>
        </div>
      </div>
    </>
  );
};

export default ProductScreen;