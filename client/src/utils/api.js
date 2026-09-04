import axios from 'axios';

const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    }

    const configuredUrl = import.meta.env.VITE_API_URL;
    if (configuredUrl && !configuredUrl.includes('localhost') && !configuredUrl.includes('127.0.0.1')) {
      return configuredUrl;
    }

    return 'https://textile-erp-backend-orpin.vercel.app/api';
  }

  return import.meta.env.VITE_API_URL || 'https://textile-erp-backend-orpin.vercel.app/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    config.baseURL = getApiUrl();
    const token = localStorage.getItem('tf_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
