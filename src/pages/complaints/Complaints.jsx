// src/pages/complaints/Complaints.jsx
import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  EyeOff,
  CheckCircle,
  XCircle,
  UserCheck
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/API/axiosInstance";

const COMPLAINT_API = "/api/complaints/";
const CUSTOMER_API = "/api/customers/";
const NEAREST_OPTIONS_API = "/api/complaints/nearest-options/";

const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

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

export default function Complaints() {
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editComplaint, setEditComplaint] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [filterType, setFilterType] = useState("all");
  const [filterId, setFilterId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [search, setSearch] = useState("");

  const [selectedIds, setSelectedIds] = useState([]);

  // Customer search states
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState(null);
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(true);

  // Form fields
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
  const [state, setState] = useState("");
  const [status, setStatus] = useState("Assigned");
  const [showPassword, setShowPassword] = useState(false);

  // Assignment
  const [assignedType, setAssignedType] = useState("");
  const [selectedShopId, setSelectedShopId] = useState("");
  const [selectedGrowTagId, setSelectedGrowTagId] = useState("");
  const [franchises, setFranchises] = useState([]);
  const [otherShops, setOtherShops] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Validation
  const [fieldErrors, setFieldErrors] = useState({});
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [pincodeMessage, setPincodeMessage] = useState("");
  const [assignError, setAssignError] = useState(false);

  // Loading
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isFetchingNearest, setIsFetchingNearest] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const uniqueCreatedBy = React.useMemo(() => {
    const set = new Set();
    complaints.forEach((c) => { if (c.created_by) set.add(c.created_by); });
    return Array.from(set).sort();
  }, [complaints]);

  const resetFormStates = useCallback(() => {
    setName(""); setMobile(""); setModel(""); setIssue("");
    setPincode(""); setArea(""); setAreas([]); setState("");
    setPassword(""); setEmail(""); setAddressLine("");
    setSelectedShopId(""); setSelectedGrowTagId(""); setAssignedType("");
    setFranchises([]); setOtherShops([]); setAvailableTags([]);
    setStatus("Assigned");
    setEmailError(""); setMobileError(""); setPincodeError(""); setPincodeMessage("");
    setFieldErrors({}); setAssignError(false);
    setSelectedExistingCustomer(null);
    setShowCustomerSearch(false);
    setExistingCustomers([]);
    setIsNewCustomer(true);
    setIsSubmitting(false);
  }, []);

  const validateEmail = (value) => {
    if (!value.trim()) { setEmailError("Email is required"); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { setEmailError("Enter a valid email address"); return false; }
    setEmailError(""); return true;
  };

  const validateMobile = (value) => {
    if (!value.trim()) { setMobileError("Mobile number is required"); return false; }
    if (!/^\d{10}$/.test(value)) { setMobileError("Mobile number must be exactly 10 digits"); return false; }
    setMobileError(""); return true;
  };

  const validatePincode = (value) => {
    if (!value.trim()) { setPincodeError("Pincode is required"); setPincodeMessage("Pincode is required"); return false; }
    if (!/^\d{6}$/.test(value)) { setPincodeError("Pincode must be exactly 6 digits"); setPincodeMessage("Pincode must be exactly 6 digits"); return false; }
    setPincodeError(""); setPincodeMessage(""); return true;
  };

  const validateRequiredFields = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Customer name is required";
    if (!mobile.trim()) errors.mobile = "Mobile number is required";
    if (!email.trim()) errors.email = "Email is required";
    // Only require password for new customers (not during edit)
    if (!isEdit && isNewCustomer && !password.trim()) errors.password = "Password is required for new customer";
    if (!model.trim()) errors.model = "Phone model is required";
    if (!issue.trim()) errors.issue = "Issue details are required";
    if (!addressLine.trim()) errors.addressLine = "Address is required";
    if (!state.trim()) errors.state = "State is required";
    if (!pincode.trim()) errors.pincode = "Pincode is required";
    if (!area.trim()) errors.area = "Area is required";
    if (!assignedType.trim()) errors.assignedType = "Assignment type is required";
    if ((assignedType === "franchise" || assignedType === "other_shops") && !selectedShopId)
      errors.assignment = "Please select a shop";
    if (assignedType === "growtag" && !selectedGrowTagId)
      errors.assignment = "Please select a grow tag";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchComplaints = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const response = await axiosInstance.get(COMPLAINT_API);
      const data = response.data;
      if (Array.isArray(data)) setComplaints(data);
      else if (data?.results) setComplaints(data.results);
      else setComplaints([]);
    } catch {
      toast.error("Failed to load complaints.");
      setComplaints([]);
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await axiosInstance.get(CUSTOMER_API);
      const data = response.data;
      if (Array.isArray(data)) setCustomers(data);
      else if (data?.results) setCustomers(data.results);
      else setCustomers([]);
    } catch {
      console.error("Failed to load customers");
      setCustomers([]);
    }
  }, []);

  useEffect(() => { 
    fetchComplaints(); 
    fetchCustomers();
  }, [fetchComplaints, fetchCustomers]);

  // Check for existing customer by email
  const checkExistingCustomer = useCallback(async (emailValue) => {
    if (!emailValue || !validateEmail(emailValue)) {
      setExistingCustomers([]);
      setShowCustomerSearch(false);
      return;
    }

    setIsCheckingCustomer(true);
    try {
      // Search in already fetched customers first
      const matchedCustomers = customers.filter(c => 
        c.email?.toLowerCase() === emailValue.toLowerCase()
      );

      if (matchedCustomers.length > 0) {
        setExistingCustomers(matchedCustomers);
        setShowCustomerSearch(true);
      } else {
        // If not found in local cache, try API search
        const response = await axiosInstance.get(`${CUSTOMER_API}?email=${encodeURIComponent(emailValue)}`);
        const data = response.data;
        const foundCustomers = Array.isArray(data) ? data : data.results || [];
        const exactMatches = foundCustomers.filter(c => 
          c.email?.toLowerCase() === emailValue.toLowerCase()
        );
        
        if (exactMatches.length > 0) {
          setExistingCustomers(exactMatches);
          setShowCustomerSearch(true);
        } else {
          setExistingCustomers([]);
          setShowCustomerSearch(false);
        }
      }
    } catch (error) {
      console.error("Error checking customer:", error);
    } finally {
      setIsCheckingCustomer(false);
    }
  }, [customers]);

  // Check customer when email changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (email && !isEdit) {
        checkExistingCustomer(email);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [email, checkExistingCustomer, isEdit]);

  const selectExistingCustomer = (customer) => {
    setSelectedExistingCustomer(customer);
    setName(customer.customer_name || "");
    setMobile(customer.customer_phone || "");
    setEmail(customer.email || "");
    // Don't set password for existing customer
    setPassword("");
    setAddressLine(customer.address || "");
    setState(customer.state || "");
    setPincode(customer.pincode || "");
    setIsNewCustomer(false);
    
    // If pincode is present, fetch areas
    if (customer.pincode && /^\d{6}$/.test(customer.pincode)) {
      handlePincode(customer.pincode, true).then(() => {
        if (customer.area) {
          setArea(customer.area);
          if (customer.pincode) {
            fetchNearestOptions(customer.pincode, customer.area);
          }
        }
      });
    }
    
    setShowCustomerSearch(false);
    setExistingCustomers([]);
    toast.success(`Customer "${customer.customer_name}" selected`);
  };

  // Clear existing customer selection and create new
  const createNewCustomer = () => {
    setSelectedExistingCustomer(null);
    setIsNewCustomer(true);
    setShowCustomerSearch(false);
    setExistingCustomers([]);
  };

  // Fetch nearest options
  const fetchNearestOptions = useCallback(async (pcode, selectedArea, complaint = null) => {
    if (!/^\d{6}$/.test(pcode) || !selectedArea) return;

    setFranchises([]); setOtherShops([]); setAvailableTags([]);
    setIsFetchingNearest(true);

    try {
      const response = await axiosInstance.get(NEAREST_OPTIONS_API, {
        params: {
          pincode: pcode,
          area: selectedArea
        }
      });
      
      const data = response.data;
      const fetchedFranchises = Array.isArray(data.franchise_shops) ? data.franchise_shops : [];
      const fetchedOtherShops = Array.isArray(data.other_shops) ? data.other_shops : [];
      const fetchedTags = Array.isArray(data.growtags) ? data.growtags : [];

      setFranchises(fetchedFranchises);
      setOtherShops(fetchedOtherShops);
      setAvailableTags(fetchedTags);

      // Prefill assignment selection when editing
      if (complaint) {
        const assignType = complaint.assign_to;
        const assignedShopId = complaint.assigned_shop?.toString();
        const assignedGrowtagId = complaint.assigned_Growtags?.toString();

        if (assignType === "franchise") {
          setAssignedType("franchise");
          if (assignedShopId && fetchedFranchises.some((f) => f.id.toString() === assignedShopId))
            setSelectedShopId(assignedShopId);
        } else if (assignType === "othershop") {
          setAssignedType("other_shops");
          if (assignedShopId && fetchedOtherShops.some((s) => s.id.toString() === assignedShopId))
            setSelectedShopId(assignedShopId);
        } else if (assignType === "growtag") {
          setAssignedType("growtag");
          if (assignedGrowtagId && fetchedTags.some((g) => g.id.toString() === assignedGrowtagId))
            setSelectedGrowTagId(assignedGrowtagId);
        }
      }
    } catch {
      toast.error("Failed to load nearest assignment options");
    } finally {
      setIsFetchingNearest(false);
    }
  }, []);

  const handlePincode = async (value, skipNearest = false) => {
    setPincode(value);
    setPincodeError(""); setPincodeMessage("");
    setAreas([]); setArea(""); setState("");

    if (!value) { setPincodeMessage("Pincode is required"); return; }
    if (!/^\d{6}$/.test(value)) {
      setPincodeError("Pincode must be exactly 6 digits");
      setPincodeMessage("Pincode must be exactly 6 digits");
      return;
    }

    setIsPincodeLoading(true);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data[0]?.Status !== "Success") {
        setPincodeMessage("Invalid pincode. No location found");
        return;
      }
      const postOffices = data[0].PostOffice || [];
      setAreas(postOffices.map((p) => p.Name));
      setState(postOffices[0].State);
      setFieldErrors((p) => ({ ...p, state: "", pincode: "" }));
    } catch {
      setPincodeMessage("Network issue. Please check your internet connection");
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const handleAreaChange = (value) => {
    setArea(value);
    setFieldErrors((p) => ({ ...p, area: "" }));
    if (/^\d{6}$/.test(pincode)) fetchNearestOptions(pincode, value);
  };

  const handleAssignTypeChange = (value) => {
    setAssignedType(value);
    setSelectedShopId(""); setSelectedGrowTagId(""); setAssignError(false);
  };

  // Populate form for edit
  useEffect(() => {
    if (!isEdit || !editComplaint) return;

    setName(editComplaint.customer_name || "");
    setMobile(editComplaint.customer_phone || "");
    setEmail(editComplaint.email || "");
    // Don't set password when editing
    setPassword("");
    setModel(editComplaint.phone_model || "");
    setIssue(editComplaint.issue_details || "");
    setAddressLine(editComplaint.address || "");
    setStatus(editComplaint.status || "Assigned");
    setPincode(editComplaint.pincode || "");
    setState(editComplaint.state || "");
    setIsNewCustomer(false);
    
    // Set the selected customer
    if (editComplaint.customer) {
      setSelectedExistingCustomer(editComplaint.customer);
    }

    const restoreLocation = async () => {
      if (!editComplaint.pincode) return;
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${editComplaint.pincode}`);
        const data = await res.json();
        if (data[0]?.Status === "Success") {
          const postOffices = data[0].PostOffice || [];
          setAreas(postOffices.map((p) => p.Name));
          setState(data[0].PostOffice[0]?.State || editComplaint.state || "");
        }
      } catch { /* use state from complaint */ }

      if (editComplaint.area) {
        setArea(editComplaint.area);
        fetchNearestOptions(editComplaint.pincode, editComplaint.area, editComplaint);
      }
    };

    restoreLocation();
  }, [isEdit, editComplaint, fetchNearestOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const invalidAssign =
      !assignedType ||
      (assignedType === "growtag" && !selectedGrowTagId) ||
      ((assignedType === "franchise" || assignedType === "other_shops") && !selectedShopId);

    setAssignError(invalidAssign);
    const isRequiredValid = validateRequiredFields();

    if (invalidAssign || !isRequiredValid) {
      toast.error(invalidAssign ? "Please assign the complaint" : "Please fill all required fields");
      return;
    }
    if (!validateEmail(email) || !validateMobile(mobile) || !validatePincode(pincode)) {
      toast.error("Please correct the highlighted form errors.");
      return;
    }
    if (!area) { 
      toast.error("Please select an Area after entering the Pincode."); 
      return; 
    }

    // Map frontend assignedType to API value
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

    // Prepare complaint data
    const complaintData = {
      customer_name: name, 
      customer_phone: mobile, 
      phone_model: model,
      issue_details: issue, 
      email, 
      address: addressLine,
      state, 
      pincode, 
      area, 
      status, 
      assign_to: assignTypeAPI,
    };
    
    // Handle customer and password based on context
    if (!isEdit) {
      // New complaint
      if (selectedExistingCustomer) {
        // For existing customer, include customer ID but NOT password
        complaintData.customer = selectedExistingCustomer.id;
      } else {
        // For new customer, include password
        complaintData.password = password;
      }
    } else {
      // Edit complaint
      if (selectedExistingCustomer) {
        complaintData.customer = selectedExistingCustomer.id;
      }
      // Never include password during edit
    }
    
    if (fkFieldName && assignedID) complaintData[fkFieldName] = parseInt(assignedID, 10);

    console.log("Submitting complaint data:", complaintData);

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${COMPLAINT_API}${editComplaint.id}/` : COMPLAINT_API;

    setIsSubmitting(true);
    const toastId = toast.loading(isEdit ? "Updating complaint..." : "Registering complaint...");

    try {
      let response;
      if (isEdit) {
        response = await axiosInstance.put(url, complaintData);
      } else {
        response = await axiosInstance.post(url, complaintData);
      }
      
      const savedComplaint = response.data;
      console.log("Success response:", savedComplaint);

      if (isEdit) {
        setComplaints(prev => 
          prev.map(c => c.id === savedComplaint.id ? savedComplaint : c)
        );
        toast.success("Complaint updated successfully!", { id: toastId });
      } else {
        setComplaints(prev => [savedComplaint, ...prev]);
        toast.success("Complaint registered successfully!", { id: toastId });
        
        // Refresh customers list to include new customer if created
        fetchCustomers();
      }

      setOpenForm(false); 
      setIsEdit(false); 
      setEditComplaint(null); 
      resetFormStates();
      
    } catch (error) {
      console.error("Error submitting complaint:", error);
      console.error("Error response data:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      if (error.response?.status === 400) {
        // Handle validation errors
        const validationErrors = error.response.data;
        let errorMessage = "Validation failed: ";
        
        if (typeof validationErrors === 'object') {
          const errorMessages = [];
          Object.keys(validationErrors).forEach(key => {
            const messages = Array.isArray(validationErrors[key]) 
              ? validationErrors[key].join(', ') 
              : validationErrors[key];
            errorMessages.push(`${key}: ${messages}`);
          });
          errorMessage = errorMessages.join(' | ');
          
          // Set field-specific errors
          setFieldErrors(prev => ({
            ...prev,
            ...Object.keys(validationErrors).reduce((acc, key) => {
              const fieldMap = {
                'customer_name': 'name',
                'customer_phone': 'mobile',
                'phone_model': 'model',
                'issue_details': 'issue',
                'address': 'addressLine',
              };
              const formField = fieldMap[key] || key;
              acc[formField] = Array.isArray(validationErrors[key]) 
                ? validationErrors[key][0] 
                : validationErrors[key];
              return acc;
            }, {})
          }));
        } else {
          errorMessage = error.response.data.message || "Validation failed";
        }
        
        toast.error(errorMessage, { id: toastId });
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to do this.", { id: toastId });
      } else if (error.response?.status === 404) {
        toast.error("Resource not found.", { id: toastId });
      } else {
        toast.error(`${isEdit ? "Update" : "Register"} failed. Please try again.`, { id: toastId });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    const original = complaints;
    setComplaints((prev) => prev.map((c) => c.id === complaintId ? { ...c, status: newStatus } : c));
    const t = toast.loading(`Updating status to ${newStatus}...`);
    try {
      await axiosInstance.patch(`${COMPLAINT_API}${complaintId}/`, { status: newStatus });
      toast.success(`Status updated to: ${newStatus}`, { id: t });
    } catch {
      setComplaints(original);
      toast.error("Failed to update status.", { id: t });
    }
  };

  const handleOrderConfirmation = async (complaintId) => {
    const original = complaints;
    const complaint = complaints.find(c => c.id === complaintId);
    const newStatus = complaint?.confirm_status === "CONFIRMED" ? "NOT CONFIRMED" : "CONFIRMED";
    
    setComplaints((prev) => 
      prev.map((c) => 
        c.id === complaintId 
          ? { 
              ...c, 
              confirm_status: newStatus,
              confirmed_at: newStatus === "CONFIRMED" ? new Date().toISOString() : null,
              confirmed_by: newStatus === "CONFIRMED" ? "admin" : null
            } 
          : c
      )
    );
    
    const t = toast.loading(newStatus === "CONFIRMED" ? "Confirming order..." : "Unconfirming order...");
    
    try {
      const response = await axiosInstance.patch(`${COMPLAINT_API}${complaintId}/confirm/`, { 
        confirm_status: newStatus
      });
      
      const data = response.data;
      
      setComplaints((prev) => 
        prev.map((c) => 
          c.id === complaintId 
            ? { 
                ...c, 
                confirm_status: data.confirm_status,
                confirmed_at: data.confirmed_at,
                confirmed_by: data.confirmed_by
              } 
            : c
        )
      );
      
      toast.success(data.message || "Order confirmation updated", { id: t });
    } catch (err) {
      console.error("Order confirmation error:", err);
      setComplaints(original);
      toast.error(err.response?.data?.message || err.message || "Failed to update order confirmation.", { id: t });
    }
  };

  const handleDelete = (id) => {
    toast.dismiss();
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete complaint #{id}?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-gray-200 rounded-md text-sm">Cancel</button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading(`Deleting complaint #${id}...`);
                try {
                  await axiosInstance.delete(`${COMPLAINT_API}${id}/`);
                  setComplaints((prev) => prev.filter((c) => c.id !== id));
                  toast.success(`Complaint #${id} deleted`, { id: dt });
                } catch {
                  toast.error("Failed to delete complaint", { id: dt });
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >Delete</button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const toggleSelect = (id) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleSelectAll = () =>
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map((c) => c.id));

  const handleBulkDelete = () => {
    if (!selectedIds.length) { toast.error("Please select at least one complaint"); return; }
    toast.dismiss();
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete {selectedIds.length} selected complaints?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1.5 bg-gray-200 rounded-md text-sm">Cancel</button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const results = await Promise.all(
                  selectedIds.map(async (id) => {
                    try {
                      await axiosInstance.delete(`${COMPLAINT_API}${id}/`);
                      return { id, ok: true };
                    } catch (error) {
                      return { id, ok: false, status: error.response?.status || 0 };
                    }
                  })
                );

                const deleted = results.filter((r) => r.ok).map((r) => r.id);
                const forbidden = results.filter((r) => r.status === 403).map((r) => r.id);
                const notFound = results.filter((r) => r.status === 404).map((r) => r.id);

                if (deleted.length > 0) {
                  setComplaints((prev) => prev.filter((c) => !deleted.includes(c.id)));
                  setSelectedIds((prev) => prev.filter((id) => !deleted.includes(id)));
                }

                if (deleted.length === selectedIds.length) {
                  toast.success(`${deleted.length} complaint${deleted.length > 1 ? "s" : ""} deleted`);
                } else {
                  if (deleted.length > 0) toast.success(`${deleted.length} deleted successfully`);
                  if (forbidden.length > 0) toast.error(`${forbidden.length} complaint${forbidden.length > 1 ? "s" : ""} could not be deleted (no permission)`);
                  if (notFound.length > 0) toast.error(`${notFound.length} complaint${notFound.length > 1 ? "s" : ""} not found — already deleted?`);
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >Delete</button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleEdit = (c) => {
    resetFormStates();
    setEditComplaint(c);
    setIsEdit(true);
    setOpenForm(true);
  };

  const handleInvoiceClick = (complaint) =>
    navigate("/invoice", { state: { complaintData: complaint, complaintId: complaint.id } });

  const filtered = complaints.filter((c) => {
    const text = [c.customer_name, c.customer_phone, c.phone_model, c.issue_details, c.address]
      .filter(Boolean).join(" ").toLowerCase();
    const matchesSearch = text.includes(search.toLowerCase());
    let matchesFilter = true;
    if (filterType === "id" && filterId) matchesFilter = String(c.id) === filterId;
    else if (filterType === "status" && filterStatus) matchesFilter = c.status === filterStatus;
    else if (filterType === "created_by" && filterCreatedBy) matchesFilter = c.created_by === filterCreatedBy;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Complaints</h1>
        <button
          onClick={() => { setOpenForm(true); setIsEdit(false); setEditComplaint(null); resetFormStates(); }}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all w-full md:w-auto"
          disabled={isSubmitting}
        >
          + Register Complaint
        </button>
      </div>

      {/* FORM MODAL */}
      {openForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-2">
          <div className="bg-white w-full max-w-[700px] rounded-xl shadow-2xl border border-gray-200 max-h-[95vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-3 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-blue-700">
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

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto" style={{ maxHeight: "calc(95vh - 120px)" }}>
              {/* Customer Search Section - Only for new complaints */}
              {!isEdit && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-blue-700 flex items-center gap-1">
                      <UserCheck size={14} /> Check Existing Customer by Email
                    </label>
                    {isCheckingCustomer && (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mb-2">
                    Enter email address to check if customer already exists
                  </p>
                  
                  {/* Existing customer suggestions */}
                  {showCustomerSearch && existingCustomers.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs font-semibold text-green-600">Existing customer found:</p>
                      {existingCustomers.map((cust) => (
                        <div 
                          key={cust.id}
                          className="p-2 bg-white rounded-lg border border-green-200"
                        >
                          <div className="flex items-start gap-2">
                            <UserCheck size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800">{cust.customer_name}</p>
                              <p className="text-xs text-gray-600">{cust.email} | {cust.customer_phone}</p>
                            </div>
                            <button 
                              onClick={() => selectExistingCustomer(cust)}
                              className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 font-medium flex-shrink-0"
                            >
                              Select
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 text-center">
                        <button 
                          onClick={createNewCustomer}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          + Create new customer instead
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {showCustomerSearch && existingCustomers.length === 0 && !isCheckingCustomer && (
                    <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-500">
                        No existing customer found with this email. New customer will be created.
                      </p>
                    </div>
                  )}

                  {/* Show when existing customer is selected */}
                  {selectedExistingCustomer && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-green-700">Using existing customer:</p>
                          <p className="text-sm text-gray-800">{selectedExistingCustomer.customer_name}</p>
                          <p className="text-xs text-gray-600">{selectedExistingCustomer.email}</p>
                        </div>
                        <button 
                          onClick={createNewCustomer}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Customer Details Grid - 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Name */}
                  <div>
                    <input
                      value={name}
                      onChange={(e) => { setName(e.target.value); setFieldErrors((p) => ({ ...p, name: "" })); }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${fieldErrors.name ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200`}
                      placeholder="Customer Name *"
                      disabled={isSubmitting || (selectedExistingCustomer && !isEdit)}
                    />
                    {fieldErrors.name && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.name}</p>}
                  </div>

                  {/* Mobile */}
                  <div>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      onBlur={(e) => validateMobile(e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${mobileError ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200`}
                      placeholder="Mobile Number * (10 digits)"
                      maxLength={10}
                      disabled={isSubmitting || (selectedExistingCustomer && !isEdit)}
                    />
                    {(mobileError || fieldErrors.mobile) && <p className="text-red-500 text-xs mt-0.5">{mobileError || fieldErrors.mobile}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={(e) => validateEmail(e.target.value)}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${emailError ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200`}
                      placeholder="Customer Email *"
                      disabled={isSubmitting || (selectedExistingCustomer && !isEdit)}
                    />
                    {(emailError || fieldErrors.email) && <p className="text-red-500 text-xs mt-0.5">{emailError || fieldErrors.email}</p>}
                  </div>

                  {/* Password - Only show for new customers and hide during edit */}
                  {(!selectedExistingCustomer && !isEdit) && (
                    <div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: "" })); }}
                          className={`w-full px-3 py-2 text-sm border rounded-lg ${fieldErrors.password ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200 pr-8`}
                          placeholder="Password *"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                      {fieldErrors.password && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.password}</p>}
                    </div>
                  )}

                  {/* Show a message when editing that password can't be changed here */}
                  {isEdit && (
                    <div className="md:col-span-1">
                      <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 h-full flex items-center">
                        <p className="text-xs text-gray-600">
                          <span className="font-medium">🔒 Password:</span> Not editable in complaints
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Phone Model */}
                  <div>
                    <input
                      value={model}
                      onChange={(e) => { setModel(e.target.value); setFieldErrors((p) => ({ ...p, model: "" })); }}
                      className={`w-full px-3 py-2 text-sm border rounded-lg ${fieldErrors.model ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200`}
                      placeholder="Phone Model *"
                      disabled={isSubmitting}
                    />
                    {fieldErrors.model && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.model}</p>}
                  </div>

                  {/* Status */}
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
                    disabled={isSubmitting}
                  >
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Address - Full width */}
                <div>
                  <textarea
                    value={addressLine}
                    onChange={(e) => { setAddressLine(e.target.value); setFieldErrors((p) => ({ ...p, addressLine: "" })); }}
                    rows={1}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${fieldErrors.addressLine ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200 resize-none`}
                    placeholder="Address Line *"
                    disabled={isSubmitting || (selectedExistingCustomer && !isEdit)}
                  />
                  {fieldErrors.addressLine && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.addressLine}</p>}
                </div>

                {/* Location Grid - 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* State */}
                  <div>
                    <input
                      type="text"
                      value={state}
                      readOnly
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      placeholder="State"
                    />
                  </div>

                  {/* Pincode */}
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => handlePincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onBlur={(e) => validatePincode(e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg ${pincodeMessage || pincodeError ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200`}
                        placeholder="Pincode * (6 digits)"
                        maxLength={6}
                        disabled={isSubmitting}
                      />
                      {isPincodeLoading && (
                        <div className="absolute right-2 top-2.5">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                        </div>
                      )}
                    </div>
                    {(pincodeMessage || pincodeError || fieldErrors.pincode) && (
                      <p className="text-red-500 text-xs mt-0.5">{pincodeMessage || pincodeError || fieldErrors.pincode}</p>
                    )}
                  </div>

                  {/* Area */}
                  <div>
                    {areas.length > 0 ? (
                      <select
                        value={area}
                        onChange={(e) => { handleAreaChange(e.target.value); setFieldErrors((p) => ({ ...p, area: "" })); }}
                        className={`w-full px-3 py-2 text-sm border rounded-lg bg-white ${fieldErrors.area ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200`}
                        disabled={isSubmitting}
                      >
                        <option value="">Select Area *</option>
                        {areas.map((a, i) => <option key={i} value={a}>{a}</option>)}
                      </select>
                    ) : (
                      <input 
                        value={area} 
                        disabled 
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50" 
                        placeholder="Area (enter pincode first)" 
                      />
                    )}
                    {fieldErrors.area && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.area}</p>}
                  </div>
                </div>

                {/* Issue Details */}
                <div>
                  <textarea
                    value={issue}
                    onChange={(e) => { setIssue(e.target.value); setFieldErrors((p) => ({ ...p, issue: "" })); }}
                    rows={1}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${fieldErrors.issue ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200 resize-none`}
                    placeholder="Issue Details *"
                    disabled={isSubmitting}
                  />
                  {fieldErrors.issue && <p className="text-red-500 text-xs mt-0.5">{fieldErrors.issue}</p>}
                </div>

                {/* ASSIGN SECTION */}
                <div className={`p-3 border rounded-lg ${assignError ? "border-red-500 bg-red-50" : "border-gray-300 bg-gray-50"}`}>
                  <label className={`text-sm font-semibold block mb-2 ${assignError ? "text-red-600" : "text-gray-700"}`}>
                    Assign To: *
                  </label>

                  <select
                    value={assignedType}
                    onChange={(e) => handleAssignTypeChange(e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg mb-2 bg-white ${assignError ? "border-red-500" : "border-gray-300"} focus:outline-none focus:ring-1 focus:ring-blue-200`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select Type</option>
                    <option value="franchise">Franchise ({franchises.length})</option>
                    <option value="other_shops">Other Shops ({otherShops.length})</option>
                    <option value="growtag">GrowTags ({availableTags.length})</option>
                  </select>

                  <div>
                    {isFetchingNearest && (
                      <p className="text-center text-gray-600 text-xs py-1">Fetching nearest options...</p>
                    )}

                    {(assignedType === "franchise" || assignedType === "other_shops") && !isFetchingNearest && (
                      <select
                        value={selectedShopId}
                        onChange={(e) => setSelectedShopId(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
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
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-200"
                        disabled={isSubmitting}
                      >
                        <option value="">Select GrowTag</option>
                        {availableTags.map((t) => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    )}

                    {!isFetchingNearest && assignedType && !area && (
                      <p className="text-xs text-amber-600 mt-1">Enter pincode and select area to load nearby options</p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className={`w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isEdit ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    isEdit ? "Update Complaint" : "Submit Complaint"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {viewModalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-2xl font-bold text-blue-700">Complaint Details - ID: {selectedComplaint.id}</h2>
              <button onClick={() => setViewModalOpen(false)} className="text-gray-500 hover:text-red-600 text-lg">✖</button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Customer Information</h3>
                  {[
                    ["Name", selectedComplaint.customer_name],
                    ["Email", selectedComplaint.email],
                    ["Mobile", selectedComplaint.customer_phone],
                    // ["Password", selectedComplaint.password || "N/A"],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-gray-600">{label}</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-lg">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Complaint Details</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Phone Model</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{selectedComplaint.phone_model}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Status</label>
                    <span className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusClasses(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Order Confirmation</label>
                    <span className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold inline-block ${selectedComplaint.confirm_status === "CONFIRMED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {selectedComplaint.confirm_status || "NOT CONFIRMED"}
                    </span>
                    {selectedComplaint.confirmed_at && (
                      <p className="text-xs text-gray-500 mt-1">
                        Confirmed at: {new Date(selectedComplaint.confirmed_at).toLocaleString()}
                        {selectedComplaint.confirmed_by && ` by ${selectedComplaint.confirmed_by}`}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Assigned To</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {selectedComplaint.assigned_to_details
                        ? `${selectedComplaint.assigned_to_details.name} (${selectedComplaint.assigned_to_details.type})`
                        : selectedComplaint.assign_to || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Location Information</h3>
                  {[
                    ["Address", selectedComplaint.address],
                    ["Area", selectedComplaint.area],
                    ["State", selectedComplaint.state || "N/A"],
                    ["Pincode", selectedComplaint.pincode],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-gray-600">{label}</label>
                      <p className="mt-1 p-2 bg-gray-50 rounded-lg">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">System Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Created By</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">{selectedComplaint.created_by || "—"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Created At</label>
                    <p className="mt-1 p-2 bg-gray-50 rounded-lg">
                      {new Date(selectedComplaint.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Issue Details</h3>
                <p className="p-3 bg-gray-50 rounded-lg min-h-[80px]">{selectedComplaint.issue_details}</p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { handleEdit(selectedComplaint); setViewModalOpen(false); }} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                  Edit Complaint
                </button>
                <button onClick={() => handleInvoiceClick(selectedComplaint)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2">
                  <FileText size={16} /> Generate Invoice
                </button>
                <button onClick={() => setViewModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTER SECTION */}
      <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="text-lg font-semibold text-gray-700">Filters</h3>
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full md:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-sm">Filter By</label>
              <select
                value={filterType}
                onChange={(e) => { setFilterType(e.target.value); setFilterId(""); setFilterStatus(""); setFilterCreatedBy(""); }}
                className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                <input type="number" value={filterId} onChange={(e) => setFilterId(e.target.value)} placeholder="Enter ID" className="border px-3 py-2 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-200" />
                {filterId && <button onClick={() => setFilterId("")} className="text-red-500 hover:text-red-700">Clear</button>}
              </div>
            )}

            {filterType === "status" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Status:</label>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {filterStatus && <button onClick={() => setFilterStatus("")} className="text-red-500 hover:text-red-700">Clear</button>}
              </div>
            )}

            {filterType === "created_by" && (
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Created By:</label>
                <select value={filterCreatedBy} onChange={(e) => setFilterCreatedBy(e.target.value)} className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">All Creators</option>
                  {uniqueCreatedBy.map((creator) => <option key={creator} value={creator}>{creator}</option>)}
                </select>
                {filterCreatedBy && <button onClick={() => setFilterCreatedBy("")} className="text-red-500 hover:text-red-700">Clear</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="mt-6 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-gray-700 text-sm sm:text-base">Complaint Records ({filtered.length})</h2>
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 flex items-center gap-2">
              <Trash2 size={16} /> Delete Selected ({selectedIds.length})
            </button>
          )}
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-lg w-full sm:w-64 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm border-collapse table-fixed">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center w-12">
                  <input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length} onChange={toggleSelectAll} className="accent-blue-600" />
                </th>
                <th className="px-3 py-3 text-center font-semibold text-gray-600 w-16">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-40">Customer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-48">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 w-28">Mobile</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700 w-28">Status</th>
                <th className="px-3 py-3 text-center font-semibold text-gray-700 w-28">Order</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 w-56">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetchingData ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-500 font-semibold">Loading complaints...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-12 text-center text-gray-500 font-semibold">No complaints found</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50 transition">
                    <td className="px-3 py-4 text-center align-middle">
                      <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => toggleSelect(c.id)} className="accent-blue-600" />
                    </td>
                    <td className="px-3 py-4 text-center font-mono text-xs text-gray-600 align-middle">#{c.id}</td>
                    <td className="px-4 py-4 font-medium text-gray-800 align-middle truncate" title={c.customer_name}>{c.customer_name}</td>
                    <td className="px-4 py-4 text-gray-600 text-xs align-middle truncate" title={c.email}>{c.email}</td>
                    <td className="px-4 py-4 text-gray-700 text-xs align-middle">{c.customer_phone}</td>
                    <td className="px-3 py-4 text-center align-middle">
                      <select
                        value={c.status}
                        onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-semibold rounded-full cursor-pointer focus:outline-none w-28 ${getStatusClasses(c.status)}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-4 text-center align-middle">
                      <button
                        onClick={() => handleOrderConfirmation(c.id)}
                        className={`px-2 py-1 rounded-full text-xs font-semibold border whitespace-nowrap w-28 flex items-center justify-center gap-1 mx-auto transition-colors ${
                          c.confirm_status === "CONFIRMED"
                            ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                            : "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
                        }`}
                        title={c.confirm_status === "CONFIRMED" ? "Click to unconfirm" : "Click to confirm"}
                      >
                        {c.confirm_status === "CONFIRMED" ? (
                          <>
                            <CheckCircle size={12} /> Confirmed
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Not Confirmed
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedComplaint(c); setViewModalOpen(true); }}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(c)}
                          className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                          title="Edit Complaint"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete Complaint"
                        >
                          <Trash2 size={18} />
                        </button>
                        <button
                          onClick={() => handleInvoiceClick(c)}
                          className="p-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                          title="Generate Invoice"
                        >
                          <FileText size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE VIEW */}
        <div className="md:hidden space-y-4 mt-4 p-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white border rounded-xl shadow p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-mono text-gray-500">ID: {c.id}</span>
                  <p className="font-semibold text-gray-800">{c.customer_name}</p>
                  <p className="text-xs text-gray-600">{c.customer_phone}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{c.email}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(c.status)}`}>
                  {c.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Order:</span>
                <button
                  onClick={() => handleOrderConfirmation(c.id)}
                  className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                    c.confirm_status === "CONFIRMED" 
                      ? "bg-green-100 text-green-800 hover:bg-green-200" 
                      : "bg-red-100 text-red-800 hover:bg-red-200"
                  }`}
                >
                  {c.confirm_status === "CONFIRMED" ? (
                    <>
                      <CheckCircle size={12} /> Confirmed
                    </>
                  ) : (
                    <>
                      <XCircle size={12} /> Not Confirmed
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-2">
                <button
                  onClick={() => { setSelectedComplaint(c); setViewModalOpen(true); }}
                  className="flex flex-col items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  title="View"
                >
                  <Eye size={20} />
                  <span className="text-xs mt-1">View</span>
                </button>
                <button
                  onClick={() => handleEdit(c)}
                  className="flex flex-col items-center justify-center p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                  title="Edit"
                >
                  <Edit size={20} />
                  <span className="text-xs mt-1">Edit</span>
                </button>
                <button
                  onClick={() => handleInvoiceClick(c)}
                  className="flex flex-col items-center justify-center p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                  title="Invoice"
                >
                  <FileText size={20} />
                  <span className="text-xs mt-1">Invoice</span>
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="flex flex-col items-center justify-center p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={20} />
                  <span className="text-xs mt-1">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}