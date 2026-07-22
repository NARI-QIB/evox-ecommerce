// filepath: frontend/src/pages/admin/AdminDashboard.jsx
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import {
  FaDollarSign, FaBoxOpen, FaUsers, FaShoppingCart,
  FaChartLine, FaExclamationCircle, FaClock,
  FaExclamationTriangle, FaCheckCircle, FaArrowLeft, FaArrowRight, FaCog
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { getDBText, lang } = useLanguage();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const [statsRes, ordersRes, lowStockRes] = await Promise.all([
        axios.get('/api/dashboard', config),
        axios.get('/api/dashboard/latest-orders', config),
        axios.get('/api/dashboard/low-stock', config)
      ]);
      return {
        stats: statsRes.data,
        recentOrders: ordersRes.data,
        lowStockProducts: lowStockRes.data
      };
    },
    enabled: !!userInfo?.isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 max-w-7xl mx-auto px-4">
        <div className="p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3">
          <FaExclamationCircle className="text-red-500 text-lg" />
          <span className="text-red-700 font-bold">{error?.response?.data?.message || error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Breadcrumb steps={[{ label: t('adminLayout.overview'), icon: FaChartLine }]} />

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark tracking-tight flex items-center gap-3">
              <FaChartLine className="text-primary" /> {t('admin.system_overview')}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {t('admin.monitor_metrics')}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-bold">{t('admin.loading_analytics')}</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              <Link to="/admin/analytics" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md hover:border-green-200 transition-all block cursor-pointer">
                <div className="absolute top-0 inset-e-0 w-24 h-24 bg-green-50 rounded-full blur-xl -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3 group-hover:bg-green-100 transition-colors"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className="text-start">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-green-600 transition-colors">
                      {t('admin.total_revenue')}
                    </p>
                    <h3 className="text-2xl font-black text-dark" dir="ltr">{formatCurrency(data.stats.totalSales)}</h3>
                  </div>
                  <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                    <FaDollarSign className="text-2xl" />
                  </div>
                </div>
              </Link>

              <Link to="/admin/orders" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md hover:border-blue-200 transition-all block cursor-pointer">
                <div className="absolute top-0 inset-e-0 w-24 h-24 bg-blue-50 rounded-full blur-xl -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3 group-hover:bg-blue-100 transition-colors"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className="text-start">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                      {t('admin.total_orders')}
                    </p>
                    <h3 className="text-2xl font-black text-dark">{data.stats.ordersCount}</h3>
                  </div>
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FaShoppingCart className="text-2xl" />
                  </div>
                </div>
              </Link>

              <Link to="/admin/users" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md hover:border-purple-200 transition-all block cursor-pointer">
                <div className="absolute top-0 inset-e-0 w-24 h-24 bg-purple-50 rounded-full blur-xl -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3 group-hover:bg-purple-100 transition-colors"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className="text-start">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-purple-600 transition-colors">
                      {t('adminLayout.customers')}
                    </p>
                    <h3 className="text-2xl font-black text-dark">{data.stats.usersCount}</h3>
                  </div>
                  <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <FaUsers className="text-2xl" />
                  </div>
                </div>
              </Link>

              <Link to="/admin/products" className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md hover:border-orange-200 transition-all block cursor-pointer">
                <div className="absolute top-0 inset-e-0 w-24 h-24 bg-orange-50 rounded-full blur-xl -translate-y-1/2 translate-x-1/3 rtl:-translate-x-1/3 group-hover:bg-orange-100 transition-colors"></div>
                <div className="relative z-10 flex items-start justify-between">
                  <div className="text-start">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 group-hover:text-orange-600 transition-colors">
                      {t('admin.active_products')}
                    </p>
                    <h3 className="text-2xl font-black text-dark">{data.stats.productsCount}</h3>
                  </div>
                  <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <FaBoxOpen className="text-2xl" />
                  </div>
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                  <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                    <FaClock className="text-primary" /> {t('admin.latest_orders')}
                  </h2>
                  <Button
                    to="/admin/orders"
                    variant="ghost"
                    size="sm"
                    className="group !py-1.5 !px-3 text-xs font-black uppercase tracking-widest !text-primary hover:!bg-primary/10 hover:!text-primary !border-transparent transition-all duration-300"
                    rightIcon={lang === 'ar' ? <FaArrowLeft className="text-xs transition-transform group-hover:-translate-x-1" /> : <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />}
                  >
                    {t('admin.view_all')}
                  </Button>
                </div>

                {/* 🌟 نسخة الشاشات الكبيرة (Desktop Table View - مخفية في الهواتف) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-start border-collapse">
                    <thead>
                      <tr className="bg-white border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                        <th className="p-4 font-bold">{t('adminOrders.col_id')}</th>
                        <th className="p-4 font-bold">{t('adminOrders.col_user')}</th>
                        <th className="p-4 font-bold">{t('adminOrders.col_date')}</th>
                        <th className="p-4 font-bold">{t('adminOrders.col_total')}</th>
                        <th className="p-4 font-bold">{t('adminOrders.col_status')}</th>
                        <th className="p-4 font-bold text-center">{t('adminOrders.col_actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-mono text-xs text-gray-500">#{order._id.substring(18)}</td>
                          <td className="p-4 font-bold text-sm text-dark text-start">{order.user?.name || order.customer?.name || t('admin.guest')}</td>
                          <td className="p-4 text-sm text-gray-500 text-start">{new Date(order.createdAt).toLocaleDateString()}</td>
                          <td className="p-4 font-bold text-sm text-dark text-start" dir="ltr">{formatCurrency(order.totalPrice)}</td>
                          <td className="p-4 text-start">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${ order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                              order.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                              }`}>
                              {order.status || (order.isDelivered ? 'Delivered' : 'Pending')}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              to={`/admin/order/${ order._id }`}
                              state={{ from: 'dashboard' }}
                              variant="secondary"
                              size="sm"
                              className="text-xs !py-1.5 !px-3 font-bold"
                            >
                              {t('admin.manage')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {data.recentOrders.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-500 font-medium">
                            {t('admin.no_recent_orders')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 🌟 نسخة الهواتف الذكية (Mobile Responsive View - حركية ودون تمرير جانبي) */}
                <div className="lg:hidden flex flex-col divide-y divide-gray-100">
                  {data.recentOrders.map((order) => (
                    <div key={order._id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col gap-4">

                      <div className="flex justify-between items-start">
                        <div className="text-start">
                          <div className="font-extrabold text-base text-dark">
                            {order.user?.name || order.customer?.name || t('admin.guest')}
                          </div>
                          <div className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1">
                            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded-md text-gray-600 font-bold">#{order._id.substring(18).toUpperCase()}</span>
                            <span>• {new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="font-black text-primary text-lg" dir="ltr">
                            {formatCurrency(order.totalPrice)}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div>
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm ${ order.status === 'Delivered' ? 'bg-green-50 text-green-600' :
                            order.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                            }`}>
                            {order.status || (order.isDelivered ? 'Delivered' : 'Pending')}
                          </span>
                        </div>

                        <Button
                          to={`/admin/order/${ order._id }`}
                          state={{ from: 'dashboard' }}
                          variant="secondary"
                          size="sm"
                          className="!py-2 !px-4 text-xs font-bold"
                          rightIcon={lang === 'ar' ? <FaArrowLeft className="text-xs" /> : <FaArrowRight className="text-xs" />}
                        >
                          {t('admin.manage')}
                        </Button>
                      </div>

                    </div>
                  ))}
                  {data.recentOrders.length === 0 && (
                    <div className="p-8 text-center text-gray-500 font-medium">
                      {t('admin.no_recent_orders')}
                    </div>
                  )}
                </div>

              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
                  <h2 className="text-lg font-bold text-dark flex items-center gap-2">
                    <FaExclamationTriangle className="text-red-500" /> {t('admin.low_stock_alerts')}
                  </h2>
                  <Button
                    to="/admin/products"
                    variant="ghost"
                    size="sm"
                    className="group !bg-red-50 !text-red-600 hover:!bg-red-600 hover:!text-white !border-transparent !py-2 !px-4 transition-colors duration-300"
                    rightIcon={<FaCog className="text-xs transition-transform group-hover:rotate-90" />}
                  >
                    {t('admin.manage')}
                  </Button>
                </div>
                <div className="p-4">
                  {data.lowStockProducts.length > 0 ? (
                    <div className="space-y-4">
                      {data.lowStockProducts.map(product => (
                        <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100 hover:border-red-200 transition-colors">
                          <div className="text-start">
                            <p className="font-bold text-sm text-dark truncate w-40">{getDBText(product.name)}</p>
                            <p className="text-xs text-gray-400 font-medium">{product.brand}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-lg text-xs font-black flex items-center gap-1 ${ product.countInStock === 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600' }`}>
                            {product.countInStock} {t('admin.left_in_stock')}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <FaCheckCircle className="text-4xl text-green-100 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium text-sm">
                        {t('admin.inventory_good')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;