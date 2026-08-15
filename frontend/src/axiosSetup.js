// filepath: frontend/src/axiosSetup.js
import axios from 'axios';

// 🌟 تحديد رابط الـ API تلقائياً في بيئة الإنتاج إن وجد
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

axios.defaults.withCredentials = true;

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🌟 التجديد التلقائي للتوكن (Refresh Token Interceptor)
    if (error.response && error.response.status === 401) {
      const url = originalRequest.url || '';
      
      const isPublicAuthRoute = url.includes('/login') || 
                                url.includes('/google') || 
                                url.includes('/guest/track') || 
                                url.includes('/verify-account') ||
                                url.includes('/refresh');
      
      if (!isPublicAuthRoute && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise(function(resolve, reject) {
            failedQueue.push({resolve, reject});
          }).then(() => {
            return axios(originalRequest);
          }).catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await axios.post('/api/users/refresh');
          processQueue(null);
          return axios(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          if (localStorage.getItem('userInfo')) {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('cartItems');
            window.location.href = '/login?expired=true';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (!isPublicAuthRoute && localStorage.getItem('userInfo') && originalRequest._retry) {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('cartItems');
        window.location.href = '/login?expired=true';
        return Promise.reject(error);
      }
    }

    // 🌟 التجديد التلقائي لرمز CSRF عند الانتهاء
    if (error.response && error.response.status === 403 && error.response.data?.message?.includes('CSRF')) {
      if (!originalRequest._retryCsrf) {
        originalRequest._retryCsrf = true;
        try {
          const { data } = await axios.get('/api/csrf-token');
          axios.defaults.headers.common['X-CSRF-Token'] = data.csrfToken;
          axios.defaults.headers.common['x-csrf-token'] = data.csrfToken;
          originalRequest.headers['X-CSRF-Token'] = data.csrfToken;
          originalRequest.headers['x-csrf-token'] = data.csrfToken;
          return axios(originalRequest);
        } catch (csrfError) {
          return Promise.reject(csrfError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const initializeCsrfProtection = async () => {
  try {
    const { data } = await axios.get('/api/csrf-token');
    axios.defaults.headers.common['csrf-token'] = data.csrfToken;
    axios.defaults.headers.common['x-csrf-token'] = data.csrfToken;
    axios.defaults.headers.common['X-CSRF-Token'] = data.csrfToken; 
  } catch (error) {
    console.warn('⚠️ CSRF initialization failed. Secure routes might block requests.');
  }
};