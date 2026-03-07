// src/API/axiosInstance.js
import axios from "axios";
import { BASE_URL } from "@/API/BaseURL";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
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

// 🔁 Handle 401 with token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if we have a refresh token
    const refreshToken = localStorage.getItem("refresh_token");
    
    // If no refresh token, clear and redirect to login
    if (!refreshToken) {
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // Mark request as retried to prevent infinite loops
    originalRequest._retry = true;

    // If already refreshing, add to queue
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    isRefreshing = true;

    try {
      // Attempt to refresh the token
      const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken
      });

      const newAccessToken = response.data.access || response.data.access_token;
      
      if (!newAccessToken) {
        throw new Error("No access token in refresh response");
      }

      // Update token in localStorage
      localStorage.setItem("access_token", newAccessToken);

      // Update authorization header
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

      // Process queued requests
      processQueue(null, newAccessToken);

      // Retry original request
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosInstance(originalRequest);

    } catch (refreshError) {
      // Refresh failed - clear everything and redirect to login
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