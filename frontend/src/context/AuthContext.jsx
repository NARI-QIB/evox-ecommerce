// filepath: frontend/src/context/AuthContext.jsx
import { createContext, useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();

  const [userInfo, setUserInfo] = useState(() => {
    const storedUser = localStorage.getItem('userInfo');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const login = async (email, password) => {
    try {
      const { data } = await axios.post('/api/users/login', { email, password });
      setUserInfo(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const { data } = await axios.post('/api/users/register', { name, email, password });
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  };

  const googleLoginAuth = async (idToken) => {
    try {
      const { data } = await axios.post('/api/users/google', { idToken });
      setUserInfo(data);
      localStorage.setItem('userInfo', JSON.stringify(data));
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || 'Google Login failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/users/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 1. تنظيف كافة بيانات الجلسة وسجل الشحن والسلة فوراً من الـ localStorage
      localStorage.removeItem('userInfo');
      localStorage.removeItem('cartItems');
      localStorage.removeItem('shippingAddress');
      localStorage.removeItem('paymentMethod');

      queryClient.clear();

      // 2. إعادة تحميل وتوجيه الصفحة برابط مباشر لتنظيف ذاكرة التطبيق (Memory State) 
      // دون إتاحة الفرصة لمكونات السلة بإعادة كتابة البيانات المحذوفة
      window.location.href = '/login';
    }
  };

  const updateUserSession = (data) => {
    const updatedUser = { ...userInfo, ...data };
    setUserInfo(updatedUser);
    localStorage.setItem('userInfo', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ userInfo, login, register, googleLoginAuth, logout, updateUserSession }}>
      {children}
    </AuthContext.Provider>
  );
};