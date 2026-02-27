// src/pages/customers/Customers.jsx
import React, { useEffect, useState } from "react";
import {
  Search,
  RotateCw,
  History,
  Trash2,
  X,
  Users,
  Zap,
  Check,
  Clock,
  MinusCircle,
  UserCircle,
  Filter,
  Eye,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Package,
  Tag,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/API/BaseURL";
import { getAuthHeaders } from "@/utils/authHeaders";

// --- API Endpoints ---
const CUSTOMER_API = `${BASE_URL}/api/customers/`;

// --- MAIN COMPONENT ---
export default function CustomerTable() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [createdByFilter, setCreatedByFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [history, setHistory] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // View Modal State
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedCustomerForView, setSelectedCustomerForView] = useState(null);

  // Debug function to check auth state
  const debugAuth = () => {
    const token = localStorage.getItem("access_token");
    const tokenType = localStorage.getItem("token_type");
    const user = localStorage.getItem("user");
    
    console.log("=== Auth Debug ===");
    console.log("Token exists:", !!token);
    console.log("Token type:", tokenType || "not set");
    console.log("Token preview:", token ? `${token.substring(0, 20)}...` : "none");
    console.log("User exists:", !!user);
    if (user) {
      try {
        const userData = JSON.parse(user);
        console.log("User role:", userData.role);
      } catch (e) {
        console.log("Error parsing user:", e);
      }
    }
    console.log("==================");
    
    return !!token;
  };

  // Check authentication
  const checkAuth = () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.error("Session expired. Please login again.");
      return false;
    }
    return true;
  };

  // Fetch Customers with better error handling
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // Debug auth state
      debugAuth();

      if (!checkAuth()) {
        setLoading(false);
        return;
      }

      const headers = getAuthHeaders();
      console.log("Request headers:", headers);

      const res = await fetch(CUSTOMER_API, {
        headers: headers,
      });

      console.log("Response status:", res.status);
      console.log("Response status text:", res.statusText);

      if (res.status === 401) {
        toast.error("Session expired. Please login again.");
        setCustomers([]);
        return;
      }

      if (res.status === 403) {
        const errorData = await res.text();
        console.error("403 Forbidden response:", errorData);
        
        // Try to parse error as JSON if possible
        try {
          const jsonError = JSON.parse(errorData);
          toast.error(jsonError.detail || "You don't have permission to view customers");
        } catch {
          toast.error("Access denied. You don't have permission to view customers.");
        }
        
        setCustomers([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Customers data received:", data);
      setCustomers(data);
      setSelectedRows(new Set());
      setSelectAll(false);
    } catch (err) {
      console.error("Fetch customers error:", err);
      setFetchError(`Failed to load customer data: ${err.message}`);
      setCustomers([]);
      toast.error("Failed to load customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Handle row selection
  const handleRowSelect = (id) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === filtered.length && filtered.length > 0);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      const allIds = new Set(filtered.map((cust) => cust.id));
      setSelectedRows(allIds);
    }
    setSelectAll(!selectAll);
  };

  // Handle View Customer
  const handleViewCustomer = (customer) => {
    setSelectedCustomerForView(customer);
    setViewModalOpen(true);
  };

  // Bulk delete toast
  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      toast("Please select at least one customer to delete.", {
        icon: "⚠️",
        duration: 3000,
      });
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Delete {selectedRows.size} selected customer{selectedRows.size > 1 ? "s" : ""}?</p>
          <p className="text-xs text-gray-500">This action cannot be undone. All related data will be permanently deleted.</p>
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
                await performBulkDelete();
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

  // Perform bulk delete operation
  const performBulkDelete = async () => {
    if (!checkAuth()) return;

    try {
      const idsToDelete = Array.from(selectedRows);

      const deletePromises = idsToDelete.map(async (id) => {
        try {
          const response = await fetch(`${CUSTOMER_API}${id}/`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });

          if (!response.ok && response.status !== 204) {
            throw new Error();
          }
          return true;
        } catch {
          return false;
        }
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter(Boolean).length;
      const failCount = results.length - successCount;

      setCustomers((prev) => prev.filter((cust) => !selectedRows.has(cust.id)));
      setSelectedRows(new Set());
      setSelectAll(false);

      if (failCount === 0) {
        toast.success(`Deleted ${successCount} customers`);
      } else if (successCount > 0) {
        toast.success(`Deleted ${successCount}, failed ${failCount}`);
      } else {
        toast.error("Failed to delete customers");
      }
    } catch {
      toast.error("Bulk delete failed");
    }
  };

  // Individual delete toast
  const deleteCustomer = (id, customerName) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Delete customer: {customerName}?</p>
          <p className="text-xs text-gray-500">This will permanently delete the customer and all related data. This action cannot be undone.</p>
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
                await performIndividualDelete(id, customerName);
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

  // Perform individual delete operation
  const performIndividualDelete = async (id, customerName) => {
    if (!checkAuth()) return;

    try {
      const response = await fetch(`${CUSTOMER_API}${id}/`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!response.ok && response.status !== 204) {
        throw new Error();
      }

      setCustomers((prev) => prev.filter((cust) => cust.id !== id));
      setSelectedRows((prev) => {
        const s = new Set(prev);
        s.delete(id);
        return s;
      });

      toast.success(`Customer "${customerName}" deleted`);
    } catch {
      toast.error("Delete failed");
    }
  };

  // Handle View History
  const handleViewHistory = (customer) => {
    setSelectedCustomer(customer);
    setHistory(customer.complaints_history || []);
    setHistoryModal(true);
  };

  // Get unique created by values for filter dropdown
  const getUniqueCreatedBy = () => {
    const createdBySet = new Set();
    customers.forEach(cust => {
      if (cust.created_by && cust.created_by.username) {
        createdBySet.add(cust.created_by.username);
      }
    });
    return Array.from(createdBySet).sort();
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch("");
    setCreatedByFilter("");
  };

  // Filtered customers
  const filtered = customers.filter((item) => {
    const matchesSearch = 
      item.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.customer_phone.includes(search);

    const matchesCreatedBy = 
      createdByFilter === "" || 
      (item.created_by && item.created_by.username === createdByFilter);

    return matchesSearch && matchesCreatedBy;
  });

  // Status Badge Component
  const getStatusBadge = (status) => {
    let classes = "bg-gray-100 text-gray-700";
    let Icon = MinusCircle;

    if (status === "Resolved") {
      classes = "bg-emerald-50 text-emerald-700 border border-emerald-300";
      Icon = Check;
    } else if (status === "In Progress") {
      classes = "bg-amber-50 text-amber-700 border border-amber-300";
      Icon = Clock;
    } else if (status === "Pending") {
      classes = "bg-sky-50 text-sky-700 border border-sky-300";
      Icon = Zap;
    } else if (status === "Assigned") {
      classes = "bg-slate-100 text-slate-700 border border-slate-300";
      Icon = Users;
    }

    return (
      <span
        className={`px-3 py-1 text-xs rounded-full font-semibold flex items-center gap-1 ${classes}`}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  };

  // Format Date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ================= STANDARDIZED MODALS =================

  // View Modal Component
  const ViewModal = () => {
    if (!selectedCustomerForView) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header - Gradient background like Leads.jsx */}
          <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Customer Details</h2>
                <p className="text-sm text-gray-500">ID: {selectedCustomerForView.id}</p>
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
            <div className="space-y-6">
              {/* Status Badge - if any status exists */}
              {selectedCustomerForView.status && (
                <div className="flex justify-end">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusStyle(selectedCustomerForView.status)}`}>
                    {selectedCustomerForView.status}
                  </span>
                </div>
              )}

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
                      {selectedCustomerForView.customer_name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                    <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                      <Phone size={16} className="text-blue-500" />
                      {selectedCustomerForView.customer_phone}
                    </p>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                    <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                      <Mail size={16} className="text-blue-500" />
                      {selectedCustomerForView.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</label>
                    <p className="text-base text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                      {selectedCustomerForView.address || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Area</label>
                    <p className="text-base text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                      {selectedCustomerForView.area || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pincode</label>
                    <p className="text-base text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                      {selectedCustomerForView.pincode || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">State</label>
                    <p className="text-base text-gray-900 bg-white p-3 rounded-lg border border-gray-200">
                      {selectedCustomerForView.state || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* System Information Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Package className="w-5 h-5 text-purple-600" />
                  System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</label>
                    <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                      <UserCircle size={16} className="text-gray-500" />
                      {selectedCustomerForView.created_by?.username || "System"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</label>
                    <p className="text-base font-medium text-gray-900 bg-white p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(selectedCustomerForView.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Complaints Summary Section */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Complaints Summary
                </h3>
                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                  <span className="text-gray-700">Total Complaints</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {selectedCustomerForView.complaints_history?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
            <button
              onClick={() => {
                setViewModalOpen(false);
                handleViewHistory(selectedCustomerForView);
              }}
              className="px-6 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
            >
              <History size={18} />
              View Complaint History
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
    );
  };

  // History Modal Component - Standardized to match View Modal
  const HistoryModal = () => {
    if (!selectedCustomer) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal Header - Gradient background matching View Modal */}
          <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-teal-50 to-emerald-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <History className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Complaint History</h2>
                <p className="text-sm text-gray-500">Customer: {selectedCustomer.customer_name}</p>
              </div>
            </div>
            <button
              onClick={() => setHistoryModal(false)}
              className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-grow overflow-y-auto p-6">
            {history.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                <History size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No Complaint History</h3>
                <p className="text-gray-500">This customer has no complaint records yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">Total Complaints</p>
                    <p className="text-2xl font-bold text-teal-600">{history.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {history.filter(h => h.status === "Pending").length}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {history.filter(h => h.status === "In Progress").length}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-500 uppercase">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">
                      {history.filter(h => h.status === "Resolved").length}
                    </p>
                  </div>
                </div>

                {/* Complaints Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Phone Model</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Issue</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Assigned To</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {history.map((h) => (
                        <tr key={h.id} className="hover:bg-gray-50 transition">
                          <td className="px-4 py-3 font-mono text-slate-600 text-sm">#{h.id}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {new Date(h.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-medium text-blue-600">{h.phone_model || "N/A"}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-700 max-w-xs truncate">
                            {h.issue_details}
                          </td>
                          <td className="px-4 py-3">
                            {getStatusBadge(h.status)}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            {h.assign_to || "Unassigned"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end p-6 border-t bg-gray-50">
            <button
              onClick={() => setHistoryModal(false)}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper for status styles (if needed in View Modal)
  const getStatusStyle = (status) => {
    if (status === "New") return "bg-yellow-100 text-yellow-800 border border-yellow-200";
    if (status === "Complaint Registered") return "bg-green-100 text-green-800 border border-green-200";
    return "bg-gray-100 text-gray-800 border border-gray-200";
  };

  // Main Component Return
  return (
    <div className="p-4 md:p-8 max-w-8xl mx-auto bg-gray-50 min-h-screen">
      {/* Debug Button - Remove in production */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={debugAuth}
          className="text-xs bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
        >
          Debug Auth
        </button>
      </div>

      {/* Header Section */}
      <div className="mb-6 border-b border-gray-200 pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Users size={22} className="text-teal-600" />
            Customer Management
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Manage and track customer records and complaints
          </p>
        </div>
      </div>

      {/* Bulk Operations Bar */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-blue-800">
              {selectedRows.size} customer{selectedRows.size !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700 bg-red-50 px-4 py-2 rounded-md 
                      hover:bg-red-100 transition shadow-sm border border-red-200"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-sm text-gray-600 hover:text-gray-800 px-3 py-2"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Search & Controls Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              className="pl-10 pr-5 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium border ${
                showFilters || createdByFilter
                  ? "bg-teal-50 text-teal-700 border-teal-300"
                  : "text-gray-700 hover:bg-gray-100 border-gray-300"
              }`}
            >
              <Filter size={16} />
              Filters
              {createdByFilter && (
                <span className="ml-1 bg-teal-200 text-teal-800 px-2 py-0.5 rounded-full text-xs">
                  1
                </span>
              )}
            </button>

            <div className="text-sm text-gray-500">
              {filtered.length} customer{filtered.length !== 1 ? "s" : ""}
            </div>
            <div className="h-6 w-px bg-gray-300"></div>
            <button
              onClick={fetchCustomers}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition font-medium ${
                loading
                  ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100 border border-gray-300"
              }`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RotateCw className="animate-spin h-4 w-4" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RotateCw size={16} />
                  Refresh
                </>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-full sm:w-64">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  <UserCircle size={14} className="inline mr-1" />
                  Created By
                </label>
                <select
                  value={createdByFilter}
                  onChange={(e) => setCreatedByFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Users</option>
                  {getUniqueCreatedBy().map((username) => (
                    <option key={username} value={username}>
                      {username}
                    </option>
                  ))}
                </select>
              </div>

              {(search || createdByFilter) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
                >
                  <X size={14} />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(search || createdByFilter) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Active filters:</span>
          {search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
              Search: "{search}"
              <button onClick={() => setSearch("")} className="hover:text-blue-900">
                <X size={12} />
              </button>
            </span>
          )}
          {createdByFilter && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs border border-teal-200">
              Created by: {createdByFilter}
              <button onClick={() => setCreatedByFilter("")} className="hover:text-teal-900">
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Error Display */}
      {fetchError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <p className="font-medium">Error loading customers</p>
          <p className="text-sm mt-1">{fetchError}</p>
          <button
            onClick={fetchCustomers}
            className="mt-2 px-3 py-1 bg-red-100 text-red-800 rounded hover:bg-red-200 text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="hidden md:block overflow-x-auto shadow-lg rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr className="text-gray-600">
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider">ID</th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider">Customer Name</th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider">Email</th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider">Phone</th>
              <th className="px-4 py-4 text-center font-medium text-xs uppercase tracking-wider">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {fetchError ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-red-600 bg-red-50 font-medium">
                  {fetchError}
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-slate-600">
                  <RotateCw className="animate-spin inline-block mr-2" size={18} />
                  <span className="animate-pulse">Fetching customer data...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-10 text-gray-500 bg-gray-50">
                  No customers found matching the search criteria.
                </td>
              </tr>
            ) : (
              filtered.map((cust) => (
                <tr
                  key={cust.id}
                  className={`hover:bg-gray-50 transition duration-100 ${
                    selectedRows.has(cust.id) ? "bg-blue-50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(cust.id)}
                      onChange={() => handleRowSelect(cust.id)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600 text-sm">{cust.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{cust.customer_name}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{cust.email}</td>
                  <td className="px-4 py-3 text-gray-600">{cust.customer_phone}</td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewCustomer(cust)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 px-3 py-1.5 rounded hover:bg-blue-50 transition"
                        title="View Customer Details"
                      >
                        <Eye size={14} />
                        <span className="hidden sm:inline">View</span>
                      </button>

                      <button
                        onClick={() => handleViewHistory(cust)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-teal-700 hover:text-teal-900 px-3 py-1.5 rounded hover:bg-teal-50 transition"
                        title="View Complaint History"
                      >
                        <History size={14} />
                        <span className="hidden sm:inline">History</span>
                        <span className="ml-1 text-xs bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-full">
                          {cust.complaints_history?.length || 0}
                        </span>
                      </button>

                      <button
                        onClick={() => deleteCustomer(cust.id, cust.customer_name)}
                        className="inline-flex items-center text-xs font-medium text-red-700 hover:text-red-900 p-1.5 rounded hover:bg-red-50 transition"
                        title="Delete Customer Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">
            <RotateCw className="animate-spin mx-auto mb-2" />
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No customers found
          </div>
        ) : (
          filtered.map((cust) => (
            <div
              key={cust.id}
              className={`bg-white rounded-xl border shadow p-4 space-y-3 ${
                selectedRows.has(cust.id) ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{cust.customer_name}</p>
                  <p className="text-xs text-gray-500">ID: {cust.id}</p>
                </div>
                <input
                  type="checkbox"
                  checked={selectedRows.has(cust.id)}
                  onChange={() => handleRowSelect(cust.id)}
                  className="h-4 w-4 text-blue-600"
                />
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p>📞 {cust.customer_phone}</p>
                <p>✉️ {cust.email}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t">
                <button
                  onClick={() => handleViewCustomer(cust)}
                  className="bg-blue-100 text-blue-700 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Eye size={14} />
                  View
                </button>

                <button
                  onClick={() => handleViewHistory(cust)}
                  className="bg-teal-100 text-teal-700 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <History size={14} />
                  <span className="bg-teal-200 text-teal-800 px-2 rounded-full text-xs">
                    {cust.complaints_history?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => deleteCustomer(cust.id, cust.customer_name)}
                  className="bg-red-100 text-red-700 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Table Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {filtered.length} of {customers.length} total customers
        </div>
        <div className="flex items-center gap-4">
          <div className={`px-3 py-1 rounded ${
            selectedRows.size > 0 ? "bg-blue-50 text-blue-700" : "text-gray-400"
          }`}>
            {selectedRows.size} selected
          </div>
        </div>
      </div>

      {/* Modals */}
      {historyModal && <HistoryModal />}
      {viewModalOpen && <ViewModal />}
    </div>
  );
}