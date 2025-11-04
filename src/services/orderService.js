import api from './api';

export const orderService = {
  getOrders: async () => {
    const response = await api.get('/orders');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data?.data || response.data;
  },

  createOrder: async (data) => {
    const response = await api.post('/orders', data);
    return response.data?.data || response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};

// Re-export delivery and payment services for convenience
export { deliveryService } from './deliveryService';
export { paymentService } from './paymentService';

