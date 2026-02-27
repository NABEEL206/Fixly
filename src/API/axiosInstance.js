import axios from "axios";
import { BASE_URL } from "@/API/BaseURL";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// 🔐 Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type");

    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🚨 Optional: Handle 401 globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;