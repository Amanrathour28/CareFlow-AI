import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('careflow_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('careflow_token');
      localStorage.removeItem('careflow_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
