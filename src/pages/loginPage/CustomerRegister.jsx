import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { BASE_URL } from "@/API/BaseURL";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  MapPin,
  AlertCircle,
  ArrowLeft
} from "lucide-react";

const REGISTER_API = `${BASE_URL}/api/public/customers/register/`;

export default function CustomerRegister() {
  const navigate = useNavigate();
  
  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Validation
  const validateForm = () => {
    if (!name.trim()) {
      setError("Name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return false;
    }
    if (!phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError("Phone number must be exactly 10 digits");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      console.log("Sending registration request to:", REGISTER_API);
      
      const response = await fetch(REGISTER_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: name,
          email: email,
          customer_phone: phone,
          password: password,
          confirm_password: confirmPassword,
          address: address,
        }),
      });

      const data = await response.json();
      console.log("Registration response:", data);

      if (!response.ok) {
        // Handle validation errors
        if (data.confirm_password) {
          throw new Error(data.confirm_password[0]);
        } else if (data.email) {
          throw new Error(data.email[0]);
        } else if (data.customer_phone) {
          throw new Error(data.customer_phone[0]);
        } else if (data.password) {
          throw new Error(data.password[0]);
        } else {
          throw new Error(data.message || data.error || "Registration failed");
        }
      }

      // Show success message
      toast.success("Registration successful! Please login.");
      
      // Redirect to login page
      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
      toast.error(error.message || "Registration failed");
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
        <Card className="shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-5 space-y-4">
            {/* Header with back button */}
            <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
              <button
                onClick={() => navigate("/login")}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Back to login"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <div className="flex-1 text-center">
                <h1 className="text-xl font-bold text-blue-700">
                  Create Account
                </h1>
                <p className="text-xs text-gray-500">
                  Join Fixly Mobiles today
                </p>
              </div>
              <div className="w-8"></div> {/* Spacer for alignment */}
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-md bg-red-50 p-2 border border-red-200"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleRegister} className="space-y-3">
              {/* Two-column layout for Name and Phone on larger screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name Field */}
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-8 py-2 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                      placeholder="Full name *"
                      disabled={isLoading}
                    />
                    <User size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="pl-8 py-2 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                      placeholder="Phone * (10 digits)"
                      maxLength={10}
                      disabled={isLoading}
                    />
                    <Phone size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Email Field - Full width */}
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-8 py-2 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                    placeholder="Email address *"
                    disabled={isLoading}
                  />
                  <Mail size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Two-column layout for Password fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Password Field */}
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-8 pr-8 py-2 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                      placeholder="Password *"
                      disabled={isLoading}
                    />
                    <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1">
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-8 pr-8 py-2 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                      placeholder="Confirm password *"
                      disabled={isLoading}
                    />
                    <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-1">
                <div className="relative">
                  <Input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-8 py-2 text-sm rounded-lg border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
                    placeholder="Address (optional)"
                    disabled={isLoading}
                  />
                  <MapPin size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Submit Button - Smaller */}
              <Button
                type="submit"
                className="w-full py-2.5 text-sm font-semibold bg-green-600 hover:bg-green-700 rounded-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </div>
                ) : (
                  "Create Account"
                )}
              </Button>

              {/* Link back to login - Compact */}
              <div className="text-center pt-1">
                <p className="text-xs text-gray-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    disabled={isLoading}
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}