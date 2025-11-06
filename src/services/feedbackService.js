import api from "./api";

export const feedbackService = {
  // Lấy tất cả feedback
  getAllFeedbacks: async () => {
    const response = await api.get("/feedbacks");
    return Array.isArray(response.data)
      ? response.data
      : response.data?.data || [];
  },

  // Tạo mới feedback
  createFeedback: async (data) => {
    const response = await api.post("/feedbacks", data);
    return response.data;
  },
};
