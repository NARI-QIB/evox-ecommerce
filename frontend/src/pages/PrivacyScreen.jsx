// filepath: frontend/src/pages/PrivacyScreen.jsx
import { useTranslation } from 'react-i18next';
import { FaShieldAlt, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/ui/Button';

const PrivacyScreen = () => {
  const { t } = useTranslation();
  const { lang } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in-up">
      <div className="text-center mb-12">
        <FaShieldAlt className="text-6xl text-primary mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold text-dark mb-4">{t('privacy.title')}</h1>
        <p className="text-gray-500 font-medium">{t('privacy.last_updated')} {new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</p>
      </div>

      <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-gray-100 prose prose-lg prose-blue max-w-none text-gray-600 leading-relaxed text-start">
        <h2 className="text-2xl font-bold text-dark mt-8 mb-4">{t('privacy.section1_title')}</h2>
        <p>{t('privacy.section1_desc')}</p>

        <h2 className="text-2xl font-bold text-dark mt-8 mb-4">{t('privacy.section2_title')}</h2>
        <p>{t('privacy.section2_desc')}</p>

        <h2 className="text-2xl font-bold text-dark mt-8 mb-4">{t('privacy.section3_title')}</h2>
        <p>{t('privacy.section3_desc')}</p>
      </div>

      <div className="mt-8 text-center flex justify-center">
        <Button to="/" variant="ghost" size="md" leftIcon={lang === 'ar' ? <FaArrowRight /> : <FaArrowLeft />}>
          {t('privacy.back')}
        </Button>
      </div>
    </div>
  );
};

export default PrivacyScreen;