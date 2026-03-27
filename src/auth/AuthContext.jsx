// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axiosInstance from "@/API/axiosInstance";

const AuthContext = createContext();

// Login endpoint
const LOGIN_API = "/auth/login/";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper function to clear auth storage
const clearAuthStorage = () => {
  localStorage.removeItem("user");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("token_type");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const accessToken = localStorage.getItem("access_token");
      
      if (savedUser && savedUser !== "undefined" && accessToken) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error("Failed to parse user data:", error);
      clearAuthStorage();
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  /* 🔐 LOGIN */
  const login = async (loginValue, password) => {
    setLoading(true);
    try {
      console.log("1. Attempting login to:", LOGIN_API);
      
      const response = await axiosInstance.post(LOGIN_API, {
        login: loginValue,
        password: password
      });

      console.log("2. Response status:", response.status);
      console.log("3. Response data:", response.data);

      const data = response.data;

      // Save token
      localStorage.setItem("access_token", data.access_token);

      if (data.refresh_token) {
        // JWT user (ADMIN)
        localStorage.setItem("refresh_token", data.refresh_token);
        localStorage.setItem("token_type", "Bearer");
      } else {
        // DRF Token user (FRANCHISE, GROWTAG, CUSTOMER, etc.)
        localStorage.setItem("token_type", "Token");
      }
      
      // Save user data with all fields from API
      const userData = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role,
        shop_type: data.user.shop_type,
        permissions: data.user.permissions || [],
        is_active: data.user.is_active,
         phone: data.user.customer_phone
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      console.log("4. Login successful, user data:", userData);

      return { 
        success: true, 
        user: userData,
        message: data.message || "Login successful" 
      };
    } catch (error) {
      console.error("5. Login error:", error);
      
      // Extract error message from response
      let errorMessage = "Login failed. Please try again.";
      if (error.response?.data) {
        errorMessage = error.response.data.message || 
                      error.response.data.detail || 
                      error.response.data.error ||
                      JSON.stringify(error.response.data) ||
                      errorMessage;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  /* 🔓 LOGOUT */
  const logout = () => {
    setUser(null);
    clearAuthStorage();
  };

  /* 🔐 CHECK AUTH STATUS */
  const isAuthenticated = () => {
    const token = localStorage.getItem("access_token");
    const userData = localStorage.getItem("user");
    return !!(token && userData && userData !== "undefined");
  };

  /* 🔁 Sync auth between tabs */
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        try {
          if (e.newValue && e.newValue !== "undefined") {
            setUser(JSON.parse(e.newValue));
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Failed to parse user data on storage change:", error);
          setUser(null);
        }
      }
      
      if (e.key === "access_token" && !e.newValue) {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};