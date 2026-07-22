// filepath: frontend/src/components/CheckoutSteps.jsx
import { FaUserCheck, FaShippingFast, FaCreditCard, FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const CheckoutSteps = ({ step1, step2, step3, step4 }) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-center items-center mb-10 w-full max-w-3xl mx-auto px-2 sm:px-4 animate-fade-in-up">
      <div className="flex items-center w-full relative">

        {/* Step 1: Sign In */}
        <div className={`flex flex-col items-center relative z-10 ${ step1 ? 'text-primary' : 'text-gray-300' }`}>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1.5 sm:mb-2 transition-colors shadow-sm ${ step1 ? 'bg-primary text-white border-2 border-primary ring-2 ring-primary/20' : 'bg-white border-2 border-gray-200' }`}>
            <FaUserCheck />
          </div>
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest absolute -bottom-4 sm:-bottom-5 whitespace-nowrap">
            {t('checkoutSteps.sign_in')}
          </span>
        </div>

        <div className={`flex-auto border-t-2 sm:border-t-4 transition-colors ${ step2 ? 'border-primary' : 'border-gray-100' }`}></div>

        {/* Step 2: Shipping */}
        <div className={`flex flex-col items-center relative z-10 ${ step2 ? 'text-primary' : 'text-gray-300' }`}>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1.5 sm:mb-2 transition-colors shadow-sm ${ step2 ? 'bg-primary text-white border-2 border-primary ring-2 ring-primary/20' : 'bg-white border-2 border-gray-200' }`}>
            <FaShippingFast className="rtl:-scale-x-100" />
          </div>
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest absolute -bottom-4 sm:-bottom-5 whitespace-nowrap">
            {t('checkoutSteps.shipping')}
          </span>
        </div>

        <div className={`flex-auto border-t-2 sm:border-t-4 transition-colors ${ step3 ? 'border-primary' : 'border-gray-100' }`}></div>

        {/* Step 3: Payment */}
        <div className={`flex flex-col items-center relative z-10 ${ step3 ? 'text-primary' : 'text-gray-300' }`}>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1.5 sm:mb-2 transition-colors shadow-sm ${ step3 ? 'bg-primary text-white border-2 border-primary ring-2 ring-primary/20' : 'bg-white border-2 border-gray-200' }`}>
            <FaCreditCard />
          </div>
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest absolute -bottom-4 sm:-bottom-5 whitespace-nowrap">
            {t('checkoutSteps.payment')}
          </span>
        </div>

        <div className={`flex-auto border-t-2 sm:border-t-4 transition-colors ${ step4 ? 'border-primary' : 'border-gray-100' }`}></div>

        {/* Step 4: Place Order */}
        <div className={`flex flex-col items-center relative z-10 ${ step4 ? 'text-primary' : 'text-gray-300' }`}>
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-bold mb-1.5 sm:mb-2 transition-colors shadow-sm ${ step4 ? 'bg-primary text-white border-2 border-primary ring-2 ring-primary/20' : 'bg-white border-2 border-gray-200' }`}>
            <FaCheckCircle />
          </div>
          <span className="text-[9px] sm:text-xs font-bold uppercase tracking-widest absolute -bottom-4 sm:-bottom-5 whitespace-nowrap">
            {t('checkoutSteps.order')}
          </span>
        </div>

      </div>
    </div>
  );
};

export default CheckoutSteps;