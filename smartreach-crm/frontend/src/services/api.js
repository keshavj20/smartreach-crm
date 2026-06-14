import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

// Customers
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getOne: (id) => api.get(`/customers/${id}`),
  getStats: (id) => api.get(`/customers/${id}/stats`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
};

// Orders
export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`)
};

// Campaigns
export const campaignAPI = {
  getAll: (params) => api.get('/campaigns', { params }),
  getOne: (id) => api.get(`/campaigns/${id}`),
  getStats: (id) => api.get(`/campaigns/${id}/stats`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
  send: (id) => api.post(`/campaigns/${id}/send`),
  generateAI: (customerId) => api.post('/campaigns/generate-ai', { customerId })
};

export const copilotAPI = {
  preview: (data) => api.post('/copilot/preview', data),
  launch: (data) => api.post('/copilot/launch', data)
};

// Audiences
export const audienceAPI = {
  discover: () => api.get('/audiences/discover'),
  getAIRecommendation: (data) => api.post('/audiences/ai-recommendation', data),
  getSaved: () => api.get('/audiences/saved')
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard')
};

// Settings
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.post('/settings', data)
};

export default api;
