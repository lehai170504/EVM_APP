import api from "./api";

export const testDriveService = {
  // Lấy danh sách lịch lái thử
  getTestDrives: async () => {
    const response = await api.get("/test-drives");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  // Lấy chi tiết lịch lái thử theo ID
  getTestDriveById: async (id) => {
    const response = await api.get(`/test-drives/${id}`);
    return response.data?.data || response.data;
  },

  // Tạo mới lịch lái thử
  createTestDrive: async (data) => {
    // data: { customer, variant, preferredTime }
    const response = await api.post("/test-drives", data);
    return response.data?.data || response.data;
  },

  // Cập nhật thông tin lịch lái thử
  updateTestDrive: async (id, data) => {
    // data có thể gồm: customer, variant, preferredTime, status
    const response = await api.patch(`/test-drives/${id}`, data);
    return response.data?.data || response.data;
  },

  // Xóa lịch lái thử
  deleteTestDrive: async (id) => {
    const response = await api.delete(`/test-drives/${id}`);
    return response.data;
  },

  // Hoàn tất lịch lái thử và ghi phản hồi (DealerStaff)
  completeTestDrive: async (id, feedback, interestRate) => {
    const response = await api.patch(`/test-drives/${id}`, {
      status: "done",
      result: {
        feedback,
        interestRate,
      },
    });
    // Trả về dữ liệu trực tiếp hoặc trong data nếu backend bọc
    return response.data?.data || response.data;
  },
};
