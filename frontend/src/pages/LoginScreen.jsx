// filepath: frontend/src/pages/LoginScreen.jsx
import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { FaExclamationCircle, FaCheckCircle, FaArrowRight, FaEye, FaEyeSlash, FaShoppingBag } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../components/ui/Button';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [toast, setToast] = useState({ show: false, msg: '', type: 'error' });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLoginAuth } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang } = useLanguage();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  const { data: settings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/settings');
      return data;
    },
    staleTime: Infinity,
  });

  const banner = settings?.loginBanner || '/images/mazraoui.jpg';

  const showToast = (msg, type = 'error') => {
    setToast({ show: true, msg, type });
    if (type === 'error') {
      setTimeout(() => setToast({ show: false, msg: '', type: 'error' }), 4000);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setToast({ show: false, msg: '', type: 'error' });
    setIsLoading(true);

    const res = await login(email, password);
    if (res.success) {
      showToast(lang === 'ar' ? 'تم تسجيل الدخول بنجاح! جاري التوجيه...' : 'Login successful! Redirecting...', 'success');
      setTimeout(() => navigate(redirect), 1200);
    } else {
      showToast(res.error, 'error');
      setIsLoading(false);
    }
  };

  const googleSuccessHandler = async (credentialResponse) => {
    setToast({ show: false, msg: '', type: 'error' });
    setIsLoading(true);

    const res = await googleLoginAuth(credentialResponse.credential);
    if (res.success) {
      showToast(lang === 'ar' ? 'تم الدخول عبر Google بنجاح!' : 'Google Login successful!', 'success');
      setTimeout(() => navigate(redirect), 1200);
    } else {
      showToast(res.error, 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex rounded-3xl overflow-hidden shadow-2xl bg-linear-to-br from-white to-gray-50 border border-gray-100 my-8 relative">

      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`absolute top-6 inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 font-bold text-sm w-[90%] max-w-sm ${ toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white' }`}
          >
            {toast.type === 'error' ? <FaExclamationCircle className="text-lg shrink-0" /> : <FaCheckCircle className="text-lg shrink-0" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden lg:flex w-1/2 relative bg-dark items-center justify-center overflow-hidden group">
        <img src={banner} alt="Evox Athlete" className="absolute inset-0 w-full h-full object-cover object-center scale-105 grayscale opacity-70 group-hover:grayscale-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1500 ease-out" />
        <div className="absolute inset-0 bg-dark/60 group-hover:bg-dark/40 transition-colors duration-1500"></div>
        <div className="relative z-10 p-12 text-center text-white w-full transform group-hover:-translate-y-2 transition-transform duration-1500 ease-out">
          <h2 className="text-6xl font-heading font-black italic tracking-tighter mb-4 drop-shadow-2xl">EVO<span className="text-primary">X</span></h2>
          <p className="text-lg text-gray-200 font-medium tracking-wide drop-shadow-md">Push your limits. Redefine your boundaries.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 py-12 pt-20">
        <div className="w-full max-w-[384px] mx-auto">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-heading font-extrabold text-dark tracking-wide mb-3 uppercase">{t('auth.welcome_back')}</h1>
            <p className="text-gray-500 font-medium">{t('auth.enter_details')}</p>
          </div>

          <form onSubmit={submitHandler} className="space-y-5 w-full">
            <div className="relative group">
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block px-3 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary peer transition-all shadow-sm hover:shadow-md text-start" placeholder=" " dir="ltr" />
              <label htmlFor="email" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary">{t('auth.email')}</label>
            </div>

            <div className="relative group">
              <input type={showPassword ? 'text' : 'password'} id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="block px-3 pe-10 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary peer transition-all shadow-sm hover:shadow-md text-start" placeholder=" " dir="ltr" />
              <label htmlFor="password" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary">{t('auth.password')}</label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-e-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none">{showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}</button>
            </div>

            <div className="flex justify-end pt-1"><Link to="/forgot-password" className="text-sm font-bold text-primary hover:text-dark hover:underline transition-colors">{t('auth.forgot_password')}</Link></div>

            <Button
              type="submit"
              disabled={toast.type === 'success'}
              isLoading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className={`group mt-2 ${ toast.type === 'success' ? '!bg-green-500 !shadow-none' : '' }`}
              leftIcon={toast.type === 'success' && <FaCheckCircle className="text-xl" />}
              rightIcon={!isLoading && toast.type !== 'success' && <FaArrowRight className="translate-x-0 opacity-80 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 group-hover:opacity-100 transition-all" />}
            >
              {toast.type === 'success' ? (lang === 'ar' ? 'تم الدخول' : 'Success') : t('auth.sign_in')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm font-semibold text-gray-600">{t('auth.no_account')} <Link to={redirect !== '/' ? `/register?redirect=${ redirect }` : '/register'} className="text-primary font-bold hover:text-dark hover:underline transition-colors">{t('auth.create_account')}</Link></div>
          <div className="flex items-center my-6"><div className="flex-1 border-t border-gray-200"></div><span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('auth.or')}</span><div className="flex-1 border-t border-gray-200"></div></div>

          <div className="mb-6 w-full flex justify-center hover:scale-[1.02] transition-transform duration-300" dir="ltr">
            <GoogleLogin onSuccess={googleSuccessHandler} onError={() => showToast(t('auth.google_signin_failed'))} shape="rectangular" theme="outline" size="large" locale="en" width="384" text="signin_with" />
          </div>

          <div className="mt-2 w-full">
            <Button
              onClick={() => navigate(redirect !== '/' ? redirect : '/shipping')}
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              className="group uppercase"
              leftIcon={<FaShoppingBag className="text-gray-400 group-hover:text-primary transition-colors text-lg" />}
              rightIcon={<FaArrowRight className="opacity-0 -translate-x-2 rtl:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 rtl:group-hover:translate-x-0 transition-all text-xs text-gray-500 rtl:rotate-180" />}
            >
              {t('auth.guest_checkout')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;