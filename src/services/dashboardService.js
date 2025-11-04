import api from './api';

export const dashboardService = {
  getSummary: async () => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getPersonalStats: async () => {
    const response = await api.get('/reports/personal', {
      params: { period: 'month' }
    });
    return response.data;
  },
};

