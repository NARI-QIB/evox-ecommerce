// filepath: frontend/src/pages/CategoryScreen.jsx
import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import Product from '../components/Product';
import ProductSkeleton from '../components/ProductSkeleton';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/ui/Button';
import Pagination from '../components/Pagination'; // 🌟 تضمين المكون الجديد
import { FaTags, FaTimes, FaSlidersH } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';

const clothingSizeOrder = {
  'xxs': 1, 'xs': 2, 's': 3, 'small': 3, 'm': 4, 'medium': 4,
  'l': 5, 'large': 5, 'xl': 6, 'xxl': 7, '2xl': 7, 'xxxl': 8, '3xl': 8
};

const smartSort = (a, b) => {
  const valA = a.toLowerCase().trim();
  const valB = b.toLowerCase().trim();
  if (clothingSizeOrder[valA] && clothingSizeOrder[valB]) {
    return clothingSizeOrder[valA] - clothingSizeOrder[valB];
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

const CategoryScreen = () => {
  const { id } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { t } = useTranslation();
  const { lang, getDBText } = useLanguage();

  const [selectedBrands, setSelectedBrands] = useState(searchParams.get('brands') ? searchParams.get('brands').split(',') : []);
  const [selectedSubCats, setSelectedSubCats] = useState(searchParams.get('subCategories') ? searchParams.get('subCategories').split(',') : []);
  const [selectedOptions, setSelectedOptions] = useState(searchParams.get('options') ? searchParams.get('options').split(',') : []);
  const [pageNumber, setPageNumber] = useState(Number(searchParams.get('pageNumber')) || 1);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, [id]);

  const { data: categoryInfo } = useQuery({
    queryKey: ['categoryInfo', id],
    queryFn: async () => {
      const [catRes, filterRes] = await Promise.all([
        axios.get('/api/categories'),
        axios.get(`/api/products/filters?category=${ id }`)
      ]);
      const currentCat = catRes.data.find(c => c._id === id);
      return {
        category: currentCat,
        filters: filterRes.data || { brands: [], subCategories: [], options: [] }
      };
    },
    enabled: !!id && id !== 'undefined',
  });

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['categoryProducts', id, selectedBrands, selectedSubCats, selectedOptions, pageNumber],
    queryFn: async () => {
      let query = `/api/products?category=${ id }&pageNumber=${ pageNumber }`;
      if (selectedBrands.length > 0) query += `&brands=${ selectedBrands.join(',') }`;
      if (selectedSubCats.length > 0) query += `&subCategories=${ selectedSubCats.join(',') }`;
      if (selectedOptions.length > 0) query += `&options=${ selectedOptions.join(',') }`;
      const { data } = await axios.get(query);
      return data;
    },
    enabled: !!id && id !== 'undefined',
    keepPreviousData: true
  });

  useEffect(() => {
    const params = {};
    if (selectedBrands.length > 0) params.brands = selectedBrands.join(',');
    if (selectedSubCats.length > 0) params.subCategories = selectedSubCats.join(',');
    if (selectedOptions.length > 0) params.options = selectedOptions.join(',');
    if (pageNumber > 1) params.pageNumber = pageNumber;
    setSearchParams(params);
  }, [selectedBrands, selectedSubCats, selectedOptions, pageNumber, setSearchParams]);

  useEffect(() => { setIsSidebarOpen(false); }, [location.search]);

  useEffect(() => {
    if (isSidebarOpen && window.innerWidth < 1024) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isSidebarOpen]);

  const toggleFilter = (state, setter, value) => {
    if (state.includes(value)) setter(state.filter(item => item !== value));
    else setter([...state, value]);
    setPageNumber(1);
  };

  const clearAllFilters = () => {
    setSelectedBrands([]); setSelectedSubCats([]); setSelectedOptions([]);
    setPageNumber(1);
  };

  const categoryName = categoryInfo?.category ? getDBText(categoryInfo.category.name) : t('header.all_categories', 'Category');
  const categoryBanners = {
    desktop: categoryInfo?.category?.bannerDesktop || '/images/hero-bg.webp',
    mobile: categoryInfo?.category?.bannerMobile || categoryInfo?.category?.bannerDesktop || '/images/hero-bg.webp'
  };

  const availableFilters = categoryInfo?.filters || { brands: [], subCategories: [], options: [] };

  const validSubCategories = availableFilters.subCategories?.filter(sub => sub._id && sub._id.trim() !== '') || [];
  const validBrands = availableFilters.brands?.filter(brand => brand._id && brand._id.trim() !== '') || [];
  const validOptions = availableFilters.options?.filter(opt => opt && opt._id && opt._id.trim() !== '' && opt.values && opt.values.length > 0) || [];

  const hasFilters = validSubCategories.length > 0 || validBrands.length > 0 || validOptions.length > 0;

  const activeFiltersCount = selectedBrands.length + selectedSubCats.length + selectedOptions.length;
  const productsList = productsData?.products || [];

  return (
    <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-light min-h-screen">
      <div className="mb-4">
        <Breadcrumb steps={[{ label: categoryName, icon: FaTags }]} />
      </div>

      <div className="relative w-full h-[30vh] min-h-[200px] md:h-[35vh] md:min-h-[300px] lg:h-[400px] overflow-hidden rounded-3xl mb-8 shadow-sm group bg-dark">
        <picture>
          <source media="(max-width: 768px)" srcSet={categoryBanners.mobile} />
          <img src={categoryBanners.desktop} alt={categoryName} fetchPriority="high" className="w-full h-full object-cover object-center opacity-90 group-hover:scale-105 transition-transform duration-1000 ease-out rtl:-scale-x-100" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/40 to-transparent flex flex-col justify-end px-6 md:px-12 pb-8 md:pb-12 text-start">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-black text-white tracking-tighter uppercase drop-shadow-xl translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
            {categoryName}
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row items-start relative gap-8 lg:gap-0">

        <div className="lg:hidden w-full flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <span className="font-bold text-dark">{productsData?.products?.length || 0} {t('category.products_available')}</span>
          {hasFilters && (
            <Button
              onClick={() => setIsSidebarOpen(true)}
              variant="ghost"
              size="sm"
              className="group !py-2 !px-4 !bg-primary/5 !border !border-primary/30 !text-primary hover:!bg-primary hover:!border-primary hover:!text-white transition-all duration-300 min-w-[120px] justify-center"
              leftIcon={<FaSlidersH className="text-primary group-hover:text-white transition-colors" />}
            >
              <span className="flex items-center gap-2">
                {t('category.filter')}
                {activeFiltersCount > 0 && (
                  <span className="bg-primary text-white group-hover:bg-white group-hover:text-primary text-[10px] min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full font-black shadow-sm transition-colors">
                    {activeFiltersCount}
                  </span>
                )}
              </span>
            </Button>
          )}
        </div>

        {hasFilters && (
          <>
            <div className={`fixed inset-0 bg-dark/60 z-[60] lg:hidden transition-opacity duration-300 ${ isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible' }`} onClick={() => setIsSidebarOpen(false)}></div>

            <div className={`
              fixed top-0 start-0 h-full w-[85vw] sm:w-[350px] bg-white z-[70] transition-transform duration-500 transform flex flex-col shadow-2xl
              lg:static lg:h-max lg:bg-transparent lg:shadow-none lg:z-auto lg:transform-none lg:sticky lg:top-24
              lg:transition-all lg:duration-500 lg:ease-in-out lg:overflow-hidden
              ${ isSidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full' }
              ${ isSidebarOpen && hasFilters ? 'lg:w-1/4 xl:w-1/5 lg:opacity-100 lg:pe-8' : 'lg:w-0 lg:opacity-0 lg:pe-0 lg:border-none' }
            `}>

              <div className="flex flex-col h-full lg:h-auto lg:min-w-[250px] xl:min-w-[280px] w-full">
                <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                  <h2 className="text-xl font-extrabold text-dark flex items-center gap-2 uppercase tracking-wide"><FaSlidersH className="text-primary" /> {t('category.filter')}</h2>
                  <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm focus:outline-none cursor-pointer"><FaTimes className="text-lg" /></button>
                </div>

                <div className="flex-1 overflow-y-auto lg:overflow-visible p-6 lg:p-6 space-y-8 hide-scrollbar lg:bg-white lg:rounded-3xl lg:border lg:border-gray-100 lg:shadow-sm text-start">

                  <div className="hidden lg:flex items-center justify-between mb-2">
                    <h2 className="text-lg font-extrabold text-dark flex items-center gap-2 uppercase"><FaSlidersH className="text-primary" /> {t('category.filters_sorting', 'Filters')}</h2>
                  </div>

                  {activeFiltersCount > 0 && (
                    <Button
                      onClick={clearAllFilters}
                      variant="outline"
                      size="md"
                      fullWidth
                      className="group hover:!border-primary hover:!text-primary transition-colors"
                      leftIcon={<FaTimes className="text-red-500 group-hover:text-primary transition-colors" />}
                    >
                      {t('category.clear_filters')}
                    </Button>
                  )}

                  {validSubCategories.length > 0 && (
                    <div>
                      <h3 className="font-bold text-dark uppercase tracking-wider text-sm mb-4">{t('category.category_type')}</h3>
                      <div className="space-y-3">
                        {[...validSubCategories].sort((a, b) => a._id.localeCompare(b._id)).map((sub, idx) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 group-hover:border-primary transition-colors">
                              <input type="checkbox" checked={selectedSubCats.includes(sub._id)} onChange={() => toggleFilter(selectedSubCats, setSelectedSubCats, sub._id)} className="peer opacity-0 absolute inset-0 cursor-pointer" />
                              <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                            </div>
                            <span className={`text-sm font-medium select-none transition-colors ${ selectedSubCats.includes(sub._id) ? 'text-primary font-bold' : 'text-gray-600 group-hover:text-primary' }`}>{sub._id} <span className="text-xs text-gray-400 ms-1">({sub.count})</span></span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {validBrands.length > 0 && (
                    <div>
                      <h3 className="font-bold text-dark uppercase tracking-wider text-sm mb-4">{t('category.brands')}</h3>
                      <div className="space-y-3">
                        {[...validBrands].sort((a, b) => a._id.localeCompare(b._id)).map((brand, idx) => (
                          <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-300 group-hover:border-primary transition-colors">
                              <input type="checkbox" checked={selectedBrands.includes(brand._id)} onChange={() => toggleFilter(selectedBrands, setSelectedBrands, brand._id)} className="peer opacity-0 absolute inset-0 cursor-pointer" />
                              <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                            </div>
                            <span className={`text-sm font-medium select-none transition-colors ${ selectedBrands.includes(brand._id) ? 'text-primary font-bold' : 'text-gray-600 group-hover:text-primary' }`}>{brand._id} <span className="text-xs text-gray-400 ms-1">({brand.count})</span></span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {validOptions.map((optGroup, idx) => (
                    <div key={idx} className="border-t border-gray-100 pt-6">
                      <h3 className="font-bold text-dark uppercase tracking-wider text-sm mb-4">{getDBText({ en: optGroup._id, ar: optGroup._id })}</h3>
                      <div className="flex flex-wrap gap-2">
                        {[...optGroup.values].filter(val => val && val.trim() !== '').sort(smartSort).map((val, i) => (
                          <button key={i} onClick={() => toggleFilter(selectedOptions, setSelectedOptions, val)} className={`min-w-[3.5rem] px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-300 focus:outline-none select-none cursor-pointer ${ selectedOptions.includes(val) ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 bg-white' }`}>
                            {val}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lg:hidden p-6 border-t border-gray-100 bg-white shrink-0">
                  <Button onClick={() => setIsSidebarOpen(false)} variant="primary" size="lg" fullWidth>
                    {t('category.show_products', `Show ${ productsList.length } Products`, { count: productsList.length })}
                  </Button>
                </div>
              </div>

            </div>
          </>
        )}

        <div className={`flex-1 w-full min-w-0 pb-12 transition-all duration-500 ease-in-out`}>

          <div className="hidden lg:flex justify-between items-center mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-dark tracking-tight">{t('category.explore_gear')}</h2>
              {hasFilters && (
                <Button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  variant="ghost"
                  size="sm"
                  className="group !py-2 !px-4 !bg-primary/5 !border !border-primary/30 !text-primary hover:!bg-primary hover:!border-primary hover:!text-white transition-all duration-300 min-w-[140px] sm:min-w-[160px] justify-center"
                  leftIcon={<FaSlidersH className="text-primary group-hover:text-white transition-colors" />}
                >
                  <span className="flex items-center gap-2">
                    {isSidebarOpen ? t('category.hide_filters', 'Hide Filters') : t('category.show_filters', 'Show Filters')}
                    {activeFiltersCount > 0 && (
                      <span className="bg-primary text-white group-hover:bg-white group-hover:text-primary text-[10px] min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full font-black shadow-sm transition-colors">
                        {activeFiltersCount}
                      </span>
                    )}
                  </span>
                </Button>
              )}
            </div>
            <span className="text-gray-500 font-bold bg-gray-50 px-4 py-2 rounded-lg text-sm">{productsData?.products?.length || 0} {t('category.products_available')}</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {[...Array(12)].map((_, index) => <ProductSkeleton key={index} />)}
            </div>
          ) : productsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm text-center px-4 mt-4">
              <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 mx-auto mb-6">
                <circle cx="100" cy="100" r="100" fill="#F4F4F5" />
                <rect x="60" y="60" width="80" height="80" rx="10" fill="#fff" stroke="#1E293B" strokeWidth="8" />
                <path d="M60 100h80M100 60v80" stroke="#E2E8F0" strokeWidth="4" strokeDasharray="6 6" />
                <circle cx="100" cy="100" r="25" fill="#F97316" />
                <path d="M115 115l25 25" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
              </svg>
              <h2 className="text-3xl font-extrabold text-dark mb-3">{t('category.no_products')}</h2>
              <p className="text-gray-500 font-medium mb-8 max-w-md">{t('category.try_adjusting')}</p>

              <Button
                onClick={clearAllFilters}
                variant="outline"
                size="lg"
                className="group hover:!border-primary hover:!text-primary transition-colors"
                leftIcon={<FaTimes className="text-red-500 group-hover:text-primary transition-colors" />}
              >
                {t('category.clear_filters')}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                {productsList.map((product) => <Product key={product._id} product={product} />)}
              </div>

              {/* 🌟 استخدام المكون الجديد */}
              <Pagination page={pageNumber} pages={productsData.pages} onPageChange={setPageNumber} />
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default CategoryScreen;