import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/API/BaseURL";

// --- API Endpoints ---
const COMPLAINT_API = `${BASE_URL}/api/complaints/`;
const NEAREST_OPTIONS_API = `${BASE_URL}/api/complaints/nearest-options/`;

// --- STATUS OPTIONS ---
const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

// Helper for status styling (Used in the table)
const getStatusClasses = (status) => {
  switch (status) {
    case "Pending":
      return "bg-yellow-100 text-yellow-800";
    case "Assigned":
      return "bg-blue-100 text-blue-800";
    case "In Progress":
      return "bg-indigo-100 text-indigo-800";
    case "Resolved":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function Complaints() {
  // net,mwrong pincode showing states
  const [pincodeMessage, setPincodeMessage] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  // ✅ NEW: Initialize navigate for routing
  const navigate = useNavigate();

  // 📝 Local complaints state (replacing GlobalContext)
  const [complaints, setComplaints] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editComplaint, setEditComplaint] = useState(null);

  // ✅ NEW: State for View Modal
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // ✅ NEW: Filter states
  const [filterType, setFilterType] = useState("all"); // 'all', 'id', 'status'
  const [filterId, setFilterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  // ✅ BULK SELECTION STATE
  const [selectedIds, setSelectedIds] = useState([]);

  // customer/complaint states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // location states
  const [password, setPassword] = useState("");
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

  // ✅ NEW STATE FOR STATUS FIELD
  const [status, setStatus] = useState("Assigned"); // Default to "assigned"

  // 🛑 NEW STATE FOR FIELD ERRORS
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");

  // states//eye icon
  const [state, setState] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // misc
  const [search, setSearch] = useState("");
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isFetchingNearest, setIsFetchingNearest] = useState(false);
  const [assignError, setAssignError] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  // pincode er
  // Add to your state declarations near the top:
  const [pincodeError, setPincodeError] = useState("");

  // auth
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");

    const headers = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  const validateRequiredFields = () => {
    const errors = {};

    if (!name.trim()) errors.name = "Customer name is required";
    if (!mobile.trim()) errors.mobile = "Mobile number is required";
    if (!email.trim()) errors.email = "Email is required";
    if (!password.trim()) errors.password = "Password is required";
    if (!model.trim()) errors.model = "Phone model is required";
    if (!issue.trim()) errors.issue = "Issue details are required";
    if (!addressLine.trim()) errors.addressLine = "Address is required";
    if (!state.trim()) errors.state = "State is required";
    if (!pincode.trim()) errors.pincode = "Pincode is required";
    if (!area.trim()) errors.area = "Area is required";
    if (!assignedType.trim())
      errors.assignedType = "Assignment type is required";

    if (
      (assignedType === "franchise" || assignedType === "other_shops") &&
      !selectedShopId
    ) {
      errors.assignment = "Please select a shop";
    }

    if (assignedType === "growtag" && !selectedGrowTagId) {
      errors.assignment = "Please select a grow tag";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // --- UTILITY FUNCTION: Reset Form States ---
  const resetFormStates = useCallback(() => {
    // Reset customer/complaint states
    setName("");
    setMobile("");
    setModel("");
    setIssue("");
    // Reset location states
    setPincode("");
    setArea("");
    setAreas([]);
    setState("");
    setPassword("");
    setEmail("");
    setAddressLine("");
    setSelectedShopId("");
    setSelectedGrowTagId("");
    setAssignedType("");
    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);
    // Reset Status
    setStatus("Assigned");
    // Reset Errors
    setEmailError("");
    setMobileError("");
    setPincodeError(""); // Add this line
    setPincodeMessage(""); // Also reset pincode message
    setFieldErrors({});
    setAssignError(false);
    setFormTouched(false);
  }, []);

  // ----------------------------------------------------------------
  // 🟢 VALIDATION UTILITY FUNCTIONS
  // ----------------------------------------------------------------

  /**
   * Validates email format and sets the error state.
   * @returns {boolean} True if valid, false otherwise.
   */
  // ✅ EMAIL
  const validateEmail = (value) => {
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }

    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(value)) {
      setEmailError("Enter a valid email address");
      return false;
    }

    setEmailError("");
    return true;
  };

  // ✅ MOBILE
  const validateMobile = (value) => {
    if (!value.trim()) {
      setMobileError("Mobile number is required");
      return false;
    }

    const re = /^\d{10}$/;
    if (!re.test(value)) {
      setMobileError("Mobile number must be exactly 10 digits");
      return false;
    }

    setMobileError("");
    return true;
  };

  // ✅ PINCODE
  // ✅ PINCODE
  const validatePincode = (value) => {
    if (!value.trim()) {
      setPincodeError("Pincode is required");
      setPincodeMessage("Pincode is required");
      return false;
    }

    const re = /^\d{6}$/;
    if (!re.test(value)) {
      setPincodeError("Pincode must be exactly 6 digits");
      setPincodeMessage("Pincode must be exactly 6 digits");
      return false;
    }

    setPincodeError("");
    setPincodeMessage("");
    return true;
  };

  // ----------------------------------------------------------------
  // 🟢 API: FETCH ALL COMPLAINTS (GET)
  // ----------------------------------------------------------------
  const fetchComplaints = useCallback(async () => {
    try {
      const res = await fetch(COMPLAINT_API, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          toast.error("Session expired. Please log in again.");
          // Optional: redirect to login
          // navigate("/login");
          return;
        }
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();

      // Handle both array and object responses
      if (Array.isArray(data)) {
        setComplaints(data);
      } else if (data && Array.isArray(data.results)) {
        // Handle paginated responses
        setComplaints(data.results);
      } else if (data && typeof data === "object") {
        // Handle single object response
        setComplaints([data]);
      } else {
        setComplaints([]);
      }
    } catch (error) {
      console.error("Fetch complaints error:", error);
      toast.error("Failed to load complaints.");
      setComplaints([]);
    }
  }, []);

  // Load complaints on initial mount
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  // ----------------------------------------------------------------
  // API: FETCH NEAREST OPTIONS (Franchises, Other Shops, GrowTags)
  // ----------------------------------------------------------------
  const fetchNearestOptions = useCallback(
    async (pcode, selectedArea) => {
      console.log("Fetching nearest options for:", pcode, selectedArea);

      if (!/^\d{6}$/.test(pcode) || !selectedArea) {
        console.log("Invalid inputs for nearest options");
        return;
      }

      setFranchises([]);
      setOtherShops([]);
      setAvailableTags([]);
      setSelectedShopId("");
      setSelectedGrowTagId("");

      setIsFetchingNearest(true);

      try {
        const url = new URL(NEAREST_OPTIONS_API);
        url.searchParams.set("pincode", pcode);
        url.searchParams.set("area", selectedArea);

        console.log("Fetching from:", url.toString());

        const res = await fetch(url.toString(), {
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          console.error("Nearest API failed:", res.status);
          throw new Error(`Nearest API failed: ${res.status}`);
        }

        const data = await res.json();
        console.log("Nearest options data:", data);

        setFranchises(Array.isArray(data.franchise) ? data.franchise : []);
        setOtherShops(Array.isArray(data.othershop) ? data.othershop : []);
        setAvailableTags(Array.isArray(data.growtag) ? data.growtag : []);

        // If editing, try to pre-select the saved option
        if (isEdit && editComplaint) {
          const assignType = editComplaint.assign_to;
          if (assignType === "franchise" && editComplaint.assigned_shop) {
            const shopId = editComplaint.assigned_shop.toString();
            if (data.franchise?.some((f) => f.id.toString() === shopId)) {
              setSelectedShopId(shopId);
            }
          } else if (
            assignType === "othershop" &&
            editComplaint.assigned_shop
          ) {
            const shopId = editComplaint.assigned_shop.toString();
            if (data.othershop?.some((s) => s.id.toString() === shopId)) {
              setSelectedShopId(shopId);
            }
          } else if (
            assignType === "growtag" &&
            editComplaint.assigned_Growtags
          ) {
            const tagId = editComplaint.assigned_Growtags.toString();
            if (data.growtag?.some((g) => g.id.toString() === tagId)) {
              setSelectedGrowTagId(tagId);
            }
          }
        }
      } catch (err) {
        console.error("Nearest Options Error:", err);
        toast.error("Failed to load nearest assignment options");
      } finally {
        setIsFetchingNearest(false);
      }
    },
    [isEdit, editComplaint]
  );

  // 🔥 HANDLE AREA CHANGE - Triggers Lat/Long fetch
  const handleAreaChange = (value) => {
    setArea(value);
    setFieldErrors((p) => ({ ...p, area: "" }));

    // 🔥 Only fetch when pincode is valid
    if (/^\d{6}$/.test(pincode)) {
      fetchNearestOptions(pincode, value);
    }
  };

  // 🔥 HANDLER: Clears previous specific assignment when the type changes - UPDATED
  const handleAssignTypeChange = (value) => {
    setAssignedType(value);
    setSelectedShopId("");
    setSelectedGrowTagId("");
    setAssignError(false);

    // If we already have nearest options loaded, pre-select if editing
    if (isEdit && editComplaint) {
      if (value === "franchise" && editComplaint.assign_to === "franchise") {
        setSelectedShopId(editComplaint.assigned_shop?.toString() || "");
      } else if (
        value === "other_shops" &&
        editComplaint.assign_to === "othershop"
      ) {
        setSelectedShopId(editComplaint.assigned_shop?.toString() || "");
      } else if (value === "growtag" && editComplaint.assign_to === "growtag") {
        setSelectedGrowTagId(editComplaint.assigned_Growtags?.toString() || "");
      }
    }
  };

  // 🔥 HANDLE PINCODE → FETCH MULTIPLE AREAS - UPDATED
  const handlePincode = async (value, fromEdit = false) => {
    setPincode(value);
    setPincodeError("");
    setPincodeMessage("");

    if (!value) {
      setPincodeMessage("Pincode is required");
      setAreas([]);
      setArea("");
      setState("");
      return;
    }

    if (!/^\d{6}$/.test(value)) {
      setPincodeError("Pincode must be exactly 6 digits");
      setPincodeMessage("Pincode must be exactly 6 digits");
      setAreas([]);
      setArea("");
      setState("");
      return;
    }

    setPincodeMessage("");
    setIsPincodeLoading(true);

    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);

      if (!res.ok) throw new Error("NETWORK");

      const data = await res.json();

      if (data[0]?.Status !== "Success") {
        setPincodeMessage("Invalid pincode. No location found");
        setAreas([]);
        setArea("");
        setState("");
        return;
      }

      const postOffices = data[0].PostOffice || [];

      // Set areas and state
      setAreas(postOffices.map((p) => p.Name));
      setState(postOffices[0].State);
      setFieldErrors((p) => ({ ...p, state: "" }));

      // If editing and area exists in complaint, try to select it
      if (fromEdit && editComplaint?.area && postOffices.length > 0) {
        // Check if the saved area exists in the fetched areas
        const areaExists = postOffices.some(
          (p) => p.Name === editComplaint.area
        );
        if (areaExists) {
          setArea(editComplaint.area);
          // Fetch nearest options after a small delay
          setTimeout(() => {
            fetchNearestOptions(value, editComplaint.area);
          }, 300);
        }
      }
    } catch {
      setPincodeMessage("Network issue. Please check your internet connection");
      setAreas([]);
      setArea("");
      setState("");
    } finally {
      setIsPincodeLoading(false);
    }
  };

  // ----------------------------------------------------------------
  // 🔥 EFFECT FOR EDIT MODE INITIALIZATION - UPDATED
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!isEdit || !editComplaint) return;

    // Populate all form fields from editComplaint
    setName(editComplaint.customer_name || "");
    setMobile(editComplaint.customer_phone || "");
    setEmail(editComplaint.email || "");
    setPassword(editComplaint.password || "");
    setModel(editComplaint.phone_model || "");
    setIssue(editComplaint.issue_details || "");
    setAddressLine(editComplaint.address || "");
    setStatus(editComplaint.status || "Assigned");

    // Set pincode and area - these will trigger the pincode API
    setPincode(editComplaint.pincode || "");
    setArea(editComplaint.area || "");
    setState(editComplaint.state || "");

    // Set assignment type and IDs based on the complaint data
    const assignType = editComplaint.assign_to || "";
    let shopId = "";
    let growtagId = "";

    if (assignType === "franchise" || assignType === "othershop") {
      shopId = editComplaint.assigned_shop || "";
    } else if (assignType === "growtag") {
      growtagId = editComplaint.assigned_Growtags || "";
    }

    setAssignedType(assignType);
    setSelectedShopId(shopId);
    setSelectedGrowTagId(growtagId);

    // Fetch pincode data and nearest options
    (async () => {
      if (editComplaint.pincode) {
        await handlePincode(editComplaint.pincode, true);
      }

      if (editComplaint.area) {
        // Wait a bit for areas to load before setting area
        setTimeout(() => {
          setArea(editComplaint.area);
          fetchNearestOptions(editComplaint.pincode, editComplaint.area);
        }, 500);
      }
    })();
  }, [isEdit, editComplaint]);

  // ----------------------------------------------------------------
  // SUBMISSION HANDLER (POST / PUT) - Correctly sets FK ID
  // ----------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔴 User clicked submit
    setFormTouched(true);

    // -------------------------------
    // 1️⃣ ASSIGNMENT VALIDATION
    // -------------------------------
    const invalidAssign =
      !assignedType ||
      (assignedType === "growtag" && !selectedGrowTagId) ||
      ((assignedType === "franchise" || assignedType === "other_shops") &&
        !selectedShopId);

    setAssignError(invalidAssign);

    // -------------------------------
    // 2️⃣ REQUIRED FIELD VALIDATION
    // -------------------------------
    const isRequiredValid = validateRequiredFields();

    if (invalidAssign || !isRequiredValid) {
      if (invalidAssign) {
        toast.error("Please assign the complaint");
      } else {
        toast.error("Please fill all required fields");
      }
      return;
    }

    // -------------------------------
    // 3️⃣ FORMAT VALIDATIONS
    // -------------------------------
    const isEmailValid = validateEmail(email);
    const isMobileValid = validateMobile(mobile);
    const isPincodeValid = validatePincode(pincode);

    if (!isEmailValid || !isMobileValid || !isPincodeValid) {
      toast.error("Please correct the highlighted form errors.");
      return;
    }

    // -------------------------------
    // 4️⃣ AREA CHECK
    // -------------------------------
    if (!area) {
      toast.error("Please select an Area after entering the Pincode.");
      return;
    }

    // -------------------------------
    // 5️⃣ ASSIGNMENT MAPPING (API)
    // -------------------------------
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

    // -------------------------------
    // 6️⃣ BUILD PAYLOAD
    // -------------------------------
    // -------------------------------
    // 6️⃣ BUILD PAYLOAD - UPDATED
    // -------------------------------
    const complaintData = {
      customer_name: name,
      customer_phone: mobile,
      phone_model: model,
      issue_details: issue,
      password,
      email,
      address: addressLine,
      state,
      pincode,
      area,
      status,
      assign_to: assignTypeAPI,
      // Preserve order_confirmation when editing
      order_confirmation: isEdit ? editComplaint.order_confirmation : false,
    };

    if (fkFieldName && assignedID) {
      complaintData[fkFieldName] = parseInt(assignedID, 10);
    }

    if (fkFieldName && assignedID) {
      complaintData[fkFieldName] = parseInt(assignedID, 10);
    }

    // -------------------------------
    // 7️⃣ API SUBMISSION
    // -------------------------------
    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${COMPLAINT_API}${editComplaint.id}/` : COMPLAINT_API;

    const action = isEdit ? "Update" : "Register";
    const submissionToast = toast.loading(`${action}ing complaint...`);

    try {
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(complaintData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(errorData));
      }

      await fetchComplaints();

      toast.success(
        `Complaint ${isEdit ? "updated" : "registered"} successfully!`,
        { id: submissionToast }
      );

      setOpenForm(false);
      setIsEdit(false);
      setEditComplaint(null);
      resetFormStates();
    } catch (error) {
      console.error("API Error:", error);
      toast.error(`${action} failed. See console for details.`, {
        id: submissionToast,
      });
    }
  };

  // ----------------------------------------------------------------
  // ✅ NEW: DYNAMIC STATUS UPDATE HANDLER (PATCH)
  const handleStatusUpdate = async (complaintId, newStatus) => {
    const originalComplaints = complaints;
    const originalStatus = originalComplaints.find(
      (c) => c.id === complaintId
    )?.status;

    // optimistic UI
    setComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
    );

    // 📝 LOADING TOAST
    const statusToast = toast.loading(`Updating status to ${newStatus}...`);

    try {
      const res = await fetch(`${COMPLAINT_API}${complaintId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setComplaints(originalComplaints);
        throw new Error(`Failed with status ${res.status}`);
      }

      // 📝 SUCCESS TOAST
      toast.success(
        `Status for Complaint #${complaintId} updated to: ${newStatus}`,
        { id: statusToast }
      );
    } catch (err) {
      console.error("Status Update Error:", err);
      // Revert on failure
      setComplaints(originalComplaints);
      // 📝 ERROR TOAST
      toast.error(`Failed to update status. Reverted to ${originalStatus}.`, {
        id: statusToast,
      });
    }
  };

  // ----------------------------------------------------------------
  // ✅ NEW: ORDER CONFIRMATION TOGGLE HANDLER
  const handleOrderConfirmationToggle = async (complaintId, currentValue) => {
    const originalComplaints = complaints;
    const newValue = !currentValue;

    // Optimistic UI update
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === complaintId ? { ...c, order_confirmation: newValue } : c
      )
    );

    // 📝 LOADING TOAST
    const toggleToast = toast.loading(
      `Updating order confirmation to ${
        newValue ? "Confirmed" : "Not Confirmed"
      }...`
    );

    try {
      const res = await fetch(`${COMPLAINT_API}${complaintId}/`, {
        method: "PATCH",
        headers: getAuthHeaders(),

        body: JSON.stringify({ order_confirmation: newValue }),
      });

      if (!res.ok) {
        // Revert on failure
        setComplaints(originalComplaints);
        throw new Error(`Failed with status ${res.status}`);
      }

      // 📝 SUCCESS TOAST
      toast.success(
        `Order confirmation for Complaint #${complaintId} updated to: ${
          newValue ? "Confirmed" : "Not Confirmed"
        }`,
        { id: toggleToast }
      );
    } catch (err) {
      console.error("Order Confirmation Toggle Error:", err);
      // Revert on failure
      setComplaints(originalComplaints);
      // 📝 ERROR TOAST
      toast.error(
        `Failed to update order confirmation. Reverted to ${
          currentValue ? "Confirmed" : "Not Confirmed"
        }.`,
        {
          id: toggleToast,
        }
      );
    }
  };

  // ----------------------------------------------------------------
  // 🔴 API: DELETE COMPLAINT (DELETE)
  // ----------------------------------------------------------------
  const handleDelete = (id) => {
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
                const deleteToast = toast.loading(
                  `Deleting complaint #${id}...`
                );

                try {
                  const res = await fetch(`${COMPLAINT_API}${id}/`, {
                    method: "DELETE",
                    headers: getAuthHeaders(),
                  });

                  if (!res.ok) {
                    throw new Error(`Delete failed: ${res.status}`);
                  }

                  setComplaints((prev) => prev.filter((c) => c.id !== id));

                  toast.success(`Complaint #${id} deleted`, {
                    id: deleteToast,
                  });
                } catch (err) {
                  console.error("Delete error:", err);
                  toast.error("Failed to delete complaint", {
                    id: deleteToast,
                  });
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

  // ✅ TOGGLE SINGLE ROW CHECKBOX
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ✅ SELECT / DESELECT ALL
  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  // ✅ BULK DELETE - FIXED
  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one complaint");
      return;
    }

    toast.dismiss();

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete {selectedIds.length} selected complaints?
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
                const toastId = toast.loading("Deleting complaints...");

                try {
                  await Promise.all(
                    selectedIds.map((id) =>
                      fetch(`${COMPLAINT_API}${id}/`, {
                        method: "DELETE",
                        headers: getAuthHeaders(), // ADD THIS
                      })
                    )
                  );

                  setComplaints((prev) =>
                    prev.filter((c) => !selectedIds.includes(c.id))
                  );
                  setSelectedIds([]);

                  toast.success("Selected complaints deleted", { id: toastId });
                } catch (err) {
                  console.error("Bulk delete error:", err);
                  toast.error("Bulk delete failed", { id: toastId });
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
  // ----------------------------------------------------------------
  // ✅ NEW: VIEW COMPLAINT HANDLER
  // ----------------------------------------------------------------
  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setViewModalOpen(true);
  };

  // ----------------------------------------------------------------
  // ✅ NEW: VOICE/INVOICE BUTTON HANDLER - UPDATED
  const handleInvoiceClick = (complaint) => {
    // Navigate to Invoice.jsx component with the complaint data as state
    navigate("/invoice", {
      state: {
        complaintData: complaint,
        complaintId: complaint.id,
      },
    });
  };

  // ----------------------------------------------------------------
  // EDIT HANDLER (Local State Setup) - FIXED
  // ----------------------------------------------------------------
  const handleEdit = (c) => {
    // Reset form states first
    resetFormStates();

    // Set edit complaint data
    setEditComplaint(c);
    setIsEdit(true);

    // Open the form
    setOpenForm(true);
  };

  // ----------------------------------------------------------------
  // ✅ NEW: FILTER LOGIC
  // ----------------------------------------------------------------
  const filtered = complaints.filter((c) => {
    const text = [
      c.customer_name,
      c.customer_phone,
      c.phone_model,
      c.issue_details,
      c.address,
    ]
      .filter(Boolean) // ✅ removes null/undefined
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());

    let matchesFilter = true;

    if (filterType === "id" && filterId) {
      matchesFilter = String(c.id) === filterId;
    } else if (filterType === "status" && filterStatus) {
      matchesFilter = c.status === filterStatus;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Complaints</h1>

        <button
          onClick={() => {
            setOpenForm(true);
            setIsEdit(false);
            setEditComplaint(null);
            resetFormStates();
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all w-full md:w-auto"
        >
          + Register Complaint
        </button>
      </div>

      {/* --- FORM MODAL --- */}
      {openForm && (
        <div
          className="fixed inset-0 bg-black/40 
          flex items-center justify-center 
          z-50"
        >
          <div
            className="bg-white w-full sm:max-w-xl 
                max-h-[92vh] 
                overflow-y-auto
                p-4 sm:p-6
                rounded-t-2xl sm:rounded-2xl
                shadow-2xl border border-gray-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-blue-700">
                {isEdit ? "Edit Complaint" : "Register Complaint"}
              </h2>
              <button
                onClick={() => setOpenForm(false)}
                className="text-gray-500 hover:text-red-600 text-lg"
              >
                ✖
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 text-sm 
           max-h-[65vh] sm:max-h-[70vh]
           overflow-y-auto
           scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100
           pr-1 sm:pr-3"
            >
              {/* --- Two Column Grid for Customer/Complaint Details --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name */}
                <div className="flex flex-col">
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((p) => ({ ...p, name: "" }));
                    }}
                    className={`w-full p-2 border rounded-lg ${
                      fieldErrors.name ? "" : "border-gray-300"
                    }`}
                    placeholder="Customer Name"
                  />

                  <div className="min-h-[16px]">
                    {fieldErrors.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile Number Field with Validation */}
                <div>
                  <input
                    type="number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    onBlur={(e) => validateMobile(e.target.value)}
                    className={`w-full p-2 border rounded-lg ${
                      mobileError ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Mobile Number"
                  />
                  {(mobileError || fieldErrors.mobile) && (
                    <p className="text-red-500 text-xs mt-1">
                      {mobileError || fieldErrors.mobile}
                    </p>
                  )}
                </div>

                {/* Email Field with Validation */}
                <div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={(e) => validateEmail(e.target.value)}
                    className={`w-full p-2 border rounded-lg ${
                      emailError ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Customer Email"
                  />
                  {(emailError || fieldErrors.email) && (
                    <p className="text-red-500 text-xs mt-1">
                      {emailError || fieldErrors.email}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="flex flex-col">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setFieldErrors((p) => ({ ...p, password: "" }));
                      }}
                      className={`w-full h-10 p-2 pr-10 border rounded-lg ${
                        fieldErrors.password ? "" : "border-gray-300"
                      }`}
                      placeholder="Password"
                    />

                    {/* Eye Icon */}
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {/* Error message (space reserved to avoid jump) */}
                  <div className="min-h-[16px]">
                    {fieldErrors.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>

                {/* Phone Model */}
                <div className="flex flex-col">
                  <input
                    name="model"
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      setFieldErrors((p) => ({ ...p, model: "" }));
                    }}
                    className={`w-full p-2 border rounded-lg ${
                      fieldErrors.model ? "" : "border-gray-300"
                    }`}
                    placeholder="Phone Model"
                  />

                  {/* Error below input */}
                  <div className="min-h-[16px]">
                    {fieldErrors.model && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.model}
                      </p>
                    )}
                  </div>
                </div>

                <select
                  name="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full p-2 h-10 border rounded-lg bg-white"
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

                {/* Address Line */}
                <div className="flex flex-col">
                  <textarea
                    name="addressLine"
                    value={addressLine}
                    onChange={(e) => {
                      setAddressLine(e.target.value);
                      setFieldErrors((p) => ({ ...p, addressLine: "" }));
                    }}
                    rows={2}
                    className={`w-full p-3 text-sm border rounded-lg resize-none bg-white
                      focus:outline-none focus:ring-2 focus:ring-gray-300
                      ${fieldErrors.addressLine ? "" : "border-gray-300"}
                    `}
                    placeholder="Address Line"
                  />

                  {/* Error text BELOW textarea */}
                  <div className="min-h-[16px]">
                    {fieldErrors.addressLine && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.addressLine}
                      </p>
                    )}
                  </div>
                </div>

                {/* State Dropdown */}
                <div className="flex flex-col">
                  {/* State (Auto from Pincode) */}
                  <div className="flex flex-col">
                    <input
                      type="text"
                      value={state}
                      readOnly
                      className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                      placeholder="State (auto-filled from pincode)"
                    />

                    <div className="min-h-[16px]">
                      {fieldErrors.state && (
                        <p className="text-red-500 text-xs mt-1">
                          {fieldErrors.state}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pincode */}
                <div className="flex flex-col">
                  <div className="relative">
                    <input
                      type="number"
                      value={pincode}
                      onChange={(e) => handlePincode(e.target.value)}
                      onBlur={(e) => validatePincode(e.target.value)}
                      className={`w-full p-2 border rounded-lg ${
                        pincodeMessage || pincodeError
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                      placeholder="Pincode"
                    />
                    {isPincodeLoading && (
                      <div className="absolute right-2 top-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>

                  {(pincodeMessage || pincodeError || fieldErrors.pincode) && (
                    <p className="text-red-500 text-xs mt-1">
                      {pincodeMessage || pincodeError || fieldErrors.pincode}
                    </p>
                  )}
                </div>

                {/* Area */}
                <div className="flex flex-col">
                  {areas.length > 0 ? (
                    <select
                      value={area}
                      onChange={(e) => {
                        handleAreaChange(e.target.value);
                        setFieldErrors((p) => ({ ...p, area: "" }));
                      }}
                      className={`w-full p-2 border rounded-lg bg-white ${
                        fieldErrors.area ? "" : " "
                      }`}
                    >
                      <option value="">Select Area</option>
                      {areas.map((a, i) => (
                        <option key={i} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={area}
                      disabled
                      className="w-full p-2 border rounded-lg"
                      placeholder="Area"
                    />
                  )}

                  <div className="min-h-[16px]">
                    {fieldErrors.area && (
                      <p className="text-red-500 text-xs mt-1">
                        {fieldErrors.area}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Issue Details */}
              <div className="flex flex-col">
                <textarea
                  name="issue"
                  value={issue}
                  onChange={(e) => {
                    setIssue(e.target.value);
                    setFieldErrors((p) => ({ ...p, issue: "" }));
                  }}
                  rows={1} // ⬅ decreased height
                  className={`w-full px-4 py-3 text-sm border rounded-lg resize-none bg-white
              leading-relaxed focus:outline-none focus:ring-2 focus:ring-gray-200
              ${fieldErrors.issue ? "" : "border-gray-300"}
            `}
                  placeholder="Issue Details"
                />

                <div className="min-h-[16px]">
                  {fieldErrors.issue && (
                    <p className="text-red-500 text-xs mt-1">
                      {fieldErrors.issue}
                    </p>
                  )}
                </div>
              </div>

              {/* ASSIGN SECTION (Full Width) */}
              <div
                className={`p-3 border rounded-lg text-sm transition-all min-h-[140px]
                ${
                  assignError
                    ? "border-red-500 bg-red-50"
                    : "border-gray-300 bg-gray-50"
                }
              `}
              >
                <label
                  className={`font-semibold block mb-2
                  ${assignError ? "text-red-600" : "text-gray-700"}
                `}
                >
                  Assign To:
                </label>

                <select
                  value={assignedType}
                  onChange={(e) => handleAssignTypeChange(e.target.value)}
                  className={`w-full p-2 border rounded-lg mb-2 bg-white
                  ${assignError ? "border-red-500" : "border-gray-300"}
                `}
                >
                  <option value="">Select Type</option>
                  <option value="franchise">
                    Franchise ({franchises.length})
                  </option>
                  <option value="other_shops">
                    Other Shops ({otherShops.length})
                  </option>
                  <option value="growtag">
                    GrowTags ({availableTags.length})
                  </option>
                </select>

                <div className="min-h-[60px]">
                  {isFetchingNearest && (
                    <p className="text-center text-gray-600 text-xs py-3">
                      Fetching nearest options...
                    </p>
                  )}

                  {(assignedType === "franchise" ||
                    assignedType === "other_shops") &&
                    !isFetchingNearest && (
                      <select
                        value={selectedShopId}
                        onChange={(e) => setSelectedShopId(e.target.value)}
                        className="w-full p-2 border rounded-lg border-gray-300"
                      >
                        <option value="">
                          Select{" "}
                          {assignedType === "franchise"
                            ? "Franchise"
                            : "Other Shop"}
                        </option>

                        {(assignedType === "franchise"
                          ? franchises
                          : otherShops
                        ).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label} - ID: {s.id}
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
                          {t.label} - ID: {t.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="sticky bottom-0 bg-white pt-3">
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
                >
                  {isEdit ? "Update Complaint" : "Submit Complaint"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- VIEW COMPLAINT MODAL --- */}
      {viewModalOpen && selectedComplaint && (
        <div className="fixed inset-0  bg-opacity-30 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-blue-700">
                Complaint Details - ID: {selectedComplaint.id}
              </h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-gray-500 hover:text-red-600 text-lg"
              >
                ✖
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Customer Information
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.customer_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Email
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Mobile
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.customer_phone}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Password
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.password || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Complaint Details
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Phone Model
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.phone_model}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Status
                    </label>
                    <span
                      className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                        selectedComplaint.status
                      )}`}
                    >
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Order Confirmation
                    </label>
                    <span
                      className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        selectedComplaint.order_confirmation
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedComplaint.order_confirmation
                        ? "Confirmed"
                        : "Not Confirmed"}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Assign Type
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg capitalize">
                      {selectedComplaint.assign_to === "othershop"
                        ? "Other Shop"
                        : selectedComplaint.assign_to || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                    Location Information
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Address
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.address}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Area
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.area}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      State
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.state?.trim()
                        ? selectedComplaint.state
                        : selectedComplaint.area
                        ? `(${selectedComplaint.area})`
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600">
                      Pincode
                    </label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.pincode}
                    </p>
                  </div>
                </div>

{/* System Information */}
<div className="space-y-3">
  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
    System Information
  </h3>

  {/* Created By */}
  <div>
    <label className="block text-sm font-medium text-gray-600">
      Created By
    </label>
    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
      {selectedComplaint.created_by?.username ||
        selectedComplaint.created_by ||
        "—"}
    </p>
  </div>

  {/* Created / Updated Time */}
  <div>
    <label className="block text-sm font-medium text-gray-600">
      Last Updated
    </label>
    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
      {selectedComplaint.updated_at
        ? new Date(selectedComplaint.updated_at).toLocaleString()
        : new Date(selectedComplaint.created_at).toLocaleString()}
    </p>
  </div>
</div>

              </div>

              {/* Issue Details (Full Width) */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
                  Issue Details
                </h3>
                <div>
                  <p className="p-3 bg-gray-50 rounded-lg min-h-[100px]">
                    {selectedComplaint.issue_details}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    handleEdit(selectedComplaint);
                    setViewModalOpen(false);
                  }}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
                >
                  Edit Complaint
                </button>
                {/* ✅ UPDATED: Invoice button moved to last in view modal */}
                <button
                  onClick={() => handleInvoiceClick(selectedComplaint)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                >
                  <span>📄</span> Generate Invoice
                </button>
                <button
                  onClick={() => setViewModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FILTER SECTION --- */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-700">Filters</h3>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full md:w-auto">
            {/* Filter Type Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <label className="text-sm">Filter By</label>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setFilterId("");
                  setFilterStatus("");
                }}
                className="border px-3 py-2 rounded-lg w-full sm:w-auto"
              >
                <option value="all">All Complaints</option>
                <option value="id">By ID</option>
                <option value="status">By Status</option>
              </select>
            </div>

            {/* ID Filter */}
            {filterType === "id" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Complaint ID:
                </label>
                <input
                  type="number"
                  value={filterId}
                  onChange={(e) => setFilterId(e.target.value)}
                  placeholder="Enter ID"
                  className="border px-3 py-2 rounded-lg w-full sm:w-32"
                />
                {filterId && (
                  <button
                    onClick={() => setFilterId("")}
                    className="text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Status Filter */}
            {filterType === "status" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">
                  Status:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border px-3 py-2 rounded-lg w-full sm:w-auto"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                {filterStatus && (
                  <button
                    onClick={() => setFilterStatus("")}
                    className="text-red-500 hover:text-red-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- TABLE --- */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
           {" "}
        <div
          className="
              p-4
              bg-gray-50
              border-b
              flex
              flex-col
              gap-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
        >
          <h2 className="font-semibold text-gray-700 text-sm sm:text-base">
            Complaint Records ({filtered.length})
          </h2>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
            >
              Delete Selected ({selectedIds.length})
            </button>
          )}

          <input
            type="text"
            placeholder="Search by name, mobile, model, issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
                  border
                  px-3
                  py-2
                  rounded-lg
                  w-full
                  sm:w-64
                  shadow-sm
                  focus:ring
                  focus:ring-blue-100
                  text-sm
                "
          />
        </div>
        {/* DESKTOP TABLE */}
        <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm border-collapse">
            {/* ================= TABLE HEADER ================= */}
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={
                      filtered.length > 0 &&
                      selectedIds.length === filtered.length
                    }
                    onChange={toggleSelectAll}
                    className="accent-blue-600"
                  />
                </th>

                <th className="px-3 py-3 text-center font-semibold text-gray-600 w-14">
                  ID
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Customer
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Email
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Mobile
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Issue
                </th>

                <th className="px-3 py-3 text-center font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
  Created By
</th>


                <th className="px-3 py-3 text-center font-semibold text-gray-700">
                  Order
                </th>

                <th className="px-4 py-3 text-center font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            {/* ================= TABLE BODY ================= */}
            <tbody>
              {!isFetchingData && filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    <p className="text-base font-semibold">
                      No complaints found
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-gray-50 transition"
                  >
                    {/* CHECKBOX */}
                    <td className="px-3 py-4 text-center align-top">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={() => toggleSelect(c.id)}
                        className="accent-blue-600"
                      />
                    </td>

                    {/* ID */}
                    <td className="px-3 py-4 text-center font-mono text-xs text-gray-600 align-top">
                      #{c.id}
                    </td>

                    {/* CUSTOMER NAME */}
                    <td className="px-4 py-4 font-medium text-gray-800 align-top">
                      {c.customer_name}
                    </td>

                    {/* EMAIL */}
                    <td className="px-4 py-4 text-gray-600 text-xs break-all align-top">
                      {c.email}
                    </td>

                    {/* MOBILE */}
                    <td className="px-4 py-4 text-gray-700 text-xs whitespace-nowrap align-top">
                      {c.customer_phone}
                    </td>

                    {/* ISSUE */}
                    <td className="px-4 py-4 text-gray-700 leading-relaxed align-top">
                      {c.issue_details}
                    </td>



                    {/* STATUS */}
                    <td className="px-3 py-4 text-center align-top">
                      <select
                        value={c.status}
                        onChange={(e) =>
                          handleStatusUpdate(c.id, e.target.value)
                        }
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full cursor-pointer focus:outline-none ${getStatusClasses(
                          c.status
                        )}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
<td className="px-4 py-4 align-top whitespace-nowrap text-gray-400">
  —
</td>


                    {/* ORDER CONFIRMATION */}
                    <td className="px-3 py-4 text-center align-top">
                      <button
                        onClick={() =>
                          handleOrderConfirmationToggle(
                            c.id,
                            c.order_confirmation
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap ${
                          c.order_confirmation
                            ? "bg-green-50 text-green-700 border-green-300"
                            : "bg-red-50 text-red-700 border-red-300"
                        }`}
                      >
                        {c.order_confirmation ? "Confirmed" : "Not Confirmed"}
                      </button>
                    </td>

                    {/* ACTIONS — ONE ROW ONLY */}
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          onClick={() => handleViewComplaint(c)}
                          className="px-3 py-1.5 text-xs rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          View
                        </button>

                        <button
                          onClick={() => handleEdit(c)}
                          className="px-3 py-1.5 text-xs rounded-md bg-yellow-50 text-yellow-700 hover:bg-yellow-100 transition"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(c.id)}
                          className="px-3 py-1.5 text-xs rounded-md bg-red-50 text-red-700 hover:bg-red-100 transition"
                        >
                          Delete
                        </button>

                        <button
                          onClick={() => handleInvoiceClick(c)}
                          className="px-3 py-1.5 text-xs rounded-md bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                        >
                          Invoice
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
      {/* MOBILE VIEW */}
      <div className="md:hidden space-y-4 mt-4">
        {filtered.map((c) => (
          <div
            key={c.id}
            className="bg-white border rounded-xl shadow p-4 space-y-2"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-gray-500">
                ID: {c.id}
              </span>

              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(
                  c.status
                )}`}
              >
                {c.status}
              </span>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                {c.customer_name}
              </p>
              <p className="text-xs text-gray-500">{c.email}</p>
              <p className="text-xs text-gray-600">{c.customer_phone}</p>
            </div>

            <div className="text-sm text-gray-700 line-clamp-3">
              <span className="font-medium">Issue:</span> {c.issue_details}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() =>
                  handleOrderConfirmationToggle(c.id, c.order_confirmation)
                }
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  c.order_confirmation
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {c.order_confirmation ? "Confirmed" : "Not Confirmed"}
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => handleViewComplaint(c)}
                className="flex-1 bg-blue-500 text-white py-1 rounded-lg text-xs"
              >
                👁️ View
              </button>

              <button
                onClick={() => handleEdit(c)}
                className="flex-1 bg-yellow-500 text-white py-1 rounded-lg text-xs"
              >
                Edit
              </button>

              <button
                onClick={() => handleInvoiceClick(c)}
                className="flex-1 bg-purple-500 text-white py-1 rounded-lg text-xs"
              >
                📄 Invoice
              </button>

              <button
                onClick={() => handleDelete(c.id)}
                className="flex-1 bg-red-500 text-white py-1 rounded-lg text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
