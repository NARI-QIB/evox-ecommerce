// filepath: frontend/src/pages/admin/AdminUsersScreen.jsx
import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Breadcrumb from '../../components/Breadcrumb';
import Button from '../../components/ui/Button';
import {
  FaExclamationCircle, FaUsers, FaChartLine,
  FaCheck, FaTimes, FaTrash, FaEdit, FaEnvelope, FaSearch
} from 'react-icons/fa';

const AdminUsersScreen = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');

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

  const deleteHandler = async (id, name) => {
    if (window.confirm(`${ t('adminUsers.delete_confirm') } "${ name }"?`)) {
      try {
        const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
        await axios.delete(`/api/users/${ id }`, config);
        queryClient.invalidateQueries(['adminUsers']);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
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
            <div className="overflow-x-auto">
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
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            to={`/admin/user/${ user._id }/edit`}
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 !p-0 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg"
                            title={t('adminUsers.edit_user')}
                          >
                            <FaEdit />
                          </Button>
                          <Button
                            onClick={() => deleteHandler(user._id, user.name)}
                            disabled={user.isAdmin}
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 !p-0 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-lg"
                            title={user.isAdmin ? t('adminUsers.cannot_delete_admin') : t('adminUsers.delete_user')}
                          >
                            <FaTrash />
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

            {data?.pages > 1 && (
              <div className="p-4 border-t border-gray-100 flex justify-center gap-2 bg-gray-50/30" dir="ltr">
                {[...Array(data.pages).keys()].map((x) => (
                  <Button
                    key={x + 1}
                    onClick={() => setPage(x + 1)}
                    variant={x + 1 === page ? 'primary' : 'outline'}
                    size="sm"
                    className={`w-10 h-10 !p-0 ${ x + 1 === page ? 'scale-110 shadow-lg' : '' }`}
                  >
                    {x + 1}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersScreen;