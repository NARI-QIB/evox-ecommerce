// filepath: frontend/src/pages/admin/AdminUserEditScreen.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import {
  FaUser, FaExclamationCircle, FaSave, FaArrowLeft, FaArrowRight,
  FaUserShield, FaChartLine, FaUsers, FaCheck
} from 'react-icons/fa';

const AdminUserEditScreen = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang } = useLanguage();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['adminUser', userId],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.get(`/api/users/${ userId }`, config);
      return data;
    },
    enabled: !!userInfo?.isAdmin && !!userId,
  });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setIsAdmin(user.isAdmin);
    }
  }, [user]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.put(`/api/users/${ userId }`, { name, email, isAdmin }, config);

      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      navigate('/admin/users');
    } catch (err) {
      alert(err.response?.data?.message || t('adminUserEdit.update_failed'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 max-w-4xl mx-auto px-4">
        <div className="mb-8 p-4 bg-red-50 border-s-4 border-red-500 flex items-center gap-3">
          <FaExclamationCircle className="text-red-500 text-lg" />
          <span className="text-red-700 font-bold">{error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb steps={[
          { label: t('header.admin_panel'), url: '/admin/dashboard', icon: FaChartLine },
          { label: t('adminUsers.title'), url: '/admin/users', icon: FaUsers },
          { label: t('adminUserEdit.title'), icon: FaUser }
        ]} />

        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark flex items-center gap-3">
              <FaUserShield className="text-primary" /> {t('adminUserEdit.title')}
            </h1>
            <p className="text-gray-500 font-medium mt-1 font-mono text-sm">ID: {userId}</p>
          </div>
          <Button
            to="/admin/users"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            leftIcon={lang === 'ar' ? <FaArrowRight /> : <FaArrowLeft />}
          >
            {t('adminUserEdit.back_to_users')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <form onSubmit={submitHandler} className="p-6 sm:p-8 space-y-8">
              <div>
                <h2 className="text-xl font-bold text-dark border-b border-gray-100 pb-4 mb-6 text-start">{t('adminUserEdit.account_details')}</h2>
                <div className="grid grid-cols-1 gap-6 text-start">
                  <div className="relative group">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="block px-4 pb-2.5 pt-6 w-full text-sm bg-white rounded-xl border-2 border-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer transition-colors" placeholder=" " />
                    <label className="absolute text-sm text-gray-400 transform -translate-y-3 scale-75 top-3 start-4 font-bold bg-white px-1 pointer-events-none">{t('adminUserEdit.full_name')}</label>
                  </div>
                  <div className="relative group">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="block px-4 pb-2.5 pt-6 w-full text-sm bg-white rounded-xl border-2 border-gray-100 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 peer transition-colors" placeholder=" " dir="ltr" />
                    <label className="absolute text-sm text-gray-400 transform -translate-y-3 scale-75 top-3 start-4 font-bold bg-white px-1 pointer-events-none">{t('adminUserEdit.email_address')}</label>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-dark border-b border-gray-100 pb-4 mb-6 text-start">{t('adminUserEdit.permissions')}</h2>
                <div onClick={() => setIsAdmin(!isAdmin)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${ isAdmin ? 'border-primary bg-primary/5' : 'border-gray-200 bg-gray-50' }`}>
                  <div className="text-start">
                    <h3 className={`font-bold ${ isAdmin ? 'text-primary' : 'text-dark' }`}>{t('adminUserEdit.admin_access')}</h3>
                    <p className="text-sm text-gray-500 mt-1">{t('adminUserEdit.admin_desc')}</p>
                  </div>
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${ isAdmin ? 'bg-primary text-white' : 'bg-white border-2 border-gray-300' }`}>
                    {isAdmin && <FaCheck className="text-xs" />}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-50 flex justify-start">
                <Button
                  type="submit"
                  isLoading={isUpdating}
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                  leftIcon={!isUpdating && <FaSave />}
                >
                  {t('adminUserEdit.update_user')}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUserEditScreen;