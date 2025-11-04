import api from "./api";

export const vehicleService = {
  getVehicles: async (filters = {}) => {
    const response = await api.get("/vehicles", { params: filters });
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  getVehicleById: async (id) => {
    const response = await api.get(`/vehicles/${id}`);
    return response.data?.data || response.data;
  },

  compareVehicles: async (vehicleIds) => {
    const response = await api.post("/vehicles/compare", { ids: vehicleIds });
    if (response.data?.data?.vehicles) {
      return response.data.data.vehicles;
    }
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  getVehicleColors: async () => {
    const response = await api.get("/vehicle-colors");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },
};
