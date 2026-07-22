// filepath: frontend/src/pages/admin/AdminSettingsScreen.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import {
  FaCog, FaImage, FaUpload, FaSave,
  FaCheckCircle, FaHeading, FaChartLine, FaUserShield, FaExclamationCircle, FaSpinner
} from 'react-icons/fa';

const AdminSettingsScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const [storeLogo, setStoreLogo] = useState('');
  const [adminLogo, setAdminLogo] = useState(''); // 🌟 حالة شعار الإدارة
  const [heroTitleEn, setHeroTitleEn] = useState('');
  const [heroTitleAr, setHeroTitleAr] = useState('');
  const [heroSubtitleEn, setHeroSubtitleEn] = useState('');
  const [heroSubtitleAr, setHeroSubtitleAr] = useState('');
  const [heroBannerDesktop, setHeroBannerDesktop] = useState('');
  const [heroBannerMobile, setHeroBannerMobile] = useState('');
  const [loginBanner, setLoginBanner] = useState('');
  const [registerBanner, setRegisterBanner] = useState('');

  const { data: settings, isLoading, isError, error } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/settings');
      return data;
    },
    enabled: !!userInfo?.isAdmin,
  });

  useEffect(() => {
    if (settings) {
      setStoreLogo(settings.storeLogo || '');
      setAdminLogo(settings.adminLogo || ''); // 🌟 جلب شعار الإدارة
      setHeroTitleEn(settings.heroTitle?.en || '');
      setHeroTitleAr(settings.heroTitle?.ar || '');
      setHeroSubtitleEn(settings.heroSubtitle?.en || '');
      setHeroSubtitleAr(settings.heroSubtitle?.ar || '');
      setHeroBannerDesktop(settings.heroBannerDesktop || '');
      setHeroBannerMobile(settings.heroBannerMobile || '');
      setLoginBanner(settings.loginBanner || '');
      setRegisterBanner(settings.registerBanner || '');
    }
  }, [settings]);

  const uploadFileHandler = async (e, setImageState) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'settings');

    setUploadingImage(true);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.post('/api/upload/single', formData, config);
      let finalPath = data.image || (data.images && data.images[0]);

      if (finalPath) {
        if (!finalPath.startsWith('http')) {
          finalPath = finalPath.replace(/\\/g, '/');
          if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;
        }
        setImageState(finalPath);
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');

    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const payload = {
        storeLogo,
        adminLogo, // 🌟 إرسال شعار الإدارة
        heroTitle: { en: heroTitleEn, ar: heroTitleAr },
        heroSubtitle: { en: heroSubtitleEn, ar: heroSubtitleAr },
        heroBannerDesktop, heroBannerMobile, loginBanner, registerBanner
      };
      await axios.put('/api/settings', payload, config);

      queryClient.invalidateQueries({ queryKey: ['adminSettings'] });
      queryClient.invalidateQueries({ queryKey: ['homeData'] });
      queryClient.invalidateQueries({ queryKey: ['globalSettings'] });

      setSuccessMessage(t('adminSettings.settings_updated') || 'Settings Updated Successfully');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 max-w-4xl mx-auto px-4">
        <div className="p-4 bg-red-50 border-s-4 border-red-500 flex items-center gap-3">
          <FaExclamationCircle className="text-red-500" />
          <span className="text-red-700 font-bold">{error.message}</span>
        </div>
      </div>
    );
  }

  const inputStyle = "block px-4 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer transition-all shadow-sm";
  const labelStyle = "absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary pointer-events-none";

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb steps={[
          { label: t('header.admin_panel'), url: '/admin/dashboard', icon: FaChartLine },
          { label: t('adminSettings.title'), icon: FaCog }
        ]} />

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark flex items-center gap-3">
              <FaCog className="text-primary" /> {t('adminSettings.title')}
            </h1>
            <p className="text-gray-500 font-medium mt-1">{t('adminSettings.desc')}</p>
          </div>
          <Button onClick={submitHandler} disabled={uploadingImage} isLoading={isSaving} variant="primary" size="md" className="w-full sm:w-auto" leftIcon={!isSaving && <FaSave />}>
            {t('adminSettings.save_settings') || 'Save Settings'}
          </Button>
        </div>

        {successMessage && (
          <div className="mb-8 p-4 bg-green-50 border-s-4 border-green-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up shadow-sm">
            <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
            <span className="text-green-700 font-bold">{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <form onSubmit={submitHandler} className="p-8 space-y-10">

              {/* 🌟 قسم الهوية والشعارات */}
              <div>
                <h2 className="text-xl font-bold text-dark flex items-center gap-2 mb-6 border-b border-gray-100 pb-3 text-start">
                  <FaImage className="text-primary" /> {t('adminSettings.store_branding') || 'شعارات المتجر'}
                </h2>
                <div className="space-y-6">
                  {/* شعار المتجر العام */}
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    {storeLogo && (
                      <div className="w-20 h-20 bg-white border border-gray-200 rounded-xl p-2 flex items-center justify-center shrink-0">
                        <img src={storeLogo} alt="Store Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div className="relative group flex-1 self-center">
                      <input type="text" id="storeLogo" value={storeLogo} onChange={(e) => setStoreLogo(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                      <label htmlFor="storeLogo" className={labelStyle}>{t('adminSettings.store_logo') || 'شعار المتجر الأساسي (Header)'}</label>
                    </div>
                    <label className="flex items-center justify-center px-6 py-2 bg-white border-2 border-dashed border-gray-300 rounded-xl font-bold hover:bg-primary/5 hover:border-primary hover:text-primary cursor-pointer transition-all self-center">
                      <FaUpload className="me-2" /> {t('adminSettings.browse')}
                      <input type="file" onChange={(e) => uploadFileHandler(e, setStoreLogo)} className="hidden" accept="image/*" />
                    </label>
                  </div>

                  {/* شعار لوحة التحكم */}
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch p-5 bg-gray-800 rounded-2xl border border-gray-700">
                    {adminLogo && (
                      <div className="w-20 h-20 bg-dark border border-gray-600 rounded-xl p-2 flex items-center justify-center shrink-0">
                        <img src={adminLogo} alt="Admin Logo" className="max-w-full max-h-full object-contain" />
                      </div>
                    )}
                    <div className="relative group flex-1 self-center">
                      <input type="text" id="adminLogo" value={adminLogo} onChange={(e) => setAdminLogo(e.target.value)} className={`block px-4 pb-2.5 pt-6 w-full text-sm text-white bg-gray-700 rounded-xl border-2 border-gray-600 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer transition-all shadow-sm text-start`} placeholder=" " dir="ltr" />
                      <label htmlFor="adminLogo" className={`absolute text-sm text-gray-300 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-gray-700 px-1 peer-focus:text-primary pointer-events-none`}>{t('adminSettings.admin_logo') || 'شعار لوحة التحكم (Sidebar)'}</label>
                    </div>
                    <label className="flex items-center justify-center px-6 py-2 bg-gray-700 border-2 border-dashed border-gray-500 rounded-xl font-bold text-white hover:bg-gray-600 hover:border-primary hover:text-primary cursor-pointer transition-all self-center">
                      <FaUpload className="me-2" /> {t('adminSettings.browse')}
                      <input type="file" onChange={(e) => uploadFileHandler(e, setAdminLogo)} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-dark flex items-center gap-2 mb-6 border-b border-gray-100 pb-3 text-start">
                  <FaHeading className="text-primary" /> {t('adminSettings.hero_texts')}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="relative group">
                    <input type="text" id="heroTitleEn" value={heroTitleEn} onChange={(e) => setHeroTitleEn(e.target.value)} required className={inputStyle} placeholder=" " dir="ltr" />
                    <label htmlFor="heroTitleEn" className={labelStyle}>{t('adminSettings.hero_title_en')}</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="heroTitleAr" value={heroTitleAr} onChange={(e) => setHeroTitleAr(e.target.value)} className={`${ inputStyle } text-end`} placeholder=" " dir="rtl" />
                    <label htmlFor="heroTitleAr" className={labelStyle}>{t('adminSettings.hero_title_ar')}</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <input type="text" id="heroSubtitleEn" value={heroSubtitleEn} onChange={(e) => setHeroSubtitleEn(e.target.value)} required className={inputStyle} placeholder=" " dir="ltr" />
                    <label htmlFor="heroSubtitleEn" className={labelStyle}>{t('adminSettings.hero_subtitle_en')}</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="heroSubtitleAr" value={heroSubtitleAr} onChange={(e) => setHeroSubtitleAr(e.target.value)} className={`${ inputStyle } text-end`} placeholder=" " dir="rtl" />
                    <label htmlFor="heroSubtitleAr" className={labelStyle}>{t('adminSettings.hero_subtitle_ar')}</label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-dark flex items-center gap-2 mb-6 border-b border-gray-100 pb-3 text-start"><FaImage className="text-primary" /> {t('adminSettings.homepage_banners')}</h2>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="relative group flex-1">
                      <input type="text" id="heroBannerDesktop" value={heroBannerDesktop} onChange={(e) => setHeroBannerDesktop(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                      <label htmlFor="heroBannerDesktop" className={labelStyle}>{t('adminSettings.desktop_banner')}</label>
                    </div>
                    <label className="flex items-center justify-center px-6 py-2 bg-white border-2 border-dashed border-gray-300 rounded-xl font-bold hover:bg-primary/5 hover:border-primary hover:text-primary cursor-pointer transition-all">
                      <FaUpload className="me-2" /> {t('adminSettings.browse')}
                      <input type="file" onChange={(e) => uploadFileHandler(e, setHeroBannerDesktop)} className="hidden" accept="image/*" />
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="relative group flex-1">
                      <input type="text" id="heroBannerMobile" value={heroBannerMobile} onChange={(e) => setHeroBannerMobile(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                      <label htmlFor="heroBannerMobile" className={labelStyle}>{t('adminSettings.mobile_banner')}</label>
                    </div>
                    <label className="flex items-center justify-center px-6 py-2 bg-white border-2 border-dashed border-gray-300 rounded-xl font-bold hover:bg-primary/5 hover:border-primary hover:text-primary cursor-pointer transition-all">
                      <FaUpload className="me-2" /> {t('adminSettings.browse')}
                      <input type="file" onChange={(e) => uploadFileHandler(e, setHeroBannerMobile)} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-dark flex items-center gap-2 mb-6 border-b border-gray-100 pb-3 text-start">
                  <FaUserShield className="text-primary" /> {t('adminSettings.auth_banners')}
                  {uploadingImage && <span className="text-sm text-primary flex items-center gap-2 animate-pulse ms-auto"><FaSpinner className="animate-spin" /> {t('adminSettings.uploading')}</span>}
                </h2>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="relative group flex-1">
                      <input type="text" id="loginBanner" value={loginBanner} onChange={(e) => setLoginBanner(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                      <label htmlFor="loginBanner" className={labelStyle}>{t('adminSettings.login_banner')}</label>
                    </div>
                    <label className="flex items-center justify-center px-6 py-2 bg-white border-2 border-dashed border-gray-300 rounded-xl font-bold hover:bg-primary/5 hover:border-primary hover:text-primary cursor-pointer transition-all">
                      <FaUpload className="me-2" /> {t('adminSettings.browse')}
                      <input type="file" onChange={(e) => uploadFileHandler(e, setLoginBanner)} className="hidden" accept="image/*" />
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-stretch p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <div className="relative group flex-1">
                      <input type="text" id="registerBanner" value={registerBanner} onChange={(e) => setRegisterBanner(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                      <label htmlFor="registerBanner" className={labelStyle}>{t('adminSettings.register_banner')}</label>
                    </div>
                    <label className="flex items-center justify-center px-6 py-2 bg-white border-2 border-dashed border-gray-300 rounded-xl font-bold hover:bg-primary/5 hover:border-primary hover:text-primary cursor-pointer transition-all">
                      <FaUpload className="me-2" /> {t('adminSettings.browse')}
                      <input type="file" onChange={(e) => uploadFileHandler(e, setRegisterBanner)} className="hidden" accept="image/*" />
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <Button type="submit" disabled={uploadingImage} isLoading={isSaving} variant="primary" size="md" className="w-full sm:w-auto" leftIcon={!isSaving && <FaSave />}>
                  {t('adminSettings.save_settings') || 'Save Settings'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSettingsScreen;