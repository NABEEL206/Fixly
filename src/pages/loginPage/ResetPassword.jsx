// src/pages/ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Key, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '@/API/axiosInstance';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  
  // Form steps: 'email' -> 'otp' -> 'password'
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [errors, setErrors] = useState({});

  // Timer for OTP resend
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = () => {
    setTimer(60); // 60 seconds countdown
  };

  // Validate email
  const validateEmail = () => {
    const newErrors = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate OTP
  const validateOTP = () => {
    const newErrors = {};
    
    if (!otp) {
      newErrors.otp = 'OTP is required';
    } else if (!/^\d{6}$/.test(otp)) {
      newErrors.otp = 'OTP must be 6 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate passwords
  const validatePasswords = () => {
    const newErrors = {};
    
    if (!newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!validateEmail()) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Sending OTP...');
    
    try {
      // API endpoint for sending OTP - adjust based on your backend
      await axiosInstance.post('/api/auth/forgot-password/', { email });
      
      toast.success('OTP sent successfully!', { id: toastId });
      setStep('otp');
      startTimer();
    } catch (error) {
      console.error('Send OTP error:', error);
      
      if (error.response?.status === 404) {
        toast.error('Email not registered', { id: toastId });
      } else {
        toast.error(error.response?.data?.message || 'Failed to send OTP', { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!validateOTP()) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Verifying OTP...');
    
    try {
      // API endpoint for verifying OTP - adjust based on your backend
      await axiosInstance.post('/api/auth/verify-otp/', { 
        email, 
        otp 
      });
      
      toast.success('OTP verified successfully!', { id: toastId });
      setStep('password');
    } catch (error) {
      console.error('Verify OTP error:', error);
      
      if (error.response?.status === 400) {
        toast.error('Invalid OTP', { id: toastId });
      } else {
        toast.error(error.response?.data?.message || 'Failed to verify OTP', { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (timer > 0) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Resending OTP...');
    
    try {
      await axiosInstance.post('/api/auth/forgot-password/', { email });
      
      toast.success('OTP resent successfully!', { id: toastId });
      startTimer();
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error('Failed to resend OTP', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;
    
    setIsLoading(true);
    const toastId = toast.loading('Resetting password...');
    
    try {
      // API endpoint for resetting password - adjust based on your backend
      await axiosInstance.post('/api/auth/reset-password/', {
        email,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      
      toast.success('Password reset successfully!', { id: toastId });
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = [];
        
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(apiErrors[key].join(', '));
          } else if (typeof apiErrors[key] === 'string') {
            errorMessages.push(apiErrors[key]);
          }
        });
        
        toast.error(errorMessages.join('\n') || 'Validation failed', { id: toastId });
      } else {
        toast.error(error.response?.data?.message || 'Failed to reset password', { id: toastId });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Go back to previous step
  const goBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
    } else if (step === 'password') {
      setStep('otp');
      setNewPassword('');
      setConfirmPassword('');
    }
    setErrors({});
  };

  // Render email step
  const renderEmailStep = () => (
    <form onSubmit={handleSendOTP} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your registered email"
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.email}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Sending OTP...
          </>
        ) : (
          'Send OTP'
        )}
      </button>

      <div className="text-center">
        <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800">
          Back to Login
        </Link>
      </div>
    </form>
  );

  // Render OTP step
  const renderOTPStep = () => (
    <form onSubmit={handleVerifyOTP} className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          We've sent a 6-digit OTP to <span className="font-semibold">{email}</span>
        </p>
      </div>

      <div>
        <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
          Enter OTP
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest ${
              errors.otp ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="000000"
            maxLength="6"
            disabled={isLoading}
          />
        </div>
        {errors.otp && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.otp}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={timer > 0 || isLoading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
        >
          {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
        </button>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify OTP'
        )}
      </button>

      <button
        type="button"
        onClick={goBack}
        className="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1"
      >
        <ArrowLeft size={16} />
        Back to Email
      </button>
    </form>
  );

  // Render password reset step
  const renderPasswordStep = () => (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-green-800 flex items-center gap-2">
          <CheckCircle size={16} className="text-green-600" />
          OTP verified successfully! Please set your new password.
        </p>
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
          New Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.newPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter new password"
            disabled={isLoading}
          />
        </div>
        {errors.newPassword && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.newPassword}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Password must be at least 8 characters long
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Confirm new password"
            disabled={isLoading}
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle size={14} />
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Resetting...
          </>
        ) : (
          'Reset Password'
        )}
      </button>

      <button
        type="button"
        onClick={goBack}
        className="w-full text-sm text-gray-600 hover:text-gray-800 flex items-center justify-center gap-1"
      >
        <ArrowLeft size={16} />
        Back to OTP
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Reset Password</h1>
          <p className="text-gray-600">
            {step === 'email' && 'Enter your email to receive OTP'}
            {step === 'otp' && 'Enter the 6-digit OTP sent to your email'}
            {step === 'password' && 'Create a new password'}
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'email' ? 'bg-blue-600 text-white' : 
              step === 'otp' || step === 'password' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 ${
              step === 'otp' || step === 'password' ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          </div>
          
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'otp' ? 'bg-blue-600 text-white' : 
              step === 'password' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <div className={`w-12 h-1 ${
              step === 'password' ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          </div>
          
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            step === 'password' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
          }`}>
            3
          </div>
        </div>

        {/* Form Steps */}
        {step === 'email' && renderEmailStep()}
        {step === 'otp' && renderOTPStep()}
        {step === 'password' && renderPasswordStep()}
      </div>
    </div>
  );
};

export default ResetPassword;