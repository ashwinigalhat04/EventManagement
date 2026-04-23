import axios from 'axios';

const API_BASE_URL = 'http://10.154.124.55:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Request interceptor to add the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
