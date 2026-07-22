// filepath: frontend/src/components/profile/UserAddresses.jsx
import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt, FaPlus, FaStar, FaRegStar, FaEdit, FaTrashAlt, FaExclamationCircle, FaPhoneAlt, FaTimes } from 'react-icons/fa';
import Button from '../ui/Button';

const inputStyle = "block px-4 pb-2.5 pt-6 w-full text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:bg-white peer transition-all shadow-sm";
const labelStyle = "absolute text-sm text-gray-400 duration-300 transform -translate-y-3 scale-75 top-3 inset-s-4 rtl:origin-top-right origin-top-left peer-placeholder-shown:translate-y-1 peer-focus:-translate-y-3 font-bold";

const UserAddresses = () => {
  const { userInfo } = useContext(AuthContext);
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [addressName, setAddressName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');

  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['userAddresses'],
    queryFn: async () => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      const { data } = await axios.get('/api/users/profile', config);
      return data.addresses || [];
    },
    enabled: !!userInfo,
  });

  const resetForm = () => {
    setAddressName(''); setAddress(''); setCity(''); setPostalCode(''); setCountry(''); setPhone('');
    setEditingId(null); setShowForm(false); setError('');
  };

  const openEditForm = (addr) => {
    setAddressName(addr.addressName); setAddress(addr.address); setCity(addr.city);
    setPostalCode(addr.postalCode); setCountry(addr.country); setPhone(addr.phone || '');
    setEditingId(addr._id); setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveAddressMutation = useMutation({
    mutationFn: async (addressData) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      if (editingId) return await axios.put(`/api/users/profile/addresses/${ editingId }`, addressData, config);
      return await axios.post('/api/users/profile/addresses', addressData, config);
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['userAddresses'] }); resetForm(); },
    onError: (err) => { setError(err.response?.data?.message || 'Failed to save address.'); }
  });

  const deleteAddressMutation = useMutation({
    mutationFn: async (id) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      return await axios.delete(`/api/users/profile/addresses/${ id }`, config);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userAddresses'] }),
    onError: (err) => setError(err.response?.data?.message || 'Failed to delete address.')
  });

  const setDefaultMutation = useMutation({
    mutationFn: async (id) => {
      const config = { headers: { Authorization: `Bearer ${ userInfo.token }` } };
      return await axios.put(`/api/users/profile/addresses/${ id }/default`, {}, config);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['userAddresses'] }),
    onError: (err) => setError(err.response?.data?.message || 'Failed to set default address.')
  });

  const submitHandler = (e) => {
    e.preventDefault(); setError('');
    saveAddressMutation.mutate({ addressName, address, city, postalCode, country, phone });
  };

  const deleteHandler = (id) => {
    if (window.confirm(t('userAddresses.delete_confirm'))) {
      deleteAddressMutation.mutate(id);
    }
  };

  const setDefaultHandler = (id) => {
    setDefaultMutation.mutate(id);
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 w-full relative overflow-hidden">
      <div className="absolute top-0 inset-e-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 rtl:-translate-x-1/2 pointer-events-none"></div>

      <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 rounded-xl"><FaMapMarkerAlt className="text-xl text-primary" /></div>
          <h2 className="text-2xl font-extrabold text-dark tracking-tight text-start">{t('userAddresses.address_book')}</h2>
        </div>
        {!showForm && (
          <Button
            onClick={() => setShowForm(true)}
            variant="secondary"
            size="md"
            leftIcon={<FaPlus />}
          >
            <span>{t('userAddresses.add_new')}</span>
          </Button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-s-4 border-red-500 rounded-e-xl flex items-center gap-3 shadow-sm animate-fade-in-up">
          <FaExclamationCircle className="text-red-500 text-lg" />
          <span className="text-red-700 font-bold text-sm">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-50 rounded-3xl border-2 border-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : showForm ? (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-gray-100 shadow-xl shadow-gray-200/40 relative z-10 animate-fade-in-up">
          <h3 className="text-xl font-extrabold text-dark mb-6">{editingId ? t('userAddresses.edit_address') : t('userAddresses.add_new_address')}</h3>
          <form onSubmit={submitHandler} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <input type="text" value={addressName} onChange={(e) => setAddressName(e.target.value)} required className={inputStyle} placeholder=" " />
                <label className={labelStyle}>{t('userAddresses.label')}</label>
              </div>
              <div className="relative group">
                <input type="text" value={city} onChange={(e) => setCity(e.target.value)} required className={inputStyle} placeholder=" " />
                <label className={labelStyle}>{t('userAddresses.city')}</label>
              </div>
            </div>
            <div className="relative group">
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} required className={inputStyle} placeholder=" " />
              <label className={labelStyle}>{t('userAddresses.full_street_address')}</label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="relative group">
                <input type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required className={inputStyle} placeholder=" " />
                <label className={labelStyle}>{t('userAddresses.postal_code')}</label>
              </div>
              <div className="relative group">
                <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} required className={inputStyle} placeholder=" " />
                <label className={labelStyle}>{t('userAddresses.country')}</label>
              </div>
              <div className="relative group">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required dir="ltr" className={`${ inputStyle } text-start`} placeholder=" " />
                <label className={labelStyle}>{t('userAddresses.phone_number')}</label>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-4">
              <Button type="button" onClick={resetForm} variant="outline" size="md" className="w-full sm:w-auto" leftIcon={<FaTimes />}>
                {t('profileDetails.cancel', 'Cancel')}
              </Button>
              <Button type="submit" variant="primary" size="md" isLoading={saveAddressMutation.isPending} className="w-full sm:w-auto">
                {t('userAddresses.save_address')}
              </Button>
            </div>
          </form>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-gray-50 rounded-3xl border border-dashed border-gray-200 animate-fade-in-up">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 mx-auto mb-6">
            <circle cx="100" cy="100" r="100" fill="#EFF6FF" />
            <path d="M100 150s40-30 40-70a40 40 0 1 0-80 0c0 40 40 70 40 70z" fill="#fff" stroke="#3B82F6" strokeWidth="8" strokeLinejoin="round" />
            <circle cx="100" cy="80" r="15" fill="#1E293B" />
            <path d="M60 170h80" stroke="#1E293B" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <h3 className="text-2xl font-extrabold text-dark mb-2">{t('userAddresses.no_addresses')}</h3>
          <p className="text-gray-500 font-medium mb-8 max-w-sm mx-auto">{t('userAddresses.add_delivery_addresses')}</p>
          <Button onClick={() => setShowForm(true)} variant="primary" size="lg" className="w-full sm:w-auto" leftIcon={<FaPlus />}>
            {t('userAddresses.add_first_address')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10 text-start">
          {addresses.map((addr) => (
            <div key={addr._id} className={`p-6 rounded-3xl border-2 transition-all duration-300 animate-fade-in-up ${ addr.isDefault ? 'border-primary bg-white shadow-lg shadow-primary/5' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-md' }`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col items-start gap-2">
                  <span className="bg-dark text-white px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest">{addr.addressName}</span>
                  {addr.isDefault && <span className="flex items-center gap-1.5 text-blue-600 text-xs font-bold bg-blue-50 border border-blue-100 px-3 py-1 rounded-lg"><FaStar /> {t('userAddresses.default_address')}</span>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditForm(addr)} className="text-gray-500 hover:text-primary transition-all bg-white border-2 border-gray-100 hover:border-primary w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer"><FaEdit /></button>
                  <button onClick={() => deleteHandler(addr._id)} disabled={deleteAddressMutation.isPending} className="text-gray-500 hover:text-white transition-all bg-white border-2 border-gray-100 hover:bg-red-500 hover:border-red-500 w-10 h-10 rounded-full flex items-center justify-center shadow-sm cursor-pointer"><FaTrashAlt /></button>
                </div>
              </div>
              <div className="text-gray-600 text-sm space-y-2 mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                <p className="font-bold text-dark text-base">{addr.address}</p>
                <p className="font-medium">{addr.city}, {addr.postalCode}</p>
                <p className="font-black text-gray-400 uppercase tracking-wider text-xs pt-1">{addr.country}</p>
                {addr.phone && <p className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200/50 text-dark font-bold" dir="ltr"><FaPhoneAlt className="text-primary text-xs" /> {addr.phone}</p>}
              </div>
              {!addr.isDefault && (
                <Button
                  onClick={() => setDefaultHandler(addr._id)}
                  disabled={setDefaultMutation.isPending}
                  variant="outline"
                  size="md"
                  fullWidth
                  leftIcon={<FaRegStar />}
                >
                  {t('userAddresses.set_as_default')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserAddresses;