// src/pages/Leads/Leads.jsx
import React, { useState, useMemo, useEffect } from "react";
import {
  Eye,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  Phone,
  Mail,
  User,
  Smartphone,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  Tag,
  Package
} from "lucide-react";
import ComplaintRegistrationModal from "./ComplaintRegistrationModal";
import toast from "react-hot-toast";
import { getAuthHeaders } from "@/utils/authHeaders";

// ================= API CONFIG =================
const API_BASE = "http://127.0.0.1:8000/api/leads/";

// ================= CONSTANTS =================
const getFormattedDate = (timestamp) =>
  new Date(timestamp).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const VALIDATION_PATTERNS = {
  name: /^[a-zA-Z\s]{2,50}$/,
  phone: /^\d{10}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  pincode: /^\d{6}$/,
  phoneModel: /^.{2,100}$/,
  issueDetail: /^.{5,200}$/,
  address: /^.{10,200}$/,
  area: /^.{3,50}$/,
};

const VALIDATION_MESSAGES = {
  name: "Name must be 2-50 characters (letters and spaces only)",
  phone: "Phone number must be exactly 10 digits",
  email: "Please enter a valid email address (example@domain.com)",
  pincode: "Pincode must be exactly 6 digits",
  phoneModel: "Phone model must be 2-100 characters",
  issueDetail: "Issue detail must be 5-200 characters",
  address: "Address must be 10-200 characters",
  area: "Area must be 3-50 characters",
};

const STATUS_OPTIONS = ["All", "New", "Complaint Registered"];

// ================= MAIN COMPONENT =================
const Leads = () => {
  // ---------- State Management ----------
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // UI States
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  
  // Modal States
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  
  // Lead Modal States
  const [leadModalMode, setLeadModalMode] = useState("create"); // 'create', 'edit', 'view'
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [selectedLeadForComplaint, setSelectedLeadForComplaint] = useState(null);
  
  // Form States
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    phone: "",
    email: "",
    phoneModel: "",
    address: "",
    state: "",
    pincode: "",
    area: "",
    issueDetail: "",
  });
  
  const [newLeadErrors, setNewLeadErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  
  // Location States
  const [areaOptions, setAreaOptions] = useState([]);
  const [loadingArea, setLoadingArea] = useState(false);

  // Debug function to check auth state
  const debugAuth = () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type");
    
    console.log("=== Leads Auth Debug ===");
    console.log("Token exists:", !!token);
    console.log("Token type:", tokenType || "not set (defaulting to Bearer)");
    console.log("Token preview:", token ? `${token.substring(0, 20)}...` : "none");
    console.log("========================");
  };

  // ---------- Effects ----------
  useEffect(() => {
    debugAuth();
    fetchLeads();
  }, []);

  // ---------- Validation Functions ----------
  const validateField = (field, value) => {
    if (!value?.trim()) {
      setNewLeadErrors((prev) => ({ ...prev, [field]: "This field is required" }));
      return false;
    }

    let isValid = true;
    let errorMessage = "";

    switch (field) {
      case "name":
        if (!VALIDATION_PATTERNS.name.test(value)) {
          errorMessage = VALIDATION_MESSAGES.name;
          isValid = false;
        }
        break;
      case "phone":
        if (!/^\d+$/.test(value)) {
          errorMessage = "Phone number must contain only digits";
          isValid = false;
        } else if (!VALIDATION_PATTERNS.phone.test(value)) {
          errorMessage = VALIDATION_MESSAGES.phone;
          isValid = false;
        }
        break;
      case "email":
        if (!value.includes("@")) {
          errorMessage = "Email must contain @ symbol";
          isValid = false;
        } else if (!value.includes(".", value.indexOf("@"))) {
          errorMessage = "Email must have a domain (example@domain.com)";
          isValid = false;
        } else if (!VALIDATION_PATTERNS.email.test(value)) {
          errorMessage = VALIDATION_MESSAGES.email;
          isValid = false;
        }
        break;
      case "pincode":
        if (!/^\d+$/.test(value)) {
          errorMessage = "Pincode must contain only digits";
          isValid = false;
        } else if (!VALIDATION_PATTERNS.pincode.test(value)) {
          errorMessage = VALIDATION_MESSAGES.pincode;
          isValid = false;
        }
        break;
      case "phoneModel":
        if (!VALIDATION_PATTERNS.phoneModel.test(value)) {
          errorMessage = VALIDATION_MESSAGES.phoneModel;
          isValid = false;
        }
        break;
      case "issueDetail":
        if (!VALIDATION_PATTERNS.issueDetail.test(value)) {
          errorMessage = VALIDATION_MESSAGES.issueDetail;
          isValid = false;
        }
        break;
      case "address":
        if (!VALIDATION_PATTERNS.address.test(value)) {
          errorMessage = VALIDATION_MESSAGES.address;
          isValid = false;
        }
        break;
      case "area":
        if (!VALIDATION_PATTERNS.area.test(value)) {
          errorMessage = VALIDATION_MESSAGES.area;
          isValid = false;
        }
        break;
      default:
        break;
    }

    if (!isValid) {
      setNewLeadErrors((prev) => ({ ...prev, [field]: errorMessage }));
    } else if (newLeadErrors[field]) {
      setNewLeadErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    return isValid;
  };

  const validateAllFields = () => {
    const errors = {};
    let isValid = true;

    const requiredFields = [
      "name", "phone", "email", "phoneModel", 
      "issueDetail", "address", "pincode", "area"
    ];

    requiredFields.forEach((field) => {
      const value = newLeadData[field];

      if (!value?.trim()) {
        errors[field] = "This field is required";
        isValid = false;
        return;
      }

      switch (field) {
        case "name":
          if (!VALIDATION_PATTERNS.name.test(value)) {
            errors[field] = VALIDATION_MESSAGES.name;
            isValid = false;
          }
          break;
        case "phone":
          if (!/^\d+$/.test(value)) {
            errors[field] = "Phone number must contain only digits";
            isValid = false;
          } else if (!VALIDATION_PATTERNS.phone.test(value)) {
            errors[field] = VALIDATION_MESSAGES.phone;
            isValid = false;
          }
          break;
        case "email":
          if (!value.includes("@")) {
            errors[field] = "Email must contain @ symbol";
            isValid = false;
          } else if (!value.includes(".", value.indexOf("@"))) {
            errors[field] = "Email must have a domain (example@domain.com)";
            isValid = false;
          } else if (!VALIDATION_PATTERNS.email.test(value)) {
            errors[field] = VALIDATION_MESSAGES.email;
            isValid = false;
          }
          break;
        case "pincode":
          if (!/^\d+$/.test(value)) {
            errors[field] = "Pincode must contain only digits";
            isValid = false;
          } else if (!VALIDATION_PATTERNS.pincode.test(value)) {
            errors[field] = VALIDATION_MESSAGES.pincode;
            isValid = false;
          }
          break;
        case "phoneModel":
          if (!VALIDATION_PATTERNS.phoneModel.test(value)) {
            errors[field] = VALIDATION_MESSAGES.phoneModel;
            isValid = false;
          }
          break;
        case "issueDetail":
          if (!VALIDATION_PATTERNS.issueDetail.test(value)) {
            errors[field] = VALIDATION_MESSAGES.issueDetail;
            isValid = false;
          }
          break;
        case "address":
          if (!VALIDATION_PATTERNS.address.test(value)) {
            errors[field] = VALIDATION_MESSAGES.address;
            isValid = false;
          }
          break;
        case "area":
          if (!VALIDATION_PATTERNS.area.test(value)) {
            errors[field] = VALIDATION_MESSAGES.area;
            isValid = false;
          }
          break;
        default:
          break;
      }
    });

    setNewLeadErrors(errors);
    return isValid;
  };

  // ---------- API Functions ----------
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { headers: getAuthHeaders() });
      
      if (res.status === 401) {
        toast.error("Session expired. Please login again.");
        setLeads([]);
        return;
      }
      
      if (res.status === 403) {
        toast.error("You don't have permission to view leads");
        setLeads([]);
        return;
      }
      
      if (!res.ok) throw new Error("Failed to fetch leads");

      const data = await res.json();
      console.log("Fetched leads data:", data);
      
      const mappedLeads = data.map((lead) => ({
        id: lead.id,
        leadId: lead.lead_code,
        name: lead.customer_name,
        phone: lead.customer_phone,
        email: lead.email || "",
        phoneModel: lead.phone_model,
        address: lead.address,
        pincode: lead.pincode,
        area: lead.area,
        state: lead.state || "",
        issueDetail: lead.issue_detail,
        registrationDate: getFormattedDate(lead.created_at),
        // FIXED: Map the correct status values from backend
        status: lead.status === "COMPLAINT_REGISTERED" ? "Complaint Registered" : "New",
        created_by: lead.created_by || null,
        source: lead.source || "MANUAL",
        created_at: lead.created_at,
        // Store complaint ID if exists
        complaintId: lead.complaint || null,
      }));

      setLeads(mappedLeads);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  // ---------- Pincode Functions ----------
  const handlePincodeChange = async (pincode) => {
    if (pincode.length !== 6) {
      setAreaOptions([]);
      setNewLeadData((prev) => ({ ...prev, state: "" }));
      return;
    }

    setLoadingArea(true);

    try {
      if (!navigator.onLine) {
        toast.error("No internet connection");
        setNewLeadErrors((prev) => ({
          ...prev,
          pincode: "No internet connection. Please check your network.",
        }));
        setAreaOptions([]);
        setNewLeadData((prev) => ({ ...prev, state: "" }));
        return;
      }

      const response = await fetch(
        `https://api.postalpincode.in/pincode/${pincode}`
      );

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();

      if (!data?.[0] || data[0].Status !== "Success") {
        setAreaOptions([]);
        setNewLeadData((prev) => ({ ...prev, state: "" }));
        setNewLeadErrors((prev) => ({
          ...prev,
          pincode: "Invalid pincode. Please enter a valid Indian pincode.",
        }));
        return;
      }

      const postOffices = data[0].PostOffice || [];
      const stateName = postOffices[0]?.State || "";
      const areas = postOffices.map((po) => po.Name);

      setAreaOptions(areas);
      setNewLeadData((prev) => ({
        ...prev,
        state: stateName,
        area: areas.length === 1 ? areas[0] : prev.area,
      }));

      setNewLeadErrors((prev) => {
        const copy = { ...prev };
        delete copy.pincode;
        delete copy.state;
        return copy;
      });
    } catch (error) {
      console.error("Pincode fetch failed:", error);
      toast.error("Network error while fetching location");
      setAreaOptions([]);
      setNewLeadData((prev) => ({ ...prev, state: "" }));
      setNewLeadErrors((prev) => ({
        ...prev,
        pincode: "Unable to fetch location. Please try again later.",
      }));
    } finally {
      setLoadingArea(false);
    }
  };

  // ---------- Form Handlers ----------
  const handleNewLeadChange = (field, value) => {
    setNewLeadData((prev) => ({ ...prev, [field]: value }));
    if (touchedFields[field]) validateField(field, value);
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    validateField(field, newLeadData[field]);
  };

  const resetLeadForm = () => {
    setNewLeadData({
      name: "",
      phone: "",
      email: "",
      phoneModel: "",
      address: "",
      state: "",
      pincode: "",
      area: "",
      issueDetail: "",
    });
    setNewLeadErrors({});
    setTouchedFields({});
    setAreaOptions([]);
    setEditingLeadId(null);
    setLeadModalMode("create");
  };

  // ---------- CRUD Operations ----------
  const handleSaveNewLead = async () => {
    const allFields = [
      "name", "phone", "email", "phoneModel", 
      "issueDetail", "address", "pincode", "area"
    ];

    const newTouched = {};
    allFields.forEach((f) => (newTouched[f] = true));
    setTouchedFields(newTouched);

    if (!validateAllFields()) {
      toast.error("Please fix all validation errors");
      return;
    }

    try {
      const payload = {
        customer_name: newLeadData.name,
        customer_phone: newLeadData.phone,
        email: newLeadData.email,
        phone_model: newLeadData.phoneModel,
        issue_detail: newLeadData.issueDetail,
        address: newLeadData.address,
        pincode: newLeadData.pincode,
        area: newLeadData.area,
        state: newLeadData.state,
        source: "MANUAL",
      };

      if (editingLeadId) {
        const res = await fetch(`${API_BASE}${editingLeadId}/`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        
        if (res.status === 401) {
          toast.error("Session expired. Please login again.");
          return;
        }
        
        if (res.status === 403) {
          toast.error("You don't have permission to update leads");
          return;
        }
        
        if (!res.ok) throw new Error("Failed to update lead");
        
        toast.success("Lead updated successfully");
      } else {
        const res = await fetch(API_BASE, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });
        
        if (res.status === 401) {
          toast.error("Session expired. Please login again.");
          return;
        }
        
        if (res.status === 403) {
          toast.error("You don't have permission to create leads");
          return;
        }
        
        if (!res.ok) throw new Error("Failed to create lead");
        
        toast.success("Lead created successfully");
      }

      await fetchLeads();
      setShowNewLeadModal(false);
      resetLeadForm();
    } catch (err) {
      console.error(err);
      toast.error(editingLeadId ? "Failed to update lead" : "Failed to create lead");
    }
  };

  const handleDeleteLead = async (leadId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Are you sure you want to delete this lead?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const res = await fetch(`${API_BASE}${leadId}/`, {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                  });
                  
                  if (res.status === 401) {
                    toast.error("Session expired. Please login again.");
                    return;
                  }
                  
                  if (res.status === 403) {
                    toast.error("You don't have permission to delete leads");
                    return;
                  }
                  
                  if (!res.ok) throw new Error("Failed to delete lead");
                  
                  toast.success("Lead deleted successfully ✅");
                  await fetchLeads();
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to delete lead ❌");
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) {
      toast.error("No leads selected");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium">Delete {selectedLeads.length} selected leads?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  const results = await Promise.allSettled(
                    selectedLeads.map((id) =>
                      fetch(`${API_BASE}${id}/`, {
                        method: "DELETE",
                        headers: getAuthHeaders(),
                      })
                    )
                  );
                  
                  const failed = results.filter(r => r.status === 'rejected' || (r.value && !r.value.ok)).length;
                  
                  if (failed === 0) {
                    toast.success("All leads deleted successfully ✅");
                  } else {
                    toast.success(`${selectedLeads.length - failed} leads deleted, ${failed} failed`);
                  }
                  
                  await fetchLeads();
                  setSelectedLeads([]);
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to delete some leads ❌");
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000 }
    );
  };

  // ---------- Lead Operations ----------
  const handleRegisterNewLead = () => {
    resetLeadForm();
    setLeadModalMode("create");
    setShowNewLeadModal(true);
  };

  const handleEditLead = async (lead) => {
    setLeadModalMode("edit");
    setEditingLeadId(lead.id);
    
    setNewLeadData({
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || "",
      phoneModel: lead.phoneModel || "",
      address: lead.address || "",
      state: lead.state || "",
      pincode: lead.pincode || "",
      area: lead.area || "",
      issueDetail: lead.issueDetail || "",
    });

    setNewLeadErrors({});
    setTouchedFields({});
    setShowNewLeadModal(true);

    if (lead.pincode?.length === 6) {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${lead.pincode}`
        );
        const data = await res.json();
        if (data[0]?.Status === "Success") {
          const areas = data[0].PostOffice.map((p) => p.Name);
          setAreaOptions(areas);
        }
      } catch (err) {
        console.error("Failed to load areas for edit", err);
      }
    }
  };

  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setViewModalOpen(true);
  };

  const handleViewOrRegisterComplaint = (lead) => {
    if (lead.status === "Complaint Registered") {
      toast.success(`Complaint already registered for this lead. Complaint ID: ${lead.complaintId || 'N/A'}`);
      // You could also navigate to the complaint view here
    } else {
      setSelectedLeadForComplaint(lead);
      setShowComplaintModal(true);
    }
  };

  // FIXED: Updated to refresh leads from server
  const handleComplaintRegistrationSuccess = async (responseData) => {
    console.log("Complaint registration success, response:", responseData);
    
    // Refresh all leads to get the latest status from backend
    await fetchLeads();
    
    setShowComplaintModal(false);
    setSelectedLeadForComplaint(null);
    
    toast.success("Complaint registered successfully!");
  };

  // ---------- Selection Handlers ----------
  const handleSelectLead = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((leadId) => leadId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    setSelectedLeads(checked ? filteredLeads.map((lead) => lead.id) : []);
  };

  // ---------- Filtering Logic ----------
  const filteredLeads = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch = (
        (lead.name || "").toLowerCase().includes(searchLower) ||
        (lead.phone || "").includes(searchTerm) ||
        (lead.email || "").toLowerCase().includes(searchLower) ||
        (lead.leadId || "").toLowerCase().includes(searchLower) ||
        (lead.phoneModel || "").toLowerCase().includes(searchLower) ||
        (lead.issueDetail || "").toLowerCase().includes(searchLower)
      );

      const matchesStatus = filterStatus === "All" || lead.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, filterStatus]);

  // ---------- Render Helpers ----------
  const getStatusStyle = (status) => {
    if (status === "New") return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    if (status === "Complaint Registered") return "bg-green-100 text-green-800 border border-green-200";
    return "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------- Render ----------
  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Debug Button - Remove in production */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={debugAuth}
            className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            Debug Auth
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 flex items-center gap-3">
            <User size={28} /> Lead Management
          </h1>
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-green-600">
              {leads.length} total leads
            </span>
            <span className="mx-2">•</span>
            <span className="font-semibold text-blue-600">
              {filteredLeads.length} filtered
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-4 bg-white rounded-lg shadow-sm border mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
            <button
              onClick={handleRegisterNewLead}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm shadow hover:bg-green-700 transition whitespace-nowrap"
            >
              <PlusCircle size={16} /> New Lead
            </button>

            <div className="relative flex-grow md:max-w-sm">
              <input
                type="text"
                placeholder="Search by ID, Name, Phone, Email, Model..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border p-2 pl-10 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border p-2 rounded-lg text-sm bg-white"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {selectedLeads.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-500 text-white px-3 py-2 rounded-lg flex items-center gap-2 text-sm shadow hover:bg-red-600 transition whitespace-nowrap"
              >
                <Trash2 size={16} /> Delete ({selectedLeads.length})
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block">
          <div className="bg-white rounded-xl shadow-lg border overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 w-10 text-center">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedLeads.length > 0 && selectedLeads.length === filteredLeads.length}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Lead ID</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Phone Model</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Issue</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.length > 0 ? (
                  filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className={`hover:bg-gray-50 transition ${
                        selectedLeads.includes(lead.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-3 py-4 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <p className="font-bold text-blue-600 text-sm">{lead.leadId}</p>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyle(lead.status)}`}>
                            {lead.status}
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex flex-col items-center">
                          <p className="font-bold text-gray-900 text-sm">{lead.name}</p>
                          <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <Phone size={12} /> {lead.phone}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center align-middle">
                        <p className="text-xs text-gray-700 flex justify-center gap-1">
                          <Mail size={12} /> {lead.email}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-center align-middle">
                        <p className="text-xs text-gray-700 flex justify-center gap-1">
                          <Smartphone size={12} /> {lead.phoneModel}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-center align-middle">
                        <p className="text-xs text-gray-700 max-w-[200px] truncate" title={lead.issueDetail}>
                          {lead.issueDetail}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-center align-middle">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {lead.source}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex items-center justify-center gap-2">
                          {/* Complaint/Register Button */}
                          <button
                            onClick={() => handleViewOrRegisterComplaint(lead)}
                            className={`p-2 rounded-lg transition-colors ${
                              lead.status === "Complaint Registered"
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : "bg-red-50 text-red-600 hover:bg-red-100"
                            }`}
                            title={lead.status === "Complaint Registered" ? "View Complaint" : "Register Complaint"}
                          >
                            {lead.status === "Complaint Registered" ? (
                              <CheckCircle size={18} />
                            ) : (
                              <AlertCircle size={18} />
                            )}
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditLead(lead)}
                            className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                            title="Edit Lead"
                          >
                            <Edit size={18} />
                          </button>

                          {/* View Button */}
                          <button
                            onClick={() => handleViewLead(lead)}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-10 text-gray-500 italic">
                      <div className="flex flex-col items-center justify-center">
                        <Search size={48} className="text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Leads Found</h3>
                        <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => (
              <div key={lead.id} className="bg-white rounded-xl shadow border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900">{lead.name}</h3>
                    <p className="text-sm text-blue-600 font-semibold">{lead.leadId}</p>
                    <p className="text-xs text-gray-500">Source: {lead.source}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusStyle(lead.status)}`}>
                    {lead.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Phone size={14} /> {lead.phone}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Mail size={14} /> {lead.email}
                  </p>
                  <p className="text-sm text-gray-700 flex items-center gap-2">
                    <Smartphone size={14} /> {lead.phoneModel}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Issue:</span> {lead.issueDetail}
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-3">
                  {/* Complaint/Register Button */}
                  <button
                    onClick={() => handleViewOrRegisterComplaint(lead)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
                      lead.status === "Complaint Registered"
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {lead.status === "Complaint Registered" ? (
                      <CheckCircle size={20} />
                    ) : (
                      <AlertCircle size={20} />
                    )}
                    <span className="text-xs mt-1">
                      {lead.status === "Complaint Registered" ? "View" : "Register"}
                    </span>
                  </button>

                  {/* Edit Button */}
                  <button
                    onClick={() => handleEditLead(lead)}
                    className="flex flex-col items-center justify-center p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100"
                  >
                    <Edit size={20} />
                    <span className="text-xs mt-1">Edit</span>
                  </button>

                  {/* View Button */}
                  <button
                    onClick={() => handleViewLead(lead)}
                    className="flex flex-col items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                  >
                    <Eye size={20} />
                    <span className="text-xs mt-1">View</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="flex flex-col items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 size={20} />
                    <span className="text-xs mt-1">Delete</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-xl shadow border">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Leads Found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-10">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading leads...</p>
          </div>
        )}

        {/* VIEW MODAL */}
        {viewModalOpen && selectedLead && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Tag className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Lead Details</h2>
                    <p className="text-sm text-gray-500">ID: {selectedLead.leadId}</p>
                  </div>
                </div>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-grow overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* Status Badge */}
                  <div className="flex justify-end">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(selectedLead.status)}`}>
                      {selectedLead.status}
                    </span>
                  </div>

                  {/* Customer Information Section */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <User className="w-5 h-5 text-blue-600" />
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                        <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.name}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                        <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                          <Phone size={16} className="text-blue-500" />
                          {selectedLead.phone}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                        <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                          <Mail size={16} className="text-blue-500" />
                          {selectedLead.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Device Information Section */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <Smartphone className="w-5 h-5 text-purple-600" />
                      Device Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Model</label>
                        <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.phoneModel}
                        </p>
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Details</label>
                        <p className="text-base text-gray-900 bg-white p-4 rounded-lg border border-gray-200 min-h-[100px] whitespace-pre-wrap">
                          {selectedLead.issueDetail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location Information Section */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <MapPin className="w-5 h-5 text-green-600" />
                      Location Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</label>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.address}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Area</label>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.area}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pincode</label>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.pincode}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">State</label>
                        <p className="text-sm text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.state || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* System Information Section */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                      <Package className="w-5 h-5 text-orange-600" />
                      System Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Source</label>
                        <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.source}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</label>
                        <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.created_by?.username || selectedLead.created_by?.email || selectedLead.created_by || "System"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</label>
                        <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          {formatDate(selectedLead.created_at)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</label>
                        <p className="text-sm font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                          {selectedLead.registrationDate}
                        </p>
                      </div>
                      {selectedLead.complaintId && (
                        <div className="space-y-1 md:col-span-2">
                          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Complaint ID</label>
                          <p className="text-sm font-medium text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                            #{selectedLead.complaintId}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleEditLead(selectedLead);
                  }}
                  className="px-6 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Lead
                </button>
                <button
                  onClick={() => {
                    setViewModalOpen(false);
                    handleViewOrRegisterComplaint(selectedLead);
                  }}
                  className={`px-6 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                    selectedLead.status === "Complaint Registered"
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                >
                  {selectedLead.status === "Complaint Registered" ? (
                    <>
                      <CheckCircle size={18} />
                      View Complaint
                    </>
                  ) : (
                    <>
                      <AlertCircle size={18} />
                      Register Complaint
                    </>
                  )}
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lead Registration/Edit Modal */}
        {showNewLeadModal && (
          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-green-50">
                <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
                  <PlusCircle size={24} />
                  {leadModalMode === "view" ? "Lead Details" : editingLeadId ? "Update Lead" : "New Lead"}
                </h2>
                <button
                  onClick={() => {
                    setShowNewLeadModal(false);
                    resetLeadForm();
                  }}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 md:p-6">
                <div className="space-y-8">
                  {/* Customer & Device Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <User size={18} /> Customer Information
                      </h4>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name *
                          </label>
                          <input
                            value={newLeadData.name}
                            disabled={leadModalMode === "view"}
                            onChange={(e) => leadModalMode !== "view" && handleNewLeadChange("name", e.target.value)}
                            onBlur={() => leadModalMode !== "view" && handleFieldBlur("name")}
                            className={`w-full border p-2 rounded-lg ${
                              leadModalMode === "view"
                                ? "bg-gray-100 cursor-not-allowed"
                                : newLeadErrors.name
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />
                          {leadModalMode !== "view" && newLeadErrors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {newLeadErrors.name}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={newLeadData.phone}
                            disabled={leadModalMode === "view"}
                            onChange={(e) =>
                              leadModalMode !== "view" &&
                              handleNewLeadChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                            }
                            onBlur={() => leadModalMode !== "view" && handleFieldBlur("phone")}
                            className={`w-full border p-2 rounded-lg ${
                              leadModalMode === "view"
                                ? "bg-gray-100 cursor-not-allowed"
                                : newLeadErrors.phone
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />
                          {leadModalMode !== "view" && newLeadErrors.phone && (
                            <p className="text-red-500 text-xs mt-1">
                              <AlertTriangle size={12} /> {newLeadErrors.phone}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={newLeadData.email}
                            disabled={leadModalMode === "view"}
                            onChange={(e) => leadModalMode !== "view" && handleNewLeadChange("email", e.target.value)}
                            onBlur={() => leadModalMode !== "view" && handleFieldBlur("email")}
                            className={`w-full border p-2 rounded-lg ${
                              leadModalMode === "view"
                                ? "bg-gray-100 cursor-not-allowed"
                                : newLeadErrors.email
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />
                          {leadModalMode !== "view" && newLeadErrors.email && (
                            <p className="text-red-500 text-xs mt-1">
                              <AlertTriangle size={12} /> {newLeadErrors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Smartphone size={18} /> Device Information
                      </h4>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Model *
                          </label>
                          <input
                            value={newLeadData.phoneModel}
                            disabled={leadModalMode === "view"}
                            onChange={(e) => leadModalMode !== "view" && handleNewLeadChange("phoneModel", e.target.value)}
                            onBlur={() => leadModalMode !== "view" && handleFieldBlur("phoneModel")}
                            className={`w-full border p-2 rounded-lg ${
                              leadModalMode === "view"
                                ? "bg-gray-100 cursor-not-allowed"
                                : newLeadErrors.phoneModel
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />
                          {leadModalMode !== "view" && newLeadErrors.phoneModel && (
                            <p className="text-red-500 text-xs mt-1">
                              <AlertTriangle size={12} /> {newLeadErrors.phoneModel}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Detail *
                          </label>
                          <textarea
                            value={newLeadData.issueDetail}
                            disabled={leadModalMode === "view"}
                            onChange={(e) => leadModalMode !== "view" && handleNewLeadChange("issueDetail", e.target.value)}
                            onBlur={() => leadModalMode !== "view" && handleFieldBlur("issueDetail")}
                            rows="2"
                            className={`w-full border p-2 rounded-lg ${
                              leadModalMode === "view"
                                ? "bg-gray-100 cursor-not-allowed"
                                : newLeadErrors.issueDetail
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />
                          {leadModalMode !== "view" && newLeadErrors.issueDetail && (
                            <p className="text-red-500 text-xs mt-1">
                              <AlertTriangle size={12} /> {newLeadErrors.issueDetail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin size={18} /> Address Information
                    </h4>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complete Address *
                      </label>
                      <textarea
                        rows="2"
                        value={newLeadData.address}
                        disabled={leadModalMode === "view"}
                        onChange={(e) => leadModalMode !== "view" && handleNewLeadChange("address", e.target.value)}
                        onBlur={() => leadModalMode !== "view" && handleFieldBlur("address")}
                        className={`w-full border p-2 rounded-lg ${
                          leadModalMode === "view"
                            ? "bg-gray-100 cursor-not-allowed"
                            : newLeadErrors.address
                              ? "border-red-500 ring-1 ring-red-500"
                              : "border-gray-300"
                        }`}
                        placeholder="House no, street, landmark"
                      />
                      {leadModalMode !== "view" && newLeadErrors.address && (
                        <p className="text-red-500 text-xs mt-1">
                          <AlertTriangle size={12} /> {newLeadErrors.address}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          value={newLeadData.state}
                          disabled
                          className="w-full border p-2 rounded-lg bg-gray-100 cursor-not-allowed"
                          placeholder="Auto-filled from pincode"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={newLeadData.pincode}
                          disabled={leadModalMode === "view"}
                          onChange={(e) => {
                            if (leadModalMode === "view") return;
                            const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                            handleNewLeadChange("pincode", v);
                            if (v.length === 6) handlePincodeChange(v);
                          }}
                          onBlur={() => leadModalMode !== "view" && handleFieldBlur("pincode")}
                          className={`w-full border p-2 rounded-lg ${
                            leadModalMode === "view"
                              ? "bg-gray-100 cursor-not-allowed"
                              : newLeadErrors.pincode
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300"
                          }`}
                        />
                        {leadModalMode !== "view" && newLeadErrors.pincode && (
                          <p className="text-red-500 text-xs mt-1">
                            <AlertTriangle size={12} /> {newLeadErrors.pincode}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area *
                        </label>
                        <select
                          value={newLeadData.area}
                          disabled={leadModalMode === "view" || areaOptions.length === 0}
                          onChange={(e) => leadModalMode !== "view" && handleNewLeadChange("area", e.target.value)}
                          onBlur={() => leadModalMode !== "view" && handleFieldBlur("area")}
                          className={`w-full border p-2 rounded-lg ${
                            leadModalMode === "view"
                              ? "bg-gray-100 cursor-not-allowed"
                              : newLeadErrors.area
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300"
                          }`}
                        >
                          <option value="">
                            {areaOptions.length === 0 ? "Enter pincode first" : "Select area"}
                          </option>
                          {areaOptions.map((a, i) => (
                            <option key={i} value={a}>{a}</option>
                          ))}
                        </select>
                        {leadModalMode !== "view" && newLeadErrors.area && (
                          <p className="text-red-500 text-xs mt-1">
                            <AlertTriangle size={12} /> {newLeadErrors.area}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={() => {
                        setShowNewLeadModal(false);
                        resetLeadForm();
                      }}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      {leadModalMode === "view" ? "Close" : "Cancel"}
                    </button>

                    {leadModalMode !== "view" && (
                      <button
                        onClick={handleSaveNewLead}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        {editingLeadId ? "Update" : "Create"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Registration Modal */}
        {showComplaintModal && (
          <ComplaintRegistrationModal
            open={showComplaintModal}
            onClose={() => {
              setShowComplaintModal(false);
              setSelectedLeadForComplaint(null);
            }}
            leadData={selectedLeadForComplaint}
            onSuccess={handleComplaintRegistrationSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default Leads;