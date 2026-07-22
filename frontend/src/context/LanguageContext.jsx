import { createContext, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
      const { i18n } = useTranslation();
      // التأكد من استخلاص رمز اللغة الأساسي (مثلاً ar بدلاً من ar-EG)
      const lang = (i18n.language || 'en').startsWith('ar') ? 'ar' : 'en';

      useEffect(() => {
            // 🌟 تحديث اتجاه الصفحة ولغتها مركزياً على مستوى הـ DOM
            const dir = lang === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = lang;
            document.documentElement.dir = dir;

            // حفظ التفضيل لمنع الوميض (Flicker) في التحميل القادم
            localStorage.setItem('i18nextLng', lang);
      }, [lang]);

      const toggleLanguage = () => {
            const newLang = lang === 'en' ? 'ar' : 'en';
            i18n.changeLanguage(newLang);
      };

      const changeLanguage = (newLang) => {
            if (newLang === 'en' || newLang === 'ar') {
                  i18n.changeLanguage(newLang);
            }
      };

      // 🌟 دالة مخصصة حصرياً لكائنات قاعدة البيانات الديناميكية (التي لا توجد في JSON)
      const getDBText = (obj, fallback = '') => {
            if (!obj) return fallback;
            if (typeof obj === 'string') return obj;
            return obj[lang] || obj.en || fallback;
      };

      return (
            <LanguageContext.Provider value={{ lang, toggleLanguage, changeLanguage, getDBText }}>
                  {children}
            </LanguageContext.Provider>
      );
};

export const useLanguage = () => useContext(LanguageContext);