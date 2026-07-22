// filepath: frontend/src/pages/UserOrderDetailsScreen.jsx
import { useContext, useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/ui/Button';
import {
  FaBoxOpen, FaArrowLeft, FaCheckCircle, FaTimesCircle,
  FaShippingFast, FaCreditCard, FaArrowRight, FaSearch, FaLock, FaTimes
} from 'react-icons/fa';

const UserOrderDetailsScreen = () => {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang, getDBText } = useLanguage();
  const queryClient = useQueryClient();

  const [guestToken, setGuestToken] = useState('');
  const [guestOrder, setGuestOrder] = useState(null);
  const [guestError, setGuestError] = useState('');

  const { data: order, isLoading: isUserOrderLoading, isError, error } = useQuery({
    queryKey: ['myOrderDetails', orderId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/orders/${ orderId }`);
      return data;
    },
    enabled: !!userInfo && !!orderId,
  });

  const trackGuestMutation = useMutation({
    mutationFn: async (tokenToUse) => {
      const { data } = await axios.post('/api/orders/guest/track', { orderId, trackingToken: tokenToUse });
      return data;
    },
    onSuccess: (data) => {
      setGuestOrder(data);
      setGuestError('');
    },
    onError: (err) => {
      setGuestError(err.response?.data?.message || t('orderDetails.tracking_error', 'Order not found or tracking token incorrect.'));
    }
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.put(`/api/orders/${ orderId }/cancel`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrderDetails', orderId] });
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
      alert(t('orderDetails.order_cancelled', 'Order cancelled successfully'));
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  });

  const cancelGuestOrderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await axios.put(`/api/orders/guest/${ orderId }/cancel`, { trackingToken: guestToken });
      return data;
    },
    onSuccess: (data) => {
      setGuestOrder(data);
      alert(t('orderDetails.order_cancelled', 'Order cancelled successfully'));
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to cancel order');
    }
  });

  useEffect(() => {
    if (!userInfo && orderId && !guestOrder) {
      const storedOrders = JSON.parse(localStorage.getItem('evox_guest_orders') || '{}');
      const savedToken = storedOrders[orderId];
      if (savedToken) {
        setGuestToken(savedToken);
        trackGuestMutation.mutate(savedToken);
      }
    }
  }, [userInfo, orderId]);

  const trackGuestHandler = (e) => {
    e.preventDefault();
    trackGuestMutation.mutate(guestToken);
  };

  const handleCancelOrder = () => {
    if (window.confirm(t('orderDetails.cancel_confirm', 'Are you sure you want to cancel this order?'))) {
      if (userInfo) cancelOrderMutation.mutate();
      else cancelGuestOrderMutation.mutate();
    }
  };

  if (!userInfo && !guestOrder) {
    if (trackGuestMutation.isPending) {
      return <div className="flex justify-center py-20 min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
    }

    return (
      <div className="container mx-auto px-4 py-16 max-w-md animate-fade-in-up min-h-[60vh] flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-2xl shadow-blue-500/10 border border-gray-100 text-center relative overflow-hidden">
          <div className="absolute top-0 start-0 w-full h-2 bg-gradient-to-r from-dark to-primary"></div>
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaLock className="text-4xl text-dark" />
          </div>
          <h2 className="text-2xl font-black text-dark mb-2">{t('orderDetails.track_guest_title', 'Track Guest Order')}</h2>
          <p className="text-gray-500 mb-8 text-sm font-medium">
            {t('orderDetails.track_guest_desc', 'Please enter your tracking token to view this order.')}
          </p>

          {guestError && (
            <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3">
              <FaTimesCircle className="text-red-500 text-lg shrink-0" />
              <span className="text-red-700 font-bold text-sm text-start">{guestError}</span>
            </div>
          )}

          <form onSubmit={trackGuestHandler} className="space-y-5">
            <div className="relative group">
              <input
                type="text"
                id="guestToken"
                value={guestToken}
                onChange={(e) => setGuestToken(e.target.value.trim())}
                required
                className="block px-4 pb-2.5 pt-6 w-full text-xs font-mono text-dark bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20 peer transition-all text-start"
                placeholder=" "
                dir="ltr"
              />
              <label htmlFor="guestToken" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-transparent px-1">
                {t('orderDetails.tracking_token', 'Tracking Token')}
              </label>
            </div>
            <Button
              type="submit"
              isLoading={trackGuestMutation.isPending}
              variant="secondary"
              size="lg"
              fullWidth
              leftIcon={!trackGuestMutation.isPending && <FaSearch />}
            >
              {t('orderDetails.track_order', 'Track Order')}
            </Button>
          </form>
          <div className="mt-6">
            <Link to="/" className="text-sm font-bold text-gray-400 hover:text-primary transition-colors">{t('home.back_to_home', 'Return to Store')}</Link>
          </div>
        </div>
      </div>
    );
  }

  if (isUserOrderLoading) {
    return <div className="flex justify-center py-20 min-h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (isError && userInfo) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl min-h-[50vh]">
        <div className="p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3">
          <FaTimesCircle className="text-red-500 text-lg flex-shrink-0" />
          <span className="text-red-700 font-bold">{error?.response?.data?.message || t('common.error_occurred', 'An error occurred')}</span>
        </div>
      </div>
    );
  }

  const displayOrder = userInfo ? order : guestOrder;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-fade-in-up">
      <Breadcrumb steps={[
        userInfo ? { label: t('profile.my_account', 'My Account'), url: '/profile?tab=orders' } : { label: t('home.back_to_home', 'Home'), url: '/' },
        { label: `${ t('userOrders.order_id', 'Order') } #${ orderId.substring(18).toUpperCase() }`, icon: FaBoxOpen }
      ]} />

      <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-100 mt-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 border-b border-gray-100 pb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark flex items-center gap-3">
              <FaBoxOpen className="text-primary" /> {t('orderDetails.title')}
            </h1>
            <p className="text-gray-500 font-medium mt-1 font-mono text-sm">{t('userOrders.order_id', 'ID:')} {orderId}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {!displayOrder.isDelivered && displayOrder.status !== 'Shipped' && !displayOrder.isCancelled && (
              <Button
                onClick={handleCancelOrder}
                isLoading={cancelOrderMutation.isPending || cancelGuestOrderMutation.isPending}
                variant="danger"
                size="md"
                className="w-full sm:w-auto"
                leftIcon={<FaTimes />}
              >
                {t('orderDetails.cancel_order', 'Cancel Order')}
              </Button>
            )}
            {userInfo && (
              <Button
                to="/profile?tab=orders"
                variant="outline"
                size="md"
                className="w-full sm:w-auto"
                leftIcon={lang === 'ar' ? <FaArrowRight /> : <FaArrowLeft />}
              >
                {t('orderDetails.back_to_profile')}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <FaShippingFast className="text-primary text-lg rtl:-scale-x-100" /> {t('orderDetails.shipping_to')}
            </h3>
            <p className="font-bold text-dark text-lg mb-1">{displayOrder.shippingAddress.address}</p>
            <p className="font-medium text-gray-600 mb-2">{displayOrder.shippingAddress.city}, {displayOrder.shippingAddress.country}</p>
            <p className="font-medium text-gray-500 text-sm" dir="ltr">{t('orderDetails.phone')} {displayOrder.shippingAddress.phoneNumber}</p>
          </div>

          <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
            <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <FaCreditCard className="text-primary text-lg" /> {t('orderDetails.order_status')}
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-dark text-sm">{t('orderDetails.payment')}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${ displayOrder.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' }`}>
                  {displayOrder.isPaid ? <><FaCheckCircle /> {t('orderDetails.paid_on')} {displayOrder.paidAt.substring(0, 10)}</> : <><FaTimesCircle /> {t('orderDetails.unpaid')}</>}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-dark text-sm">{t('orderDetails.delivery')}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${ displayOrder.status === 'Cancelled' ? 'bg-red-100 text-red-700' : displayOrder.isDelivered ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700' }`}>
                  {displayOrder.status || (displayOrder.isDelivered ? t('orderDetails.delivered') : t('orderDetails.pending'))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-gray-500 uppercase tracking-widest text-xs mb-4">{t('orderDetails.purchased_items')}</h3>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            {displayOrder.orderItems.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50/30 transition-colors gap-4">
                <div className="flex items-center gap-4">
                  <img src={item.image} alt={getDBText(item.name)} className="w-16 h-16 rounded-xl object-cover border border-gray-100 bg-white" />
                  <div>
                    <Link to={`/product/${ item.product }`} className="font-bold text-dark hover:text-primary transition-colors line-clamp-1">
                      {getDBText(item.name, item.name)}
                    </Link>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t('orderDetails.qty')}: {item.qty}</span>
                      {item.selectedSize && <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t('orderDetails.size')}: {item.selectedSize}</span>}
                    </div>
                  </div>
                </div>
                <span className="font-black text-primary text-lg text-end sm:text-start" dir="ltr">${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex flex-col items-end gap-2 text-sm text-gray-600 font-medium mb-4">
            <div className="flex justify-between w-48"><span>{t('orderDetails.subtotal')}</span><span dir="ltr">${displayOrder.itemsPrice.toFixed(2)}</span></div>
            <div className="flex justify-between w-48"><span>{t('orderDetails.shipping')}</span><span dir="ltr">${displayOrder.shippingPrice.toFixed(2)}</span></div>
            <div className="flex justify-between w-48"><span>{t('orderDetails.tax')}</span><span dir="ltr">${displayOrder.taxPrice.toFixed(2)}</span></div>
          </div>
          <div className="flex justify-end items-center gap-4">
            <span className="text-lg font-bold text-dark">{t('orderDetails.total_paid')}</span>
            <span className="text-4xl font-black text-primary" dir="ltr">${displayOrder.totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserOrderDetailsScreen;