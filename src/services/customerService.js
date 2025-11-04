import api from './api';

export const customerService = {
  getCustomers: async () => {
    const response = await api.get('/customers');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/customers/${id}`);
    return response.data?.data || response.data;
  },

  createCustomer: async (data) => {
    const response = await api.post('/customers', data);
    return response.data;
  },

  updateCustomer: async (id, data) => {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  },
};

