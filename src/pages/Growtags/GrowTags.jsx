// src/pages/Growtags/GrowTags.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  EyeOff, 
  Search, 
  X, 
  Filter, 
  UserCircle, 
  Tag, 
  CheckCircle, 
  XCircle,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  Home,
  Calendar
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/API/axiosInstance";

// ----------------------------------------------------
// Filter Panel Component - Same as Complaints Page
// ----------------------------------------------------
const FilterPanel = ({ isOpen, onClose, filters, onFilterChange, creators, onClearFilters }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-teal-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Filter Grow Tags</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
          <X size={16} className="text-gray-500" />
        </button>
      </div>

      {/* Filter Options */}
      <div className="p-4 space-y-4">
        {/* Created By Filter */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 uppercase tracking-wider">
            <UserCircle size={14} className="text-teal-600" />
            Created By
          </label>
          <select
            value={filters.createdBy}
            onChange={(e) => onFilterChange('createdBy', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="">All Creators</option>
            {creators.map((creator) => (
              <option key={creator.value} value={creator.value}>
                {creator.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-600 uppercase tracking-wider">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-between">
        <button
          onClick={onClearFilters}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition"
        >
          Clear All
        </button>
        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Active Filters Display Component
// ----------------------------------------------------
const ActiveFilters = ({ filters, creators, onRemoveFilter, onClearAll }) => {
  const getFilterLabel = (key, value) => {
    if (value === '' || value === 'all') return null;
    
    switch (key) {
      case 'createdBy':
        const creator = creators.find(c => c.value === value);
        return creator ? `Created by: ${creator.label}` : null;
      case 'status':
        return `Status: ${value}`;
      default:
        return null;
    }
  };

  const activeFilters = Object.entries(filters).filter(([key, value]) => 
    value && value !== '' && value !== 'all'
  );

  if (activeFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs text-gray-500">Active filters:</span>
      {activeFilters.map(([key, value]) => {
        const label = getFilterLabel(key, value);
        if (!label) return null;
        
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs border border-teal-200"
          >
            {label}
            <button onClick={() => onRemoveFilter(key)} className="hover:text-teal-900 transition">
              <X size={12} />
            </button>
          </span>
        );
      })}
      {activeFilters.length > 1 && (
        <button onClick={onClearAll} className="text-xs text-gray-500 hover:text-gray-700 underline">
          Clear all
        </button>
      )}
    </div>
  );
};

// ----------------------------------------------------
// GrowTag Details View Modal with Standard Design
// ----------------------------------------------------
const GrowTagViewModal = ({ growTag, onClose, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [growTagDetails, setGrowTagDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (growTag?.id) {
      fetchGrowTagDetails(growTag.id);
    }
  }, [growTag?.id]);

  const fetchGrowTagDetails = async (growTagId) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/growtags-popup/${growTagId}/`);
      setGrowTagDetails(response.data);
    } catch (error) {
      console.error("Error fetching grow tag details:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view details");
      } else {
        toast.error("Failed to load grow tag details");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!growTag) return null;

  const displayData = growTagDetails || growTag;

  const getStatusClasses = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-500/10 text-amber-600 border border-amber-500/30";
      case "Assigned":
        return "bg-blue-500/10 text-blue-600 border border-blue-500/30";
      case "In Progress":
        return "bg-purple-500/10 text-purple-600 border border-purple-500/30";
      case "Resolved":
        return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30";
      default:
        return "bg-gray-500/10 text-gray-600 border border-gray-500/30";
    }
  };

  // Info Card Component for consistent styling
  const InfoCard = ({ icon: Icon, label, value, colSpan = 1 }) => (
    <div className={`bg-gray-50 rounded-lg p-4 border border-gray-100 hover:shadow-sm transition-shadow ${colSpan > 1 ? `col-span-${colSpan}` : ''}`}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          <Icon size={18} className="text-teal-600" />
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="text-sm font-semibold text-gray-800 mt-1 break-words">{value || '-'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg">
                {displayData.image ? (
                  <img 
                    src={displayData.image} 
                    alt={displayData.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <UserCircle size={32} className="text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  {displayData.name}
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    displayData.status === "Active" 
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                      : "bg-gray-100 text-gray-700 border border-gray-200"
                  }`}>
                    {displayData.status}
                  </span>
                </h2>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                  <Tag size={14} className="text-teal-500" />
                  Grow ID: {displayData.grow_id || '-'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'info'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Personal Information
            </button>
            <button
              onClick={() => setActiveTab('complaints')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'complaints'
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Assigned Complaints ({displayData.assigned_complaints_count || 0})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading details...</span>
            </div>
          ) : (
            <>
              {/* Personal Information Tab */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                      Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoCard icon={Phone} label="Phone Number" value={displayData.phone} />
                      <InfoCard icon={Mail} label="Email Address" value={displayData.email} />
                      <InfoCard icon={CreditCard} label="Aadhar Number" value={displayData.adhar} />
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                      Address Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoCard icon={Home} label="Full Address" value={displayData.address} colSpan={2} />
                      <InfoCard icon={MapPin} label="Area" value={displayData.area} />
                      <InfoCard icon={MapPin} label="State" value={displayData.state} />
                      <InfoCard icon={MapPin} label="Pincode" value={displayData.pincode} />
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <div className="w-1 h-6 bg-teal-500 rounded-full"></div>
                      Additional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InfoCard icon={Tag} label="Assigned Shop" value={displayData.assigned_shop || 'Not Assigned'} />
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <Calendar size={18} className="text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created On</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {displayData.created_on ? new Date(displayData.created_on).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              }) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <UserCircle size={18} className="text-teal-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                              {displayData.created_by?.username || displayData.created_by?.email || displayData.created_by || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Complaints Tab */}
              {activeTab === 'complaints' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      <FileText size={20} className="text-teal-600" />
                      Assigned Complaints ({displayData.assigned_complaints_count || 0})
                    </h3>
                  </div>

                  {displayData.assigned_complaints && displayData.assigned_complaints.length > 0 ? (
                    <div className="space-y-3">
                      {displayData.assigned_complaints.map((complaint) => (
                        <div key={complaint.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                                {complaint.complaint_id || `#${complaint.id}`}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusClasses(complaint.status)}`}>
                                {complaint.status || 'Unknown'}
                              </span>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
                                complaint.confirm_status === "CONFIRMED" 
                                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200" 
                                  : "bg-gray-100 text-gray-700 border border-gray-200"
                              }`}>
                                {complaint.confirm_status === "CONFIRMED" ? (
                                  <><CheckCircle size={12} /> Confirmed</>
                                ) : (
                                  <><XCircle size={12} /> Not Confirmed</>
                                )}
                              </span>
                            </div>
                          </div>
                          
                          <h4 className="font-medium text-gray-800 mb-3">{complaint.title || 'No title'}</h4>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <p className="text-xs text-gray-500">Area</p>
                              <p className="font-medium text-gray-700">{complaint.area || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Pincode</p>
                              <p className="font-medium text-gray-700">{complaint.pincode || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Assigned To</p>
                              <p className="font-medium text-gray-700">{complaint.assign_to || '-'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Created On</p>
                              <p className="font-medium text-gray-700">{complaint.created_on || '-'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                      <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">No assigned complaints</p>
                      <p className="text-sm text-gray-400 mt-1">This grow tag has no complaints assigned yet.</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-white transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(growTag);
            }}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg shadow-teal-600/20"
          >
            <Edit size={18} />
            Edit Grow Tag
          </button>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------
// Main GrowTags Component
// ----------------------------------------------------
export default function GrowTags() {
  const navigate = useNavigate();
  
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewData, setViewData] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [originalGrowTagInfo, setOriginalGrowTagInfo] = useState({ name: "", grow_id: "" });
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [errors, setErrors] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filter states - exactly like complaints page
  const [filterType, setFilterType] = useState("all");
  const [filterId, setFilterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");

  const [form, setForm] = useState({
    grow_id: "",
    name: "",
    phone: "",
    email: "",
    address: "",
    pincode: "",
    area: "",
    state: "",
    adhar: "",
    password: "",
    image: null,
    status: "Active",
  });

  const [preview, setPreview] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to generate next GT ID
  const generateNextGrowId = (existingGrowTags) => {
    if (!existingGrowTags || existingGrowTags.length === 0) return "GT01";

    const gtNumbers = existingGrowTags
      .map(tag => {
        const match = tag.grow_id?.match(/^GT(\d+)$/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    if (gtNumbers.length === 0) return "GT01";

    const maxNumber = Math.max(...gtNumbers);
    return `GT${(maxNumber + 1).toString().padStart(2, '0')}`;
  };

  // Auto-fill grow_id when modal opens
  useEffect(() => {
    if (showFormModal && !isEdit) {
      const nextGrowId = generateNextGrowId(users);
      setForm(prev => ({ ...prev, grow_id: nextGrowId }));
    }
  }, [showFormModal, isEdit, users]);

  // Get unique creators for filter dropdown
  const creators = useMemo(() => {
    const creatorMap = new Map();
    users.forEach(user => {
      if (user.created_by) {
        const creatorValue = user.created_by.username || user.created_by.email || user.created_by;
        const creatorLabel = user.created_by.username || user.created_by.email || user.created_by;
        if (creatorValue && !creatorMap.has(creatorValue)) {
          creatorMap.set(creatorValue, { value: creatorValue, label: creatorLabel });
        }
      }
    });
    return Array.from(creatorMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [users]);

  const extractErrorMessage = (err) => {
    const data = err?.response?.data;
    if (!data) return err?.message || "Something went wrong";
    if (typeof data === "string") return data;
    if (Array.isArray(data)) return data[0];
    if (typeof data === "object") {
      const firstKey = Object.keys(data)[0];
      if (!firstKey) return "Validation failed";
      const firstVal = data[firstKey];
      if (Array.isArray(firstVal)) return firstVal[0];
      if (typeof firstVal === "string") return firstVal;
    }
    return "Request failed";
  };

  const loadGrowtags = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/growtags/');

      if (response.data) {
        if (Array.isArray(response.data)) {
          setUsers(response.data);
        } else if (typeof response.data === "object") {
          setUsers([response.data]);
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error("Failed to load grow tags", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else if (err.response?.status === 403) {
        toast.error("You are not authorized");
      } else {
        toast.error("Failed to load grow tags");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
      return;
    }
    loadGrowtags();
  }, [navigate, loadGrowtags]);

  // Filter handlers
  const handleFilterChange = (key, value) => {
    if (key === 'createdBy') setFilterCreatedBy(value);
    if (key === 'status') setFilterStatus(value);
  };

  const handleRemoveFilter = (key) => {
    if (key === 'createdBy') setFilterCreatedBy('');
    if (key === 'status') setFilterStatus('');
  };

  const handleClearAllFilters = () => {
    setFilterType("all");
    setFilterId("");
    setFilterStatus("");
    setFilterCreatedBy("");
    setSearchQuery("");
    setShowFilterPanel(false);
  };

  // Filtered users - exactly like complaints page
  const filteredUsers = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    return users.filter((user) => {
      // Search filter
      const searchableText = [
        user.grow_id,
        user.name,
        user.phone,
        user.email
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchableText.includes(lowerCaseQuery);

      // Filter by type
      let matchesFilter = true;
      if (filterType === "id" && filterId) {
        matchesFilter = String(user.id) === filterId;
      } else if (filterType === "status" && filterStatus) {
        matchesFilter = user.status === filterStatus;
      } else if (filterType === "created_by" && filterCreatedBy) {
        const creator = user.created_by?.username || user.created_by?.email || user.created_by;
        matchesFilter = creator === filterCreatedBy;
      }

      return matchesSearch && matchesFilter;
    });
  }, [users, searchQuery, filterType, filterId, filterStatus, filterCreatedBy]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" && !/^[A-Za-z\s]*$/.test(value)) return;

    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));

    if (name === "pincode" && value.length === 6) fetchAreas(value);
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0] || null;
    setForm(prev => ({ ...prev, image: file }));
    if (file) setPreview(URL.createObjectURL(file));
  };

  const fetchAreas = async (pincode) => {
    try {
      setLoadingAreas(true);
      const res = await axiosInstance.get(`https://api.postalpincode.in/pincode/${pincode}`);
      const postOffice = res.data?.[0];
      const list = postOffice?.PostOffice || [];

      setAreas(list);
      if (list.length > 0) {
        setForm(prev => ({ ...prev, state: list[0].State || "" }));
      }
    } catch {
      toast.error("Failed to fetch areas");
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleAreaSelect = (e) => {
    const areaName = e.target.value;
    setForm(prev => ({ ...prev, area: areaName }));
    if (errors.area) setErrors(prev => ({ ...prev, area: "" }));
  };

  const closeFormModal = () => {
    resetForm();
    setShowFormModal(false);
  };

  const resetForm = () => {
    setForm({
      grow_id: "",
      name: "",
      phone: "",
      email: "",
      address: "",
      pincode: "",
      area: "",
      state: "",
      adhar: "",
      password: "",
      image: null,
      status: "Active",
    });
    setPreview(null);
    setIsEdit(false);
    setEditId(null);
    setAreas([]);
    setErrors({});
    setOriginalGrowTagInfo({ name: "", grow_id: "" });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!form.grow_id.trim()) newErrors.grow_id = "Grow ID is required";
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(form.name)) {
      newErrors.name = "Name must contain only letters";
    }
    
    if (!isEdit && !form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (isEdit && form.password.trim() && form.password.trim().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^[0-9]{10}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      newErrors.email = "Enter valid email";
    }

    if (!form.pincode.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(form.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }

    if (!form.area.trim()) newErrors.area = "Area is required";
    if (!form.adhar.trim()) {
      newErrors.adhar = "Aadhar is required";
    } else if (!/^[0-9]{12}$/.test(form.adhar)) {
      newErrors.adhar = "Aadhar must be 12 digits";
    }
    if (!form.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    const toastId = toast.loading(isEdit ? "Updating grow tag..." : "Creating grow tag...");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (key === "image") {
          if (form.image instanceof File) formData.append("image", form.image);
        } else if (key === "password") {
          if (!isEdit || (isEdit && form.password.trim() !== "")) {
            formData.append(key, form[key]);
          }
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (isEdit && editId) {
        await axiosInstance.put(`/api/growtags/${editId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`Grow Tag updated successfully!`, { id: toastId });
      } else {
        await axiosInstance.post('/api/growtags/', formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success(`Grow Tag created successfully!`, { id: toastId });
      }

      resetForm();
      setShowFormModal(false);
      await loadGrowtags();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.", { id: toastId });
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to perform this action", { id: toastId });
      } else {
        const msg = extractErrorMessage(err);
        toast.error(msg || "Failed to save grow tag", { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setShowFormModal(true);
    setOriginalGrowTagInfo({ name: user.name || "", grow_id: user.grow_id || "" });
    setForm({
      grow_id: user.grow_id || "",
      name: user.name || "",
      phone: user.phone || "",
      email: user.email || "",
      address: user.address || "",
      pincode: user.pincode || "",
      area: user.area || "",
      state: user.state || "",
      adhar: user.adhar || "",
      password: "",
      image: null,
      status: user.status || "Active",
    });
    if (user.image) setPreview(user.image);
    if (user.pincode) fetchAreas(user.pincode);
    setEditId(user.id);
    setIsEdit(true);
  };

  const handleView = (user) => {
    setViewData(user);
    setShowViewModal(true);
  };

  // Delete handler - exactly like complaints page
  const handleDelete = (id) => {
    toast.dismiss();
    const userToDelete = users.find((u) => u.id === id);
    if (!userToDelete) {
      toast.error("Grow Tag not found.");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete grow tag?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-gray-200 rounded-md text-sm">Cancel</button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading(`Deleting grow tag...`);
                try {
                  await axiosInstance.delete(`/api/growtags/${id}/`);
                  toast.success(`Grow Tag deleted successfully`, { id: dt });
                  await loadGrowtags();
                  setSelectedIds(prev => prev.filter(x => x !== id));
                } catch (err) {
                  if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.", { id: dt });
                  } else if (err.response?.status === 403) {
                    toast.error("You don't have permission to delete", { id: dt });
                  } else {
                    toast.error("Failed to delete grow tag", { id: dt });
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

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredUsers.length ? [] : filteredUsers.map(u => u.id));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one grow tag");
      return;
    }

    toast.dismiss();
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete {selectedIds.length} selected grow tags?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-gray-200 rounded-md text-sm">Cancel</button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading(`Deleting ${selectedIds.length} grow tags...`);
                
                try {
                  const results = await Promise.all(
                    selectedIds.map(async (id) => {
                      try {
                        await axiosInstance.delete(`/api/growtags/${id}/`);
                        return { id, ok: true };
                      } catch (error) {
                        return { id, ok: false, status: error.response?.status };
                      }
                    })
                  );

                  const deleted = results.filter(r => r.ok).map(r => r.id);
                  const forbidden = results.filter(r => r.status === 403).map(r => r.id);
                  const unauthorized = results.filter(r => r.status === 401).map(r => r.id);

                  if (deleted.length > 0) {
                    setUsers(prev => prev.filter(u => !deleted.includes(u.id)));
                    setSelectedIds(prev => prev.filter(id => !deleted.includes(id)));
                  }

                  if (deleted.length === selectedIds.length) {
                    toast.success(`${deleted.length} grow tag${deleted.length > 1 ? "s" : ""} deleted`, { id: dt });
                  } else {
                    toast.dismiss(dt);
                    if (deleted.length > 0) toast.success(`${deleted.length} deleted successfully`);
                    if (forbidden.length > 0) toast.error(`${forbidden.length} could not be deleted (no permission)`);
                    if (unauthorized.length > 0) toast.error(`Session expired. Please login again.`);
                  }
                } catch {
                  toast.error("Bulk delete failed", { id: dt });
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

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewData(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* View Modal */}
      {showViewModal && viewData && (
        <GrowTagViewModal 
          growTag={viewData} 
          onClose={closeViewModal} 
          onEdit={handleEdit} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Grow Tags</h1>
        
        {/* Search Input */}
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search by Grow ID, Name, Phone..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
          {filteredUsers.length} grow tag{filteredUsers.length !== 1 ? "s" : ""} found
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/assign-growtags")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 whitespace-nowrap"
          >
            Assign Grow Tags
          </button>
          <button
            onClick={() => { resetForm(); setShowFormModal(true); }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 whitespace-nowrap"
          >
            + Add Grow Tag
          </button>
        </div>
      </div>

      {/* FILTER SECTION - Exactly like complaints page */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm">Filter By</label>
              <select
                value={filterType}
                onChange={(e) => { 
                  setFilterType(e.target.value); 
                  setFilterId(""); 
                  setFilterStatus(""); 
                  setFilterCreatedBy(""); 
                }}
                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="all">All Grow Tags</option>
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
                  className="border px-3 py-2 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-200" 
                />
                {filterId && (
                  <button onClick={() => setFilterId("")} className="text-red-500 hover:text-red-700">Clear</button>
                )}
              </div>
            )}

            {filterType === "status" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                {filterStatus && (
                  <button onClick={() => setFilterStatus("")} className="text-red-500 hover:text-red-700">Clear</button>
                )}
              </div>
            )}

            {filterType === "created_by" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Created By:</label>
                <select 
                  value={filterCreatedBy} 
                  onChange={(e) => setFilterCreatedBy(e.target.value)} 
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">All Creators</option>
                  {creators.map((creator) => (
                    <option key={creator.value} value={creator.value}>{creator.label}</option>
                  ))}
                </select>
                {filterCreatedBy && (
                  <button onClick={() => setFilterCreatedBy("")} className="text-red-500 hover:text-red-700">Clear</button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {(filterStatus || filterCreatedBy) && (
        <ActiveFilters
          filters={{ createdBy: filterCreatedBy, status: filterStatus }}
          creators={creators}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
        />
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading grow tags...</p>
        </div>
      )}

      {/* BULK DELETE BAR */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-5 py-3">
          <span className="text-sm text-red-700 font-medium">
            {selectedIds.length} grow tag(s) selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700"
          >
            <Trash2 size={16} />
            Delete Selected
          </button>
        </div>
      )}

      {/* TABLE - Desktop */}
      {!loading && (
        <div className="hidden md:block bg-white shadow-lg rounded-2xl border border-gray-200 overflow-x-auto">
          <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-700">Grow Tags List ({filteredUsers.length} Found)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-4 text-center w-12">
                    <input 
                      type="checkbox" 
                      checked={filteredUsers.length > 0 && selectedIds.length === filteredUsers.length} 
                      onChange={toggleSelectAll} 
                      className="accent-blue-600 w-4 h-4" 
                    />
                  </th>
                  <th className="px-3 py-4 text-center font-semibold text-gray-600 w-20">Photo</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700">Grow ID</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700">Name</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700">Phone</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700">Email</th>
                  <th className="px-4 py-4 text-left font-semibold text-gray-700">Created By</th>
                  <th className="px-3 py-4 text-center font-semibold text-gray-700 w-20">Status</th>
                  <th className="px-4 py-4 text-center font-semibold text-gray-700 w-56">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="px-3 py-4 text-center align-middle">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(u.id)} 
                        onChange={() => toggleSelect(u.id)} 
                        className="accent-blue-600 w-4 h-4" 
                      />
                    </td>
                    <td className="px-3 py-4 text-center align-middle">
                      {u.image ? (
                        <img src={u.image} alt="avatar" className="w-8 h-8 rounded-full mx-auto" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 mx-auto flex items-center justify-center text-xs">—</div>
                      )}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-800 align-middle">{u.grow_id}</td>
                    <td className="px-4 py-4 text-gray-600 align-middle">{u.name}</td>
                    <td className="px-4 py-4 text-gray-700 text-xs align-middle">{u.phone}</td>
                    <td className="px-4 py-4 text-gray-600 text-xs align-middle truncate max-w-[150px]" title={u.email}>{u.email || "-"}</td>
                    <td className="px-4 py-4 align-middle">
                      {u.created_by ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                          <UserCircle size={12} />
                          {u.created_by.username || u.created_by.email || u.created_by}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-4 text-center align-middle">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(u)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(u)}
                          className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                          title="Edit Grow Tag"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(u.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Grow Tag"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-500">
                      <Tag size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-lg font-medium text-gray-600 mb-1">No grow tags found</p>
                      <p className="text-sm text-gray-400">
                        {searchQuery || filterType !== "all"
                          ? "Try adjusting your search or filter criteria"
                          : "Get started by adding a new grow tag"}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MOBILE CARD VIEW */}
      {!loading && (
        <div className="md:hidden space-y-4">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <div key={u.id} className="bg-white rounded-xl border shadow p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {u.image ? (
                      <img src={u.image} className="w-12 h-12 rounded-full" alt="avatar" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">—</div>
                    )}
                    <div>
                      <p className="font-bold">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.grow_id}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    u.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    {u.status}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>📞 {u.phone}</p>
                  <p>✉️ {u.email || "-"}</p>
                  {u.created_by && (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <UserCircle size={12} />
                      Created by: {u.created_by.username || u.created_by.email || u.created_by}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3">
                  <button
                    onClick={() => handleView(u)}
                    className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye size={20} />
                    <span className="text-xs mt-1 font-medium">View</span>
                  </button>
                  <button
                    onClick={() => handleEdit(u)}
                    className="flex flex-col items-center justify-center p-3 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <Edit size={20} />
                    <span className="text-xs mt-1 font-medium">Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
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
              <Tag size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-600 mb-1">No grow tags found</p>
              <p className="text-sm text-gray-400 mb-4">
                {searchQuery || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by adding a new grow tag"}
              </p>
              {!searchQuery && filterType === "all" && (
                <button
                  onClick={() => { resetForm(); setShowFormModal(true); }}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  + Add Your First Grow Tag
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* FORM MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl w-full max-w-3xl rounded-2xl flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit ? "Edit Grow Tag" : "Add Grow Tag"}
              </h2>
              <button onClick={closeFormModal} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 overflow-hidden flex items-center justify-center">
                      {preview ? (
                        <img src={preview} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <label className="cursor-pointer bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-semibold px-5 py-2 mt-3 rounded-full">
                    Choose Photo
                    <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  </label>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Grow ID */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Grow ID <span className="text-red-500">*</span>
                      {!isEdit && <span className="text-xs text-gray-500 ml-2">(Auto-generated, editable)</span>}
                    </label>
                    <input
                      type="text"
                      name="grow_id"
                      value={form.grow_id}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg ${errors.grow_id ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Enter Grow ID"
                    />
                    {errors.grow_id && <span className="text-red-500 text-xs">{errors.grow_id}</span>}
                  </div>

                  {/* Name */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg ${errors.name ? "border-red-500" : "border-gray-300"}`}
                      placeholder="Enter full name"
                    />
                    {errors.name && <span className="text-red-500 text-xs">{errors.name}</span>}
                  </div>

                  {/* Password */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Password {!isEdit && <span className="text-red-500">*</span>}
                      {isEdit && <span className="text-gray-400 text-xs ml-1">(Leave empty to keep current)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className={`px-4 py-2.5 pr-12 border rounded-lg w-full ${errors.password ? "border-red-500" : "border-gray-300"}`}
                        placeholder={isEdit ? "Leave empty to keep current" : "Enter password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </button>
                    </div>
                    {errors.password && <span className="text-red-500 text-xs">{errors.password}</span>}
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Phone <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg ${errors.phone ? "border-red-500" : "border-gray-300"}`}
                      placeholder="10-digit mobile number"
                    />
                    {errors.phone && <span className="text-red-500 text-xs">{errors.phone}</span>}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg ${errors.email ? "border-red-500" : "border-gray-300"}`}
                      placeholder="user@example.com"
                    />
                    {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
                  </div>

                  {/* Pincode */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Pincode <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg ${errors.pincode ? "border-red-500" : "border-gray-300"}`}
                      placeholder="6-digit postal code"
                    />
                    {errors.pincode && <span className="text-red-500 text-xs">{errors.pincode}</span>}
                  </div>

                  {/* Area */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Area <span className="text-red-500">*</span></label>
                    <select
                      name="area"
                      value={form.area}
                      onChange={handleAreaSelect}
                      className={`px-4 py-2.5 border rounded-lg ${errors.area ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">Select Area</option>
                      {loadingAreas && <option>Loading areas...</option>}
                      {areas.map((a, index) => (
                        <option key={index} value={a.Name}>{a.Name}</option>
                      ))}
                    </select>
                    {errors.area && <span className="text-red-500 text-xs">{errors.area}</span>}
                  </div>

                  {/* State */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">State</label>
                    <input
                      type="text"
                      name="state"
                      value={form.state}
                      readOnly
                      className="px-4 py-2.5 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                      placeholder="Auto-filled from pincode"
                    />
                  </div>

                  {/* Aadhar */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Aadhar <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="adhar"
                      value={form.adhar}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg ${errors.adhar ? "border-red-500" : "border-gray-300"}`}
                      placeholder="12-digit Aadhar number"
                    />
                    {errors.adhar && <span className="text-red-500 text-xs">{errors.adhar}</span>}
                  </div>
                </div>

                {/* Address */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Address <span className="text-red-500">*</span></label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`px-4 py-2.5 border rounded-lg resize-none ${errors.address ? "border-red-500" : "border-gray-300"}`}
                    rows="3"
                    placeholder="House no, Street, Locality"
                  />
                  {errors.address && <span className="text-red-500 text-xs">{errors.address}</span>}
                </div>

                {/* Status */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                {/* Info Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-800 font-medium">
                    * Required fields must be filled
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Complete all mandatory fields to {isEdit ? "update" : "create"} the Grow Tag
                  </p>
                </div>
              </form>
            </div>

            {/* Fixed Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <button 
                  type="button" 
                  onClick={closeFormModal} 
                  className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEdit ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    isEdit ? "Update Grow Tag" : "Create Grow Tag"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}