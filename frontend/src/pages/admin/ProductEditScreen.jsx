// filepath: frontend/src/pages/admin/ProductEditScreen.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  FaBoxOpen, FaSave, FaArrowLeft, FaArrowRight, FaUpload, FaEdit,
  FaImages, FaTimes, FaTags, FaPlus, FaChartLine, FaPalette,
  FaListUl, FaInfoCircle, FaStar, FaCheck
} from 'react-icons/fa';

const ProductEditScreen = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang, getDBText } = useLanguage();

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionAr, setDescriptionAr] = useState('');
  const [price, setPrice] = useState(0);
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [countInStock, setCountInStock] = useState(0);

  const [styleCode, setStyleCode] = useState('');
  const [colorNameEn, setColorNameEn] = useState('');
  const [colorNameAr, setColorNameAr] = useState('');
  const [image, setImage] = useState('');
  const [images, setImages] = useState([]);

  const [selectableOptions, setSelectableOptions] = useState([]);
  const [specifications, setSpecifications] = useState([]);
  const [features, setFeatures] = useState([]);

  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categoriesList'],
    queryFn: async () => {
      const { data } = await axios.get('/api/categories');
      return data;
    }
  });

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ['adminProduct', productId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/products/${ productId }`);
      return data;
    },
    enabled: !!userInfo?.isAdmin && !!productId,
  });

  useEffect(() => {
    if (product) {
      setNameEn(product.name?.en || (typeof product.name === 'string' ? product.name : ''));
      setNameAr(product.name?.ar || '');
      setDescriptionEn(product.description?.en || (typeof product.description === 'string' ? product.description : ''));
      setDescriptionAr(product.description?.ar || '');
      setPrice(product.price || 0);
      setBrand(product.brand || '');
      setCategory(product.category?._id || product.category || '');
      setSubCategory(product.subCategory || '');
      setCountInStock(product.countInStock || 0);
      setStyleCode(product.styleCode || '');
      setColorNameEn(product.color?.name?.en || '');
      setColorNameAr(product.color?.name?.ar || '');
      setImage(product.image || '');
      setImages(product.images || []);
      setSelectableOptions(product.selectableOptions || []);
      setSpecifications(product.specifications || []);
      setFeatures(product.features || []);
    }
  }, [product]);

  const uploadGalleryImageHandler = async (e) => {
    if (!styleCode) { alert(t('productEdit.enter_style_alert')); return; }
    const files = e.target.files;
    if (files.length === 0) return;
    const formData = new FormData();
    formData.append('styleCode', styleCode);
    for (let i = 0; i < files.length; i++) formData.append('images', files[i]);

    setIsUploadingGallery(true);
    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.post('/api/upload', formData, config);
      const newImages = [...images, ...data.images];
      setImages(newImages);
      if (!image || image === '/images/sample.jpg') if (data.images.length > 0) setImage(data.images[0]);
    } catch (err) {
      alert(err.response?.data?.message || t('productEdit.upload_failed'));
    } finally { setIsUploadingGallery(false); }
  };

  const removeGalleryImage = async (indexToRemove) => {
    const imgToRemove = images[indexToRemove];

    const updatedImages = images.filter((_, idx) => idx !== indexToRemove);
    setImages(updatedImages);
    if (image === imgToRemove) setImage(updatedImages.length > 0 ? updatedImages[0] : '');

    if (imgToRemove && imgToRemove.includes('cloudinary.com')) {
      try {
        await axios.post('/api/upload/destroy', { imageUrl: imgToRemove }, {
          headers: { Authorization: `Bearer ${ userInfo.token }` }
        });
      } catch (err) {
        console.error("Failed to delete orphaned image from cloud", err);
      }
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    const payload = {
      name: { en: nameEn, ar: nameAr }, description: { en: descriptionEn, ar: descriptionAr }, price,
      image, images, brand, category, subCategory, countInStock, styleCode,
      color: { name: { en: colorNameEn, ar: colorNameAr } }, selectableOptions, specifications, features
    };
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.put(`/api/products/${ productId }`, payload, config);

      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
      queryClient.invalidateQueries({ queryKey: ['adminProduct', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });

      navigate('/admin/products');
    } catch (err) {
      alert(err.response?.data?.message || t('productEdit.update_failed'));
    } finally { setIsUpdating(false); }
  };

  const handleArrayChange = (setter, index, fieldPath, value) => {
    setter(prev => {
      const updated = [...prev];
      const keys = fieldPath.split('.');
      if (keys.length === 1) updated[index][keys[0]] = value;
      else if (keys.length === 2) updated[index][keys[0]][keys[1]] = value;
      return updated;
    });
  };

  const handleArrayAdd = (setter, emptyObj) => {
    setter(prev => [...prev, emptyObj]);
  };

  const handleArrayRemove = (setter, index) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const handleOptionBlur = (index, langType, value) => {
    const vals = value.split(',').map(v => v.trim()).filter(v => v);
    setSelectableOptions(prev => {
      const upd = [...prev];
      const len = Math.max(upd[index].values.length, vals.length);
      const newVals = [];
      for (let i = 0; i < len; i++) {
        newVals.push({
          en: langType === 'en' && vals[i] ? vals[i] : (upd[index].values[i]?.en || ''),
          ar: langType === 'ar' && vals[i] ? vals[i] : (upd[index].values[i]?.ar || '')
        });
      }
      upd[index].values = newVals.filter(v => v.en || v.ar);
      return upd;
    });
  };

  if (isError) return <div className="p-4 m-8 bg-red-50 text-red-700 font-bold">{error.message}</div>;

  const categoryOptions = categories.map((cat) => ({
    value: cat._id,
    label: getDBText(cat.name)
  }));

  const inputStyle = "block px-4 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer transition-all shadow-sm";
  const labelStyle = "absolute text-xs duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 text-gray-400 peer-focus:text-primary pointer-events-none";

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb steps={[
          { label: t('adminLayout.overview'), url: '/admin/dashboard', icon: FaChartLine },
          { label: t('adminLayout.products'), url: '/admin/products', icon: FaBoxOpen },
          { label: t('productEdit.title'), icon: FaEdit }
        ]} />

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-extrabold text-dark flex items-center gap-3">
            <FaEdit className="text-primary" /> {t('productEdit.title')}
          </h1>
          <Button
            to="/admin/products"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            leftIcon={lang === 'ar' ? <FaArrowRight /> : <FaArrowLeft />}
          >
            {t('productEdit.back')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
        ) : (
          <form onSubmit={submitHandler} className="space-y-8 animate-fade-in-up">

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-4 text-start"><FaBoxOpen className="text-primary" /> {t('productEdit.basic_info')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
                <div className="relative group">
                  <input type="text" id="nameEn" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required className={inputStyle} placeholder=" " dir="ltr" />
                  <label htmlFor="nameEn" className={labelStyle}>{t('productEdit.name_en')}</label>
                </div>
                <div className="relative group">
                  <input type="text" id="nameAr" value={nameAr} onChange={(e) => setNameAr(e.target.value)} className={`${ inputStyle } text-end`} placeholder=" " dir="rtl" />
                  <label htmlFor="nameAr" className={labelStyle}>{t('productEdit.name_ar')}</label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
                <div className="relative group">
                  <input type="number" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required min="0" step="0.01" className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                  <label htmlFor="price" className={labelStyle}>{t('productEdit.price')}</label>
                </div>
                <div className="relative group">
                  <input type="text" id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                  <label htmlFor="brand" className={labelStyle}>{t('productEdit.brand')}</label>
                </div>
                <div className="relative group">
                  <input type="number" id="countInStock" value={countInStock} onChange={(e) => setCountInStock(e.target.value)} required min="0" className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                  <label htmlFor="countInStock" className={labelStyle}>{t('productEdit.stock')}</label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center justify-between border-b pb-4">
                <span className="flex items-center gap-2"><FaPalette className="text-primary" /> {t('productEdit.style_colors')}</span>
                <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">{t('productEdit.crucial_ui')}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-start">
                <div className="relative group">
                  <input type="text" id="styleCode" value={styleCode} onChange={(e) => setStyleCode(e.target.value.toUpperCase())} required className="block px-4 pb-2.5 pt-6 w-full text-sm text-dark bg-orange-50/50 rounded-xl border-2 border-orange-200 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer uppercase text-start shadow-sm" placeholder=" " dir="ltr" />
                  <label htmlFor="styleCode" className="absolute text-xs duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-transparent px-1 text-primary pointer-events-none">{t('productEdit.style_code')}</label>
                </div>
                <div className="relative group">
                  <input type="text" id="colorNameEn" value={colorNameEn} onChange={(e) => setColorNameEn(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                  <label htmlFor="colorNameEn" className={labelStyle}>{t('productEdit.color_en')}</label>
                </div>
                <div className="relative group">
                  <input type="text" id="colorNameAr" value={colorNameAr} onChange={(e) => setColorNameAr(e.target.value)} className={`${ inputStyle } text-end`} placeholder=" " dir="rtl" />
                  <label htmlFor="colorNameAr" className={labelStyle}>{t('productEdit.color_ar')}</label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center justify-between border-b pb-4">
                <span className="flex items-center gap-2"><FaImages className="text-primary" /> {t('productEdit.gallery')}</span>
                {!styleCode && <span className="text-xs bg-red-50 text-red-500 px-3 py-1 rounded-full font-bold animate-pulse">{t('productEdit.enter_style_code')}</span>}
              </h2>
              <div>
                {images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-6">
                    {images.map((img, idx) => (
                      <div key={idx} className={`relative rounded-xl border-2 overflow-hidden flex flex-col bg-white ${ image === img ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200' }`}>
                        <div className="relative aspect-square">
                          <img src={img} alt={`Gallery ${ idx }`} className="w-full h-full object-contain p-2" />
                          {image === img && <div className="absolute top-2 start-2 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-md flex items-center gap-1"><FaCheck /> {t('productEdit.main')}</div>}
                        </div>
                        <div className="flex bg-gray-50 border-t border-gray-100">
                          <button type="button" onClick={() => setImage(img)} className={`flex-1 text-[10px] font-bold py-2 transition-colors cursor-pointer ${ image === img ? 'text-primary bg-orange-50' : 'text-gray-500 hover:bg-gray-200' }`}>{image === img ? t('productEdit.cover_image') : t('productEdit.make_cover')}</button>
                          <div className="w-px bg-gray-200"></div>
                          <button type="button" onClick={() => removeGalleryImage(idx)} className="w-10 text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer"><FaTimes /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 mb-6">
                    <FaImages className="text-4xl mb-3" />
                    <p className="font-medium text-sm">{t('productEdit.no_images')}</p>
                  </div>
                )}
                <div className="relative inline-block w-full">
                  <input type="file" multiple accept="image/png, image/jpeg, image/webp, image/jpg" disabled={!styleCode || isUploadingGallery} onChange={uploadGalleryImageHandler} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" />
                  <div className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed px-6 py-8 rounded-2xl font-bold transition-all ${ !styleCode ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-primary/5 text-primary border-primary/30 hover:bg-primary/10 hover:border-primary' }`}>
                    {isUploadingGallery ? (
                      <span className="animate-pulse flex items-center gap-2"><FaUpload /> {t('productEdit.uploading')}</span>
                    ) : (
                      <>
                        <FaUpload className="text-2xl mb-1" />
                        <span>{t('productEdit.click_drag')}</span>
                        <span className="text-xs font-normal opacity-70">{t('productEdit.hold_ctrl')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2 border-b pb-4 text-start"><FaTags className="text-primary" /> {t('productEdit.categorization')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 🌟 قائمة اختيار القسم الرئيسي المحدثة بالمكون الموحد CustomSelect */}
                <CustomSelect
                  options={categoryOptions}
                  value={category}
                  onChange={(val) => setCategory(val)}
                  placeholder={t('productEdit.select_category')}
                  triggerClassName="!py-3.5 !bg-white hover:!border-primary"
                  renderValue={(opt) => (
                    <div className="flex flex-col text-start">
                      <span className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{t('productEdit.main_category')}</span>
                      <span className="font-bold text-dark">{opt ? opt.label : t('productEdit.select_category')}</span>
                    </div>
                  )}
                />

                <div className="relative group text-start">
                  <input type="text" id="subCategory" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className={`${ inputStyle } text-start`} placeholder=" " dir="ltr" />
                  <label htmlFor="subCategory" className={labelStyle}>{t('productEdit.sub_category_hint')}</label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><FaListUl className="text-primary" /> {t('productEdit.options')}</h2>
                <Button
                  type="button"
                  onClick={() => handleArrayAdd(setSelectableOptions, { name: { en: '', ar: '' }, values: [] })}
                  variant="outline"
                  size="sm"
                  className="bg-primary/5 text-primary border-transparent hover:bg-primary hover:text-white"
                  leftIcon={<FaPlus />}
                >
                  {t('productEdit.add_option')}
                </Button>
              </div>
              {selectableOptions.map((opt, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl relative border text-start">
                  <button type="button" onClick={() => handleArrayRemove(setSelectableOptions, i)} className="absolute -top-3 -end-3 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer"><FaTimes /></button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><input type="text" value={opt.name.en} onChange={e => handleArrayChange(setSelectableOptions, i, 'name.en', e.target.value)} placeholder={t('productEdit.opt_name_en')} className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all bg-white" dir="ltr" /><input type="text" value={opt.name.ar} onChange={e => handleArrayChange(setSelectableOptions, i, 'name.ar', e.target.value)} placeholder={t('productEdit.opt_name_ar')} className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-end transition-all bg-white" dir="rtl" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" defaultValue={opt.values.map(v => v.en).filter(Boolean).join(',')} onBlur={e => handleOptionBlur(i, 'en', e.target.value)} placeholder={t('productEdit.opt_vals_en')} className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all bg-white" dir="ltr" /><input type="text" defaultValue={opt.values.map(v => v.ar).filter(Boolean).join(',')} onBlur={e => handleOptionBlur(i, 'ar', e.target.value)} placeholder={t('productEdit.opt_vals_ar')} className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-end transition-all bg-white" dir="rtl" /></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><FaInfoCircle className="text-primary" /> {t('productEdit.static_specs')}</h2>
                <Button
                  type="button"
                  onClick={() => handleArrayAdd(setSpecifications, { name: { en: '', ar: '' }, value: { en: '', ar: '' } })}
                  variant="outline"
                  size="sm"
                  className="bg-primary/5 text-primary border-transparent hover:bg-primary hover:text-white"
                  leftIcon={<FaPlus />}
                >
                  {t('productEdit.add_spec')}
                </Button>
              </div>
              {specifications.map((spec, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 relative group items-center bg-gray-50 p-3 rounded-xl border border-gray-100 text-start">
                  <div className="md:col-span-5 space-y-2"><input type="text" value={spec.name.en} onChange={(e) => handleArrayChange(setSpecifications, index, 'name.en', e.target.value)} placeholder={t('productEdit.spec_name_en')} className="w-full text-sm p-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors bg-white" dir="ltr" /><input type="text" value={spec.name.ar} onChange={(e) => handleArrayChange(setSpecifications, index, 'name.ar', e.target.value)} placeholder={t('productEdit.spec_name_ar')} dir="rtl" className="w-full text-sm p-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-end transition-colors bg-white" /></div>
                  <div className="md:col-span-6 space-y-2"><input type="text" value={spec.value.en} onChange={(e) => handleArrayChange(setSpecifications, index, 'value.en', e.target.value)} placeholder={t('productEdit.spec_val_en')} className="w-full text-sm p-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors bg-white" dir="ltr" /><input type="text" value={spec.value.ar} onChange={(e) => handleArrayChange(setSpecifications, index, 'value.ar', e.target.value)} placeholder={t('productEdit.spec_val_ar')} dir="rtl" className="w-full text-sm p-2.5 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none text-end transition-colors bg-white" /></div>
                  <div className="md:col-span-1 flex justify-end"><button type="button" onClick={() => handleArrayRemove(setSpecifications, index)} className="text-red-400 hover:text-red-600 bg-red-50 p-2 rounded-lg transition-colors cursor-pointer"><FaTimes /></button></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><FaStar className="text-primary" /> {t('productEdit.features_grid')}</h2>
                <Button
                  type="button"
                  onClick={() => handleArrayAdd(setFeatures, { icon: 'FaCheckCircle', title: { en: '', ar: '' }, description: { en: '', ar: '' } })}
                  variant="outline"
                  size="sm"
                  className="bg-primary/5 text-primary border-transparent hover:bg-primary hover:text-white"
                  leftIcon={<FaPlus />}
                >
                  {t('productEdit.add_feature')}
                </Button>
              </div>
              {features.map((feat, index) => (
                <div key={index} className="p-5 bg-gray-50 border border-gray-200 rounded-2xl relative group text-start">
                  <button type="button" onClick={() => handleArrayRemove(setFeatures, index)} className="absolute -top-3 -end-3 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm transition-colors cursor-pointer"><FaTimes /></button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3"><input type="text" value={feat.icon} onChange={(e) => handleArrayChange(setFeatures, index, 'icon', e.target.value)} placeholder={t('productEdit.feat_icon')} className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors md:col-span-1 outline-none bg-white" dir="ltr" /><input type="text" value={feat.title.en} onChange={(e) => handleArrayChange(setFeatures, index, 'title.en', e.target.value)} placeholder={t('productEdit.feat_title_en')} className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors outline-none bg-white" dir="ltr" /><input type="text" value={feat.title.ar} onChange={(e) => handleArrayChange(setFeatures, index, 'title.ar', e.target.value)} placeholder={t('productEdit.feat_title_ar')} dir="rtl" className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-end outline-none bg-white" /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" value={feat.description.en} onChange={(e) => handleArrayChange(setFeatures, index, 'description.en', e.target.value)} placeholder={t('productEdit.feat_desc_en')} className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors outline-none bg-white" dir="ltr" /><input type="text" value={feat.description.ar} onChange={(e) => handleArrayChange(setFeatures, index, 'description.ar', e.target.value)} placeholder={t('productEdit.feat_desc_ar')} dir="rtl" className="w-full text-sm p-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-end outline-none bg-white" /></div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-6">
              <h2 className="text-xl font-bold border-b pb-4 text-start">{t('productEdit.detailed_desc')}</h2>
              <textarea value={descriptionEn} onChange={e => setDescriptionEn(e.target.value)} required rows="4" className="w-full p-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-colors text-start" placeholder={t('productEdit.desc_en')} dir="ltr"></textarea>
              <textarea value={descriptionAr} onChange={e => setDescriptionAr(e.target.value)} rows="4" className="w-full p-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-colors text-end" placeholder={t('productEdit.desc_ar')} dir="rtl"></textarea>
            </div>

            <div className="sticky bottom-6 z-30 pt-4 flex justify-end">
              <Button
                type="submit"
                isLoading={isUpdating}
                variant="primary"
                size="lg"
                className="w-full sm:w-auto shadow-2xl"
                leftIcon={!isUpdating && <FaSave className="text-xl" />}
              >
                {t('productEdit.save_sync')}
              </Button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default ProductEditScreen;