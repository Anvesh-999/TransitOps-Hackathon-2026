import api from './api';

export const fuelLogService = {
  getAll: (params) => api.get('/fuel-logs', { params }),
  create: (data) => api.post('/fuel-logs', data),
  remove: (id) => api.delete(`/fuel-logs/${id}`),
};

export const expenseService = {
  getAll: (params) => api.get('/expenses', { params }),
  create: (data) => api.post('/expenses', data),
  remove: (id) => api.delete(`/expenses/${id}`),
};
