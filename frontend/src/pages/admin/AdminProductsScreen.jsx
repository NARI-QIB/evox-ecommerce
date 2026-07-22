import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import Pagination from '../../components/Pagination'; // 🌟 
import {
  FaEdit, FaTrash, FaPlus, FaBoxOpen, FaExclamationCircle,
  FaFilter, FaTags, FaChartLine, FaSearch, FaTimes,
  FaChevronDown, FaCopy, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

const AdminProductsScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { getDBText } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');

  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, productId: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsCategoryDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => { setKeyword(searchInput); setPage(1); }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await axios.get('/api/categories');
      return data;
    }
  });

  const { data: productsData, isLoading, isError, error } = useQuery({
    queryKey: ['adminProducts', page, keyword, selectedCategoryId],
    queryFn: async () => {
      const categoryQuery = selectedCategoryId ? `&category=${ selectedCategoryId }` : '';
      const { data } = await axios.get(`/api/products?pageNumber=${ page }&keyword=${ keyword }${ categoryQuery }`);
      return data;
    },
    keepPreviousData: true
  });

  const confirmDeleteHandler = async () => {
    setIsDeleting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.delete(`/api/products/${ deleteModal.productId }`, config);
      queryClient.invalidateQueries(['adminProducts']);
      showToast(t('admin.product_deleted'), 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ show: false, productId: null });
    }
  };

  const createProductHandler = async () => {
    setIsCreating(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.post('/api/products', {}, config);
      queryClient.invalidateQueries(['adminProducts']);
      navigate(`/admin/product/${ data._id }/edit`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create product', 'error');
      setIsCreating(false);
    }
  };

  const duplicateHandler = async (product) => {
    setIsCreating(true);
    showToast(t('admin.creating_variant'), 'success');
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data: newProduct } = await axios.post('/api/products', {}, config);

      const duplicatedPayload = {
        name: { en: (product.name?.en || 'Copy') + ' - Copy', ar: product.name?.ar ? product.name.ar + ' - نسخة' : '' },
        description: product.description, price: product.price, brand: product.brand,
        category: product.category?._id || product.category, subCategory: product.subCategory, countInStock: product.countInStock,
        styleCode: product.styleCode, selectableOptions: product.selectableOptions, specifications: product.specifications, features: product.features,
        color: { name: { en: '', ar: '' } }, image: '', images: []
      };

      await axios.put(`/api/products/${ newProduct._id }`, duplicatedPayload, config);
      queryClient.invalidateQueries(['adminProducts']);
      navigate(`/admin/product/${ newProduct._id }/edit`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to duplicate product', 'error');
      setIsCreating(false);
    }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
            <h3 className="text-2xl font-black text-dark mb-2">{t('admin.delete_product')}</h3>
            <p className="text-gray-500 font-medium mb-8">
              {t('admin.cannot_undo')}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteModal({ show: false, productId: null })} disabled={isDeleting} variant="soft" size="md" className="flex-1">
                {t('profileDetails.cancel')}
              </Button>
              <Button onClick={confirmDeleteHandler} isLoading={isDeleting} variant="danger" size="md" className="flex-1">
                {t('admin.yes_delete')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb steps={[
          { label: t('adminLayout.overview'), url: '/admin/dashboard', icon: FaChartLine },
          { label: t('adminLayout.products'), icon: FaBoxOpen }
        ]} />

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark tracking-tight flex items-center gap-3">
              <FaBoxOpen className="text-primary" /> {t('admin.inventory')}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {t('admin.manage_products_desc')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <Button to="/admin/categories" variant="secondary" size="md" className="w-full sm:w-auto" leftIcon={<FaTags />}>
              {t('admin.manage_categories')}
            </Button>
            <Button onClick={createProductHandler} isLoading={isCreating} variant="primary" size="md" className="w-full sm:w-auto" leftIcon={!isCreating && <FaPlus />}>
              {t('admin.new_product')}
            </Button>
          </div>
        </div>

        <div className="mb-6 flex flex-col md:flex-row items-center gap-4 animate-fade-in-up">
          <form onSubmit={(e) => e.preventDefault()} className="relative w-full md:w-96 shrink-0">
            <input type="text" placeholder={t('admin.search_name_brand')} value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              className="w-full ps-11 pe-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all bg-white shadow-sm text-start" />
            <FaSearch className="absolute inset-s-4 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchInput && <button type="button" onClick={() => setSearchInput('')} className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 bg-gray-100 p-1 rounded-full transition-colors cursor-pointer"><FaTimes className="text-xs" /></button>}
          </form>

          {categories.length > 0 && (
            <div className="relative w-full md:w-64" ref={dropdownRef}>
              <div onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)} className={`w-full px-4 py-3 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-sm ${ isCategoryDropdownOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300' }`}>
                <div className="flex items-center gap-2">
                  <FaFilter className="text-primary" />
                  <span className="text-sm font-bold text-dark truncate">
                    {selectedCategoryId ? getDBText(categories.find(c => c._id === selectedCategoryId)?.name) : t('admin.all_categories', 'جميع التصنيفات')}
                  </span>
                </div>
                <FaChevronDown className={`text-gray-400 text-xs transition-transform duration-300 ${ isCategoryDropdownOpen ? 'rotate-180 text-primary' : '' }`} />
              </div>
              {isCategoryDropdownOpen && (
                <div className="absolute z-20 top-full inset-s-0 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-up max-h-60 overflow-y-auto text-start">
                  <div onClick={() => { setSelectedCategoryId(''); setPage(1); setIsCategoryDropdownOpen(false); }} className={`px-4 py-3 cursor-pointer text-sm font-bold transition-all border-s-4 ${ selectedCategoryId === '' ? 'bg-primary/5 text-primary border-primary' : 'text-gray-600 hover:bg-primary/5 hover:text-primary border-transparent' }`}>
                    {t('admin.all_categories', 'جميع التصنيفات')}
                  </div>
                  {categories.map((cat) => (
                    <div key={cat._id} onClick={() => { setSelectedCategoryId(cat._id); setPage(1); setIsCategoryDropdownOpen(false); }} className={`px-4 py-3 cursor-pointer text-sm font-bold transition-all border-s-4 ${ selectedCategoryId === cat._id ? 'bg-primary/5 text-primary border-primary' : 'text-gray-600 hover:bg-primary/5 hover:text-primary border-transparent' }`}>
                      {getDBText(cat.name)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
                    <th className="p-4 font-bold">{t('admin.group_id')}</th>
                    <th className="p-4 font-bold">{t('admin.name_color')}</th>
                    <th className="p-4 font-bold">{t('admin.price')}</th>
                    <th className="p-4 font-bold">{t('admin.category')}</th>
                    <th className="p-4 font-bold">{t('admin.brand')}</th>
                    <th className="p-4 font-bold">{t('admin.stock')}</th>
                    <th className="p-4 font-bold text-center">{t('admin.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productsData?.products?.map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 text-start">
                        <div className="flex flex-col">
                          <span className="font-bold text-dark text-xs">{product.styleCode || 'NO-CODE'}</span>
                          <span className="font-mono text-[10px] text-gray-400">{product._id.substring(18)}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-sm text-dark text-start">
                        <div className="flex items-center gap-3">
                          <img src={product.image || '/placeholder.png'} alt={getDBText(product.name)} className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-gray-100" />
                          <div className="flex flex-col text-start">
                            <span className="truncate max-w-[200px]">{getDBText(product.name, 'Unnamed')}</span>
                            {product.color?.name?.en && <span className="text-[10px] text-gray-500 font-medium mt-0.5">{getDBText(product.color.name)}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-sm text-dark text-start" dir="ltr">{formatCurrency(product.price)}</td>
                      <td className="p-4 text-sm text-gray-500 text-start">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                          {getDBText(product.category?.name, t('admin.uncategorized'))}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500 text-start">{product.brand}</td>
                      <td className="p-4 text-start">
                        <span className={`px-3 py-1 rounded-lg text-xs font-black ${ product.countInStock > 5 ? 'bg-green-50 text-green-600' : product.countInStock > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600' }`}>
                          {product.countInStock}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button onClick={() => duplicateHandler(product)} disabled={isCreating} variant="soft" size="sm" className="w-10 h-10 !p-0 bg-[#EFF6FF] text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl">
                            <FaCopy className="text-sm" />
                          </Button>
                          <Button to={`/admin/product/${ product._id }/edit`} variant="soft" size="sm" className="w-10 h-10 !p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl">
                            <FaEdit className="text-sm" />
                          </Button>
                          <Button onClick={() => setDeleteModal({ show: true, productId: product._id })} disabled={isDeleting} variant="soft" size="sm" className="w-10 h-10 !p-0 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl">
                            <FaTrash className="text-sm" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {productsData?.products?.length === 0 && (
                    <tr><td colSpan="7" className="p-8 text-center text-gray-500 font-medium">{t('admin.no_products_found')}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden flex flex-col divide-y divide-gray-100">
              {productsData?.products?.map((product) => (
                <div key={product._id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-3 items-start flex-1 min-w-0">
                      <img src={product.image || '/placeholder.png'} alt={getDBText(product.name)} className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100 shrink-0" />
                      <div className="flex flex-col text-start min-w-0">
                        <span className="font-extrabold text-base text-dark truncate block">{getDBText(product.name, 'Unnamed')}</span>
                        <div className="text-xs text-gray-500 font-medium mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded-md text-gray-600 font-bold">{product.styleCode || 'NO-CODE'}</span>
                          <span>• {product.brand}</span>
                        </div>
                        {product.color?.name?.en && (
                          <span className="text-[10px] text-gray-400 font-medium mt-1">{getDBText(product.color.name)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <div className="font-black text-primary text-lg" dir="ltr">{formatCurrency(product.price)}</div>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black ${ product.countInStock > 5 ? 'bg-green-50 text-green-600' : product.countInStock > 0 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600' }`}>
                          {product.countInStock}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div>
                      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-semibold">
                        {getDBText(product.category?.name, t('admin.uncategorized'))}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => duplicateHandler(product)} disabled={isCreating} variant="soft" size="sm" className="w-9 h-9 !p-0 bg-[#EFF6FF] text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl">
                        <FaCopy className="text-sm" />
                      </Button>
                      <Button to={`/admin/product/${ product._id }/edit`} variant="soft" size="sm" className="w-9 h-9 !p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl">
                        <FaEdit className="text-sm" />
                      </Button>
                      <Button onClick={() => setDeleteModal({ show: true, productId: product._id })} disabled={isDeleting} variant="soft" size="sm" className="w-9 h-9 !p-0 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl">
                        <FaTrash className="text-sm" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {productsData?.products?.length === 0 && (
                <div className="p-8 text-center text-gray-500 font-medium">{t('admin.no_products_found')}</div>
              )}
            </div>

            <div className="px-4">
              <Pagination page={page} pages={productsData?.pages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsScreen;