import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vvs_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login or OTP failure
      const isAuthPath = error.config.url.includes('/api/auth/login') || error.config.url.includes('/api/auth/verify-otp');
      if (!isAuthPath) {
        localStorage.removeItem('vvs_token');
        localStorage.removeItem('vvs_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
