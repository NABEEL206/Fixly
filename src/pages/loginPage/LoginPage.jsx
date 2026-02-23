import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import toast from "react-hot-toast";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  AlertCircle,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, user, loading: authLoading } = useAuth();

  // Form states
  const [loginValue, setLoginValue] = useState(""); // Changed from identifier to loginValue
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  /* 🔐 Redirect if already logged in */
  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user, navigate]);

  const redirectBasedOnRole = (role) => {
    const roleRouteMap = {
      "ADMIN": "/admindashboard",
      "GROW_TAG": "/growtagdashboard",
      "CUSTOMER": "/customerdashboard",
      "FRANCHISE": "/franchisedashboard",
      "OTHER_SHOP": "/othershopdashboard",
    };
    navigate(roleRouteMap[role] || "/");
  };

  // Validation
  const validateInput = () => {
    if (!loginValue.trim()) {
      setError("Please enter your login ID");
      return false;
    }
    if (!password) {
      setError("Please enter your password");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  /* 🔐 LOGIN HANDLER */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateInput()) return;

    setIsLoading(true);

    try {
      console.log("Attempting login with:", loginValue); // Debug log
      
      const result = await login(loginValue, password); // Now using correct parameter name

      console.log("Login result:", result); // Debug log

      if (result.success) {
        toast.success(result.message || "Login successful!");
        // Navigation will happen automatically via the useEffect above
      } else {
        setError(result.message);
        toast.error(result.message || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again.");
      toast.error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-200 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-blue-700">
                Finland Mobile
              </h1>
              <p className="text-gray-600 text-sm mt-2">
                Login to access your dashboard
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-red-50 p-3 border border-red-200"
              >
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Login Field - Now clearly labeled */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Login ID <span className="text-xs text-gray-500">(username or email)</span>
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={loginValue}
                    onChange={(e) => setLoginValue(e.target.value)}
                    className="pl-10 py-6 rounded-xl"
                    placeholder="Enter your username or email"
                    disabled={isLoading}
                    autoFocus
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {loginValue.includes("@") ? (
                      <Mail size={20} />
                    ) : (
                      <User size={20} />
                    )}
                  </span>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 py-6 rounded-xl"
                    placeholder="Enter your password"
                    disabled={isLoading}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Lock size={20} />
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => toast.error("Please contact your administrator")}
                  className="text-sm text-blue-600 hover:underline"
                  disabled={isLoading}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
                disabled={isLoading || authLoading}
              >
                {isLoading || authLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}