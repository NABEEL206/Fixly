// Leads.jsx (with complete validation)
import React, { useState, useMemo, useEffect } from "react";
import {
  Edit3,
  Trash2,
  X,
  Search,
  Filter,
  Eye,
  Phone,
  MapPin,
  Mail,
  User,
  Save,
  Smartphone,
  AlertCircle,
  CheckCircle,
  PlusCircle,
  AlertTriangle,
  Calendar,
  FileText,
} from "lucide-react";
import ComplaintRegistrationModal from "./ComplaintRegistrationModal";
import toast from "react-hot-toast";

// ================= API CONFIG =================
const API_BASE = "http://127.0.0.1:8000/api/leads/";

const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");
  if (!token) return { "Content-Type": "application/json" };

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

// --- CONSTANTS ---
const getFormattedDate = (timestamp) =>
  new Date(timestamp).toISOString().split("T")[0];

const generateLeadId = (count) => `LD-${String(count).padStart(3, "0")}`;

// Validation patterns
const VALIDATION_PATTERNS = {
  name: /^[a-zA-Z\s]{2,50}$/,
  phone: /^\d{10}$/, // Exactly 10 digits
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Must have @ and .
  pincode: /^\d{6}$/, // Exactly 6 digits
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

// --- MAIN COMPONENT ---

const Leads = () => {
  // State declarations
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [openModal, setOpenModal] = useState(false);
  const [activeLead, setActiveLead] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [editErrors, setEditErrors] = useState({});
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState(null);
  const [leadModalMode, setLeadModalMode] = useState("create"); // create | edit | view
  const isViewMode = leadModalMode === "view";

  // New Lead Form State
  const [newLeadData, setNewLeadData] = useState({
    name: "",
    phone: "",
    email: "",
    phoneModel: "",
    address: "",
    state: "", // ✅ ADD THIS
    pincode: "",
    area: "",
    issueDetail: "",
  });

  const [newLeadErrors, setNewLeadErrors] = useState({});
  const [areaOptions, setAreaOptions] = useState([]);
  const [loadingArea, setLoadingArea] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});

  // States for complaint registration modal
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [selectedLeadForComplaint, setSelectedLeadForComplaint] =
    useState(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  // --- VALIDATION FUNCTIONS ---
  const validateField = (field, value, isEdit = false) => {
    const errors = isEdit ? editErrors : newLeadErrors;
    const setErrors = isEdit ? setEditErrors : setNewLeadErrors;

    // Check if field is empty
    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, [field]: "This field is required" }));
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
        // Check if it's all digits
        if (!/^\d+$/.test(value)) {
          errorMessage = "Phone number must contain only digits";
          isValid = false;
        }
        // Check if it's exactly 10 digits
        else if (!VALIDATION_PATTERNS.phone.test(value)) {
          errorMessage = VALIDATION_MESSAGES.phone;
          isValid = false;
        }
        break;
      case "email":
        // Check if it has @ symbol
        if (!value.includes("@")) {
          errorMessage = "Email must contain @ symbol";
          isValid = false;
        }
        // Check if it has . after @
        else if (!value.includes(".", value.indexOf("@"))) {
          errorMessage = "Email must have a domain (example@domain.com)";
          isValid = false;
        }
        // Check full email pattern
        else if (!VALIDATION_PATTERNS.email.test(value)) {
          errorMessage = VALIDATION_MESSAGES.email;
          isValid = false;
        }
        break;
      case "pincode":
        // Check if it's all digits
        if (!/^\d+$/.test(value)) {
          errorMessage = "Pincode must contain only digits";
          isValid = false;
        }
        // Check if it's exactly 6 digits
        else if (!VALIDATION_PATTERNS.pincode.test(value)) {
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
      setErrors((prev) => ({ ...prev, [field]: errorMessage }));
    } else if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    return isValid;
  };

  const validateAllFields = (formData, isEdit = false) => {
    const errors = {};
    let isValid = true;

    Object.keys(formData).forEach((field) => {
      if (
        field !== "id" &&
        field !== "leadId" &&
        field !== "status" &&
        field !== "registrationDate"
      ) {
        const value = formData[field];

        // Check if field is empty
        if (!value.trim()) {
          errors[field] = "This field is required";
          isValid = false;
          return;
        }

        // Field-specific validation
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
      }
    });

    if (isEdit) {
      setEditErrors(errors);
    } else {
      setNewLeadErrors(errors);
    }

    return { isValid, errors };
  };

  // --- NEW LEAD MODAL FUNCTIONS ---
  const handleRegisterNewLead = () => {
    setLeadModalMode("create"); // ✅ RESET MODE
    setIsEditMode(false);

    setNewLeadData({
      name: "",
      phone: "",
      email: "",
      phoneModel: "",
      address: "",
      pincode: "",
      area: "",
      issueDetail: "",
    });

    setShowNewLeadModal(true);
  };

  const handleNewLeadChange = (field, value) => {
    setNewLeadData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // If field already touched → validate live
    if (touchedFields[field]) {
      validateField(field, value, false);
    }
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    validateField(field, newLeadData[field], false);
  };

  const handlePincodeChange = async (pincode) => {
    // Only proceed when exactly 6 digits
    if (pincode.length !== 6) {
      setAreaOptions([]);
      setNewLeadData((prev) => ({ ...prev, state: "" }));
      return;
    }

    setLoadingArea(true);

    try {
      // 🔹 Check internet first
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
        `https://api.postalpincode.in/pincode/${pincode}`,
      );

      // 🔹 Server-level failure
      if (!response.ok) {
        throw new Error("Server error");
      }

      const data = await response.json();

      // 🔴 INVALID PINCODE (API responded but no data)
      if (!data?.[0] || data[0].Status !== "Success") {
        setAreaOptions([]);
        setNewLeadData((prev) => ({ ...prev, state: "" }));
        setNewLeadErrors((prev) => ({
          ...prev,
          pincode: "Invalid pincode. Please enter a valid Indian pincode.",
        }));
        return;
      }

      // ✅ VALID PINCODE
      const postOffices = data[0].PostOffice || [];
      const stateName = postOffices[0]?.State || "";
      const areas = postOffices.map((po) => po.Name);

      setAreaOptions(areas);

      setNewLeadData((prev) => ({
        ...prev,
        state: stateName,
        area: areas.length === 1 ? areas[0] : prev.area,
      }));

      // ✅ Clear only related errors
      setNewLeadErrors((prev) => {
        const copy = { ...prev };
        delete copy.pincode;
        delete copy.state;
        return copy;
      });
    } catch (error) {
      console.error("Pincode fetch failed:", error);

      // ❗ SHOW TOAST ONLY FOR SYSTEM / NETWORK ERROR
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

  const handleSaveNewLead = async () => {
    const allFields = [
      "name",
      "phone",
      "email",
      "phoneModel",
      "issueDetail",
      "address",
      "pincode",
      "area",
    ];

    const newTouched = {};
    allFields.forEach((f) => (newTouched[f] = true));
    setTouchedFields(newTouched);

    const validation = validateAllFields(newLeadData, false);
    if (!validation.isValid) {
      toast.error("Please fix all validation errors");
      return;
    }

    if (isEditMode && editingLeadId) {
      // 🔄 UPDATE EXISTING LEAD
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
        };

        const res = await fetch(`${API_BASE}${editingLeadId}/`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Update failed");

        fetchLeads();
      } catch (err) {
        toast.error("Failed to update lead");
      }

      toast.success("Lead updated successfully");

      setTimeout(async () => {
        await fetchLeads();
      }, 250);
    } else {
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
          source: "MANUAL",
        };

        const res = await fetch(API_BASE, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Create failed");

        toast.success("Lead created successfully");

        setTimeout(async () => {
          await fetchLeads();
        }, 250);
      } catch (err) {
        toast.error("Failed to create lead");
      }
    }

    // 🔄 RESET AND CLOSE
    handleCancelNewLead(); // Use the cancel function to reset everything
  };

  const handleCancelNewLead = () => {
    setShowNewLeadModal(false);
    setIsEditMode(false);
    setEditingLeadId(null);
    setLeadModalMode("create"); // ✅ RESET TO CREATE MODE

    // Reset form data
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
  };

  // --- EXISTING FUNCTIONS ---
  const handleViewLead = (lead) => {
    setActiveLead(lead);
    setIsEditing(false);
    setEditFormData(null);
    setEditErrors({});
    setOpenModal(true);
  };

  const handleViewOrRegisterComplaint = (lead) => {
    if (lead.status === "Complaint Registered") {
      setActiveLead(lead);
      setOpenModal(true);
    } else {
      setSelectedLeadForComplaint(lead);
      setShowComplaintModal(true);
    }
  };

  const handleComplaintRegistrationSuccess = () => {
    if (selectedLeadForComplaint) {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === selectedLeadForComplaint.id
            ? { ...lead, status: "Complaint Registered" }
            : lead,
        ),
      );
    }
    setShowComplaintModal(false);
    setSelectedLeadForComplaint(null);
  };

  const handleDeleteLead = async (leadId) => {
    toast.dismiss();

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">
            Are you sure you want to delete this lead?
          </p>
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
                // ✅ MAKE ASYNC
                try {
                  toast.dismiss(t.id);

                  const res = await fetch(`${API_BASE}${leadId}/`, {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                  });

                  if (!res.ok) {
                    throw new Error("Delete failed");
                  }

                  toast.success("Lead deleted successfully ✅");

                  setTimeout(async () => {
                    await fetchLeads();
                  }, 250);
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
      { duration: Infinity },
    );
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) {
      toast.error("No leads selected");
      return;
    }

    toast.dismiss();

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="font-medium">
            Delete {selectedLeads.length} selected leads?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setLeads((prev) =>
                  prev.filter((lead) => !selectedLeads.includes(lead.id)),
                );
                setSelectedLeads([]);
                toast.success("Leads deleted successfully ✅");
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleSelectLead = (id) => {
    setSelectedLeads((prev) =>
      prev.includes(id)
        ? prev.filter((leadId) => leadId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map((lead) => lead.id));
    } else {
      setSelectedLeads([]);
    }
  };
  const handleEditLead = async (lead) => {
    setIsEditMode(true);
    setLeadModalMode("edit");
    setEditingLeadId(lead.id); // Make sure to set the editing lead ID

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

    // 🔥 AUTO LOAD AREA OPTIONS FOR EDIT MODE
    if (lead.pincode && lead.pincode.length === 6) {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${lead.pincode}`,
        );
        const data = await res.json();

        if (data[0]?.Status === "Success") {
          const areas = data[0].PostOffice.map((p) => p.Name);
          setAreaOptions(areas); // ✅ THIS MAKES AREA SELECT WORK
        }
      } catch (err) {
        console.error("Failed to load areas for edit", err);
      }
    }
  };

  const handleEditChange = (field, value) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate field on change
    validateField(field, value, true);
  };

  const handleSaveEdit = () => {
    if (!editFormData) return;

    // Validate all fields
    const validation = validateAllFields(editFormData, true);

    if (!validation.isValid) {
      toast.error("Please fix all validation errors");
      return;
    }

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === editFormData.id ? { ...editFormData } : lead,
      ),
    );

    setActiveLead(editFormData);
    toast.success("Lead updated successfully!");
    setIsEditing(false);
    setEditFormData(null);
    setEditErrors({});
    setOpenModal(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
    setEditErrors({});
    setOpenModal(false);
  };

  // featch leads
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Failed to fetch leads");

      const data = await res.json();

      // 🔁 Backend → Frontend mapping
      const mappedLeads = data.map((lead) => ({
        id: lead.id,
        leadId: lead.lead_code,
        name: lead.customer_name,
        phone: lead.customer_phone,
        email: lead.email,
        phoneModel: lead.phone_model,
        address: lead.address,
        pincode: lead.pincode,
        area: lead.area,
        issueDetail: lead.issue_detail,
        registrationDate: getFormattedDate(lead.created_at),
        status: lead.status === "CONVERTED" ? "Complaint Registered" : "New",

        // ✅ NEW FIELDS (future API ready)
        created_by: lead.created_by ?? null,
        source: lead.source ?? null,
      }));

      setLeads(mappedLeads);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  // --- FILTERING ---
  const filteredLeads = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        (lead.name ?? "").toLowerCase().includes(searchLower) ||
        (lead.phone ?? "").includes(searchTerm) ||
        (lead.email ?? "").toLowerCase().includes(searchLower) ||
        (lead.leadId ?? "").toLowerCase().includes(searchLower) ||
        (lead.pincode ?? "").includes(searchTerm) ||
        (lead.area ?? "").toLowerCase().includes(searchLower) ||
        (lead.phoneModel ?? "").toLowerCase().includes(searchLower) ||
        (lead.issueDetail ?? "").toLowerCase().includes(searchLower);

      const matchesStatus =
        filterStatus === "All" || lead.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchTerm, filterStatus]);

  // --- RENDER ---
  return (
    <div className="p-4 md:p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-700 flex items-center gap-3">
            <User size={28} /> Lead Management System
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
              <PlusCircle size={16} />
              <span className="font-medium">
                {isEditMode ? "Edit Lead" : "Register New Lead"}
              </span>
            </button>

            <div className="relative flex-grow md:max-w-sm">
              <input
                type="text"
                placeholder="Search by Lead ID, Name, Phone, Email, or Area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border p-2 pl-10 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <Search
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm text-gray-700">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border p-2 rounded-lg text-sm bg-white cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="New">New</option>
                <option value="Complaint Registered">
                  Complaint Registered
                </option>
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
                  <th className="px-3 py-3 w-10 text-center align-middle">
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={
                        selectedLeads.length > 0 &&
                        selectedLeads.length === filteredLeads.length
                      }
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead ID
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Model
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pincode / Area
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Detail
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Lead Source
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Created By
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const isComplaintRegistered =
                    lead.status === "Complaint Registered";

                  const getStatusStyle = (status) => {
                    if (status === "New")
                      return "bg-yellow-100 text-yellow-800";
                    if (status === "Complaint Registered")
                      return "bg-red-100 text-red-800";
                    return "bg-gray-100 text-gray-800";
                  };

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-blue-50 transition ${
                        selectedLeads.includes(lead.id) ? "bg-blue-100/50" : ""
                      } ${lead.status === "New" ? "bg-yellow-50/50" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Lead ID + Status ONLY */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <p className="font-bold text-blue-600 text-sm">
                            {lead.leadId}
                          </p>

                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              lead.status === "New"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {lead.status}
                          </span>
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <p className="font-bold text-gray-900 text-sm">
                            {lead.name}
                          </p>
                          <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                            <Phone size={12} /> {lead.phone}
                          </p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-4 text-center">
                        <p className="text-xs text-gray-700 flex justify-center gap-1">
                          <Mail size={12} /> {lead.email}
                        </p>
                      </td>

                      {/* Phone Model */}
                      <td className="px-4 py-4 text-center">
                        <p className="text-xs text-gray-700 flex justify-center gap-1">
                          <Smartphone size={12} /> {lead.phoneModel}
                        </p>
                      </td>

                      {/* Address */}
                      <td className="px-4 py-4 text-center">
                        <p
                          className="text-xs text-gray-700 max-w-[150px] truncate"
                          title={lead.address}
                        >
                          {lead.address}
                        </p>
                      </td>

                      {/* Pincode / Area */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <p className="font-medium text-gray-700 text-sm">
                            {lead.pincode}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={10} /> {lead.area}
                          </p>
                        </div>
                      </td>

                      {/* Issue Detail */}
                      <td className="px-4 py-4 text-center">
                        <p className="text-xs text-gray-700 p-1 bg-gray-50 rounded border">
                          {lead.issueDetail}
                        </p>
                      </td>
                      {/* Lead Source */}
                      <td className="px-4 py-4 text-center">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                          {lead.source ? lead.source : "—"}
                        </span>
                      </td>

                      {/* Created By */}
                      <td className="px-4 py-4 text-center text-gray-500 text-sm">
                        {lead.created_by ? lead.created_by : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleViewOrRegisterComplaint(lead)}
                            className={`p-2 rounded ${
                              isComplaintRegistered
                                ? "text-green-600 bg-green-50 hover:bg-green-100"
                                : "text-red-600 bg-red-50 hover:bg-red-100"
                            }`}
                          >
                            {isComplaintRegistered ? (
                              <CheckCircle size={16} />
                            ) : (
                              <AlertCircle size={16} />
                            )}
                          </button>

                          <button
                            onClick={() => handleEditLead(lead)}
                            className="p-2 rounded text-blue-600 hover:bg-blue-100"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-2 rounded text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredLeads.length === 0 && (
                  <tr>
                    <td
                      colSpan="9"
                      className="text-center py-10 text-gray-500 italic"
                    >
                      No leads found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredLeads.map((lead) => {
            const isComplaintRegistered =
              lead.status === "Complaint Registered";

            return (
              <div
                key={lead.id}
                className="bg-white rounded-xl shadow border p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-900">{lead.name}</h3>

                    <p className="text-sm text-blue-600 font-semibold">
                      {lead.leadId}
                    </p>
                    <p className="text-xs text-gray-500">
                      Source: {lead.source ? lead.source : "—"}
                    </p>

                    <p className="text-xs text-gray-500">
                      Created By: {lead.created_by ? lead.created_by : "—"}
                    </p>

                    {/* ✅ SOURCE BADGE */}
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        lead.source === "SALESIQ"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {lead.source}
                    </span>
                  </div>

                  {/* Status */}
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      lead.status === "New"
                        ? "bg-yellow-100 text-yellow-800"
                        : lead.status === "Complaint Registered"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {lead.status}
                  </span>
                </div>

                {/* Contact Info */}
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
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <p className="text-sm text-gray-700 font-medium">Address:</p>
                  <p className="text-xs text-gray-600">{lead.address}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin size={12} /> {lead.area} - {lead.pincode}
                  </div>
                </div>

                {/* Issue */}
                <div>
                  <p className="text-sm text-gray-700 font-medium">Issue:</p>
                  <p className="text-xs text-gray-600 p-2 bg-gray-50 rounded border">
                    {lead.issueDetail}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t">
                  {/* Register Complaint */}
                  <button
                    onClick={() => handleViewOrRegisterComplaint(lead)}
                    className={`p-2 rounded ${
                      isComplaintRegistered
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                    title={
                      isComplaintRegistered
                        ? "View Complaint"
                        : "Register Complaint"
                    }
                  >
                    {isComplaintRegistered ? (
                      <CheckCircle size={18} />
                    ) : (
                      <AlertCircle size={18} />
                    )}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => handleEditLead(lead)}
                    className="p-2 rounded bg-blue-100 text-blue-600"
                    title="Edit Lead"
                  >
                    <Edit3 size={18} />
                  </button>

                  {/* View */}
                  <button
                    onClick={() => {
                      setNewLeadData({
                        name: lead.name,
                        phone: lead.phone,
                        email: lead.email,
                        phoneModel: lead.phoneModel,
                        address: lead.address,
                        state: lead.state || "",
                        pincode: lead.pincode,
                        area: lead.area,
                        issueDetail: lead.issueDetail,
                      });
                      setAreaOptions([lead.area]);
                      setIsEditMode(false);
                      setLeadModalMode("view");
                      setShowNewLeadModal(true);
                    }}
                    className="p-2 rounded bg-purple-100 text-purple-600"
                    title="View Lead Details"
                  >
                    <Eye size={18} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteLead(lead.id)}
                    className="p-2 rounded bg-red-100 text-red-600"
                    title="Delete Lead"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results Message */}
        {filteredLeads.length === 0 && (
          <div className="text-center py-10">
            <div className="bg-white rounded-xl shadow p-8">
              <Search size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Leads Found
              </h3>
              <p className="text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          </div>
        )}

        {/* NEW LEAD REGISTRATION MODAL WITH VALIDATION */}
        {showNewLeadModal && (
          <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50 p-4 mt-14">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-green-50">
                <h2 className="text-xl font-bold text-green-700 flex items-center gap-2">
                  <PlusCircle size={24} />
                  {isViewMode
                    ? "Lead Details"
                    : isEditMode
                      ? "Update Lead"
                      : "Register New Lead"}
                </h2>
                <button
                  onClick={handleCancelNewLead}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 md:p-6">
                <div className="space-y-8">
                  {/* ================= TOP TWO COLUMNS ================= */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* ---------- CUSTOMER INFORMATION ---------- */}
                    <div className="space-y-6">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <User size={18} /> Customer Information
                      </h4>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Name */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name *
                          </label>
                          <input
                            value={newLeadData.name}
                            disabled={isViewMode}
                            onChange={(e) =>
                              !isViewMode &&
                              handleNewLeadChange("name", e.target.value)
                            }
                            onBlur={() =>
                              !isViewMode && handleFieldBlur("name")
                            } // ADD THIS LINE
                            className={`w-full border p-2 rounded-lg ${
                              isViewMode
                                ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                                : newLeadErrors.name // ADD THIS CONDITION
                                  ? "border-red-500 ring-1 ring-red-500" // RED BORDER FOR ERROR
                                  : "border-gray-300" // NORMAL BORDER
                            }`}
                          />

                          {!isViewMode && newLeadErrors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {newLeadErrors.name}
                            </p>
                          )}
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={newLeadData.phone}
                            disabled={isViewMode}
                            onChange={(e) =>
                              !isViewMode &&
                              handleNewLeadChange(
                                "phone",
                                e.target.value.replace(/\D/g, "").slice(0, 10),
                              )
                            }
                            onBlur={() =>
                              !isViewMode && handleFieldBlur("phone")
                            }
                            className={`w-full border p-2 rounded-lg text-sm ${
                              isViewMode
                                ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                                : newLeadErrors.phone
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />

                          {!isViewMode && newLeadErrors.phone && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {newLeadErrors.phone}
                            </p>
                          )}
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={newLeadData.email}
                            disabled={isViewMode}
                            onChange={(e) =>
                              !isViewMode &&
                              handleNewLeadChange("email", e.target.value)
                            }
                            onBlur={() =>
                              !isViewMode && handleFieldBlur("email")
                            }
                            className={`w-full border p-2 rounded-lg text-sm ${
                              isViewMode
                                ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                                : newLeadErrors.email
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />

                          {!isViewMode && newLeadErrors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {newLeadErrors.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ---------- DEVICE INFORMATION ---------- */}
                    <div className="space-y-6">
                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                        <Smartphone size={18} /> Device Information
                      </h4>

                      <div className="grid grid-cols-1 gap-4">
                        {/* Phone Model */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Model *
                          </label>
                          <input
                            type="text"
                            value={newLeadData.phoneModel}
                            disabled={isViewMode}
                            onChange={(e) =>
                              !isViewMode &&
                              handleNewLeadChange("phoneModel", e.target.value)
                            }
                            onBlur={() =>
                              !isViewMode && handleFieldBlur("phoneModel")
                            }
                            className={`w-full border p-2 rounded-lg text-sm ${
                              isViewMode
                                ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                                : newLeadErrors.phoneModel
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />

                          {!isViewMode && newLeadErrors.phoneModel && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} />{" "}
                              {newLeadErrors.phoneModel}
                            </p>
                          )}
                        </div>

                        {/* Issue Detail */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Detail *
                          </label>
                          <input
                            type="text"
                            value={newLeadData.issueDetail}
                            disabled={isViewMode}
                            onChange={(e) =>
                              !isViewMode &&
                              handleNewLeadChange("issueDetail", e.target.value)
                            }
                            onBlur={() =>
                              !isViewMode && handleFieldBlur("issueDetail")
                            }
                            className={`w-full border p-2 rounded-lg text-sm ${
                              isViewMode
                                ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                                : newLeadErrors.issueDetail
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : "border-gray-300"
                            }`}
                          />

                          {!isViewMode && newLeadErrors.issueDetail && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} />{" "}
                              {newLeadErrors.issueDetail}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ================= ADDRESS SECTION ================= */}
                  <div className="space-y-6">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <MapPin size={18} /> Address Information
                    </h4>

                    {/* Address */}
                    <div>
                      <textarea
                        rows="3"
                        value={newLeadData.address}
                        disabled={isViewMode}
                        onChange={(e) =>
                          !isViewMode &&
                          handleNewLeadChange("address", e.target.value)
                        }
                        onBlur={() => !isViewMode && handleFieldBlur("address")}
                        className={`w-full border p-2 rounded-lg text-sm ${
                          isViewMode
                            ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                            : newLeadErrors.address
                              ? "border-red-500 ring-1 ring-red-500"
                              : "border-gray-300"
                        }`}
                        placeholder="House no, street, landmark"
                      />

                      {!isViewMode && newLeadErrors.address && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertTriangle size={12} /> {newLeadErrors.address}
                        </p>
                      )}
                    </div>

                    {/* State / Pincode / Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* State */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <select
                          value={newLeadData.state}
                          disabled
                          className="w-full border p-2 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                        >
                          <option>
                            {newLeadData.state || "Auto-filled from pincode"}
                          </option>
                        </select>
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={newLeadData.pincode}
                          disabled={isViewMode}
                          onChange={(e) => {
                            if (isViewMode) return;
                            const v = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);
                            handleNewLeadChange("pincode", v);
                            if (v.length === 6) handlePincodeChange(v);
                          }}
                          onBlur={() =>
                            !isViewMode && handleFieldBlur("pincode")
                          }
                          className={`w-full border p-2 rounded-lg text-sm ${
                            isViewMode
                              ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                              : newLeadErrors.pincode
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300"
                          }`}
                        />

                        {!isViewMode && newLeadErrors.pincode && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> {newLeadErrors.pincode}
                          </p>
                        )}
                      </div>

                      {/* Area */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Area *
                        </label>
                        <select
                          value={newLeadData.area}
                          disabled={isViewMode || areaOptions.length === 0}
                          onChange={(e) =>
                            !isViewMode &&
                            handleNewLeadChange("area", e.target.value)
                          }
                          onBlur={() => !isViewMode && handleFieldBlur("area")}
                          className={`w-full border p-2 rounded-lg text-sm ${
                            isViewMode
                              ? "bg-gray-100 text-gray-700 cursor-not-allowed"
                              : newLeadErrors.area
                                ? "border-red-500 ring-1 ring-red-500"
                                : "border-gray-300"
                          }`}
                        >
                          <option>
                            {areaOptions.length === 0
                              ? "Enter pincode first"
                              : "Select area"}
                          </option>
                          {areaOptions.map((a, i) => (
                            <option key={i}>{a}</option>
                          ))}
                        </select>

                        {!isViewMode && newLeadErrors.area && (
                          <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                            <AlertTriangle size={12} /> {newLeadErrors.area}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ================= ACTION BUTTONS ================= */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <button
                      onClick={handleCancelNewLead}
                      className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
                    >
                      {isViewMode ? "Close" : "Cancel"}
                    </button>

                    {!isViewMode && (
                      <button
                        onClick={handleSaveNewLead}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        {isEditMode ? "Update Lead" : "Register Lead"}
                      </button>
                    )}

                    {isViewMode && (
                      <button
                        onClick={() => {
                          setIsEditMode(true);
                          setLeadModalMode("edit");
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        Edit Lead
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lead Details/Edit Modal */}
        {openModal && activeLead && (
          <div className="fixed inset-0    bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex justify-between items-center p-4 border-b bg-blue-50">
                <h2 className="text-xl font-bold text-blue-700 flex items-center gap-2">
                  {isEditing ? <Edit3 size={24} /> : <Eye size={24} />}
                  {isEditing ? "Edit Lead" : "Lead Details"}
                </h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 hover:text-red-600 transition"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-4 md:p-6">
                {isEditing ? (
                  // Edit Form with Validation
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <User size={18} /> Customer Information
                        </h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name *
                          </label>
                          <input
                            type="text"
                            value={editFormData?.name || ""}
                            onChange={(e) =>
                              handleEditChange("name", e.target.value)
                            }
                            className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                              editErrors.name
                                ? "border-red-500 ring-1 ring-red-500"
                                : ""
                            }`}
                            placeholder="Enter customer name"
                          />
                          {editErrors.name && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {editErrors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            value={editFormData?.phone || ""}
                            onChange={(e) =>
                              handleEditChange("phone", e.target.value)
                            }
                            className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                              editErrors.phone
                                ? "border-red-500 ring-1 ring-red-500"
                                : ""
                            }`}
                            placeholder="Enter phone number"
                          />
                          {editErrors.phone && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {editErrors.phone}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            value={editFormData?.email || ""}
                            onChange={(e) =>
                              handleEditChange("email", e.target.value)
                            }
                            className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                              editErrors.email
                                ? "border-red-500 ring-1 ring-red-500"
                                : ""
                            }`}
                            placeholder="Enter email address"
                          />
                          {editErrors.email && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {editErrors.email}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Device Information */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Smartphone size={18} /> Device Information
                        </h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone Model *
                          </label>
                          <input
                            type="text"
                            value={editFormData?.phoneModel || ""}
                            onChange={(e) =>
                              handleEditChange("phoneModel", e.target.value)
                            }
                            className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                              editErrors.phoneModel
                                ? "border-red-500 ring-1 ring-red-500"
                                : ""
                            }`}
                            placeholder="Enter phone model"
                          />
                          {editErrors.phoneModel && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} />{" "}
                              {editErrors.phoneModel}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Issue Detail *
                          </label>
                          <input
                            type="text"
                            value={editFormData?.issueDetail || ""}
                            onChange={(e) =>
                              handleEditChange("issueDetail", e.target.value)
                            }
                            className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                              editErrors.issueDetail
                                ? "border-red-500 ring-1 ring-red-500"
                                : ""
                            }`}
                            placeholder="Enter issue detail"
                          />
                          {editErrors.issueDetail && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} />{" "}
                              {editErrors.issueDetail}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Address Information */}
                      <div className="space-y-4 md:col-span-2">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <MapPin size={18} /> Address Information
                        </h4>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Complete Address *
                          </label>
                          <textarea
                            value={editFormData?.address || ""}
                            onChange={(e) =>
                              handleEditChange("address", e.target.value)
                            }
                            className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                              editErrors.address
                                ? "border-red-500 ring-1 ring-red-500"
                                : ""
                            }`}
                            placeholder="Enter complete address"
                            rows="2"
                          />
                          {editErrors.address && (
                            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} /> {editErrors.address}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Pincode *
                            </label>
                            <input
                              type="text"
                              value={editFormData?.pincode || ""}
                              onChange={(e) =>
                                handleEditChange("pincode", e.target.value)
                              }
                              className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                                editErrors.pincode
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : ""
                              }`}
                              placeholder="Enter pincode"
                            />
                            {editErrors.pincode && (
                              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle size={12} /> {editErrors.pincode}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Area/Locality *
                            </label>
                            <input
                              type="text"
                              value={editFormData?.area || ""}
                              onChange={(e) =>
                                handleEditChange("area", e.target.value)
                              }
                              className={`w-full border p-2 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${
                                editErrors.area
                                  ? "border-red-500 ring-1 ring-red-500"
                                  : ""
                              }`}
                              placeholder="Enter area/locality"
                            />
                            {editErrors.area && (
                              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                <AlertTriangle size={12} /> {editErrors.area}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition"
                      >
                        <Save size={16} /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Lead Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                          <User size={20} /> Lead Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Lead ID
                            </label>
                            <p className="text-lg font-bold text-blue-600">
                              {activeLead.leadId}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Registration Date
                            </label>
                            <p className="text-sm text-gray-700 flex items-center gap-2">
                              <Calendar size={14} />{" "}
                              {activeLead.registrationDate}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Status
                            </label>
                            <span
                              className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                activeLead.status === "New"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : activeLead.status === "Complaint Registered"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {activeLead.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Customer Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                          <User size={20} /> Customer Information
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Full Name
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                              {activeLead.name}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Mobile Number
                            </label>
                            <p className="text-sm text-blue-600 flex items-center gap-2">
                              <Phone size={14} /> {activeLead.phone}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Email Address
                            </label>
                            <p className="text-sm text-gray-700 flex items-center gap-2">
                              <Mail size={14} /> {activeLead.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Device Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <Smartphone size={20} /> Device Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs font-medium text-gray-500">
                            Phone Model
                          </label>
                          <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Smartphone size={16} /> {activeLead.phoneModel}
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">
                            Issue Detail
                          </label>
                          <p className="text-sm text-gray-700 p-2 bg-gray-50 rounded border flex items-center gap-2">
                            <FileText size={14} /> {activeLead.issueDetail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 flex items-center gap-2">
                        <MapPin size={20} /> Address Information
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-gray-500">
                            Complete Address
                          </label>
                          <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded border">
                            {activeLead.address}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Pincode
                            </label>
                            <p className="text-lg font-bold text-gray-900">
                              {activeLead.pincode}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500">
                              Area/Locality
                            </label>
                            <p className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <MapPin size={16} /> {activeLead.area}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition"
                      >
                        <Edit3 size={16} /> Edit Lead
                      </button>
                      <button
                        onClick={() =>
                          handleViewOrRegisterComplaint(activeLead)
                        }
                        className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition"
                      >
                        <AlertCircle size={16} /> Register Complaint
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Complaint Registration Modal */}
        <ComplaintRegistrationModal
          open={showComplaintModal}
          onClose={() => {
            setShowComplaintModal(false);
            setSelectedLeadForComplaint(null);
          }}
          leadData={selectedLeadForComplaint}
          onSuccess={handleComplaintRegistrationSuccess}
        />
      </div>
    </div>
  );
};

export default Leads;
