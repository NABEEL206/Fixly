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
} from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "@/API/BaseURL";
import { getAuthHeaders } from "@/utils/authHeaders";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// ✅ auto attach token with correct token type
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  const tokenType = localStorage.getItem("token_type") || "Bearer";
  if (token) {
    config.headers.Authorization = `${tokenType} ${token}`;
  }
  console.log("API Request:", config.method.toUpperCase(), config.url);
  return config;
});

// Response interceptor to handle auth errors - SINGLE SOURCE OF TRUTH for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors here - ONLY ONCE
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      // Optional: Redirect to login after a delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } else if (error.response?.status === 403) {
      toast.error("You don't have permission to perform this action");
    }
    return Promise.reject(error);
  }
);

// ----------------------------------------------------
// 1. Password Input Component (Eye Icon Toggle)
// ----------------------------------------------------
const PasswordInput = ({ name, label, value, onChange, error, isEdit }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="text-sm">
        {label} {isEdit ? "(leave empty to keep old)" : "*"}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full p-1 pr-10 border rounded text-sm focus:outline-none focus:ring-1 ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "focus:border-blue-400 focus:ring-blue-400"
          }`}
          placeholder={isEdit ? "(leave empty to keep old)" : ""}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
        >
          {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// ----------------------------------------------------
// 2. View Modal Component (Full Shop Details with Assigned GrowTags and Complaints)
// ----------------------------------------------------
const ViewModal = ({ shop, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [shopDetails, setShopDetails] = useState(null);

  useEffect(() => {
    if (shop?.id) {
      fetchShopDetails(shop.id);
    }
  }, [shop?.id]);

  const fetchShopDetails = async (shopId) => {
    setLoading(true);
    try {
      // Fix: Use path parameter instead of query parameter
      const res = await api.get(`/shops-popup/${shopId}/`);
      setShopDetails(res.data);
    } catch (error) {
      console.error("Error fetching shop details:", error);
      // Don't show toast for 401/403 - they're handled by interceptor
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error("Failed to load shop details");
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

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-blue-700">
            Shop Details - {displayData.shopname} (ID: {displayData.id})
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-lg">✖</button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 100px)" }}>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading shop details...</span>
            </div>
          ) : (
            <>
              {/* Shop Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Shop Type</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {displayData.shop_type_display || (displayData.shop_type === 'franchise' ? 'Franchise' : 'Other Shop')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <p className={`mt-1 p-2 bg-gray-50 rounded-lg ${displayData.status ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}`}>
                      {displayData.status ? "Active" : "Inactive"}
                    </p>
                  </div>
                
                </div>

                {/* Owner Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Owner Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Owner Name</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.owner}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.email || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.phone}</p>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Address Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Address</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.address}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Area</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.area}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Pincode</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.pincode}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">State</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.state}</p>
                  </div>
                </div>

                {/* System Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">System Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">GST PIN</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{displayData.gst_pin || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Created By</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {displayData.created_by?.username || displayData.created_by?.email || displayData.created_by || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Assigned GrowTags Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Tag size={20} className="text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Assigned GrowTags ({displayData.assigned_growtags_count || 0})
                  </h3>
                </div>
                
                {displayData.assigned_growtags && displayData.assigned_growtags.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {displayData.assigned_growtags.map((tag) => (
                      <div key={tag.id} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <p className="font-medium text-purple-700">{tag.name}</p>
                        <p className="text-xs text-purple-600 mt-1">ID: {tag.grow_id}</p>
                        <p className="text-xs text-purple-600">{tag.phone}</p>
                        {tag.email && <p className="text-xs text-purple-600 truncate">{tag.email}</p>}
                        <p className="text-xs text-purple-600 mt-1">{tag.area}, {tag.pincode}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic bg-gray-50 p-3 rounded-lg">No grow tags assigned</p>
                )}
              </div>

              {/* Assigned Complaints Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-800">
                    Assigned Complaints ({displayData.assigned_complaints_count || 0})
                  </h3>
                </div>
                
                {displayData.assigned_complaints && displayData.assigned_complaints.length > 0 ? (
                  <div className="space-y-3">
                    {displayData.assigned_complaints.map((complaint) => (
                      <div key={complaint.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {complaint.complaint_id}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(complaint.status)}`}>
                                {complaint.status}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                complaint.confirm_status === "CONFIRMED" 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
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
                            
                            <h4 className="font-medium text-gray-800 mb-1">{complaint.title}</h4>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div>
                                <span className="font-medium">Area:</span> {complaint.area}
                              </div>
                              <div>
                                <span className="font-medium">Pincode:</span> {complaint.pincode}
                              </div>
                              <div>
                                <span className="font-medium">Assigned To:</span> {complaint.assign_to}
                              </div>
                              <div>
                                <span className="font-medium">Created:</span> {complaint.created_on}
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              <span className="font-medium">Created at:</span> {complaint.created_at_time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic bg-gray-50 p-3 rounded-lg">No complaints assigned</p>
                )}
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// 3. Main Shops Component
// ----------------------------------------------------
export default function Shops() {
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewShop, setViewShop] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Filter states
  const [filterType, setFilterType] = useState("all");
  const [filterId, setFilterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [search, setSearch] = useState("");

  // Debug function to check auth state
  const debugAuth = () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type");
    
    console.log("=== Shops Auth Debug ===");
    console.log("Token exists:", !!token);
    console.log("Token type:", tokenType || "not set (defaulting to Bearer)");
    console.log("Token preview:", token ? `${token.substring(0, 20)}...` : "none");
    console.log("========================");
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
    status: "Active",
  });

  const [errors, setErrors] = useState({});
  const [areaList, setAreaList] = useState([]);
  const [shops, setShops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get unique creators for filter dropdown
  const uniqueCreatedBy = useMemo(() => {
    const set = new Set();
    shops.forEach((shop) => { 
      if (shop.created_by) {
        const creator = shop.created_by.username || shop.created_by.email || shop.created_by;
        set.add(creator); 
      }
    });
    return Array.from(set).sort();
  }, [shops]);

  // Filter shops based on all filters
  const filteredShops = useMemo(() => {
    const text = search.toLowerCase().trim();

    return shops.filter((shop) => {
      // Search filter
      const searchableText = [
        shop.id?.toString(),
        shop.shopname,
        shop.owner,
        shop.phone,
        shop.email,
        shop.gst_pin
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchableText.includes(text);

      // Filter by type
      let matchesFilter = true;
      if (filterType === "id" && filterId) {
        matchesFilter = String(shop.id) === filterId;
      } else if (filterType === "status" && filterStatus) {
        const statusText = shop.status ? "active" : "inactive";
        matchesFilter = statusText === filterStatus;
      } else if (filterType === "created_by" && filterCreatedBy) {
        const creator = shop.created_by?.username || shop.created_by?.email || shop.created_by;
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

  const loadShops = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/shops/");
      setShops(res.data || []);
    } catch (err) {
      console.error("Load shops error:", err);
      // Don't show toast for 401/403 - they're handled by interceptor
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        toast.error("Failed to load shops");
      }
      setShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    debugAuth();
    loadShops();
  }, []);

  // HANDLE INPUT CHANGE
  const handleChange = async (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "pincode") {
      if (!value) {
        setAreaList([]);
        setForm((prev) => ({
          ...prev,
          area: "",
        }));
        setPincodeError("Pincode is required");
        return;
      }

      if (value.length !== 6) {
        setAreaList([]);
        setForm((prev) => ({
          ...prev,
          area: "",
        }));
        setPincodeError("Pincode must be exactly 6 digits");
        return;
      }

      setIsPincodeLoading(true);
      setPincodeError("");

      try {
        const res = await axios.get(
          `https://api.postalpincode.in/pincode/${value}`,
          { timeout: 8000 },
        );

        if (res.data[0]?.Status !== "Success") {
          setAreaList([]);
          setForm((prev) => ({
            ...prev,
            area: "",
          }));
          setPincodeError("Invalid pincode. Please check and try again.");
          return;
        }

        const postOffices = res.data[0].PostOffice || [];
        const areas = postOffices.map((p) => p.Name);

        setAreaList(areas);
        setForm((prev) => ({
          ...prev,
          area: areas[0] || "",
        }));

        setPincodeError("");
      } catch (error) {
        console.error("Pincode API Error:", error);

        setAreaList([]);
        setForm((prev) => ({
          ...prev,
          area: "",
        }));

        setPincodeError("Network connection lost. Please check your internet.");
      } finally {
        setIsPincodeLoading(false);
      }
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
      status: "Active",
    });
    setAreaList([]);
    setErrors({});
  };

  const validateForm = () => {
    let newErrors = {};

    if (!form.shoptype.trim()) newErrors.shoptype = "Shop type is required.";
    if (!form.name.trim()) newErrors.name = "Shop name is required.";
    if (!form.owner.trim()) newErrors.owner = "Owner name is required.";

    const phoneRegex = /^\d{10}$/;
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(form.phone.trim())) {
      newErrors.phone = "Phone must be exactly 10 digits.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Invalid email format.";
    }

    if (!isEdit && !form.password.trim()) {
      newErrors.password = "Password is required for new shops.";
    }

    if (!form.address.trim()) newErrors.address = "Address is required.";

    const pincodeRegex = /^\d{6}$/;
    if (!form.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!pincodeRegex.test(form.pincode.trim())) {
      newErrors.pincode = "Pincode must be exactly 6 digits.";
    }

    if (!form.area.trim()) newErrors.area = "Area is required.";

    // GST PIN validation - MANDATORY
    const gstRegex = /^[0-9A-Z]{15}$/;
    if (!form.gst_pin || !form.gst_pin.trim()) {
      newErrors.gst_pin = "GST PIN is required.";
    } else if (!gstRegex.test(form.gst_pin.trim())) {
      newErrors.gst_pin = "GST PIN must be exactly 15 alphanumeric characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    const toastId = toast.loading(
      isEdit ? `Updating shop "${originalShopInfo.name}"...` : `Creating new shop "${form.name}"...`
    );
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
      status: form.status === "Active",
    };

    try {
      if (isEdit) {
        await api.put(`/shops/${editId}/`, payload);
        toast.success(`Shop "${form.name}" updated successfully!`, { id: toastId });
      } else {
        const res = await api.post("/shops/", payload);
        toast.success(`Shop "${form.name}" created successfully!`, { id: toastId });
      }

      resetForm();
      setOriginalShopInfo({ id: null, name: "" });
      setOpenForm(false);
      setIsEdit(false);
      loadShops();
    } catch (err) {
      console.error("Submit error:", err);
      
      // Don't show toast for 401/403 - they're handled by interceptor
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.dismiss(toastId);
        return;
      }
      
      // Handle validation errors (400)
      if (err.response?.status === 400) {
        const apiErrors = err.response.data;
        const errorMessages = [];
        
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(', ')}`);
          } else if (typeof apiErrors[key] === 'string') {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join('\n') || "Validation failed", { id: toastId });
      } else {
        // Generic error for other status codes
        toast.error("Failed to save shop. Please try again.", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteShop = (id) => {
    toast.dismiss();
    const shop = shops.find((s) => s.id === id);
    const shopName = shop?.shopname || "this shop";

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete "{shopName}"?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading(`Deleting "${shopName}"...`);
                try {
                  await api.delete(`/shops/${id}/`);
                  toast.success(`"${shopName}" deleted successfully`, { id: dt });
                  loadShops();
                  setSelectedIds(prev => prev.filter(x => x !== id));
                } catch (error) {
                  console.error("Delete error:", error);
                  // Don't show toast for 401/403 - they're handled by interceptor
                  if (error.response?.status === 401 || error.response?.status === 403) {
                    toast.dismiss(dt);
                  } else {
                    toast.error("Failed to delete shop", { id: dt });
                  }
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
          <p className="text-sm font-semibold text-gray-800">Delete {selectedIds.length} selected shops?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading(`Deleting ${selectedIds.length} shops...`);
                
                try {
                  const results = await Promise.all(
                    selectedIds.map(async (id) => {
                      try {
                        const res = await api.delete(`/shops/${id}/`);
                        return { id, ok: true, status: res.status };
                      } catch (error) {
                        return { id, ok: false, status: error.response?.status || 0 };
                      }
                    })
                  );

                  const deleted = results.filter((r) => r.ok).map((r) => r.id);
                  const forbidden = results.filter((r) => r.status === 403).map((r) => r.id);
                  const unauthorized = results.filter((r) => r.status === 401).map((r) => r.id);

                  if (deleted.length > 0) {
                    setShops(prev => prev.filter((c) => !deleted.includes(c.id)));
                    setSelectedIds(prev => prev.filter((id) => !deleted.includes(id)));
                  }

                  if (deleted.length === selectedIds.length) {
                    toast.success(`${deleted.length} shop${deleted.length > 1 ? "s" : ""} deleted successfully`, { id: dt });
                  } else {
                    toast.dismiss(dt);
                    if (deleted.length > 0) toast.success(`${deleted.length} deleted successfully`);
                    // Don't show error toasts for 403/401 - they're already shown by interceptor
                    if (forbidden.length > 0 || unauthorized.length > 0) {
                      // Just show a summary without additional toasts
                      console.log(`Skipped ${forbidden.length + unauthorized.length} items due to permissions`);
                    }
                  }
                } catch (error) {
                  console.error("Bulk delete error:", error);
                  // Don't show error for 401/403 - they're handled by interceptor
                  if (error.response?.status !== 401 && error.response?.status !== 403) {
                    toast.error("Bulk delete failed", { id: dt });
                  } else {
                    toast.dismiss(dt);
                  }
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
      gst_pin: shop.gst_pin || "",
      address: shop.address,
      pincode: shop.pincode,
      area: shop.area || "",
      status: shop.status ? "Active" : "Inactive",
    });

    if (shop.pincode) {
      axios
        .get(`https://api.postalpincode.in/pincode/${shop.pincode}`)
        .then((res) => {
          if (res.data[0]?.Status === "Success") {
            const postOffices = res.data[0].PostOffice || [];
            const areas = postOffices.map((p) => p.Name);
            setAreaList(areas);
            setForm((prev) => ({
              ...prev,
              area: shop.area || areas[0],
            }));
          }
        })
        .catch(() => {
          setAreaList([]);
        });
    }

    setErrors({});
  };

  const startView = (shop) => {
    setViewShop(shop);
  };

  const renderInputField = (
    name,
    label,
    type = "text",
    maxLength,
    isOptional = false,
    rows = 3,
  ) => (
    <div>
      <label className="text-sm">
        {label} {isOptional ? "(optional)" : "*"}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          rows={rows}
          value={form[name]}
          onChange={handleChange}
          className={`w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 resize-none ${
            errors[name]
              ? "border-red-500 focus:ring-red-500"
              : "focus:border-blue-400 focus:ring-blue-400"
          }`}
        />
      ) : (
        <input
          type={type}
          name={name}
          maxLength={maxLength}
          value={form[name]}
          onChange={handleChange}
          className={`w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 ${
            errors[name]
              ? "border-red-500 focus:ring-red-500"
              : "focus:border-blue-400 focus:ring-blue-400"
          }`}
        />
      )}
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      {/* Debug Button - Remove in production */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={debugAuth}
          className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          Debug Auth
        </button>
      </div>

      {viewShop && (
        <ViewModal shop={viewShop} onClose={() => setViewShop(null)} />
      )}
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Manage Shops</h1>
        {!openForm && (
          <button
            onClick={() => {
              setOpenForm(true);
              setIsEdit(false);
              resetForm();
            }}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-md hover:bg-blue-700 transition-all w-full md:w-auto font-medium"
            disabled={isSubmitting}
          >
            + Add Shop
          </button>
        )}
      </div>

      {/* FILTER SECTION */}
      <div className="mb-6 bg-white p-5 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Filter By</label>
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
                <label className="text-sm font-medium text-gray-600">Status:</label>
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
                <label className="text-sm font-medium text-gray-600">Created By:</label>
                <select 
                  value={filterCreatedBy} 
                  onChange={(e) => setFilterCreatedBy(e.target.value)} 
                  className="border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                >
                  <option value="">All Creators</option>
                  {uniqueCreatedBy.map((creator) => (
                    <option key={creator} value={creator}>{creator}</option>
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

      {/* SEARCH AND RESULTS SECTION */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full sm:w-80">
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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading...
            </span>
          ) : (
            `${filteredShops.length} shop${filteredShops.length !== 1 ? "s" : ""} found`
          )}
        </div>
      </div>
      
      {/* BULK DELETE BAR */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-5 py-3">
          <span className="text-sm text-red-700 font-medium">
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

      {/* DESKTOP TABLE */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-700 text-base">Shop Records ({filteredShops.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-4 text-center w-12">
                  <input 
                    type="checkbox" 
                    checked={filteredShops.length > 0 && selectedIds.length === filteredShops.length} 
                    onChange={() => toggleSelectAll(filteredShops)} 
                    className="accent-blue-600 w-4 h-4" 
                  />
                </th>
                <th className="px-3 py-4 text-center font-semibold text-gray-600 w-16">ID</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-24">Type</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-40">Shop Name</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-32">Owner</th>
                <th className="px-4 py-4 text-left font-semibold text-gray-700 w-28">Phone</th>
                <th className="px-3 py-4 text-center font-semibold text-gray-700 w-20">Status</th>
                <th className="px-4 py-4 text-center font-semibold text-gray-700 w-48">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-semibold">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3">Loading shops...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Building size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-lg font-medium text-gray-600 mb-1">No shops found</p>
                    <p className="text-sm text-gray-400">
                      {search || filterType !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "Get started by adding a new shop"}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => (
                  <tr key={shop.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="px-3 py-4 text-center align-middle">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(shop.id)} 
                        onChange={() => toggleSelect(shop.id)} 
                        className="accent-blue-600 w-4 h-4" 
                      />
                    </td>
                    <td className="px-3 py-4 text-center font-mono text-xs text-gray-600 align-middle">#{shop.id}</td>
                    <td className="px-4 py-4 align-middle">
                      <span className={`px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                        shop.shop_type === 'franchise' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {shop.shop_type === 'franchise' ? 'Franchise' : 'Other Shop'}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-800 align-middle truncate max-w-[150px]" title={shop.shopname}>
                      {shop.shopname}
                    </td>
                    <td className="px-4 py-4 text-gray-600 align-middle truncate max-w-[120px]" title={shop.owner}>
                      {shop.owner}
                    </td>
                    <td className="px-4 py-4 text-gray-700 text-xs align-middle">{shop.phone}</td>
                    <td className="px-3 py-4 text-center align-middle">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium ${
                        shop.status 
                          ? "bg-green-50 text-green-700 border border-green-200" 
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}>
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
      
      {/* MOBILE CARD VIEW */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl shadow border p-8 text-center">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading shops...</span>
            </div>
          </div>
        ) : filteredShops.length > 0 ? (
          filteredShops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-xl shadow border p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">ID: {shop.id}</span>
                  <p className="font-semibold text-gray-800 text-lg mt-1">{shop.shopname}</p>
                  <p className="text-sm text-gray-600 mt-1">{shop.owner}</p>
                  <p className="text-sm text-gray-500 mt-1">{shop.phone}</p>
                  {shop.gst_pin && (
                    <p className="text-xs text-gray-500 mt-1">GST: {shop.gst_pin}</p>
                  )}
                </div>
                <span className={`px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                  shop.status 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                }`}>
                  {shop.status ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-500">Type:</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  shop.shop_type === 'franchise' 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {shop.shop_type === 'franchise' ? 'Franchise' : 'Other Shop'}
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
            <p className="text-lg font-medium text-gray-600 mb-1">No shops found</p>
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

      {/* FORM MODAL */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-[700px] rounded-xl shadow-2xl border border-gray-200 max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-blue-700">
                {isEdit ? "Edit Shop" : "Add New Shop"}
              </h2>
              <button 
                onClick={() => setOpenForm(false)} 
                className="text-gray-500 hover:text-red-600 text-xl"
                disabled={isSubmitting}
              >
                ✖
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(95vh - 120px)" }}>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* LEFT COLUMN */}
                <div className="space-y-2">
                  <div>
                    <label className="text-sm">Shop Type *</label>
                    <select
                      name="shoptype"
                      value={form.shoptype}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${
                        errors.shoptype ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-1 focus:ring-blue-200`}
                      disabled={isSubmitting}
                    >
                      <option value="franchise">Franchise</option>
                      <option value="othershop">Other Shop</option>
                    </select>
                    {errors.shoptype && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.shoptype}</p>
                    )}
                  </div>

                  {renderInputField("name", "Shop Name")}

                  <div>
                    <label className="text-sm">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      maxLength={6}
                      value={form.pincode}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${
                        pincodeError || errors.pincode ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-1 focus:ring-blue-200`}
                      placeholder="Enter 6-digit pincode"
                      disabled={isSubmitting}
                    />
                    {isPincodeLoading && (
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                        Fetching location...
                      </p>
                    )}
                    {(pincodeError || errors.pincode) && (
                      <p className="text-red-500 text-xs mt-0.5">
                        {pincodeError || errors.pincode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm">Area *</label>
                    {areaList.length > 0 ? (
                      <select
                        name="area"
                        value={form.area}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm border rounded-lg ${
                          errors.area ? "border-red-500" : "border-gray-300"
                        } focus:outline-none focus:ring-1 focus:ring-blue-200`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Area</option>
                        {areaList.map((a, i) => (
                          <option key={i} value={a}>{a}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        value={form.area}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50"
                        placeholder="Enter pincode first"
                      />
                    )}
                    {errors.area && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.area}</p>
                    )}
                  </div>

                  {/* GST PIN Field */}
                  <div>
                    <label className="text-sm">GST PIN *</label>
                    <input
                      type="text"
                      name="gst_pin"
                      maxLength={15}
                      value={form.gst_pin}
                      onChange={handleChange}
                      placeholder="Enter 15 alphanumeric characters"
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${
                        errors.gst_pin ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-1 focus:ring-blue-200`}
                      disabled={isSubmitting}
                    />
                    {errors.gst_pin && (
                      <p className="text-red-500 text-xs mt-0.5">{errors.gst_pin}</p>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-2">
                  {renderInputField("phone", "Phone", "text", 10)}
                  {renderInputField("email", "Email", "email")}
                  <PasswordInput
                    name="password"
                    label="Password"
                    value={form.password}
                    onChange={handleChange}
                    error={errors.password}
                    isEdit={isEdit}
                  />
                  {renderInputField("owner", "Owner")}
                  <div>
                    <label className="text-sm">Status *</label>
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-200"
                      disabled={isSubmitting}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                  {renderInputField("address", "Address", "textarea", undefined, false, 3)}
                </div>

                <div className="col-span-1 md:col-span-2 pt-2">
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
                        {isEdit ? "Updating..." : "Submitting..."}
                      </>
                    ) : (
                      isEdit ? "Update Shop" : "Save Shop"
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