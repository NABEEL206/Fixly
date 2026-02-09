// src/pages/loginPage/LoginPage.jsx
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
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  PhoneCall,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();

  const { login, user } = useAuth();
  console.log("user", user);

  const [isRegister, setIsRegister] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* 🔐 Redirect if already logged in */
  useEffect(() => {
    if (user) {
      redirectBasedOnRole(user.role);
    }
  }, [user, navigate]);

  const redirectBasedOnRole = (role) => {
    const roleRouteMap = {
      ADMIN: "/admindashboard",
      GROW_TAG: "/growtagdashboard",
      CUSTOMER: "/customerdashboard",
      FRANCHISE: "/franchisedashboard",
      OTHER_SHOP: "/othershopdashboard",
    };
    navigate(roleRouteMap[role] || "/");
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  // Check if email exists in users
  // const checkEmailExists = (email) => {
  //   // Check in mock users
  //   const mockUsers = [
  //     { email: "admin@fixly.com" },
  //     { email: "growtag@fixly.com" },
  //     { email: "customer@fixly.com" },
  //     { email: "franchise@fixly.com" },
  //     { email: "shop@fixly.com" },
  //   ];

  //   // Check in registered users
  //   const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

  //   const allUsers = [...mockUsers, ...registeredUsers];
  //   return allUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
  // };

  /* 🔐 FORGOT PASSWORD */
  const handleForgotPassword = async () => {
    // Validate email
    if (!resetEmail) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(resetEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    // Check if email exists
    if (!checkEmailExists(resetEmail)) {
      setError("Email address not found. Please check your email.");
      return;
    }

    // Validate new password
    if (!newPassword || !confirmNewPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("New passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Get all users from localStorage
      const registeredUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]"
      );

      let updatedUsers = [...registeredUsers];
      let passwordUpdated = false;

      // Update password in registered users
      updatedUsers = updatedUsers.map((user) => {
        if (user.email.toLowerCase() === resetEmail.toLowerCase()) {
          passwordUpdated = true;
          return { ...user, password: newPassword };
        }
        return user;
      });

      const isMockUser = mockUsers.some(
        (user) => user.email.toLowerCase() === resetEmail.toLowerCase()
      );

      // Save updated users to localStorage
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));

      // Simulate API delay
      setTimeout(() => {
        if (passwordUpdated || isMockUser) {
          toast.success(
            "Password reset successfully! You can now login with your new password."
          );

          // Reset everything and go back to login
          setShowForgotPassword(false);
          setResetEmail("");
          setNewPassword("");
          setConfirmNewPassword("");

          // Pre-fill the login form with the email
          setIdentifier(resetEmail);
          setPassword("");
        } else {
          toast.success(
            "Password reset successfully! For demo users, use the original password to login."
          );
        }

        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error("Password reset error:", err);
      setError("Failed to reset password. Please try again.");
      toast.error("Password reset failed");
      setLoading(false);
    }
  };

  /* 🔐 REGISTER - ONLY FOR CUSTOMERS */
  const handleRegister = async () => {
    setError("");
    setLoading(true);

    if (!name || !email || !phone || !password) {
      setError("Please fill all fields");
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (!validatePhone(phone)) {
      setError("Please enter a valid phone number (10+ digits)");
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // Check if email/phone already exists in localStorage
      const existingUsers = JSON.parse(
        localStorage.getItem("registeredUsers") || "[]"
      );

      const emailExists = existingUsers.some((u) => u.email === email);
      const phoneExists = existingUsers.some((u) => u.phone === phone);

      if (emailExists) {
        setError("Email already registered");
        setLoading(false);
        return;
      }

      if (phoneExists) {
        setError("Phone number already registered");
        setLoading(false);
        return;
      }

      // Create new user object
      const newUser = {
        id: Date.now(),
        name,
        email,
        phone,
        password, // In real app, this should be hashed
        role: "CUSTOMER",
        isSelfRegistered: true,
        createdAt: new Date().toISOString(),
      };

      // Save to localStorage (for demo purposes)
      const updatedUsers = [...existingUsers, newUser];
      localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));

      // Simulate API delay
      setTimeout(() => {
        // Show success message but DON'T login automatically
        setRegistrationSuccess(true);
        setRegisteredEmail(email);

        // Pre-fill the login form with registered credentials
        setIdentifier(email); // Auto-fill email for login
        setPassword(""); // Clear password for security

        toast.success(
          "Registration successful! Please login with your credentials."
        );

        // Reset registration form
        setName("");
        setPhone("");
        setEmail("");
        setConfirmPassword("");

        setLoading(false);

        // Switch back to login mode after 2 seconds
        setTimeout(() => {
          setIsRegister(false);
        }, 2000);
      }, 1000);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Registration failed. Please try again.");
      toast.error("Registration failed");
      setLoading(false);
    }
  };

  /* 🔐 LOGIN - FOR ALL ROLES */
  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const result = await login(identifier, password);

    if (result.success) {
      toast.success("Login successful");
      redirectBasedOnRole(result.user.role);
    } else {
      setError("Invalid username or password");
      toast.error("Login failed");
    }

    setLoading(false);
  };

  /* 🔐 MAIN SUBMIT HANDLER */
  const handleSubmit = async () => {
    if (showForgotPassword) {
      handleForgotPassword();
    } else if (isRegister) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const resetAll = () => {
    setIdentifier("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
    setEmail("");
    setResetEmail("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setRegistrationSuccess(false);
  };

  const toggleMode = () => {
    setIsRegister(!isRegister);
    setShowForgotPassword(false);
    setRegistrationSuccess(false);
    resetAll();
  };

  const renderLoginForm = () => (
    <>
      {registrationSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="font-medium text-green-800">
                Registration Successful!
              </p>
              <p className="text-sm text-green-700 mt-1">
                You can now login with your email:{" "}
                <span className="font-semibold">{registeredEmail}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <InputField
        label="Email or Mobile"
        icon={
          identifier.includes("@") ? <Mail size={20} /> : <Phone size={20} />
        }
        value={identifier}
        onChange={setIdentifier}
        placeholder="Enter your email or phone number"
        type="text"
      />

      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        show={showPassword}
        toggle={() => setShowPassword(!showPassword)}
        placeholder="Enter your password"
      />

      <div className="flex justify-end">
        <button
          onClick={() => {
            setShowForgotPassword(true);
            setIsRegister(false);
            setRegistrationSuccess(false);
            resetAll();
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          Forgot password?
        </button>
      </div>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <InputField
        label="Full Name *"
        icon={<User size={20} />}
        value={name}
        onChange={setName}
        placeholder="Enter your full name"
        type="text"
      />
      <TwoCol>
        <InputField
          label="Phone Number *"
          icon={<PhoneCall size={20} />}
          value={phone}
          onChange={setPhone}
          placeholder="phone"
          type="tel"
        />
        <InputField
          label="Email *"
          icon={<Mail size={20} />}
          value={email}
          onChange={setEmail}
          placeholder="Email"
          type="email"
        />
      </TwoCol>
      <TwoCol>
        <PasswordField
          label="Password *"
          value={password}
          onChange={setPassword}
          show={showPassword}
          toggle={() => setShowPassword(!showPassword)}
          placeholder="password"
        />
        <PasswordField
          label="Confirm Password *"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          toggle={() => setShowConfirmPassword(!showConfirmPassword)}
          placeholder="password"
        />
      </TwoCol>
      \{" "}
    </>
  );

  const renderForgotPassword = () => (
    <>
      <button
        onClick={() => {
          setShowForgotPassword(false);
          resetAll();
        }}
        className="flex items-center text-sm text-blue-600 mb-4 hover:underline"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Login
      </button>

      <h2 className="text-xl font-bold text-gray-800 mb-2">
        Reset Your Password
      </h2>
      <p className="text-gray-600 mb-6">
        Enter your email and create a new password.
      </p>

      <div className="space-y-4">
        <InputField
          label="Email Address *"
          icon={<Mail size={20} />}
          value={resetEmail}
          onChange={setResetEmail}
          placeholder="Enter your registered email"
          type="email"
        />

        <PasswordField
          label="New Password *"
          value={newPassword}
          onChange={setNewPassword}
          show={showNewPassword}
          toggle={() => setShowNewPassword(!showNewPassword)}
          placeholder="Enter new password (min. 6 characters)"
        />

        <PasswordField
          label="Confirm New Password *"
          value={confirmNewPassword}
          onChange={setConfirmNewPassword}
          show={showConfirmNewPassword}
          toggle={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
          placeholder="Confirm your new password"
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-200 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl rounded-2xl">
          <CardContent className="p-6 space-y-6">
            {!showForgotPassword && (
              <div className="text-center">
                <h1 className="text-3xl font-bold text-blue-700">
                  Finland Mobile
                </h1>
                <p className="text-gray-600 text-sm">
                  {isRegister ? "Customer Registration" : "Login to continue"}
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-red-50 p-3 border border-red-200">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {showForgotPassword
              ? renderForgotPassword()
              : isRegister
              ? renderRegisterForm()
              : renderLoginForm()}

            <Button
              onClick={handleSubmit}
              className="w-full py-6 text-lg font-semibold bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {showForgotPassword
                    ? "Resetting Password..."
                    : isRegister
                    ? "Creating Account..."
                    : "Logging in..."}
                </div>
              ) : showForgotPassword ? (
                "Reset Password"
              ) : isRegister ? (
                "Register as Customer"
              ) : (
                "Login"
              )}
            </Button>

            {!showForgotPassword && (
              <p className="text-center text-sm text-gray-600">
                {isRegister ? "Already have an account?" : "New customer?"}
                <button
                  onClick={toggleMode}
                  className="ml-2 text-blue-600 font-semibold hover:underline"
                  disabled={loading}
                >
                  {isRegister ? "Login here" : "Register here"}
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

/* 🔹 Small reusable components */
const InputField = ({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 py-6 rounded-xl"
        placeholder={placeholder}
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        {icon}
      </span>
    </div>
  </div>
);

const PasswordField = ({
  label,
  value,
  onChange,
  show,
  toggle,
  placeholder,
}) => (
  <div className="space-y-2">
    <label className="text-sm font-medium text-gray-700">{label}</label>
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 py-6 rounded-xl"
        placeholder={placeholder}
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        <Lock size={20} />
      </span>
      <button
        type="button"
        onClick={toggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
      >
        {show ? <Eye size={18} /> : <EyeOff size={18} />}
      </button>
    </div>
  </div>
);

const TwoCol = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
);
