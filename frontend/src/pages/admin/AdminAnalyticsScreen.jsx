// filepath: frontend/src/pages/admin/AdminAnalyticsScreen.jsx
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import {
  FaExclamationCircle, FaChartLine, FaChartBar, FaArrowLeft, FaArrowRight,
  FaDollarSign, FaInbox, FaCalendarAlt, FaTags
} from 'react-icons/fa';

const AdminAnalyticsScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { lang, getDBText } = useLanguage();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const [monthlyRes, categoryRes, statsRes] = await Promise.all([
        axios.get('/api/dashboard/monthly-sales', config),
        axios.get('/api/dashboard/sales-by-category', config),
        axios.get('/api/dashboard', config)
      ]);
      return {
        monthlySales: monthlyRes.data,
        salesByCategory: categoryRes.data,
        totalRevenue: statsRes.data.totalSales
      };
    },
    enabled: !!userInfo?.isAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getMonthName = (monthNumber) => {
    const date = new Date();
    date.setMonth(monthNumber - 1);
    return date.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
  };

  const categoryColorThemes = [
    'bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-600 group-hover:text-white',
    'bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-600 group-hover:text-white',
    'bg-orange-50 text-orange-600 border-orange-200 group-hover:bg-orange-600 group-hover:text-white',
    'bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white',
    'bg-pink-50 text-pink-600 border-pink-200 group-hover:bg-pink-600 group-hover:text-white'
  ];

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
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb steps={[
          { label: lang === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard', url: '/admin/dashboard', icon: FaChartLine },
          { label: lang === 'ar' ? 'تحليل المبيعات' : 'Sales Analytics', icon: FaChartBar }
        ]} />

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark tracking-tight flex items-center gap-3">
              <FaChartBar className="text-primary" /> {lang === 'ar' ? 'الأرباح والتحليلات' : 'Revenue & Analytics'}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {lang === 'ar' ? 'تفصيل دقيق للأداء المالي للمتجر.' : 'Detailed breakdown of store financial performance.'}
            </p>
          </div>
          <Button
            to="/admin/dashboard"
            variant="secondary"
            size="md"
            className="w-full md:w-auto"
            leftIcon={lang === 'ar' ? <FaArrowRight /> : <FaArrowLeft />}
          >
            {lang === 'ar' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
            <p className="text-gray-500 font-medium">{lang === 'ar' ? 'جاري معالجة البيانات...' : 'Processing analytics data...'}</p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in-up">
            <div className="relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 isolate group hover:shadow-md transition-shadow">
              <div className="absolute top-0 end-0 w-72 h-72 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 rtl:-translate-x-1/4 -z-10 group-hover:from-primary/20 group-hover:to-blue-500/20 transition-colors duration-700"></div>
              <div className="absolute bottom-0 start-0 w-56 h-56 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 rtl:translate-x-1/4 -z-10 group-hover:from-purple-500/20 transition-colors duration-700"></div>

              <div className="z-10 w-full md:w-auto text-center md:text-start">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <span className="w-10 h-1.5 bg-gradient-to-r from-primary to-blue-500 rounded-full"></span>
                  <p className="text-gray-400 font-black tracking-widest uppercase text-sm">
                    {lang === 'ar' ? 'صافي الأرباح الكلية' : 'Lifetime Net Revenue'}
                  </p>
                </div>
                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-dark via-primary to-blue-700 drop-shadow-sm" dir="ltr">
                  {formatCurrency(data.totalRevenue)}
                </h2>
                <p className="text-sm text-gray-500 mt-4 font-medium bg-gray-50 inline-block px-4 py-1.5 rounded-lg border border-gray-100">
                  {lang === 'ar' ? 'إجمالي الأرباح من جميع الطلبات المدفوعة والمكتملة.' : 'Total earnings from all completed & paid orders.'}
                </p>
              </div>

              <div className="z-10 relative mt-2 md:mt-0">
                <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-[2rem] blur-xl"></div>
                <div className="w-28 h-28 bg-gradient-to-br from-primary to-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-primary/40 transform -rotate-6 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500">
                  <FaDollarSign className="text-6xl text-white drop-shadow-lg" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><FaCalendarAlt className="text-xl" /></div>
                    <h2 className="text-xl font-bold text-dark">{lang === 'ar' ? 'الأداء الشهري' : 'Monthly Performance'}</h2>
                  </div>
                </div>
                {data.monthlySales.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FaInbox className="text-5xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-dark mb-1">{lang === 'ar' ? 'لا توجد بيانات' : 'No Data Available'}</h3>
                    <p className="text-sm text-gray-500 text-center max-w-xs">{lang === 'ar' ? 'ستظهر الطلبات المدفوعة هنا مقسمة حسب الأشهر.' : 'Paid orders will appear here organized by month.'}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {data.monthlySales.map((item, index) => (
                      <div key={index} className="relative overflow-hidden bg-gray-50 border border-gray-100 hover:border-blue-200 rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md group cursor-default">
                        <div className="absolute -end-4 -top-4 w-16 h-16 bg-blue-100/50 rounded-full z-0 group-hover:scale-[2.5] transition-transform duration-500"></div>
                        <span className="relative z-10 text-xs font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">
                          {getMonthName(item.month)} {item.year}
                        </span>
                        <span className="relative z-10 text-lg font-black text-dark" dir="ltr">{formatCurrency(item.totalSales)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-500 rounded-lg"><FaTags className="text-xl" /></div>
                    <h2 className="text-xl font-bold text-dark">{lang === 'ar' ? 'الأرباح حسب القسم' : 'Revenue by Category'}</h2>
                  </div>
                </div>
                {data.salesByCategory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                    <FaInbox className="text-5xl text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-dark mb-1">{lang === 'ar' ? 'لا توجد بيانات' : 'No Data Available'}</h3>
                    <p className="text-sm text-gray-500 text-center max-w-xs">{lang === 'ar' ? 'ستظهر بيانات الأقسام هنا بمجرد بيع المنتجات.' : 'Categories data will be generated here once you sell products.'}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {data.salesByCategory.map((category, index) => {
                      const colorTheme = categoryColorThemes[index % categoryColorThemes.length];
                      const categoryName = getDBText(category.category, lang === 'ar' ? 'غير مصنف' : 'Uncategorized');

                      return (
                        <div key={index} className="flex items-center p-4 bg-white border border-gray-100 rounded-2xl hover:shadow-md hover:border-gray-200 transition-all duration-300 group cursor-default">
                          <div className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-lg border transition-all duration-300 me-4 ${ colorTheme }`}>
                            {categoryName.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0 pe-4 text-start">
                            <h3 className="font-bold text-dark text-sm capitalize truncate">{categoryName}</h3>
                            <p className="text-xs text-gray-400 font-bold mt-0.5">{category.totalSold} {lang === 'ar' ? 'قطعة مُباعة' : 'Units Sold'}</p>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <span className="block font-black text-lg text-dark group-hover:text-primary transition-colors" dir="ltr">
                              {formatCurrency(category.totalRevenue)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsScreen;