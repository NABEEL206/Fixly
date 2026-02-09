import React, { createContext, useContext, useState, useEffect } from "react";
import { BASE_URL } from "@/API/BaseURL";

const AuthContext = createContext();

// ✅ TOKEN ENDPOINT
const TOKEN_API = `${BASE_URL}/api/token/`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /* 🔐 LOGIN */
  const login = async (username, password) => {
    try {
      const res = await fetch(TOKEN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        throw new Error("Invalid credentials");
      }

      const data = await res.json();

      // Save tokens
      localStorage.setItem("access_token", data.access);
      localStorage.setItem("refresh_token", data.refresh);

      // ⚠️ TEMP user object (until backend sends role)
      const userData = {
        username,
        role: "ADMIN", // backend should send later
        token: data.access,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /* 🔓 LOGOUT */
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  };

  /* 🔁 Sync auth between tabs */
  useEffect(() => {
    const handleStorageChange = () => {
      const savedUser = localStorage.getItem("user");
      setUser(savedUser ? JSON.parse(savedUser) : null);
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
