import api from "./api";

export const quoteService = {
  getQuotes: async () => {
    const response = await api.get("/quotes");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  getQuoteById: async (id) => {
    const response = await api.get(`/quotes/${id}`);
    return response.data;
  },

  createQuote: async (data) => {
    const response = await api.post("/quotes", data);
    return response.data;
  },

  updateQuote: async (id, data) => {
    const response = await api.patch(`/quotes/${id}`, data);
    return response.data;
  },

  convertQuote: async (id) => {
    const response = await api.put(`/quotes/${id}/convert`);
    return response.data;
  },
};
