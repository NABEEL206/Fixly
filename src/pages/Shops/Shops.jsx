// src/pages/Shops/Shops.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Building,
  Tag,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/API/axiosInstance";

// ----------------------------------------------------
// 1. Password Input Component (Eye Icon Toggle)
// ----------------------------------------------------
const PasswordInput = ({
  name,
  label,
  value,
  onChange,
  error,
  isEdit,
  touched,
  onBlur,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [localTouched, setLocalTouched] = useState(false);

  const handleBlur = () => {
    setLocalTouched(true);
    if (onBlur) onBlur();
  };

  const showError = (touched || localTouched) && error;

  if (isEdit) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}{" "}
          <span className="text-xs text-gray-500 ml-1">(cannot be edited)</span>
        </label>
        <div className="relative">
          <input
            type="password"
            value="••••••••"
            disabled
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            <EyeOff size={18} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
            showError
              ? "border-red-500 focus:ring-red-500"
              : value && value.length >= 6
                ? "border-green-500 focus:ring-green-500"
                : "border-gray-300 focus:ring-blue-500"
          }`}
          placeholder="Enter password (min 6 characters)"
        />
        <div className="absolute inset-y-0 right-8 flex items-center">
          {value && !showError && value.length >= 6 && (
            <CheckCircle2 size={18} className="text-green-500" />
          )}
          {showError && <AlertCircle size={18} className="text-red-500" />}
        </div>
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
        </button>
      </div>
      {showError && <p className="text-red-500 text-xs mt-1">{error}</p>}
      {value && !error && value.length > 0 && value.length < 6 && (
        <p className="text-orange-500 text-xs mt-1">
          {6 - value.length} more characters needed
        </p>
      )}
      {value && !error && value.length >= 6 && (
        <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
          <CheckCircle2 size={12} /> Password strength ok
        </p>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 2. Input Field Component with Real-time Validation
// ----------------------------------------------------
const InputField = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  type = "text",
  maxLength,
  minLength,
  pattern,
  patternMessage,
  required = true,
  disabled = false,
  placeholder,
  helperText,
  showCount = false,
  icon = null,
}) => {
  const [localTouched, setLocalTouched] = useState(false);

  const handleBlur = () => {
    setLocalTouched(true);
    if (onBlur) onBlur();
  };

  const showError = (touched || localTouched) && error;
  const isValid =
    value &&
    !error &&
    (!minLength || value.length >= minLength) &&
    (!pattern || pattern.test(value));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 pr-10 ${
            icon ? "pl-10" : ""
          } ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : showError
                ? "border-red-500 focus:ring-red-500"
                : isValid
                  ? "border-green-500 focus:ring-green-500"
                  : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {!disabled && value && (
          <div className="absolute inset-y-0 right-3 flex items-center">
            {isValid && <CheckCircle2 size={18} className="text-green-500" />}
            {showError && <AlertCircle size={18} className="text-red-500" />}
          </div>
        )}
      </div>

      {/* Error Message */}
      {showError && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {/* Success Message */}
      {!error && isValid && (
        <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
          <CheckCircle2 size={12} /> Valid {label.toLowerCase()}
        </p>
      )}

      {/* Min Length Warning */}
      {value && !error && minLength && value.length < minLength && (
        <p className="text-orange-500 text-xs mt-1">
          {minLength - value.length} more characters needed (minimum {minLength}
          )
        </p>
      )}

      {/* Pattern Hint */}
      {value && !error && pattern && !pattern.test(value) && (
        <p className="text-orange-500 text-xs mt-1">
          {patternMessage || `Invalid ${label.toLowerCase()} format`}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && !isValid && (
        <p className="text-gray-500 text-xs mt-1">{helperText}</p>
      )}

      {/* Character Count */}
      {showCount && maxLength && (
        <p className="text-gray-400 text-xs mt-1 text-right">
          {value?.length || 0}/{maxLength}
        </p>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 3. TextArea Field Component with Real-time Validation
// ----------------------------------------------------
const TextAreaField = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  rows = 3,
  maxLength,
  minLength,
  required = true,
  disabled = false,
  placeholder,
  showCount = true,
}) => {
  const [localTouched, setLocalTouched] = useState(false);

  const handleBlur = () => {
    setLocalTouched(true);
    if (onBlur) onBlur();
  };

  const showError = (touched || localTouched) && error;
  const isValid = value && !error && (!minLength || value.length >= minLength);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <textarea
          name={name}
          rows={rows}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 pr-10 resize-none ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : showError
                ? "border-red-500 focus:ring-red-500"
                : isValid
                  ? "border-green-500 focus:ring-green-500"
                  : "border-gray-300 focus:ring-blue-500"
          }`}
        />
        {!disabled && value && (
          <div className="absolute top-2 right-3">
            {isValid && <CheckCircle2 size={18} className="text-green-500" />}
            {showError && <AlertCircle size={18} className="text-red-500" />}
          </div>
        )}
      </div>

      {/* Error Message */}
      {showError && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}

      {/* Min Length Warning */}
      {value && !error && minLength && value.length < minLength && (
        <p className="text-orange-500 text-xs mt-1">
          {minLength - value.length} more characters needed (minimum {minLength}
          )
        </p>
      )}

      {/* Character Count */}
      {showCount && maxLength && (
        <div className="flex justify-between items-center mt-1">
          <p
            className={`text-xs ${
              value && value.length < (minLength || 0)
                ? "text-orange-500"
                : "text-gray-400"
            }`}
          >
            {value &&
              value.length < (minLength || 0) &&
              `${minLength - value.length} more needed`}
          </p>
          <p className="text-gray-400 text-xs">
            {value?.length || 0}/{maxLength}
          </p>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 4. Select Field Component with Real-time Validation
// ----------------------------------------------------
const SelectField = ({
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  touched,
  options,
  required = true,
  disabled = false,
  placeholder = "Select an option",
}) => {
  const [localTouched, setLocalTouched] = useState(false);

  const handleBlur = () => {
    setLocalTouched(true);
    if (onBlur) onBlur();
  };

  const showError = (touched || localTouched) && error;
  const isValid = value && !error;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          name={name}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 appearance-none ${
            disabled
              ? "bg-gray-100 cursor-not-allowed"
              : showError
                ? "border-red-500 focus:ring-red-500"
                : isValid
                  ? "border-green-500 focus:ring-green-500"
                  : "border-gray-300 focus:ring-blue-500"
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {!disabled && value && (
          <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
            {isValid && <CheckCircle2 size={18} className="text-green-500" />}
            {showError && <AlertCircle size={18} className="text-red-500" />}
          </div>
        )}
      </div>
      {showError && (
        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
};

// ----------------------------------------------------
// 5. View Modal Component
// ----------------------------------------------------
const ViewModal = ({ shop, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [shopDetails, setShopDetails] = useState(null);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    if (shop?.id) {
      fetchShopDetails(shop.id);
    }
  }, [shop?.id]);

  const fetchShopDetails = async (shopId) => {
    setLoading(true);
    setFetchError(false);
    try {
      const response = await axiosInstance.get(`/api/shops-popup/${shopId}/`);
      setShopDetails(response.data);
    } catch (error) {
      console.error("Error fetching shop details:", error);
      setFetchError(true);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error(
          "Failed to load additional shop details. Showing basic information.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (!shop) return null;

  const displayData = shopDetails || shop;

  const getStatusClasses = (status) => {
    switch (status) {
      case "Pending":
        return "bg-red-500/10 text-red-600 border border-red-500/30";
      case "Assigned":
        return "bg-blue-500/10 text-blue-600 border border-blue-500/30";
      case "In Progress":
        return "bg-orange-500/10 text-orange-600 border border-orange-500/30";
      case "Resolved":
        return "bg-green-500/10 text-green-600 border border-green-500/30";
      default:
        return "bg-gray-500/10 text-gray-600 border border-gray-500/30";
    }
  };

  const getCreatedByDisplay = (createdBy) => {
    if (!createdBy) return "—";
    if (typeof createdBy === "object") {
      return (
        createdBy.username ||
        createdBy.email ||
        createdBy.name ||
        JSON.stringify(createdBy)
      );
    }
    return createdBy;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {displayData.shopname || displayData.name || "Shop Details"}
              </h2>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  ID: {displayData.id}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    displayData.shop_type === "franchise"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-orange-100 text-orange-700"
                  }`}
                >
                  {displayData.shop_type_display ||
                    (displayData.shop_type === "franchise"
                      ? "Franchise"
                      : "Other Shop")}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
            title="Close"
          >
            <XCircle size={24} />
          </button>
        </div>

        <div
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 100px)" }}
        >
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
              <span className="ml-3 text-gray-600">
                Loading shop details...
              </span>
            </div>
          ) : (
            <>
              {fetchError && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    <span className="font-medium">Note:</span> Showing basic
                    shop information. Additional details could not be loaded.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <Tag size={18} className="text-blue-600" />
                    Basic Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Shop Name
                        </p>
                        <p className="text-sm font-semibold text-gray-900 mt-1">
                          {displayData.shopname || displayData.name || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Status
                        </p>
                        <p className="mt-1">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              displayData.status
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {displayData.status ? "Active" : "Inactive"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <User size={18} className="text-purple-600" />
                    Owner Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Owner Name
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {displayData.owner || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Email
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {displayData.email || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Phone
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {displayData.phone || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <MapPin size={18} className="text-green-600" />
                    Address Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Address
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {displayData.address || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Area
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {displayData.area || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Pincode
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {displayData.pincode || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          State
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {displayData.state || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                    <FileText size={18} className="text-orange-600" />
                    System Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          GST PIN
                        </p>
                        <p className="text-sm font-medium text-gray-900 mt-1">
                          {displayData.gst_pin || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Created By
                        </p>
                        <p className="text-sm text-gray-900 mt-1 flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          {getCreatedByDisplay(displayData.created_by)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase">
                          Created At
                        </p>
                        <p className="text-sm text-gray-900 mt-1">
                          {displayData.created_at
                            ? new Date(displayData.created_at).toLocaleString()
                            : "—"}
                        </p>
                      </div>
                      {displayData.updated_at && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase">
                            Last Updated
                          </p>
                          <p className="text-sm text-gray-900 mt-1">
                            {new Date(displayData.updated_at).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {shopDetails && displayData.assigned_growtags && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Tag size={20} className="text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Assigned GrowTags (
                      {displayData.assigned_growtags_count ||
                        displayData.assigned_growtags.length}
                      )
                    </h3>
                  </div>

                  {displayData.assigned_growtags.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {displayData.assigned_growtags.map((tag) => (
                        <div
                          key={tag.id}
                          className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <p className="font-medium text-purple-700">
                            {tag.name}
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-purple-600">
                              ID: {tag.grow_id}
                            </p>
                            <p className="text-xs text-purple-600">
                              Phone: {tag.phone}
                            </p>
                            {tag.email && (
                              <p className="text-xs text-purple-600 truncate">
                                Email: {tag.email}
                              </p>
                            )}
                            <p className="text-xs text-purple-600">
                              {tag.area}, {tag.pincode}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                      No grow tags assigned to this shop
                    </p>
                  )}
                </div>
              )}

              {shopDetails && displayData.assigned_complaints && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">
                      Assigned Complaints (
                      {displayData.assigned_complaints_count ||
                        displayData.assigned_complaints.length}
                      )
                    </h3>
                  </div>

                  {displayData.assigned_complaints.length > 0 ? (
                    <div className="space-y-3">
                      {displayData.assigned_complaints.map((complaint) => (
                        <div
                          key={complaint.id}
                          className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                              {complaint.complaint_id}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(complaint.status)}`}
                            >
                              {complaint.status}
                            </span>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                complaint.confirm_status === "CONFIRMED"
                                  ? "bg-green-100 text-green-800 border border-green-200"
                                  : "bg-red-100 text-red-800 border border-red-200"
                              }`}
                            >
                              {complaint.confirm_status === "CONFIRMED" ? (
                                <>
                                  <CheckCircle size={12} /> Confirmed
                                </>
                              ) : (
                                <>
                                  <XCircle size={12} /> Not Confirmed
                                </>
                              )}
                            </span>
                          </div>

                          <h4 className="font-medium text-gray-800 mb-3">
                            {complaint.title}
                          </h4>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Area</p>
                              <p className="font-medium text-gray-700">
                                {complaint.area}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Pincode</p>
                              <p className="font-medium text-gray-700">
                                {complaint.pincode}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Assigned To
                              </p>
                              <p className="font-medium text-gray-700">
                                {complaint.assign_to}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                Created On
                              </p>
                              <p className="font-medium text-gray-700">
                                {complaint.created_on}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-gray-500 border-t pt-2">
                            <span className="font-medium">Created at:</span>{" "}
                            {complaint.created_at_time}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                      No complaints assigned to this shop
                    </p>
                  )}
                </div>
              )}

              {!shopDetails && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <Building size={48} className="mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">
                    Basic Shop Information
                  </h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Detailed information including assigned growtags and
                    complaints could not be loaded. The shop details endpoint
                    may need to be configured.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 6. Main Shops Component
// ----------------------------------------------------
export default function Shops() {
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewShop, setViewShop] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterType, setFilterType] = useState("all");
  const [filterId, setFilterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [search, setSearch] = useState("");

  // Form state with touched fields for real-time validation
  const [form, setForm] = useState({
    shoptype: "franchise",
    name: "",
    owner: "",
    phone: "",
    email: "",
    password: "",
    gst_pin: "",
    address: "",
    pincode: "",
    area: "",
    state: "",
    status: "Active",
  });

  const [touchedFields, setTouchedFields] = useState({});
  const [errors, setErrors] = useState({});
  const [areaList, setAreaList] = useState([]);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Validation patterns
  const VALIDATION_PATTERNS = {
    name: /^[a-zA-Z\s\.\-]{2,50}$/,
    owner: /^[a-zA-Z\s\.\-]{2,50}$/,
    phone: /^\d{10}$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^.{6,}$/,
    gst_pin: /^[0-9A-Z]{15}$/,
    address: /^.{10,200}$/,
    pincode: /^\d{6}$/,
    area: /^.{3,50}$/,
  };

  const uniqueCreatedBy = useMemo(() => {
    const set = new Set();
    shops.forEach((shop) => {
      if (shop.created_by) {
        const creator =
          shop.created_by.username || shop.created_by.email || shop.created_by;
        set.add(creator);
      }
    });
    return Array.from(set).sort();
  }, [shops]);

  const filteredShops = useMemo(() => {
    const text = search.toLowerCase().trim();

    return shops.filter((shop) => {
      const searchableText = [
        shop.id?.toString(),
        shop.shopname,
        shop.owner,
        shop.phone,
        shop.email,
        shop.gst_pin,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesSearch = searchableText.includes(text);

      let matchesFilter = true;
      if (filterType === "id" && filterId) {
        matchesFilter = String(shop.id) === filterId;
      } else if (filterType === "status" && filterStatus) {
        const statusText = shop.status ? "active" : "inactive";
        matchesFilter = statusText === filterStatus;
      } else if (filterType === "created_by" && filterCreatedBy) {
        const creator =
          shop.created_by?.username ||
          shop.created_by?.email ||
          shop.created_by;
        matchesFilter = creator === filterCreatedBy;
      }

      return matchesSearch && matchesFilter;
    });
  }, [shops, search, filterType, filterId, filterStatus, filterCreatedBy]);

  const [pincodeError, setPincodeError] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const [originalShopInfo, setOriginalShopInfo] = useState({
    id: null,
    name: "",
  });

  // Real-time validation functions
  const validateField = (field, value) => {
    let error = "";

    if (!value || !value.trim()) {
      if (field !== "password" || (!isEdit && !value.trim())) {
        error = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    } else {
      switch (field) {
        case "name":
        case "owner":
          if (!VALIDATION_PATTERNS[field].test(value)) {
            error = `${field.charAt(0).toUpperCase() + field.slice(1)} must be 2-50 characters (letters, spaces, dots, hyphens only)`;
          }
          break;
        case "phone":
          if (!/^\d+$/.test(value)) {
            error = "Phone number must contain only digits";
          } else if (!VALIDATION_PATTERNS.phone.test(value)) {
            error = "Phone number must be exactly 10 digits";
          }
          break;
        case "email":
          if (!value.includes("@")) {
            error = "Email must contain @ symbol";
          } else if (!value.includes(".", value.indexOf("@") + 2)) {
            error = "Email must have a domain (e.g., .com)";
          } else if (!VALIDATION_PATTERNS.email.test(value)) {
            error = "Enter a valid email address";
          }
          break;
        case "password":
          if (!isEdit && !VALIDATION_PATTERNS.password.test(value)) {
            error = "Password must be at least 6 characters";
          }
          break;
        case "gst_pin":
          if (!/^[0-9A-Z]+$/.test(value)) {
            error = "GST PIN must contain only letters and numbers";
          } else if (!VALIDATION_PATTERNS.gst_pin.test(value)) {
            error = "GST PIN must be exactly 15 alphanumeric characters";
          }
          break;
        case "address":
          if (value.length < 10) {
            error = "Address must be at least 10 characters";
          } else if (value.length > 200) {
            error = "Address must be less than 200 characters";
          }
          break;
        case "pincode":
          if (!/^\d+$/.test(value)) {
            error = "Pincode must contain only digits";
          } else if (!VALIDATION_PATTERNS.pincode.test(value)) {
            error = "Pincode must be exactly 6 digits";
          }
          break;
        case "area":
          if (value.length < 3) {
            error = "Area must be at least 3 characters";
          } else if (value.length > 50) {
            error = "Area must be less than 50 characters";
          }
          break;
        case "state":
          if (value.length < 2) {
            error = "State must be at least 2 characters";
          } else if (value.length > 50) {
            error = "State must be less than 50 characters";
          }
          break;
        default:
          break;
      }
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleFieldChange = (field, value) => {
    // Field-specific filtering
    let processedValue = value;

    switch (field) {
      case "name":
      case "owner":
        // Only allow letters, spaces, dots, hyphens
        processedValue = value.replace(/[^a-zA-Z\s\.\-]/g, "");
        processedValue = processedValue.replace(/\s+/g, " ").trimStart();
        break;
      case "phone":
        // Only digits, max 10
        processedValue = value.replace(/\D/g, "").slice(0, 10);
        break;
      case "pincode":
        // Only digits, max 6
        processedValue = value.replace(/\D/g, "").slice(0, 6);
        break;
      case "gst_pin":
        // Only uppercase letters and digits, max 15
        processedValue = value
          .toUpperCase()
          .replace(/[^0-9A-Z]/g, "")
          .slice(0, 15);
        break;
      case "email":
        // Convert to lowercase
        processedValue = value.toLowerCase();
        break;
      default:
        break;
    }

    setForm((prev) => ({ ...prev, [field]: processedValue }));

    // Real-time validation if field has been touched
    if (touchedFields[field]) {
      validateField(field, processedValue);
    }
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    validateField(field, form[field]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (visibleShops) => {
    if (selectedIds.length === visibleShops.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleShops.map((s) => s.id));
    }
  };

  const loadShops = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/api/shops/");

      const data = response.data;
      let shopsList = [];

      if (Array.isArray(data)) {
        shopsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        shopsList = data.data;
      } else if (data?.results) {
        shopsList = data.results;
      } else if (data && typeof data === "object") {
        shopsList = [data];
      }

      setShops(shopsList);
    } catch (error) {
      console.error("Error loading shops:", error);
      toast.error("Failed to load shops. Please check your connection.");
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handlePincode = async (value) => {
    if (!value) {
      setAreaList([]);
      setForm((prev) => ({ ...prev, area: "", state: "" }));
      setPincodeError("Pincode is required");
      return;
    }

    if (value.length !== 6) {
      setAreaList([]);
      setForm((prev) => ({ ...prev, area: "", state: "" }));
      setPincodeError("Pincode must be exactly 6 digits");
      return;
    }

    setIsPincodeLoading(true);
    setPincodeError("");

    try {
      const response = await fetch(
        `https://api.postalpincode.in/pincode/${value}`,
      );
      const data = await response.json();

      if (data[0]?.Status !== "Success") {
        setAreaList([]);
        setForm((prev) => ({ ...prev, area: "", state: "" }));
        setPincodeError("Invalid pincode. Please check and try again.");
        return;
      }

      const postOffices = data[0].PostOffice || [];
      const areas = postOffices.map((p) => p.Name);
      const stateName = postOffices[0]?.State || "";

      setAreaList(areas);
      setForm((prev) => ({
        ...prev,
        area: areas[0] || "",
        state: stateName,
      }));

      // Auto-validate area and state after they're set
      if (touchedFields.area) {
        validateField("area", areas[0] || "");
      }
      if (touchedFields.state) {
        validateField("state", stateName);
      }

      setPincodeError("");
    } catch (error) {
      console.error("Pincode API Error:", error);
      setAreaList([]);
      setForm((prev) => ({ ...prev, area: "", state: "" }));
      setPincodeError("Network connection lost. Please check your internet.");
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      shoptype: "franchise",
      name: "",
      owner: "",
      phone: "",
      email: "",
      password: "",
      gst_pin: "",
      address: "",
      pincode: "",
      area: "",
      state: "",
      status: "Active",
    });
    setTouchedFields({});
    setErrors({});
    setAreaList([]);
    setPincodeError("");
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate all required fields
    const fieldsToValidate = [
      "name",
      "owner",
      "phone",
      "email",
      "gst_pin",
      "address",
      "pincode",
      "area",
      "state",
    ];

    fieldsToValidate.forEach((field) => {
      const fieldError = validateField(field, form[field]);
      if (!fieldError) isValid = false;
    });

    // Validate password for new shops
    if (!isEdit && !validateField("password", form.password)) {
      isValid = false;
    }

    return isValid;
  };

  // Standard CRUD operations (no optimistic updates)
  // Update the handleCreate function (around line 605-630)

  const handleCreate = async (payload) => {
    const toastId = toast.loading(`Creating shop "${payload.shopname}"...`);

    try {
      const response = await axiosInstance.post("/api/shops/", payload);

      // ✅ FIX: Reload all shops from backend to ensure perfect sync
      await loadShops();

      toast.success(`Shop "${payload.shopname}" created successfully!`, {
        id: toastId,
      });

      resetForm();
      setOpenForm(false);
    } catch (err) {
      console.error("Create error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.dismiss(toastId);
        return;
      }

      if (err.response?.status === 400) {
        const apiErrors = err.response.data;
        const errorMessages = [];

        Object.keys(apiErrors).forEach((key) => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(", ")}`);
          } else if (typeof apiErrors[key] === "string") {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join("\n") || "Validation failed", {
          id: toastId,
        });
      } else {
        toast.error("Failed to create shop. Please try again.", {
          id: toastId,
        });
      }
    }
  };

  // Update the handleUpdate function (around line 632-663)

  const handleUpdate = async (id, payload) => {
    const toastId = toast.loading(`Updating shop "${payload.shopname}"...`);

    try {
      const response = await axiosInstance.patch(`/api/shops/${id}/`, payload);

      // ✅ FIX: Reload all shops from backend to ensure perfect sync
      await loadShops();

      toast.success(`Shop "${payload.shopname}" updated successfully!`, {
        id: toastId,
      });

      resetForm();
      setOriginalShopInfo({ id: null, name: "" });
      setOpenForm(false);
      setIsEdit(false);
    } catch (err) {
      console.error("Update error:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.dismiss(toastId);
        return;
      }

      if (err.response?.status === 400) {
        const apiErrors = err.response.data;
        const errorMessages = [];

        Object.keys(apiErrors).forEach((key) => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(", ")}`);
          } else if (typeof apiErrors[key] === "string") {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join("\n") || "Validation failed", {
          id: toastId,
        });
      } else {
        toast.error("Failed to update shop. Please try again.", {
          id: toastId,
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allFields = [
      "name",
      "owner",
      "phone",
      "email",
      "gst_pin",
      "address",
      "pincode",
      "area",
      "state",
    ];
    if (!isEdit) allFields.push("password");

    const newTouched = {};
    allFields.forEach((field) => (newTouched[field] = true));
    setTouchedFields(newTouched);

    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      shop_type: form.shoptype,
      shopname: form.name,
      owner: form.owner,
      phone: form.phone,
      email: form.email,
      gst_pin: form.gst_pin,
      ...((!isEdit || form.password) && { password: form.password }),
      address: form.address,
      pincode: form.pincode,
      area: form.area,
      state: form.state,
      status: form.status === "Active",
    };

    if (isEdit) {
      await handleUpdate(editId, payload);
    } else {
      await handleCreate(payload);
    }

    setIsSubmitting(false);
  };

  const deleteShop = (id) => {
    toast.dismiss();
    const shop = shops.find((s) => s.id === id);
    const shopName = shop?.shopname || "this shop";

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete "{shopName}"?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);

                const dt = toast.loading(`Deleting "${shopName}"...`);

                try {
                  await axiosInstance.delete(`/api/shops/${id}/`);

                  // Remove from UI after successful deletion
                  setShops((prev) => prev.filter((s) => s.id !== id));
                  setSelectedIds((prev) => prev.filter((x) => x !== id));

                  toast.success(`"${shopName}" deleted successfully`, {
                    id: dt,
                  });
                } catch (error) {
                  console.error("Delete error:", error);

                  if (
                    error.response?.status === 401 ||
                    error.response?.status === 403
                  ) {
                    toast.dismiss(dt);
                  } else {
                    toast.error("Failed to delete shop", { id: dt });
                  }
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const bulkDeleteShops = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one shop");
      return;
    }

    toast.dismiss();
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete {selectedIds.length} selected shops?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);

                const dt = toast.loading(
                  `Deleting ${selectedIds.length} shops...`,
                );

                try {
                  // Delete one by one
                  const results = await Promise.all(
                    selectedIds.map(async (id) => {
                      try {
                        await axiosInstance.delete(`/api/shops/${id}/`);
                        return { id, ok: true };
                      } catch {
                        return { id, ok: false };
                      }
                    }),
                  );

                  const deleted = results.filter((r) => r.ok).map((r) => r.id);
                  const failed = results.filter((r) => !r.ok).map((r) => r.id);

                  if (deleted.length > 0) {
                    setShops((prev) =>
                      prev.filter((shop) => !deleted.includes(shop.id)),
                    );
                    setSelectedIds((prev) =>
                      prev.filter((id) => !deleted.includes(id)),
                    );
                  }

                  if (deleted.length === selectedIds.length) {
                    toast.success(
                      `${deleted.length} shop${deleted.length > 1 ? "s" : ""} deleted successfully`,
                      { id: dt },
                    );
                  } else {
                    toast.success(
                      `${deleted.length} deleted, ${failed.length} failed`,
                      { id: dt },
                    );
                  }
                } catch (error) {
                  console.error("Bulk delete error:", error);

                  if (
                    error.response?.status !== 401 &&
                    error.response?.status !== 403
                  ) {
                    toast.error("Bulk delete failed", { id: dt });
                  } else {
                    toast.dismiss(dt);
                  }
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const startEdit = (shop) => {
    setIsEdit(true);
    setEditId(shop.id);
    setOpenForm(true);

    setOriginalShopInfo({ id: shop.id, name: shop.shopname });
    setForm({
      shoptype: shop.shop_type,
      name: shop.shopname,
      owner: shop.owner,
      phone: shop.phone,
      email: shop.email || "",
      password: "",
      gst_pin: (shop.gst_pin || "").toUpperCase(),
      address: shop.address,
      pincode: shop.pincode,
      area: shop.area || "",
      state: shop.state || "",
      status: shop.status ? "Active" : "Inactive",
    });
    setTouchedFields({});
    setErrors({});

    if (shop.pincode && /^\d{6}$/.test(shop.pincode)) {
      fetch(`https://api.postalpincode.in/pincode/${shop.pincode}`)
        .then((res) => res.json())
        .then((data) => {
          if (data[0]?.Status === "Success") {
            const postOffices = data[0].PostOffice || [];
            const areas = postOffices.map((p) => p.Name);
            setAreaList(areas);
          }
        })
        .catch(() => {
          setAreaList([]);
        });
    }
  };

  const startView = (shop) => {
    setViewShop(shop);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      {viewShop && (
        <ViewModal shop={viewShop} onClose={() => setViewShop(null)} />
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 rounded-xl">
            <Building size={24} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              Manage Shops
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage and track shop records and assignments
            </p>
          </div>
        </div>
        {!openForm && (
          <button
            onClick={() => {
              setOpenForm(true);
              setIsEdit(false);
              resetForm();
            }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-md hover:bg-blue-700 transition-all w-full md:w-auto font-medium flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            <span className="text-xl">+</span> Add Shop
          </button>
        )}
      </div>

      <div className="mb-6 bg-white p-5 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <Search size={18} className="text-blue-600" />
            Filters
          </h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-600">
                Filter By
              </label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterId("");
                  setFilterStatus("");
                  setFilterCreatedBy("");
                }}
                className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="all">All Shops</option>
                <option value="id">By ID</option>
                <option value="status">By Status</option>
                <option value="created_by">By Created By</option>
              </select>
            </div>

            {filterType === "id" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">ID:</label>
                <input
                  type="number"
                  value={filterId}
                  onChange={(e) => setFilterId(e.target.value)}
                  placeholder="Enter ID"
                  className="border border-gray-300 px-3 py-2 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
                {filterId && (
                  <button
                    onClick={() => setFilterId("")}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {filterType === "status" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Status:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                {filterStatus && (
                  <button
                    onClick={() => setFilterStatus("")}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {filterType === "created_by" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Created By:
                </label>
                <select
                  value={filterCreatedBy}
                  onChange={(e) => setFilterCreatedBy(e.target.value)}
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                >
                  <option value="">All Creators</option>
                  {uniqueCreatedBy.map((creator) => (
                    <option key={creator} value={creator}>
                      {creator}
                    </option>
                  ))}
                </select>
                {filterCreatedBy && (
                  <button
                    onClick={() => setFilterCreatedBy("")}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by ID, name, owner, phone, email, GST..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full p-2.5 border border-gray-300 rounded-lg pl-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
          />
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2.5 rounded-lg border border-gray-200">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
              Loading...
            </span>
          ) : (
            <>
              <span className="font-medium">{filteredShops.length}</span> shop
              {filteredShops.length !== 1 ? "s" : ""} found
            </>
          )}
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-5 py-3">
          <span className="text-sm text-red-700 font-medium flex items-center gap-2">
            <Trash2 size={16} />
            {selectedIds.length} shop(s) selected
          </span>
          <button
            onClick={bulkDeleteShops}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
            disabled={isSubmitting}
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      )}

      <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-700 text-base">
            Shop Records
          </h2>
          <span className="text-sm text-gray-500">
            Total: {filteredShops.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-4 text-center w-12">
                  <input
                    type="checkbox"
                    checked={
                      filteredShops.length > 0 &&
                      selectedIds.length === filteredShops.length
                    }
                    onChange={() => toggleSelectAll(filteredShops)}
                    className="accent-blue-600 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-3 py-4 text-center font-semibold text-gray-600 w-16">
                  ID
                </th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-24">
                  Type
                </th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-40">
                  Shop Name
                </th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-32">
                  Owner
                </th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-28">
                  Phone
                </th>
                <th className="px-3 py-4 text-center font-semibold text-gray-700 w-20">
                  Status
                </th>
                <th className="px-4 py-4 text-center font-semibold text-gray-700 w-48">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-gray-500 font-semibold"
                  >
                    <div className="flex justify-center items-center">
                      <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                      <span className="ml-3">Loading shops...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Building
                      size={48}
                      className="mx-auto text-gray-300 mb-3"
                    />
                    <p className="text-lg font-medium text-gray-600 mb-1">
                      No shops found
                    </p>
                    <p className="text-sm text-gray-400">
                      {search || filterType !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "Get started by adding a new shop"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr
                    key={shop.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition"
                  >
                    <td className="px-3 py-4 text-center align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(shop.id)}
                        onChange={() => toggleSelect(shop.id)}
                        className="accent-blue-600 w-4 h-4 cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-4 text-center font-mono text-xs text-gray-600 align-middle">
                      #{shop.id}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <span
                        className={`px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                          shop.shop_type === "franchise"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-orange-100 text-orange-700 border border-orange-200"
                        }`}
                      >
                        {shop.shop_type === "franchise"
                          ? "Franchise"
                          : "Other Shop"}
                      </span>
                    </td>
                    <td
                      className="px-4 py-4 font-medium text-gray-800 align-middle truncate max-w-[150px]"
                      title={shop.shopname}
                    >
                      {shop.shopname}
                    </td>
                    <td
                      className="px-4 py-4 text-gray-600 align-middle truncate max-w-[120px]"
                      title={shop.owner}
                    >
                      {shop.owner}
                    </td>
                    <td className="px-4 py-4 text-gray-700 text-xs align-middle">
                      {shop.phone}
                    </td>
                    <td className="px-3 py-4 text-center align-middle">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                          shop.status
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {shop.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startView(shop)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => startEdit(shop)}
                          className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                          title="Edit Shop"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => deleteShop(shop.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Shop"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow border p-8 text-center">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading shops...</p>
          </div>
        ) : filteredShops.length > 0 ? (
          filteredShops.map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-xl shadow border p-5 space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    ID: {shop.id}
                  </span>
                  <p className="font-semibold text-gray-800 text-lg mt-1">
                    {shop.shopname}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{shop.owner}</p>
                  <p className="text-sm text-gray-500 mt-1">{shop.phone}</p>
                  {shop.gst_pin && (
                    <p className="text-xs text-gray-500 mt-1">
                      GST: {shop.gst_pin}
                    </p>
                  )}
                </div>
                <span
                  className={`px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                    shop.status
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-red-100 text-red-700 border border-red-200"
                  }`}
                >
                  {shop.status ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Type:</span>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    shop.shop_type === "franchise"
                      ? "bg-purple-100 text-purple-700 border border-purple-200"
                      : "bg-orange-100 text-orange-700 border border-orange-200"
                  }`}
                >
                  {shop.shop_type === "franchise" ? "Franchise" : "Other Shop"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3">
                <button
                  onClick={() => startView(shop)}
                  className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye size={20} />
                  <span className="text-xs mt-1 font-medium">View</span>
                </button>
                <button
                  onClick={() => startEdit(shop)}
                  className="flex flex-col items-center justify-center p-3 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <Edit size={20} />
                  <span className="text-xs mt-1 font-medium">Edit</span>
                </button>
                <button
                  onClick={() => deleteShop(shop.id)}
                  className="flex flex-col items-center justify-center p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={20} />
                  <span className="text-xs mt-1 font-medium">Delete</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl shadow border p-8 text-center">
            <Building size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-600 mb-1">
              No shops found
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {search || filterType !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by adding a new shop"}
            </p>
            {!search && filterType === "all" && (
              <button
                onClick={() => {
                  setOpenForm(true);
                  setIsEdit(false);
                  resetForm();
                }}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                disabled={isSubmitting}
              >
                + Add Your First Shop
              </button>
            )}
          </div>
        )}
      </div>

      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-[800px] rounded-xl shadow-2xl border border-gray-200 max-h-[95vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Building size={20} className="text-blue-600" />
                <h2 className="text-xl font-semibold text-blue-700">
                  {isEdit ? "Edit Shop" : "Add New Shop"}
                </h2>
              </div>
              <button
                onClick={() => setOpenForm(false)}
                className="text-gray-500 hover:text-red-600 text-xl p-1 hover:bg-red-50 rounded-full transition"
                disabled={isSubmitting}
              >
                ✖
              </button>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(95vh - 120px)" }}
            >
              <form
                onSubmit={handleSubmit}
                className="grid grid-cols-1 md:grid-cols-2 gap-5"
              >
                <div className="space-y-4">
                  <SelectField
                    name="shoptype"
                    label="Shop Type"
                    value={form.shoptype}
                    onChange={(e) =>
                      handleFieldChange("shoptype", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("shoptype")}
                    error={errors.shoptype}
                    touched={touchedFields.shoptype}
                    options={[
                      { value: "franchise", label: "Franchise" },
                      { value: "othershop", label: "Other Shop" },
                    ]}
                    disabled={isSubmitting}
                  />

                  <InputField
                    name="name"
                    label="Shop Name"
                    value={form.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    error={errors.name}
                    touched={touchedFields.name}
                    maxLength={50}
                    minLength={2}
                    pattern={VALIDATION_PATTERNS.name}
                    patternMessage="Only letters, spaces, dots and hyphens allowed"
                    placeholder="Enter shop name"
                    showCount={true}
                    disabled={isSubmitting}
                  />

                  <InputField
                    name="owner"
                    label="Owner Name"
                    value={form.owner}
                    onChange={(e) => handleFieldChange("owner", e.target.value)}
                    onBlur={() => handleFieldBlur("owner")}
                    error={errors.owner}
                    touched={touchedFields.owner}
                    maxLength={50}
                    minLength={2}
                    pattern={VALIDATION_PATTERNS.owner}
                    patternMessage="Only letters, spaces, dots and hyphens allowed"
                    placeholder="Enter owner name"
                    showCount={true}
                    disabled={isSubmitting}
                  />

                  <InputField
                    name="phone"
                    label="Phone"
                    value={form.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    onBlur={() => handleFieldBlur("phone")}
                    error={errors.phone}
                    touched={touchedFields.phone}
                    maxLength={10}
                    minLength={10}
                    pattern={VALIDATION_PATTERNS.phone}
                    patternMessage="Must be exactly 10 digits"
                    placeholder="10-digit mobile number"
                    showCount={true}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-4">
                  <InputField
                    name="email"
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                    onBlur={() => handleFieldBlur("email")}
                    error={errors.email}
                    touched={touchedFields.email}
                    pattern={VALIDATION_PATTERNS.email}
                    patternMessage="Enter a valid email address"
                    placeholder="example@domain.com"
                    disabled={isSubmitting}
                  />

                  <PasswordInput
                    name="password"
                    label="Password"
                    value={form.password}
                    onChange={(e) =>
                      handleFieldChange("password", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("password")}
                    error={errors.password}
                    touched={touchedFields.password}
                    isEdit={isEdit}
                  />

                  <InputField
                    name="gst_pin"
                    label="GST PIN"
                    value={form.gst_pin}
                    onChange={(e) =>
                      handleFieldChange("gst_pin", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("gst_pin")}
                    error={errors.gst_pin}
                    touched={touchedFields.gst_pin}
                    maxLength={15}
                    minLength={15}
                    pattern={VALIDATION_PATTERNS.gst_pin}
                    patternMessage="Must be exactly 15 alphanumeric characters"
                    placeholder="Enter 15-digit GST PIN"
                    showCount={true}
                    disabled={isSubmitting}
                  />

                  <SelectField
                    name="status"
                    label="Status"
                    value={form.status}
                    onChange={(e) =>
                      handleFieldChange("status", e.target.value)
                    }
                    error={errors.status}
                    touched={touchedFields.status}
                    options={[
                      { value: "Active", label: "Active" },
                      { value: "Inactive", label: "Inactive" },
                    ]}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-4">
                  <TextAreaField
                    name="address"
                    label="Address"
                    value={form.address}
                    onChange={(e) =>
                      handleFieldChange("address", e.target.value)
                    }
                    onBlur={() => handleFieldBlur("address")}
                    error={errors.address}
                    touched={touchedFields.address}
                    rows={2}
                    maxLength={200}
                    minLength={10}
                    placeholder="Enter complete address"
                    showCount={true}
                    disabled={isSubmitting}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <InputField
                        name="pincode"
                        label="Pincode"
                        value={form.pincode}
                        onChange={(e) => {
                          handleFieldChange("pincode", e.target.value);
                          handlePincode(e.target.value);
                        }}
                        onBlur={() => handleFieldBlur("pincode")}
                        error={pincodeError || errors.pincode}
                        touched={touchedFields.pincode}
                        maxLength={6}
                        minLength={6}
                        pattern={VALIDATION_PATTERNS.pincode}
                        patternMessage="Must be exactly 6 digits"
                        placeholder="Enter 6-digit pincode"
                        showCount={true}
                        disabled={isSubmitting}
                      />
                      {isPincodeLoading && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Loader2 className="animate-spin h-3 w-3" />
                          Fetching location...
                        </p>
                      )}
                    </div>

                    <div>
                      {areaList.length > 0 ? (
                        <SelectField
                          name="area"
                          label="Area"
                          value={form.area}
                          onChange={(e) =>
                            handleFieldChange("area", e.target.value)
                          }
                          onBlur={() => handleFieldBlur("area")}
                          error={errors.area}
                          touched={touchedFields.area}
                          options={areaList.map((a) => ({
                            value: a,
                            label: a,
                          }))}
                          placeholder="Select Area"
                          disabled={isSubmitting}
                        />
                      ) : (
                        <InputField
                          name="area"
                          label="Area"
                          value={form.area}
                          onChange={(e) =>
                            handleFieldChange("area", e.target.value)
                          }
                          onBlur={() => handleFieldBlur("area")}
                          error={errors.area}
                          touched={touchedFields.area}
                          maxLength={50}
                          minLength={3}
                          placeholder="Enter area manually"
                          showCount={true}
                          disabled={isSubmitting || isPincodeLoading}
                          helperText={
                            !form.pincode ? "Enter pincode first" : ""
                          }
                        />
                      )}
                    </div>
                  </div>

                  {/* State Field - Auto-filled from pincode API */}
                  <InputField
                    name="state"
                    label="State"
                    value={form.state}
                    onChange={(e) => handleFieldChange("state", e.target.value)}
                    onBlur={() => handleFieldBlur("state")}
                    error={errors.state}
                    touched={touchedFields.state}
                    maxLength={50}
                    minLength={2}
                    placeholder={
                      isPincodeLoading
                        ? "Fetching state..."
                        : form.pincode
                          ? "Auto-filled from pincode"
                          : "Enter pincode first"
                    }
                    disabled={true}
                    icon={<MapPin size={16} className="text-gray-400" />}
                    helperText={
                      !form.pincode
                        ? "State will auto-fill when pincode is entered"
                        : ""
                    }
                  />
                </div>

                <div className="col-span-1 md:col-span-2 pt-4">
                  <button
                    type="submit"
                    className={`w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin h-4 w-4" />
                        {isEdit ? "Updating..." : "Creating..."}
                      </>
                    ) : isEdit ? (
                      "Update Shop"
                    ) : (
                      "Create Shop"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
