import api from './api';

export const paymentService = {
  getPayments: async (orderId) => {
    const response = await api.get('/payments', {
      params: orderId ? { order: orderId } : {}
    });
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  createPayment: async (data) => {
    const response = await api.post('/payments', data);
    return response.data;
  },
};

