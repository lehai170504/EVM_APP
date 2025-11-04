import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://sdn-be-1htr.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token and log requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (__DEV__) {
      console.log("📤 API Request:", {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        headers: {
          ...config.headers,
          Authorization: token
            ? `Bearer ${token.substring(0, 20)}...`
            : "No token",
        },
        data: config.data,
        params: config.params,
      });
    }

    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error("❌ Request Error:", error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and log responses
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (__DEV__) {
      console.log("📥 API Response:", {
        method: response.config.method?.toUpperCase(),
        url: `${response.config.baseURL}${response.config.url}`,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
      });
    }
    return response;
  },
  async (error) => {
    // Log error response in development
    if (__DEV__) {
      console.error("❌ API Error:", {
        method: error.config?.method?.toUpperCase(),
        url: error.config
          ? `${error.config.baseURL}${error.config.url}`
          : "Unknown URL",
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        responseData: error.response?.data,
        requestData: error.config?.data,
      });
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      if (__DEV__) {
        console.warn("⚠️ Unauthorized - Removing token");
      }
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
      // Navigate to login (handled in app)
    }
    return Promise.reject(error);
  }
);

export default api;
