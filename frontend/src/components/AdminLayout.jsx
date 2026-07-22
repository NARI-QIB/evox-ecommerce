// filepath: frontend/src/components/AdminLayout.jsx
import { useState, useContext, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FaChartLine, FaBoxOpen, FaTags, FaShoppingCart, FaUsers, FaCog,
  FaChartPie, FaBars, FaTimes, FaSignOutAlt, FaStore, FaUser, FaUserCog
} from 'react-icons/fa';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { userInfo, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: globalSettings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/settings');
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const logoutHandler = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { name: t('adminLayout.overview'), path: '/admin/dashboard', icon: FaChartLine },
    { name: t('adminLayout.analytics'), path: '/admin/analytics', icon: FaChartPie },
    { name: t('adminLayout.products'), path: '/admin/products', icon: FaBoxOpen, matchPattern: '/admin/product' },
    { name: t('adminLayout.categories'), path: '/admin/categories', icon: FaTags },
    { name: t('adminLayout.orders'), path: '/admin/orders', icon: FaShoppingCart, matchPattern: '/admin/order' },
    { name: t('adminLayout.customers'), path: '/admin/users', icon: FaUsers, matchPattern: '/admin/user' },
    { name: t('adminLayout.settings'), path: '/admin/settings', icon: FaCog },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-dark/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 bg-dark text-white flex flex-col transition-transform duration-300 ease-in-out lg:static lg:flex-shrink-0 shadow-2xl lg:shadow-none lg:translate-x-0 lg:rtl:translate-x-0 ${ isSidebarOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
          }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-2 hover:scale-105 transition-transform">
            {globalSettings?.adminLogo ? (
              <div className="hover:scale-105 transition-transform shrink-0 flex items-center">
                <img
                  src={globalSettings.adminLogo}
                  alt="Evox Admin Logo"
                  className="h-10 sm:h-10 w-auto max-w-[120px] object-contain drop-shadow-lg"
                />
              </div>
            ) : (
              <span className="text-2xl font-black italic tracking-tighter text-white">
                EVO<span className="text-primary">X</span>
              </span>
            )}
            <span className="text-xs font-normal text-gray-400 not-italic tracking-normal border border-gray-700 px-2 py-0.5 rounded-md ms-1">ADMIN</span>
          </Link>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white focus:outline-none">
            <FaTimes className="text-xl" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 hide-scrollbar text-start">
          <p className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
            {t('adminLayout.management')}
          </p>

          {adminLinks.map((link) => {
            const isActive = location.pathname === link.path || (link.matchPattern && location.pathname.includes(link.matchPattern));

            return (
              <NavLink
                key={link.name}
                to={link.path}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-bold text-sm transition-all duration-300 group ${ isActive
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
              >
                <link.icon className={`text-lg transition-colors ${ isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary' }`} />
                {link.name}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800 shrink-0 space-y-2 text-start">
          <Link to="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-300">
            <FaUser className="text-lg text-gray-500" /> {t('adminLayout.my_profile')}
          </Link>
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-all duration-300">
            <FaStore className="text-lg text-gray-500" /> {t('adminLayout.view_store')}
          </Link>
          <button onClick={logoutHandler} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm text-red-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 text-start focus:outline-none">
            <FaSignOutAlt className="text-lg rtl:rotate-180" /> {t('adminLayout.logout')}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">

        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-primary focus:outline-none p-2 -ms-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaBars className="text-xl" />
            </button>
            <div className="hidden sm:flex flex-col text-start">
              <span className="text-sm font-black text-dark tracking-tight">{t('adminLayout.admin_portal')}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('adminLayout.workspace')}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-3 ps-4 border-s border-gray-100 hover:opacity-80 transition-opacity cursor-pointer group">
              <div className="flex flex-col text-end">
                <span className="text-sm font-bold text-dark leading-tight group-hover:text-primary transition-colors">{userInfo?.name}</span>
                <span className="text-[10px] font-bold text-primary uppercase">{t('adminLayout.administrator')}</span>
              </div>
              <FaUserCog className="text-3xl text-gray-300 group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

      </div>
    </div>
  );
};

export default AdminLayout;