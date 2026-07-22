// filepath: frontend/src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx';
import './index.css';

import i18n from './i18n';
import { initializeCsrfProtection } from './axiosSetup';
import './axiosSetup';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';

// 🌟 ضبط اتجاه اللغة قبل بدء المكوّن لتجنب الوميض (Zero-Flicker)
const storedLang = localStorage.getItem('i18nextLng') || 'en';
const initialLang = storedLang.startsWith('ar') ? 'ar' : 'en';
document.documentElement.lang = initialLang;
document.documentElement.dir = initialLang === 'ar' ? 'rtl' : 'ltr';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

initializeCsrfProtection().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <LanguageProvider>
            <AuthProvider>
              <CartProvider>
                <App />
              </CartProvider>
            </AuthProvider>
          </LanguageProvider>
        </ToastProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
});