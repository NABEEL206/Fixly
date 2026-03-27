import { BASE_URL } from "@/API/BaseURL";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { PERMISSIONS } from "@/config/permissions";
import { canAccess } from "@/utils/canAccess";
import { useAuth } from "@/auth/AuthContext";
import axiosInstance from "@/API/axiosInstance";
import { Eye, Edit, Trash2 } from "lucide-react";

// --- API Endpoints ---
const COMPLAINT_API = `${BASE_URL}/api/public/complaints/`;
const NEAREST_OPTIONS_API = `${BASE_URL}/api/complaints/nearest-options/`;

// --- STATUS OPTIONS ---
const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

// Helper for status styling
const getStatusClasses = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800 border border-yellow-300";
    case "Assigned":
      return "bg-blue-100 text-blue-800 border border-blue-300";
    case "In Progress":
      return "bg-indigo-100 text-indigo-800 border border-indigo-300";
    case "Resolved":
      return "bg-green-100 text-green-800 border border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border border-gray-300";
  }
};

export default function CustomerComplaintRegister() {
  const { user } = useAuth();
  const role = user?.role;

  const canView = canAccess(role, PERMISSIONS.customerComplaintSelf.view);
  const canCreate = canAccess(role, PERMISSIONS.customerComplaintSelf.create);
  const canEdit = canAccess(role, PERMISSIONS.customerComplaintSelf.edit);
  const canDelete = canAccess(role, PERMISSIONS.customerComplaintSelf.delete);

  // 📝 COMPLAINTS STATE
  const [myComplaints, setMyComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);

  // Modal states
  const [openForm, setOpenForm] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editComplaint, setEditComplaint] = useState(null);
  const [viewComplaint, setViewComplaint] = useState(null);

  // customer/complaint states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [issueCharCount, setIssueCharCount] = useState(0);
  const [addressCharCount, setAddressCharCount] = useState(0);

  // location states
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [pincode, setPincode] = useState("");
  const [areas, setAreas] = useState([]);
  const [area, setArea] = useState("");

  // assignment states
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedGrowTagId, setSelectedGrowTagId] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [franchises, setFranchises] = useState([]);
  const [otherShops, setOtherShops] = useState([]);
  const [assignedType, setAssignedType] = useState("");

  // STATUS FIELD
  const [status, setStatus] = useState("Assigned");

  // FIELD ERRORS
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeMessage, setPincodeMessage] = useState("");

  // Filter states
  const [filterType, setFilterType] = useState("all");
  const [filterId, setFilterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [search, setSearch] = useState("");
  
  // misc
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isFetchingNearest, setIsFetchingNearest] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [state, setState] = useState("");

  // errors state
  const [errors, setErrors] = useState({});

  // Constants for character limits
  const MAX_ADDRESS_CHARS = 200;
  const MAX_ISSUE_CHARS = 500;

  // Get unique created by list from complaints - using backend created_by_display
  const uniqueCreatedBy = useMemo(() => {
    const set = new Set();
    myComplaints.forEach((c) => {
      if (c.created_by_display) set.add(c.created_by_display);
    });
    return Array.from(set).sort();
  }, [myComplaints]);

  if (!canView) {
    return (
      <div className="p-10 text-center text-red-500 font-semibold">
        You do not have permission to access this page.
      </div>
    );
  }

  // --- UTILITY FUNCTION: Reset Form States ---
  const resetFormStates = useCallback(() => {
    setModel("");
    setIssue("");
    setIssueCharCount(0);
    setAddressCharCount(0);
    setPincode("");
    setArea("");
    setAreas([]);
    setAddressLine("");
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
    setPincodeMessage("");
    setState("");
    setErrors({});
    setIsSubmitting(false);
  }, []);

  // Function to populate user data
  const populateUserData = useCallback(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      
      const phoneNumber = user.customer_phone || user.phone || user.mobile || user.phone_number || "";
      setMobile(phoneNumber);

      if (phoneNumber && phoneNumber.length === 10) {
        validateMobile(phoneNumber);
      } else if (phoneNumber && phoneNumber.length !== 10) {
        setMobileError("Mobile number must be exactly 10 digits.");
      } else {
        setMobileError("");
      }
    }
  }, [user]);

  // ----------------------------------------------------------------
  // 🟢 VALIDATION UTILITY FUNCTIONS
  // ----------------------------------------------------------------
  const validateEmail = (email) => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(String(email).toLowerCase())) {
      setEmailError("Enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validateMobile = (mobile) => {
    if (!mobile.trim()) {
      setMobileError("Mobile number is required");
      return false;
    }
    const re = /^\d{10}$/;
    if (!re.test(String(mobile))) {
      setMobileError("Mobile number must be exactly 10 digits.");
      return false;
    }
    setMobileError("");
    return true;
  };

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validatePincode = (value) => {
    if (!value.trim()) {
      setPincodeError("Pincode is required");
      setPincodeMessage("Pincode is required");
      return false;
    }
    const re = /^\d{6}$/;
    if (!re.test(String(value))) {
      setPincodeError("Pincode must be exactly 6 digits.");
      setPincodeMessage("Pincode must be exactly 6 digits");
      return false;
    }
    setPincodeError("");
    setPincodeMessage("");
    return true;
  };

  // ----------------------------------------------------------------
  // 🟢 API: FETCH COMPLAINTS
  // ----------------------------------------------------------------
  const fetchMyComplaints = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const res = await axiosInstance.get(COMPLAINT_API);
      const data = res.data;
      const complaintsArray = Array.isArray(data) ? data : [];
      
      // Use backend-provided created_by_display field directly
      const complaintsWithCreator = complaintsArray.map(complaint => ({
        ...complaint,
        created_by_display: complaint.created_by_display || complaint.created_by || "Unknown",
        created_at: complaint.created_at || new Date().toISOString()
      }));
      
      setMyComplaints(complaintsWithCreator);
    } catch (error) {
      console.error("API Error:", error);
      toast.error("Failed to load complaints.");
      setMyComplaints([]);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  // Load complaints
  useEffect(() => {
    fetchMyComplaints();
  }, [fetchMyComplaints]);

  // Initialize user data on component mount
  useEffect(() => {
    if (user) {
      populateUserData();
    }
  }, [user, populateUserData]);

  // Populate user data when form opens
  useEffect(() => {
    if (openForm && !isEdit) {
      populateUserData();
    }
  }, [openForm, isEdit, populateUserData]);

  // ----------------------------------------------------------------
  // FILTER COMPLAINTS
  // ----------------------------------------------------------------
  useEffect(() => {
    let filtered = [...myComplaints];

    if (search) {
      filtered = filtered.filter((c) =>
        [
          c.customer_name,
          c.customer_phone,
          c.phone_model,
          c.issue_details,
          c.address_line,
          c.email,
          c.created_by_display,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    }

    if (filterType === "id" && filterId) {
      filtered = filtered.filter((c) => String(c.id) === filterId);
    } else if (filterType === "status" && filterStatus) {
      filtered = filtered.filter((c) => c.status === filterStatus);
    } else if (filterType === "created_by" && filterCreatedBy) {
      filtered = filtered.filter((c) => c.created_by_display === filterCreatedBy);
    }

    setFilteredComplaints(filtered);
  }, [search, filterType, filterId, filterStatus, filterCreatedBy, myComplaints]);

  // ----------------------------------------------------------------
  // API: FETCH NEAREST OPTIONS
  // ----------------------------------------------------------------
  const fetchNearestOptions = useCallback(async (pcode, selectedArea) => {
    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);

    if (!pcode || !selectedArea) return null;

    setIsFetchingNearest(true);
    try {
      const url = new URL(NEAREST_OPTIONS_API);
      url.searchParams.append("pincode", pcode);
      url.searchParams.append("area", selectedArea);

      const res = await axiosInstance.get(url.toString());
      const data = res.data;
      setFranchises(data.franchise_shops || []);
      setOtherShops(data.other_shops || []);
      setAvailableTags(data.growtags || []);
      return data;
    } catch (error) {
      console.error("Nearest Options API Error:", error);
      toast.error("Error fetching nearest assignment options.");
      return null;
    } finally {
      setIsFetchingNearest(false);
    }
  }, []);

  const handleAreaChange = (value) => {
    setArea(value);
    fetchNearestOptions(pincode, value);
  };

  const handleAssignTypeChange = (value) => {
    setAssignedType(value);
    setSelectedShopId("");
    setSelectedGrowTagId("");
  };

  const handleAddressChange = (value) => {
    if (value.length <= MAX_ADDRESS_CHARS) {
      setAddressLine(value);
      setAddressCharCount(value.length);
    }
  };

  const handleIssueChange = (value) => {
    if (value.length <= MAX_ISSUE_CHARS) {
      setIssue(value);
      setIssueCharCount(value.length);
    }
  };

  const handlePincode = async (value) => {
    const cleanedValue = value.replace(/\D/g, "").slice(0, 6);
    setPincode(cleanedValue);
    setArea("");
    setAreas([]);
    setPincodeError("");
    setPincodeMessage("");

    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);
    setSelectedShopId("");
    setSelectedGrowTagId("");
    setAssignedType("");

    if (!cleanedValue) {
      setPincodeMessage("Pincode is required");
      return;
    }
    if (!/^\d{6}$/.test(cleanedValue)) {
      setPincodeError("Pincode must be exactly 6 digits");
      setPincodeMessage("Pincode must be exactly 6 digits");
      return;
    }

    setIsPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${cleanedValue}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data[0]?.Status !== "Success") {
        setPincodeMessage("Invalid pincode. No location found");
        return;
      }
      const postOffices = data[0].PostOffice || [];
      setAreas(postOffices.map((p) => p.Name));
      setState(postOffices[0]?.State || "");
      setPincodeError("");
      setPincodeMessage("");
    } catch {
      setPincodeMessage("Network issue. Please check your internet connection");
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // EFFECT FOR EDIT MODE
  useEffect(() => {
    const initializeForm = async () => {
      if (isEdit && editComplaint) {
        setEmailError("");
        setMobileError("");
        setPincodeError("");

        setName(editComplaint.customer_name || "");
        setMobile(editComplaint.customer_phone || "");
        setModel(editComplaint.phone_model || "");
        setIssue(editComplaint.issue_details || "");
        setIssueCharCount((editComplaint.issue_details || "").length);
        setEmail(editComplaint.email || "");
        setPincode(editComplaint.pincode || "");
        setAddressLine(editComplaint.address_line || "");
        setAddressCharCount((editComplaint.address_line || "").length);
        setStatus(editComplaint.status || STATUS_OPTIONS[0]);

        const apiAssignment = editComplaint.assign_to || "";
        setAssignedType(
          apiAssignment === "othershop" ? "other_shops" : apiAssignment,
        );

        let assignmentID = "";
        if (apiAssignment === "franchise" || apiAssignment === "othershop") {
          assignmentID =
            editComplaint.assigned_shop?.id ||
            editComplaint.assigned_shop ||
            "";
          setSelectedShopId(String(assignmentID));
          setSelectedGrowTagId("");
        } else if (apiAssignment === "growtag") {
          assignmentID =
            editComplaint.assigned_Growtags?.id ||
            editComplaint.assigned_Growtags ||
            "";
          setSelectedGrowTagId(String(assignmentID));
          setSelectedShopId("");
        }

        let areaList = [];
        if (editComplaint.pincode && editComplaint.pincode.length === 6) {
          try {
            const res = await fetch(
              `https://api.postalpincode.in/pincode/${editComplaint.pincode}`,
            );
            const data = await res.json();
            if (data[0]?.Status === "Success") {
              areaList = data[0].PostOffice.map((p) => p.Name);
              setAreas(areaList);
              setState(data[0].PostOffice[0]?.State || "");
            }
          } catch (e) {
            console.error("Error fetching pincode details:", e);
          }
        }
        setAreas(areaList);
        setArea(editComplaint.area || "");

        if (editComplaint.area && editComplaint.pincode) {
          fetchNearestOptions(editComplaint.pincode, editComplaint.area);
        }
      }
    };

    initializeForm();
  }, [isEdit, editComplaint, fetchNearestOptions]);

  const validateRequiredFields = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!model.trim()) newErrors.model = "Phone model is required";
    if (!issue.trim()) newErrors.issue = "Issue details are required";
    if (issue.length < 5) newErrors.issue = "Issue details must be at least 5 characters";
    if (!addressLine.trim()) newErrors.addressLine = "Address is required";
    if (addressLine.length < 10) newErrors.addressLine = "Address must be at least 10 characters";
    if (!state) newErrors.state = "State is required";
    if (!area) newErrors.area = "Area is required";
    if (!pincode) newErrors.pincode = "Pincode is required";
    if (!mobile) newErrors.mobile = "Mobile number is required";
    if (!email) newErrors.email = "Email is required";

    if (!assignedType) {
      newErrors.assignType = "Please select assignment type";
    } else {
      if ((assignedType === "franchise" || assignedType === "other_shops") && !selectedShopId) {
        newErrors.assignEntity = "Please select a shop";
      }
      if (assignedType === "growtag" && !selectedGrowTagId) {
        newErrors.assignEntity = "Please select a GrowTag";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // SUBMISSION HANDLER
  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isMobileValid = validateMobile(mobile);
    const isPincodeValid = validatePincode(pincode);
    const isRequiredValid = validateRequiredFields();

    if (!isRequiredValid || !isEmailValid || !isMobileValid || !isPincodeValid) {
      toast.error("Please fix highlighted errors");
      return;
    }

    if (!assignedType || (!selectedShopId && !selectedGrowTagId)) {
      toast.error("Please select an assignment type and entity.");
      return;
    }

    let assignTypeAPI = assignedType;
    let fkFieldName = null;
    let assignedID = "";

    if (assignedType === "franchise") {
      assignedID = selectedShopId;
      fkFieldName = "assigned_shop";
      assignTypeAPI = "franchise";
    } else if (assignedType === "other_shops") {
      assignedID = selectedShopId;
      fkFieldName = "assigned_shop";
      assignTypeAPI = "othershop";
    } else if (assignedType === "growtag") {
      assignedID = selectedGrowTagId;
      fkFieldName = "assigned_Growtags";
      assignTypeAPI = "growtag";
    }

    const complaintData = {
      customer_name: name,
      customer_phone: mobile,
      phone_model: model,
      issue_details: issue,
      email: email,
      address_line: addressLine,
      state: state,
      pincode: pincode,
      area: area,
      assign_to: assignTypeAPI,
    };

    if (fkFieldName && assignedID) {
      complaintData[fkFieldName] = parseInt(assignedID, 10);
    }

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${COMPLAINT_API}${editComplaint.id}/` : COMPLAINT_API;
    const action = isEdit ? "Update" : "Register";

    setIsSubmitting(true);
    const submissionToast = toast.loading(`${action}ing complaint...`);

    try {
      const res = method === "POST"
        ? await axiosInstance.post(url, complaintData)
        : await axiosInstance.put(url, complaintData);

      const resData = res.data;

      if (isEdit) {
        setMyComplaints((prev) =>
          prev.map((c) => (c.id === editComplaint.id ? resData : c))
        );
      } else {
        setMyComplaints((prev) => [...prev, resData]);
      }

      toast.success(`Complaint ${isEdit ? "updated" : "registered"} successfully!`, {
        id: submissionToast,
      });

      setOpenForm(false);
      setIsEdit(false);
      setEditComplaint(null);
      resetFormStates();
    } catch (error) {
      console.error("API Submission Error:", error);
      toast.error(`${action} failed. Please try again.`, {
        id: submissionToast,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // VIEW MODAL HANDLER
  const handleView = (complaint) => {
    setViewComplaint(complaint);
    setOpenViewModal(true);
  };

  // EDIT HANDLER
  const handleEdit = (c) => {
    if (!canEdit) {
      toast.error("You don't have permission to edit complaints");
      return;
    }
    // Check if current user is the creator (based on created_by_display)
    const isCreator = c.created_by_display === user?.name || 
                      c.created_by_display === `customer - ${user?.name}`;
    if (!isCreator) {
      toast.error("You can only edit your own complaints");
      return;
    }
    setEditComplaint(c);
    setIsEdit(true);
    setOpenForm(true);
  };

  // DELETE HANDLER
  const handleDelete = (id, createdByDisplay) => {
    // Check if current user is the creator
    const isCreator = createdByDisplay === user?.name || 
                      createdByDisplay === `customer - ${user?.name}`;
    if (!isCreator) {
      toast.error("You can only delete your own complaints");
      return;
    }
    
    toast.dismiss();
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete complaint #{id}?
          </p>
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
                const dt = toast.loading(`Deleting complaint #${id}...`);
                try {
                  await axiosInstance.delete(`${COMPLAINT_API}${id}/`);
                  setMyComplaints((prev) => prev.filter((c) => c.id !== id));
                  toast.success(`Complaint #${id} deleted successfully`, { id: dt });
                } catch (error) {
                  console.error("API Deletion Error:", error);
                  toast.error("Failed to delete complaint", { id: dt });
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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">
          My Complaints
        </h1>

        {canCreate && (
          <button
            onClick={() => {
              setOpenForm(true);
              setIsEdit(false);
              setEditComplaint(null);
              resetFormStates();
            }}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 md:px-5 md:py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all text-sm md:text-base font-semibold"
          >
            + Register New Complaint
          </button>
        )}
      </div>

      {/* FILTER SECTION */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-700">Filters</h3>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full md:w-auto">
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
                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
              >
                <option value="all">All Complaints</option>
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
                  className="border px-3 py-2 rounded-lg w-28 focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                />
                {filterId && (
                  <button
                    onClick={() => setFilterId("")}
                    className="text-red-500 hover:text-red-700 text-sm"
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
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {filterStatus && (
                  <button
                    onClick={() => setFilterStatus("")}
                    className="text-red-500 hover:text-red-700 text-sm"
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
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm"
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
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-3 py-2 rounded-lg w-full sm:w-56 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {isFetchingData && (
        <div className="text-center text-blue-600 font-semibold mb-4">
          Loading complaints...
        </div>
      )}

      {/* COMPLAINTS TABLE */}
      <div className="mt-6 md:mt-10 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-3 md:p-4 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-700 text-sm md:text-base">
            Complaint Records ({filteredComplaints.length} / {myComplaints.length})
          </h2>
        </div>

        {filteredComplaints.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No complaints found matching your filters.
          </div>
        ) : (
          <>
            {/* DESKTOP TABLE */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Customer</th>
                    <th className="p-3 text-left">Mobile</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Model</th>
                    <th className="p-3 text-left">Address</th>
                    <th className="p-3 text-left">Assigned To</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Created By</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((c) => {
                    const isCurrentUserCreator = c.created_by_display === user?.name || 
                                                  c.created_by_display === `customer - ${user?.name}`;
                    return (
                      <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="p-3 font-mono text-xs text-gray-600">#{c.id}</td>
                        <td className="p-3 font-medium text-gray-800 max-w-[150px] truncate" title={c.customer_name}>
                          {c.customer_name}
                        </td>
                        <td className="p-3 text-gray-700">{c.customer_phone}</td>
                        <td className="p-3 text-gray-600 text-xs max-w-[150px] truncate" title={c.email}>
                          {c.email}
                        </td>
                        <td className="p-3 text-gray-700 font-medium max-w-[120px] truncate" title={c.phone_model}>
                          {c.phone_model}
                        </td>
                        <td className="p-3 text-gray-600 max-w-[180px] truncate" title={c.address_line}>
                          {c.address_line}
                        </td>
                        <td className="p-3">
                          <div className="max-w-[150px]">
                            <span className="text-blue-600 font-medium truncate block" title={
                              c.assigned_to_details
                                ? c.assigned_to_details.name || `Shop ID: ${c.assigned_to_details.id}`
                                : "Not Assigned"
                            }>
                              {c.assigned_to_details
                                ? c.assigned_to_details.name || `Shop ID: ${c.assigned_to_details.id}`
                                : "Not Assigned"}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">
                              ({c.assign_to === "othershop" ? "Other Shop" : c.assign_to || "N/A"})
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusClasses(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-center text-xs">
                          {isCurrentUserCreator ? (
                            <span className="text-green-600 font-medium">Self</span>
                          ) : (
                            <span className="text-gray-500 max-w-[100px] truncate block" title={c.created_by_display}>
                              {c.created_by_display || "Unknown"}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => handleView(c)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {canEdit && isCurrentUserCreator && (
                              <button
                                onClick={() => handleEdit(c)}
                                className="p-1.5 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && isCurrentUserCreator && (
                              <button
                                onClick={() => handleDelete(c.id, c.created_by_display)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* TABLET VIEW (2 columns layout) */}
            <div className="hidden md:block lg:hidden p-4">
              <div className="grid grid-cols-2 gap-4">
                {filteredComplaints.map((c) => {
                  const isCurrentUserCreator = c.created_by_display === user?.name || 
                                                c.created_by_display === `customer - ${user?.name}`;
                  return (
                    <div key={c.id} className="border rounded-xl p-4 space-y-3 bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-xs font-mono text-gray-500">ID: #{c.id}</span>
                          <p className="font-semibold text-gray-800 mt-1">{c.customer_name}</p>
                          <p className="text-xs text-gray-600">{c.customer_phone}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(c.status)}`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="text-sm space-y-2">
                        <p><span className="font-medium">Model:</span> {c.phone_model}</p>
                        <p><span className="font-medium">Address:</span> <span className="text-gray-600 text-xs">{c.address_line.substring(0, 60)}...</span></p>
                        <div>
                          <span className="font-medium">Assigned To:</span>
                          <div className="mt-1">
                            <span className="text-blue-600 text-sm">
                              {c.assigned_to_details
                                ? c.assigned_to_details.name || `Shop ID: ${c.assigned_to_details.id}`
                                : "Not Assigned"}
                            </span>
                            <span className="text-xs text-gray-500 ml-2 capitalize">
                              ({c.assign_to === "othershop" ? "Other Shop" : c.assign_to || "N/A"})
                            </span>
                          </div>
                        </div>
                        <p><span className="font-medium">Created By:</span> {isCurrentUserCreator ? "Self" : (c.created_by_display || "Unknown")}</p>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => handleView(c)}
                          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center justify-center gap-2"
                        >
                          <Eye size={14} /> View
                        </button>
                        {canEdit && isCurrentUserCreator && (
                          <button
                            onClick={() => handleEdit(c)}
                            className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 flex items-center justify-center gap-2"
                          >
                            <Edit size={14} /> Edit
                          </button>
                        )}
                        {canDelete && isCurrentUserCreator && (
                          <button
                            onClick={() => handleDelete(c.id, c.created_by_display)}
                            className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center justify-center gap-2"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* MOBILE VIEW (1 column) */}
            <div className="md:hidden p-4 space-y-4">
              {filteredComplaints.map((c) => {
                const isCurrentUserCreator = c.created_by_display === user?.name || 
                                              c.created_by_display === `customer - ${user?.name}`;
                return (
                  <div key={c.id} className="border rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono text-gray-500">ID: #{c.id}</span>
                        <p className="font-semibold text-gray-800 mt-1">{c.customer_name}</p>
                        <p className="text-xs text-gray-600">{c.customer_phone}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(c.status)}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-sm space-y-2">
                      <p><span className="font-medium">Model:</span> {c.phone_model}</p>
                      <p><span className="font-medium">Address:</span> <span className="text-gray-600 text-xs">{c.address_line.substring(0, 80)}...</span></p>
                      <div>
                        <span className="font-medium">Assigned To:</span>
                        <div className="mt-1">
                          <span className="text-blue-600 text-sm">
                            {c.assigned_to_details
                              ? c.assigned_to_details.name || `Shop ID: ${c.assigned_to_details.id}`
                              : "Not Assigned"}
                          </span>
                          <span className="text-xs text-gray-500 ml-2 capitalize">
                            ({c.assign_to === "othershop" ? "Other Shop" : c.assign_to || "N/A"})
                          </span>
                        </div>
                      </div>
                      <p><span className="font-medium">Created By:</span> {isCurrentUserCreator ? "Self" : (c.created_by_display || "Unknown")}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleView(c)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 flex items-center justify-center gap-2"
                      >
                        <Eye size={14} /> View Details
                      </button>
                      {canEdit && isCurrentUserCreator && (
                        <button
                          onClick={() => handleEdit(c)}
                          className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 flex items-center justify-center gap-2"
                        >
                          <Edit size={14} /> Edit
                        </button>
                      )}
                      {canDelete && isCurrentUserCreator && (
                        <button
                          onClick={() => handleDelete(c.id, c.created_by_display)}
                          className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center justify-center gap-2"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* VIEW MODAL */}
      {openViewModal && viewComplaint && (
        <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 md:p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg md:text-xl font-semibold text-blue-700">
                Complaint Details #{viewComplaint.id}
              </h2>
              <button
                onClick={() => setOpenViewModal(false)}
                className="text-gray-500 hover:text-red-600 text-xl"
              >
                ✖
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-4">
              {/* Customer Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Name</label>
                    <p className="text-gray-800 font-medium">{viewComplaint.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Mobile Number</label>
                    <p className="text-gray-800 font-medium">{viewComplaint.customer_phone}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <p className="text-gray-800 font-medium">{viewComplaint.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Phone Model</label>
                    <p className="text-gray-800 font-medium">{viewComplaint.phone_model}</p>
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Complaint Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Issue Details</label>
                    <p className="text-gray-800 mt-1 whitespace-pre-wrap">{viewComplaint.issue_details}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getStatusClasses(viewComplaint.status)}`}>
                        {viewComplaint.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Location Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-gray-500">Address</label>
                    <p className="text-gray-800">{viewComplaint.address_line}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Area</label>
                    <p className="text-gray-800">{viewComplaint.area}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">State</label>
                    <p className="text-gray-800">{viewComplaint.state}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Pincode</label>
                    <p className="text-gray-800">{viewComplaint.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Assignment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Assigned To</label>
                    <p className="text-gray-800">
                      {viewComplaint.assigned_to_details
                        ? viewComplaint.assigned_to_details.name ||
                          `Shop ID: ${viewComplaint.assigned_to_details.id}`
                        : "Not Assigned"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Assignment Type</label>
                    <p className="text-gray-800 capitalize">
                      {viewComplaint.assign_to === "othershop"
                        ? "Other Shop"
                        : viewComplaint.assign_to || "Not Assigned"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Created By</label>
                    <p className="text-gray-800">{viewComplaint.created_by_display || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Created At</label>
                    <p className="text-gray-800">
                      {viewComplaint.created_at
                        ? new Date(viewComplaint.created_at).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  {viewComplaint.updated_at && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Last Updated</label>
                      <p className="text-gray-800">
                        {new Date(viewComplaint.updated_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 md:p-6 pt-0">
              <button
                onClick={() => setOpenViewModal(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Close
              </button>
              {canEdit && (viewComplaint.created_by_display === user?.name || 
                           viewComplaint.created_by_display === `customer - ${user?.name}`) && (
                <button
                  onClick={() => {
                    setOpenViewModal(false);
                    handleEdit(viewComplaint);
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                >
                  Edit Complaint
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {openForm && (
        <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg md:text-xl font-semibold text-blue-700">
                {isEdit ? "Edit Complaint" : "Register Complaint"}
              </h2>
              <button
                onClick={() => setOpenForm(false)}
                className="text-gray-500 hover:text-red-600 text-xl"
                disabled={isSubmitting}
              >
                ✖
              </button>
            </div>

            <div className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={name}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-100 border-gray-300"
                      placeholder="Customer Name"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={mobile || ""}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-100 border-gray-300"
                      placeholder="Mobile Number"
                    />
                    {mobileError && <p className="text-red-500 text-xs mt-1">{mobileError}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-100 border-gray-300"
                      placeholder="Email Address"
                    />
                    {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Phone Model <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full p-2 border rounded-lg border-gray-300"
                      placeholder="Phone Model"
                      disabled={isSubmitting}
                    />
                    {errors.model && <p className="text-red-500 text-xs mt-1">{errors.model}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <input
                      value={status}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-100 border-gray-300"
                    />
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        value={pincode}
                        onChange={(e) => handlePincode(e.target.value)}
                        className={`w-full p-2 border rounded-lg ${pincodeError || pincodeMessage ? "border-red-500" : "border-gray-300"}`}
                        placeholder="Pincode (6 digits)"
                        maxLength={6}
                        disabled={isSubmitting}
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-2 top-2.5">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                    {(pincodeMessage || pincodeError) && (
                      <p className="text-red-500 text-xs mt-1">{pincodeMessage || pincodeError}</p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={state}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-100 border-gray-300"
                      placeholder="State (auto filled)"
                    />
                    {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Area <span className="text-red-500">*</span>
                    </label>
                    {areas.length > 0 ? (
                      <select
                        value={area}
                        onChange={(e) => handleAreaChange(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white border-gray-300"
                        disabled={isSubmitting}
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
                        readOnly
                        placeholder="Area (select pincode first)"
                        className="w-full p-2 border rounded-lg bg-gray-100 border-gray-300"
                        disabled
                      />
                    )}
                    {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area}</p>}
                  </div>

                  <div className="flex flex-col md:col-span-2">
                    <label className="text-xs font-medium text-gray-700 mb-1">
                      Address Line <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <textarea
                        value={addressLine}
                        onChange={(e) => handleAddressChange(e.target.value)}
                        className="w-full p-2 border rounded-lg border-gray-300 pr-16 resize-none"
                        placeholder="Address Line"
                        rows="2"
                        maxLength={MAX_ADDRESS_CHARS}
                        disabled={isSubmitting}
                      />
                      <div className="absolute bottom-2 right-3 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                        {addressCharCount}/{MAX_ADDRESS_CHARS}
                      </div>
                    </div>
                    {errors.addressLine && <p className="text-red-500 text-xs mt-1">{errors.addressLine}</p>}
                    {addressLine && addressLine.length < 10 && !errors.addressLine && (
                      <p className="text-orange-500 text-xs mt-1">
                        {10 - addressLine.length} more characters needed (minimum 10)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-medium text-gray-700 mb-1">
                    Issue Details <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={issue}
                      onChange={(e) => handleIssueChange(e.target.value)}
                      className="w-full p-2 border rounded-lg border-gray-300 pr-16 resize-none"
                      placeholder="Issue Details"
                      rows="3"
                      maxLength={MAX_ISSUE_CHARS}
                      disabled={isSubmitting}
                    />
                    <div className="absolute bottom-2 right-3 text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {issueCharCount}/{MAX_ISSUE_CHARS}
                    </div>
                  </div>
                  {errors.issue && <p className="text-red-500 text-xs mt-1">{errors.issue}</p>}
                  {issue && issue.length < 5 && !errors.issue && (
                    <p className="text-orange-500 text-xs mt-1">
                      {5 - issue.length} more characters needed (minimum 5)
                    </p>
                  )}
                </div>

                <div className={`p-3 border rounded-lg bg-gray-50 ${errors.assignType || errors.assignEntity ? "border-red-500" : "border-gray-300"}`}>
                  <label className={`font-semibold block mb-2 ${errors.assignType || errors.assignEntity ? "text-red-600" : "text-gray-700"}`}>
                    Assign To: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={assignedType}
                    onChange={(e) => handleAssignTypeChange(e.target.value)}
                    className="w-full p-2 border rounded-lg mb-2 bg-white border-gray-300"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Type</option>
                    <option value="franchise">Franchise ({franchises.length})</option>
                    <option value="other_shops">Other Shops ({otherShops.length})</option>
                    <option value="growtag">GrowTags ({availableTags.length})</option>
                  </select>
                  {errors.assignType && <p className="text-red-500 text-xs mt-1">{errors.assignType}</p>}

                  <div>
                    {isFetchingNearest && (
                      <p className="text-center text-gray-600 text-xs py-3">Fetching nearest options...</p>
                    )}

                    {(assignedType === "franchise" || assignedType === "other_shops") && !isFetchingNearest && (
                      <select
                        value={selectedShopId}
                        onChange={(e) => setSelectedShopId(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white border-gray-300"
                        disabled={isSubmitting}
                      >
                        <option value="">Select {assignedType === "franchise" ? "Franchise" : "Other Shop"}</option>
                        {(assignedType === "franchise" ? franchises : otherShops).map((s) => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    )}

                    {assignedType === "growtag" && !isFetchingNearest && (
                      <select
                        value={selectedGrowTagId}
                        onChange={(e) => setSelectedGrowTagId(e.target.value)}
                        className="w-full p-2 border rounded-lg bg-white border-gray-300"
                        disabled={isSubmitting}
                      >
                        <option value="">Select GrowTag</option>
                        {availableTags.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    )}
                    {errors.assignEntity && <p className="text-red-500 text-xs mt-1">{errors.assignEntity}</p>}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEdit ? "Updating..." : "Submitting..."}
                    </>
                  ) : isEdit ? "Update Complaint" : "Submit Complaint"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}