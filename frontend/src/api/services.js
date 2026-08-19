import api from './client';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const patientsApi = {
  list: (params) => api.get('/patients', { params }),
  get: (id) => api.get(`/patients/${id}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
};

export const referralsApi = {
  list: (params) => api.get('/referrals', { params }),
  get: (id) => api.get(`/referrals/${id}`),
  create: (data) => api.post('/referrals', data),
  update: (id, data) => api.patch(`/referrals/${id}`, data),
  delete: (id) => api.delete(`/referrals/${id}`),
  analyze: (referralId) => api.post('/ai/analyze-referral', { referral_id: referralId }),
};

export const tasksApi = {
  list: (params) => api.get('/tasks', { params }),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
};

export const dashboardApi = {
  metrics: () => api.get('/dashboard/metrics'),
};
