// filepath: frontend/src/pages/ResetPasswordScreen.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationCircle, FaCheckCircle, FaArrowRight, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import Button from '../components/ui/Button';

const ResetPasswordScreen = () => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const searchParams = new URLSearchParams(location.search);
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (!emailParam) {
      navigate('/forgot-password');
    }
  }, [emailParam, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError(t('auth.pass_hint'));
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setMessage('');
    setIsLoading(true);

    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axios.put('/api/users/reset-password', {
        email: emailParam,
        otp,
        newPassword
      }, config);

      setMessage(data.message);
      setIsLoading(false);

      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      setError(error.response?.data?.message || 'Password reset failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex rounded-3xl overflow-hidden shadow-2xl bg-linear-to-br from-white to-gray-50 border border-gray-100 my-8">

      <div className="hidden lg:flex w-1/2 relative bg-dark items-center justify-center overflow-hidden group">
        <img
          src="/images/mazraoui-2.jpg"
          alt="Evox Security"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 grayscale opacity-70 group-hover:grayscale-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1500 ease-out"
        />
        <div className="absolute inset-0 bg-dark/60 group-hover:bg-dark/40 transition-colors duration-1500"></div>

        <div className="relative z-10 p-12 text-center text-white w-full transform group-hover:-translate-y-2 transition-transform duration-1500 ease-out">
          <FaLock className="text-6xl mx-auto mb-6 text-primary drop-shadow-lg" />
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 drop-shadow-xl">
            {t('resetPassword.secure_legacy')}
          </h2>
          <p className="text-lg text-gray-200 font-medium drop-shadow-md">
            {t('resetPassword.legacy_desc')}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 py-12">

        <div className="w-full max-w-[384px] mx-auto">

          <div className="mb-10 text-center">
            <h1 className="text-4xl font-extrabold text-dark tracking-tight mb-3">
              {t('resetPassword.title')}
            </h1>
            <p className="text-gray-500 font-medium">
              {t('resetPassword.desc_1')} <br />
              <span className="text-primary font-bold" dir="ltr">{emailParam}</span>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-pulse">
              <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
              <span className="text-red-700 font-bold text-sm">{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-6 p-4 bg-green-50 border-s-4 border-green-500 rounded-e-xl flex items-center gap-3">
              <FaCheckCircle className="text-green-500 text-lg shrink-0" />
              <span className="text-green-700 font-bold text-sm">{message}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-6 w-full">

            <div className="relative group">
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength="6"
                required
                className="block px-3 pb-2.5 pt-6 w-full text-center tracking-[0.5em] text-xl font-bold text-dark bg-white rounded-xl border-2 border-gray-200 appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary peer transition-all duration-300 shadow-sm hover:shadow-md"
                placeholder=" "
                dir="ltr"
              />
              <label
                htmlFor="otp"
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-1/2 -translate-x-1/2 rtl:translate-x-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-2 peer-focus:text-primary"
              >
                {t('auth.six_digit_code', '6-Digit Code')}
              </label>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="block px-3 pe-10 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary peer transition-all duration-300 shadow-sm hover:shadow-md text-start"
                placeholder=" "
                dir="ltr"
              />
              <label
                htmlFor="newPassword"
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary"
              >
                {t('resetPassword.new_password')}
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-e-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
              >
                {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={message.includes('successfully') || message.includes('بنجاح')}
              isLoading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className="mt-2 group"
              rightIcon={!isLoading && <FaArrowRight className="translate-x-0 rtl:rotate-180 opacity-80 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 group-hover:opacity-100 transition-all" />}
            >
              {t('resetPassword.update_password')}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm font-semibold text-gray-600">
            {t('resetPassword.remember_password')} {' '}
            <Link to="/login" className="text-primary font-bold hover:text-dark hover:underline transition-colors">
              {t('auth.sign_in')}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordScreen;