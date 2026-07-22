// filepath: frontend/src/components/profile/UserOrders.jsx
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import {
  FaBoxOpen, FaCheck, FaEye, FaExclamationCircle, FaArrowRight, FaTimes
} from 'react-icons/fa';

const UserOrders = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang } = useLanguage();

  const { data: orders = [], isLoading, isError, error } = useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.get('/api/orders/mine', config);
      return data;
    },
    enabled: !!userInfo,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 w-full relative overflow-hidden">
      <div className="absolute top-0 inset-e-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4 relative z-10">
        <div className="p-2.5 bg-blue-50 rounded-xl"><FaBoxOpen className="text-xl text-primary" /></div>
        <h2 className="text-2xl font-extrabold text-dark tracking-tight text-start">{t('userOrders.title')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-xl border border-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 shadow-sm animate-fade-in-up">
          <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
          <span className="text-red-700 font-bold text-sm">{error?.response?.data?.message || 'Error loading orders'}</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border border-dashed border-gray-200 animate-fade-in-up">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 mx-auto mb-6">
            <circle cx="100" cy="100" r="100" fill="#F0FDF4" />
            <rect x="50" y="80" width="100" height="80" rx="10" fill="#fff" stroke="#1E293B" strokeWidth="8" strokeLinejoin="round" />
            <path d="M50 100l50 30 50-30M100 130v30" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M60 60h80v20H60z" fill="#22D3EE" stroke="#1E293B" strokeWidth="8" strokeLinejoin="round" />
            <circle cx="140" cy="40" r="15" fill="#F97316" />
          </svg>
          <h3 className="text-2xl font-extrabold text-dark mb-2">{t('userOrders.empty_title')}</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">{t('userOrders.empty_desc')}</p>
          <Button to="/" variant="primary" size="lg" rightIcon={<FaArrowRight className="rtl:rotate-180" />}>
            {t('userOrders.start_shopping')}
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-4 animate-fade-in-up">
          <table className="w-full text-start border-collapse min-w-150">
            <thead>
              <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-5 font-bold rounded-s-2xl">{t('userOrders.order_id')}</th>
                <th className="p-5 font-bold">{t('userOrders.date')}</th>
                <th className="p-5 font-bold">{t('userOrders.total')}</th>
                <th className="p-5 font-bold">{t('userOrders.status')}</th>
                <th className="p-5 font-bold text-center rounded-e-2xl">{t('userOrders.action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors duration-300 group">
                  <td className="p-5 text-sm font-black text-dark font-mono">#{order._id.substring(18).toUpperCase()}</td>
                  <td className="p-5 text-sm font-semibold text-gray-500">{new Date(order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                  <td className="p-5 text-base font-black text-primary" dir="ltr">${order.totalPrice.toFixed(2)}</td>
                  <td className="p-5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${ order.status === 'Cancelled' ? 'bg-red-50 text-red-600 border border-red-100' : order.isDelivered ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-yellow-50 text-yellow-600 border border-yellow-100' }`}>
                      {order.status === 'Cancelled' ? <><FaTimes /> {t('adminOrderDetails.status_cancelled')}</> : order.isDelivered ? <><FaCheck /> {t('userOrders.delivered')}</> : t('userOrders.processing')}
                    </span>
                  </td>
                  <td className="p-5 text-center">
                    <Button
                      to={`/profile/order/${ order._id }`}
                      variant="secondary"
                      size="sm"
                      className="inline-flex !py-2 !px-4 text-xs font-bold animate-fade-in-up"
                      leftIcon={<FaEye className="text-xs" />}
                    >
                      {t('userOrders.view')}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserOrders;