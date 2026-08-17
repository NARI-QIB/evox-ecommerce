// filepath: frontend/src/pages/PaymentScreen.jsx
import { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CartContext } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import CheckoutSteps from '../components/CheckoutSteps';
import Button from '../components/ui/Button';
import { FaCreditCard, FaMoneyBillWave, FaPaypal, FaArrowRight } from 'react-icons/fa';

const PaymentScreen = () => {
  const { shippingAddress, paymentMethod, savePaymentMethod } = useContext(CartContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      paymentMethod: paymentMethod || 'Cash on Delivery'
    }
  });

  const selectedMethod = watch("paymentMethod");

  // 🌟 الحل الهندسي: التمرير التلقائي لأعلى الصفحة فور تحميلها
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (!shippingAddress || !shippingAddress.address || !shippingAddress.fullName || !shippingAddress.email) {
      navigate('/shipping');
    }
  }, [shippingAddress, navigate]);

  const onSubmit = (data) => {
    savePaymentMethod(data.paymentMethod);
    navigate('/placeorder');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl min-h-[70vh]">
      <CheckoutSteps step1 step2 step3 />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCreditCard className="text-3xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">{t('payment.title', 'Payment Method')}</h1>
          <p className="text-gray-500 mt-2">{t('payment.desc', 'Choose how you want to pay for your order.')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          <label className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${ selectedMethod === 'Cash on Delivery' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-50' }`}>
            <input
              type="radio"
              value="Cash on Delivery"
              {...register("paymentMethod")}
              className="w-5 h-5 text-primary border-gray-300 focus:ring-primary accent-primary cursor-pointer"
            />
            <div className="ms-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <FaMoneyBillWave className="text-xl" />
              </div>
              <div className="text-start">
                <span className="block text-dark font-bold">{t('payment.cod', 'Cash on Delivery (COD)')}</span>
                <span className="block text-xs text-gray-500 font-medium">{t('payment.cod_desc', 'Pay safely when your order arrives.')}</span>
              </div>
            </div>
          </label>

          <label className={`relative flex items-center p-5 rounded-2xl border-2 cursor-pointer opacity-60 transition-all duration-300 ${ selectedMethod === 'PayPal' ? 'border-primary bg-primary/5' : 'border-gray-100 hover:bg-gray-50' }`}>
            <input
              type="radio"
              value="PayPal"
              disabled
              {...register("paymentMethod")}
              className="w-5 h-5 text-primary border-gray-300 focus:ring-primary accent-primary cursor-pointer"
            />
            <div className="ms-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <FaPaypal className="text-xl" />
              </div>
              <div className="text-start">
                <span className="block text-dark font-bold">{t('payment.paypal', 'PayPal / Credit Card')}</span>
                <span className="block text-xs text-gray-500 font-medium">{t('payment.coming_soon', 'Coming soon...')}</span>
              </div>
            </div>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            className="mt-8"
            rightIcon={<FaArrowRight className="rtl:rotate-180" />}
          >
            {t('payment.review_order', 'Review Order')}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PaymentScreen;