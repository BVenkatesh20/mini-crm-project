import api from './client';

const data = (res) => res.data;

export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then(data),
  me: () => api.get('/auth/me').then(data),
};

export const usersApi = {
  list: () => api.get('/users').then((res) => res.data.data),
};

export const dashboardApi = {
  stats: (params) => api.get('/dashboard/stats', { params }).then((res) => res.data.data),
};

export const leadsApi = {
  list: (params) => api.get('/leads', { params }).then(data),
  create: (payload) => api.post('/leads', payload).then((res) => res.data.data),
  update: (id, payload) => api.put(`/leads/${id}`, payload).then((res) => res.data.data),
  remove: (id) => api.delete(`/leads/${id}`).then(data),
};

export const companiesApi = {
  list: () => api.get('/companies').then((res) => res.data.data),
  get: (id) => api.get(`/companies/${id}`).then((res) => res.data.data),
  create: (payload) => api.post('/companies', payload).then((res) => res.data.data),
};

export const tasksApi = {
  list: (params) => api.get('/tasks', { params }).then(data),
  create: (payload) => api.post('/tasks', payload).then((res) => res.data.data),
  updateStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }).then((res) => res.data.data),
};
