import api from './api';

export const driverService = {
  getAll: (params) => api.get('/drivers', { params }),
  getById: (id) => api.get(`/drivers/${id}`),
  create: (data) => api.post('/drivers', data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  remove: (id) => api.delete(`/drivers/${id}`),
  updateStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }),
};
