// filepath: frontend/src/pages/NotFoundScreen.jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { FaHome, FaSearch, FaSignInAlt, FaExclamationTriangle } from 'react-icons/fa';
import Button from '../components/ui/Button';

const NotFoundScreen = () => {
  const { t } = useTranslation(); // 🌟 تم تصحيح هذا السطر
  const { lang } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center px-4 py-12 animate-fade-in-up">

      <div className="relative mb-8 flex justify-center items-center">
        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full w-full h-full"></div>

        <h1 className="relative text-[120px] md:text-[180px] font-heading font-black text-transparent bg-clip-text bg-gradient-to-br from-dark via-primary to-dark drop-shadow-xl leading-none select-none" dir="ltr">
          404
        </h1>

        <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-5 py-2.5 rounded-xl shadow-2xl border-2 border-gray-100 flex items-center gap-2 transform rotate-12 hover:rotate-0 transition-transform duration-300">
          <FaExclamationTriangle className="text-red-500 text-xl animate-pulse" />
          <span className="font-black text-dark text-sm md:text-base uppercase tracking-widest">
            {lang === 'ar' ? 'تسلل!' : 'Offside!'}
          </span>
        </div>
      </div>

      <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-dark uppercase tracking-tight mb-4">
        {t('notFound.title', 'Out of Bounds!')}
      </h2>

      <p className="text-gray-500 max-w-lg font-medium text-lg mb-10 leading-relaxed">
        {t('notFound.desc', "Oops! Looks like you have strayed off the field. The page you are looking for doesn't exist or has been moved.")}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-lg mx-auto">
        <Button to="/" variant="outline" size="lg" className="w-full sm:flex-1" leftIcon={<FaHome />}>
          {t('home.back_to_home', 'Back to Home')}
        </Button>

        <Button to="/search" variant="primary" size="lg" className="w-full sm:flex-1" leftIcon={<FaSearch />}>
          {t('header.all_gear', 'Shop Gear')}
        </Button>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200/60 w-full max-w-md">
        <p className="text-sm font-medium text-gray-500 flex items-center justify-center gap-2">
          {t('auth.already_have_account', 'Already have an account?')}
          <Link to="/login" className="text-primary font-bold hover:text-dark hover:underline transition-colors flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-lg">
            {t('header.sign_in', 'Sign In')} <FaSignInAlt className="rtl:-scale-x-100" />
          </Link>
        </p>
      </div>

    </div>
  );
};

export default NotFoundScreen;