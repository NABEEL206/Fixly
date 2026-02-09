// ComplaintRegistrationModal.jsx
import React, { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

// --- API Endpoints ---
const COMPLAINT_API = "http://127.0.0.1:8000/api/complaints/";
const NEAREST_OPTIONS_API =
  "http://127.0.0.1:8000/api/complaints/nearest-options/";

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
      const res = await api.get("/api/complaints/nearest-options/", {
        params: { pincode: pcode, area: selectedArea },
      });

      setFranchises(res.data.franchise || []);
      setOtherShops(res.data.othershop || []);
      setAvailableTags(res.data.growtag || []);
    } catch (error) {
      console.error("Nearest Options API Error:", error);
      toast.error("You are not authorized to fetch nearest options");
    } finally {
      setIsFetchingNearest(false);
    }
  }, []);

  // 🔥 HANDLE AREA CHANGE
  const handleAreaChange = (value) => {
    setArea(value);
    fetchNearestOptions(pincode, value);
  };

  // 🔥 HANDLE ASSIGN TYPE CHANGE
  const handleAssignTypeChange = (value) => {
    setAssignedType(value);
    setSelectedShopId("");
    setSelectedGrowTagId("");
  };

  // 🔥 HANDLE PINCODE
  const handlePincode = async (value) => {
    if (!leadData) {
      setArea("");
      setAreas([]);
    }

    setPincode(value);
    validatePincode(value);

    setState(""); // ✅ reset state when pincode changes

    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);
    setSelectedShopId("");
    setSelectedGrowTagId("");
    setAssignedType("");

    if (value.length === 6 && validatePincode(value)) {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${value}`
        );
        const data = await res.json();

        if (data[0].Status === "Success") {
          const postOffices = data[0].PostOffice || [];

          const list = postOffices.map((p) => p.Name);
          const stateName = postOffices[0]?.State || ""; // ✅ GET STATE

          setAreas(list);
          setState(stateName); // ✅ AUTO-FILL STATE
          setPincodeError("");
        } else {
          setAreas([]);
          setState(""); // clear state if invalid pincode
          toast("Pincode not found. Please verify.", { icon: "⚠️" });
          setPincodeError("Pincode not found or invalid.");
        }
      } catch (error) {
        console.error("Pincode API Error:", error);
        setAreas([]);
        setState("");
        toast.error("Error fetching pincode details.");
      }
    }
  };

  // ----------------------------------------------------------------
  // INITIALIZE FORM WITH LEAD DATA
  // ----------------------------------------------------------------
  useEffect(() => {
    if (open && leadData) {
      setName(leadData.name || "");
      setMobile(leadData.phone || "");
      setEmail(leadData.email || "");
      setPincode(leadData.pincode || "");
      setAddressLine(`${leadData.area}, Pincode: ${leadData.pincode}`);

      setModel("Mobile Device");
      setIssue(`Service requested`);
      setPassword("default123");

      setEmailError("");
      setMobileError("");
      setPincodeError("");

      // ✅ LOAD AREA LIST FIRST
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

              // ✅ SET AREA ONLY AFTER OPTIONS EXIST
              if (leadData.area && areaList.includes(leadData.area)) {
                setArea(leadData.area);
                fetchNearestOptions(leadData.pincode, leadData.area);
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

  const requiredFields = [
    { value: name, label: "Customer Name" },
    { value: mobile, label: "Mobile Number" },
    { value: email, label: "Email" },
    { value: password, label: "Password" },
    { value: model, label: "Phone Model" },
    { value: issue, label: "Issue Details" },
    { value: addressLine, label: "Address" },
    { value: pincode, label: "Pincode" },
    { value: area, label: "Area" },
    { value: assignedType, label: "Assignment Type" },
  ];

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

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  // ----------------------------------------------------------------
  // SUBMISSION HANDLER
  // ----------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔴 Check blank required fields
    const isFormValid = validateRequiredFields();
    if (!isFormValid) {
      toast.error("Please fill all required fields");
      return;
    }

    for (let field of requiredFields) {
      if (!field.value || field.value.toString().trim() === "") {
        toast.error("Please fill the form completely");
        return;
      }
    }

    const currentMobile = mobile;
    const currentEmail = email;
    const currentPincode = pincode;

    // Validate fields
    const isEmailValid = validateEmail(currentEmail);
    const isMobileValid = validateMobile(currentMobile);
    const isPincodeValid = validatePincode(currentPincode);

    if (!isEmailValid || !isMobileValid || !isPincodeValid) {
      toast.error("Please correct the highlighted form errors.");
      return;
    }

    if (!area) {
      toast.error("Please select an Area after entering the Pincode.");
      return;
    }

    let assignTypeAPI = assignedType;
    let fkFieldName = null;
    let assignedID = "";

    if (assignedType === "franchise") {
      assignedID = selectedShopId;
      fkFieldName = "assigned_shop";
      assignTypeAPI = "franchise";
    }

    if (assignedType === "othershop") {
      assignedID = selectedShopId;
      fkFieldName = "assigned_shop";
      assignTypeAPI = "othershop";
    }

    if (assignedType === "growtag") {
      assignedID = selectedGrowTagId;
      fkFieldName = "assigned_growtag"; // ✅ FIXED
      assignTypeAPI = "growtag";
    }

    if (!assignedType || !assignedID) {
      toast.error("Please select an assignment type and a specific entity.");
      return;
    }
    if (
      (assignedType === "franchise" || assignedType === "othershop") &&
      !selectedShopId
    ) {
      toast.error("Please select a shop to assign the complaint");
      return;
    }

    if (assignedType === "growtag" && !selectedGrowTagId) {
      toast.error("Please select a GrowTag to assign the complaint");
      return;
    }

    const complaintData = {
      customer_name: name,
      customer_phone: currentMobile,
      phone_model: model,
      issue_details: issue,
      password: password,
      email: currentEmail,
      address: addressLine,
      pincode: currentPincode,
      area: area,
      status: status,
      assign_to: assignTypeAPI,
    };

    if (fkFieldName && assignedID) {
      complaintData[fkFieldName] = parseInt(assignedID, 10);
    }

    setIsSubmitting(true);
    const submissionToast = toast.loading("Registering complaint...");
    try {
      await api.post("/api/complaints/", complaintData);

      toast.success("Complaint registered successfully!", {
        id: submissionToast,
      });

      if (onSuccess) onSuccess();
      onClose();
      resetFormStates();
    } catch (error) {
      console.error("API Submission Error:", error);

      toast.error(
        error?.response?.data?.detail ||
          "Failed to register complaint. Please try again.",
        { id: submissionToast }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50 p-4">
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
            Register Complaint
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
          {/* --- Two Column Grid for Complaint Details --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                placeholder="Name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                className={`w-full p-2 border rounded-lg ${
                  fieldErrors.name ? "" : ""
                }`}
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* Mobile Number Field with Validation */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mobile Number
              </label>
              <input
                name="mobile"
                type="number"
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (
                    e.target.value.length === 10 ||
                    e.target.value.length === 0
                  ) {
                    validateMobile(e.target.value);
                  }
                }}
                onBlur={(e) => validateMobile(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  mobileError ? "" : ""
                }`}
                placeholder="Mobile Number"
              />
              {mobileError && (
                <p className="text-red-500 text-xs mt-1">{mobileError}</p>
              )}
            </div>

            {/* Email Field with Validation */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  validateEmail(e.target.value);
                }}
                onBlur={(e) => validateEmail(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  emailError ? "" : ""
                }`}
                placeholder="Customer Email"
              />
              {emailError && (
                <p className="text-red-500 text-xs mt-1">{emailError}</p>
              )}
            </div>

            {/* Password Field with Show / Hide */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className={`w-full p-2 border rounded-lg ${
                    fieldErrors.password ? "" : ""
                  }`}
                />
                {fieldErrors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {fieldErrors.password}
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <Eye className="mb-0.5" size={18} />
                  ) : (
                    <EyeOff className="0.5" size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Phone Model */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Model
              </label>
              <input
                placeholder="phone model"
                name="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full p-2 border rounded-lg ${
                  fieldErrors.model ? "" : ""
                }`}
              />
              {fieldErrors.model && (
                <p className="text-red-500 text-xs mt-1">{fieldErrors.model}</p>
              )}
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border rounded-lg bg-white"
              >
                <option value="" disabled>
                  Select Status
                </option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Address Line */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="addressLine"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Full Address"
                rows="2"
                className={`w-full p-2 border rounded-lg ${
                  fieldErrors.addressLine ? "" : ""
                }`}
              />
              {fieldErrors.addressLine && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.addressLine}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={state}
                disabled
                placeholder="Auto-filled from pincode"
                className="w-full p-2 border rounded-lg bg-gray-100 text-gray-700"
              />
            </div>

            {/* PINCODE & AREA */}
            <div className="md:col-span-2">
              <div className="grid grid-cols-2 gap-3">
                {/* Pincode Field with Validation */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <input
                    type="number"
                    value={pincode}
                    onChange={(e) => handlePincode(e.target.value)}
                    onBlur={(e) => validatePincode(e.target.value)}
                    className={`w-full p-2 border rounded-lg ${
                      pincodeError ? "" : ""
                    }`}
                    placeholder="Pincode"
                  />
                  {pincodeError && (
                    <p className="text-red-500 text-xs mt-1">{pincodeError}</p>
                  )}
                </div>

                {/* Area Dropdown */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Area <span className="text-red-500">*</span>
                  </label>

                  {areas.length > 0 ? (
                    <>
                      <select
                        value={area}
                        onChange={(e) => {
                          handleAreaChange(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, area: "" }));
                        }}
                        className={`w-full p-2 border rounded-lg bg-white ${
                          fieldErrors.area ? "" : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Area</option>
                        {areas.map((a, index) => (
                          <option key={index} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>

                      {fieldErrors.area && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.area}
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={area}
                        onChange={(e) => {
                          setArea(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, area: "" }));
                        }}
                        className={`w-full p-2 border rounded-lg bg-white ${
                          fieldErrors.area ? "" : "border-gray-300"
                        }`}
                        placeholder="Area"
                      />

                      {fieldErrors.area && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.area}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Issue Details */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Issue Details
            </label>
            <textarea
              name="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Describe the issue in detail"
              rows="3"
              className={`w-full p-2 border rounded-lg ${
                fieldErrors.issue ? "" : ""
              }`}
            />
            {fieldErrors.issue && (
              <p className="text-red-500 text-xs mt-1">{fieldErrors.issue}</p>
            )}
          </div>

          {/* ASSIGN SECTION */}
          <div className="p-3 border rounded-lg bg-gray-50 text-sm">
            <label className="font-semibold text-gray-700 block mb-2">
              Assign To:
            </label>
            <select
              value={assignedType}
              onChange={(e) => {
                handleAssignTypeChange(e.target.value);
                setFieldErrors((prev) => ({ ...prev, assignedType: "" }));
              }}
              className={`w-full p-2 border rounded-lg ${
                fieldErrors.assignedType ? "border-red-500" : ""
              }`}
            >
              {fieldErrors.assignedType && (
                <p className="text-red-500 text-xs mt-1">
                  {fieldErrors.assignedType}
                </p>
              )}

              <option value="">Select Type</option>
              <option value="franchise">Franchise ({franchises.length})</option>
              <option value="othershop">
                Other Shops ({otherShops.length})
              </option>

              <option value="growtag">GrowTags ({availableTags.length})</option>
            </select>

            <div className="min-h-[60px]">
              {isFetchingNearest && (
                <p className="text-center text-gray-600 text-xs py-3">
                  Fetching nearest options...
                </p>
              )}

              {/* Dynamic Assignment Dropdown */}
              {(assignedType === "franchise" ||
                assignedType === "othershops") &&
                !isFetchingNearest && (
                  <select
                    value={selectedShopId}
                    onChange={(e) => setSelectedShopId(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="">
                      Select{" "}
                      {assignedType === "franchise"
                        ? "Franchise"
                        : "Other Shop"}
                    </option>
                    {(assignedType === "franchise" ? franchises : otherShops)
                      .length > 0 ? (
                      (assignedType === "franchise"
                        ? franchises
                        : otherShops
                      ).map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label} - ID: {s.id}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No{" "}
                        {assignedType === "franchise" ? "franchises" : "shops"}{" "}
                        available
                      </option>
                    )}
                  </select>
                )}

              {assignedType === "growtag" && !isFetchingNearest && (
                <select
                  value={selectedGrowTagId}
                  onChange={(e) => setSelectedGrowTagId(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">Select GrowTag</option>
                  {availableTags.length > 0 ? (
                    availableTags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} - ID: {t.id}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      No GrowTags available
                    </option>
                  )}
                </select>
              )}
            </div>
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
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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
