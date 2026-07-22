// filepath: frontend/src/pages/ForgotPasswordScreen.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationCircle, FaArrowRight, FaUnlockAlt, FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import Button from '../components/ui/Button';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { t } = useTranslation();

  const submitHandler = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      await axios.post('/api/users/forgot-password', { email }, config);

      setIsLoading(false);
      navigate(`/reset-password?email=${ email }`);

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex rounded-3xl overflow-hidden shadow-2xl bg-linear-to-br from-white to-gray-50 border border-gray-100 my-8">

      <div className="hidden lg:flex w-1/2 relative bg-black items-center justify-center overflow-hidden group">
        <img
          src="/images/mazraoui.jpg"
          alt="Evox Recovery"
          className="absolute inset-0 w-full h-full object-cover object-center scale-105 grayscale opacity-70 group-hover:grayscale-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1500 ease-out"
        />
        <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors duration-1500"></div>

        <div className="relative z-10 p-12 text-center text-white w-full transform group-hover:-translate-y-2 transition-transform duration-1500 ease-out">
          <FaUnlockAlt className="text-6xl mx-auto mb-6 text-primary drop-shadow-lg" />
          <h2 className="text-4xl font-extrabold tracking-tight mb-4 drop-shadow-xl">
            {t('forgotPassword.recovery_title')}
          </h2>
          <p className="text-lg text-gray-200 font-medium drop-shadow-md">
            {t('forgotPassword.recovery_desc')}
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 py-12">

        <div className="w-full max-w-[384px] mx-auto">

          <div className="mb-2">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-dark transition-colors group"
            >
              <FaArrowLeft className="me-2 group-hover:-translate-x-1 rtl:group-hover:translate-x-1 rtl:rotate-180 transition-transform" />
              {t('forgotPassword.back_to_login')}
            </Link>
          </div>

          <div className="mb-10 text-center mt-6">
            <h1 className="text-4xl font-extrabold text-dark tracking-tight mb-3">
              {t('forgotPassword.title')}
            </h1>
            <p className="text-gray-500 font-medium">
              {t('forgotPassword.desc')}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-pulse">
              <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
              <span className="text-red-700 font-bold text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-6 w-full">

            <div className="relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="block px-3 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 appearance-none focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary peer transition-all duration-300 shadow-sm hover:shadow-md text-start"
                placeholder=" "
                dir="ltr"
              />
              <label
                htmlFor="email"
                className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary"
              >
                {t('auth.email')}
              </label>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className="group mt-2"
              rightIcon={!isLoading && <FaArrowRight className="translate-x-0 rtl:rotate-180 opacity-80 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 group-hover:opacity-100 transition-all" />}
            >
              {t('forgotPassword.send_code')}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;