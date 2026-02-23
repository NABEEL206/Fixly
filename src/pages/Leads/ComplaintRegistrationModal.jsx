import React, { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

// --- STATUS OPTIONS ---
const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

// auth
import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// 🔐 AUTO ATTACH TOKEN TO EVERY REQUEST
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log("API Request:", config.method.toUpperCase(), config.url, config.data);
    return config;
  },
  (error) => Promise.reject(error)
);

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
  const [isFetchingNearest, setIsFetchingNearest] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [state, setState] = useState("");

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

  // ----------------------------------------------------------------
  // RESET FORM STATES
  // ----------------------------------------------------------------
  const resetFormStates = useCallback(() => {
    setName("");
    setMobile("");
    setModel("");
    setIssue("");
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
      const url = `http://127.0.0.1:8000/api/complaints/nearest-options/?area=${encodeURIComponent(selectedArea)}&pincode=${pcode}`;
      console.log("Fetching nearest options from:", url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem("access_token")}`,
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Nearest options response:", data);

      setFranchises(data.franchise_shops || []);
      setOtherShops(data.other_shops || []);
      setAvailableTags(data.growtags || []);
    } catch (error) {
      console.error("Nearest Options API Error:", error);
      toast.error("Failed to fetch nearest options");
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
    setPincode(value);
    validatePincode(value);

    setState("");
    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);
    setSelectedShopId("");
    setSelectedGrowTagId("");
    setAssignedType("");

    if (value.length === 6) {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${value}`
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
            fetchNearestOptions(value, list[0]);
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

  // ----------------------------------------------------------------
  // INITIALIZE FORM WITH LEAD DATA
  // ----------------------------------------------------------------
  useEffect(() => {
    if (open && leadData) {
      console.log("Lead data received in modal:", leadData);
      
      // Map leadData correctly
      setName(leadData.name || "");
      setMobile(leadData.phone || "");
      setEmail(leadData.email || "");
      setPincode(leadData.pincode || "");
      setAddressLine(leadData.address || "");
      setModel(leadData.phoneModel || "");
      setIssue(leadData.issueDetail || "");
      setPassword("default123");

      setEmailError("");
      setMobileError("");
      setPincodeError("");

      // LOAD AREA LIST FIRST
      if (leadData.pincode && leadData.pincode.length === 6) {
        (async () => {
          try {
            const res = await fetch(
              `https://api.postalpincode.in/pincode/${leadData.pincode}`
            );
            const data = await res.json();

            if (data[0]?.Status === "Success") {
              const postOffices = data[0].PostOffice || [];
              const areaList = postOffices.map((p) => p.Name);
              const stateName = postOffices[0]?.State || "";

              setAreas(areaList);
              setState(stateName);

              // Set area if it matches
              if (leadData.area && areaList.includes(leadData.area)) {
                setArea(leadData.area);
                setTimeout(() => {
                  fetchNearestOptions(leadData.pincode, leadData.area);
                }, 100);
              }
            }
          } catch (err) {
            console.error("Failed to load pincode data", err);
          }
        })();
      }
    } else {
      resetFormStates();
    }
  }, [open, leadData, fetchNearestOptions, resetFormStates]);

  const validateRequiredFields = () => {
    const errors = {};

    if (!name.trim()) errors.name = "Customer name is required";
    if (!mobile.trim()) errors.mobile = "Mobile number is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!password.trim()) errors.password = "Password is required";
    if (!model.trim()) errors.model = "Phone model is required";
    if (!issue.trim()) errors.issue = "Issue details are required";
    if (!addressLine.trim()) errors.addressLine = "Address is required";
    if (!pincode.trim()) errors.pincode = "Pincode is required";
    if (!area.trim()) errors.area = "Area is required";
    if (!assignedType.trim())
      errors.assignedType = "Assignment type is required";

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
  // SUBMISSION HANDLER - FIXED with proper toast management
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
      toast.error("Please fill all required fields");
      return;
    }

    // Validate email, mobile, pincode
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

    // Prepare API data
    let assignTypeAPI = assignedType;
    let fkFieldName = null;
    let assignedID = "";

    // Map frontend values to API expected values
    if (assignedType === "franchise") {
      if (!selectedShopId) {
        toast.error("Please select a franchise shop");
        return;
      }
      assignedID = selectedShopId;
      fkFieldName = "assigned_shop";
      assignTypeAPI = "franchise";
    } 
    else if (assignedType === "othershop") {
      if (!selectedShopId) {
        toast.error("Please select an other shop");
        return;
      }
      assignedID = selectedShopId;
      fkFieldName = "assigned_shop";
      assignTypeAPI = "othershop";
    } 
    else if (assignedType === "growtag") {
      if (!selectedGrowTagId) {
        toast.error("Please select a grow tag");
        return;
      }
      assignedID = selectedGrowTagId;
      fkFieldName = "assigned_Growtags";
      assignTypeAPI = "growtag";
    }

    // Build complaint data
    const complaintData = {
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
      assign_to: assignTypeAPI,
    };

    // Add the foreign key field if we have an assignment
    if (fkFieldName && assignedID) {
      complaintData[fkFieldName] = parseInt(assignedID, 10);
    }

    // Remove any undefined or empty values
    Object.keys(complaintData).forEach(key => {
      if (complaintData[key] === undefined || complaintData[key] === null) {
        delete complaintData[key];
      }
    });

    console.log("🚀 Submitting complaint data:", JSON.stringify(complaintData, null, 2));

    setIsSubmitting(true);
    
    // Show loading toast
    const loadingToastId = toast.loading("Registering complaint...");
    
    try {
      // Use the lead-specific endpoint
      const response = await api.post(`/api/leads/${leadData.id}/register_complaint/`, complaintData);
      
      console.log("✅ Complaint registered successfully:", response.data);

      // Update the loading toast to success (this replaces the loading toast)
      toast.success("Complaint registered successfully!", {
        id: loadingToastId,
      });

      if (onSuccess) onSuccess(response.data);
      onClose();
      resetFormStates();
    } catch (error) {
      console.error("❌ API Submission Error:", error);
      
      let errorMessage = "Failed to register complaint";
      
      if (error.response) {
        console.error("Error response status:", error.response.status);
        console.error("Error response data:", error.response.data);
        
        if (error.response.data) {
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
              errorMessage = `${firstErrorField}: ${errors[firstErrorField]}`;
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
      
      // Update the loading toast to error (this replaces the loading toast)
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
            disabled={isSubmitting}
          >
            ✖
          </button>
        </div>

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
                  setName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={`w-full p-2 border rounded-lg ${
                  fieldErrors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  validateMobile(e.target.value);
                }}
                onBlur={(e) => validateMobile(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  mobileError || fieldErrors.mobile ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter 10 digit mobile number"
              />
              {mobileError && (
                <p className="text-red-500 text-xs mt-1">{mobileError}</p>
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
                }}
                onBlur={(e) => validateEmail(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  emailError || fieldErrors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="customer@example.com"
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
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
                onChange={(e) => setModel(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  fieldErrors.model ? "border-red-500" : "border-gray-300"
                }`}
              />
              {fieldErrors.model && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.model}</p>
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
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="House no, street, landmark"
                rows="2"
                className={`w-full p-2 border rounded-lg ${
                  fieldErrors.addressLine ? "border-red-500" : "border-gray-300"
                }`}
              />
              {fieldErrors.addressLine && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.addressLine}</p>
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
                    type="number"
                    value={pincode}
                    onChange={(e) => handlePincode(e.target.value)}
                    onBlur={(e) => validatePincode(e.target.value)}
                    className={`w-full p-2 border rounded-lg ${
                      pincodeError || fieldErrors.pincode ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Enter 6 digit pincode"
                  />
                  {pincodeError && (
                    <p className="text-red-500 text-xs mt-1">{pincodeError}</p>
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

          {/* Issue Details */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Issue Details <span className="text-red-500">*</span>
            </label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the issue in detail"
              rows="3"
              className={`w-full p-2 border rounded-lg ${
                fieldErrors.issue ? "border-red-500" : "border-gray-300"
              }`}
            />
            {fieldErrors.issue && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.issue}</p>
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
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </>
              ) : (
                "Register Complaint"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComplaintRegistrationModal;