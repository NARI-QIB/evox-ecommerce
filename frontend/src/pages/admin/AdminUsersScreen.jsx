// filepath: frontend/src/pages/admin/AdminUsersScreen.jsx
import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import Pagination from '../../components/Pagination';
import {
  FaExclamationCircle, FaUsers, FaChartLine,
  FaCheck, FaTimes, FaTrash, FaEdit, FaEnvelope, FaSearch,
  FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';

const AdminUsersScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, userName: '' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setKeyword(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['adminUsers', page, keyword],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const res = await axios.get(`/api/users?pageNumber=${ page }&keyword=${ keyword }`, config);
      return res.data;
    },
    enabled: !!userInfo?.isAdmin,
    keepPreviousData: true,
  });

  const requestDelete = (user) => {
    if (user.isAdmin) {
      showToast(t('adminUsers.cannot_delete_admin'), 'error');
      return;
    }
    setDeleteModal({ show: true, userId: user._id, userName: user.name });
  };

  const confirmDeleteHandler = async () => {
    setIsDeleting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      await axios.delete(`/api/users/${ deleteModal.userId }`, config);
      showToast(t('adminUsers.user_deleted', 'User deleted successfully'), 'success');
      queryClient.invalidateQueries(['adminUsers']);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete user', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteModal({ show: false, userId: null, userName: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className={`fixed bottom-10 inset-s-1/2 transform -translate-x-1/2 rtl:translate-x-1/2 z-50 transition-all duration-500 ease-out ${ toast.show ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95 pointer-events-none' }`}>
        <div className={`px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border ${ toast.type === 'success' ? 'bg-dark text-white border-gray-700' : 'bg-red-500 text-white border-red-600' }`}>
          {toast.type === 'success' ? <FaCheckCircle className="text-primary text-xl" /> : <FaExclamationTriangle className="text-white text-xl animate-pulse" />}
          <p className="text-sm font-bold">{toast.message}</p>
        </div>
      </div>

      {deleteModal.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-dark/60 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 inset-s-0 w-full h-2 bg-red-500"></div>
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTrash className="text-3xl" />
            </div>
            <h3 className="text-2xl font-black text-dark mb-2">{t('adminUsers.delete_user')}</h3>
            <p className="text-gray-500 font-medium mb-8">{t('adminUsers.delete_confirm')} "{deleteModal.userName}"؟</p>
            <div className="flex gap-3">
              <Button onClick={() => setDeleteModal({ show: false, userId: null, userName: '' })} disabled={isDeleting} variant="soft" size="md" className="flex-1">{t('profileDetails.cancel')}</Button>
              <Button onClick={confirmDeleteHandler} isLoading={isDeleting} variant="danger" size="md" className="flex-1">{t('admin.yes_delete')}</Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <Breadcrumb
          steps={[
            { label: t('header.admin_panel'), url: '/admin/dashboard', icon: FaChartLine },
            { label: t('adminUsers.title'), icon: FaUsers }
          ]}
        />

        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in-up">
          <div className="text-start">
            <h1 className="text-3xl font-extrabold text-dark tracking-tight flex items-center gap-3">
              <FaUsers className="text-primary" /> {t('adminUsers.title')}
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              {t('adminUsers.desc')}
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={t('adminUsers.search_placeholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full ps-11 pe-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm font-medium transition-all bg-white shadow-sm text-start"
            />
            <FaSearch className="absolute start-4 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchInput && (
              <button type="button" onClick={() => setSearchInput('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 cursor-pointer">
                <FaTimes />
              </button>
            )}
          </form>
        </div>

        {isError && (
          <div className="mb-8 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 animate-fade-in-up">
            <FaExclamationCircle className="text-red-500 text-lg flex-shrink-0" />
            <span className="text-red-700 font-bold">{error?.response?.data?.message || error.message}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-start border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-400">
                    <th className="p-4 font-bold">{t('adminUsers.col_id')}</th>
                    <th className="p-4 font-bold">{t('adminUsers.col_name')}</th>
                    <th className="p-4 font-bold">{t('adminUsers.col_email')}</th>
                    <th className="p-4 font-bold text-center">{t('adminUsers.col_admin')}</th>
                    <th className="p-4 font-bold text-center">{t('adminUsers.col_actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data?.users?.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-mono text-xs text-gray-500 text-start">{user._id.substring(18)}</td>
                      <td className="p-4 font-bold text-sm text-dark text-start">{user.name}</td>
                      <td className="p-4 text-sm text-gray-500 text-start">
                        <a href={`mailto:${ user.email }`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                          <FaEnvelope className="text-gray-400" /> <span dir="ltr">{user.email}</span>
                        </a>
                      </td>
                      <td className="p-4 text-center">
                        {user.isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold border border-green-200">
                            <FaCheck /> {t('adminUsers.admin')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold border border-gray-200">
                            <FaTimes /> {t('adminUsers.customer')}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {/* 🌟 أزرار الحركة المطابقة لشاشة المنتجات والتصنيفات تماماً */}
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            to={`/admin/user/${ user._id }/edit`}
                            variant="soft"
                            size="sm"
                            className="w-10 h-10 !p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200"
                            title={t('adminUsers.edit_user')}
                          >
                            <FaEdit className="text-sm" />
                          </Button>
                          <Button
                            onClick={() => requestDelete(user)}
                            disabled={user.isAdmin}
                            variant="soft"
                            size="sm"
                            className="w-10 h-10 !p-0 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                            title={user.isAdmin ? t('adminUsers.cannot_delete_admin') : t('adminUsers.delete_user')}
                          >
                            <FaTrash className="text-sm" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {data?.users?.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500 font-medium">
                        {t('adminUsers.no_users_found')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="lg:hidden flex flex-col divide-y divide-gray-100">
              {data?.users?.map((user) => (
                <div key={user._id} className="p-5 hover:bg-gray-50/50 transition-colors flex flex-col gap-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col text-start min-w-0">
                      <span className="font-extrabold text-base text-dark truncate block">{user.name}</span>
                      <span className="text-xs text-gray-400 font-medium mt-1">ID: {user._id.substring(18)}</span>
                    </div>
                    <div className="shrink-0">
                      {user.isAdmin ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-black border border-green-200">
                          <FaCheck /> {t('adminUsers.admin')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-[10px] font-black border border-gray-200">
                          <FaTimes /> {t('adminUsers.customer')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <FaEnvelope className="text-gray-400" /> <span dir="ltr" className="truncate">{user.email}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('adminUsers.col_actions')}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        to={`/admin/user/${ user._id }/edit`}
                        variant="soft"
                        size="sm"
                        className="w-9 h-9 !p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl transition-all duration-200"
                      >
                        <FaEdit className="text-sm" />
                      </Button>
                      <Button
                        onClick={() => requestDelete(user)}
                        disabled={user.isAdmin}
                        variant="soft"
                        size="sm"
                        className="w-9 h-9 !p-0 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <FaTrash className="text-sm" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {data?.users?.length === 0 && (
                <div className="p-8 text-center text-gray-500 font-medium">{t('adminUsers.no_users_found')}</div>
              )}
            </div>

            {/* 🌟 ترقيم قياسي باستخدام المكون الموحد Pagination */}
            <div className="px-4">
              <Pagination page={page} pages={data?.pages} onPageChange={setPage} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersScreen;