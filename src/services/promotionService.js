import api from './api';

export const promotionService = {
  getPromotions: async () => {
    const response = await api.get('/promotions');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },
};

