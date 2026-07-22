import { Suspense, lazy, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

import Header from './components/Header';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';

// تحميل الصفحات ديناميكياً لزيادة سرعة الأداء (Lazy Loading)
const HomeScreen = lazy(() => import('./pages/HomeScreen'));
const ProductScreen = lazy(() => import('./pages/ProductScreen'));
const CategoryScreen = lazy(() => import('./pages/CategoryScreen'));
const SearchScreen = lazy(() => import('./pages/SearchScreen'));
const CartScreen = lazy(() => import('./pages/CartScreen'));

const LoginScreen = lazy(() => import('./pages/LoginScreen'));
const RegisterScreen = lazy(() => import('./pages/RegisterScreen'));
const ForgotPasswordScreen = lazy(() => import('./pages/ForgotPasswordScreen'));
const ResetPasswordScreen = lazy(() => import('./pages/ResetPasswordScreen'));
const OtpScreen = lazy(() => import('./pages/OtpScreen'));

const ProfileScreen = lazy(() => import('./pages/ProfileScreen'));
const ShippingScreen = lazy(() => import('./pages/ShippingScreen'));
const PaymentScreen = lazy(() => import('./pages/PaymentScreen'));
const PlaceOrderScreen = lazy(() => import('./pages/PlaceOrderScreen'));
const UserOrderDetailsScreen = lazy(() => import('./pages/UserOrderDetailsScreen'));

// الصفحات التعريفية والثابتة
const AboutScreen = lazy(() => import('./pages/AboutScreen'));
const FAQScreen = lazy(() => import('./pages/FAQScreen'));
const ContactScreen = lazy(() => import('./pages/ContactScreen'));
const PrivacyScreen = lazy(() => import('./pages/PrivacyScreen'));
const TermsScreen = lazy(() => import('./pages/TermsScreen'));
const NotFoundScreen = lazy(() => import('./pages/NotFoundScreen'));

// صفحات الإدارة
const AdminLayout = lazy(() => import('./components/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProductsScreen = lazy(() => import('./pages/admin/AdminProductsScreen'));
const AdminCategoriesScreen = lazy(() => import('./pages/admin/AdminCategoriesScreen'));
const ProductEditScreen = lazy(() => import('./pages/admin/ProductEditScreen'));
const AdminOrderDetailsScreen = lazy(() => import('./pages/admin/AdminOrderDetailsScreen'));
const AdminOrdersScreen = lazy(() => import('./pages/admin/AdminOrdersScreen'));
const AdminUsersScreen = lazy(() => import('./pages/admin/AdminUsersScreen'));
const AdminUserEditScreen = lazy(() => import('./pages/admin/AdminUserEditScreen'));
const AdminAnalyticsScreen = lazy(() => import('./pages/admin/AdminAnalyticsScreen'));
const AdminSettingsScreen = lazy(() => import('./pages/admin/AdminSettingsScreen'));

const Loader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase animate-pulse">
          {t('app.loading', 'Loading...')}
        </p>
      </div>
    </div>
  );
};

// 🌟 حارس مسارات المستخدمين المسجلين
const ProtectedRoute = ({ children }) => {
  const { userInfo } = useContext(AuthContext);
  if (!userInfo) return <Navigate to="/login" replace />;
  return children;
};

// 🌟 حارس مسارات المدراء (الـ Guard المركزي)
const AdminRoute = ({ children }) => {
  const { userInfo } = useContext(AuthContext);
  if (!userInfo) return <Navigate to="/login" replace />;
  if (!userInfo.isAdmin) return <Navigate to="/" replace />;
  return children;
};

// 🌟 الـ Layout العام للمتجر (يسمح بالتمدد الحر)
const PublicLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-light relative">
      <Header />
      {/* 🌟 تم استبدال flex-grow بـ grow لتوافق أفضل مع Tailwind v4.0 */}
      <main className="grow w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="h-full"
          >
            <Suspense fallback={<Loader />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
};

// 🌟 Layout فرعي مخصص لصفحات الدخول والمصادقة لمنع التمدد المفرط
const AuthLayout = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Outlet />
    </div>
  );
};

function App() {
  const [csrfReady, setCsrfReady] = useState(false);
  const { t, i18n } = useTranslation();

  // 🌟 التزامن الشامل لاتجاه الصفحة ولغتها مع محرك الترجمة
  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);

  // 🌟 تهيئة جلسة الحماية CSRF قبل تشغيل التطبيق
  useEffect(() => {
    const initCsrf = async () => {
      try {
        const { data } = await axios.get('/api/csrf-token');
        axios.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;
      } catch (error) {
        console.warn("CSRF Initialization handled gracefully");
      } finally {
        setCsrfReady(true);
      }
    };
    initCsrf();
  }, []);

  if (!csrfReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary"></div>
          <p className="text-gray-400 font-bold tracking-widest uppercase animate-pulse">
            {t('app.initializing', 'Initializing Secure Session...')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route element={<PublicLayout />}>
          {/* مسارات التسوق */}
          <Route path="/" element={<HomeScreen />} />
          <Route path="/product/:id" element={<ProductScreen />} />
          <Route path="/category/:id" element={<CategoryScreen />} />
          <Route path="/search" element={<SearchScreen />} />
          <Route path="/cart" element={<CartScreen />} />

          {/* مسارات الدفع والطلبات */}
          <Route path="/shipping" element={<ShippingScreen />} />
          <Route path="/payment" element={<PaymentScreen />} />
          <Route path="/placeorder" element={<PlaceOrderScreen />} />
          <Route path="/order/:id" element={<UserOrderDetailsScreen />} />

          {/* مسارات المستخدم المحمية */}
          <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
          <Route path="/profile/order/:id" element={<ProtectedRoute><UserOrderDetailsScreen /></ProtectedRoute>} />

          {/* مسارات معلومات المتجر */}
          <Route path="/about" element={<AboutScreen />} />
          <Route path="/faq" element={<FAQScreen />} />
          <Route path="/contact" element={<ContactScreen />} />
          <Route path="/privacy" element={<PrivacyScreen />} />
          <Route path="/terms" element={<TermsScreen />} />

          {/* مسار الـ 404 المتأخر للالتقاط */}
          <Route path="*" element={<NotFoundScreen />} />

          {/* مسارات المصادقة والتسجيل داخل تخطيط محدود الحجم */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/verify-otp" element={<OtpScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/reset-password" element={<ResetPasswordScreen />} />
          </Route>
        </Route>

        {/* مسارات لوحة التحكم المحمية والمنفصلة تماماً عن PublicLayout */}
        <Route path="/admin" element={<AdminRoute><Suspense fallback={<Loader />}><AdminLayout /></Suspense></AdminRoute>}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="analytics" element={<AdminAnalyticsScreen />} />
          <Route path="products" element={<AdminProductsScreen />} />
          <Route path="categories" element={<AdminCategoriesScreen />} />
          <Route path="product/:id/edit" element={<ProductEditScreen />} />
          <Route path="order/:id" element={<AdminOrderDetailsScreen />} />
          <Route path="orders" element={<AdminOrdersScreen />} />
          <Route path="users" element={<AdminUsersScreen />} />
          <Route path="user/:id/edit" element={<AdminUserEditScreen />} />
          <Route path="settings" element={<AdminSettingsScreen />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;