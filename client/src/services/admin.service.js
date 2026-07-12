import api from './api';

export const reportService = {
  getReport: (type, params) => api.get(`/reports/${type}`, { params }),
  exportReport: (type, params) => api.get(`/reports/${type}/export`, { params, responseType: 'blob' }),
};

export const dashboardService = {
  getKpis: (params) => api.get('/dashboard/kpis', { params }),
  getCharts: (params) => api.get('/dashboard/charts', { params }),
  getRecentActivity: (params) => api.get('/dashboard/recent-activity', { params }),
};

export const notificationService = {
  getAll: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
};

export const userService = {
  getAll: (params) => api.get('/users', { params }),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
};

export const activityLogService = {
  getAll: (params) => api.get('/activity-logs', { params }),
};
