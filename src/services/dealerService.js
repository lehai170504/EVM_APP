import api from "./api";

export const dealerService = {
  getDealers: async () => {
    const response = await api.get("/dealers");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },
};
