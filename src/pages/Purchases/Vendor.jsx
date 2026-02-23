import React, { useState, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  Check,
  Building,
  Phone,
  Mail,
  MapPin,
  Globe,
  Filter,
  Eye,
  User,
} from "lucide-react";

const Vendor = () => {
  // Initial vendors data
  const initialVendors = [
    {
      id: 1,
      name: "Tech Solutions Inc.",
      email: "contact@techsolutions.com",
      phone: "+1 (555) 123-4567",
      address: "123 Tech Street, San Francisco, CA",
      website: "https://techsolutions.com",
      status: "Active",
      createdBy: "admin",
    },
    {
      id: 2,
      name: "Global Supplies Ltd.",
      email: "info@globalsupplies.com",
      phone: "+1 (555) 987-6543",
      address: "456 Business Ave, New York, NY",
      website: "https://globalsupplies.com",
      status: "Inactive",
      createdBy: "franchise",
    },
    {
      id: 3,
      name: "Logistics Pro",
      email: "support@logisticspro.com",
      phone: "+1 (555) 456-7890",
      address: "789 Logistics Blvd, Chicago, IL",
      website: "https://logisticspro.com",
      status: "Active",
      createdBy: "admin",
    },
    {
      id: 4,
      name: "Office Supplies Co.",
      email: "sales@officesupplies.com",
      phone: "+1 (555) 234-5678",
      address: "321 Commerce St, Los Angeles, CA",
      website: "https://officesupplies.com",
      status: "Active",
      createdBy: "vendor",
    },
    {
      id: 5,
      name: "Industrial Parts Ltd.",
      email: "orders@industrialparts.com",
      phone: "+1 (555) 876-5432",
      address: "555 Factory Rd, Detroit, MI",
      website: "https://industrialparts.com",
      status: "Inactive",
      createdBy: "franchise",
    },
  ];

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    status: "Active",
    createdBy: "admin", // default value
  });

  // State management
  const [vendors, setVendors] = useState(initialVendors);
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingVendor, setViewingVendor] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [statusFilter, setStatusFilter] = useState("All");
  const [createdByFilter, setCreatedByFilter] = useState("All");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Get unique createdBy values for filter
  const createdByOptions = useMemo(() => {
    const creators = vendors.map(v => v.createdBy).filter(Boolean);
    return ['All', ...new Set(creators)];
  }, [vendors]);

  // Show toast function
  const showToast = (message, type = "success") => {
    if (type === "success") {
      toast.success(message);
    } else if (type === "error") {
      toast.error(message);
    } else if (type === "info") {
      toast.info(message);
    }
  };

  // Validation rules
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Vendor name is required";

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[\+]?[1-9][\d\-\(\)\.\s]{9,15}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    if (!formData.address.trim()) newErrors.address = "Address is required";

    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Invalid website URL (include http:// or https://)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast("Please fix the errors in the form", "error");
      return;
    }

    if (editingId) {
      // Update existing vendor
      setVendors((prev) =>
        prev.map((vendor) =>
          vendor.id === editingId ? { ...formData, id: editingId } : vendor,
        ),
      );
      showToast("Vendor updated successfully!");
    } else {
      // Add new vendor
      const newVendor = {
        ...formData,
        id: vendors.length > 0 ? Math.max(...vendors.map((v) => v.id)) + 1 : 1,
      };
      setVendors((prev) => [...prev, newVendor]);
      showToast("Vendor added successfully!");
    }

    resetForm();
    setIsModalOpen(false);
  };

  // View vendor
  const handleView = (vendor) => {
    setViewingVendor(vendor);
    setIsViewModalOpen(true);
  };

  // Edit vendor
  const handleEdit = (vendor) => {
    setFormData(vendor);
    setEditingId(vendor.id);
    setIsModalOpen(true);
  };

  // Delete vendor with toast confirmation
  const handleDelete = (id) => {
    setDeleteConfirmId(id);
    const vendor = vendors.find((v) => v.id === id);

    toast.warn(
      <div>
        <p className="font-medium mb-2">Delete {vendor?.name}?</p>
        <p className="text-sm mb-3">This action cannot be undone.</p>
        <div className="flex space-x-2">
          <button
            onClick={() => confirmDelete(id)}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => {
              toast.dismiss();
              setDeleteConfirmId(null);
            }}
            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        draggable: false,
      },
    );
  };

  // Confirm delete
  const confirmDelete = (id) => {
    setVendors((prev) => prev.filter((vendor) => vendor.id !== id));
    setDeleteConfirmId(null);
    toast.dismiss();
    showToast("Vendor deleted successfully!");
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      website: "",
      status: "Active",
      createdBy: "admin",
    });
  };

  // Filter vendors based on search, status, and createdBy
  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch = Object.values(vendor).some((value) =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
    );
    const matchesStatus =
      statusFilter === "All" || vendor.status === statusFilter;
    const matchesCreatedBy =
      createdByFilter === "All" || vendor.createdBy === createdByFilter;
    
    return matchesSearch && matchesStatus && matchesCreatedBy;
  });

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCreatedByFilter("All");
  };

  // View Modal Component
  const ViewModal = () => (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Building className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Vendor Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Complete vendor information
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                setViewingVendor(null);
              }}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {viewingVendor && (
            <div className="space-y-6">
              {/* Vendor Name & Status */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 mb-2">
                    {viewingVendor.name}
                  </h4>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      viewingVendor.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {viewingVendor.status}
                  </span>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Contact Information
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-0.5">
                      <Mail size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Email Address
                      </p>
                      <p className="text-sm text-gray-900 break-all">
                        {viewingVendor.email}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-0.5">
                      <Phone size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Phone Number
                      </p>
                      <p className="text-sm text-gray-900">
                        {viewingVendor.phone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Location
                </h5>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-0.5">
                    <MapPin size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Address
                    </p>
                    <p className="text-sm text-gray-900">
                      {viewingVendor.address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Created By Section */}
              <div>
                <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                  Created By
                </h5>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="mt-0.5">
                    <User size={18} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Created By
                    </p>
                    <p className="text-sm text-gray-900 capitalize">
                      {viewingVendor.createdBy || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Website Section */}
              {viewingVendor.website && (
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Online Presence
                  </h5>
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="mt-0.5">
                      <Globe size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Website
                      </p>
                      <a
                        href={viewingVendor.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {viewingVendor.website}
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                handleEdit(viewingVendor);
              }}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
            >
              <Edit size={16} className="mr-2" />
              Edit Vendor
            </button>
            <button
              onClick={() => {
                setIsViewModalOpen(false);
                setViewingVendor(null);
              }}
              className="px-5 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Two-column Modal component (Edit/Add)
  const VendorModal = () => (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building className="text-blue-600 mr-3" size={24} />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingId ? "Edit Vendor" : "New Vendor"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {editingId
                    ? "Update vendor information"
                    : "Add a new vendor to your system"}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body - Two Column Layout */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Basic Information
                </label>
                <div className="space-y-4">
                  {/* Vendor Name */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-600">
                        Vendor Name
                      </label>
                      <span className="text-xs text-red-500">Required</span>
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name
                          ? "border-red-500"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      placeholder="Enter vendor name"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-600">
                        Email Address
                      </label>
                      <span className="text-xs text-red-500">Required</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.email
                            ? "border-red-500"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder="vendor@company.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-600">
                        Phone Number
                      </label>
                      <span className="text-xs text-red-500">Required</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.phone
                            ? "border-red-500"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <div className="space-y-4">
                  {/* Address */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-600">
                        Address
                      </label>
                      <span className="text-xs text-red-500">Required</span>
                    </div>
                    <div className="relative">
                      <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                        <MapPin size={16} className="text-gray-400" />
                      </div>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows="4"
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                          errors.address
                            ? "border-red-500"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder="Street address, City, State, ZIP code"
                      />
                    </div>
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.address}
                      </p>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-600">
                        Website
                      </label>
                      <span className="text-xs text-gray-500">Optional</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Globe size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.website
                            ? "border-red-500"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                        placeholder="https://company.com"
                      />
                    </div>
                    {errors.website && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {errors.website}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-600">
                        Status
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 appearance-none bg-white"
                      >
                        <option value="Active" className="py-2">
                          Active
                        </option>
                        <option value="Inactive" className="py-2">
                          Inactive
                        </option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Active vendors will be available for selection
                    </p>
                  </div>

                  {/* Created By */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium text-gray-600">
                        Created By
                      </label>
                    </div>
                    <div className="relative">
                      <select
                        name="createdBy"
                        value={formData.createdBy}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-400 appearance-none bg-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="franchise">Franchise</option>
                        <option value="vendor">Vendor</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Select who created this vendor
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer - Full Width */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                <span className="font-medium">Note:</span> Fields marked with{" "}
                <span className="text-red-500">*</span> are required
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-800 hover:bg-gray-50 rounded-lg border border-gray-300 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center shadow-sm"
                >
                  <Check size={16} className="mr-2" />
                  {editingId ? "Update Vendor" : "Create Vendor"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
      />

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Building className="text-blue-600 mr-3" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vendors</h1>
            <p className="text-gray-600">Manage your vendor information</p>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[120px]"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {/* Created By Filter - Zoho Style */}
              <div className="flex items-center space-x-2">
                <User size={18} className="text-gray-400" />
                <select
                  value={createdByFilter}
                  onChange={(e) => setCreatedByFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[130px]"
                >
                  <option value="All">All Creators</option>
                  {createdByOptions.filter(opt => opt !== 'All').map((creator) => (
                    <option key={creator} value={creator} className="capitalize">
                      {creator}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button - Show when filters are active */}
              {(statusFilter !== "All" || createdByFilter !== "All" || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
                  title="Clear all filters"
                >
                  <X size={16} className="mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Add Vendor Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg flex items-center transition-colors duration-200 text-sm font-medium whitespace-nowrap shadow-sm"
          >
            <Plus size={18} className="mr-2" />
            Add Vendor
          </button>
        </div>

        {/* Active Filters Display */}
        {(statusFilter !== "All" || createdByFilter !== "All" || searchTerm) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-500">Active filters:</span>
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                Search: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm("")}
                  className="hover:text-blue-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {statusFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                Status: {statusFilter}
                <button
                  onClick={() => setStatusFilter("All")}
                  className="hover:text-blue-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {createdByFilter !== "All" && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200 capitalize">
                Created by: {createdByFilter}
                <button
                  onClick={() => setCreatedByFilter("All")}
                  className="hover:text-blue-900"
                >
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Vendor Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors.length > 0 ? (
                filteredVendors.map((vendor) => (
                  <tr
                    key={vendor.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center">
                          <Building className="text-blue-600" size={16} />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {vendor.name}
                          </div>
                          {vendor.website && (
                            <div className="text-xs text-blue-600 truncate max-w-[200px]">
                              {vendor.website.replace(/^https?:\/\//, "")}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail size={12} className="text-gray-400 mr-2" />
                          <span className="text-gray-900 truncate max-w-[180px]">
                            {vendor.email}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone size={12} className="text-gray-400 mr-2" />
                          <span className="text-gray-600">{vendor.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                        {vendor.address}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          vendor.status === "Active"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium capitalize">
                        <User size={12} className="mr-1" />
                        {vendor.createdBy}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleView(vendor)}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center">
                    <div className="text-gray-400">
                      <Building size={40} className="mx-auto mb-3" />
                      <p className="text-base font-medium">No vendors found</p>
                      <p className="text-sm mt-1">
                        {searchTerm || statusFilter !== "All" || createdByFilter !== "All"
                          ? "Try adjusting your filters"
                          : "Add your first vendor to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Stats */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
            <div className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-medium">{filteredVendors.length}</span> of{" "}
              <span className="font-medium">{vendors.length}</span> vendors
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-600">
                  Active: {vendors.filter((v) => v.status === "Active").length}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span className="text-xs text-gray-600">
                  Inactive:{" "}
                  {vendors.filter((v) => v.status === "Inactive").length}
                </span>
              </div>
              <div className="flex items-center space-x-2 border-l pl-3 border-gray-300">
                <User size={12} className="text-gray-400" />
                <span className="text-xs text-gray-600">
                  Creators: {createdByOptions.length - 1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && <VendorModal />}
      {isViewModalOpen && <ViewModal />}
    </div>
  );
};

export default Vendor;