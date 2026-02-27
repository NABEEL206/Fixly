// src/pages/Items/Items.jsx
import React, { useState, useMemo, useEffect } from "react";
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
  Filter,
  User,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/API/axiosInstance";

// ==================== CONSTANTS ====================
const ITEMS_API_URL = "/zoho/local-items/";

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
const PRODUCT_TYPE_DISPLAY_NAMES = {
  goods: "Goods",
  service: "Service",
};

const TAX_PREFERENCES = ["taxable", "non_taxable"];
const TAX_PREFERENCE_DISPLAY_NAMES = {
  taxable: "Taxable",
  non_taxable: "Non-Taxable",
};

const VENDORS = [
  { id: "", name: "None" },
  { id: "vendor_a_id", name: "Vendor A (Mobile Wholesaler)" },
  { id: "vendor_b_id", name: "Vendor B (Component Supplier)" },
];

const GST_TREATMENTS = [
  { value: "NO_TAX", label: "No Tax (0%)" },
  { value: "IGST_5", label: "5% IGST" },
  { value: "IGST_12", label: "12% IGST" },
  { value: "IGST_18", label: "18% IGST" },
  { value: "IGST_28", label: "28% IGST" },
  { value: "GST_5", label: "5% GST (2.5% CGST + 2.5% SGST)" },
  { value: "GST_12", label: "12% GST (6% CGST + 6% SGST)" },
  { value: "GST_18", label: "18% GST (9% CGST + 9% SGST)" },
  { value: "GST_28", label: "28% GST (14% CGST + 14% SGST)" },
];

// ==================== SEARCH INPUT ====================
const SearchInput = ({ value, onChange }) => (
  <div className="relative w-80">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <Search size={18} className="text-gray-400" />
    </div>
    <input
      type="text"
      placeholder="Search items by name or SKU..."
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

// ==================== LOADING BUTTON COMPONENT ====================
const LoadingButton = ({ loading, children, onClick, className, disabled, type = "button" }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`relative flex items-center justify-center gap-2 transition-all ${className} ${
        loading ? "cursor-not-allowed opacity-70" : ""
      }`}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
};

// ==================== MAIN COMPONENT ====================
export default function Items() {
  const [items, setItems] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState({});
  const [openViewModal, setOpenViewModal] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [errors, setErrors] = useState({});
  const [imageLoading, setImageLoading] = useState(false);
  const [existingImageUrl, setExistingImageUrl] = useState(null);

  // Filter states
  const [filterProductType, setFilterProductType] = useState("");
  const [filterSellable, setFilterSellable] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");

  const [form, setForm] = useState({
    product_type: "goods",
    name: "",
    sku: "",
    unit: "PIECE",
    tax_preference: "taxable",
    gst_treatment: "NO_TAX",
    hsn_or_sac: "",
    item_image: null,
    is_sellable: true,
    selling_price: "",
    service_charge: "0",
    sales_account: "sales",
    sales_description: "",
    is_purchasable: false,
    cost_price: "",
    purchase_account: "cogs",
    purchase_description: "",
    preferred_vendor: "",
    is_active: true,
  });

  // ==================== DATA FETCHING ====================
  const fetchItems = async () => {
    setLoading(true);
    
    try {
      const response = await axiosInstance.get(ITEMS_API_URL);
      const itemsData = response.data?.results || response.data || [];
      setItems(itemsData);
    } catch (error) {
      console.error("Fetch error:", error);
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view items");
      } else {
        toast.error(error.response?.data?.detail || "Failed to load items");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ==================== HELPER FUNCTIONS ====================
  const getCreatedBy = (item) => {
    if (!item.created_by) return null;
    if (typeof item.created_by === "object") {
      return item.created_by.email || item.created_by.username || "User";
    }
    return item.created_by;
  };

  // Get unique creators for filter
  const uniqueCreatedBy = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      const creator = getCreatedBy(item);
      if (creator) set.add(creator);
    });
    return Array.from(set).sort();
  }, [items]);

  // Get unique product types for filter
  const uniqueProductTypes = useMemo(() => {
    const set = new Set();
    items.forEach((item) => {
      if (item.product_type) set.add(item.product_type);
    });
    return Array.from(set).sort();
  }, [items]);

  // ==================== FILTERED ITEMS ====================
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());

      // Product type filter
      const matchesProductType = !filterProductType || item.product_type === filterProductType;

      // Sellable filter
      const matchesSellable = !filterSellable || 
        (filterSellable === "sellable" && item.is_sellable) ||
        (filterSellable === "not_sellable" && !item.is_sellable);

      // Created by filter
      const itemCreator = getCreatedBy(item);
      const matchesCreatedBy = !filterCreatedBy || itemCreator === filterCreatedBy;

      return matchesSearch && matchesProductType && matchesSellable && matchesCreatedBy;
    });
  }, [items, searchTerm, filterProductType, filterSellable, filterCreatedBy]);

  // ==================== FORM VALIDATION ====================
  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case "name":
        if (!value?.trim()) {
          newErrors[name] = "Item name is required";
        } else if (value.trim().length > 150) {
          newErrors[name] = "Item name cannot exceed 150 characters";
        } else {
          delete newErrors[name];
        }
        break;

      case "hsn_or_sac":
        if (form.product_type === "goods") {
          if (value && !/^\d{4,8}$/.test(value.trim())) {
            newErrors[name] = "HSN code must be 4-8 digits";
          } else {
            delete newErrors[name];
          }
        } else if (form.product_type === "service") {
          if (!value?.trim()) {
            newErrors[name] = "SAC code is required for services";
          } else if (!/^\d{6,8}$/.test(value.trim())) {
            newErrors[name] = "SAC code must be 6-8 digits";
          } else {
            delete newErrors[name];
          }
        }
        break;

      case "selling_price":
        if (form.is_sellable) {
          const price = parseFloat(value);
          if (!value || isNaN(price)) {
            newErrors[name] = "Selling price is required";
          } else if (price < 0) {
            newErrors[name] = "Selling price cannot be negative";
          } else {
            delete newErrors[name];
          }
        } else {
          delete newErrors[name];
        }
        break;

      case "cost_price":
        if (form.is_purchasable) {
          const price = parseFloat(value);
          if (!value || isNaN(price)) {
            newErrors[name] = "Cost price is required";
          } else if (price < 0) {
            newErrors[name] = "Cost price cannot be negative";
          } else {
            delete newErrors[name];
          }
        } else {
          delete newErrors[name];
        }
        break;

      case "sales_account":
        if (form.is_sellable && !value) {
          newErrors[name] = "Sales account is required";
        } else {
          delete newErrors[name];
        }
        break;

      case "purchase_account":
        if (form.is_purchasable && !value) {
          newErrors[name] = "Purchase account is required";
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

    if (!form.name?.trim()) validationErrors.name = "Item name is required";

    if (form.product_type === "service") {
      if (!form.hsn_or_sac?.trim()) {
        validationErrors.hsn_or_sac = "SAC code is required for services";
      }
    }

    if (form.is_sellable) {
      if (!form.selling_price || parseFloat(form.selling_price) < 0) {
        validationErrors.selling_price = "Valid selling price is required";
      }
      if (!form.sales_account) {
        validationErrors.sales_account = "Sales account is required";
      }
    }

    if (form.is_purchasable) {
      if (!form.cost_price || parseFloat(form.cost_price) < 0) {
        validationErrors.cost_price = "Valid cost price is required";
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
      toast.error(Object.values(validationErrors)[0]);

      // Switch to appropriate tab based on error
      if (validationErrors.selling_price || validationErrors.sales_account) {
        setActiveTab("Sales");
      } else if (validationErrors.cost_price || validationErrors.purchase_account) {
        setActiveTab("Purchase");
      }
      return;
    }

    setSubmitLoading(true);
    const toastId = toast.loading(isEdit ? "Updating item..." : "Creating item...");

    try {
      const formData = new FormData();
      
      // Append all form fields
      Object.keys(form).forEach((key) => {
        if (form[key] !== null && form[key] !== undefined && form[key] !== "") {
          if (key === 'item_image' && form[key] instanceof File) {
            formData.append(key, form[key]);
          } else if (typeof form[key] === 'boolean') {
            formData.append(key, form[key].toString());
          } else {
            formData.append(key, form[key]);
          }
        }
      });

      let response;
      const url = ITEMS_API_URL;
      
      if (isEdit && editId) {
        response = await axiosInstance.patch(`${url}${editId}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await axiosInstance.post(url, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }

      if (response.data) {
        await fetchItems();
        resetForm();
        toast.success(
          isEdit ? "Item updated successfully!" : "Item created successfully!", 
          { id: toastId }
        );
      }
    } catch (error) {
      console.error("Submit error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.", { id: toastId });
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to perform this action", { id: toastId });
      } else {
        const errorMessage = error.response?.data?.detail || 
                            error.response?.data?.message || 
                            "Failed to save item";
        toast.error(errorMessage, { id: toastId });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      product_type: "goods",
      name: "",
      sku: "",
      unit: "PIECE",
      tax_preference: "taxable",
      gst_treatment: "NO_TAX",
      hsn_or_sac: "",
      item_image: null,
      is_sellable: true,
      selling_price: "",
      service_charge: "0",
      sales_account: "sales",
      sales_description: "",
      is_purchasable: false,
      cost_price: "",
      purchase_account: "cogs",
      purchase_description: "",
      preferred_vendor: "",
      is_active: true,
    });
    setExistingImageUrl(null);
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
      sku: item.sku || "",
      unit: item.unit || "PIECE",
      tax_preference: item.tax_preference || "taxable",
      gst_treatment: item.gst_treatment || "NO_TAX",
      hsn_or_sac: item.hsn_or_sac || "",
      item_image: null, // Reset file input
      is_sellable: item.is_sellable ?? true,
      selling_price: item.selling_price?.toString() || "",
      service_charge: item.service_charge?.toString() || "0",
      sales_account: item.sales_account || "sales",
      sales_description: item.sales_description || "",
      is_purchasable: item.is_purchasable || false,
      cost_price: item.cost_price?.toString() || "",
      purchase_account: item.purchase_account || "cogs",
      purchase_description: item.purchase_description || "",
      preferred_vendor: item.preferred_vendor || "",
      is_active: item.is_active ?? true,
    });
    
    // Set existing image URL for preview
    if (item.item_image) {
      setExistingImageUrl(item.item_image.startsWith('http') ? item.item_image : item.item_image);
    } else {
      setExistingImageUrl(null);
    }
    
    setEditId(item.id);
    setIsEdit(true);
    setCurrentPage("form");
    setActiveTab("General");
    setOpenViewModal(false);
  };

  const handleView = (item) => {
    setViewedItem(item);
    setOpenViewModal(true);
  };

  const handleDelete = (id, itemName) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete "{itemName}"?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading(`Deleting "${itemName}"...`);
                try {
                  await axiosInstance.delete(`${ITEMS_API_URL}${id}/`);
                  setItems((prev) => prev.filter((item) => item.id !== id));
                  setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
                  toast.success(`"${itemName}" deleted successfully`, { id: toastId });
                } catch (error) {
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.", { id: toastId });
                  } else if (error.response?.status === 403) {
                    toast.error("You don't have permission to delete", { id: toastId });
                  } else {
                    toast.error(
                      error.response?.data?.detail || "Failed to delete item", 
                      { id: toastId }
                    );
                  }
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to delete.");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete {selectedItems.length} selected items?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => toast.dismiss(t.id)} 
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const toastId = toast.loading(`Deleting ${selectedItems.length} items...`);
                
                try {
                  const results = await Promise.allSettled(
                    selectedItems.map((id) => 
                      axiosInstance.delete(`${ITEMS_API_URL}${id}/`)
                    )
                  );

                  const successful = results.filter(r => r.status === 'fulfilled').length;
                  
                  await fetchItems();
                  setSelectedItems([]);

                  if (successful === selectedItems.length) {
                    toast.success(`Deleted ${successful} items successfully`, { id: toastId });
                  } else {
                    toast.success(`Deleted ${successful}/${selectedItems.length} items`, { id: toastId });
                  }
                } catch (error) {
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.", { id: toastId });
                  } else if (error.response?.status === 403) {
                    toast.error("You don't have permission to perform bulk delete", { id: toastId });
                  } else {
                    toast.error("Bulk delete failed", { id: toastId });
                  }
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Delete {selectedItems.length}
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  const handleSyncToZoho = async (id) => {
    const toastId = toast.loading("Syncing to Zoho...");

    try {
      setSyncStatus((prev) => ({ ...prev, [id]: "syncing" }));
      const response = await axiosInstance.post(`${ITEMS_API_URL}${id}/sync-to-zoho/`, {});

      if (response.data.success) {
        setSyncStatus((prev) => ({ ...prev, [id]: "synced" }));
        await fetchItems();
        toast.success("Item synced to Zoho successfully!", { id: toastId });
      } else {
        setSyncStatus((prev) => ({ ...prev, [id]: "failed" }));
        toast.error("Sync failed: " + (response.data.error || "Unknown error"), { id: toastId });
      }
    } catch (error) {
      setSyncStatus((prev) => ({ ...prev, [id]: "failed" }));
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.", { id: toastId });
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to sync to Zoho", { id: toastId });
      } else {
        toast.error("Sync failed: " + (error.response?.data?.error || error.message), {
          id: toastId,
        });
      }
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const toggleSelect = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterProductType("");
    setFilterSellable("");
    setFilterCreatedBy("");
    setSearchTerm("");
  };

  // ==================== UI COMPONENTS ====================
  const LabelWithInfo = ({ children, required }) => (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
      {children}
      {required && <span className="text-red-500">*</span>}
      <Info size={12} className="text-gray-400" />
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

  // ==================== ACTION BUTTONS ====================
  const ActionButtons = ({ item }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleView(item)}
        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
        title="View Details"
      >
        <Eye size={18} />
      </button>
      <button
        onClick={() => handleEdit(item)}
        className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
        title="Edit Item"
      >
        <Edit3 size={18} />
      </button>
      {!item.zoho_item_id && (
        <button
          onClick={() => handleSyncToZoho(item.id)}
          disabled={syncStatus[item.id] === "syncing"}
          className={`p-2 rounded-lg transition-colors ${
            syncStatus[item.id] === "syncing"
              ? "bg-purple-50 text-purple-600 cursor-not-allowed"
              : "bg-purple-50 text-purple-600 hover:bg-purple-100"
          }`}
          title="Sync to Zoho"
        >
          {syncStatus[item.id] === "syncing" ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Upload size={18} />
          )}
        </button>
      )}
      <button
        onClick={() => handleDelete(item.id, item.name)}
        className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
        title="Delete Item"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );

  // ==================== ITEMS TABLE ====================
  const ItemsTable = () => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Bulk Delete Bar */}
      {selectedItems.length > 0 && (
        <div className="px-6 py-4 bg-red-50 border-b border-red-200 flex items-center justify-between">
          <span className="text-sm font-medium text-red-700">
            {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={handleBulkDelete}
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
                Type
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pricing
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Zoho Sync
              </th>
              <th className="py-4 px-6 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <Loader2 size={40} className="text-blue-600 animate-spin mb-3" />
                    <p className="text-gray-600">Loading items...</p>
                  </div>
                </td>
              </tr>
            ) : filteredItems.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <Search size={40} className="text-gray-300 mb-3" />
                    <p className="text-gray-600 text-lg font-medium">No items found</p>
                    {(searchTerm || filterProductType || filterSellable || filterCreatedBy) && (
                      <button
                        onClick={clearFilters}
                        className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
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
                      onChange={() => toggleSelect(item.id)}
                      className="rounded text-blue-600 h-4 w-4 cursor-pointer"
                    />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {item.item_image ? (
                          <img
                            src={item.item_image.startsWith('http') ? item.item_image : item.item_image}
                            className="w-12 h-12 object-contain rounded-lg border border-gray-200"
                            alt={item.name}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.parentNode.innerHTML = '<div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center"><svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                            }}
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
                        <span className="text-xs text-gray-500 block">Unit: {UNIT_DISPLAY_NAMES[item.unit] || item.unit}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        item.product_type === "goods"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {PRODUCT_TYPE_DISPLAY_NAMES[item.product_type] || item.product_type}
                    </span>
                    <span className="text-xs text-gray-500 block mt-1">
                      {item.is_sellable ? "Sellable" : "Not Sellable"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-sm font-medium text-gray-900">
                      Sell: ₹{parseFloat(item.selling_price || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Cost: ₹{parseFloat(item.cost_price || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {item.zoho_item_id ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium">
                        <Check size={12} />
                        Synced
                      </span>
                    ) : syncStatus[item.id] === "syncing" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium">
                        <Loader2 size={12} className="animate-spin" />
                        Syncing...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium">
                        <Upload size={12} />
                        Not Synced
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <ActionButtons item={item} />
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

  // ==================== VIEW MODAL ====================
  const ViewItemModal = () => {
    if (!viewedItem) return null;

    const DetailRow = ({ label, value }) => (
      <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <span className="text-sm text-gray-900 text-right flex-1 ml-4">
          {value || <span className="text-gray-400 italic">Not set</span>}
        </span>
      </div>
    );

    const creator = getCreatedBy(viewedItem);

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

          <div className="p-6 overflow-y-auto">
            {viewedItem.item_image && (
              <div className="flex justify-center mb-6">
                <img
                  src={viewedItem.item_image.startsWith('http') ? viewedItem.item_image : viewedItem.item_image}
                  alt={viewedItem.name}
                  className="max-h-48 object-contain rounded-lg border border-gray-200 p-2"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">General Information</h3>
                <DetailRow
                  label="Product Type"
                  value={PRODUCT_TYPE_DISPLAY_NAMES[viewedItem.product_type] || viewedItem.product_type}
                />
                <DetailRow label="SKU" value={viewedItem.sku} />
                <DetailRow label="Unit" value={UNIT_DISPLAY_NAMES[viewedItem.unit] || viewedItem.unit} />
                <DetailRow
                  label={viewedItem.product_type === "goods" ? "HSN Code" : "SAC Code"}
                  value={viewedItem.hsn_or_sac}
                />
                <DetailRow 
                  label="Tax Preference" 
                  value={TAX_PREFERENCE_DISPLAY_NAMES[viewedItem.tax_preference] || viewedItem.tax_preference} 
                />
                <DetailRow 
                  label="GST Treatment" 
                  value={GST_TREATMENTS.find(g => g.value === viewedItem.gst_treatment)?.label || viewedItem.gst_treatment} 
                />
                <DetailRow label="Status" value={viewedItem.is_active ? "Active" : "Inactive"} />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b pb-2">Additional Info</h3>
                <DetailRow label="Zoho Item ID" value={viewedItem.zoho_item_id || "Not synced"} />
                <DetailRow label="Created By" value={creator} />
                <DetailRow label="Created At" value={viewedItem.created_at ? new Date(viewedItem.created_at).toLocaleString() : null} />
                <DetailRow label="Updated At" value={viewedItem.updated_at ? new Date(viewedItem.updated_at).toLocaleString() : null} />

                {viewedItem.is_sellable && (
                  <>
                    <h3 className="font-semibold text-gray-800 border-b pb-2 mt-4">Sales Details</h3>
                    <DetailRow
                      label="Selling Price"
                      value={`₹${parseFloat(viewedItem.selling_price || 0).toFixed(2)}`}
                    />
                    {viewedItem.service_charge > 0 && (
                      <DetailRow
                        label="Service Charge"
                        value={`₹${parseFloat(viewedItem.service_charge).toFixed(2)}`}
                      />
                    )}
                    <DetailRow
                      label="Sales Account"
                      value={ACCOUNT_DISPLAY_NAMES[viewedItem.sales_account] || viewedItem.sales_account}
                    />
                    {viewedItem.sales_description && (
                      <DetailRow label="Description" value={viewedItem.sales_description} />
                    )}
                  </>
                )}

                {viewedItem.is_purchasable && (
                  <>
                    <h3 className="font-semibold text-gray-800 border-b pb-2 mt-4">Purchase Details</h3>
                    <DetailRow
                      label="Cost Price"
                      value={`₹${parseFloat(viewedItem.cost_price || 0).toFixed(2)}`}
                    />
                    <DetailRow
                      label="Purchase Account"
                      value={ACCOUNT_DISPLAY_NAMES[viewedItem.purchase_account] || viewedItem.purchase_account}
                    />
                    <DetailRow
                      label="Preferred Vendor"
                      value={VENDORS.find((v) => v.id === viewedItem.preferred_vendor)?.name || viewedItem.preferred_vendor}
                    />
                    {viewedItem.purchase_description && (
                      <DetailRow label="Description" value={viewedItem.purchase_description} />
                    )}
                  </>
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
        <LabelWithInfo required>Product Type</LabelWithInfo>
        <div className="flex gap-6 mt-2">
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
                {PRODUCT_TYPE_DISPLAY_NAMES[type]}
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
                {UNIT_DISPLAY_NAMES[unit]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <LabelWithInfo>Tax Preference</LabelWithInfo>
          <select
            name="tax_preference"
            value={form.tax_preference}
            onChange={handleChange}
            className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {TAX_PREFERENCES.map((pref) => (
              <option key={pref} value={pref}>
                {TAX_PREFERENCE_DISPLAY_NAMES[pref]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <LabelWithInfo>GST Treatment</LabelWithInfo>
        <select
          name="gst_treatment"
          value={form.gst_treatment}
          onChange={handleChange}
          className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          {GST_TREATMENTS.map((treatment) => (
            <option key={treatment.value} value={treatment.value}>
              {treatment.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <LabelWithInfo required={form.product_type === "service"}>
            {form.product_type === "goods" ? "HSN Code" : "SAC Code"}
          </LabelWithInfo>
          <input
            type="text"
            name="hsn_or_sac"
            value={form.hsn_or_sac}
            onChange={handleChange}
            className={getInputClass("hsn_or_sac")}
            placeholder={form.product_type === "goods" ? "Enter HSN code" : "Enter SAC code"}
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
          {form.item_image && form.item_image instanceof File ? (
            <>
              <img
                src={URL.createObjectURL(form.item_image)}
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
          ) : existingImageUrl ? (
            <>
              <img
                src={existingImageUrl}
                alt="Current"
                className="max-h-28 object-contain rounded mb-3"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setExistingImageUrl(null)}
                  className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"
                >
                  Remove Image
                </button>
                <label className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 cursor-pointer">
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File size must be less than 5MB");
                          return;
                        }
                        setForm((prev) => ({ ...prev, item_image: file }));
                        setExistingImageUrl(null);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
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
          {!form.item_image && !existingImageUrl && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("File size must be less than 5MB");
                    return;
                  }
                  setForm((prev) => ({ ...prev, item_image: file }));
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          )}
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
            <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500">
              <span className="bg-gray-100 text-gray-700 p-3 text-sm font-medium border-r">₹</span>
              <input
                type="number"
                name="selling_price"
                value={form.selling_price}
                onChange={handleChange}
                className="p-3 w-full focus:outline-none text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            {errors.selling_price && <ValidationError message={errors.selling_price} />}
          </div>

          <div>
            <label className="text-sm font-medium mb-2">Service Charge</label>
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
            <div className="flex border-2 border-gray-300 rounded-lg overflow-hidden focus-within:border-blue-500">
              <span className="bg-gray-100 text-gray-700 p-3 text-sm font-medium border-r">₹</span>
              <input
                type="number"
                name="cost_price"
                value={form.cost_price}
                onChange={handleChange}
                className="p-3 w-full focus:outline-none text-sm"
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
                disabled={submitLoading}
              >
                Cancel
              </button>
              <LoadingButton
                type="submit"
                loading={submitLoading}
                disabled={submitLoading || Object.keys(errors).length > 0}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEdit ? "Update Item" : "Save Item"}
              </LoadingButton>
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

        {/* FILTER SECTION */}
        <div className="mb-6 bg-white p-4 rounded-xl shadow-md border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
              <Filter size={18} className="text-blue-600" />
              Filters
            </h3>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Product Type:</label>
                <select
                  value={filterProductType}
                  onChange={(e) => setFilterProductType(e.target.value)}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm min-w-[150px]"
                >
                  <option value="">All Types</option>
                  {uniqueProductTypes.map((type) => (
                    <option key={type} value={type}>
                      {PRODUCT_TYPE_DISPLAY_NAMES[type]}
                    </option>
                  ))}
                </select>
                {filterProductType && (
                  <button 
                    onClick={() => setFilterProductType("")} 
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-600">Sellable:</label>
                <select
                  value={filterSellable}
                  onChange={(e) => setFilterSellable(e.target.value)}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm min-w-[150px]"
                >
                  <option value="">All Items</option>
                  <option value="sellable">Sellable Only</option>
                  <option value="not_sellable">Non-Sellable Only</option>
                </select>
                {filterSellable && (
                  <button 
                    onClick={() => setFilterSellable("")} 
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                  <User size={14} /> Created By:
                </label>
                <select
                  value={filterCreatedBy}
                  onChange={(e) => setFilterCreatedBy(e.target.value)}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 text-sm min-w-[150px]"
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
            </div>
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