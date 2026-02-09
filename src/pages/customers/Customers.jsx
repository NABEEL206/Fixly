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
} from "lucide-react";
import toast from "react-hot-toast";
import { BASE_URL } from "@/API/BaseURL";

// --- API Endpoints ---
const CUSTOMER_API = `${BASE_URL}/api/customers/`;

// --- MAIN COMPONENT ---
export default function CustomerTable() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const [history, setHistory] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [historyModal, setHistoryModal] = useState(false);

  // Get authentication headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("access_token");
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
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

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      if (!checkAuth()) {
        setLoading(false);
        return;
      }

      const res = await fetch(CUSTOMER_API, {
        headers: getAuthHeaders(),
      });

      if (res.status === 401) {
        toast.error("Session expired. Please login again.");
        setCustomers([]);
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setCustomers(data);
      setSelectedRows(new Set()); // Clear selections on refresh
      setSelectAll(false);
    } catch (err) {
      console.error("Fetch customers error:", err);
      setFetchError("Failed to load customer data. Check API status.");
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

  // Bulk delete with proper toast management
  const handleBulkDelete = () => {
    if (selectedRows.size === 0) {
      toast("Please select at least one customer to delete.", {
        icon: "⚠️",
        duration: 3000,
      });
      return;
    }

    // Clear any existing toasts
    toast.dismiss();

    // Create custom confirmation toast
    const confirmationToastId = toast.custom(
      (t) => (
        <div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-md">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Trash2 className="text-red-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                Delete {selectedRows.size} selected customer
                {selectedRows.size > 1 ? "s" : ""}?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This action cannot be undone. All related data will be
                permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await performBulkDelete();
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      }
    );
  };

  // Perform bulk delete operation
  const performBulkDelete = async () => {
    if (!checkAuth()) return;

    toast.dismiss(); // 🔥 remove delay effect

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

  // Individual delete with proper toast management
  const deleteCustomer = (id, customerName) => {
    // Clear any existing toasts
    toast.dismiss();

    // Create custom confirmation toast
    const confirmationToastId = toast.custom(
      (t) => (
        <div className="flex flex-col gap-3 p-4 bg-white rounded-lg shadow-lg border border-gray-200 max-w-md">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Trash2 className="text-red-500" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                Delete customer: {customerName}?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently delete the customer and all related data.
                This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await performIndividualDelete(id, customerName);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
      }
    );
  };

  // Perform individual delete operation
  const performIndividualDelete = async (id, customerName) => {
    if (!checkAuth()) return;

    toast.dismiss(); // 🚀 instant

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

  // Handle Row Click (Opens History Modal)
  const handleViewHistory = (customer) => {
    setSelectedCustomer(customer);
    setHistory(customer.complaints_history || []);
    setHistoryModal(true);
  };

  // Filtered customers
  const filtered = customers.filter(
    (item) =>
      item.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.customer_phone.includes(search) ||
      (item.state && item.state.toLowerCase().includes(search.toLowerCase()))
  );

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

  // History Modal Component
  const HistoryModal = () => (
    <div className="fixed inset-0  flex justify-center items-center z-50 p-4">
      <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-4xl transform transition-all duration-300 scale-100 border border-gray-200">
        {/* Modal Header */}
        <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-3">
          <h2 className="text-2xl md:text-3xl font-light text-slate-700 flex items-center gap-2">
            <History size={28} className="text-teal-600" />
            Complaint History
          </h2>
          <button
            onClick={() => setHistoryModal(false)}
            className="text-gray-400 hover:text-red-500 transition"
            title="Close"
          >
            <X size={24} />
          </button>
        </div>

        <p className="text-lg font-semibold text-gray-700 mb-4">
          Customer: {selectedCustomer?.customer_name}
        </p>

        {history.length === 0 ? (
          <p className="text-center py-12 bg-gray-50 rounded-lg text-gray-500 text-lg border border-gray-200">
            No complaint history records found for this customer.
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto border border-gray-200 rounded-lg shadow-inner">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Model / Issue
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Assigned To
                  </th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition duration-150"
                  >
                    <td className="px-4 py-3 font-mono text-slate-600 text-sm">
                      {h.id}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      <span className="font-semibold text-blue-600">
                        {h.phone_model || "N/A"}
                      </span>
                      : {h.issue_details.substring(0, 50)}...
                    </td>
                    <td className="px-4 py-3 text-gray-700">
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
        )}

        <button
          onClick={() => setHistoryModal(false)}
          className="mt-6 bg-slate-600 text-white px-8 py-3 rounded-lg hover:bg-slate-700 transition w-full font-bold text-lg shadow-md"
        >
          Close History
        </button>
      </div>
    </div>
  );

  // Main Component Return
  return (
    <div className="p-4 md:p-8 max-w-8xl mx-auto bg-gray-50 min-h-screen">
      {/* 1. Header Section */}
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

      {/* 2. Bulk Operations Bar */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium text-blue-800">
              {selectedRows.size} customer{selectedRows.size !== 1 ? "s" : ""}{" "}
              selected
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

      {/* 3. Search & Controls Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or state..."
            className="pl-10 pr-5 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-blue-500 focus:border-blue-500 transition"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
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

      {/* 4. Main Table Container */}
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
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider hidden sm:table-cell">
                Email
              </th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider hidden sm:table-cell">
                State
              </th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider hidden md:table-cell">
                Address
              </th>
              <th className="px-4 py-4 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap">
  Created By
</th>

              <th className="px-4 py-4 text-center font-medium text-xs uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {fetchError ? (
              <tr>
                <td
                  colSpan="9"
                  className="text-center py-10 text-red-600 bg-red-50 font-medium"
                >
                  {fetchError}
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td colSpan="8" className="text-center py-10 text-slate-600">
                  <RotateCw
                    className="animate-spin inline-block mr-2"
                    size={18}
                  />
                  <span className="animate-pulse">
                    Fetching customer data...
                  </span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="text-center py-10 text-gray-500 bg-gray-50"
                >
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
                  <td className="px-4 py-3 font-mono text-slate-600 text-sm">
                    {cust.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {cust.customer_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden sm:table-cell text-xs">
                    {cust.email}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {cust.customer_phone}
                  </td>
                  <td className="px-4 py-3 text-gray-700 hidden sm:table-cell text-xs font-semibold">
                    {cust.state || "N/A"}
                  </td>
                  <td className="px-4 py-3 text-gray-700 hidden md:table-cell text-xs">
                    {cust.address}
                  </td>
<td className="px-4 py-3 whitespace-nowrap text-gray-400">
  —
</td>



                  {/* ACTIONS */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewHistory(cust);
                        }}
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
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomer(cust.id, cust.customer_name);
                        }}
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
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">
                    {cust.customer_name}
                  </p>
                  <p className="text-xs text-gray-500">ID: {cust.id}</p>
                </div>

                <input
                  type="checkbox"
                  checked={selectedRows.has(cust.id)}
                  onChange={() => handleRowSelect(cust.id)}
                  className="h-4 w-4 text-blue-600"
                />
              </div>

              {/* Info */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>📞 {cust.customer_phone}</p>
                <p>✉️ {cust.email}</p>
                {cust.state && <p>📍 {cust.state}</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t">
                <button
                  onClick={() => handleViewHistory(cust)}
                  className="flex-1 bg-teal-100 text-teal-700 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <History size={14} />
                  History
                  <span className="bg-teal-200 text-teal-800 px-2 rounded-full text-xs">
                    {cust.complaints_history?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => deleteCustomer(cust.id, cust.customer_name)}
                  className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Table Footer */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <div>
          Showing {filtered.length} of {customers.length} total customers
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`px-3 py-1 rounded ${
              selectedRows.size > 0
                ? "bg-blue-50 text-blue-700"
                : "text-gray-400"
            }`}
          >
            {selectedRows.size} selected
          </div>
        </div>
      </div>

      {historyModal && <HistoryModal />}
    </div>
  );
}
