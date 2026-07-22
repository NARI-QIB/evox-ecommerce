// filepath: frontend/src/components/profile/ProfileDetails.jsx
import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FaUserEdit, FaLock, FaCheckCircle, FaExclamationCircle, FaEdit, FaTimes, FaEnvelopeOpenText } from 'react-icons/fa';
import axios from 'axios';
import Button from '../ui/Button';

const inputBaseStyle = "block px-4 pb-2.5 pt-6 w-full text-sm rounded-xl transition-all duration-300";
const inputEditStyle = "text-dark bg-white border-2 border-gray-200 focus:outline-none focus:border-primary peer shadow-sm";
const inputReadStyle = "text-dark bg-transparent border-b-2 border-transparent focus:outline-none focus:ring-0 cursor-default px-0 text-lg font-semibold";
const labelBaseStyle = "absolute duration-300 transform top-3 z-10 origin-top-left rtl:origin-top-right font-bold";
const labelEditStyle = "text-sm start-4 -translate-y-3 scale-75 text-gray-400 peer-focus:text-primary";
const labelReadStyle = "text-xs start-0 -translate-y-4 text-gray-400";

const ProfileDetails = () => {
  const { userInfo, updateUserSession } = useContext(AuthContext);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationToken, setVerificationToken] = useState('');

  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (userInfo) {
      setName(userInfo.name);
      setEmail(userInfo.email);
    }
  }, [userInfo]);

  const cancelEditHandler = () => {
    setIsEditing(false); setShowOtpInput(false); setOtp(''); setVerificationToken('');
    setName(userInfo.name); setEmail(userInfo.email);
    setProfileError(''); setProfileMessage('');
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.put('/api/users/profile', profileData, config);
      return data;
    },
    onSuccess: (data) => {
      updateUserSession(data);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  });

  const requestEmailMutation = useMutation({
    mutationFn: async (emailData) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.post('/api/users/profile/email/request', emailData, config);
      return data;
    }
  });

  const verifyEmailMutation = useMutation({
    mutationFn: async (verifyData) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.put('/api/users/profile/email/verify', verifyData, config);
      return data;
    },
    onSuccess: (data) => {
      updateUserSession(data);
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordData) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.put('/api/users/profile/password', passwordData, config);
      return data;
    }
  });

  const isUpdatingProfile = updateProfileMutation.isPending || requestEmailMutation.isPending;

  const updateProfileHandler = async (e) => {
    e.preventDefault();
    setProfileError(''); setProfileMessage('');

    try {
      if (name !== userInfo.name) {
        await updateProfileMutation.mutateAsync({ name });
      }

      if (email !== userInfo.email) {
        const data = await requestEmailMutation.mutateAsync({ newEmail: email });
        setVerificationToken(data.verificationToken);
        setProfileMessage(t('profileDetails.otp_sent', { email }));
        setShowOtpInput(true);
        return;
      }

      setProfileMessage(t('profileDetails.profile_updated'));
      setIsEditing(false);
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const verifyOtpHandler = async (e) => {
    e.preventDefault();
    setProfileError(''); setProfileMessage('');
    try {
      await verifyEmailMutation.mutateAsync({ verificationToken, otp });
      setProfileMessage(t('profileDetails.email_updated'));
      setShowOtpInput(false);
      setIsEditing(false);
      setOtp('');
      setVerificationToken('');
      setTimeout(() => setProfileMessage(''), 3000);
    } catch (error) {
      setProfileError(error.response?.data?.message || 'Invalid or expired OTP. Please try again.');
    }
  };

  const updatePasswordHandler = async (e) => {
    e.preventDefault();
    setPasswordError(''); setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordError(t('profileDetails.passwords_not_match'));
      return;
    }
    try {
      await updatePasswordMutation.mutateAsync({ oldPassword, newPassword });
      setPasswordMessage(t('profileDetails.password_updated'));
      setOldPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="space-y-8 w-full">
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
        <div className="absolute top-0 end-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-xl"><FaUserEdit className="text-xl text-primary" /></div>
            <h2 className="text-2xl font-extrabold text-dark tracking-tight">{t('profileDetails.personal_info')}</h2>
          </div>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              size="sm"
              leftIcon={<FaEdit />}
            >
              {t('profileDetails.edit_profile')}
            </Button>
          )}
        </div>

        {profileError && (
          <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up">
            <FaExclamationCircle className="text-red-500 text-lg flex-shrink-0" />
            <span className="text-red-700 font-bold text-sm">{profileError}</span>
          </div>
        )}

        {profileMessage && (
          <div className="mb-6 p-4 bg-green-50 border-s-4 border-green-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up">
            <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
            <span className="text-green-700 font-bold text-sm">{profileMessage}</span>
          </div>
        )}

        {!showOtpInput ? (
          <form onSubmit={updateProfileHandler} className="space-y-6">
            <div className="relative group text-start">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                readOnly={!isEditing}
                tabIndex={isEditing ? 0 : -1}
                required
                className={`${ inputBaseStyle } ${ isEditing ? inputEditStyle : inputReadStyle }`}
                placeholder=" "
              />
              <label htmlFor="name" className={`${ labelBaseStyle } ${ isEditing ? labelEditStyle : labelReadStyle }`}>
                {t('profileDetails.full_name')}
              </label>
            </div>

            <div className="relative group pt-2 text-start">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                readOnly={!isEditing}
                tabIndex={isEditing ? 0 : -1}
                required
                className={`${ inputBaseStyle } ${ isEditing ? inputEditStyle : inputReadStyle }`}
                placeholder=" "
                dir="ltr"
              />
              <label htmlFor="email" className={`${ labelBaseStyle } ${ isEditing ? labelEditStyle : labelReadStyle }`}>
                {t('profileDetails.email_address')}
              </label>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 pt-4 animate-fade-in-up">
                <Button variant="ghost" size="md" onClick={cancelEditHandler} leftIcon={<FaTimes />}>
                  {t('profileDetails.cancel')}
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={isUpdatingProfile}>
                  {t('profileDetails.save_changes')}
                </Button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={verifyOtpHandler} className="space-y-6 animate-fade-in-up bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border border-blue-100 shadow-inner">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm text-primary"><FaEnvelopeOpenText className="text-2xl" /></div>
              <h3 className="text-xl font-extrabold text-dark tracking-tight">{t('profileDetails.verify_new_email')}</h3>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {t('profileDetails.enter_code_sent')} <br /><span className="text-primary font-bold">{email}</span>
              </p>
            </div>
            <div className="relative group max-w-xs mx-auto">
              <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} maxLength="6" required dir="ltr" className="block px-4 pb-2.5 pt-6 w-full text-center tracking-[0.5em] text-xl font-bold text-dark bg-white rounded-xl border-2 border-primary/30 appearance-none focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer transition-all shadow-sm" placeholder=" " />
              <label htmlFor="otp" className="absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 z-10 origin-top-left rtl:origin-top-right start-1/2 -translate-x-1/2 rtl:translate-x-1/2 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-1 peer-focus:scale-75 peer-focus:-translate-y-3 font-bold bg-white px-2">
                {t('profileDetails.six_digit_code')}
              </label>
            </div>
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" size="md" onClick={cancelEditHandler}>
                {t('profileDetails.cancel')}
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={verifyEmailMutation.isPending} disabled={otp.length !== 6}>
                {t('profileDetails.verify_email')}
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8 border-b border-gray-100 pb-4 relative z-10">
          <div className="p-2 bg-blue-50 rounded-xl"><FaLock className="text-xl text-primary" /></div>
          <h2 className="text-2xl font-extrabold text-dark tracking-tight text-start">{t('profileDetails.security_settings')}</h2>
        </div>

        {passwordError && (
          <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up">
            <FaExclamationCircle className="text-red-500 text-lg flex-shrink-0" />
            <span className="text-red-700 font-bold text-sm">{passwordError}</span>
          </div>
        )}
        {passwordMessage && (
          <div className="mb-6 p-4 bg-green-50 border-s-4 border-green-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up">
            <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />
            <span className="text-green-700 font-bold text-sm">{passwordMessage}</span>
          </div>
        )}

        <form onSubmit={updatePasswordHandler} className="space-y-6 relative z-10">
          <div className="relative group text-start">
            <input type="password" id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} className={inputEditStyle + " " + inputBaseStyle} placeholder=" " dir="ltr" />
            <label htmlFor="oldPassword" className={`${ labelEditStyle } ${ labelBaseStyle } bg-white px-1`}>{t('profileDetails.current_password')}</label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-start">
            <div className="relative group">
              <input type="password" id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className={inputEditStyle + " " + inputBaseStyle} placeholder=" " dir="ltr" />
              <label htmlFor="newPassword" className={`${ labelEditStyle } ${ labelBaseStyle } bg-white px-1`}>{t('profileDetails.new_password')}</label>
            </div>
            <div className="relative group">
              <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputEditStyle + " " + inputBaseStyle} placeholder=" " dir="ltr" />
              <label htmlFor="confirmPassword" className={`${ labelEditStyle } ${ labelBaseStyle } bg-white px-1`}>{t('profileDetails.confirm_password')}</label>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" isLoading={updatePasswordMutation.isPending}>
              {t('profileDetails.update_password')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileDetails;