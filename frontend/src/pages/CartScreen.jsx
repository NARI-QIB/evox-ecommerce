// filepath: frontend/src/pages/CartScreen.jsx
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaShoppingCart, FaTrashAlt, FaArrowRight,
  FaMinus, FaPlus, FaTruck, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';
import Breadcrumb from '../components/Breadcrumb';
import Product from '../components/Product';
import ProductSkeleton from '../components/ProductSkeleton';
import Button from '../components/ui/Button';

const CartScreen = () => {
  const { cartItems, addToCart, removeFromCart } = useContext(CartContext);
  const { t } = useTranslation();
  const { lang, getDBText } = useLanguage();
  const navigate = useNavigate();

  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 3000);
  };

  const itemsPrice = cartItems.reduce((acc, item) => acc + (Number(item.qty) * Number(item.price)), 0);
  const taxPrice = itemsPrice * 0.15;
  const subTotalWithTax = itemsPrice + taxPrice;
  const totalItems = cartItems.reduce((acc, item) => acc + Number(item.qty), 0);

  const freeShippingThreshold = 100;
  const progressPercentage = Math.min((itemsPrice / freeShippingThreshold) * 100, 100);
  const amountLeftForFreeShipping = Math.max(freeShippingThreshold - itemsPrice, 0).toFixed(2);
  const isFreeShippingReached = amountLeftForFreeShipping == 0;

  const checkoutHandler = () => navigate('/shipping');

  const handleUpdateQuantity = (item, newQty) => {
    const stockCount = Number(item.countInStock) || 99;
    if (newQty > stockCount) {
      showToast(lang === 'ar' ? 'الكمية المطلوبة تتجاوز المخزون' : 'Maximum stock reached', 'error');
      return;
    }
    if (newQty > 0) {
      addToCart(item, newQty, item.selectedSize);
    }
  };

  const handleRemoveItem = (id, size) => {
    removeFromCart(id, size);
    showToast(lang === 'ar' ? 'تمت الإزالة من السلة' : 'Item removed from cart', 'success');
  };

  const getSafeImage = (item) => {
    if (item.image && typeof item.image === 'string' && !item.image.includes('sample.jpg') && item.image.trim() !== '') return item.image;
    if (item.images && Array.isArray(item.images) && item.images.length > 0) return item.images[0];
    return '/images/placeholder.png';
  };

  const productIds = cartItems.map(item => item.product || item._id).join(',');

  const { data: suggestedProducts, isLoading: isLoadingSuggested } = useQuery({
    queryKey: ['suggestedProducts', productIds],
    queryFn: async () => {
      const { data } = await axios.get(`/api/products/personalized?productIds=${ productIds }`);
      return data;
    },
    enabled: cartItems.length > 0 && productIds !== '',
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-[75vh] relative">

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-bold text-sm ${ toast.type === 'error' ? 'bg-red-500 text-white border border-red-600' : 'bg-dark text-white border border-gray-700' }`}
          >
            {toast.type === 'error' ? <FaExclamationCircle /> : <FaCheckCircle className="text-primary" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <Breadcrumb steps={[{ label: t('header.cart'), icon: FaShoppingCart }]} />

      <div className="flex items-center justify-between mb-6 sm:mb-8 animate-fade-in-up">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-dark tracking-tight uppercase">
          {t('cart.title_your')} <span className="text-primary">{t('cart.title_cart')}</span>
        </h1>
        {cartItems.length > 0 && (
          <span className="bg-dark text-white px-4 py-1.5 rounded-full text-xs font-heading tracking-widest uppercase shadow-sm">
            {totalItems} {t('cart.items')}
          </span>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 bg-white rounded-[2rem] border border-gray-100 shadow-sm text-center animate-fade-in-up">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 mx-auto mb-6">
            <circle cx="100" cy="100" r="100" fill="#F4F4F5" />
            <path d="M50 70h100v70a20 20 0 0 1-20 20H70a20 20 0 0 1-20-20V70z" fill="#fff" stroke="#1E293B" strokeWidth="8" strokeLinejoin="round" />
            <path d="M70 70V50a30 30 0 0 1 60 0v20" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M80 110h40M90 130h20" stroke="#F97316" strokeWidth="8" strokeLinecap="round" />
            <circle cx="150" cy="50" r="15" fill="#22D3EE" />
          </svg>
          <h2 className="text-2xl font-heading font-bold text-dark mb-3 uppercase tracking-wide">
            {t('cart.empty_title')}
          </h2>
          <p className="text-gray-500 font-medium mb-8 max-w-md text-sm">
            {t('cart.empty_desc')}
          </p>
          <Button
            to="/"
            variant="primary"
            size="lg"
            rightIcon={<FaArrowRight className="text-sm rtl:rotate-180" />}
          >
            {t('cart.start_shopping')}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 animate-fade-in-up">

            <div className="lg:w-2/3 w-full">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 relative overflow-hidden">
                {isFreeShippingReached && <div className="absolute inset-0 bg-green-500/5 animate-pulse"></div>}

                <div className="flex items-center gap-4 mb-4 relative z-10 text-start">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-500 ${ isFreeShippingReached ? 'bg-green-500 text-white shadow-md' : 'bg-blue-50 text-primary' }`}>
                    {isFreeShippingReached ? <FaCheckCircle className="text-lg" /> : <FaTruck className="text-lg rtl:-scale-x-100" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-dark">
                      {isFreeShippingReached
                        ? t('cart.unlocked_free_shipping')
                        : t('cart.add_more_for_free').replace('{{amount}}', amountLeftForFreeShipping)}
                    </p>
                  </div>
                </div>

                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative z-10" dir="ltr">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out relative ${ isFreeShippingReached ? 'bg-green-500' : 'bg-primary' }`}
                    style={{ width: `${ progressPercentage }%` }}
                  >
                    <div className="absolute top-0 start-0 bottom-0 w-full bg-gradient-to-r rtl:bg-gradient-to-l from-transparent via-white/30 to-transparent ltr:-translate-x-full rtl:translate-x-full animate-[shimmer_2s_infinite]"></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {cartItems.map((item) => {
                  const actualProductId = item.product || item._id;

                  return (
                    <div key={`${ actualProductId }-${ item.selectedSize }`} className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-6 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                      <Link to={`/product/${ actualProductId }`} className="shrink-0 mx-auto sm:mx-0">
                        <img
                          src={getSafeImage(item)}
                          alt={getDBText(item.name)}
                          className="w-32 h-32 sm:w-28 sm:h-28 object-contain mix-blend-multiply rounded-2xl border border-gray-100 bg-[#F5F5F5] p-2 hover:scale-105 transition-transform"
                        />
                      </Link>

                      <div className="flex flex-col flex-1 justify-between text-start">
                        <div className="flex justify-between items-start gap-3 sm:gap-4">
                          <div>
                            <Link to={`/product/${ actualProductId }`} className="text-base sm:text-lg font-heading font-bold text-dark hover:text-primary transition-colors line-clamp-2 leading-tight uppercase tracking-wide">
                              {getDBText(item.name)}
                            </Link>
                            {item.selectedSize && (
                              <span className="inline-block mt-2 text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-md uppercase tracking-wider">
                                {t('cart.size')}: {item.selectedSize}
                              </span>
                            )}
                          </div>

                          <div className="text-end shrink-0">
                            <div className="text-xl sm:text-2xl font-heading font-bold text-primary" dir="ltr">
                              ${(Number(item.price) * Number(item.qty)).toFixed(2)}
                            </div>
                            {item.qty > 1 && (
                              <div className="text-xs text-gray-400 font-bold mt-1" dir="ltr">
                                ${Number(item.price).toFixed(2)} {t('cart.each')}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-end mt-4">
                          <div className="flex items-center border-2 border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm transition-colors duration-300 focus-within:border-primary" dir="ltr">
                            <button
                              onClick={() => handleUpdateQuantity(item, Number(item.qty) - 1)}
                              disabled={item.qty <= 1}
                              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-dark disabled:opacity-30 transition-colors focus:outline-none cursor-pointer"
                            >
                              <FaMinus className="text-xs sm:text-sm" />
                            </button>
                            <span className="w-10 sm:w-12 text-center font-heading font-bold text-lg text-dark">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(item, Number(item.qty) + 1)}
                              className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-dark transition-colors focus:outline-none cursor-pointer"
                            >
                              <FaPlus className="text-xs sm:text-sm" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemoveItem(actualProductId, item.selectedSize)}
                            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors focus:outline-none uppercase tracking-wider cursor-pointer"
                          >
                            <FaTrashAlt className="text-sm" /> <span className="hidden sm:inline">{t('cart.remove')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:w-1/3 w-full text-start">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xl shadow-gray-200/30 lg:sticky lg:top-24">
                <h2 className="text-xl font-heading font-bold text-dark mb-6 border-b border-gray-100 pb-4 uppercase tracking-wide">
                  {t('cart.order_summary')}
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-500 font-medium text-sm">
                    <span>{t('cart.subtotal')} ({totalItems} {t('cart.items')})</span>
                    <span className="text-dark font-bold" dir="ltr">${itemsPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium text-sm border-b border-gray-50 pb-4">
                    <span>{t('cart.tax_label', 'Tax (15%)')}</span>
                    <span className="text-dark font-bold" dir="ltr">${taxPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 font-medium text-sm pt-2">
                    <span>{t('cart.estimated_shipping')}</span>
                    <span className={isFreeShippingReached ? 'text-green-500 font-bold' : 'text-dark font-bold'}>
                      {isFreeShippingReached ? t('cart.free') : t('cart.calculated_next')}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 mb-8">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-heading font-bold text-dark uppercase tracking-wide">
                      {t('cart.estimated_total')}
                    </span>
                    <span className="text-3xl font-heading font-bold text-primary" dir="ltr">${subTotalWithTax.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-400 text-end uppercase tracking-widest font-bold mt-1">
                    {t('cart.taxes_applied')}
                  </p>
                </div>

                <Button
                  onClick={checkoutHandler}
                  disabled={cartItems.length === 0}
                  variant="primary"
                  size="lg"
                  fullWidth
                  rightIcon={<FaArrowRight className="text-sm rtl:rotate-180" />}
                >
                  {t('cart.checkout_now')}
                </Button>
              </div>
            </div>

          </div>

          {!isLoadingSuggested && suggestedProducts && suggestedProducts.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200/60 w-full animate-fade-in-up">
              <div className="flex items-center gap-3 mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-dark uppercase tracking-tight">
                  {t('cart.you_might_also_like', 'Complete Your Gear')}
                </h2>
                <span className="hidden sm:inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold uppercase rounded-full tracking-widest">
                  {t('cart.recommended', 'Recommended')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {suggestedProducts.map(product => (
                  <Product key={product._id} product={product} />
                ))}
              </div>
            </div>
          )}
          {isLoadingSuggested && (
            <div className="mt-16 pt-8 border-t border-gray-200/60 w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {[...Array(5)].map((_, idx) => <ProductSkeleton key={idx} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CartScreen;