import api from './client';

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  forgotPasswordSendOtp: (username_or_email) => api.post('/auth/forgot-password/send-otp', { username_or_email }),
  forgotPasswordReset: (email, otp, new_password) => api.post('/auth/forgot-password/reset', { email, otp, new_password }),
  changePassword: (current_password, new_password) => api.post('/auth/change-password', { current_password, new_password }),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  list: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.patch(`/users/${id}`, data),
};

export const auditApi = {
  list: (params) => api.get('/audit-logs', { params }),
};

export const assignmentsApi = {
  assignPatient: (data) => api.post('/assignments/patient', data),
  assignTask: (data) => api.post('/assignments/task', data),
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

export const documentsApi = {
  list: (params) => api.get('/documents', { params }),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const notificationsApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
};
