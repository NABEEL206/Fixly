// src/auth/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { BASE_URL } from "@/API/BaseURL";

const AuthContext = createContext();

// Token endpoints
const LOGIN_API = `${BASE_URL}/auth/login/`;
const REFRESH_API = `${BASE_URL}/auth/token/refresh/`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
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
      localStorage.removeItem("user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("token_type");
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  /* 🔐 LOGIN */
  const login = async (loginValue, password) => {
    setLoading(true);
    try {
      console.log("1. Attempting login to:", LOGIN_API);
      
      const res = await fetch(LOGIN_API, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ 
          login: loginValue,
          password: password 
        }),
      });

      console.log("2. Response status:", res.status);

      const data = await res.json();
      console.log("3. Response data:", data);

      if (!res.ok) {
        throw new Error(data.message || data.detail || "Invalid credentials");
      }

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
        role: data.user.role, // This will be "FRANCHISE" or "OTHERSHOP" or others
        shop_type: data.user.shop_type, // Keep for reference if needed
        permissions: data.user.permissions || [],
        is_active: data.user.is_active
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
      return { 
        success: false, 
        message: error.message || "Login failed. Please try again." 
      };
    } finally {
      setLoading(false);
    }
  };

  /* 🔓 LOGOUT */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("token_type");
  };

  /* 🔁 REFRESH TOKEN */
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    
    if (!refreshToken) {
      logout();
      return null;
    }

    try {
      const res = await fetch(REFRESH_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Token refresh failed");
      }

      localStorage.setItem("access_token", data.access);
      return data.access;
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      return null;
    }
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

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      refreshAccessToken,
      isAuthenticated,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};