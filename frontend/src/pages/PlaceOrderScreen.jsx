// filepath: frontend/src/pages/PlaceOrderScreen.jsx
import { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import CheckoutSteps from '../components/CheckoutSteps';
import Button from '../components/ui/Button';
import { FaCheckCircle, FaExclamationCircle, FaBoxOpen, FaArrowRight, FaCopy } from 'react-icons/fa';

const PlaceOrderScreen = () => {
  const { cartItems, shippingAddress, paymentMethod, clearCart } = useContext(CartContext);
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { getDBText } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successModal, setSuccessModal] = useState({ show: false, orderId: '', trackingToken: '' });

  const isOrderPlaced = useRef(false);

  // 🌟 إغلاق التمرير عند ظهور نافذة النجاح (Scroll Lock)
  useEffect(() => {
    if (successModal.show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [successModal.show]);

  const addDecimals = (num) => (Math.round(num * 100) / 100).toFixed(2);
  const itemsPrice = addDecimals(cartItems.reduce((acc, item) => acc + item.price * item.qty, 0));
  const shippingPrice = addDecimals(itemsPrice > 100 ? 0 : 10);
  const taxPrice = addDecimals(Number((0.15 * itemsPrice).toFixed(2)));
  const totalPrice = (Number(itemsPrice) + Number(shippingPrice) + Number(taxPrice)).toFixed(2);

  useEffect(() => {
    if (!paymentMethod) navigate('/payment');
    if (cartItems.length === 0 && !isOrderPlaced.current) navigate('/cart');
  }, [paymentMethod, cartItems, navigate]);

  const placeOrderHandler = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderData = {
        orderItems: cartItems.map(item => ({
          name: item.name,
          qty: item.qty,
          product: item.product || item._id,
          selectedSize: item.selectedSize || ''
        })),
        shippingAddress: {
          address: shippingAddress.address,
          city: shippingAddress.city,
          postalCode: shippingAddress.postalCode || '',
          country: shippingAddress.country,
          phoneNumber: shippingAddress.phoneNumber
        },
        paymentMethod,
      };

      isOrderPlaced.current = true;

      if (userInfo) {
        const { data } = await axios.post('/api/orders', orderData);
        clearCart();
        navigate(`/profile/order/${ data._id }`);
      } else {
        orderData.guestCustomer = {
          name: shippingAddress.fullName,
          email: shippingAddress.email
        };

        const { data } = await axios.post('/api/orders/guest', orderData);

        const storedGuestOrders = JSON.parse(localStorage.getItem('evox_guest_orders') || '{}');
        storedGuestOrders[data._id] = data.guestTrackingToken;
        localStorage.setItem('evox_guest_orders', JSON.stringify(storedGuestOrders));

        clearCart();
        setSuccessModal({ show: true, orderId: data._id, trackingToken: data.guestTrackingToken });
      }

    } catch (err) {
      isOrderPlaced.current = false;
      setError(err.response?.data?.message || 'Failed to place order');
      setLoading(false);
    }
  };

  const closeSuccessModal = () => {
    const targetOrderId = successModal.orderId;
    setSuccessModal({ show: false, orderId: '', trackingToken: '' });
    navigate(`/order/${ targetOrderId }`);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(t('placeOrder.token_copied', 'Tracking Token Copied!'));
  };

  const displayFullName = shippingAddress?.fullName || userInfo?.name || 'Guest User';
  const displayEmail = shippingAddress?.email || userInfo?.email || 'No email provided';

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative">

      {successModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-md w-full shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 start-0 w-full h-2 bg-green-500"></div>
            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-5xl" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-dark mb-2">{t('placeOrder.order_confirmed')}</h3>
            <p className="text-gray-500 font-medium mb-2">{t('placeOrder.thank_you')} <span className="text-dark font-bold">{displayFullName.split(' ')[0]}</span>.</p>
            <p className="text-gray-500 text-sm mb-6">{t('placeOrder.success_msg')} <span className="text-dark font-bold" dir="ltr">{shippingAddress?.phoneNumber}</span>.</p>

            <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 flex flex-col items-start gap-1">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{t('placeOrder.order_id')}</span>
              <span className="font-mono font-black text-primary text-base">{successModal.orderId.substring(18).toUpperCase()}</span>
            </div>

            {!userInfo && (
              <div className="bg-blue-50/50 rounded-xl p-4 mb-8 border border-blue-100 flex flex-col items-start gap-2">
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">{t('placeOrder.tracking_token', 'Secret Tracking Token')}</span>
                <div className="flex items-center gap-2 w-full">
                  <input type="text" readOnly value={successModal.trackingToken} className="w-full bg-white border border-blue-100 text-xs font-mono text-dark p-2 rounded-lg focus:outline-none" />
                  <button onClick={() => copyToClipboard(successModal.trackingToken)} className="bg-blue-500 text-white p-2.5 rounded-lg hover:bg-blue-600 transition-colors">
                    <FaCopy />
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-1 text-start">
                  {t('placeOrder.save_token_msg', 'We saved this token in your browser. Copy it if you want to track your order from another device.')}
                </p>
              </div>
            )}

            <Button
              onClick={closeSuccessModal}
              variant="primary"
              size="lg"
              fullWidth
              rightIcon={<FaArrowRight className="rtl:rotate-180" />}
            >
              {t('placeOrder.view_order_details', 'View Order Details')}
            </Button>
          </div>
        </div>
      )}

      <CheckoutSteps step1 step2 step3 step4 />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">

        <div className="lg:col-span-2 space-y-6">

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-start">
            <h2 className="text-xl font-bold text-dark mb-4 border-b border-gray-100 pb-4">{t('placeOrder.shipping_info')}</h2>
            <p className="text-gray-600 font-medium mb-1"><strong className="text-dark">{t('placeOrder.name')}</strong> {displayFullName}</p>
            <p className="text-gray-600 font-medium mb-1"><strong className="text-dark">{t('placeOrder.email')}</strong> {displayEmail}</p>
            <p className="text-gray-600 font-medium mb-1"><strong className="text-dark">{t('placeOrder.phone')}</strong> <span dir="ltr">{shippingAddress?.phoneNumber}</span></p>
            <p className="text-gray-600 font-medium mt-3"><strong className="text-dark">{t('placeOrder.address')}</strong> {shippingAddress?.address}, {shippingAddress?.city} {shippingAddress?.postalCode && `- ${ shippingAddress.postalCode }`}, {shippingAddress?.country}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-start">
            <h2 className="text-xl font-bold text-dark mb-4 border-b border-gray-100 pb-4">{t('placeOrder.payment_method')}</h2>
            <p className="text-gray-600 font-medium"><strong className="text-dark">{t('placeOrder.method')}</strong> {paymentMethod === 'Cash on Delivery' ? t('payment.cod') : paymentMethod}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-start">
            <h2 className="text-xl font-bold text-dark mb-4 border-b border-gray-100 pb-4 flex items-center gap-2">
              <FaBoxOpen className="text-primary" /> {t('placeOrder.order_items')}
            </h2>
            {cartItems.map((item, index) => (
              <div key={index} className="flex items-center gap-4 py-4 border-b border-gray-50 last:border-0">
                <img src={item.image} alt={getDBText(item.name)} className="w-16 h-16 object-cover rounded-xl border border-gray-100" />
                <div className="flex-1">
                  <Link to={`/product/${ item.product || item._id }`} className="text-dark font-bold hover:text-primary transition-colors line-clamp-1">
                    {getDBText(item.name)}
                  </Link>
                  {item.selectedSize && <span className="text-xs text-gray-500 block">{t('placeOrder.size')} {item.selectedSize}</span>}
                </div>
                <div className="text-end whitespace-nowrap" dir="ltr">
                  <span className="font-bold text-dark">{item.qty} x ${item.price}</span>
                  <span className="block text-primary font-black mt-1">=${(item.qty * item.price).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 sticky top-24">
            <h2 className="text-2xl font-extrabold text-dark mb-6 border-b border-gray-200 pb-4">{t('placeOrder.order_summary')}</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>{t('placeOrder.items')}</span>
                <span className="text-dark font-bold" dir="ltr">${itemsPrice}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>{t('placeOrder.shipping')}</span>
                <span className="text-dark font-bold" dir="ltr">${shippingPrice}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>{t('placeOrder.tax')}</span>
                <span className="text-dark font-bold" dir="ltr">${taxPrice}</span>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-8 flex justify-between items-center">
              <span className="text-lg font-bold text-dark">{t('placeOrder.total')}</span>
              <span className="text-3xl font-black text-primary" dir="ltr">${totalPrice}</span>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center gap-2">
                <FaExclamationCircle className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              onClick={placeOrderHandler}
              disabled={cartItems.length === 0}
              isLoading={loading}
              variant="primary"
              size="lg"
              fullWidth
              leftIcon={!loading && <FaCheckCircle />}
            >
              {loading ? t('placeOrder.processing') : t('placeOrder.confirm_order')}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PlaceOrderScreen;