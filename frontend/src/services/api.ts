import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; password: string; name: string; companyBranding?: Record<string, string> }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: Record<string, unknown>) => api.put('/auth/profile', data),
  connectSocial: (data: { platform: string; credentials: Record<string, string> }) =>
    api.post('/auth/social/connect', data),
  disconnectSocial: (platform: string) => api.delete(`/auth/social/${platform}`),
};

export const contentAPI = {
  generate: (data: {
    topic: string;
    contentType: string;
    platforms: string[];
    language?: string;
    tone?: string;
    includeHashtags?: boolean;
    includeBranding?: boolean;
    scheduleAt?: string;
    isAd?: boolean;
    adSettings?: Record<string, unknown>;
  }) => api.post('/content/generate', data),
  publish: (contentId: string, platforms?: string[]) =>
    api.post(`/content/${contentId}/publish`, { platforms }),
  getAll: (params?: { status?: string; contentType?: string; page?: number; limit?: number }) =>
    api.get('/content', { params }),
  getById: (id: string) => api.get(`/content/${id}`),
  delete: (id: string) => api.delete(`/content/${id}`),
  getDashboard: () => api.get('/content/dashboard'),
  getTrending: () => api.get('/content/trending'),
  getLanguages: () => api.get('/content/languages'),
  generateHashtags: (data: { topic: string; platform?: string; count?: number }) =>
    api.post('/content/hashtags', data),
  translate: (data: { text: string; hashtags?: string[]; targetLanguage: string; sourceLanguage?: string }) =>
    api.post('/content/translate', data),
};

export const scheduleAPI = {
  getAll: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/schedules', { params }),
  create: (data: {
    contentId: string;
    platforms: string[];
    scheduledAt: string;
    timezone?: string;
    recurring?: boolean;
    cronExpression?: string;
  }) => api.post('/schedules', data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/schedules/${id}`, data),
  cancel: (id: string) => api.post(`/schedules/${id}/cancel`),
};

export default api;
