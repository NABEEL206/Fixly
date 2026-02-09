import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/API/BaseURL";

const API_URL = `${BASE_URL}/api/growtags/`;

// 🔐 Helper: returns Authorization header
const getAuthHeaders = () => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

// Mock data for complaints section (you can replace with real API later)
const MOCK_COMPLAINTS_DATA = [
  {
    id: 1,
    complaint_id: "COMP001",
    title: "Water Supply Issue",
    status: "Open",
    area: "Thurakkal",
  },
  {
    id: 2,
    complaint_id: "COMP002",
    title: "Electricity Problem",
    status: "In Progress",
    area: "Kondotty",
  },
  {
    id: 3,
    complaint_id: "COMP003",
    title: "Road Damage",
    status: "Resolved",
    area: "Thurakkal",
  },
];

export default function GrowTags() {
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewData, setViewData] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [originalGrowTagInfo, setOriginalGrowTagInfo] = useState({
    name: "",
    grow_id: "",
  });
  const navigate = useNavigate();
  const [areas, setAreas] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [errors, setErrors] = useState({});

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
      if (typeof firstVal === "object") {
        const innerKey = Object.keys(firstVal)[0];
        const innerVal = firstVal[innerKey];
        if (Array.isArray(innerVal)) return innerVal[0];
        if (typeof innerVal === "string") return innerVal;
      }
    }
    return "Request failed";
  };

  const loadGrowtags = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
        return;
      }

      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: getAuthHeaders(),
      });

      // Handle both single object and array responses
      if (res.data) {
        if (Array.isArray(res.data)) {
          setUsers(res.data);
        } else if (typeof res.data === "object") {
          // If it's a single object, wrap it in array
          setUsers([res.data]);
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
  };

  useEffect(() => {
    if (!localStorage.getItem("access_token")) {
      toast.error("Session expired. Please login again.");
      navigate("/login");
      return;
    }

    loadGrowtags();
  }, [navigate]);

  const filteredUsers = useMemo(() => {
    const lowerCaseQuery = searchQuery.toLowerCase();

    return users
      .map((user) => ({
        ...user,

        // ✅ FUTURE FIELD (safe now)
        created_by: user.created_by ?? null,
      }))
      .filter((user) => {
        if (!searchQuery) return true;

        return (
          user.name?.toLowerCase().includes(lowerCaseQuery) ||
          user.grow_id?.toLowerCase().includes(lowerCaseQuery) ||
          user.phone?.includes(searchQuery) ||
          user.email?.toLowerCase().includes(lowerCaseQuery)
        );
      });
  }, [users, searchQuery]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 🚫 Block numbers & symbols in Name field
    if (name === "name") {
      if (!/^[A-Za-z\s]*$/.test(value)) return;
    }

    setForm((p) => ({ ...p, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "pincode" && value.length === 6) fetchAreas(value);
  };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0] || null;
    setForm((p) => ({ ...p, image: file }));
    if (file) setPreview(URL.createObjectURL(file));
  };

  const fetchAreas = async (pincode) => {
    try {
      setLoadingAreas(true);
      const res = await axios.get(
        `https://api.postalpincode.in/pincode/${pincode}`,
      );

      const postOffice = res.data?.[0];
      const list = postOffice?.PostOffice || [];

      setAreas(list);

      // ✅ AUTO-FILL STATE
      if (list.length > 0) {
        setForm((prev) => ({
          ...prev,
          state: list[0].State || "",
        }));
      }

      if (!list.length) {
        toast.error("Invalid pincode or no areas found");
      }
    } catch (err) {
      toast.error("Failed to fetch areas");
    } finally {
      setLoadingAreas(false);
    }
  };

  const handleAreaSelect = (e) => {
    const areaName = e.target.value;
    setForm((p) => ({ ...p, area: areaName }));
    // Clear error for area when user selects
    if (errors.area) {
      setErrors((prev) => ({ ...prev, area: "" }));
    }
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

    // Always required fields (for both add and edit)
    if (!form.grow_id.trim()) newErrors.grow_id = "Grow ID is required";
    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (!/^[A-Za-z\s]+$/.test(form.name)) {
      newErrors.name = "Name must contain only letters";
    }
    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    }
    if (!form.phone.trim()) {
      newErrors.phone = "Phone is required";
    } else if (!/^[0-9]{10}$/.test(form.phone)) {
      newErrors.phone = "Phone must be 10 digits";
    }

    // Required fields for both add and edit (as per your requirement)
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

    if (!form.area.trim()) {
      newErrors.area = "Area is required";
    }

    if (!form.adhar.trim()) {
      newErrors.adhar = "Aadhar is required";
    } else if (!/^[0-9]{12}$/.test(form.adhar)) {
      newErrors.adhar = "Aadhar must be 12 digits";
    }

    if (!form.address.trim()) {
      newErrors.address = "Address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields correctly");
      return;
    }

    try {
      const formData = new FormData();

      // Add all form fields to FormData
      Object.keys(form).forEach((key) => {
        if (key === "image") {
          if (form.image instanceof File) {
            formData.append("image", form.image);
          }
        } else if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (isEdit && editId) {
        // For PUT request
        await axios.put(`${API_URL}${editId}/`, formData, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });

        const displayName = form.name || originalGrowTagInfo.name;
        const displayID = form.grow_id || originalGrowTagInfo.grow_id;

        toast.success(
          `Grow Tag "${displayName}" (${displayID}) updated successfully!`,
        );
      } else {
        // For POST request
        await axios.post(API_URL, formData, {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        });

        toast.success(
          `Grow Tag "${form.name}" (${form.grow_id}) added successfully!`,
        );
      }

      // ✅ delay heavy state changes
      setTimeout(() => {
        resetForm();
        setShowFormModal(false);
        loadGrowtags();
      }, 250);
    } catch (err) {
      const msg = extractErrorMessage(err);
      toast.error(msg);
      console.error("Submit error:", err);
    }
  };

  const handleEdit = (user) => {
    setShowFormModal(true);

    setOriginalGrowTagInfo({
      name: user.name || "",
      grow_id: user.grow_id || "",
    });

    // Set form with user data
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
      password: "", // Don't show existing password
      image: null,
      status: user.status || "Active",
    });

    // Set preview if image exists
    if (user.image) {
      setPreview(user.image);
    }

    if (user.pincode) fetchAreas(user.pincode);
    setEditId(user.id);
    setIsEdit(true);
  };

  const fetchComplaints = async (growTagId) => {
    setLoadingComplaints(true);
    setComplaints([]);

    // Mock API call - replace with your actual API
    console.log(`Fetching complaints for Grow Tag ID: ${growTagId}`);

    // Simulate API delay
    setTimeout(() => {
      setComplaints(MOCK_COMPLAINTS_DATA);
      setLoadingComplaints(false);
    }, 1000);
  };

  const handleView = (user) => {
    setViewData(user);
    setShowViewModal(true);
    if (user.id) {
      fetchComplaints(user.id);
    }
  };

  const handleDelete = (id) => {
    const userToDelete = users.find((u) => u.id === id);

    if (!userToDelete) {
      toast.error("Grow Tag not found.");
      return;
    }

    const { name, grow_id } = userToDelete;

    toast.custom(
      (t) => (
        <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4 w-full max-w-sm">
          <p className="text-sm text-gray-800 font-medium mb-3">
            Are you sure you want to delete
            <br />
            <span className="font-bold text-red-600">
              {name} ({grow_id})
            </span>
            ?
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 rounded border text-gray-600 hover:bg-gray-100 text-sm"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id);

                const loadingToast = toast.loading("Deleting Grow Tag...");

                try {
                  await axios.delete(`${API_URL}${id}/`, {
                    headers: getAuthHeaders(),
                  });

                  toast.success(
                    `Grow Tag "${name}" (${grow_id}) deleted successfully!`,
                    { id: loadingToast },
                  );

                  setTimeout(() => {
                    loadGrowtags();
                  }, 250);
                } catch (err) {
                  const msg = extractErrorMessage(err);
                  toast.error(msg, { id: loadingToast });
                }
              }}
              className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000 },
    );
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewData(null);
    setComplaints([]);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        {/* Search Input */}
        <div className="relative w-full max-w-sm">
          <input
            type="text"
            placeholder="Search by Name, Grow ID, Phone, or Email..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-2 pl-10 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Search size={18} />
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <button
            onClick={() => navigate("/assign-growtags")}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 whitespace-nowrap"
          >
            Assign Grow Tags
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 whitespace-nowrap"
          >
            + Add Grow Tag
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading grow tags...</p>
        </div>
      )}

      {/* TABLE */}
      {!loading && (
        <div className="hidden md:block bg-white shadow-lg rounded-2xl p-4 border border-gray-200 overflow-x-auto">
          <h2 className="text-xl font-bold mb-4">
            Grow Tags List ({filteredUsers.length} Found)
          </h2>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="p-3 border">Photo</th>
                <th className="p-3 border">Grow ID</th>
                <th className="p-3 border">Name</th>
                <th className="p-3 border">Phone</th>
                <th className="p-3 border">Email</th>
                <th className="p-3 border">Created By</th>

                <th className="p-3 border text-center">Status</th>
                <th className="p-3 border text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3 border">
                    {u.image ? (
                      <img
                        src={u.image}
                        alt="avatar"
                        className="w-12 h-12 rounded-full border shadow"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 border">{u.grow_id}</td>
                  <td className="p-3 border">{u.name}</td>
                  <td className="p-3 border">{u.phone}</td>
                  <td className="p-3 border">{u.email || "-"}</td>
                  <td className="p-3 border text-gray-500">
                    {u.created_by ? u.created_by : "—"}
                  </td>

                  <td className="p-3 border text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="p-3 border">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleView(u)}
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                        title="View Details"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEdit(u)}
                        className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center p-6 text-gray-500">
                    {searchQuery
                      ? `No results found for "${searchQuery}".`
                      : "No grow tags available."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MOBILE CARD VIEW */}
      {!loading && (
        <div className="md:hidden space-y-4">
          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-xl border shadow p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {u.image ? (
                    <img src={u.image} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      —
                    </div>
                  )}
                  <div>
                    <p className="font-bold">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.grow_id}</p>
                  </div>
                </div>
                <p>👤 Created By: {u.created_by ? u.created_by : "—"}</p>

                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    u.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {u.status}
                </span>
              </div>

              {/* Info */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>📞 {u.phone}</p>
                <p>✉️ {u.email || "-"}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t">
                <button
                  onClick={() => handleView(u)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => handleEdit(u)}
                  className="flex-1 bg-yellow-500 text-white py-2 rounded-lg text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(u.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Modal - No Overlapping */}
      {showFormModal && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white shadow-2xl w-full max-w-3xl rounded-2xl flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-6 py-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">
                {isEdit ? "Edit Grow Tag" : "Add Grow Tag"}
              </h2>
              <button
                onClick={closeFormModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center pb-6 border-b border-gray-100">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 overflow-hidden flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                      {preview ? (
                        <img
                          src={preview}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg
                          className="w-8 h-8 text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-3.5 h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </div>
                  <label className="cursor-pointer bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white text-xs font-semibold px-5 py-2 mt-3 rounded-full shadow-sm hover:shadow-md transition-all">
                    Choose Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhoto}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Grow ID */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Grow ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="grow_id"
                      value={form.grow_id}
                      disabled={isEdit}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all ${
                        errors.grow_id ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder={isEdit ? "Cannot be changed" : "Id"}
                    />
                    {errors.grow_id && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.grow_id}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="Enter full name"
                    />
                    {errors.name && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.name}
                      </span>
                    )}
                  </div>

                  {/* Password (Required for both Add and Edit) */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        className={`px-4 py-2.5 pr-12 border rounded-lg bg-white w-full focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={
                          isEdit
                            ? "Leave empty to keep current password"
                            : "Enter password"
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? (
                          <Eye size={20} />
                        ) : (
                          <EyeOff size={20} />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.password}
                      </span>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="10-digit mobile number"
                    />
                    {errors.phone && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.phone}
                      </span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="user@example.com"
                    />
                    {errors.email && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.email}
                      </span>
                    )}
                  </div>

                  {/* Pincode */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.pincode ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="6-digit postal code"
                    />
                    {errors.pincode && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.pincode}
                      </span>
                    )}
                  </div>

                  {/* Area */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Area <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="area"
                      value={form.area}
                      onChange={handleAreaSelect}
                      className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.area ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select Area</option>
                      {loadingAreas && <option>Loading areas...</option>}
                      {areas.map((a, index) => (
                        <option key={index} value={a.Name}>
                          {a.Name}
                        </option>
                      ))}
                    </select>
                    {errors.area && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.area}
                      </span>
                    )}
                  </div>

                  {/* State (Auto-filled) */}
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      State
                    </label>
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
                    <label className="text-sm font-semibold text-gray-700">
                      Aadhar <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="adhar"
                      value={form.adhar}
                      onChange={handleChange}
                      className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        errors.adhar ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="12-digit Aadhar number"
                    />
                    {errors.adhar && (
                      <span className="text-red-500 text-xs mt-1">
                        {errors.adhar}
                      </span>
                    )}
                  </div>
                </div>

                {/* Address - Full Width */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={`px-4 py-2.5 border rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none ${
                      errors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    rows="3"
                    placeholder="House no, Street, Locality"
                  />
                  {errors.address && (
                    <span className="text-red-500 text-xs mt-1">
                      {errors.address}
                    </span>
                  )}
                </div>

                {/* Status - Full Width */}
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
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
                    Complete all mandatory fields to{" "}
                    {isEdit ? "update" : "create"} the Grow Tag
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
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  {isEdit ? "Update Grow Tag" : "Create Grow Tag"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODAL */}
      {showViewModal && viewData && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-800">
                Grow Tag Details
              </h2>
              <button
                onClick={closeViewModal}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                {/* Photo */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-gray-100 border overflow-hidden mb-3">
                    {viewData.image ? (
                      <img
                        src={viewData.image}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-400 p-8">
                        No Image
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      viewData.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {viewData.status}
                  </span>
                </div>

                {/* Basic Info */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Grow ID</p>
                      <p className="font-medium">{viewData.grow_id}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-medium">{viewData.name}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{viewData.phone}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{viewData.email || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">Aadhar</p>
                      <p className="font-medium">{viewData.adhar || "-"}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500">System ID</p>
                      <p className="font-medium">{viewData.id}</p>
                    </div>

                    {/* ✅ CREATED BY */}
                    <div>
                      <p className="text-sm text-gray-500">Created By</p>
                      <p className="font-medium text-gray-700">
                        {viewData.created_by?.username ||
                          viewData.created_by?.email ||
                          viewData.created_by ||
                          "—"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Address Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="font-medium">{viewData.address || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Area</p>
                    <p className="font-medium">{viewData.area || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">State</p>
                    <p className="font-medium">{viewData.state || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pincode</p>
                    <p className="font-medium">{viewData.pincode || "-"}</p>
                  </div>
                </div>
              </div>

              {/* COMPLAINTS SECTION */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3 border-t pt-4">
                  Assigned Complaints (
                  {loadingComplaints ? "Loading..." : complaints.length})
                </h3>

                {loadingComplaints ? (
                  <div className="text-center py-4 text-gray-500">
                    Loading complaints...
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No assigned complaints found for this Grow Tag.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {complaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="p-3 border rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      >
                        <div className="flex justify-between items-center">
                          <p className="font-semibold text-blue-600">
                            Complaint ID:{" "}
                            {complaint.complaint_id || complaint.id}
                          </p>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full 
                                          ${
                                            complaint.status === "Open"
                                              ? "bg-red-100 text-red-700"
                                              : complaint.status ===
                                                  "In Progress"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : "bg-green-100 text-green-700"
                                          }`}
                          >
                            {complaint.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mt-1">
                          Title: {complaint.title || "N/A"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Area: {complaint.area || "N/A"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Created/Updated Info */}
              <div className="mb-6 text-sm text-gray-500 border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p>
                      Created On:{" "}
                      {new Date(viewData.created_on).toLocaleDateString()}
                    </p>
                    <p>
                      Created At:{" "}
                      {new Date(viewData.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p>
                      Updated At:{" "}
                      {new Date(viewData.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={closeViewModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closeViewModal();
                    handleEdit(viewData);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Grow Tag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
