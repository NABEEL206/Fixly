// src/pages/complaints/ComplaintRegistrationModal.jsx
import React, { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader } from "lucide-react";
import axiosInstance from "@/API/axiosInstance";

// --- STATUS OPTIONS ---
const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

const ComplaintRegistrationModal = ({ open, onClose, leadData, onSuccess }) => {
  // Form states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [pincode, setPincode] = useState("");
  const [areas, setAreas] = useState([]);
  const [area, setArea] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Assignment states
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedGrowTagId, setSelectedGrowTagId] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [otherShops, setOtherShops] = useState([]);
  const [assignedType, setAssignedType] = useState("");

  // Status field
  const [status, setStatus] = useState("Assigned");

  // Validation errors
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  // Loading states
  const [isLoadingPrefill, setIsLoadingPrefill] = useState(false);
  const [isFetchingNearest, setIsFetchingNearest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState("");

  // Track if we've loaded prefilled data
  const [prefillLoaded, setPrefillLoaded] = useState(false);

  // Character count for issue
  const [issueCharCount, setIssueCharCount] = useState(0);
  const MAX_ISSUE_CHARS = 500; // Adjust as needed

  // ----------------------------------------------------------------
  // 🟢 VALIDATION UTILITY FUNCTIONS
  // ----------------------------------------------------------------
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !re.test(String(email).toLowerCase())) {
      setEmailError("Enter a valid email address (e.g., user@domain.com).");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateMobile = (mobile) => {
    const re = /^\d{10}$/;
    if (!mobile || !re.test(String(mobile))) {
      setMobileError("Mobile number must be exactly 10 digits.");
      return false;
    }
    setMobileError("");
    return true;
  };

  const validatePincode = (pincode) => {
    const re = /^\d{6}$/;
    if (!pincode || !re.test(String(pincode))) {
      setPincodeError("Pincode must be exactly 6 digits.");
      return false;
    }
    setPincodeError("");
    return true;
  };

  const validateName = (name) => {
    const re = /^[a-zA-Z\s\.\-]{2,50}$/;
    return re.test(name);
  };

  const validatePhoneModel = (model) => {
    return model.length >= 2 && model.length <= 100;
  };

  // ----------------------------------------------------------------
  // RESET FORM STATES
  // ----------------------------------------------------------------
  const resetFormStates = useCallback(() => {
    setName("");
    setMobile("");
    setModel("");
    setIssue("");
    setIssueCharCount(0);
    setPassword("");
    setEmail("");
    setAddressLine("");
    setPincode("");
    setArea("");
    setAreas([]);
    setSelectedShopId("");
    setSelectedGrowTagId("");
    setAssignedType("");
    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);
    setStatus("Assigned");
    setEmailError("");
    setMobileError("");
    setPincodeError("");
    setFieldErrors({});
    setState("");
    setPrefillLoaded(false);
  }, []);

  // ----------------------------------------------------------------
  // API: FETCH PREFILL DATA
  // ----------------------------------------------------------------
  const fetchPrefillData = useCallback(async (leadId) => {
    if (!leadId) return;
    
    setIsLoadingPrefill(true);
    
    try {
      const response = await axiosInstance.get(`/api/leads/${leadId}/complaint_prefill/`);
      
      const data = response.data;
      console.log("Prefill data received:", data);

      // Map the prefill data to form fields
      setName(data.customer_name || "");
      setMobile(data.customer_phone || "");
      setEmail(data.email || "");
      setModel(data.phone_model || "");
      setIssue(data.issue_details || "");
      setIssueCharCount((data.issue_details || "").length);
      setAddressLine(data.address || "");
      setPincode(data.pincode || "");
      setArea(data.area || "");
      setState(data.state || "");
      
      // Set default password (this might be handled differently in production)
      setPassword("default123");
      
      setPrefillLoaded(true);

      // If we have pincode and area, fetch nearest options
      if (data.pincode && data.area) {
        // First, load areas from pincode API
        try {
          const pincodeRes = await fetch(
            `https://api.postalpincode.in/pincode/${data.pincode}`
          );
          const pincodeData = await pincodeRes.json();

          if (pincodeData[0]?.Status === "Success") {
            const postOffices = pincodeData[0].PostOffice || [];
            const areaList = postOffices.map((p) => p.Name);
            setAreas(areaList);
          }
        } catch (err) {
          console.error("Failed to load pincode data", err);
        }

        // Then fetch nearest options
        fetchNearestOptions(data.pincode, data.area);
      }

    } catch (error) {
      console.error("Prefill API Error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to access this data");
      } else {
        toast.error("Failed to load lead data");
      }
    } finally {
      setIsLoadingPrefill(false);
    }
  }, []);

  // ----------------------------------------------------------------
  // API: FETCH NEAREST OPTIONS
  // ----------------------------------------------------------------
  const fetchNearestOptions = useCallback(async (pcode, selectedArea) => {
    if (!pcode || !selectedArea) return;

    setIsFetchingNearest(true);
    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);

    try {
      const response = await axiosInstance.get(
        `/api/complaints/nearest-options/?area=${encodeURIComponent(selectedArea)}&pincode=${pcode}`
      );
      
      const data = response.data;
      console.log("Nearest options response:", data);

      setFranchises(data.franchise_shops || []);
      setOtherShops(data.other_shops || []);
      setAvailableTags(data.growtags || []);
    } catch (error) {
      console.error("Nearest Options API Error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to fetch nearest options");
      } else {
        toast.error("Failed to fetch nearest options");
      }
    } finally {
      setIsFetchingNearest(false);
    }
  }, []);

  // 🔥 HANDLE AREA CHANGE
  const handleAreaChange = (value) => {
    setArea(value);
    setFieldErrors((prev) => ({ ...prev, area: "" }));
    if (pincode && value) {
      fetchNearestOptions(pincode, value);
    }
  };

  // 🔥 HANDLE ASSIGN TYPE CHANGE
  const handleAssignTypeChange = (value) => {
    setAssignedType(value);
    setSelectedShopId("");
    setSelectedGrowTagId("");
    setFieldErrors((prev) => ({ ...prev, assignedType: "" }));
  };

  // 🔥 HANDLE PINCODE
  const handlePincode = async (value) => {
    // Only allow digits and limit to 6
    const cleanedValue = value.replace(/\D/g, '').slice(0, 6);
    setPincode(cleanedValue);
    
    if (cleanedValue.length === 6) {
      validatePincode(cleanedValue);

      setState("");
      setFranchises([]);
      setOtherShops([]);
      setAvailableTags([]);
      setSelectedShopId("");
      setSelectedGrowTagId("");
      setAssignedType("");

      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${cleanedValue}`
        );
        const data = await res.json();

        if (data[0].Status === "Success") {
          const postOffices = data[0].PostOffice || [];

          const list = postOffices.map((p) => p.Name);
          const stateName = postOffices[0]?.State || "";

          setAreas(list);
          setState(stateName);
          setPincodeError("");
          
          // If there's only one area, auto-select it
          if (list.length === 1) {
            setArea(list[0]);
            fetchNearestOptions(cleanedValue, list[0]);
          }
        } else {
          setAreas([]);
          setState("");
          toast("Pincode not found. Please verify.", { icon: "⚠️" });
          setPincodeError("Pincode not found or invalid.");
        }
      } catch (error) {
        console.error("Pincode API Error:", error);
        setAreas([]);
        setState("");
        toast.error("Error fetching pincode details.");
      }
    } else {
      setAreas([]);
      setArea("");
    }
  };

  // 🔥 HANDLE MOBILE
  const handleMobileChange = (value) => {
    // Only allow digits and limit to 10
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setMobile(cleanedValue);
    if (cleanedValue.length === 10) {
      validateMobile(cleanedValue);
    } else {
      setMobileError("");
    }
  };

  // 🔥 HANDLE NAME
  const handleNameChange = (value) => {
    // Only allow letters, spaces, dots, and hyphens
    const filteredValue = value.replace(/[^a-zA-Z\s\.\-]/g, '');
    // Prevent multiple consecutive spaces
    const cleanValue = filteredValue.replace(/\s+/g, ' ').trimStart();
    setName(cleanValue);
  };

  // 🔥 HANDLE ISSUE with character count
  const handleIssueChange = (value) => {
    if (value.length <= MAX_ISSUE_CHARS) {
      setIssue(value);
      setIssueCharCount(value.length);
    }
  };

  // ----------------------------------------------------------------
  // INITIALIZE FORM WITH LEAD DATA - Fetch prefill on open
  // ----------------------------------------------------------------
  useEffect(() => {
    if (open && leadData) {
      console.log("Opening modal for lead:", leadData);
      
      // Reset form first
      resetFormStates();
      
      // Fetch prefill data from the API
      fetchPrefillData(leadData.id);
    }
  }, [open, leadData, fetchPrefillData, resetFormStates]);

  const validateRequiredFields = () => {
    const errors = {};

    if (!name.trim()) errors.name = "Customer name is required";
    else if (!validateName(name)) errors.name = "Name must be 2-50 characters (letters and spaces only)";
    
    if (!mobile.trim()) errors.mobile = "Mobile number is required";
    else if (!/^\d{10}$/.test(mobile)) errors.mobile = "Mobile number must be exactly 10 digits";
    
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address";
    
    if (!password.trim()) errors.password = "Password is required";
    
    if (!model.trim()) errors.model = "Phone model is required";
    else if (model.length < 2 || model.length > 100) errors.model = "Phone model must be 2-100 characters";
    
    if (!issue.trim()) errors.issue = "Issue details are required";
    else if (issue.length < 5) errors.issue = "Issue details must be at least 5 characters";
    
    if (!addressLine.trim()) errors.addressLine = "Address is required";
    else if (addressLine.length < 10) errors.addressLine = "Address must be at least 10 characters";
    
    if (!pincode.trim()) errors.pincode = "Pincode is required";
    else if (!/^\d{6}$/.test(pincode)) errors.pincode = "Pincode must be exactly 6 digits";
    
    if (!area.trim()) errors.area = "Area is required";
    else if (area.length < 3) errors.area = "Area must be at least 3 characters";
    
    if (!assignedType.trim()) errors.assignedType = "Assignment type is required";

    // Check assignment specific validations
    if (assignedType === "franchise" && !selectedShopId) {
      errors.assignment = "Please select a franchise shop";
    }
    if (assignedType === "othershop" && !selectedShopId) {
      errors.assignment = "Please select an other shop";
    }
    if (assignedType === "growtag" && !selectedGrowTagId) {
      errors.assignment = "Please select a grow tag";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ----------------------------------------------------------------
  // SUBMISSION HANDLER - Register complaint
  // ----------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Lead Data:", leadData);
    console.log("Current form values:", {
      name,
      mobile,
      email,
      model,
      issue,
      issueLength: issue.length,
      password,
      addressLine,
      pincode,
      area,
      state,
      status,
      assignedType,
      selectedShopId,
      selectedGrowTagId
    });

    // Check blank required fields
    const isFormValid = validateRequiredFields();
    if (!isFormValid) {
      console.log("Form validation failed:", fieldErrors);
      toast.error("Please fix all validation errors");
      return;
    }

    // Final validation checks
    const isEmailValid = validateEmail(email);
    const isMobileValid = validateMobile(mobile);
    const isPincodeValid = validatePincode(pincode);

    if (!isEmailValid || !isMobileValid || !isPincodeValid) {
      console.log("Field validation failed:", { isEmailValid, isMobileValid, isPincodeValid });
      toast.error("Please correct the highlighted form errors.");
      return;
    }

    if (!area) {
      toast.error("Please select an Area after entering the Pincode.");
      return;
    }

    // Prepare API data - MATCHING THE API EXPECTATIONS
    let assignToValue = assignedType;
    let payload = {
      customer_name: name,
      customer_phone: mobile,
      phone_model: model,
      issue_details: issue,
      password: password,
      email: email,
      address: addressLine,
      pincode: pincode,
      area: area,
      state: state,
      status: status,
      assign_to: assignToValue,
    };

    // Add the appropriate assignment field based on type
    if (assignedType === "franchise" || assignedType === "othershop") {
      if (selectedShopId) {
        payload.assigned_shop = parseInt(selectedShopId, 10);
      }
    } else if (assignedType === "growtag") {
      if (selectedGrowTagId) {
        payload.assigned_Growtags = parseInt(selectedGrowTagId, 10);
      }
    }

    // Remove any undefined or empty values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined || payload[key] === null || payload[key] === '') {
        delete payload[key];
      }
    });

    console.log("🚀 Submitting complaint data:", JSON.stringify(payload, null, 2));

    setIsSubmitting(true);
    
    // Show loading toast
    const loadingToastId = toast.loading("Registering complaint...");
    
    try {
      // Use the lead-specific endpoint for registration
      const response = await axiosInstance.post(`/api/leads/${leadData.id}/register_complaint/`, payload);
      
      console.log("✅ Complaint registered successfully:", response.data);

      toast.dismiss(loadingToastId);

      if (onSuccess) onSuccess(response.data);
      onClose();
      resetFormStates();
    } catch (error) {
      console.error("❌ API Submission Error:", error);
      
      let errorMessage = "Failed to register complaint";
      
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
        } else if (error.response.status === 403) {
          errorMessage = "You don't have permission to register complaints";
        } else if (error.response.data) {
          if (typeof error.response.data === 'string') {
            errorMessage = error.response.data;
          } else if (error.response.data.detail) {
            errorMessage = error.response.data.detail;
          } else if (error.response.data.message) {
            errorMessage = error.response.data.message;
          } else if (error.response.data.error) {
            errorMessage = error.response.data.error;
          } else {
            // Handle validation errors object
            const errors = error.response.data;
            const firstErrorField = Object.keys(errors)[0];
            if (firstErrorField && errors[firstErrorField]) {
              if (Array.isArray(errors[firstErrorField])) {
                errorMessage = `${firstErrorField}: ${errors[firstErrorField][0]}`;
              } else {
                errorMessage = `${firstErrorField}: ${errors[firstErrorField]}`;
              }
            }
          }
        }
      } else if (error.request) {
        console.error("Error request (no response):", error.request);
        errorMessage = "No response from server. Please check your connection.";
      } else {
        console.error("Error message:", error.message);
        errorMessage = error.message || "Failed to register complaint";
      }
      
      // Update the loading toast to error
      toast.error(errorMessage, { 
        id: loadingToastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b bg-blue-50">
          <h2 className="text-xl font-semibold text-blue-700 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            Register Complaint from Lead
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-lg"
            disabled={isSubmitting || isLoadingPrefill}
          >
            ✖
          </button>
        </div>

        {isLoadingPrefill ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader className="h-12 w-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading lead data...</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 p-6 text-sm overflow-y-auto max-h-[calc(90vh-120px)]"
          >
            {/* Lead Info Summary */}
            {leadData && (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mb-2">
                <p className="text-xs font-medium text-yellow-800">
                  Registering complaint from Lead: <span className="font-bold">{leadData.leadId}</span>
                </p>
              </div>
            )}

            {/* Form fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Enter customer name"
                  value={name}
                  onChange={(e) => {
                    handleNameChange(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  onBlur={() => {
                    if (name && !validateName(name)) {
                      setFieldErrors(prev => ({ ...prev, name: "Name must be 2-50 characters (letters and spaces only)" }));
                    }
                  }}
                  maxLength={50}
                  className={`w-full p-2 border rounded-lg ${
                    fieldErrors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
                )}
                {name && !fieldErrors.name && (
                  <p className="text-gray-400 text-xs mt-1 text-right">{name.length}/50</p>
                )}
              </div>

              {/* Mobile */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => {
                    handleMobileChange(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, mobile: "" }));
                  }}
                  onBlur={(e) => validateMobile(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${
                    mobileError || fieldErrors.mobile ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter 10 digit mobile number"
                />
                {(mobileError || fieldErrors.mobile) && (
                  <p className="text-red-500 text-xs mt-1">{mobileError || fieldErrors.mobile}</p>
                )}
                {mobile && !mobileError && (
                  <p className="text-gray-400 text-xs mt-1 text-right">{mobile.length}/10</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    validateEmail(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  className={`w-full p-2 border rounded-lg ${
                    emailError || fieldErrors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="customer@example.com"
                />
                {(emailError || fieldErrors.email) && (
                  <p className="text-red-500 text-xs mt-1">{emailError || fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="Enter password"
                    minLength={6}
                    className={`w-full p-2 border rounded-lg ${
                      fieldErrors.password ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* Phone Model */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Model <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="e.g., iPhone 13, Samsung S23"
                  value={model}
                  onChange={(e) => {
                    setModel(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, model: "" }));
                  }}
                  maxLength={100}
                  className={`w-full p-2 border rounded-lg ${
                    fieldErrors.model ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.model && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.model}</p>
                )}
                {model && !fieldErrors.model && (
                  <p className="text-gray-400 text-xs mt-1 text-right">{model.length}/100</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white border-gray-300"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={addressLine}
                  onChange={(e) => {
                    setAddressLine(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, addressLine: "" }));
                  }}
                  placeholder="House no, street, landmark"
                  rows="2"
                  maxLength={200}
                  className={`w-full p-2 border rounded-lg ${
                    fieldErrors.addressLine ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {fieldErrors.addressLine && (
                  <p className="text-red-500 text-xs mt-1">{fieldErrors.addressLine}</p>
                )}
                {addressLine && !fieldErrors.addressLine && (
                  <p className="text-gray-400 text-xs mt-1 text-right">{addressLine.length}/200</p>
                )}
              </div>

              {/* State */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  disabled
                  placeholder="Auto-filled from pincode"
                  className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700 border-gray-300"
                />
              </div>

              {/* Pincode & Area */}
              <div className="md:col-span-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => handlePincode(e.target.value)}
                      onBlur={(e) => validatePincode(e.target.value)}
                      className={`w-full p-2 border rounded-lg ${
                        pincodeError || fieldErrors.pincode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter 6 digit pincode"
                    />
                    {(pincodeError || fieldErrors.pincode) && (
                      <p className="text-red-500 text-xs mt-1">{pincodeError || fieldErrors.pincode}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Area <span className="text-red-500">*</span>
                    </label>
                    {areas.length > 0 ? (
                      <select
                        value={area}
                        onChange={(e) => handleAreaChange(e.target.value)}
                        className={`w-full p-2 border rounded-lg bg-white ${
                          fieldErrors.area ? "border-red-500" : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Area</option>
                        {areas.map((a, index) => (
                          <option key={index} value={a}>{a}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => {
                          setArea(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, area: "" }));
                        }}
                        className={`w-full p-2 border rounded-lg bg-white ${
                          fieldErrors.area ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter area manually"
                      />
                    )}
                    {fieldErrors.area && (
                      <p className="text-red-500 text-xs mt-1">{fieldErrors.area}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Issue Details with Live Counter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Issue Details <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  value={issue}
                  onChange={(e) => {
                    handleIssueChange(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, issue: "" }));
                  }}
                  placeholder="Describe the issue in detail"
                  rows="3"
                  maxLength={MAX_ISSUE_CHARS}
                  className={`w-full p-2 pr-16 border rounded-lg ${
                    fieldErrors.issue ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {/* Character Counter */}
                <div className="absolute bottom-2 right-3 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  <span className="font-bold">{issueCharCount}</span>
                  <span className="opacity-75">/{MAX_ISSUE_CHARS}</span>
                </div>
              </div>
              {fieldErrors.issue && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.issue}</p>
              )}
              {issue && issue.length < 5 && !fieldErrors.issue && (
                <p className="text-orange-500 text-xs mt-1">
                  {5 - issue.length} more characters needed (minimum 5)
                </p>
              )}
            </div>

            {/* ASSIGN SECTION */}
            <div className={`p-3 border rounded-lg text-sm ${
              fieldErrors.assignedType || fieldErrors.assignment ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"
            }`}>
              <label className="font-semibold text-gray-700 block mb-2">
                Assign To: <span className="text-red-500">*</span>
              </label>
              
              <select
                value={assignedType}
                onChange={(e) => handleAssignTypeChange(e.target.value)}
                className={`w-full p-2 border rounded-lg mb-2 ${
                  fieldErrors.assignedType ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Type</option>
                <option value="franchise">Franchise ({franchises.length})</option>
                <option value="othershop">Other Shops ({otherShops.length})</option>
                <option value="growtag">GrowTags ({availableTags.length})</option>
              </select>
              
              {fieldErrors.assignedType && (
                <p className="text-red-500 text-xs mt-1 mb-2">{fieldErrors.assignedType}</p>
              )}

              <div className="min-h-[60px]">
                {isFetchingNearest && (
                  <p className="text-center text-gray-600 text-xs py-3">
                    Fetching nearest options...
                  </p>
                )}

                {(assignedType === "franchise" || assignedType === "othershop") && !isFetchingNearest && (
                  <select
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full p-2 border rounded-lg border-gray-300"
                  >
                    <option value="">
                      Select {assignedType === "franchise" ? "Franchise" : "Other Shop"}
                    </option>
                    {(assignedType === "franchise" ? franchises : otherShops).map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                )}

                {assignedType === "growtag" && !isFetchingNearest && (
                  <select
                    value={selectedGrowTagId}
                    onChange={(e) => setSelectedGrowTagId(e.target.value)}
                    className="w-full p-2 border rounded-lg border-gray-300"
                  >
                    <option value="">Select GrowTag</option>
                    {availableTags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {fieldErrors.assignment && (
                <p className="text-red-500 text-xs mt-2">{fieldErrors.assignment}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2 disabled:opacity-70"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="animate-spin h-4 w-4" />
                    Registering...
                  </>
                ) : (
                  "Register Complaint"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ComplaintRegistrationModal;