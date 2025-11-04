import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    const { token, refreshToken, user } = response.data;

    // Store tokens and user info
    await AsyncStorage.setItem("token", token);
    if (refreshToken) {
      await AsyncStorage.setItem("refreshToken", refreshToken);
    }
    await AsyncStorage.setItem("user", JSON.stringify(user));

    return { token, refreshToken, user };
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
    }
  },

  getMe: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  updateProfile: async (profile) => {
    const response = await api.put("/auth/profile", { profile });
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put("/auth/password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};
