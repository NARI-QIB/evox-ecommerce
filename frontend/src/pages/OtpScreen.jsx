// filepath: frontend/src/pages/OtpScreen.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationCircle, FaCheckCircle, FaKey, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import Button from '../components/ui/Button';

const OtpScreen = () => {
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(location.search);
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (!emailParam) {
      navigate('/register');
    }
  }, [emailParam, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError(t('auth.pass_hint'));
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post('/api/users/verify-account', { email: emailParam, otp }, config);

      setMessage(data.message);
      setIsLoading(false);

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      setError(error.response?.data?.message || 'Verification failed. Please try again.');
      setIsLoading(false);
    }
  };

  const resendOtpHandler = async () => {
    setError('');
    setMessage('');
    setIsResending(true);

    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.post('/api/users/resend-activation', { email: emailParam }, config);

      setMessage(data.message || 'A new OTP has been sent to your email.');
      setIsResending(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to resend OTP.');
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex rounded-3xl overflow-hidden shadow-2xl bg-linear-to-br from-white to-gray-50 border border-gray-100 my-8">

      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden group">
        <img
          src="/images/mazraoui.jpg"
          alt="Evox Verification"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 grayscale opacity-70 group-hover:grayscale-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1500 ease-out"
        />
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-1500"></div>

        <div className="relative z-10 p-12 text-center text-white w-full transform group-hover:-translate-y-2 transition-transform duration-1500 ease-out">
          <FaKey className="text-6xl mx-auto mb-6 text-primary drop-shadow-lg animate-pulse" />
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 drop-shadow-xl">
            {t('auth.secure_account')}
          </h2>
          <p className="text-lg text-gray-200 font-medium drop-shadow-md">
            {t('auth.one_step_left')}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 py-12">
        <div className="w-full max-w-[384px] mx-auto">

          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-dark tracking-tight mb-3">
              {t('auth.check_email')}
            </h1>
            <p className="text-gray-500 font-medium">
              {t('auth.sent_otp')} <br />
              <span className="text-primary font-bold" dir="ltr">{emailParam}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up shadow-sm">
              <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
              <span className="text-red-700 font-bold text-sm text-start">{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50 border-s-4 border-green-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up shadow-sm">
              <FaCheckCircle className="text-green-500 text-lg shrink-0" />
              <span className="text-green-700 font-bold text-sm text-start">{message}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-6 w-full">
            <div className="relative group max-w-xs mx-auto">
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
                required
                className="block px-3 pb-2.5 pt-6 w-full text-center tracking-[0.5em] text-2xl font-bold text-dark bg-white rounded-xl border-2 border-gray-200 appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary peer transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder=" "
                dir="ltr"
              />
              <label
                htmlFor="otp"
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-2"
              >
                {t('auth.enter_6_digit')}
              </label>
            </div>

            <Button
              type="submit"
              disabled={message.includes('successfully') || message.includes('بنجاح')}
              isLoading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className="group mt-2"
              rightIcon={!isLoading && <FaArrowRight className="translate-x-0 opacity-80 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:rotate-180 group-hover:opacity-100 transition-all" />}
            >
              {t('auth.verify_account')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-semibold text-gray-600">
            {t('auth.didnt_receive')} {' '}
            <button
              type="button"
              onClick={resendOtpHandler}
              disabled={isResending || message.includes('successfully') || message.includes('بنجاح')}
              className="text-primary font-bold hover:text-dark hover:underline transition-colors disabled:opacity-50 focus:outline-none cursor-pointer"
            >
              {isResending ? t('auth.sending') : t('auth.resend_otp')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default OtpScreen;