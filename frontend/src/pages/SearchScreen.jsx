// filepath: frontend/src/pages/SearchScreen.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useLocation, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import Product from '../components/Product';
import ProductSkeleton from '../components/ProductSkeleton';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/ui/Button';
import { FaSearch, FaTimes, FaSlidersH } from 'react-icons/fa';
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

const SearchScreen = () => {
      const location = useLocation();
      const navigate = useNavigate();
      const [searchParams, setSearchParams] = useSearchParams();

      const { t } = useTranslation();
      const { getDBText } = useLanguage();

      const keyword = searchParams.get('keyword') || '';
      const categoryParam = searchParams.get('category') || '';
      const [selectedBrands, setSelectedBrands] = useState(searchParams.get('brands') ? searchParams.get('brands').split(',') : []);
      const [selectedSubCats, setSelectedSubCats] = useState(searchParams.get('subCategories') ? searchParams.get('subCategories').split(',') : []);
      const [selectedOptions, setSelectedOptions] = useState(searchParams.get('options') ? searchParams.get('options').split(',') : []);
      const [pageNumber, setPageNumber] = useState(Number(searchParams.get('pageNumber')) || 1);

      const [isSidebarOpen, setIsSidebarOpen] = useState(false);

      const { data: filtersData } = useQuery({
            queryKey: ['searchFilters', categoryParam],
            queryFn: async () => {
                  const { data } = await axios.get(`/api/products/filters${ categoryParam ? `?category=${ categoryParam }` : '' }`);
                  return data;
            },
      });

      const { data: searchData, isLoading } = useQuery({
            queryKey: ['searchResults', keyword, categoryParam, selectedBrands, selectedSubCats, selectedOptions, pageNumber],
            queryFn: async () => {
                  let query = `/api/products?keyword=${ keyword }&pageNumber=${ pageNumber }`;
                  if (categoryParam) query += `&category=${ categoryParam }`;
                  if (selectedBrands.length > 0) query += `&brands=${ selectedBrands.join(',') }`;
                  if (selectedSubCats.length > 0) query += `&subCategories=${ selectedSubCats.join(',') }`;
                  if (selectedOptions.length > 0) query += `&options=${ selectedOptions.join(',') }`;
                  const { data } = await axios.get(query);
                  return data;
            },
            enabled: !!keyword,
            keepPreviousData: true
      });

      useEffect(() => {
            const params = { keyword };
            if (categoryParam) params.category = categoryParam;
            if (selectedBrands.length > 0) params.brands = selectedBrands.join(',');
            if (selectedSubCats.length > 0) params.subCategories = selectedSubCats.join(',');
            if (selectedOptions.length > 0) params.options = selectedOptions.join(',');
            if (pageNumber > 1) params.pageNumber = pageNumber;
            setSearchParams(params);
      }, [keyword, categoryParam, selectedBrands, selectedSubCats, selectedOptions, pageNumber, setSearchParams]);

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

      const clearSearch = () => {
            navigate('/');
      };

      const availableFilters = filtersData || { brands: [], subCategories: [], options: [] };
      const validSubCategories = availableFilters.subCategories?.filter(sub => sub._id && sub._id.trim() !== '') || [];
      const validBrands = availableFilters.brands?.filter(brand => brand._id && brand._id.trim() !== '') || [];
      const activeFiltersCount = selectedBrands.length + selectedSubCats.length + selectedOptions.length;
      const productsList = searchData?.products || [];

      const renderPagination = () => {
            if (!searchData || searchData.pages <= 1) return null;
            const { page, pages } = searchData;
            const pageNumbers = [];

            for (let i = 1; i <= pages; i++) {
                  if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) pageNumbers.push(i);
            }

            const paginationWithEllipsis = [];
            let prev;
            for (let i of pageNumbers) {
                  if (prev) {
                        if (i - prev === 2) paginationWithEllipsis.push(prev + 1);
                        else if (i - prev !== 1) paginationWithEllipsis.push('...');
                  }
                  paginationWithEllipsis.push(i);
                  prev = i;
            }

            return (
                  <div className="mt-12 flex justify-center items-center gap-2">
                        {paginationWithEllipsis.map((item, index) => {
                              if (item === '...') return <span key={`ellipsis-${ index }`} className="w-10 h-10 flex items-center justify-center text-gray-400 font-black">...</span>;
                              return (
                                    <Button
                                          key={item}
                                          onClick={() => {
                                                setPageNumber(item);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                          variant={item === pageNumber ? 'primary' : 'outline'}
                                          size="sm"
                                          className={`w-10 h-10 sm:w-12 sm:h-12 !p-0 ${ item === pageNumber ? 'scale-110 shadow-xl' : '' }`}
                                    >
                                          {item}
                                    </Button>
                              );
                        })}
                  </div>
            );
      };

      return (
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-light min-h-screen animate-fade-in-up">
                  <div className="mb-4">
                        <Breadcrumb steps={[{ label: t('search.title', 'Search Results'), icon: FaSearch }]} />
                  </div>

                  <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-start">
                        <div>
                              <h1 className="text-2xl md:text-4xl font-extrabold text-dark tracking-tight">
                                    {t('search.title', 'Search Results')} {t('search.for', 'for')} <span className="text-primary">"{keyword}"</span>
                              </h1>
                              <p className="text-gray-500 font-medium mt-2 text-sm">
                                    {t('search.we_found', 'We found')} <span className="font-bold text-dark">{searchData?.products?.length || 0}</span> {t('search.products_matching', 'products matching your criteria.')}
                              </p>
                        </div>
                  </div>

                  <div className="flex flex-col lg:flex-row gap-8 items-start">

                        <div className="lg:hidden w-full flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                              <Button onClick={clearSearch} variant="danger" size="sm">
                                    {t('search.clear_search', 'Clear Search')}
                              </Button>
                              <Button
                                    onClick={() => setIsSidebarOpen(true)}
                                    variant="outline"
                                    size="sm"
                                    leftIcon={<FaSlidersH className="text-primary" />}
                              >
                                    {t('category.filter')}
                                    {activeFiltersCount > 0 && <span className="ms-1 bg-dark text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">{activeFiltersCount}</span>}
                              </Button>
                        </div>

                        <div className={`fixed inset-0 bg-dark/60 z-[60] lg:hidden transition-opacity duration-300 ${ isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible' }`} onClick={() => setIsSidebarOpen(false)}></div>

                        <div className={`fixed top-0 start-0 h-full w-[85vw] sm:w-[350px] bg-white z-[70] lg:z-auto lg:static lg:w-1/4 xl:w-1/5 lg:h-auto lg:bg-transparent lg:translate-x-0 transition-transform duration-500 transform ${ isSidebarOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full' } flex flex-col`}>

                              <div className="lg:hidden flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                                    <h2 className="text-xl font-extrabold text-dark flex items-center gap-2 uppercase tracking-wide"><FaSlidersH className="text-primary" /> {t('category.filter')}</h2>
                                    <button onClick={() => setIsSidebarOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors shadow-sm focus:outline-none cursor-pointer"><FaTimes className="text-lg" /></button>
                              </div>

                              <div className="flex-1 overflow-y-auto p-6 lg:p-6 space-y-8 hide-scrollbar lg:bg-white lg:rounded-3xl lg:border lg:border-gray-100 lg:shadow-sm lg:sticky lg:top-24 text-start">

                                    <div className="hidden lg:flex items-center justify-between mb-2">
                                          <h2 className="text-lg font-extrabold text-dark flex items-center gap-2 uppercase"><FaSlidersH className="text-primary" /> {t('search.filters', 'Filters')}</h2>
                                    </div>

                                    {activeFiltersCount > 0 && (
                                          <Button onClick={clearAllFilters} variant="outline" size="md" fullWidth leftIcon={<FaTimes className="text-red-500" />}>
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
                                                                  <span className={`text-sm font-medium select-none ${ selectedSubCats.includes(sub._id) ? 'text-primary font-bold' : 'text-gray-600' }`}>{sub._id} <span className="text-xs text-gray-400 ms-1">({sub.count})</span></span>
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
                                                                  <span className={`text-sm font-medium select-none ${ selectedBrands.includes(brand._id) ? 'text-primary font-bold' : 'text-gray-600' }`}>{brand._id} <span className="text-xs text-gray-400 ms-1">({brand.count})</span></span>
                                                            </label>
                                                      ))}
                                                </div>
                                          </div>
                                    )}

                                    {availableFilters.options?.map((optGroup, idx) => (
                                          <div key={idx} className="border-t border-gray-100 pt-6">
                                                <h3 className="font-bold text-dark uppercase tracking-wider text-sm mb-4">{getDBText({ en: optGroup._id, ar: optGroup._id })}</h3>
                                                <div className="flex flex-wrap gap-2">
                                                      {[...optGroup.values].filter(val => val && val.trim() !== '').sort(smartSort).map((val, i) => (
                                                            <button key={i} onClick={() => toggleFilter(selectedOptions, setSelectedOptions, val)} className={`min-w-[3.5rem] px-4 py-2.5 rounded-xl border-2 text-sm font-bold transition-all duration-300 focus:outline-none select-none cursor-pointer ${ selectedOptions.includes(val) ? 'border-primary bg-primary/10 text-primary shadow-sm' : 'border-gray-200 text-gray-600 hover:border-dark hover:text-dark hover:bg-gray-50 bg-white' }`}>
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

                        <div className="w-full lg:w-3/4 xl:w-4/5 pb-12">

                              <div className="hidden lg:flex justify-between items-center mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                                    <Button onClick={clearSearch} variant="outline" size="md" leftIcon={<FaTimes className="text-red-500" />}>
                                          {t('search.clear_search', 'Clear Search')}
                                    </Button>
                                    <span className="text-gray-500 font-bold bg-gray-50 px-4 py-2 rounded-lg text-sm">{searchData?.products?.length || 0} {t('category.products_available')}</span>
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
                                          <h2 className="text-3xl font-extrabold text-dark mb-3">{t('search.no_results', 'No matches found')}</h2>
                                          <p className="text-gray-500 font-medium mb-8 max-w-md">{t('search.try_different', 'Try checking for typos or using broader keywords.')}</p>

                                          <Button onClick={clearAllFilters} variant="outline" size="lg">
                                                {t('category.clear_filters')}
                                          </Button>
                                    </div>
                              ) : (
                                    <>
                                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
                                                {productsList.map((product) => <Product key={product._id} product={product} />)}
                                          </div>
                                          {renderPagination()}
                                    </>
                              )}
                        </div>

                  </div>
            </div>
      );
};

export default SearchScreen;