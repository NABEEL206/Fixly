import axios from "axios";
import toast from "react-hot-toast";
import { BASE_URL } from "@/API/BaseURL";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Prevent multiple refresh calls
let isRefreshing = false;

// Queue requests while refreshing token
let failedQueue = [];

// Prevent multiple network error toasts
let networkToastShown = false;

const showNetworkError = () => {
  if (!networkToastShown) {
    toast.error("No internet connection");
    networkToastShown = true;

    setTimeout(() => {
      networkToastShown = false;
    }, 5000);
  }
};

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// 🔐 Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type") || "Bearer";

    if (token) {
      config.headers.Authorization = `${tokenType} ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 🔁 Handle response errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 🌐 Network error (internet off)
    if (!navigator.onLine || error.message === "Network Error") {
      showNetworkError();
      return Promise.reject(error);
    }

    // If not 401 or already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");

    // No refresh token → logout
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If refresh already running → queue request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken =
        response.data.access || response.data.access_token;

      if (!newAccessToken) {
        throw new Error("No access token in refresh response");
      }

      // Save new token
      localStorage.setItem("access_token", newAccessToken);

      // Update axios header
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newAccessToken}`;

      // Retry queued requests
      processQueue(null, newAccessToken);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      localStorage.clear();
      window.location.href = "/login";

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axiosInstance;