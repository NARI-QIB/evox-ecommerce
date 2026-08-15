// filepath: frontend/src/pages/HomeScreen.jsx
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Product from '../components/Product';
import ProductSkeleton from '../components/ProductSkeleton';
import { FaFire, FaArrowRight, FaBolt, FaBoxOpen, FaExclamationCircle } from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';

const fetchHomeData = async () => {
  const [catsRes, topRes, settingsRes] = await Promise.all([
    axios.get('/api/categories'),
    axios.get('/api/products/top'),
    axios.get('/api/settings')
  ]);

  const filteredCategories = catsRes.data.filter(
    (cat) => cat.name?.en?.toLowerCase() !== 'uncategorized'
  );

  return {
    categories: filteredCategories.slice(0, 4),
    topProducts: topRes.data,
    settings: settingsRes.data
  };
};

const fetchPersonalized = async ({ queryKey }) => {
  const [_, combinedIdsStr] = queryKey;
  const { data } = await axios.get(`/api/products/personalized?productIds=${ combinedIdsStr }`);
  return data;
};

const HomeScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { cartItems } = useContext(CartContext);

  const { t } = useTranslation();
  const { getDBText } = useLanguage();
  const navigate = useNavigate();

  const { data: homeData, isLoading: isLoadingHome, isError: isHomeError, error: homeError } = useQuery({
    queryKey: ['homeData'],
    queryFn: fetchHomeData,
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

  const cartIds = cartItems.map(item => item.product || item._id);
  const wishlistIds = wishlist.map(item => typeof item === 'object' ? item._id : item);

  const combinedIdsStr = [...new Set([...cartIds, ...wishlistIds])].sort().join(',');

  const { data: personalizedProducts = [], isLoading: loadingPersonalized, isError: isPersonalizedError } = useQuery({
    queryKey: ['personalized', combinedIdsStr],
    queryFn: fetchPersonalized,
    enabled: !!userInfo && combinedIdsStr.length > 0,
  });

  // 🌟 معالج النقر الفاخر: يمرر الشاشة بانسيابية إلى قسم المنتجات الرائجة
  const handleShopNow = () => {
    const trendingSection = document.getElementById('trending');
    if (trendingSection) {
      trendingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/search');
    }
  };

  if (isHomeError) {
    return (
      <div className="container mx-auto px-4 py-24 text-center animate-fade-in-up min-h-[60vh] flex flex-col justify-center items-center">
        <FaExclamationCircle className="text-6xl text-red-500 mb-6" />
        <h2 className="text-3xl font-extrabold text-dark mb-4">{t('common.error_occurred', 'An Error Occurred')}</h2>
        <p className="text-gray-500 max-w-md font-medium mb-8 text-sm">{homeError?.message || 'Failed to load store data.'}</p>
        <Button onClick={() => window.location.reload()} variant="primary" size="md">
          {t('common.try_again', 'Try Again')}
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="relative w-full min-h-[70vh] lg:min-h-[80vh] max-h-[800px] 2xl:max-h-[900px] bg-dark flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <picture>
            <source media="(max-width: 768px)" srcSet={homeData?.settings?.heroBannerMobile || '/images/hero-mobile.webp'} />
            <img
              src={homeData?.settings?.heroBannerDesktop || '/images/hero-bg.webp'}
              alt={t('home.hero_title')}
              fetchPriority="high"
              className="w-full h-full object-cover object-[center_20%] lg:object-[center_top] opacity-80 rtl:-scale-x-100"
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-dark/95 via-dark/60 md:via-dark/40 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-12 w-full">
          <div className="max-w-2xl py-20 mt-10 md:mt-0 text-start">
            <span className="inline-block bg-accent text-dark text-xs font-heading uppercase tracking-[0.2em] px-3 py-1 mb-4 shadow-[0_0_15px_rgba(206,255,0,0.5)]">
              {t('home.new_collection')}
            </span>
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-heading font-black text-white tracking-tighter mb-4 leading-[0.9] whitespace-pre-line uppercase drop-shadow-lg">
              {getDBText(homeData?.settings?.heroTitle, t('home.hero_title'))}
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 font-medium max-w-lg drop-shadow-md leading-relaxed">
              {getDBText(homeData?.settings?.heroSubtitle, t('home.hero_subtitle'))}
            </p>
            {/* 🌟 تم التعديل: ربط الزر بآلية التمرير التفاعلي لعرض المنتجات مباشرةً */}
            <Button onClick={handleShopNow} variant="primary" size="lg" rightIcon={<FaArrowRight className="text-sm rtl:rotate-180" />}>
              {t('home.shop_now')}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 mt-16 space-y-20">

        {!isLoadingHome && homeData?.categories?.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl md:text-3xl font-extrabold text-dark flex items-center gap-2">
                <FaBolt className="text-primary" /> {t('home.shop_by_category')}
              </h2>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {homeData.categories.map((cat, idx) => {
                const fallbackImages = ['/images/cat-shoes.jpg', '/images/cat-apparel.jpg', '/images/cat-equipment.jpg', '/images/hero-bg.webp'];

                return (
                  <Link key={cat._id} to={`/category/${ cat._id }`} className="group relative aspect-[3/4] sm:aspect-[4/5] rounded-2xl overflow-hidden bg-gray-100 shadow-sm hover:shadow-xl transition-all duration-500">
                    <img
                      src={cat.thumbnail || fallbackImages[idx % fallbackImages.length]}
                      alt={getDBText(cat.name)}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 rtl:-scale-x-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/20 to-transparent flex flex-col justify-end p-6 md:p-8 text-start">
                      <h3 className="text-white font-extrabold text-2xl md:text-3xl tracking-wide">
                        {getDBText(cat.name)}
                      </h3>
                      <span className="text-primary text-base font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 flex items-center gap-1 mt-2">
                        {t('home.explore')} <FaArrowRight className="text-sm rtl:rotate-180" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {userInfo && (loadingPersonalized || (!isPersonalizedError && personalizedProducts.length > 0)) && (
          <section className="bg-gray-50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 border-y border-gray-100">
            <div className="flex items-center justify-between mb-10 max-w-[1920px] mx-auto">
              <h2 className="text-2xl md:text-3xl font-extrabold text-dark tracking-tight flex items-center gap-2">
                {t('home.curated_for')} <span className="text-primary">{userInfo.name.split(' ')[0]}</span>
              </h2>
            </div>
            <div className="max-w-[1920px] mx-auto">
              {loadingPersonalized ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  {[...Array(4)].map((_, idx) => <ProductSkeleton key={idx} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                  {personalizedProducts.slice(0, 4).map((product) => <Product key={product._id} product={product} />)}
                </div>
              )}
            </div>
          </section>
        )}

        <section id="trending">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-extrabold text-dark flex items-center gap-2">
              <FaFire className="text-orange-500" /> {t('home.trending_now')}
            </h2>
          </div>
          {isLoadingHome ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {[...Array(4)].map((_, idx) => <ProductSkeleton key={idx} />)}
            </div>
          ) : !homeData?.topProducts || homeData.topProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
              <FaBoxOpen className="text-5xl text-gray-300 mb-3" />
              <p className="text-gray-400 font-bold">{t('home.no_trending')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {homeData.topProducts.slice(0, 4).map((product) => (
                <Product key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};

export default HomeScreen;