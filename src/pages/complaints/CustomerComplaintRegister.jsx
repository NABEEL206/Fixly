import { BASE_URL } from "@/API/BaseURL";
import React, { useState, useCallback, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

// --- API Endpoints ---
const COMPLAINT_API = `${BASE_URL}/api/complaints/`;
const NEAREST_OPTIONS_API = `${BASE_URL}/api/complaints/nearest-options/`;


// --- STATUS OPTIONS ---
const STATUS_OPTIONS = ["Pending", "Assigned", "In Progress", "Resolved"];

// Helper for status styling
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

export default function CustomerComplaintRegister() {
  // 📝 CUSTOMER'S COMPLAINTS ONLY
  const [myComplaints, setMyComplaints] = useState([]);

  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editComplaint, setEditComplaint] = useState(null);

  // customer/complaint states
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [model, setModel] = useState("");
  const [issue, setIssue] = useState("");

  // location states
  const [email, setEmail] = useState(""); // This email will be used to filter complaints
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
  const [status, setStatus] = useState("Assigned");

  // 🛑 NEW STATE FOR FIELD ERRORS
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  // misc
  const [search, setSearch] = useState("");
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [isFetchingNearest, setIsFetchingNearest] = useState(false);
  const [customerEmail, setCustomerEmail] = useState(""); // Store customer's email to filter

  const [state, setState] = useState("");

  // errors state
  // 🛑 FIELD LEVEL REQUIRED ERRORS
  const [errors, setErrors] = useState({});

  // 🇮🇳 India States List
  const INDIA_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Andaman and Nicobar Islands",
    "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Jammu and Kashmir",
    "Ladakh",
    "Lakshadweep",
    "Puducherry",
  ];

  // --- UTILITY FUNCTION: Reset Form States ---
  const resetFormStates = useCallback(() => {
    setName("");
    setMobile("");
    setModel("");
    setIssue("");
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
    setState("");
  }, []);

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

  const clearError = (field) => {
    setErrors((prev) => ({ ...prev, [field]: "" }));
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
  // 🟢 API: FETCH ONLY MY COMPLAINTS (FILTERED BY EMAIL)
  // ----------------------------------------------------------------
  const fetchMyComplaints = useCallback(async () => {
    if (!email) {
      console.log("No email set - skipping complaint fetch");
      return;
    }

    setIsFetchingData(true);
    try {
      // Fetch all complaints and filter by email
      const res = await fetch(COMPLAINT_API);
      if (!res.ok)
        throw new Error(`Failed to fetch complaints. Status: ${res.status}`);

      const allComplaints = await res.json();

      // Filter complaints by customer's email
      const myComplaints = allComplaints.filter(
        (complaint) => complaint.email === email
      );

      setMyComplaints(myComplaints || []);

      // Store customer email for future filtering
      setCustomerEmail(email);

      if (myComplaints.length > 0) {
        toast.success(
          `Found ${myComplaints.length} complaint(s) registered with ${email}`
        );
      }
    } catch (error) {
      console.error("API Error during GET:", error);
      toast.error("Failed to load your complaints.");
    } finally {
      setIsFetchingData(false);
    }
  }, [email]);

  // Load complaints when email changes
  useEffect(() => {
    if (email && validateEmail(email)) {
      fetchMyComplaints();
    }
  }, [email, fetchMyComplaints]);

  // ----------------------------------------------------------------
  // API: FETCH NEAREST OPTIONS
  // ----------------------------------------------------------------
  const fetchNearestOptions = useCallback(async (pcode, selectedArea) => {
    setFranchises([]);
    setOtherShops([]);
    setAvailableTags([]);

    if (!pcode || !selectedArea) {
      console.warn("Nearest Options Fetch Skipped: Missing Pincode or Area.");
      return null;
    }

    setIsFetchingNearest(true);
    try {
      const url = new URL(NEAREST_OPTIONS_API);
      url.searchParams.append("pincode", pcode);
      url.searchParams.append("area", selectedArea);

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(
          `Failed to fetch nearest options. Status: ${res.status}`
        );
      }

      const data = await res.json();
      setFranchises(data.franchise || []);
      setOtherShops(data.othershop || []);
      setAvailableTags(data.growtag || []);

      return data;
    } catch (error) {
      console.error("Nearest Options API Error:", error);
      toast.error("Error fetching nearest assignment options.");
      return null;
    } finally {
      setIsFetchingNearest(false);
    }
  }, []);

  // 🔥 HANDLE AREA CHANGE
  const handleAreaChange = (value) => {
    setArea(value);
    fetchNearestOptions(pincode, value);
  };

  // 🔥 HANDLER: Clears previous specific assignment when the type changes
  const handleAssignTypeChange = (value) => {
    setAssignedType(value);
    setSelectedShopId("");
    setSelectedGrowTagId("");
  };

  // 🔥 HANDLE PINCODE → FETCH MULTIPLE AREAS
  const handlePincode = async (value) => {
    setArea("");
    setAreas([]);
    setPincode(value);
    validatePincode(value);

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
          const list = data[0].PostOffice.map((p) => p.Name);
          setAreas(list);
          setPincodeError("");
        } else {
          setAreas([]);
          toast(
            "Pincode not found. Please select an area manually or verify.",
            {
              icon: "⚠️",
            }
          );
          setPincodeError("Pincode not found or invalid.");
        }
      } catch (error) {
        console.error("Pincode API Error:", error);
        setAreas([]);
        toast.error("Error fetching pincode details.");
      }
    }
  };

  // ----------------------------------------------------------------
  // 🔥 EFFECT FOR EDIT MODE INITIALIZATION
  // ----------------------------------------------------------------
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
        setEmail(editComplaint.email || "");
        setPincode(editComplaint.pincode || "");
        setAddressLine(editComplaint.address || "");
        setStatus(editComplaint.status || STATUS_OPTIONS[0]);

        const apiAssignment = editComplaint.assign_to || "";
        setAssignedType(
          apiAssignment === "othershop" ? "other_shops" : apiAssignment
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
              `https://api.postalpincode.in/pincode/${editComplaint.pincode}`
            );
            const data = await res.json();
            if (data[0].Status === "Success") {
              areaList = data[0].PostOffice.map((p) => p.Name);
              setAreas(areaList);
            }
          } catch (e) {
            /* ignore error on edit load */
          }
        }
        setAreas(areaList);
        setArea(editComplaint.area || "");

        if (editComplaint.area && editComplaint.pincode) {
          fetchNearestOptions(editComplaint.pincode, editComplaint.area);
        }
      } else {
        resetFormStates();
      }
    };

    initializeForm();
  }, [isEdit, editComplaint, fetchNearestOptions, resetFormStates]);

  // validate required field
  const validateRequiredFields = () => {
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!model.trim()) newErrors.model = "Phone model is required";
    if (!issue.trim()) newErrors.issue = "Issue details are required";
    if (!addressLine.trim()) newErrors.addressLine = "Address is required";
    if (!state) newErrors.state = "State is required";
    if (!area) newErrors.area = "Area is required";

    // ✅ ASSIGN TO VALIDATION (NEW)
    if (!assignedType) {
      newErrors.assignType = "Please select assignment type";
    } else {
      if (
        (assignedType === "franchise" || assignedType === "other_shops") &&
        !selectedShopId
      ) {
        newErrors.assignEntity = "Please select a shop";
      }

      if (assignedType === "growtag" && !selectedGrowTagId) {
        newErrors.assignEntity = "Please select a GrowTag";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ----------------------------------------------------------------
  // SUBMISSION HANDLER (POST / PUT)
  // ----------------------------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isEmailValid = validateEmail(email);
    const isMobileValid = validateMobile(mobile);
    const isPincodeValid = validatePincode(pincode);
    const isRequiredValid = validateRequiredFields();

    if (
      !isRequiredValid ||
      !isEmailValid ||
      !isMobileValid ||
      !isPincodeValid
    ) {
      toast.error("Please fix highlighted errors", {
        position: "top-center",
      });
      return;
    }

    if (!isEmailValid || !isMobileValid || !isPincodeValid) {
      toast.error("Please correct the highlighted form errors.", {
        position: "top-center",
      });
      return;
    }

    if (!assignedType || (!selectedShopId && !selectedGrowTagId)) {
      toast.error("Please select an assignment type and entity.", {
        position: "top-center",
      });
      return;
    }

    // Prepare data for API
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
      state: state,
      customer_name: name,
      customer_phone: mobile,
      phone_model: model,
      issue_details: issue,
      email: email,
      address: addressLine,
      pincode: pincode,
      area: area,
      status: status,
      assign_to: assignTypeAPI,
    };

    if (fkFieldName && assignedID) {
      complaintData[fkFieldName] = parseInt(assignedID, 10);
    }

    const method = isEdit ? "PUT" : "POST";
    const url = isEdit ? `${COMPLAINT_API}${editComplaint.id}/` : COMPLAINT_API;
    const action = isEdit ? "Update" : "Register";

    const submissionToast = toast.loading(`${action}ing complaint...`, {
      position: "top-center",
    });

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(complaintData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          `API call failed: ${res.status} - ${JSON.stringify(errorData)}`
        );
      }

      const resData = await res.json();

      // ✅ Update myComplaints immediately after submission
      if (isEdit) {
        setMyComplaints((prev) =>
          prev.map((c) => (c.id === editComplaint.id ? resData : c))
        );
      } else {
        setMyComplaints((prev) => [...prev, resData]);
      }

      toast.success(
        `Complaint ${isEdit ? "updated" : "registered"} successfully!`,
        {
          id: submissionToast,
          position: "top-center",
        }
      );

      setOpenForm(false);
      setIsEdit(false);
      setEditComplaint(null);
      resetFormStates();
    } catch (error) {
      console.error("API Submission Error:", error);
      toast.error(`${action} failed. See console for details.`, {
        id: submissionToast,
        position: "top-center",
      });
    }
  };

  // ----------------------------------------------------------------
  // ✅ DYNAMIC STATUS UPDATE HANDLER (PATCH)
  const handleStatusUpdate = async (complaintId, newStatus) => {
    const originalComplaints = myComplaints;
    const originalStatus = originalComplaints.find(
      (c) => c.id === complaintId
    )?.status;

    // optimistic UI
    setMyComplaints((prev) =>
      prev.map((c) => (c.id === complaintId ? { ...c, status: newStatus } : c))
    );

    const statusToast = toast.loading(`Updating status to ${newStatus}...`);

    try {
      const res = await fetch(`${COMPLAINT_API}${complaintId}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        setMyComplaints(originalComplaints);
        throw new Error(`Failed with status ${res.status}`);
      }

      toast.success(
        `Status for Complaint #${complaintId} updated to: ${newStatus}`,
        { id: statusToast }
      );
    } catch (err) {
      console.error("Status Update Error:", err);
      setMyComplaints(originalComplaints);
      toast.error(`Failed to update status. Reverted to ${originalStatus}.`, {
        id: statusToast,
      });
    }
  };

  // ----------------------------------------------------------------
  // 🔴 API: DELETE COMPLAINT (DELETE)
  // ----------------------------------------------------------------
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this complaint?")) {
      const deleteToast = toast.loading(`Deleting complaint #${id}...`);
      try {
        const url = `${COMPLAINT_API}${id}/`;
        const res = await fetch(url, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Failed to delete complaint. Status: ${res.status}`);
        }

        setMyComplaints(myComplaints.filter((c) => c.id !== id));
        toast.success(`Complaint #${id} deleted successfully.`, {
          id: deleteToast,
        });
      } catch (error) {
        console.error("API Deletion Error:", error);
        toast.error(`Failed to delete complaint #${id}.`, { id: deleteToast });
      }
    }
  };

  // ----------------------------------------------------------------
  // EDIT HANDLER (Local State Setup)
  // ----------------------------------------------------------------
  const handleEdit = (c) => {
    setEditComplaint(c);
    setIsEdit(true);
    setOpenForm(true);
  };

  // ----------------------------------------------------------------
  // FILTERING - Search within MY complaints
  // ----------------------------------------------------------------
  const filtered = myComplaints.filter((c) =>
    [
      c.customer_name,
      c.customer_phone,
      c.phone_model,
      c.issue_details,
      c.address,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* 🚨 NEW: Toaster Component */}
      <Toaster position="top-center" reverseOrder={false} />

   <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  {/* Title */}
  <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
    My Complaints
  </h1>

  {/* Action Button */}
  <button
    onClick={() => {
      setOpenForm(true);
      setIsEdit(false);
      setEditComplaint(null);
      resetFormStates();
    }}
    className="w-full sm:w-auto bg-blue-600 text-white px-5 py-3 sm:py-2 rounded-xl shadow-md hover:bg-blue-700 transition-all text-sm sm:text-base font-semibold"
  >
    + Register New Complaint
  </button>
</div>


      {isFetchingData && (
        <div className="text-center text-blue-600 font-semibold mb-4">
          Loading your complaints...
        </div>
      )}

      {/* --- FORM MODAL --- */}
      {openForm && (
        <div className="fixed inset-0 mt-8  bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white w-full max-w-xl p-6 rounded-2xl shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-700">
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
              className="flex flex-col gap-4 text-sm max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pr-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* NAME */}
                <div className="flex flex-col">
                  <input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError("name");
                    }}
                    className={`w-full p-2 border rounded-lg ${
                      errors.name ? "border-red-500" : ""
                    }`}
                    placeholder="Customer Name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* MOBILE */}
                <div className="flex flex-col">
                  <input
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
                    className={`w-full p-2 border rounded-lg ${
                      mobileError ? "border-red-500" : ""
                    }`}
                    placeholder="Mobile Number"
                  />
                  {mobileError && (
                    <p className="text-red-500 text-xs mt-1">{mobileError}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div className="flex flex-col">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      validateEmail(e.target.value);
                    }}
                    className={`w-full p-2 border rounded-lg ${
                      emailError ? "border-red-500" : ""
                    }`}
                    placeholder="Email Address"
                  />
                  {emailError && (
                    <p className="text-red-500 text-xs mt-1">{emailError}</p>
                  )}
                </div>

                {/* STATE (REPLACED PASSWORD POSITION ✅) */}
                <div className="flex flex-col">
                  <select
                    value={state}
                    onChange={(e) => {
                      setState(e.target.value);
                      clearError("state");
                    }}
                    className={`w-full p-2 border rounded-lg bg-white ${
                      errors.state ? "border-red-500" : ""
                    }`}
                  >
                    <option value="">Select State</option>
                    {INDIA_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>

                {/* PHONE MODEL */}
                <div className="flex flex-col">
                  <input
                    value={model}
                    onChange={(e) => {
                      setModel(e.target.value);
                      clearError("model");
                    }}
                    className={`w-full p-2 border rounded-lg ${
                      errors.model ? "border-red-500" : ""
                    }`}
                    placeholder="Phone Model"
                  />
                  {errors.model && (
                    <p className="text-red-500 text-xs mt-1">{errors.model}</p>
                  )}
                </div>

                {/* STATUS */}
                <div className="flex flex-col">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full p-2 border rounded-lg bg-white"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PINCODE */}
                <div className="flex flex-col">
                  <input
                    value={pincode}
                    onChange={(e) => handlePincode(e.target.value)}
                    className={`w-full p-2 border rounded-lg ${
                      pincodeError ? "border-red-500" : ""
                    }`}
                    placeholder="Pincode"
                  />
                  {pincodeError && (
                    <p className="text-red-500 text-xs mt-1">{pincodeError}</p>
                  )}
                </div>

                {/* AREA */}
                <div className="flex flex-col">
                  {areas.length > 0 ? (
                    <select
                      value={area}
                      onChange={(e) => {
                        handleAreaChange(e.target.value);
                        clearError("area");
                      }}
                      className={`w-full p-2 border rounded-lg bg-white ${
                        errors.area ? "border-red-500" : ""
                      }`}
                    >
                      <option value="">Select Area</option>
                      {areas.map((a, index) => (
                        <option key={index} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={area}
                      readOnly
                      placeholder="Area (select pincode first)"
                      className="w-full p-2 border rounded-lg bg-gray-100"
                      disabled
                    />
                  )}
                  {errors.area && (
                    <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                  )}
                </div>

                {/* ADDRESS – FULL WIDTH */}
                <div className="flex flex-col md:col-span-2">
                  <textarea
                    value={addressLine}
                    onChange={(e) => {
                      setAddressLine(e.target.value);
                      clearError("addressLine");
                    }}
                    className={`w-full p-2 border rounded-lg ${
                      errors.addressLine ? "border-red-500" : ""
                    }`}
                    placeholder="Address Line"
                  />
                  {errors.addressLine && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.addressLine}
                    </p>
                  )}
                </div>
              </div>

              {/* Issue Details */}
              <textarea
                value={issue}
                onChange={(e) => {
                  setIssue(e.target.value);
                  clearError("issue");
                }}
                className={`w-full px-4 py-4 border rounded-xl ${
                  errors.issue ? "border-red-500" : ""
                }`}
                placeholder="Issue Details"
              />
              {errors.issue && (
                <p className="text-red-500 text-xs mt-1">{errors.issue}</p>
              )}

              {/* ASSIGN SECTION (Full Width) */}
              <div
                className={`p-3 border rounded-lg text-sm transition-all min-h-[140px] bg-gray-50
  ${
    errors.assignType || errors.assignEntity
      ? "border-red-500"
      : "border-gray-300"
  }`}
              >
                <label className="font-semibold text-gray-700 block mb-2">
                  Assign To:
                </label>
                <select
                  value={assignedType}
                  onChange={(e) => {
                    handleAssignTypeChange(e.target.value);
                    clearError("assignType");
                    clearError("assignEntity");
                  }}
                  className={`w-full p-2 border rounded-lg mb-2
  ${errors.assignType ? "border-red-500" : "border-gray-300"}`}
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

                {errors.assignType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.assignType}
                  </p>
                )}

                <div className="min-h-[60px]">
                  {isFetchingNearest && (
                    <p className="text-center text-gray-600 text-xs py-3">
                      Fetching nearest options...
                    </p>
                  )}

                  {/* Dynamic Assignment Dropdown (Shops/Franchise) */}
                  {(assignedType === "franchise" ||
                    assignedType === "other_shops") &&
                    !isFetchingNearest && (
                      <select
                        value={selectedShopId}
                        onChange={(e) => {
                          setSelectedShopId(e.target.value);
                          clearError("assignEntity");
                        }}
                        className={`w-full p-2 border rounded-lg
  ${errors.assignEntity ? "border-red-500" : "border-gray-300"}`}
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
                        ).length > 0 ? (
                          (assignedType === "franchise"
                            ? franchises
                            : otherShops
                          ).map((s) => (
                            <option key={s.id} value={s.id}>
                              **{s.label}** - ID: {s.id}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>
                            No{" "}
                            {assignedType === "franchise"
                              ? "franchises"
                              : "shops"}{" "}
                            available in this location
                          </option>
                        )}
                      </select>
                    )}

                  {/* Dynamic Assignment Dropdown (GrowTags) */}
                  {assignedType === "growtag" && !isFetchingNearest && (
                    <select
                      value={selectedShopId}
                      onChange={(e) => {
                        setSelectedShopId(e.target.value);
                        clearError("assignEntity");
                      }}
                      className={`w-full p-2 border rounded-lg
  ${errors.assignEntity ? "border-red-500" : "border-gray-300"}`}
                    >
                      <option value="">Select GrowTag</option>
                      {availableTags.length > 0 ? (
                        availableTags.map((t) => (
                          <option key={t.id} value={t.id}>
                            **{t.label}** - ID: {t.id}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled>
                          No GrowTags available in this location
                        </option>
                      )}
                    </select>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-semibold"
              >
                {isEdit ? "Update Complaint" : "Submit Complaint"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MY COMPLAINTS (RESPONSIVE) --- */}
      <div className="mt-10 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* HEADER */}
        <div className="p-4 flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-gray-50 border-b">
          <h2 className="font-semibold text-gray-700">
            My Complaint Records ({myComplaints.length})
            {customerEmail && (
              <span className="block md:inline text-sm text-gray-500 md:ml-2">
                (Registered with: {customerEmail})
              </span>
            )}
          </h2>

          <input
            type="text"
            placeholder="Search in my complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-lg w-full md:w-60 shadow-sm focus:ring focus:ring-blue-100"
          />
        </div>

        {/* EMPTY STATE */}
        {myComplaints.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No complaints found.
            {email && <p className="mt-2">Your email: {email}</p>}
          </div>
        ) : (
          <>
            {/* ================= DESKTOP TABLE ================= */}
            <div className="hidden md:block overflow-auto max-h-[70vh]">
              <table className="w-full text-sm table-fixed">
                <thead className="bg-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-3 text-left w-12">ID</th>
                    <th className="p-3 text-left w-32">Name</th>
                    <th className="p-3 text-left w-28">Mobile</th>
                    <th className="p-3 text-left w-28">Model</th>
                    <th className="p-3 text-left">Issue</th>
                    <th className="p-3 text-left min-w-[140px]">Address</th>
                    <th className="p-3 text-left min-w-[140px]">Assign To</th>
                    <th className="p-3 text-center w-24">Type</th>
                    <th className="p-3 text-center min-w-[120px]">Status</th>
                    <th className="p-3 text-center w-28">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 text-center">{c.id}</td>
                      <td className="p-3">{c.customer_name}</td>
                      <td className="p-3">{c.customer_phone}</td>
                      <td className="p-3">{c.phone_model}</td>
                      <td className="p-3 truncate">{c.issue_details}</td>
                      <td className="p-3 truncate">{c.address}</td>
                      <td className="p-3 text-blue-600 truncate">
                        {c.assigned_to_details
                          ? c.assigned_to_details.name ||
                            `Shop ID: ${c.assigned_to_details.id}`
                          : "Not Assigned"}
                      </td>
                      <td className="p-3 text-center capitalize">
                        {c.assign_to === "othershop"
                          ? "Other Shop"
                          : c.assign_to}
                      </td>

                      <td className="p-2 text-center">
                        <select
                          value={c.status}
                          onChange={(e) =>
                            handleStatusUpdate(c.id, e.target.value)
                          }
                          className={`w-full p-1 text-xs font-semibold rounded-full ${getStatusClasses(
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

                      <td className="p-3 flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(c)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ================= MOBILE CARD VIEW ================= */}
            <div className="md:hidden p-4 space-y-4">
              {filtered.map((c) => (
                <div
                  key={c.id}
                  className="border rounded-xl shadow-sm p-4 space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-700">
                      Complaint #{c.id}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusClasses(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <b>Name:</b> {c.customer_name}
                    </p>
                    <p>
                      <b>Mobile:</b> {c.customer_phone}
                    </p>
                    <p>
                      <b>Model:</b> {c.phone_model}
                    </p>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium">Issue</p>
                    <p className="text-gray-600">{c.issue_details}</p>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium">Address</p>
                    <p className="text-gray-600">{c.address}</p>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium">Assigned To</p>
                    <p className="text-blue-600">
                      {c.assigned_to_details
                        ? c.assigned_to_details.name ||
                          `Shop ID: ${c.assigned_to_details.id}`
                        : "Not Assigned"}
                    </p>
                  </div>

                  <select
                    value={c.status}
                    onChange={(e) => handleStatusUpdate(c.id, e.target.value)}
                    className={`w-full p-2 rounded-lg text-sm font-semibold ${getStatusClasses(
                      c.status
                    )}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(c)}
                      className="flex-1 bg-yellow-500 text-white py-2 rounded-lg"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="flex-1 bg-red-500 text-white py-2 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
