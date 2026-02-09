// src/Layout/ProtectedLayout.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Layout from "./Layout";

export default function ProtectedLayout({ children }) {
  const { user } = useAuth();
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If logged in, show the full layout
  return <Layout>{children}</Layout>;
}