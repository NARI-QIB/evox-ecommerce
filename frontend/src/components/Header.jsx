// filepath: frontend/src/components/Header.jsx
import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  FaShoppingBag, FaUser, FaUserPlus, FaUserCircle, FaSignOutAlt,
  FaChevronDown, FaSearch, FaTimes, FaCog, FaBars, FaTags, FaGlobe
} from 'react-icons/fa';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import Button from './ui/Button';

const Header = () => {
  const { cartItems } = useContext(CartContext);
  const { userInfo, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang, changeLanguage, getDBText } = useLanguage();

  const location = useLocation();
  const navigate = useNavigate();

  const [keyword, setKeyword] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isCartBumping, setIsCartBumping] = useState(false);

  const desktopCategoryRef = useRef(null);
  const mobileCategoryRef = useRef(null);

  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  useEffect(() => {
    if (cartCount === 0) return;
    setIsCartBumping(true);
    const timer = setTimeout(() => setIsCartBumping(false), 300);
    return () => clearTimeout(timer);
  }, [cartCount]);

  const searchParams = new URLSearchParams(location.search);
  const queryCategoryId = searchParams.get('category');
  const categoryMatch = location.pathname.match(/\/category\/(.+)/);
  const currentCategoryId = queryCategoryId || (categoryMatch ? categoryMatch[1] : null);

  // 🌟 جلب الإعدادات العامة للمتجر للحصول على الشعار
  const { data: globalSettings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/settings');
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // تخزين في الذاكرة المؤقتة لمدة 24 ساعة
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: async () => {
      const { data } = await axios.get('/api/categories');
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const currentCategoryObj = currentCategoryId && categories.length > 0
    ? categories.find(c => c._id === currentCategoryId)
    : null;

  const currentCategoryName = getDBText(currentCategoryObj?.name);

  useEffect(() => {
    const currentKeyword = searchParams.get('keyword') || '';
    if (!isTyping) setKeyword(currentKeyword);
  }, [location.search, isTyping]);

  useEffect(() => {
    if (!isTyping) return;
    const delayDebounceFn = setTimeout(() => {
      const categoryQuery = currentCategoryId ? `&category=${ currentCategoryId }` : '';
      if (keyword.trim()) {
        navigate(`/search?keyword=${ keyword.trim() }${ categoryQuery }`, { replace: true });
      } else {
        if (currentCategoryId) navigate(`/category/${ currentCategoryId }`, { replace: true });
        else navigate('/', { replace: true });
      }
      setIsTyping(false);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [keyword, navigate, isTyping, currentCategoryId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) setIsUserDropdownOpen(false);
      const clickedInsideDesktop = desktopCategoryRef.current && desktopCategoryRef.current.contains(event.target);
      const clickedInsideMobile = mobileCategoryRef.current && mobileCategoryRef.current.contains(event.target);
      if (!clickedInsideDesktop && !clickedInsideMobile) setIsCategoryDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isMobileSearchOpen) setIsMobileSearchOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen, isMobileSearchOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsLangMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  const logoutHandler = () => {
    setIsUserDropdownOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const handleSearchChange = (e) => {
    setKeyword(e.target.value);
    setIsTyping(true);
  };

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    const categoryQuery = currentCategoryId ? `&category=${ currentCategoryId }` : '';
    if (keyword.trim()) {
      navigate(`/search?keyword=${ keyword.trim() }${ categoryQuery }`, { replace: true });
    } else {
      if (currentCategoryId) navigate(`/category/${ currentCategoryId }`, { replace: true });
      else navigate('/', { replace: true });
    }
    setIsMobileSearchOpen(false);
    setIsTyping(false);
    document.activeElement.blur();
  };

  const clearSearch = () => {
    setKeyword('');
    setIsTyping(true);
  };

  const handleCategorySelect = (catId) => {
    setIsCategoryDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (keyword.trim()) navigate(`/search?keyword=${ keyword.trim() }${ catId ? `&category=${ catId }` : '' }`);
    else navigate(catId ? `/category/${ catId }` : '/');
  };

  const displayCategories = categories.filter(cat => cat.name?.en?.toLowerCase() !== 'uncategorized');

  return (
    <>
      <header className="bg-white/90 backdrop-blur-xl shadow-sm border-b border-white/20 sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center relative gap-4">

          <div className="flex items-center gap-3 sm:gap-4 flex-1 justify-start">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-gray-600 hover:text-primary transition-colors focus:outline-none p-2 -ms-2 rounded-lg hover:bg-gray-50 cursor-pointer">
              <FaBars className="text-xl sm:text-2xl" />
            </button>
            <Link to="/" className="flex items-center hover:scale-105 transition-transform shrink-0">
              {/* 🌟 عرض الشعار أو النص كبديل احتياطي */}
              {globalSettings?.storeLogo ? (
                <img src={globalSettings.storeLogo} alt="Store Logo" className="h-8 sm:h-10 md:h-12 w-auto object-contain drop-shadow-sm" />
              ) : (
                <span className="text-3xl sm:text-4xl md:text-5xl font-heading font-black italic tracking-tighter text-dark">
                  EVO<span className="text-primary">X</span>
                </span>
              )}
            </Link>
          </div>

          <div className="hidden md:flex justify-center items-center w-full max-w-2xl px-2 lg:px-6 z-20">
            <div className="flex w-full bg-gray-100/70 rounded-2xl border-2 border-transparent focus-within:border-primary focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10 transition-all duration-300 shadow-inner relative h-12">
              <div className="relative shrink-0" ref={desktopCategoryRef}>
                <button onClick={() => setIsCategoryDropdownOpen(prev => !prev)} className="h-full px-4 flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-primary transition-colors border-e border-gray-200 focus:outline-none rounded-s-2xl bg-transparent font-heading tracking-wide uppercase whitespace-nowrap cursor-pointer">
                  <span className="truncate max-w-20 xl:max-w-30">{currentCategoryName || t('header.all_categories')}</span>
                  <FaChevronDown className={`text-[10px] transition-transform duration-300 ${ isCategoryDropdownOpen ? 'rotate-180 text-primary' : '' }`} />
                </button>
                <div className={`absolute top-full inset-s-0 mt-3 w-48 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-300 transform origin-top-left rtl:origin-top-right ${ isCategoryDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible' }`}>
                  <div className="max-h-64 overflow-y-auto">
                    <button onClick={() => handleCategorySelect('')} className={`w-full text-start block px-5 py-3.5 text-sm font-bold transition-colors border-s-4 font-heading uppercase tracking-wide cursor-pointer ${ !currentCategoryId ? 'bg-primary/5 text-primary border-primary' : 'text-gray-600 hover:bg-gray-50 border-transparent' }`}>
                      {t('header.all_categories')}
                    </button>
                    {displayCategories.map((cat) => (
                      <button key={cat._id} onClick={() => handleCategorySelect(cat._id)} className={`w-full text-start block px-5 py-3.5 text-sm font-bold transition-colors border-s-4 font-heading uppercase tracking-wide cursor-pointer ${ currentCategoryId === cat._id ? 'bg-primary/5 text-primary border-primary' : 'text-gray-600 hover:bg-gray-50 border-transparent' }`}>
                        {getDBText(cat.name)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="relative flex-1 h-full">
                <input type="text" placeholder={currentCategoryName ? `${ t('header.search_in') } ${ currentCategoryName }...` : t('header.search_placeholder')} value={keyword} onChange={handleSearchChange} className="w-full h-full bg-transparent text-sm font-medium text-dark ps-4 pe-10 focus:outline-none rounded-e-2xl text-start" />
                {keyword ? <button onClick={clearSearch} className="absolute inset-e-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors focus:outline-none p-1 cursor-pointer"><FaTimes /></button> : <FaSearch className="absolute inset-e-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 sm:gap-5 flex-1">
            <button onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} className="md:hidden text-gray-600 hover:text-primary transition-colors p-1 ms-auto focus:outline-none cursor-pointer">
              {isMobileSearchOpen ? <FaTimes className="text-xl" /> : <FaSearch className="text-xl" />}
            </button>

            <Link to="/cart" className={`text-gray-600 hover:text-primary transition-colors flex items-center gap-2 relative p-1 sm:p-0 whitespace-nowrap ${ isCartBumping ? 'animate-bump' : '' }`}>
              <div className="relative flex items-center">
                <FaShoppingBag className="text-xl sm:text-2xl" />
                {cartCount > 0 && <span className="absolute -top-2.5 -inset-e-2.5 bg-accent text-dark text-[10px] sm:text-[11px] font-heading font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">{cartCount > 99 ? '99+' : cartCount}</span>}
              </div>
              <span className="font-heading uppercase tracking-widest hidden lg:block ms-1 font-bold">{t('header.cart')}</span>
            </Link>

            {userInfo ? (
              <div className="relative hidden md:block" ref={userDropdownRef}>
                <button onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)} className="flex items-center gap-2 text-dark font-bold hover:text-primary transition-colors focus:outline-none py-1 whitespace-nowrap cursor-pointer">
                  <FaUserCircle className="text-2xl text-gray-400 transition-colors" />
                  <span className="truncate max-w-25 text-base font-heading uppercase tracking-wide">{userInfo.name.split(' ')[0]}</span>
                  <FaChevronDown className={`text-xs text-gray-400 transition-transform duration-300 ${ isUserDropdownOpen ? 'rotate-180 text-primary' : '' }`} />
                </button>
                <div className={`absolute z-50 inset-e-0 mt-3 w-56 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 transform origin-top-right rtl:origin-top-left ${ isUserDropdownOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible' }`}>
                  <div className="py-2 text-start">
                    <div className="px-4 py-3 border-b border-gray-50 mb-2 bg-gray-50/50 rounded-t-2xl">
                      <p className="text-sm font-bold text-dark truncate font-heading uppercase tracking-wide">{userInfo.name}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{userInfo.email}</p>
                    </div>
                    <Link to="/profile" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors"><FaUser className="text-gray-400 text-lg" /> {t('header.my_account')}</Link>
                    {userInfo.isAdmin && (
                      <>
                        <Link to="/admin/dashboard" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors"><FaUserCircle className="text-gray-400 text-lg" /> {t('header.admin_panel')}</Link>
                        <Link to="/admin/settings" onClick={() => setIsUserDropdownOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-primary transition-colors"><FaCog className="text-gray-400 text-lg" /> {t('header.settings')}</Link>
                      </>
                    )}
                    <div className="border-t border-gray-50 my-2"></div>
                    <button onClick={logoutHandler} className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 w-full text-start transition-colors focus:outline-none cursor-pointer"><FaSignOutAlt className="text-lg rtl:rotate-180" /> {t('header.logout')}</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Button to="/login" variant="ghost" size="sm" leftIcon={<FaUser />}>
                  {t('header.sign_in')}
                </Button>
                <Button to="/register" variant="secondary" size="sm" leftIcon={<FaUserPlus className="rtl:-scale-x-100" />}>
                  {t('header.sign_up')}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out absolute inset-s-0 inset-e-0 top-full bg-white border-b border-gray-100 shadow-md z-40 ${ isMobileSearchOpen ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0 border-transparent shadow-none' }`}>
          <form onSubmit={handleMobileSearchSubmit} className="p-3">
            <div className="flex w-full bg-gray-100/80 rounded-xl border border-gray-200 focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all h-12 relative">
              <div className="relative flex-1 h-full" ref={mobileCategoryRef}>
                <div className="absolute inset-s-3 top-1/2 transform -translate-y-1/2 text-gray-400"><FaSearch /></div>
                <input type="text" placeholder={t('header.search_placeholder')} value={keyword} onChange={handleSearchChange} className="w-full h-full bg-transparent text-sm font-medium text-dark ps-10 pe-10 focus:outline-none rounded-xl text-start" />
                {keyword && <button type="button" onClick={clearSearch} className="absolute inset-e-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none p-1 cursor-pointer"><FaTimes /></button>}
              </div>
            </div>
          </form>
        </div>
      </header>

      <div className={`fixed inset-0 bg-dark/60 backdrop-blur-sm z-[100] transition-opacity duration-300 ${ isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible' }`} onClick={() => setIsMobileMenuOpen(false)}></div>

      <div className={`fixed top-0 inset-s-0 h-full w-[80vw] max-w-sm bg-white z-[110] shadow-2xl transition-transform duration-300 ease-out transform flex flex-col ${ isMobileMenuOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full' }`}>
        <div className="bg-dark p-6 shrink-0 relative flex flex-col justify-end min-h-[140px]">
          <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 inset-e-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors focus:outline-none cursor-pointer"><FaTimes /></button>
          {userInfo ? (
            <div className="mt-2 text-start">
              <h2 className="text-white font-heading font-bold tracking-wide text-2xl">{userInfo.name}</h2>
              <p className="text-gray-400 text-sm mt-1">{userInfo.email}</p>
            </div>
          ) : (
            <div className="mt-2 text-start">
              <h2 className="text-white font-heading font-bold tracking-wide text-2xl">{t('header.welcome')}</h2>
              <div className="flex gap-3 mt-4">
                <Link to="/login" className="flex-1 bg-white text-dark text-center py-2 rounded-lg font-bold text-sm">{t('header.sign_in')}</Link>
                <Link to="/register" className="flex-1 bg-primary text-white text-center py-2 rounded-lg font-bold text-sm">{t('header.sign_up')}</Link>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FaTags /> {t('header.shop_categories')}</h3>
            <div className="space-y-1">
              <button onClick={() => handleCategorySelect('')} className={`w-full text-start px-4 py-3 rounded-xl font-heading font-bold tracking-wide uppercase transition-colors focus:outline-none cursor-pointer ${ !currentCategoryId ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50' }`}>{t('header.all_gear')}</button>
              {displayCategories.map((cat) => (
                <button key={cat._id} onClick={() => handleCategorySelect(cat._id)} className={`w-full text-start px-4 py-3 rounded-xl font-heading font-bold tracking-wide uppercase transition-colors focus:outline-none cursor-pointer ${ currentCategoryId === cat._id ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50' }`}>{getDBText(cat.name)}</button>
              ))}
            </div>
          </div>
          {userInfo && (
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FaCog /> {t('header.account')}</h3>
              <div className="space-y-1">
                <Link to="/profile" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-colors"><FaUser className="text-gray-400" /> {t('header.my_account')}</Link>
                {userInfo.isAdmin && <Link to="/admin/dashboard" className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-gray-50 font-bold transition-colors"><FaUserCircle className="text-primary" /> {t('header.admin_panel')}</Link>}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0 bg-gray-50 space-y-3">
          <div className="relative">
            <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="w-full flex items-center justify-between bg-white border border-gray-200 px-4 py-3 rounded-xl text-sm font-bold text-gray-600 hover:border-primary hover:text-primary transition-colors focus:outline-none shadow-sm cursor-pointer">
              <span className="flex items-center gap-2"><FaGlobe className="text-lg text-gray-400" /> {lang === 'en' ? 'English' : 'العربية'}</span>
              <FaChevronDown className={`text-xs transition-transform duration-300 ${ isLangMenuOpen ? 'rotate-180' : '' }`} />
            </button>
            <div className={`absolute bottom-full inset-s-0 mb-2 w-full bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden transition-all duration-300 origin-bottom-left rtl:origin-bottom-right ${ isLangMenuOpen ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible' }`}>
              <button onClick={() => { lang !== 'en' && changeLanguage('en'); setIsLangMenuOpen(false); }} className={`w-full text-start px-4 py-3 text-sm font-bold transition-colors focus:outline-none cursor-pointer ${ lang === 'en' ? 'bg-primary/10 text-primary border-s-4 border-primary' : 'text-gray-600 hover:bg-gray-50 border-s-4 border-transparent' }`}>English</button>
              <button onClick={() => { lang !== 'ar' && changeLanguage('ar'); setIsLangMenuOpen(false); }} className={`w-full text-start px-4 py-3 text-sm font-bold transition-colors focus:outline-none cursor-pointer ${ lang === 'ar' ? 'bg-primary/10 text-primary border-s-4 border-primary' : 'text-gray-600 hover:bg-gray-50 border-s-4 border-transparent' }`}>العربية</button>
            </div>
          </div>
          {userInfo && (
            <Button onClick={logoutHandler} variant="danger" size="md" fullWidth className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-500 hover:text-white" leftIcon={<FaSignOutAlt className="rtl:rotate-180" />}>
              {t('header.logout')}
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Header;