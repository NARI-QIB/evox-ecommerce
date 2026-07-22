// filepath: frontend/src/pages/ProfileScreen.jsx
import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  FaUserEdit, FaBoxOpen, FaHeart, FaMapMarkerAlt, FaSignOutAlt,
  FaChevronRight, FaMedal, FaShoppingBag, FaCheckCircle, FaArrowsAltH
} from 'react-icons/fa';
import Breadcrumb from '../components/Breadcrumb';

import ProfileDetails from '../components/profile/ProfileDetails';
import UserOrders from '../components/profile/UserOrders';
import UserWishlist from '../components/profile/UserWishlist';
import UserAddresses from '../components/profile/UserAddresses';

const ProfileScreen = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'profile');
  const { userInfo, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!userInfo) navigate('/login');
  }, [userInfo, navigate]);

  useEffect(() => {
    if (tabParam && ['profile', 'orders', 'wishlist', 'addresses'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    navigate(`/profile?tab=${ tabId }`, { replace: true });
  };

  const { data: orders = [] } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.get('/api/orders/mine', config);
      return data;
    },
    enabled: !!userInfo,
    staleTime: 5 * 60 * 1000,
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.get('/api/users/profile/wishlist', config);
      return data;
    },
    enabled: !!userInfo,
    staleTime: 5 * 60 * 1000,
  });

  const stats = { orders: orders.length, saved: wishlist.length };

  const getTier = () => {
    const orderCount = stats.orders;
    if (orderCount === 0) return { label: t('profile.tiers.rookie'), color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', iconColor: 'text-gray-500' };
    if (orderCount <= 3) return { label: t('profile.tiers.bronze'), color: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-200', iconColor: 'text-amber-600' };
    if (orderCount <= 7) return { label: t('profile.tiers.silver'), color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200', iconColor: 'text-slate-500' };
    return { label: t('profile.tiers.gold'), color: 'text-yellow-800', bg: 'bg-yellow-100', border: 'border-yellow-200', iconColor: 'text-yellow-500' };
  };

  const tier = getTier();

  const logoutHandler = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { id: 'profile', label: t('profile.tabs.account_info'), icon: FaUserEdit },
    { id: 'orders', label: t('profile.tabs.my_orders'), icon: FaBoxOpen },
    { id: 'wishlist', label: t('profile.tabs.wishlist'), icon: FaHeart },
    { id: 'addresses', label: t('profile.tabs.address_book'), icon: FaMapMarkerAlt },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return <ProfileDetails />;
      case 'orders': return <UserOrders />;
      case 'wishlist': return <UserWishlist />;
      case 'addresses': return <UserAddresses />;
      default: return <ProfileDetails />;
    }
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return t('profile.good_morning');
    if (currentHour < 18) return t('profile.good_afternoon');
    return t('profile.good_evening');
  };

  const joinYear = userInfo?.createdAt ? new Date(userInfo.createdAt).getFullYear() : new Date().getFullYear();

  return (
    <div className="min-h-[85vh] py-4 md:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <Breadcrumb steps={[{ label: t('profile.my_account'), icon: FaUserEdit }]} />

      <div className="mb-6 md:mb-10 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group transition-all duration-500">
        <div className="absolute top-0 inset-e-0 w-96 h-96 bg-primary/5 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/3 rtl:-translate-x-1/3 group-hover:bg-primary/10 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 inset-s-10 w-72 h-72 bg-blue-100/40 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4 rtl:translate-x-1/4"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between p-6 md:p-10">
          <div className="flex flex-col items-center md:items-start text-center md:text-start w-full md:w-auto">
            <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-100 mb-4 shadow-sm">
              <FaCheckCircle className="text-green-500" /> {t('profile.verified_account')}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold text-dark tracking-tight mb-3">
              {getGreeting()}، <span className="text-primary">{userInfo?.name?.split(' ')[0]}</span>
            </h1>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-bold border ${ tier.bg } ${ tier.color } ${ tier.border } shadow-sm transition-all duration-500`}>
                <FaMedal className={`text-lg ${ tier.iconColor }`} /> {tier.label}
              </span>
              <span className="text-gray-400 text-sm font-medium">{t('profile.joined')} {joinYear}</span>
            </div>
          </div>

          <div className="flex w-full md:w-auto justify-center md:justify-end gap-3 sm:gap-4 self-center mt-6 md:mt-0 border-t border-gray-100 md:border-0 pt-6 md:pt-0">
            <button onClick={() => handleTabChange('orders')} className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm p-4 rounded-2xl text-center flex-1 md:flex-none md:min-w-30 transform hover:-translate-y-1 hover:shadow-md hover:border-primary/30 transition-all duration-300 focus:outline-none">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-2"><FaShoppingBag className="text-primary text-xl" /></div>
              <div className="font-black text-2xl text-dark">{stats.orders}</div>
              <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{t('profile.orders')}</div>
            </button>

            <button onClick={() => handleTabChange('wishlist')} className="bg-white/80 backdrop-blur-md border border-gray-100 shadow-sm p-4 rounded-2xl text-center flex-1 md:flex-none md:min-w-30 transform hover:-translate-y-1 hover:shadow-md hover:border-red-200 transition-all duration-300 focus:outline-none">
              <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2"><FaHeart className="text-red-500 text-xl" /></div>
              <div className="font-black text-2xl text-dark">{stats.saved}</div>
              <div className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1">{t('profile.saved')}</div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
        <div className="w-full lg:w-1/4">
          <div className="flex items-center justify-end gap-1.5 mb-2 px-2 text-xs font-bold text-gray-400 lg:hidden animate-pulse">
            {t('profile.swipe')} <FaArrowsAltH className="text-primary" />
          </div>

          <div className="bg-white lg:rounded-3xl lg:p-4 lg:shadow-sm lg:border lg:border-gray-100 lg:sticky lg:top-24 relative overflow-hidden lg:overflow-visible">
            <div className="absolute inset-e-0 top-0 bottom-0 w-12 bg-linear-to-l rtl:bg-linear-to-r from-white to-transparent pointer-events-none lg:hidden z-10"></div>

            <nav className="flex flex-row lg:flex-col gap-2 lg:gap-1 overflow-x-auto pb-2 lg:pb-0 [&::-webkit-scrollbar]:hidden snap-x px-2 lg:px-0 relative">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button key={item.id} onClick={() => handleTabChange(item.id)} className={`relative shrink-0 flex items-center justify-between px-5 py-3.5 lg:w-full lg:p-4 rounded-2xl font-bold transition-all duration-300 snap-start overflow-hidden group ${ isActive ? 'bg-blue-50 text-primary shadow-sm' : 'text-gray-400 bg-gray-50/50 lg:bg-transparent hover:bg-gray-50 hover:text-dark' }`}>
                    {isActive && <span className="absolute inset-s-0 top-0 bottom-0 w-1.5 bg-primary rounded-e-full"></span>}
                    <div className="flex items-center gap-3"><Icon className={`text-xl transition-transform duration-300 ${ isActive ? 'scale-110' : 'group-hover:scale-110' }`} /><span className="whitespace-nowrap">{item.label}</span></div>
                    {isActive && <FaChevronRight className="hidden lg:block text-primary/50 text-sm rtl:rotate-180" />}
                  </button>
                );
              })}
              <div className="hidden lg:block my-4 border-t border-gray-100"></div>
              <button onClick={logoutHandler} className="shrink-0 flex items-center gap-3 px-5 py-3.5 me-6 lg:me-0 lg:w-full lg:p-4 rounded-2xl font-bold text-red-400 bg-red-50/30 lg:bg-transparent hover:bg-red-50 hover:text-red-600 transition-all duration-300 snap-start group">
                <FaSignOutAlt className="text-xl group-hover:scale-110 transition-transform duration-300 rtl:rotate-180" />
                <span className="whitespace-nowrap">{t('profile.log_out')}</span>
              </button>
            </nav>
          </div>
        </div>

        <div className="w-full lg:w-3/4">
          <div key={activeTab} className="animate-fade-in-up">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;