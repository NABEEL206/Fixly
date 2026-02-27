// src/pages/Purchases/Vendor.jsx
import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  X,
  CheckCircle,
  XCircle,
  User,
  RefreshCw
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/API/axiosInstance";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" }
];

const getStatusClasses = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-green-500/10 text-green-600 border border-green-500/30";
    case "inactive":
      return "bg-gray-500/10 text-gray-600 border border-gray-500/30";
    default:
      return "bg-gray-500/10 text-gray-600 border border-gray-500/30";
  }
};

// Form Modal Component
const FormModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isEdit, 
  isSubmitting,
  formData,
  onFormChange,
  errors,
  fieldErrors,
  onBlur
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
      <div className="bg-white w-full max-w-[700px] rounded-xl shadow-2xl border border-gray-200 max-h-[95vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-blue-700">
            {isEdit ? "Edit Vendor" : "Add New Vendor"}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-red-600 text-xl"
            disabled={isSubmitting}
          >
            ✖
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(95vh - 120px)" }}>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Vendor Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={onFormChange}
                  onBlur={() => onBlur('name')}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    fieldErrors.name ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-1 focus:ring-blue-200`}
                  placeholder="Vendor Name *"
                  disabled={isSubmitting}
                />
                {fieldErrors.name && (
                  <p className="text-red-500 text-xs mt-0.5">{fieldErrors.name}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <select
                  name="status"
                  value={formData.status || 'active'}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
                  disabled={isSubmitting}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={onFormChange}
                  onBlur={() => onBlur('email')}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    errors.email || fieldErrors.email ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-1 focus:ring-blue-200`}
                  placeholder="Email Address *"
                  disabled={isSubmitting}
                />
                {(errors.email || fieldErrors.email) && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.email || fieldErrors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={onFormChange}
                  onBlur={() => onBlur('phone')}
                  className={`w-full px-3 py-2 text-sm border rounded-lg ${
                    errors.phone || fieldErrors.phone ? "border-red-500" : "border-gray-300"
                  } focus:outline-none focus:ring-1 focus:ring-blue-200`}
                  placeholder="Phone Number * (10-15 digits)"
                  maxLength={15}
                  disabled={isSubmitting}
                />
                {(errors.phone || fieldErrors.phone) && (
                  <p className="text-red-500 text-xs mt-0.5">{errors.phone || fieldErrors.phone}</p>
                )}
              </div>
            </div>

            {/* Website - Full Width (Optional) */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Globe size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  name="website"
                  value={formData.website || ''}
                  onChange={onFormChange}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200"
                  placeholder="Website (optional) - e.g., example.com"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Website is optional. If provided, it will be automatically prefixed with https://
              </p>
            </div>

            {/* Address - Full Width */}
            <div>
              <textarea
                name="address"
                value={formData.address || ''}
                onChange={onFormChange}
                onBlur={() => onBlur('address')}
                rows={2}
                className={`w-full px-3 py-2 text-sm border rounded-lg ${
                  fieldErrors.address ? "border-red-500" : "border-gray-300"
                } focus:outline-none focus:ring-1 focus:ring-blue-200 resize-none`}
                placeholder="Complete Address *"
                disabled={isSubmitting}
              />
              {fieldErrors.address && (
                <p className="text-red-500 text-xs mt-0.5">{fieldErrors.address}</p>
              )}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEdit ? "Update Vendor" : "Add Vendor"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// View Modal Component
const ViewModal = ({ isOpen, onClose, vendor, onEdit }) => {
  if (!isOpen || !vendor) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-blue-700">Vendor Details</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-red-600 text-lg"
          >
            ✖
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Vendor Name</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                  <Building size={16} className="text-blue-500" />
                  {vendor.name}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <span className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusClasses(vendor.status)}`}>
                  {vendor.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Email Address</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg flex items-center gap-2 break-all">
                  <Mail size={16} className="text-blue-500" />
                  {vendor.email}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">Phone Number</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                  <Phone size={16} className="text-blue-500" />
                  {vendor.phone}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Additional Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-600">Address</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg flex items-start gap-2">
                  <MapPin size={16} className="text-blue-500 mt-1" />
                  {vendor.address}
                </p>
              </div>

              {vendor.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Website</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                    <Globe size={16} className="text-blue-500" />
                    <a 
                      href={vendor.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {vendor.website.replace(/^https?:\/\//, '')}
                    </a>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-600">Created By</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
                  <User size={16} className="text-blue-500" />
                  {vendor.created_by || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vendor.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created At</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                    {new Date(vendor.created_at).toLocaleString()}
                  </p>
                </div>
              )}
              {vendor.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Updated At</label>
                  <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                    {new Date(vendor.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <button 
            onClick={() => { 
              onEdit(vendor); 
              onClose(); 
            }} 
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Edit Vendor
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Vendor() {
  // State management
  const [vendors, setVendors] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editVendor, setEditVendor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use ref to track toast ID instead of state to prevent re-renders
  const toastIdRef = useRef(null);
  // Use ref to prevent multiple edits
  const isEditingRef = useRef(false);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");

  // Form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    status: "active"
  });

  // Validation errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);

  // Get unique createdBy values for filter
  const uniqueCreatedBy = useMemo(() => {
    const set = new Set();
    vendors.forEach((v) => { 
      if (v.created_by) set.add(v.created_by); 
    });
    return Array.from(set).sort();
  }, [vendors]);

  // Reset form states
  const resetFormStates = useCallback(() => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      status: "active"
    });
    setEmailError("");
    setPhoneError("");
    setFieldErrors({});
  }, []);

  // Validation functions
  const validateEmail = (value) => {
    if (!value?.trim()) { 
      setEmailError("Email is required"); 
      return false; 
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { 
      setEmailError("Enter a valid email address"); 
      return false; 
    }
    setEmailError(""); 
    return true;
  };

  const validatePhone = (value) => {
    if (!value?.trim()) { 
      setPhoneError("Phone number is required"); 
      return false; 
    }
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 10 || cleaned.length > 15) { 
      setPhoneError("Phone number must be 10-15 digits"); 
      return false; 
    }
    setPhoneError(""); 
    return true;
  };

  const validateRequiredFields = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Vendor name is required";
    if (!formData.email?.trim()) errors.email = "Email is required";
    if (!formData.phone?.trim()) errors.phone = "Phone number is required";
    if (!formData.address?.trim()) errors.address = "Address is required";
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateField = (fieldName) => {
    switch(fieldName) {
      case 'name':
        if (!formData.name?.trim()) {
          setFieldErrors(prev => ({ ...prev, name: "Vendor name is required" }));
        } else {
          setFieldErrors(prev => ({ ...prev, name: "" }));
        }
        break;
      case 'email':
        validateEmail(formData.email);
        if (!formData.email?.trim()) {
          setFieldErrors(prev => ({ ...prev, email: "Email is required" }));
        } else {
          setFieldErrors(prev => ({ ...prev, email: "" }));
        }
        break;
      case 'phone':
        validatePhone(formData.phone);
        if (!formData.phone?.trim()) {
          setFieldErrors(prev => ({ ...prev, phone: "Phone number is required" }));
        } else {
          setFieldErrors(prev => ({ ...prev, phone: "" }));
        }
        break;
      case 'address':
        if (!formData.address?.trim()) {
          setFieldErrors(prev => ({ ...prev, address: "Address is required" }));
        } else {
          setFieldErrors(prev => ({ ...prev, address: "" }));
        }
        break;
      default:
        break;
    }
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Only allow digits for phone
      const cleaned = value.replace(/\D/g, '').slice(0, 15);
      setFormData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleFieldBlur = (fieldName) => {
    validateField(fieldName);
  };

  // Fetch vendors - FIXED: Added /api/ prefix
  const fetchVendors = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setIsFetchingData(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      // ✅ FIXED: Added /api/ prefix
      const response = await axiosInstance.get('/api/vendors/');
      
      // Handle the API response structure
      const data = response.data;
      let vendorsList = [];
      
      if (Array.isArray(data)) {
        vendorsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        vendorsList = data.data;
      } else if (data?.results) {
        vendorsList = data.results;
      }
      
      setVendors(vendorsList);
    } catch (error) {
      console.error("Fetch vendors error:", error);
      // 403/401 are handled by interceptor, don't show additional error
      if (error.response?.status !== 403 && error.response?.status !== 401) {
        toast.error("Failed to load vendors");
      }
    } finally {
      setIsFetchingData(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    fetchVendors(); 
  }, [fetchVendors]);

  // Handle form submission - FIXED: Added /api/ prefix to all endpoints
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isEmailValid = validateEmail(formData.email);
    const isPhoneValid = validatePhone(formData.phone);
    const isRequiredValid = validateRequiredFields();

    if (!isRequiredValid || !isEmailValid || !isPhoneValid) {
      toast.error("Please fix the errors in the form");
      return;
    }

    // Clean phone number
    const cleanedPhone = formData.phone.replace(/\D/g, '');

    const vendorData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: cleanedPhone,
      address: formData.address.trim(),
      status: formData.status.toLowerCase(),
    };

    // Only include website if provided
    if (formData.website?.trim()) {
      // Ensure website has protocol
      let websiteUrl = formData.website.trim();
      if (!/^https?:\/\//i.test(websiteUrl)) {
        websiteUrl = `https://${websiteUrl}`;
      }
      vendorData.website = websiteUrl;
    }

    setIsSubmitting(true);
    
    // Dismiss any existing toast before showing new one
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }
    
    const newToastId = toast.loading(isEdit ? "Updating vendor..." : "Creating vendor...");
    toastIdRef.current = newToastId;

    try {
      let response;
      if (isEdit && editVendor?.id) {
        // ✅ FIXED: Added /api/ prefix
        response = await axiosInstance.put(`/api/vendors/${editVendor.id}/`, vendorData);
      } else {
        // ✅ FIXED: Added /api/ prefix
        response = await axiosInstance.post('/api/vendors/', vendorData);
      }

      // Handle response
      const responseData = response.data;
      const newVendor = responseData.data || responseData;

      if (isEdit) {
        setVendors(prev => 
          prev.map(v => v.id === newVendor.id ? newVendor : v)
        );
        toast.success(responseData.message || "Vendor updated successfully!", { id: newToastId });
      } else {
        setVendors(prev => [newVendor, ...prev]);
        toast.success(responseData.message || "Vendor created successfully!", { id: newToastId });
      }

      // Close form and reset
      setOpenForm(false);
      setIsEdit(false);
      setEditVendor(null);
      resetFormStates();

    } catch (error) {
      console.error("Submit error:", error);
      
      // Handle validation errors from API (400)
      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = [];
        
        // Handle field-specific errors
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(', ')}`);
          } else if (typeof apiErrors[key] === 'string') {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join('\n') || "Validation failed", { id: newToastId });
      } 
      // Don't handle 403/401 here - they're handled by the interceptor
      else if (error.response?.status !== 403 && error.response?.status !== 401) {
        // Only show generic error for non-auth errors
        toast.error(error.response?.data?.message || `${isEdit ? "Update" : "Create"} failed. Please try again.`, { id: newToastId });
      }
    } finally {
      setIsSubmitting(false);
      toastIdRef.current = null;
    }
  };

  // Handle edit - with debounce to prevent double clicks
  const handleEdit = useCallback((vendor) => {
    // Prevent multiple edit clicks
    if (isEditingRef.current) {
      return;
    }
    
    isEditingRef.current = true;
    
    // Dismiss any existing toasts
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    
    resetFormStates();
    setEditVendor(vendor);
    setFormData({
      name: vendor.name || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || "",
      website: vendor.website || "",
      status: vendor.status?.toLowerCase() || "active"
    });
    setIsEdit(true);
    setOpenForm(true);
    
    // Reset the editing ref after a short delay
    setTimeout(() => {
      isEditingRef.current = false;
    }, 300);
  }, [resetFormStates]);

  // Handle delete - FIXED: Added /api/ prefix
  const handleDelete = (id) => {
    // Dismiss any existing toasts
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }
    
    const deleteToastId = toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete vendor?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                toastIdRef.current = null;
              }} 
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading("Deleting vendor...");
                toastIdRef.current = dt;
                
                try {
                  // ✅ FIXED: Added /api/ prefix
                  await axiosInstance.delete(`/api/vendors/${id}/`);
                  setVendors((prev) => prev.filter((v) => v.id !== id));
                  setSelectedIds((prev) => prev.filter((vid) => vid !== id));
                  toast.success("Vendor deleted successfully", { id: dt });
                } catch (error) {
                  console.error("Delete error:", error);
                  // 403/401 are handled by interceptor, no need to show additional error
                  if (error.response?.status !== 403 && error.response?.status !== 401) {
                    toast.error(error.response?.data?.message || "Failed to delete vendor", { id: dt });
                  }
                } finally {
                  toastIdRef.current = null;
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
    
    toastIdRef.current = deleteToastId;
  };

  // Handle bulk delete - FIXED: Added /api/ prefix
  const handleBulkDelete = () => {
    if (!selectedIds.length) { 
      toast.error("Please select at least one vendor"); 
      return; 
    }
    
    // Dismiss any existing toasts
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }
    
    const bulkToastId = toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete {selectedIds.length} selected vendors?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                toast.dismiss(t.id);
                toastIdRef.current = null;
              }} 
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading(`Deleting ${selectedIds.length} vendors...`);
                toastIdRef.current = dt;
                
                const results = await Promise.all(
                  selectedIds.map(async (id) => {
                    try {
                      // ✅ FIXED: Added /api/ prefix
                      await axiosInstance.delete(`/api/vendors/${id}/`);
                      return { id, success: true };
                    } catch (error) {
                      // 403/401 are handled by interceptor, just mark as failed
                      return { id, success: false };
                    }
                  })
                );

                const deleted = results.filter(r => r.success).map(r => r.id);
                const failed = results.filter(r => !r.success).map(r => r.id);

                if (deleted.length > 0) {
                  setVendors((prev) => prev.filter((v) => !deleted.includes(v.id)));
                  setSelectedIds((prev) => prev.filter((id) => !deleted.includes(id)));
                }

                if (deleted.length === selectedIds.length) {
                  toast.success(`${deleted.length} vendor${deleted.length > 1 ? 's' : ''} deleted`, { id: dt });
                } else {
                  toast.success(`${deleted.length} deleted, ${failed.length} failed`, { id: dt });
                }
                
                toastIdRef.current = null;
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
    
    toastIdRef.current = bulkToastId;
  };

  // Toggle selection
  const toggleSelect = (id) => {
    setSelectedIds((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((v) => v.id));
    }
  };

  // Filter vendors
  const filtered = vendors.filter((v) => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      v.name?.toLowerCase().includes(searchLower) ||
      v.email?.toLowerCase().includes(searchLower) ||
      v.phone?.includes(search) ||
      v.address?.toLowerCase().includes(searchLower);
    
    const matchesStatus = !filterStatus || v.status?.toLowerCase() === filterStatus.toLowerCase();
    const matchesCreatedBy = !filterCreatedBy || v.created_by === filterCreatedBy;
    
    return matchesSearch && matchesStatus && matchesCreatedBy;
  });

  // Handle refresh
  const handleRefresh = () => {
    fetchVendors(false);
  };

  // Handle modal close
  const handleCloseForm = () => {
    // Dismiss any existing toasts when closing modal
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
    
    setOpenForm(false);
    setIsEdit(false);
    setEditVendor(null);
    resetFormStates();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">Vendors</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>
        <button
          onClick={() => { 
            // Dismiss any existing toasts
            if (toastIdRef.current) {
              toast.dismiss(toastIdRef.current);
              toastIdRef.current = null;
            }
            setOpenForm(true); 
            setIsEdit(false); 
            setEditVendor(null); 
            resetFormStates(); 
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all w-full md:w-auto flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          <Plus size={18} /> Add Vendor
        </button>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">All Status</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {filterStatus && (
                <button 
                  onClick={() => setFilterStatus("")} 
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Created By Filter */}
            {uniqueCreatedBy.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Created By:</label>
                <select
                  value={filterCreatedBy}
                  onChange={(e) => setFilterCreatedBy(e.target.value)}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">All Creators</option>
                  {uniqueCreatedBy.map((creator) => (
                    <option key={creator} value={creator}>{creator}</option>
                  ))}
                </select>
                {filterCreatedBy && (
                  <button 
                    onClick={() => setFilterCreatedBy("")} 
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-gray-700 text-sm sm:text-base">
            Vendor Records ({filtered.length})
          </h2>
          
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete} 
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-lg w-full sm:w-64 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center w-12">
                  <input 
                    type="checkbox" 
                    checked={filtered.length > 0 && selectedIds.length === filtered.length} 
                    onChange={toggleSelectAll} 
                    className="accent-blue-600 rounded"
                  />
                </th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Vendor</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Email</th>
                <th className="px-3 py-3 text-left font-semibold text-gray-700">Phone</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Status</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingData ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Loading vendors...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500 font-semibold">
                    No vendors found
                  </td>
                </tr>
              ) : (
                filtered.map((vendor) => (
                  <tr key={vendor.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="px-3 py-4 text-center align-middle">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(vendor.id)} 
                        onChange={() => toggleSelect(vendor.id)} 
                        className="accent-blue-600 rounded"
                      />
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <Building size={16} className="text-blue-500" />
                        <span className="font-medium text-gray-800">{vendor.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-600">{vendor.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-600">{vendor.phone}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusClasses(vendor.status)}`}>
                        {vendor.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedVendor(vendor);
                            setViewModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                          title="Edit Vendor"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Vendor"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4 mt-4 p-4">
          {filtered.map((vendor) => (
            <div key={vendor.id} className="bg-white border rounded-xl shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(vendor.id)} 
                    onChange={() => toggleSelect(vendor.id)} 
                    className="accent-blue-600 rounded"
                  />
                  <div>
                    <p className="font-semibold text-gray-800 flex items-center gap-1">
                      <Building size={14} className="text-blue-500" />
                      {vendor.name}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                      <Mail size={12} className="text-gray-400" />
                      {vendor.email}
                    </p>
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      {vendor.phone}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <User size={10} className="text-gray-400" />
                      Created by: {vendor.created_by || "N/A"}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(vendor.status)}`}>
                  {vendor.status === "active" ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => {
                    setSelectedVendor(vendor);
                    setViewModalOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Eye size={18} />
                  <span className="text-xs mt-1">View</span>
                </button>
                <button
                  onClick={() => handleEdit(vendor)}
                  className="flex flex-col items-center justify-center p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <Edit size={18} />
                  <span className="text-xs mt-1">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(vendor.id)}
                  className="flex flex-col items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={18} />
                  <span className="text-xs mt-1">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Stats */}
        {vendors.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>
                Showing {filtered.length} of {vendors.length} vendors
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} className="text-green-500" />
                  <span>Active: {vendors.filter(v => v.status === "active").length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <XCircle size={12} className="text-gray-400" />
                  <span>Inactive: {vendors.filter(v => v.status === "inactive").length}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <FormModal 
        isOpen={openForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        isEdit={isEdit}
        isSubmitting={isSubmitting}
        formData={formData}
        onFormChange={handleFormChange}
        errors={{ email: emailError, phone: phoneError }}
        fieldErrors={fieldErrors}
        onBlur={handleFieldBlur}
      />

      <ViewModal 
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        vendor={selectedVendor}
        onEdit={handleEdit}
      />
    </div>
  );
}