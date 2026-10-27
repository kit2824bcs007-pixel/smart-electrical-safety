import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

export const getDashboard = () => api.get('/dashboard').then((r) => r.data);
export const getSensors = () => api.get('/sensors').then((r) => r.data);
export const createSensor = (data) => api.post('/sensors', data).then((r) => r.data);
export const updateSensor = (id, data) => api.put(`/sensors/${id}`, data).then((r) => r.data);
export const deleteSensor = (id) => api.delete(`/sensors/${id}`).then((r) => r.data);
export const setSensorSimulation = (id, enabled) =>
  api.patch(`/sensors/${id}/simulation`, { enabled }).then((r) => r.data);
export const getAlerts = () => api.get('/alerts').then((r) => r.data);
export const updateAlert = (id, status) => api.patch(`/alerts/${id}`, { status }).then((r) => r.data);
export const getReports = (params = {}) => api.get('/reports', { params }).then((r) => r.data);
export const getSettings = () => api.get('/settings').then((r) => r.data);
export const saveSettings = (settings) => api.put('/settings', settings).then((r) => r.data);
export const getHealth = () => api.get('/health').then((r) => r.data);

export default api;
