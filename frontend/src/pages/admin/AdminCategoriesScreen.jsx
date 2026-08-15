// filepath: frontend/src/pages/admin/AdminCategoriesScreen.jsx
import { useState, useContext } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import {
  FaEdit, FaTrash, FaPlus, FaTags, FaExclamationCircle,
  FaTimes, FaImage, FaUpload, FaSpinner, FaCheckCircle, FaExclamationTriangle,
  FaChartLine, FaBoxOpen
} from 'react-icons/fa';

const AdminCategoriesScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { getDBText } = useLanguage();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCategoryId, setCurrentCategoryId] = useState(null);
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [bannerDesktop, setBannerDesktop] = useState('');
  const [bannerMobile, setBannerMobile] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, categoryId: null, categoryName: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const { data: categories = [], isLoading, isError, error } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: async () => {
      const { data } = await axios.get('/api/categories');
      return data;
    }
  });

  const requestDelete = (category) => {
    if (category.isDefault) {
      showToast(t('admin.delete_category_default_err'), 'error');
      return;
    }
    setDeleteModal({ show: true, categoryId: category._id, categoryName: getDBText(category.name) });
  };

  const confirmDeleteHandler = async () => {
    setIsProcessing(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.delete(`/api/categories/${ deleteModal.categoryId }`, config);
      showToast(t('admin.category_deleted'), 'success');
      queryClient.invalidateQueries(['categoriesList']);
      queryClient.invalidateQueries(['categories']);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete category', 'error');
    } finally {
      setIsProcessing(false);
      setDeleteModal({ show: false, categoryId: null, categoryName: '' });
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setNameEn(''); setNameAr(''); setDescriptionEn(''); setDescriptionAr('');
    setThumbnail(''); setBannerDesktop(''); setBannerMobile('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    if (category.isDefault) {
      showToast(t('admin.edit_category_default_err'), 'error');
      return;
    }
    setEditMode(true);
    setCurrentCategoryId(category._id);
    setNameEn(category.name?.en || ''); setNameAr(category.name?.ar || '');
    setDescriptionEn(category.description?.en || ''); setDescriptionAr(category.description?.ar || '');
    setThumbnail(category.thumbnail || ''); setBannerDesktop(category.bannerDesktop || ''); setBannerMobile(category.bannerMobile || '');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const uploadFileHandler = async (e, setImageState) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', 'categories');
    setUploadingImage(true);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.post('/api/upload/single', formData, config);
      let finalPath = data.image || (data.images && data.images[0]);
      if (finalPath) {
        finalPath = finalPath.replace(/\\/g, '/');
        if (!finalPath.startsWith('/')) finalPath = '/' + finalPath;
        setImageState(finalPath);
      }
    } catch (error) {
      showToast(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    const payload = { name: { en: nameEn, ar: nameAr }, description: { en: descriptionEn, ar: descriptionAr }, thumbnail, bannerDesktop, bannerMobile };
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      if (editMode) {
        await axios.put(`/api/categories/${ currentCategoryId }`, payload, config);
        showToast(t('admin.category_updated'), 'success');
      } else {
        await axios.post('/api/categories', payload, config);
        showToast(t('admin.category_created'), 'success');
      }
      queryClient.invalidateQueries(['categoriesList']);
      queryClient.invalidateQueries(['categories']);
      closeModal();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const inputStyle = "block px-4 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer transition-all shadow-sm";
  const labelStyle = "absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary pointer-events-none";

  const imageFields = [
    { id: 'thumbnail', value: thumbnail, setter: setThumbnail, label: t('adminSettings.thumbnail_label', 'Thumbnail (1:1) *') },
    { id: 'bannerDesktop', value: bannerDesktop, setter: setBannerDesktop, label: t('adminSettings.desktop_banner', 'Desktop Banner (Wide) *') },
    { id: 'bannerMobile', value: bannerMobile, setter: setBannerMobile, label: t('adminSettings.mobile_banner', 'Mobile Banner (Portrait) *') }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className={`fixed bottom-10 inset-s-1/2 transform -translate-x-1/2 rtl:translate-x-1/2 z-50 transition-all duration-500 ease-out ${ toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none' }`}>
        <div className={`px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border ${ toast.type === 'success' ? 'bg-dark text-white border-gray-700' : 'bg-red-500 text-white border-red-600' }`}>
          {toast.type === 'success' ? <FaCheckCircle className="text-primary text-xl" /> : <FaExclamationTriangle className="text-white text-xl animate-pulse" />}
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      </div>

      {deleteModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 inset-s-0 w-full h-2 bg-red-500"></div>
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTrash className="text-3xl" />
            </div>
            <h3 className="text-2xl font-black text-dark mb-2">{t('admin.delete_category')}</h3>
            <p className="text-gray-500 font-medium mb-8">{t('admin.delete_category_confirm')} "{deleteModal.categoryName}"؟</p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteModal({ show: false, categoryId: null, categoryName: '' })} disabled={isProcessing} variant="soft" size="md" className="flex-1">{t('profileDetails.cancel')}</Button>
              <Button onClick={confirmDeleteHandler} isLoading={isProcessing} variant="danger" size="md" className="flex-1">{t('admin.yes_delete')}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb steps={[
          { label: t('adminLayout.overview'), url: '/admin/dashboard', icon: FaChartLine },
          { label: t('adminLayout.products'), url: '/admin/products', icon: FaBoxOpen },
          { label: t('adminLayout.categories'), icon: FaTags }
        ]} />

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark tracking-tight flex items-center gap-3">
              <FaTags className="text-primary" /> {t('adminLayout.categories')}
            </h1>
          </div>
          <Button onClick={openCreateModal} variant="primary" size="md" leftIcon={<FaPlus />}>{t('admin.new_category')}</Button>
        </div>

        {isError && (
          <div className="mb-8 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up">
            <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
            <span className="text-red-700 font-bold">{error?.response?.data?.message || error.message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="p-4 font-bold">{t('admin.image')}</th>
                    <th className="p-4 font-bold">{t('admin.category_name')}</th>
                    <th className="p-4 font-bold">{t('admin.description')}</th>
                    <th className="p-4 font-bold text-center">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {categories.map((category) => {
                    const catNameEn = category.name?.en || category.name || '';
                    const catNameAr = category.name?.ar || '';
                    const isUncategorized = category.isDefault === true;
                    return (
                      <tr key={category._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-start">
                          <img src={category.thumbnail || '/images/hero-bg.webp'} alt={catNameEn} className="w-12 h-12 rounded-lg object-cover border border-gray-100 bg-gray-50" />
                        </td>
                        <td className="p-4 font-bold text-sm text-dark text-start">
                          <div className="flex flex-col gap-1">
                            <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit">EN: {catNameEn}</span>
                            {catNameAr && <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-semibold w-fit" dir="rtl">AR: {catNameAr}</span>}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-500 max-w-xs truncate text-start">{getDBText(category.description, 'No description')}</td>
                        <td className="p-4">
                          {/* 🌟 أزرار الحركة المطابقة لشاشة المنتجات تماماً */}
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              onClick={() => openEditModal(category)}
                              disabled={isUncategorized}
                              variant="soft"
                              size="sm"
                              className="w-10 h-10 !p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                              title={isUncategorized ? t('admin.edit_category_default_err') : t('admin.edit_category')}
                            >
                              <FaEdit className="text-sm" />
                            </Button>
                            <Button
                              onClick={() => requestDelete(category)}
                              disabled={isUncategorized}
                              variant="soft"
                              size="sm"
                              className="w-10 h-10 !p-0 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                              title={isUncategorized ? t('admin.delete_category_default_err') : t('admin.delete_category')}
                            >
                              <FaTrash className="text-sm" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden flex flex-col divide-y divide-gray-100">
              {categories.map((category) => {
                const isUncategorized = category.isDefault === true;
                return (
                  <div key={category._id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col gap-4">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex gap-3 items-start flex-1 min-w-0">
                        <img src={category.thumbnail || '/images/hero-bg.webp'} alt="cat" className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100 shrink-0" />
                        <div className="flex flex-col text-start min-w-0">
                          <span className="font-extrabold text-base text-dark truncate block">{getDBText(category.name)}</span>
                          <span className="text-xs text-gray-400 font-medium mt-1">Category ID: {category._id.substring(18)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 leading-relaxed italic text-start">
                      "{getDBText(category.description, 'No description')}"
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black ${ isUncategorized ? 'bg-gray-100 text-gray-500' : 'bg-primary/10 text-primary' }`}>
                        {isUncategorized ? t('admin.default_category', 'Default Category') : t('admin.custom_category', 'Custom Category')}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openEditModal(category)}
                          disabled={isUncategorized}
                          variant="soft"
                          size="sm"
                          className="w-9 h-9 !p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <FaEdit className="text-sm" />
                        </Button>
                        <Button
                          onClick={() => requestDelete(category)}
                          disabled={isUncategorized}
                          variant="soft"
                          size="sm"
                          className="w-9 h-9 !p-0 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <FaTrash className="text-sm" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {categories.length === 0 && <div className="p-8 text-center text-gray-500 font-medium">{t('admin.no_categories_found', 'No categories found.')}</div>}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/40 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden relative max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-dark flex items-center gap-2">
                <FaTags className="text-primary" /> {editMode ? t('admin.edit_category') : t('admin.new_category')}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"><FaTimes className="text-xl" /></button>
            </div>
            <div className="overflow-y-auto grow">
              <form onSubmit={submitHandler} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
                  <div className="relative group">
                    <input type="text" id="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required className={inputStyle} placeholder=" " dir="ltr" />
                    <label htmlFor="nameEn" className={labelStyle}>{t('admin.category_name_en', 'Category Name (EN) *')}</label>
                  </div>
                  <div className="relative group">
                    <input type="text" id="nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" className={`${ inputStyle } text-end`} placeholder=" " />
                    <label htmlFor="nameAr" className={labelStyle}>{t('admin.category_name_ar', 'Category Name (AR)')}</label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
                  <div className="relative group">
                    <textarea id="descriptionEn" value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} rows="3" className={`${ inputStyle } resize-none`} placeholder=" " dir="ltr"></textarea>
                    <label htmlFor="descriptionEn" className={labelStyle}>{t('admin.category_desc_en', 'Category Description (EN)')}</label>
                  </div>
                  <div className="relative group">
                    <textarea id="descriptionAr" value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} rows="3" dir="rtl" className={`${ inputStyle } resize-none text-end`} placeholder=" "></textarea>
                    <label htmlFor="descriptionAr" className={labelStyle}>{t('admin.category_desc_ar', 'Category Description (AR)')}</label>
                  </div>
                </div>
                <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 space-y-5 text-start">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-dark flex items-center gap-2"><FaImage className="text-primary" /> {t('admin.category_images')}</h3>
                    {uploadingImage && <span className="text-sm font-bold text-primary flex items-center gap-2 animate-pulse"><FaSpinner className="animate-spin" /> {t('adminSettings.uploading', 'Uploading...')}</span>}
                  </div>
                  {imageFields.map((field, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-3 items-stretch">
                      <div className="relative group flex-1">
                        <input type="text" id={field.id} value={field.value} onChange={(e) => field.setter(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                        <label htmlFor={field.id} className={labelStyle}>{field.label}</label>
                      </div>
                      <label className="flex items-center justify-center px-6 py-2 bg-white border-2 border-dashed border-gray-300 rounded-xl font-bold hover:bg-primary/5 hover:border-primary hover:text-primary cursor-pointer transition-all">
                        <FaUpload className="me-2" /> {t('adminSettings.browse')}
                        <input type="file" onChange={(e) => uploadFileHandler(e, field.setter)} className="hidden" accept="image/*" />
                      </label>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-50">
                  <Button type="button" onClick={closeModal} variant="outline" size="md" className="w-full sm:w-auto">{t('profileDetails.cancel')}</Button>
                  <Button type="submit" disabled={uploadingImage} isLoading={isProcessing} variant="primary" size="md" className="w-full sm:w-auto flex-1">{t('profileDetails.save_changes')}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesScreen;