// filepath: frontend/src/pages/admin/AdminOrderDetailsScreen.jsx
import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import CustomSelect from '../../components/ui/CustomSelect';
import {
  FaBoxOpen, FaExclamationCircle, FaUser, FaShippingFast,
  FaCreditCard, FaClipboardList, FaSave, FaArrowLeft, FaArrowRight,
  FaStickyNote, FaChartLine, FaReceipt,
  FaCheckCircle, FaTimesCircle, FaQuestionCircle, FaSyncAlt
} from 'react-icons/fa';

const AdminOrderDetailsScreen = () => {
  const { id: orderId } = useParams();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang, getDBText } = useLanguage();

  const isFromDashboard = location.state?.from === 'dashboard';

  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingNotes, setIsUpdatingNotes] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [paymentModal, setPaymentModal] = useState({ show: false, newStatus: null });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  const { data: order, isLoading, isError, error } = useQuery({
    queryKey: ['adminOrder', orderId],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.get(`/api/orders/${ orderId }`, config);
      return data;
    },
    enabled: !!userInfo?.isAdmin && !!orderId,
  });

  useEffect(() => {
    if (order) {
      setStatus(order.status);
      setAdminNotes(order.adminNotes || '');
    }
  }, [order]);

  const handleMutationSuccess = (message) => {
    queryClient.invalidateQueries({ queryKey: ['adminOrder', orderId] });
    queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    showToast(message, 'success');
  };

  const updateStatusHandler = async () => {
    setIsUpdatingStatus(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.put(`/api/orders/${ orderId }/status`, { status }, config);
      handleMutationSuccess(lang === 'ar' ? 'تم تحديث الحالة بنجاح' : 'Status updated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    } finally { setIsUpdatingStatus(false); }
  };

  const updateNotesHandler = async () => {
    setIsUpdatingNotes(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.put(`/api/orders/${ orderId }/notes`, { adminNotes }, config);
      handleMutationSuccess(lang === 'ar' ? 'تم حفظ الملاحظات' : 'Notes saved!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save notes', 'error');
    } finally { setIsUpdatingNotes(false); }
  };

  const confirmPaymentUpdate = async () => {
    setIsUpdatingPayment(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.put(`/api/orders/${ orderId }/payment-status`, { isPaid: paymentModal.newStatus }, config);
      setPaymentModal({ show: false, newStatus: null });
      handleMutationSuccess(lang === 'ar' ? 'تم تحديث حالة الدفع' : 'Payment status updated!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update payment', 'error');
    } finally { setIsUpdatingPayment(false); }
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const getStatusColor = (s) => {
    switch (s) {
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'Shipped': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Processing': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
  };

  const getStatusDotColor = (s) => {
    switch (s) {
      case 'Delivered': return 'bg-green-500';
      case 'Cancelled': return 'bg-red-500';
      case 'Shipped': return 'bg-blue-500';
      case 'Processing': return 'bg-orange-500';
      default: return 'bg-yellow-500';
    }
  };

  const statusOptions = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => ({
    value: s,
    label: t(`adminOrderDetails.status_${ s.toLowerCase() }`)
  }));

  if (isError) {
    return (
      <div className="p-4 bg-red-50 border-s-4 border-red-500 m-8 flex items-center gap-3">
        <FaExclamationCircle className="text-red-500" />
        <span className="text-red-700 font-bold">{error.message}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className={`fixed bottom-10 start-1/2 transform -translate-x-1/2 rtl:translate-x-1/2 z-50 transition-all ${ toast.show ? 'opacity-100 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none' }`}>
        <div className={`px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border ${ toast.type === 'success' ? 'bg-dark text-white border-gray-700' : 'bg-red-500 text-white' }`}>
          {toast.type === 'success' ? <FaCheckCircle className="text-primary" /> : <FaExclamationCircle className="text-white" />}
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      </div>

      {paymentModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${ paymentModal.newStatus ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-500' }`}><FaQuestionCircle className="text-3xl" /></div>
            <h3 className="text-2xl font-black text-dark mb-2">{t('adminOrderDetails.update_payment_title')}</h3>
            <p className="text-gray-500 mb-8">{t('adminOrderDetails.update_payment_desc')} <span className={`font-bold ${ paymentModal.newStatus ? 'text-green-600' : 'text-red-600' }`}>{paymentModal.newStatus ? t('adminOrderDetails.paid') : t('adminOrderDetails.not_paid')}</span>?</p>
            <div className="flex gap-3">
              <Button onClick={() => setPaymentModal({ show: false, newStatus: null })} variant="outline" size="md" className="flex-1">{t('adminOrderDetails.cancel')}</Button>
              <Button onClick={confirmPaymentUpdate} disabled={isUpdatingPayment} variant={paymentModal.newStatus ? "primary" : "danger"} size="md" className="flex-1">{isUpdatingPayment ? '...' : t('adminOrderDetails.confirm')}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb steps={[
          { label: t('header.admin_panel'), url: '/admin/dashboard', icon: FaChartLine },
          ...(isFromDashboard ? [] : [{ label: t('adminOrders.all_orders'), url: '/admin/orders', icon: FaReceipt }]),
          { label: t('adminOrderDetails.title'), icon: FaClipboardList }
        ]} />

        <div className="mb-8 flex flex-col md:flex-row justify-between gap-4">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark flex items-center gap-3"><FaReceipt className="text-primary" /> {t('adminOrderDetails.title')}</h1>
            <p className="text-gray-500 font-mono text-sm mt-1">ID: {orderId}</p>
          </div>
          <Button
            to={isFromDashboard ? '/admin/dashboard' : '/admin/orders'}
            variant="outline"
            size="md"
            className="w-full sm:w-auto"
            leftIcon={lang === 'ar' ? <FaArrowRight /> : <FaArrowLeft />}
          >
            {isFromDashboard ? t('adminOrderDetails.back_to_dashboard') : t('adminOrderDetails.back_to_orders')}
          </Button>
        </div>

        {isLoading || !order ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2"><FaUser className="text-primary" /> {t('adminOrderDetails.customer_shipping')}</h2>
                  {order.isGuest && <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-bold">{t('adminOrderDetails.guest_checkout')}</span>}
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><FaUser /> {t('adminOrderDetails.contact_info')}</h3>
                    <p className="font-bold">{order.customer?.name || order.user?.name}</p>
                    <a href={`mailto:${ order.customer?.email || order.user?.email }`} className="text-primary hover:underline text-sm">{order.customer?.email || order.user?.email}</a>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2"><FaShippingFast /> {t('adminOrderDetails.delivery_address')}</h3>
                    <p className="text-sm leading-relaxed">{order.shippingAddress.address}<br />{order.shippingAddress.city}, {order.shippingAddress.country}<br /><span className="text-gray-500 mt-1 block" dir="ltr">{t('adminOrderDetails.phone')} {order.shippingAddress.phoneNumber}</span></p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50"><h2 className="text-xl font-bold flex items-center gap-2"><FaCreditCard className="text-primary" /> {t('adminOrderDetails.payment_method')}</h2></div>
                <div className="p-6 flex flex-col sm:flex-row justify-between gap-4 text-start">
                  <div>
                    <p className="font-bold text-lg">{order.paymentMethod}</p>
                    <p className="text-sm text-gray-500 mt-1">{order.isPaid ? `${ t('adminOrderDetails.paid_on') } ${ new Date(order.paidAt).toLocaleDateString() }` : t('adminOrderDetails.payment_pending')}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${ order.isPaid ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600' }`}>{order.isPaid ? t('adminOrderDetails.paid') : t('adminOrderDetails.not_paid')}</div>
                    <button onClick={() => setPaymentModal({ show: true, newStatus: !order.isPaid })} className="px-4 py-2 rounded-xl text-sm font-bold border hover:bg-gray-50 transition-colors flex items-center gap-1.5 cursor-pointer">{order.isPaid ? <FaTimesCircle className="text-red-500" /> : <FaCheckCircle className="text-green-500" />}</button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50"><h2 className="text-xl font-bold flex items-center gap-2"><FaBoxOpen className="text-primary" /> {t('adminOrderDetails.order_items')}</h2></div>
                <div className="p-6 space-y-4 text-start">
                  {order.orderItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0">
                      <div className="flex gap-4">
                        <img src={item.image} alt={getDBText(item.name)} className="w-16 h-16 object-cover rounded-xl border border-gray-100 bg-gray-50" />
                        <div>
                          <Link to={`/product/${ item.product }`} className="font-bold hover:text-primary transition-colors">{getDBText(item.name)}</Link>
                          <p className="text-sm text-gray-500">{t('adminOrderDetails.qty')} {item.qty}</p>
                        </div>
                      </div>
                      <div className="text-end" dir="ltr">
                        <p className="font-black">{formatCurrency(item.price * item.qty)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8 text-start">
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 rounded-t-3xl"><h2 className="text-xl font-bold flex items-center gap-2"><FaClipboardList className="text-primary" /> {t('adminOrderDetails.manage_status')}</h2></div>
                <div className="p-6 space-y-6">
                  <div>
                    <span className="block text-sm font-bold text-gray-400 uppercase mb-2">{t('adminOrderDetails.current_status')}</span>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${ getStatusColor(order.status) }`}>
                      <div className={`w-2.5 h-2.5 rounded-full ${ getStatusDotColor(order.status) } animate-pulse`}></div>
                      {t(`adminOrderDetails.status_${ order.status?.toLowerCase() }`)}
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-bold text-dark">{t('adminOrderDetails.update_status')}</label>

                    {/* 🌟 قائمة خيارات حالة الطلب المحدثة بالمكون الموحد CustomSelect */}
                    <CustomSelect
                      options={statusOptions}
                      value={status}
                      onChange={(val) => setStatus(val)}
                      placeholder={t('adminOrderDetails.select_status')}
                      triggerClassName="!bg-gray-50 hover:!bg-white !py-3.5"
                      renderValue={(opt) => (
                        <div className="flex items-center gap-2 font-bold text-dark">
                          <div className={`w-2.5 h-2.5 rounded-full ${ opt ? getStatusDotColor(opt.value) : 'bg-gray-300' }`}></div>
                          <span>{opt ? opt.label : t('adminOrderDetails.select_status')}</span>
                        </div>
                      )}
                      renderOption={(opt) => (
                        <div className="flex items-center gap-2.5 font-bold">
                          <div className={`w-2.5 h-2.5 rounded-full ${ getStatusDotColor(opt.value) }`}></div>
                          <span>{opt.label}</span>
                        </div>
                      )}
                    />

                    <Button
                      onClick={updateStatusHandler}
                      disabled={status === order.status}
                      isLoading={isUpdatingStatus}
                      variant="primary"
                      size="md"
                      fullWidth
                      className="mt-2"
                      leftIcon={!isUpdatingStatus && <FaSyncAlt />}
                    >
                      {t('adminOrderDetails.update_status')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50"><h2 className="text-xl font-bold flex items-center gap-2"><FaStickyNote className="text-primary" /> {t('adminOrderDetails.admin_notes')}</h2></div>
                <div className="p-6 space-y-4">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="4"
                    className="w-full p-4 bg-gray-50 rounded-xl border-2 border-gray-200 focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all resize-none"
                    placeholder={t('adminOrderDetails.notes_placeholder')}>
                  </textarea>
                  <Button
                    onClick={updateNotesHandler}
                    disabled={adminNotes === (order.adminNotes || '')}
                    isLoading={isUpdatingNotes}
                    variant="primary"
                    size="md"
                    fullWidth
                    leftIcon={!isUpdatingNotes && <FaSave />}
                  >
                    {t('adminOrderDetails.save_notes')}
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50"><h2 className="text-xl font-bold flex items-center gap-2"><FaReceipt className="text-primary" /> {t('adminOrderDetails.order_summary')}</h2></div>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between text-sm text-gray-600 font-medium"><span>{t('adminOrderDetails.items_total')}</span><span dir="ltr">{formatCurrency(order.itemsPrice)}</span></div>
                  <div className="flex justify-between text-sm text-gray-600 font-medium"><span>{t('adminOrderDetails.shipping')}</span><span dir="ltr">{formatCurrency(order.shippingPrice)}</span></div>
                  <div className="flex justify-between text-sm text-gray-600 font-medium"><span>{t('adminOrderDetails.tax')}</span><span dir="ltr">{formatCurrency(order.taxPrice)}</span></div>
                  <div className="pt-4 border-t border-gray-100 flex justify-between items-center"><span className="text-lg font-black">{t('adminOrderDetails.total')}</span><span className="text-2xl font-black text-primary" dir="ltr">{formatCurrency(order.totalPrice)}</span></div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDetailsScreen;