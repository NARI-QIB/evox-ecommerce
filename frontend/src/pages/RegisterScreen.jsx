// filepath: frontend/src/pages/RegisterScreen.jsx
import { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FaExclamationCircle, FaUserPlus, FaEye, FaEyeSlash, FaShoppingBag, FaArrowRight, FaShieldAlt } from 'react-icons/fa';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/ui/Button';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { register, googleLoginAuth } = useContext(AuthContext);
  const { t } = useTranslation();

  const redirect = location.search ? location.search.split('=')[1] : '/';

  const { data: settings } = useQuery({
    queryKey: ['globalSettings'],
    queryFn: async () => {
      const { data } = await axios.get('/api/settings');
      return data;
    },
    staleTime: Infinity,
  });

  const banner = settings?.registerBanner || '/images/mazraoui-2.jpg';

  const calculatePasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 8) score += 25;
    if (/[A-Z]/.test(pass)) score += 25;
    if (/[0-9]/.test(pass)) score += 25;
    if (/[^A-Za-z0-9]/.test(pass)) score += 25;
    return score;
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordStrength(calculatePasswordStrength(val));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (passwordStrength < 75) { setError(t('auth.pass_hint')); return; }
    if (password !== confirmPassword) { setError(t('auth.passwords_not_match')); return; }
    setError('');
    setIsLoading(true);
    const res = await register(name, email, password);
    if (res.success) navigate(`/verify-otp?email=${ email }`);
    else { setError(res.error); setIsLoading(false); }
  };

  const googleSuccessHandler = async (credentialResponse) => {
    setError('');
    setIsLoading(true);
    const res = await googleLoginAuth(credentialResponse.credential);
    if (res.success) navigate(redirect);
    else { setError(res.error); setIsLoading(false); }
  };

  return (
    <div className="min-h-[85vh] flex flex-row-reverse rounded-3xl overflow-hidden shadow-2xl bg-linear-to-bl from-white to-gray-50 border border-gray-100 my-8">
      <div className="hidden lg:flex w-1/2 relative bg-dark items-center justify-center overflow-hidden group">
        <img src={banner} alt="Join Evox" className="absolute inset-0 w-full h-full object-cover object-center scale-105 grayscale opacity-70 group-hover:grayscale-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-1500 ease-out" />
        <div className="absolute inset-0 bg-dark/60 group-hover:bg-dark/40 transition-colors duration-1500"></div>
        <div className="relative z-10 p-12 text-center text-white w-full transform group-hover:-translate-y-2 transition-transform duration-1500 ease-out">
          <h2 className="text-5xl font-heading font-extrabold tracking-wide mb-4 drop-shadow-xl flex items-center justify-center gap-3 uppercase"><FaShieldAlt className="text-primary" /> {t('auth.join_elite')}</h2>
          <p className="text-lg text-gray-100 font-medium drop-shadow-md">{t('auth.secure_journey')}</p>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 py-12">
        <div className="w-full max-w-[384px] mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-heading font-extrabold text-dark tracking-wide mb-3 uppercase">{t('auth.create_account_title')}</h1>
            <p className="text-gray-500 font-medium">{t('auth.start_journey')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up shadow-sm">
              <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
              <span className="text-red-700 font-bold text-sm text-start">{error}</span>
            </div>
          )}

          <form onSubmit={submitHandler} className="space-y-5 w-full">
            <div className="relative group">
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="block px-3 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary peer transition-all shadow-sm" placeholder=" " />
              <label htmlFor="name" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary">{t('auth.full_name')}</label>
            </div>
            <div className="relative group">
              <input type="email" id="emailReg" value={email} onChange={(e) => setEmail(e.target.value)} required className="block px-3 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary peer transition-all shadow-sm text-start" placeholder=" " dir="ltr" />
              <label htmlFor="emailReg" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary">{t('auth.email')}</label>
            </div>
            <div className="relative group">
              <input type={showPassword ? 'text' : 'password'} id="passReg" value={password} onChange={handlePasswordChange} required className="block px-3 pe-10 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary peer transition-all shadow-sm text-start" placeholder=" " dir="ltr" />
              <label htmlFor="passReg" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary">{t('auth.password')}</label>
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-e-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary focus:outline-none">{showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}</button>
            </div>
            {password && (
              <div className="mt-1 mb-3 animate-fade-in-up">
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('auth.password_strength')}</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider ${ passwordStrength < 50 ? 'text-red-500' : passwordStrength < 100 ? 'text-amber-500' : 'text-green-500' }`}>{passwordStrength < 50 ? t('auth.weak') : passwordStrength < 100 ? t('auth.good') : t('auth.strong')}</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 rounded-full flex gap-1" dir="ltr"><div className={`h-full transition-all duration-500 rounded-full ${ passwordStrength < 50 ? 'bg-red-500' : passwordStrength < 100 ? 'bg-amber-500' : 'bg-green-500' }`} style={{ width: `${ passwordStrength }%` }}></div></div>
                {passwordStrength < 100 && <p className="text-[10px] text-gray-400 mt-1.5 px-1">{t('auth.pass_hint')}</p>}
              </div>
            )}
            <div className="relative group">
              <input type={showConfirmPassword ? 'text' : 'password'} id="confirmPass" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="block px-3 pe-10 pb-2.5 pt-6 w-full text-sm text-dark bg-white rounded-xl border-2 border-gray-200 focus:outline-none focus:border-primary peer transition-all shadow-sm text-start" placeholder=" " dir="ltr" />
              <label htmlFor="confirmPass" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right inset-s-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-1 peer-focus:text-primary">{t('auth.confirm_pass')}</label>
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-e-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary focus:outline-none">{showConfirmPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}</button>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              variant="primary"
              size="lg"
              fullWidth
              className="group mt-4"
              rightIcon={!isLoading && <FaUserPlus className="opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all rtl:-scale-x-100" />}
            >
              {t('auth.sign_up')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm font-semibold text-gray-600">{t('auth.already_have_account')} <Link to={redirect ? `/login?redirect=${ redirect }` : '/login'} className="text-primary font-bold hover:text-dark hover:underline transition-colors">{t('auth.sign_in')}</Link></div>
          <div className="flex items-center my-6"><div className="flex-1 border-t border-gray-200"></div><span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('auth.or')}</span><div className="flex-1 border-t border-gray-200"></div></div>
          <div className="mb-6 w-full flex justify-center hover:scale-[1.02] transition-transform" dir="ltr"><GoogleLogin onSuccess={googleSuccessHandler} onError={() => setError(t('auth.google_signup_failed'))} shape="rectangular" theme="outline" size="large" locale="en" width="384" text="signup_with" /></div>

          <div className="mt-2 w-full">
            <Button
              onClick={() => navigate('/')}
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              className="group uppercase"
              leftIcon={<FaShoppingBag className="text-gray-400 group-hover:text-primary transition-colors text-lg" />}
              rightIcon={<FaArrowRight className="opacity-0 -translate-x-2 rtl:translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 rtl:group-hover:translate-x-0 transition-all text-xs text-gray-500 rtl:rotate-180" />}
            >
              {t('auth.guest_checkout')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;