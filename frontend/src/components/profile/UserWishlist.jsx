// filepath: frontend/src/components/profile/UserWishlist.jsx
import { useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AuthContext } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../context/LanguageContext';
import Button from '../ui/Button';
import {
  FaHeart, FaTrashAlt, FaExclamationCircle, FaArrowRight
} from 'react-icons/fa';

const UserWishlist = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const { getDBText } = useLanguage();
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading, isError, error } = useQuery({
    queryKey: ['myWishlist'],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.get('/api/users/profile/wishlist', config);
      return data;
    },
    enabled: !!userInfo,
    staleTime: 5 * 60 * 1000,
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (productId) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      return await axios.post('/api/users/profile/wishlist', { productId }, config);
    },
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: ['myWishlist'] });
      const previousWishlist = queryClient.getQueryData(['myWishlist']) || [];

      queryClient.setQueryData(['myWishlist'], previousWishlist.filter(item => (item._id || item) !== productId));

      return { previousWishlist };
    },
    onError: (err, productId, context) => {
      if (context?.previousWishlist) {
        queryClient.setQueryData(['myWishlist'], context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['myWishlist'] });
      queryClient.invalidateQueries({ queryKey: ['userProfileStats'] });
    }
  });

  const removeFromWishlistHandler = (productId) => {
    toggleWishlistMutation.mutate(productId);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 w-full relative overflow-hidden">
      <div className="absolute top-0 inset-e-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-red-50 rounded-xl"><FaHeart className="text-xl text-red-500" /></div>
          <h2 className="text-2xl font-extrabold text-dark tracking-tight text-start">{t('userWishlist.title')}</h2>
        </div>
        {!isLoading && wishlist.length > 0 && (
          <span className="bg-dark text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm">
            {wishlist.length} {t('userWishlist.items')}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-50 rounded-2xl border border-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 shadow-sm animate-fade-in-up">
          <FaExclamationCircle className="text-red-500 text-lg shrink-0" />
          <span className="text-red-700 font-bold text-sm">{error?.response?.data?.message || 'Error'}</span>
        </div>
      ) : wishlist.length === 0 ? (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border border-dashed border-gray-200 animate-fade-in-up">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 mx-auto mb-6">
            <circle cx="100" cy="100" r="100" fill="#FEF2F2" />
            <path d="M100 160l-15-15C45 110 30 85 30 65c0-20 15-35 35-35 15 0 25 10 35 20 10-10 20-20 35-20 20 0 35 15 35 35 0 20-15 45-55 80l-15 15z" fill="#fff" stroke="#EF4444" strokeWidth="8" strokeLinejoin="round" />
            <path d="M100 45v115M60 85h80" stroke="#EF4444" strokeWidth="8" strokeLinecap="round" strokeDasharray="10 10" />
            <circle cx="160" cy="40" r="12" fill="#F97316" />
          </svg>
          <h3 className="text-2xl font-extrabold text-dark mb-2">{t('userWishlist.empty_title')}</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">{t('userWishlist.empty_desc')}</p>
          <Button to="/" variant="primary" size="lg" rightIcon={<FaArrowRight className="rtl:rotate-180" />}>
            {t('userWishlist.discover')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10 animate-fade-in-up">
          {wishlist.map((item) => {
            const productName = getDBText(item.name, 'Unnamed Product');
            const safeImage = item.image && !item.image.includes('sample.jpg') ? item.image : '/images/placeholder.png';

            return (
              <div key={item._id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="relative aspect-square bg-[#F5F5F5] overflow-hidden flex items-center justify-center p-6">
                  <Link to={`/product/${ item._id }`} className="w-full h-full flex items-center justify-center">
                    <img src={safeImage} alt={productName} className="max-h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                  </Link>
                  <button onClick={() => removeFromWishlistHandler(item._id)} className="absolute top-3 inset-e-3 bg-white/90 backdrop-blur-sm w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-all focus:outline-none cursor-pointer">
                    <FaTrashAlt className="text-sm" />
                  </button>
                </div>
                <div className="p-5 flex flex-col grow text-start">
                  <Link to={`/product/${ item._id }`} className="text-dark font-heading font-bold text-lg leading-tight mb-2 hover:text-primary transition-colors line-clamp-2 uppercase tracking-wide">
                    {productName}
                  </Link>
                  <div className="text-primary font-heading font-black text-2xl mb-4 mt-auto" dir="ltr">
                    ${item.price?.toFixed(2) || '0.00'}
                  </div>
                  <div className="grid grid-cols-4 gap-2 mt-auto">
                    <Button
                      to={`/product/${ item._id }`}
                      variant="primary"
                      size="sm"
                      className="col-span-3 !py-3 text-xs font-black"
                      rightIcon={<FaArrowRight className="text-[10px] rtl:rotate-180" />}
                    >
                      {t('userWishlist.view_gear')}
                    </Button>
                    <button onClick={() => removeFromWishlistHandler(item._id)} className="col-span-1 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 py-3 rounded-xl flex items-center justify-center transition-colors border border-gray-100 cursor-pointer">
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default UserWishlist;