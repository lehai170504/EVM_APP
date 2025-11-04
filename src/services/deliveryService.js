import api from './api';

export const deliveryService = {
  getDeliveries: async (orderId) => {
    const response = await api.get('/deliveries', {
      params: orderId ? { order: orderId } : {}
    });
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  createDelivery: async (data) => {
    const response = await api.post('/deliveries', data);
    return response.data;
  },

  updateDeliveryStatus: async (id, status) => {
    const response = await api.put(`/deliveries/${id}/status`, { status });
    return response.data;
  },
};

