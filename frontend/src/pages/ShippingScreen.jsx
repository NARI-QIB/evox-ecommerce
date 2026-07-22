import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import CheckoutSteps from '../components/CheckoutSteps';
import { FaShippingFast, FaArrowRight, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';

const ShippingScreen = () => {
  const { shippingAddress, saveShippingAddress, cartItems } = useContext(CartContext);
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const defaultAddress = userInfo?.addresses?.find(a => a.isDefault) || userInfo?.addresses?.[0];

  const initialPhoneParts = shippingAddress?.phoneNumber?.split(' ') || defaultAddress?.phone?.split(' ') || [];
  const initialCode = initialPhoneParts.length > 1 ? initialPhoneParts[0] : '+963';
  const initialNumber = initialPhoneParts.length > 1 ? initialPhoneParts.slice(1).join(' ') : (shippingAddress?.phoneNumber || defaultAddress?.phone || '');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      fullName: shippingAddress?.fullName || userInfo?.name || '',
      email: shippingAddress?.email || userInfo?.email || '',
      countryCode: initialCode,
      phone: initialNumber,
      address: shippingAddress?.address || defaultAddress?.address || '',
      city: shippingAddress?.city || defaultAddress?.city || '',
      postalCode: shippingAddress?.postalCode || defaultAddress?.postalCode || '',
      country: shippingAddress?.country || defaultAddress?.country || ''
    }
  });

  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (cartItems.length === 0) navigate('/cart');
  }, [cartItems, navigate]);

  const detectLocationHandler = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${ latitude }&lon=${ longitude }`);
          const data = await res.json();

          if (data && data.address) {
            setValue('city', data.address.city || data.address.town || data.address.state || '');
            setValue('country', data.address.country || '');
            setValue('postalCode', data.address.postcode || '');
            setValue('address', data.display_name || '');
          }
        } catch (error) {
          console.error('Error fetching location details:', error);
          alert('Could not detect exact address. Please enter manually.');
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        console.error(error);
        alert('Please allow location permissions to use this feature.');
        setIsDetecting(false);
      }
    );
  };

  const onSubmit = (data) => {
    const fullPhone = `${ data.countryCode } ${ data.phone }`;

    saveShippingAddress({
      fullName: data.fullName,
      email: data.email,
      phoneNumber: fullPhone,
      address: data.address,
      city: data.city,
      postalCode: data.postalCode || '',
      country: data.country
    });
    navigate('/payment');
  };

  const inputStyle = "block px-4 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border appearance-none focus:outline-none focus:ring-2 transition-all duration-300 peer";
  const getBorderColor = (fieldName) => errors[fieldName] ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-gray-200 focus:border-primary focus:ring-primary/20";
  const labelStyle = "absolute text-sm duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1";
  const getLabelColor = (fieldName) => errors[fieldName] ? "text-red-500" : "text-gray-400 peer-focus:text-primary";

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <CheckoutSteps step1 step2 />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-10 animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <FaShippingFast className="text-3xl rtl:-scale-x-100" />
          </div>
          <h1 className="text-3xl font-extrabold text-dark tracking-tight">{t('shipping.title')}</h1>
          <p className="text-gray-500 mt-2">
            {userInfo
              ? t('shipping.welcome_back', { name: userInfo.name.split(' ')[0] })
              : t('shipping.guest_checkout')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          <div className="p-5 sm:p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-6 mb-6">
            <h2 className="text-lg font-bold text-dark mb-4 border-b border-gray-200 pb-2">{t('shipping.contact_info')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <input
                  type="text" id="fullName" placeholder=" "
                  {...register("fullName", { required: true })}
                  className={`${ inputStyle } ${ getBorderColor('fullName') }`}
                />
                <label htmlFor="fullName" className={`${ labelStyle } ${ getLabelColor('fullName') }`}>{t('shipping.full_name')}</label>
              </div>

              <div className="relative group">
                <input
                  type="email" id="email" placeholder=" "
                  {...register("email", { required: true })}
                  className={`${ inputStyle } ${ getBorderColor('email') }`}
                />
                <label htmlFor="email" className={`${ labelStyle } ${ getLabelColor('email') }`}>{t('shipping.email')}</label>
              </div>
            </div>

            <div className={`relative flex items-center border rounded-xl bg-white focus-within:ring-2 transition-all duration-300 ${ errors.phone ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/20' : 'border-gray-200 focus-within:border-primary focus-within:ring-primary/20' }`}>
              <select
                {...register("countryCode")}
                className="ps-4 pe-6 py-4 bg-transparent text-sm text-dark font-bold focus:outline-none appearance-none border-e border-gray-100 cursor-pointer"
                dir="ltr"
              >
                <option value="+963">🇸🇾 +963</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+20">🇪🇬 +20</option>
                <option value="+962">🇯🇴 +962</option>
                <option value="+961">🇱🇧 +961</option>
                <option value="+964">🇮🇶 +964</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+974">🇶🇦 +974</option>
                <option value="+973">🇧🇭 +973</option>
                <option value="+968">🇴🇲 +968</option>
              </select>

              <div className="relative flex-1 group">
                <input
                  type="tel" id="phone" placeholder=" " dir="ltr"
                  {...register("phone", { required: true })}
                  className="block px-4 pb-2.5 pt-6 w-full text-sm text-dark bg-transparent appearance-none focus:outline-none peer text-start"
                />
                <label htmlFor="phone" className={`${ labelStyle } ${ getLabelColor('phone') }`}>{t('shipping.phone')}</label>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-gray-200 pb-2 gap-4">
              <h2 className="text-lg font-bold text-dark">{t('shipping.delivery_address')}</h2>
              <button
                type="button"
                onClick={detectLocationHandler}
                disabled={isDetecting}
                className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 text-dark px-4 py-2.5 rounded-xl font-bold text-sm hover:border-dark hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 focus:outline-none shadow-sm"
              >
                {isDetecting ? <FaSpinner className="animate-spin text-primary" /> : <FaMapMarkerAlt className="text-primary" />}
                {isDetecting ? t('shipping.detecting') : t('shipping.detect_location')}
              </button>
            </div>

            <div className="relative group">
              <input
                type="text" id="address" placeholder=" "
                {...register("address", { required: true })}
                className={`${ inputStyle } ${ getBorderColor('address') }`}
              />
              <label htmlFor="address" className={`${ labelStyle } ${ getLabelColor('address') }`}>{t('shipping.full_street')}</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <input
                  type="text" id="city" placeholder=" "
                  {...register("city", { required: true })}
                  className={`${ inputStyle } ${ getBorderColor('city') }`}
                />
                <label htmlFor="city" className={`${ labelStyle } ${ getLabelColor('city') }`}>{t('shipping.city')}</label>
              </div>

              <div className="relative group">
                <input
                  type="text" id="postalCode" placeholder=" "
                  {...register("postalCode")}
                  className={`${ inputStyle } border-gray-200 focus:border-primary focus:ring-primary/20`}
                />
                <label htmlFor="postalCode" className={`${ labelStyle } text-gray-400 peer-focus:text-primary`}>{t('shipping.postal_code')}</label>
              </div>
            </div>

            <div className="relative group">
              <input
                type="text" id="country" placeholder=" "
                {...register("country", { required: true })}
                className={`${ inputStyle } ${ getBorderColor('country') }`}
              />
              <label htmlFor="country" className={`${ labelStyle } ${ getLabelColor('country') }`}>{t('shipping.country')}</label>
            </div>
          </div>

          <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg hover:bg-orange-600 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 mt-8 flex items-center justify-center gap-2 disabled:opacity-70">
            {t('shipping.continue_payment')} <FaArrowRight className="rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShippingScreen;
