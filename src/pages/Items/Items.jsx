import React, { useState, useMemo, useEffect, useRef } from "react";
import { BASE_URL } from "@/API/BaseURL";

import {
  PlusCircle,
  Edit3,
  Trash2,
  Smartphone,
  Settings,
  Info,
  Image,
  X,
  Search,
  DollarSign,
  ShoppingBag,
  Check,
  Eye,
  Upload,
  ArrowLeft,
  AlertCircle,
  MoreVertical,
  User,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== CONSTANTS ====================
const ITEMS_API_URL = `${BASE_URL}/zoho/local-items/`;
const ACCOUNTS = ["sales", "service_income", "cogs", "other_income"];
const ACCOUNT_DISPLAY_NAMES = {
  sales: "Sales",
  service_income: "Service Income",
  cogs: "Cost of Goods Sold",
  other_income: "Other Income",
};
const UNITS = ["PIECE", "BOX", "SET", "UNIT"];
const UNIT_DISPLAY_NAMES = {
  PIECE: "Piece",
  BOX: "Box",
  SET: "Set",
  UNIT: "Unit",
};
const PRODUCT_TYPES = ["goods", "service"];
const TAX_PREFERENCES = ["taxable", "non_taxable"];
const VENDORS = [
  { id: "", name: "None" },
  { id: "vendor_a_id", name: "Vendor A" },
  { id: "vendor_b_id", name: "Vendor B" },
];

const CATEGORIES = [
  { id: "", name: "Select Category" },
  { id: "electronics", name: "Electronics" },
  { id: "hardwares", name: "Hardwares" },
  { id: "mobiles", name: "Mobiles & Accessories" },
  { id: "repair_parts", name: "Repair Parts" },
  { id: "tools", name: "Tools & Equipment" },
  { id: "consumables", name: "Consumables" },
  { id: "services", name: "Services" },
];

const GST_TREATMENTS = [
  "",
  "No Tax (0%)",
  "5% IGST",
  "12% IGST",
  "18% IGST",
  "28% IGST",
  "5% GST (2.5% CGST + 2.5% SGST)",
  "12% GST (6% CGST + 6% SGST)",
  "18% GST (9% CGST + 9% SGST)",
  "28% GST (14% CGST + 14% SGST)",
];

// ==================== SEARCH INPUT ====================
const SearchInput = ({ value, onChange }) => (
  <div className="relative w-80">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search size={18} className="text-gray-400" />
    </div>
    <input
      type="text"
      placeholder="Search items..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    )}
  </div>
);

// ==================== MAIN COMPONENT ====================
export default function Items() {
  const [items, setItems] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});

  const [openViewModal, setOpenViewModal] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [actionMenuId, setActionMenuId] = useState(null);

  const [currentPage, setCurrentPage] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");

  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    product_type: "goods",
    name: "",
    category: "",
    sku: "",
    unit: "PIECE",
    hsn_or_sac: "",
    tax_preference: "taxable",
    gst_treatment: "",
    item_image: null,
    is_sellable: true,
    selling_price: "",
    service_charge: "",
    sales_account: "sales",
    sales_description: "",
    is_purchasable: false,
    cost_price: "",
    purchase_account: "cogs",
    purchase_description: "",
    preferred_vendor: "",
  });

  // ==================== DATA FETCHING ====================
  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await api.get("/zoho/local-items/");
      setItems(response.data);
    } catch (error) {
      toast.error("Failed to load items. Please try again.", {
        duration: 4000,
        position: "top-center",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ==================== HELPER FUNCTIONS ====================
  const getCreatedBy = (item) => {
    if (typeof item.created_by === "number") return null;
    if (typeof item.created_by === "object" && item.created_by !== null) {
      return item.created_by.name || item.created_by.email || item.created_by.username || null;
    }
    return item.created_by || null;
  };

  const getCreatedByDisplay = (item) => {
    const creator = getCreatedBy(item);
    return creator || "—";
  };

  // ==================== FILTERED ITEMS ====================
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hsn_or_sac?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [items, searchTerm]);

  // ==================== FORM VALIDATION ====================
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value.trim()) {
          newErrors[name] = "Item name is required";
        } else if (value.trim().length > 200) {
          newErrors[name] = "Item name cannot exceed 200 characters";
        } else {
          delete newErrors[name];
        }
        break;

      case "category":
        if (!value) {
          newErrors[name] = "Category is required";
        } else {
          delete newErrors[name];
        }
        break;

      case "hsn_or_sac":
        if (form.product_type === "service") {
          if (!value.trim()) {
            newErrors[name] = "SAC code is required for services";
          } else if (!/^\d{6}$/.test(value.trim())) {
            newErrors[name] = "SAC code must be exactly 6 digits";
          } else {
            delete newErrors[name];
          }
        } else if (value && !/^\d{4,8}$/.test(value.trim())) {
          newErrors[name] = "HSN code must be 4-8 digits";
        } else {
          delete newErrors[name];
        }
        break;

      case "selling_price":
        if (form.is_sellable) {
          if (!value) {
            newErrors[name] = "Selling price is required";
          } else if (parseFloat(value) <= 0) {
            newErrors[name] = "Selling price must be greater than 0";
          } else {
            delete newErrors[name];
          }
        } else {
          delete newErrors[name];
        }
        break;

      case "cost_price":
        if (form.is_purchasable) {
          if (!value) {
            newErrors[name] = "Cost price is required";
          } else if (parseFloat(value) <= 0) {
            newErrors[name] = "Cost price must be greater than 0";
          } else {
            delete newErrors[name];
          }
        } else {
          delete newErrors[name];
        }
        break;

      default:
        delete newErrors[name];
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    validateField(name, newValue);
  };

  const validateForm = () => {
    const validationErrors = {};

    if (!form.name.trim()) validationErrors.name = "Item name is required";
    if (!form.category) validationErrors.category = "Category is required";
    if (!form.tax_preference) validationErrors.tax_preference = "Tax preference is required";

    if (form.product_type === "service") {
      if (!form.hsn_or_sac.trim()) {
        validationErrors.hsn_or_sac = "SAC code is required for services";
      } else if (!/^\d{6}$/.test(form.hsn_or_sac.trim())) {
        validationErrors.hsn_or_sac = "SAC code must be exactly 6 digits";
      }
    } else if (form.hsn_or_sac && !/^\d{4,8}$/.test(form.hsn_or_sac.trim())) {
      validationErrors.hsn_or_sac = "HSN code must be 4-8 digits";
    }

    if (form.is_sellable) {
      if (!form.selling_price) {
        validationErrors.selling_price = "Selling price is required";
      } else if (parseFloat(form.selling_price) <= 0) {
        validationErrors.selling_price = "Selling price must be greater than 0";
      }
      if (!form.sales_account) {
        validationErrors.sales_account = "Sales account is required";
      }
    }

    if (form.is_purchasable) {
      if (!form.cost_price) {
        validationErrors.cost_price = "Cost price is required";
      } else if (parseFloat(form.cost_price) <= 0) {
        validationErrors.cost_price = "Cost price must be greater than 0";
      }
      if (!form.purchase_account) {
        validationErrors.purchase_account = "Purchase account is required";
      }
    }

    return validationErrors;
  };

  // ==================== FORM SUBMISSION ====================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0], {
        duration: 4000,
        position: "top-center",
      });

      if (
        Object.keys(validationErrors).some((key) =>
          ["selling_price", "sales_account", "service_charge"].includes(key)
        )
      ) {
        setActiveTab("Sales");
      } else if (
        Object.keys(validationErrors).some((key) => ["cost_price", "purchase_account"].includes(key))
      ) {
        setActiveTab("Purchase");
      } else {
        setActiveTab("General");
      }
      return;
    }

    setLoading(true);

    const toastId = toast.loading(
      isEdit ? "Updating item..." : "Creating item...",
      { position: "top-center" }
    );

    try {
      const formData = new FormData();
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          formData.append(key, form[key]);
        }
      });

      let response;
      if (isEdit && editId) {
        response = await api.patch(`/zoho/local-items/${editId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        response = await api.post("/zoho/local-items/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (response.data?.local_item) {
        await fetchItems();
        resetForm();

        toast.success(
          isEdit ? "✅ Item updated successfully!" : "✅ Item created successfully!",
          { id: toastId, duration: 3000 }
        );

        if (response.data.detail?.includes("Zoho sync failed")) {
          toast.warning("⚠️ Zoho sync failed. You can try syncing later.", {
            duration: 5000,
            position: "top-center",
          });
        }
      } else if (response.data?.detail) {
        toast.error(response.data.detail, { id: toastId, duration: 4000 });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to save item";

      toast.error(`❌ ${errorMessage}`, { id: toastId, duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      product_type: "goods",
      name: "",
      category: "",
      sku: "",
      unit: "PIECE",
      hsn_or_sac: "",
      tax_preference: "taxable",
      gst_treatment: "",
      item_image: null,
      is_sellable: true,
      selling_price: "",
      service_charge: "",
      sales_account: "sales",
      sales_description: "",
      is_purchasable: false,
      cost_price: "",
      purchase_account: "cogs",
      purchase_description: "",
      preferred_vendor: "",
    });
    setErrors({});
    setIsEdit(false);
    setEditId(null);
    setCurrentPage("list");
    setActiveTab("General");
  };

  // ==================== CRUD OPERATIONS ====================
  const handleEdit = (item) => {
    setForm({
      product_type: item.product_type || "goods",
      name: item.name || "",
      category: item.category || "",
      sku: item.sku || "",
      unit: item.unit || "PIECE",
      hsn_or_sac: item.hsn_or_sac || "",
      tax_preference: item.tax_preference || "taxable",
      gst_treatment: item.gst_treatment || "",
      item_image: null,
      is_sellable: item.is_sellable || false,
      selling_price: item.selling_price || "",
      service_charge: item.service_charge || "",
      sales_account: item.sales_account || "sales",
      sales_description: item.sales_description || "",
      is_purchasable: item.is_purchasable || false,
      cost_price: item.cost_price || "",
      purchase_account: item.purchase_account || "cogs",
      purchase_description: item.purchase_description || "",
      preferred_vendor: item.preferred_vendor || "",
    });
    setEditId(item.id);
    setIsEdit(true);
    setCurrentPage("form");
    setActiveTab("General");
    setOpenViewModal(false);
    setActionMenuId(null);
  };

  const handleView = (item) => {
    setViewedItem(item);
    setOpenViewModal(true);
    setActionMenuId(null);
  };

  const showDeleteConfirmation = (id, itemName) => {
    toast.custom(
      (t) => (
        <div className="flex flex-col gap-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">Delete Item?</h3>
              <p className="text-sm font-medium text-gray-700 mt-1">{itemName}</p>
              <p className="text-sm text-gray-600 mt-2">This action cannot be undone.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition duration-200"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await performIndividualDelete(id, itemName);
              }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-200 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: 6000, position: "top-center" }
    );
  };

  const performIndividualDelete = async (id, itemName) => {
    const toastId = toast.loading(`Deleting "${itemName}"...`, {
      position: "top-center",
    });

    try {
      await api.delete(`${ITEMS_API_URL}${id}/`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));

      toast.success(`✅ "${itemName}" deleted successfully`, {
        id: toastId,
        duration: 3000,
      });
    } catch (error) {
      toast.error(`❌ Failed to delete: ${error.response?.data?.detail || "Network error"}`, {
        id: toastId,
        duration: 4000,
      });
    }
  };

  const showBulkDeleteConfirmation = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to delete.", {
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    toast.custom(
      (t) => (
        <div className="flex flex-col gap-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">
                Delete {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""}?
              </h3>
              <p className="text-sm text-gray-600 mt-1">This action cannot be undone.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                await performBulkDelete();
              }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete {selectedItems.length}
            </button>
          </div>
        </div>
      ),
      { duration: 6000, position: "top-center" }
    );
  };

  const performBulkDelete = async () => {
    const toastId = toast.loading(
      `Deleting ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}...`,
      { position: "top-center" }
    );

    try {
      const idsToDelete = [...selectedItems];
      const deletePromises = idsToDelete.map((id) =>
        api
          .delete(`${ITEMS_API_URL}${id}/`)
          .then(() => ({ success: true, id }))
          .catch(() => ({ success: false, id }))
      );

      const results = await Promise.all(deletePromises);
      const successfulDeletes = results.filter((r) => r.success).length;

      await fetchItems();
      setSelectedItems([]);

      if (successfulDeletes === selectedItems.length) {
        toast.success(`✅ Deleted ${successfulDeletes} item${successfulDeletes > 1 ? "s" : ""}`, {
          id: toastId,
          duration: 4000,
        });
      } else {
        toast.warning(`⚠️ Deleted ${successfulDeletes}/${selectedItems.length} items`, {
          id: toastId,
          duration: 5000,
        });
      }
    } catch (error) {
      toast.error("❌ Bulk delete failed", { id: toastId, duration: 4000 });
    }
  };

  const handleSyncToZoho = async (id) => {
    const toastId = toast.loading("Syncing to Zoho...", { position: "top-center" });

    try {
      setSyncStatus((prev) => ({ ...prev, [id]: "syncing" }));
      const response = await api.post(`${ITEMS_API_URL}${id}/sync-to-zoho/`);

      if (response.data.success || response.data.zoho_item_id) {
        setSyncStatus((prev) => ({ ...prev, [id]: "synced" }));
        await fetchItems();
        toast.success("✅ Item synced to Zoho successfully!", {
          id: toastId,
          duration: 3000,
        });
      } else {
        setSyncStatus((prev) => ({ ...prev, [id]: "failed" }));
        toast.error("❌ Sync failed: " + (response.data.error || "Unknown error"), {
          id: toastId,
          duration: 4000,
        });
      }
    } catch (error) {
      setSyncStatus((prev) => ({ ...prev, [id]: "failed" }));
      toast.error(
        "❌ Sync failed: " + (error.response?.data?.error || error.message || "Network error"),
        {
          id: toastId,
          duration: 4000,
        }
      );
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  // ==================== UI COMPONENTS ====================
  const LabelWithInfo = ({ children }) => (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
      {children} <Info size={12} className="text-gray-400" />
    </label>
  );

  const ValidationError = ({ message }) => (
    <div className="flex items-center gap-1 mt-1 text-red-600 text-xs">
      <AlertCircle size={12} />
      <span>{message}</span>
    </div>
  );

  const getInputClass = (fieldName) => {
    const baseClass =
      "border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500";
    return errors[fieldName]
      ? `${baseClass} border-red-500 ring-1 ring-red-500 bg-red-50`
      : baseClass;
  };

  // ==================== ACTION MENU ====================
  const ActionMenu = ({ itemId, itemName, item }) => {
    const menuRef = useRef(null);

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setActionMenuId(null);
        }
      };

      if (actionMenuId === itemId) {
        document.addEventListener("mousedown", handleClickOutside);
      }

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [actionMenuId, itemId]);

    return (
      <div ref={menuRef} className="relative inline-block">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActionMenuId(actionMenuId === itemId ? null : itemId);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <MoreVertical size={18} className="text-gray-600" />
        </button>

        {actionMenuId === itemId && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="py-1">
              <button
                onClick={() => handleView(item)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Eye size={14} /> View Details
              </button>
              <button
                onClick={() => handleEdit(item)}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit3 size={14} /> Edit Item
              </button>
              {!item.zoho_item_id && (
                <button
                  onClick={() => {
                    setActionMenuId(null);
                    handleSyncToZoho(itemId);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Upload size={14} /> Sync to Zoho
                </button>
              )}
              <div className="border-t my-1"></div>
              <button
                onClick={() => {
                  setActionMenuId(null);
                  showDeleteConfirmation(itemId, itemName);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete Item
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ==================== ITEMS TABLE ====================
  const ItemsTable = () => {
    const truncateId = (id) => {
      if (!id) return "N/A";
      const idStr = String(id);
      return idStr.length > 8 ? `${idStr.slice(0, 8)}...` : idStr;
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Bulk Delete Bar */}
        {selectedItems.length > 0 && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
            <span className="text-sm font-medium text-red-700">
              {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
            </span>
            <button
              onClick={showBulkDeleteConfirmation}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-4 px-6 text-left w-12">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                    className="rounded text-blue-600 h-4 w-4 cursor-pointer"
                  />
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Item Details
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Pricing
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  HSN/SAC
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created By
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Zoho Sync
                </th>
                <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-600">Loading items...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Search size={40} className="text-gray-300 mb-3" />
                      <p className="text-gray-600 text-lg font-medium">No items found</p>
                      {items.length === 0 && (
                        <button
                          onClick={() => setCurrentPage("form")}
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                        >
                          <PlusCircle size={18} /> Add New Item
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedItems.includes(item.id) ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded text-blue-600 h-4 w-4 cursor-pointer"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {item.item_image ? (
                            <img
                              src={item.item_image}
                              className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                              alt={item.name}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                              <Image size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-medium text-gray-900 text-sm mb-1">{item.name}</h4>
                          <span className="text-xs text-gray-500">SKU: {item.sku || "—"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <span className="text-sm text-gray-700">
                          {CATEGORIES.find((cat) => cat.id === item.category)?.name || "—"}
                        </span>
                        <span className="text-xs text-gray-400 block mt-1">
                          ID: {truncateId(item.id)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            item.product_type === "goods"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {item.product_type?.charAt(0).toUpperCase() + item.product_type?.slice(1)}
                        </span>
                        <span className="text-xs text-gray-500 block mt-2">
                          {item.is_sellable ? "Sellable" : "Not Sellable"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        ₹{parseFloat(item.selling_price || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Cost: ₹{parseFloat(item.cost_price || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-gray-700">{item.hsn_or_sac || "—"}</span>
                      {item.gst_treatment && (
                        <span
                          className="text-xs text-gray-500 block mt-1 truncate max-w-[150px]"
                          title={item.gst_treatment}
                        >
                          {item.gst_treatment}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-700">
                          {getCreatedByDisplay(item)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleSyncToZoho(item.id)}
                        disabled={syncStatus[item.id] === "syncing"}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 whitespace-nowrap ${
                          item.zoho_item_id
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : syncStatus[item.id] === "syncing"
                            ? "bg-yellow-100 text-yellow-700"
                            : syncStatus[item.id] === "failed"
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        } transition-colors`}
                      >
                        {syncStatus[item.id] === "syncing" ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-700"></div>
                            <span>Syncing...</span>
                          </>
                        ) : item.zoho_item_id ? (
                          <>
                            <Check size={12} />
                            <span>Synced</span>
                          </>
                        ) : (
                          <>
                            <Upload size={12} />
                            <span>Sync</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <ActionMenu itemId={item.id} itemName={item.name} item={item} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {filteredItems.length > 0 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredItems.length}</span> of{" "}
              <span className="font-medium">{items.length}</span> items
            </span>
            {selectedItems.length > 0 && (
              <span className="text-sm font-medium text-blue-600">
                {selectedItems.length} selected
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== VIEW MODAL ====================
  const ViewItemModal = () => {
    if (!viewedItem) return null;

    const DetailRow = ({ label, value }) => (
      <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-600 min-w-[140px]">{label}</span>
        <span className="text-sm text-gray-900 text-right flex-1 font-medium">
          {value || <span className="text-gray-400 font-normal italic">Not set</span>}
        </span>
      </div>
    );

    const Section = ({ title, children, icon: Icon }) => (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
          {Icon && <Icon size={18} className="text-gray-600" />}
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-4 bg-white">{children}</div>
      </div>
    );

    return (
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Eye size={20} className="text-blue-600" />
              {viewedItem.name}
            </h2>
            <button
              onClick={() => setOpenViewModal(false)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {viewedItem.item_image && (
              <div className="flex justify-center mb-4">
                <img
                  src={viewedItem.item_image}
                  alt={viewedItem.name}
                  className="max-h-48 object-contain rounded-lg border border-gray-200 p-2 bg-white"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Section title="General Information" icon={Settings}>
                <DetailRow
                  label="Product Type"
                  value={
                    viewedItem.product_type?.charAt(0).toUpperCase() + viewedItem.product_type?.slice(1)
                  }
                />
                <DetailRow
                  label="Category"
                  value={CATEGORIES.find((cat) => cat.id === viewedItem.category)?.name || viewedItem.category}
                />
                <DetailRow label="SKU" value={viewedItem.sku} />
                <DetailRow
                  label="Unit"
                  value={UNIT_DISPLAY_NAMES[viewedItem.unit] || viewedItem.unit}
                />
                <DetailRow
                  label={viewedItem.product_type === "goods" ? "HSN Code" : "SAC Code"}
                  value={viewedItem.hsn_or_sac}
                />
                <DetailRow
                  label="Tax Preference"
                  value={viewedItem.tax_preference?.replace("_", " ")}
                />
                <DetailRow label="GST Treatment" value={viewedItem.gst_treatment} />
              </Section>

              <div className="space-y-6">
                <Section title="Created By" icon={User}>
                  <DetailRow label="Created By" value={getCreatedByDisplay(viewedItem)} />
                  {viewedItem.created_at && (
                    <DetailRow
                      label="Created Date"
                      value={new Date(viewedItem.created_at).toLocaleDateString()}
                    />
                  )}
                  <DetailRow label="Zoho Item ID" value={viewedItem.zoho_item_id || "Not synced"} />
                </Section>

                {viewedItem.is_sellable && (
                  <Section title="Sales Details" icon={DollarSign}>
                    <DetailRow
                      label="Selling Price"
                      value={`₹${parseFloat(viewedItem.selling_price || 0).toFixed(2)}`}
                    />
                    <DetailRow
                      label="Service Charge"
                      value={
                        viewedItem.service_charge
                          ? `₹${parseFloat(viewedItem.service_charge).toFixed(2)}`
                          : null
                      }
                    />
                    <DetailRow
                      label="Sales Account"
                      value={ACCOUNT_DISPLAY_NAMES[viewedItem.sales_account] || viewedItem.sales_account}
                    />
                    <DetailRow label="Sales Description" value={viewedItem.sales_description} />
                  </Section>
                )}

                {viewedItem.is_purchasable && (
                  <Section title="Purchase Details" icon={ShoppingBag}>
                    <DetailRow
                      label="Cost Price"
                      value={`₹${parseFloat(viewedItem.cost_price || 0).toFixed(2)}`}
                    />
                    <DetailRow
                      label="Purchase Account"
                      value={
                        ACCOUNT_DISPLAY_NAMES[viewedItem.purchase_account] || viewedItem.purchase_account
                      }
                    />
                    <DetailRow
                      label="Preferred Vendor"
                      value={VENDORS.find((v) => v.id === viewedItem.preferred_vendor)?.name || viewedItem.preferred_vendor}
                    />
                    <DetailRow label="Purchase Description" value={viewedItem.purchase_description} />
                  </Section>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={() => setOpenViewModal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                setOpenViewModal(false);
                handleEdit(viewedItem);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Edit3 size={16} />
              Edit Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==================== FORM TABS ====================
  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <LabelWithInfo>Product Type</LabelWithInfo>
        <div className="flex gap-6">
          {PRODUCT_TYPES.map((type) => (
            <label key={type} className="flex items-center text-sm cursor-pointer">
              <input
                type="radio"
                name="product_type"
                value={type}
                checked={form.product_type === type}
                onChange={handleChange}
                className="mr-3 h-4 w-4 text-blue-600"
              />
              <span className={form.product_type === type ? "font-semibold text-blue-700" : "text-gray-700"}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          className={getInputClass("name")}
          placeholder="e.g., iPhone 13 Screen"
        />
        {errors.name && <ValidationError message={errors.name} />}
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          name="category"
          value={form.category}
          onChange={handleChange}
          className={getInputClass("category")}
        >
          {CATEGORIES.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {errors.category && <ValidationError message={errors.category} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <LabelWithInfo>Unit</LabelWithInfo>
          <select
            name="unit"
            value={form.unit}
            onChange={handleChange}
            className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {UNIT_DISPLAY_NAMES[unit] || unit}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
            Tax Preference <span className="text-red-500">*</span>
          </label>
          <select
            name="tax_preference"
            value={form.tax_preference}
            onChange={handleChange}
            className={getInputClass("tax_preference")}
          >
            {TAX_PREFERENCES.map((pref) => (
              <option key={pref} value={pref}>
                {pref.replace("_", " ").charAt(0).toUpperCase() + pref.replace("_", " ").slice(1)}
              </option>
            ))}
          </select>
          {errors.tax_preference && <ValidationError message={errors.tax_preference} />}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium flex items-center gap-1 mb-2">GST Treatment</label>
        <select
          name="gst_treatment"
          value={form.gst_treatment}
          onChange={handleChange}
          className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {GST_TREATMENTS.map((treatment, index) => (
            <option key={index} value={treatment}>
              {treatment || "Select GST Treatment"}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <LabelWithInfo>
              {form.product_type === "goods" ? "HSN Code" : "SAC Code"}
              {form.product_type === "service" && <span className="text-red-500">*</span>}
            </LabelWithInfo>
          </div>
          <input
            type="text"
            name="hsn_or_sac"
            value={form.hsn_or_sac}
            onChange={handleChange}
            className={getInputClass("hsn_or_sac")}
            placeholder={form.product_type === "goods" ? "Enter HSN code (4-8 digits)" : "Enter SAC code (6 digits)"}
          />
          {errors.hsn_or_sac && <ValidationError message={errors.hsn_or_sac} />}
        </div>

        <div>
          <LabelWithInfo>SKU</LabelWithInfo>
          <input
            type="text"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="SKU-IPH-13-BLK"
          />
        </div>
      </div>

      <div>
        <LabelWithInfo>Item Image</LabelWithInfo>
        <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center min-h-[160px] relative hover:border-blue-400 transition bg-gray-50">
          {form.item_image ? (
            <>
              <img
                src={typeof form.item_image === "string" ? form.item_image : URL.createObjectURL(form.item_image)}
                alt="Preview"
                className="max-h-28 object-contain rounded mb-3"
              />
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, item_image: null }))}
                className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <Image size={32} className="text-gray-400 mb-3" />
              <p className="text-gray-600 text-center text-base mb-2">
                Drag and drop or <span className="text-blue-600 font-semibold">Browse</span>
              </p>
              <p className="text-xs text-gray-500">Supports JPG, PNG up to 5MB</p>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                if (file.size > 5 * 1024 * 1024) {
                  toast.error("File size must be less than 5MB", { duration: 3000 });
                  return;
                }
                setForm((prev) => ({ ...prev, item_image: file }));
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  const renderSalesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center pb-2">
        <h3 className="font-semibold text-lg text-gray-800">Selling Details</h3>
        <label className="flex items-center ml-auto text-sm text-blue-600 cursor-pointer">
          <input
            type="checkbox"
            name="is_sellable"
            checked={form.is_sellable}
            onChange={handleChange}
            className="mr-3 h-4 w-4 text-blue-600"
          />
          Sellable Item
        </label>
      </div>

      {form.is_sellable ? (
        <div className="space-y-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/30">
          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-2">
              Selling Price <span className="text-red-500">*</span>
            </label>
            <div
              className={
                errors.selling_price
                  ? "flex border-2 border-red-500 rounded-lg overflow-hidden bg-red-50"
                  : "flex border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500"
              }
            >
              <span className="bg-gray-100 text-gray-700 p-3 text-sm font-medium border-r">₹</span>
              <input
                type="number"
                name="selling_price"
                value={form.selling_price}
                onChange={handleChange}
                className="p-3 w-full focus:outline-none text-sm bg-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            {errors.selling_price && <ValidationError message={errors.selling_price} />}
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Service Charge (Optional)</label>
            <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500">
              <span className="bg-gray-100 text-gray-700 p-3 text-sm font-medium border-r">₹</span>
              <input
                type="number"
                name="service_charge"
                value={form.service_charge}
                onChange={handleChange}
                className="p-3 w-full focus:outline-none text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-2">
              Sales Account <span className="text-red-500">*</span>
            </label>
            <select
              name="sales_account"
              value={form.sales_account}
              onChange={handleChange}
              className={getInputClass("sales_account")}
            >
              {ACCOUNTS.map((account) => (
                <option key={account} value={account}>
                  {ACCOUNT_DISPLAY_NAMES[account]}
                </option>
              ))}
            </select>
            {errors.sales_account && <ValidationError message={errors.sales_account} />}
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Sales Description</label>
            <textarea
              name="sales_description"
              value={form.sales_description}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg h-24 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Optional description for invoices/estimates"
            />
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
          <DollarSign size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 text-base font-medium">
            Mark this item as <span className="text-blue-600 font-semibold">'Sellable'</span> to define sales details
          </p>
        </div>
      )}
    </div>
  );

  const renderPurchaseTab = () => (
    <div className="space-y-6">
      <div className="flex items-center pb-2">
        <h3 className="font-semibold text-lg text-gray-800">Purchasing Details</h3>
        <label className="flex items-center ml-auto text-sm text-blue-600 cursor-pointer">
          <input
            type="checkbox"
            name="is_purchasable"
            checked={form.is_purchasable}
            onChange={handleChange}
            className="mr-3 h-4 w-4 text-blue-600"
          />
          Purchasable Item
        </label>
      </div>

      {form.is_purchasable ? (
        <div className="space-y-6 p-4 border-2 border-green-200 rounded-lg bg-green-50/30">
          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-2">
              Cost Price <span className="text-red-500">*</span>
            </label>
            <div
              className={
                errors.cost_price
                  ? "flex border-2 border-red-500 rounded-lg overflow-hidden bg-red-50"
                  : "flex border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500"
              }
            >
              <span className="bg-gray-100 text-gray-700 p-3 text-sm font-medium border-r">₹</span>
              <input
                type="number"
                name="cost_price"
                value={form.cost_price}
                onChange={handleChange}
                className="p-3 w-full focus:outline-none text-sm bg-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            {errors.cost_price && <ValidationError message={errors.cost_price} />}
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-1 mb-2">
              Purchase Account <span className="text-red-500">*</span>
            </label>
            <select
              name="purchase_account"
              value={form.purchase_account}
              onChange={handleChange}
              className={getInputClass("purchase_account")}
            >
              {ACCOUNTS.map((account) => (
                <option key={account} value={account}>
                  {ACCOUNT_DISPLAY_NAMES[account]}
                </option>
              ))}
            </select>
            {errors.purchase_account && <ValidationError message={errors.purchase_account} />}
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Preferred Vendor</label>
            <select
              name="preferred_vendor"
              value={form.preferred_vendor}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              {VENDORS.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Purchase Description</label>
            <textarea
              name="purchase_description"
              value={form.purchase_description}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg h-24 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Optional notes for purchase orders"
            />
          </div>
        </div>
      ) : (
        <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
          <ShoppingBag size={32} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 text-base font-medium">
            Mark this item as <span className="text-blue-600 font-semibold">'Purchasable'</span> to define cost details
          </p>
        </div>
      )}
    </div>
  );

  // ==================== FORM PAGE ====================
  const renderFormPage = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={resetForm}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">Back to Items</span>
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">{isEdit ? "Edit Item" : "Create New Item"}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {isEdit ? "Update item details below" : "Fill in the details to add a new item to your inventory"}
            </p>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex px-6">
              {[
                { name: "General", icon: Settings },
                { name: "Sales", icon: DollarSign },
                { name: "Purchase", icon: ShoppingBag },
              ].map((tab) => (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition-colors relative ${
                    activeTab === tab.name ? "text-blue-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon size={18} />
                  {tab.name}
                  {activeTab === tab.name && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="p-6">
              {activeTab === "General" && renderGeneralTab()}
              {activeTab === "Sales" && renderSalesTab()}
              {activeTab === "Purchase" && renderPurchaseTab()}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || Object.keys(errors).length > 0}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isEdit ? "Updating..." : "Saving..."}
                  </>
                ) : isEdit ? (
                  "Update Item"
                ) : (
                  "Save Item"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  // ==================== LIST PAGE ====================
  const renderListPage = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <Smartphone size={24} className="text-blue-700" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Items Management</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Total Items: <span className="font-medium">{items.length}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SearchInput value={searchTerm} onChange={setSearchTerm} />
            <button
              onClick={() => setCurrentPage("form")}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
            >
              <PlusCircle size={18} />
              Add New Item
            </button>
          </div>
        </div>

        {/* Items Table */}
        <ItemsTable />

        {/* View Modal */}
        {openViewModal && <ViewItemModal />}
      </div>
    </div>
  );

  return <>{currentPage === "list" ? renderListPage() : renderFormPage()}</>;
}