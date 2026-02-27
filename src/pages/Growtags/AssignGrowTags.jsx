// src/pages/Growtags/AssignGrowTags.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/API/axiosInstance";

// API Endpoints
const ASSIGNMENTS_API_URL = "/api/growtag-assignments/";
const GROWTAGS_API_URL = "/api/growtags/";
const SHOPS_API_URL = "/api/shops/";

// Helper Functions
const extractErrorMessage = (err) => {
  const data = err?.response?.data;
  if (typeof data === "object") {
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return data.non_field_errors[0];
    }
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const firstVal = data[firstKey];
      if (Array.isArray(firstVal)) return `${firstKey}: ${firstVal[0]}`;
      return String(firstVal);
    }
  }
  return err?.message || "An unexpected error occurred.";
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// GrowTag Select Component
const GrowTagSelect = ({
  availableGrowTags,
  selectedGrowTag,
  setSelectedGrowTag,
  assigned,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const currentTag = availableGrowTags.find(
    (g) => String(g.id) === selectedGrowTag
  );

  const filteredTags = useMemo(() => {
    if (!searchTerm) return availableGrowTags;
    const query = searchTerm.toLowerCase();
    return availableGrowTags.filter(
      (g) =>
        g.grow_id.toLowerCase().includes(query) ||
        g.name.toLowerCase().includes(query) ||
        g.pincode?.toString().includes(query)
    );
  }, [availableGrowTags, searchTerm]);

  const unassignedTags = filteredTags.filter(
    (g) => !assigned.some((a) => a.growtag === g.id)
  );

  const isAllAssigned =
    availableGrowTags.length > 0 &&
    availableGrowTags.every((g) => assigned.some((a) => a.growtag === g.id));

  const handleSelect = (tagId) => {
    setSelectedGrowTag(String(tagId));
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium">Grow Tags*</label>
      <div
        className={`w-full border p-2 rounded-lg bg-white flex justify-between items-center cursor-pointer ${
          isOpen ? "ring-2 ring-blue-500" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {currentTag
            ? `${currentTag.grow_id} - ${currentTag.name} (Pincode: ${
                currentTag.pincode || "N/A"
              })`
            : "-- Select Active GrowTags --"}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isAllAssigned && (
        <p className="text-xs text-red-500 mt-1">
          All active tags are currently assigned.
        </p>
      )}

      {isOpen && (
        <div className="absolute bg-white border border-gray-300 rounded-lg shadow-xl w-full max-h-60 overflow-y-auto mt-1 z-50">
          <div className="p-2 border-b sticky top-0 bg-white z-10">
            <div className="relative">
              <input
                type="text"
                placeholder="Search ID, Name, or Pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <Search
                size={16}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {unassignedTags.length > 0 ? (
            unassignedTags.map((g) => (
              <div
                key={g.id}
                className={`p-2 hover:bg-blue-50 cursor-pointer text-sm ${
                  String(g.id) === selectedGrowTag
                    ? "bg-blue-100 font-medium"
                    : ""
                }`}
                onClick={() => handleSelect(g.id)}
              >
                <span className="font-semibold">{g.grow_id}</span> — {g.name}
                <span className="text-xs text-gray-500 ml-2">
                  (Pincode: {g.pincode || "N/A"})
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              {searchTerm
                ? `No unassigned tags match "${searchTerm}"`
                : "All active tags are assigned."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Shop Select Component
const ShopSelectDropdown = ({
  shops,
  selectedShop,
  selectedShopName,
  handleShopChange,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filteredShops = useMemo(() => {
    if (!searchTerm) return shops;
    const query = searchTerm.toLowerCase();
    return shops.filter(
      (s) =>
        s.shopname.toLowerCase().includes(query) ||
        s.pincode?.toString().includes(query) ||
        s.id?.toString().includes(query)
    );
  }, [shops, searchTerm]);

  const franchiseShops = filteredShops.filter(
    (s) => s.shop_type === "franchise"
  );
  const otherShops = filteredShops.filter((s) => s.shop_type === "othershop");

  const handleInternalSelect = (shop) => {
    const mockEvent = { target: { value: String(shop.id) } };
    handleShopChange(mockEvent);
    setIsOpen(false);
    setSearchTerm("");
  };

  const shopDisplay = selectedShopName || "-- Select Shop --";
  const shopType = shops.find((s) => s.id === Number(selectedShop))?.shop_type;

  return (
    <div className="relative">
      <label className="text-sm font-medium">Assign To*</label>

      <div
        className={`w-full border p-2 rounded-lg bg-white flex justify-between items-center cursor-pointer ${
          isOpen ? "ring-2 ring-blue-500" : ""
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {shopDisplay}
          {shopType && (
            <span
              className={`ml-2 text-xs font-semibold ${
                shopType === "franchise" ? "text-blue-600" : "text-yellow-600"
              }`}
            >
              ({shopType.toUpperCase().replace("_", " ")})
            </span>
          )}
        </span>
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {isOpen && (
        <div className="absolute bg-white border border-gray-300 rounded-lg shadow-xl w-full max-h-80 overflow-y-auto mt-1 z-50 p-3 space-y-3">
          {/* Search Input */}
          <div className="sticky top-0 bg-white z-10 pb-2 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Shop ID, Name, or Pincode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
              <Search
                size={16}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
              />
            </div>
          </div>

          {/* Franchise List */}
          <div>
            <p className="font-bold text-gray-700 text-sm mb-1">
              Active Franchise ({franchiseShops.length})
            </p>
            {franchiseShops.length > 0 ? (
              franchiseShops.map((s) => (
                <div
                  key={s.id}
                  className={`p-2 hover:bg-blue-50 cursor-pointer text-sm border-l-4 ${
                    String(s.id) === selectedShop
                      ? "bg-blue-100 font-medium border-blue-600"
                      : "border-transparent"
                  }`}
                  onClick={() => handleInternalSelect(s)}
                >
                  <span className="font-semibold text-blue-600">#{s.id}</span> —{" "}
                  {s.shopname}
                  <span className="text-xs text-gray-500 ml-2">
                    (Pincode: {s.pincode || "N/A"})
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 p-2">
                No matching franchises found.
              </p>
            )}
          </div>

          {/* Other Shops List */}
          <div className="mt-3">
            <p className="font-bold text-gray-700 text-sm mb-1 border-t pt-2">
              Active Other Shops ({otherShops.length})
            </p>
            {otherShops.length > 0 ? (
              otherShops.map((s) => (
                <div
                  key={s.id}
                  className={`p-2 hover:bg-yellow-50 cursor-pointer text-sm border-l-4 ${
                    String(s.id) === selectedShop
                      ? "bg-yellow-100 font-medium border-yellow-600"
                      : "border-transparent"
                  }`}
                  onClick={() => handleInternalSelect(s)}
                >
                  <span className="font-semibold text-yellow-600">#{s.id}</span>{" "}
                  — {s.shopname}
                  <span className="text-xs text-gray-500 ml-2">
                    (Pincode: {s.pincode || "N/A"})
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 p-2">
                No matching other shops found.
              </p>
            )}
          </div>

          {franchiseShops.length === 0 &&
            otherShops.length === 0 &&
            searchTerm && (
              <div className="text-center p-4 text-red-500">
                No shops found matching "{searchTerm}".
              </div>
            )}
        </div>
      )}
    </div>
  );
};

// Main Component
export default function AssignGrowTags() {
  const navigate = useNavigate();

  // State Management
  const [shops, setShops] = useState([]);
  const [growtags, setGrowTags] = useState([]);
  const [assigned, setAssigned] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedGrowTag, setSelectedGrowTag] = useState("");
  const [selectedShop, setSelectedShop] = useState("");
  const [selectedShopName, setSelectedShopName] = useState("");

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  // Add refs to prevent multiple clicks
  const isUnassigning = useRef(false);
  const isBulkUnassigning = useRef(false);

  // Data Fetching
  const fetchAllData = async () => {
    setLoading(true);
    const MIN_SPINNER_TIME = 2000;
    const startTime = Date.now();

    try {
      const [shopsRes, growtagsRes, assignmentsRes] = await Promise.all([
        axiosInstance.get(SHOPS_API_URL),
        axiosInstance.get(GROWTAGS_API_URL),
        axiosInstance.get(ASSIGNMENTS_API_URL),
      ]);

      setGrowTags(
        growtagsRes.data
          .filter((g) => g.status === "Active" || g.status === "active")
          .map((g) => ({ ...g, pincode: g.pincode || null }))
      );

      setShops(
        shopsRes.data
          .filter((s) => s.status === true)
          .map((s) => ({ ...s, shop_type: s.shop_type?.toLowerCase() }))
      );

      setAssigned(assignmentsRes.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to view this data");
      } else {
        toast.error("Failed to load initial data.");
      }
    } finally {
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_SPINNER_TIME) {
        await delay(MIN_SPINNER_TIME - elapsed);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Shop Selection Handler
  const handleShopChange = (e) => {
    const shopId = e.target.value;
    const shop = shops.find((s) => String(s.id) === shopId);
    setSelectedShop(shopId);
    setSelectedShopName(shop?.shopname || shop?.name || "");
  };

  const getSelectedShopType = () => {
    const shopId = Number(selectedShop);
    if (!shopId) return null;
    return shops.find((s) => s.id === shopId)?.shop_type;
  };

  // Assignment Handler
  const handleAssign = async () => {
    const growTagId = Number(selectedGrowTag);
    const shopId = Number(selectedShop);
    const shopType = getSelectedShopType();

    if (growTagId <= 0 || shopId <= 0 || !shopType) {
      toast.error("Please select an Active Grow Tag and a Shop.");
      return;
    }

    const payload = { growtag: growTagId };
    if (shopType === "franchise") payload.franchise_shop_id = shopId;
    else if (shopType === "othershop") payload.othershop_shop_id = shopId;
    else {
      toast.error("Invalid shop type.");
      return;
    }

    const t = toast.loading("Assigning Grow Tag...");

    try {
      await axiosInstance.post(ASSIGNMENTS_API_URL, payload);
      toast.success("Grow Tag assigned successfully ✅", { id: t });

      setTimeout(async () => {
        await fetchAllData();
        setSelectedGrowTag("");
        setSelectedShop("");
        setSelectedShopName("");
      }, 250);
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.", { id: t });
      } else if (err.response?.status === 403) {
        toast.error("You don't have permission to perform this action", { id: t });
      } else {
        toast.error(`Assignment failed: ${extractErrorMessage(err)}`, { id: t });
      }
    }
  };

  // ✅ CLEAN UNASSIGN TOAST WITH CLICK PREVENTION
  const handleUnassign = (id) => {
    // Prevent multiple clicks
    if (isUnassigning.current) return;
    isUnassigning.current = true;

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Are you sure you want to unassign this Grow Tag?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                isUnassigning.current = false;
              }}
              className="px-3 py-1.5 bg-gray-200 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await axiosInstance.delete(`${ASSIGNMENTS_API_URL}${id}/`);
                  toast.success("Grow Tag unassigned successfully ✅");
                  await fetchAllData();
                } catch (err) {
                  if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                  } else if (err.response?.status === 403) {
                    toast.error("You don't have permission to perform this action");
                  } else {
                    toast.error(`Unassign failed: ${extractErrorMessage(err)}`);
                  }
                } finally {
                  isUnassigning.current = false;
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
            >
              Unassign
            </button>
          </div>
        </div>
      ),
      { 
        duration: 6000,
        onClose: () => {
          isUnassigning.current = false;
        }
      }
    );
  };

  // ✅ CLEAN BULK UNASSIGN TOAST WITH CLICK PREVENTION
  const handleBulk = () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one assignment to unassign ⚠️");
      return;
    }

    // Prevent multiple clicks
    if (isBulkUnassigning.current) return;
    isBulkUnassigning.current = true;

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium">Unassign {selectedIds.length} selected Grow Tags?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                isBulkUnassigning.current = false;
              }}
              className="px-3 py-1.5 bg-gray-200 rounded text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                try {
                  await Promise.all(
                    selectedIds.map((id) =>
                      axiosInstance.delete(`${ASSIGNMENTS_API_URL}${id}/`)
                    )
                  );

                  toast.success(`${selectedIds.length} Grow Tags unassigned ✅`);
                  setSelectedIds([]);
                  await fetchAllData();
                } catch (err) {
                  if (err.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                  } else if (err.response?.status === 403) {
                    toast.error("You don't have permission to perform this action");
                  } else {
                    toast.error(`Bulk unassign failed: ${extractErrorMessage(err)}`);
                  }
                } finally {
                  isBulkUnassigning.current = false;
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded text-sm"
            >
              Unassign All
            </button>
          </div>
        </div>
      ),
      { 
        duration: 6000,
        onClose: () => {
          isBulkUnassigning.current = false;
        }
      }
    );
  };

  // Filtered Data
  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    return assigned
      .map((assignment) => {
        const growtag = growtags.find((g) => g.id === assignment.growtag);
        const shop = shops.find((s) => s.id === assignment.shop);

        return {
          id: assignment.id,
          growId: growtag?.grow_id || "N/A",
          growName: growtag?.name || "N/A",
          shopName: shop?.shopname || shop?.name || "N/A",
          shopType: shop?.shop_type || "N/A",
          assignedAt: assignment.assigned_at,
          createdBy: assignment.created_by ?? null,
        };
      })
      .filter(
        (a) =>
          a.growId.toLowerCase().includes(q) ||
          a.growName.toLowerCase().includes(q) ||
          a.shopName.toLowerCase().includes(q) ||
          a.shopType.toLowerCase().includes(q)
      );
  }, [search, assigned, growtags, shops]);

  const toggleCheck = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 border-b pb-4">
        <h1 className="text-3xl font-bold">Assign Grow Tags</h1>
        <button
          onClick={() => navigate("/growtags")}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Back to Grow Tags List
        </button>
      </div>

      {/* Assign Box */}
      <div className="bg-white p-5 rounded-xl shadow border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GrowTagSelect
            availableGrowTags={growtags}
            selectedGrowTag={selectedGrowTag}
            setSelectedGrowTag={setSelectedGrowTag}
            assigned={assigned}
          />

          <ShopSelectDropdown
            shops={shops}
            selectedShop={selectedShop}
            selectedShopName={selectedShopName}
            handleShopChange={handleShopChange}
          />

          <div className="flex items-end">
            <button
              onClick={handleAssign}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Assign
            </button>
          </div>
        </div>
      </div>

      {/* Search & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 pl-10 rounded-xl w-64 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search assigned tags..."
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>

        <button
          onClick={handleBulk}
          disabled={selectedIds.length === 0 || isBulkUnassigning.current}
          className={`px-4 py-2 rounded-lg transition-colors font-medium ${
            selectedIds.length > 0 && !isBulkUnassigning.current
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
        >
          {isBulkUnassigning.current ? "Processing..." : `Unassign Selected (${selectedIds.length})`}
        </button>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow border p-3 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(filtered.map((a) => a.id));
                    } else {
                      setSelectedIds([]);
                    }
                  }}
                  checked={
                    selectedIds.length > 0 &&
                    filtered.length > 0 &&
                    selectedIds.length === filtered.length
                  }
                />
              </th>
              <th className="p-2 text-left">Grow ID</th>
              <th className="p-2 text-left">Grow Tag Name</th>
              <th className="p-2 text-left">Assigned Shop</th>
              <th className="p-2 text-left">Shop Type</th>
              <th className="p-2 text-left">Created By</th>
              <th className="p-2 text-left">Assigned At</th>
              <th className="p-2 text-left">Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(a.id)}
                    onChange={() => toggleCheck(a.id)}
                    disabled={isBulkUnassigning.current}
                  />
                </td>
                <td className="p-2">{a.growId}</td>
                <td className="p-2">{a.growName}</td>
                <td className="p-2">{a.shopName}</td>
                <td className="p-2">
                  <span
                    className={`px-3 py-1 inline-block rounded-full text-xs font-semibold ${
                      a.shopType === "franchise"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {a.shopType.toUpperCase().replace("_", " ")}
                  </span>
                </td>
                <td className="p-2 text-gray-700">{a.createdBy || "—"}</td>
                <td className="p-2">{new Date(a.assignedAt).toLocaleString()}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleUnassign(a.id)}
                    disabled={isUnassigning.current || isBulkUnassigning.current}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      isUnassigning.current || isBulkUnassigning.current
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    } transition-colors`}
                  >
                    {isUnassigning.current ? "Processing..." : "Unassign"}
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="8" className="p-4 text-center text-gray-500">
                  {search
                    ? "No assignments match your search."
                    : "No assignments found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {filtered.map((a) => (
          <div
            key={a.id}
            className="bg-white rounded-xl shadow border p-4 space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">
                  {a.growId} – {a.growName}
                </p>
                <p className="text-xs text-gray-500">
                  Assigned At: {new Date(a.assignedAt).toLocaleString()}
                </p>
                {a.createdBy && (
                  <p className="text-xs text-gray-600 mt-1">
                    By: {a.createdBy}
                  </p>
                )}
              </div>

              <input
                type="checkbox"
                checked={selectedIds.includes(a.id)}
                onChange={() => toggleCheck(a.id)}
                disabled={isBulkUnassigning.current}
              />
            </div>

            <div className="text-sm">
              <p>
                <span className="font-medium">Shop:</span> {a.shopName}
              </p>
              <span
                className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  a.shopType === "franchise"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {a.shopType.toUpperCase().replace("_", " ")}
              </span>
            </div>

            <button
              onClick={() => handleUnassign(a.id)}
              disabled={isUnassigning.current || isBulkUnassigning.current}
              className={`w-full mt-2 py-1.5 rounded-lg text-sm ${
                isUnassigning.current || isBulkUnassigning.current
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              {isUnassigning.current ? "Processing..." : "Unassign"}
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center text-gray-500 py-6">
            No assignments found.
          </div>
        )}
      </div>
    </div>
  );
}