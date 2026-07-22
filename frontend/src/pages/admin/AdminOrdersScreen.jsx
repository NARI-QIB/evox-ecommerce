// filepath: frontend/src/pages/admin/AdminOrdersScreen.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import Pagination from '../../components/Pagination'; // 🌟 
import {
  FaExclamationCircle, FaReceipt, FaChartLine,
  FaCheck, FaTimes, FaSearch, FaArrowRight, FaArrowLeft
} from 'react-icons/fa';

const AdminOrdersScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang } = useLanguage();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminOrders', page, keyword],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const res = await axios.get(`/api/orders?pageNumber=${ page }&keyword=${ keyword }`, config);
      return res.data;
    },
    enabled: !!userInfo?.isAdmin,
    keepPreviousData: true,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Breadcrumb
          steps={[
            { label: t('header.admin_panel'), url: '/admin/dashboard', icon: FaChartLine },
            { label: t('adminOrders.all_orders'), icon: FaReceipt }
          ]}
        />

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark tracking-tight flex items-center gap-3">
              <FaReceipt className="text-primary" /> {t('adminOrders.management_title')}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {t('adminOrders.management_desc')}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={t('adminOrders.search_placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full ps-11 pe-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 text-sm font-bold transition-all bg-white shadow-sm text-start"
            />
            <FaSearch className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer">
                <FaTimes />
              </button>
            )}
          </form>
        </div>

        {isError && (
          <div className="mb-8 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up">
            <FaExclamationCircle className="text-red-500 text-lg flex-shrink-0" />
            <span className="text-red-700 font-bold">{error?.response?.data?.message || error.message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-bold">{t('adminOrders.loading')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="p-5 font-bold">{t('adminOrders.col_id')}</th>
                    <th className="p-5 font-bold">{t('adminOrders.col_user')}</th>
                    <th className="p-5 font-bold">{t('adminOrders.col_date')}</th>
                    <th className="p-5 font-bold">{t('adminOrders.col_total')}</th>
                    <th className="p-5 font-bold text-center">{t('adminOrders.col_paid')}</th>
                    <th className="p-5 font-bold text-center">{t('adminOrders.col_status')}</th>
                    <th className="p-5 font-bold text-center">{t('adminOrders.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.orders?.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-5 font-mono text-sm font-bold text-gray-500 text-start">#{order._id.substring(18).toUpperCase()}</td>
                      <td className="p-5 text-start">
                        <div className="font-bold text-base text-dark">
                          {order.user?.name || order.customer?.name || 'Guest'}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-0.5">
                          {order.isGuest ? t('adminOrders.guest_checkout') : t('adminOrders.registered')}
                        </div>
                      </td>
                      <td className="p-5 text-sm font-semibold text-gray-500 text-start">
                        {new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </td>
                      <td className="p-5 font-black text-primary text-base text-start" dir="ltr">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="p-5 text-center">
                        {order.isPaid ? (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-green-50 text-green-500 rounded-full border border-green-100">
                            <FaCheck className="text-sm" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-red-50 text-red-500 rounded-full border border-red-100">
                            <FaTimes className="text-sm" />
                          </span>
                        )}
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm ${ order.status === 'Delivered' ? 'bg-green-50 text-green-600 border border-green-100' :
                          order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                          }`}>
                          {order.status || (order.isDelivered ? 'Delivered' : 'Pending')}
                        </span>
                      </td>
                      <td className="p-5 text-center">
                        <Button
                          to={`/admin/order/${ order._id }`}
                          state={{ from: 'orders' }}
                          variant="secondary"
                          size="sm"
                          className="!py-2 !px-4 text-xs font-bold"
                        >
                          {t('adminOrders.btn_manage')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden flex flex-col divide-y divide-gray-100">
              {data?.orders?.map((order) => (
                <div key={order._id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col gap-4">

                  <div className="flex justify-between items-start">
                    <div className="text-start">
                      <div className="font-extrabold text-base text-dark">
                        {order.user?.name || order.customer?.name || 'Guest'}
                      </div>
                      <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded-md text-gray-600 font-bold">#{order._id.substring(18).toUpperCase()}</span>
                        <span>• {order.isGuest ? t('adminOrders.guest_checkout') : t('adminOrders.registered')}</span>
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="font-black text-primary text-lg" dir="ltr">
                        {formatCurrency(order.totalPrice)}
                      </div>
                      <div className="text-xs text-gray-400 font-medium mt-1">
                        {new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      {order.isPaid ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-green-50 text-green-500 rounded-full border border-green-100">
                          <FaCheck className="text-xs" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 bg-red-50 text-red-500 rounded-full border border-red-100">
                          <FaTimes className="text-xs" />
                        </span>
                      )}
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${ order.status === 'Delivered' ? 'bg-green-50 text-green-600 border border-green-100' :
                        order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100'
                        }`}>
                        {order.status || (order.isDelivered ? 'Delivered' : 'Pending')}
                      </span>
                    </div>

                    <Button
                      to={`/admin/order/${ order._id }`}
                      state={{ from: 'orders' }}
                      variant="secondary"
                      size="sm"
                      className="!py-2 !px-4 text-xs font-bold"
                      rightIcon={lang === 'ar' ? <FaArrowLeft className="text-xs" /> : <FaArrowRight className="text-xs" />}
                    >
                      {t('adminOrders.btn_manage')}
                    </Button>
                  </div>

                </div>
              ))}
            </div>

            {data?.orders?.length === 0 && (
              <div className="p-12 text-center text-gray-500 font-medium flex flex-col items-center justify-center">
                <FaReceipt className="text-4xl text-gray-300 mb-3" />
                {t('adminOrders.no_orders_found')}
              </div>
            )}

            {/* 🌟 استخدام مكون الترقيم الموحد */}
            <div className="px-4 border-t border-gray-50">
              <Pagination page={page} pages={data?.pages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersScreen;