import api from "./api";

export const testDriveService = {
  // Lấy danh sách lịch lái thử
  getAll: async () => {
    const response = await api.get("/test-drives");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  // Lấy chi tiết lịch lái thử theo ID
  getById: async (id) => {
    const response = await api.get(`/test-drives/${id}`);
    return response.data?.data || response.data;
  },

  // Tạo mới lịch lái thử
  create: async (data) => {
    const response = await api.post("/test-drives", data);
    return response.data?.data || response.data;
  },

  // Cập nhật lịch lái thử
  update: async (id, data) => {
    const response = await api.patch(`/test-drives/${id}`, data);
    return response.data?.data || response.data;
  },

  // Xóa lịch lái thử
  delete: async (id) => {
    const response = await api.delete(`/test-drives/${id}`);
    return response.data;
  },
};
