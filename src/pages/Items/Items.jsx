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
  Filter,
  Check,
  Eye,
  RefreshCw,
  Upload,
  ArrowLeft,
  AlertCircle,
  Package,
  MoreVertical,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Axios instance with Authorization
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
  (error) => Promise.reject(error),
);

// Constants
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
  { id: "vendor_a_id", name: "Vendor A (Mobile Wholesaler)" },
  { id: "vendor_b_id", name: "Vendor B (Component Supplier)" },
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

export default function Items() {
  const [items, setItems] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("General");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [syncStatus, setSyncStatus] = useState({});

  const [openViewModal, setOpenViewModal] = useState(false);
  const [viewedItem, setViewedItem] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [actionMenuId, setActionMenuId] = useState(null);

  const [currentPage, setCurrentPage] = useState("list");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterSellable, setFilterSellable] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

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
    // STOCK FIELDS COMMENTED OUT FOR FUTURE USE
    // opening_stock_qty: "",
    // opening_stock_rate: "",
    // opening_stock_date: "",
    // current_stock: "",
  });

  const fetchItems = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await api.get("/zoho/local-items/");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to load items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

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
            newErrors[name] = "Selling price is required for sellable items";
          } else if (parseFloat(value) <= 0) {
            newErrors[name] = "Selling price must be greater than 0";
          } else if (parseFloat(value) > 100000000) {
            newErrors[name] = "Selling price is too high";
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
            newErrors[name] = "Cost price is required for purchasable items";
          } else if (parseFloat(value) <= 0) {
            newErrors[name] = "Cost price must be greater than 0";
          } else if (parseFloat(value) > 100000000) {
            newErrors[name] = "Cost price is too high";
          } else {
            delete newErrors[name];
          }
        } else {
          delete newErrors[name];
        }
        break;

      // STOCK VALIDATION COMMENTED OUT FOR FUTURE USE
      /*
      case "opening_stock_qty":
        if (form.product_type === "goods" && !isEdit) {
          if (form.opening_stock_rate || form.opening_stock_date) {
            if (!value) {
              newErrors[name] = "Opening stock quantity is required when setting opening stock";
            } else if (Number(value) <= 0) {
              newErrors[name] = "Opening stock quantity must be greater than 0";
            } else if (Number(value) > 1000000) {
              newErrors[name] = "Opening stock quantity is too high";
            } else {
              delete newErrors[name];
            }
          } else {
            delete newErrors[name];
          }
        }
        break;

      case "opening_stock_rate":
        if (form.product_type === "goods" && !isEdit) {
          if (form.opening_stock_qty || form.opening_stock_date) {
            if (!value) {
              newErrors[name] = "Opening stock rate is required when setting opening stock";
            } else if (Number(value) <= 0) {
              newErrors[name] = "Opening stock rate must be greater than 0";
            } else if (Number(value) > 1000000) {
              newErrors[name] = "Opening stock rate is too high";
            } else {
              delete newErrors[name];
            }
          } else {
            delete newErrors[name];
          }
        }
        break;

      case "opening_stock_date":
        if (form.product_type === "goods" && !isEdit) {
          if (form.opening_stock_qty || form.opening_stock_rate) {
            if (!value) {
              newErrors[name] = "Opening stock date is required when setting opening stock";
            } else {
              const stockDate = new Date(value);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              
              if (stockDate > today) {
                newErrors[name] = "Opening stock date cannot be in the future";
              } else {
                delete newErrors[name];
              }
            }
          } else {
            delete newErrors[name];
          }
        }
        break;
      */

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

  useEffect(() => {
    if (activeTab === "General") {
      validateField("name", form.name);
      validateField("category", form.category);
      validateField("hsn_or_sac", form.hsn_or_sac);
    } else if (activeTab === "Sales" && form.is_sellable) {
      validateField("selling_price", form.selling_price);
    } else if (activeTab === "Purchase" && form.is_purchasable) {
      validateField("cost_price", form.cost_price);
    }
  }, [activeTab, form.product_type, form.is_sellable, form.is_purchasable]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (JPG, PNG, etc.)");
        return;
      }
      setForm((prev) => ({ ...prev, item_image: file }));
      toast.success("Image uploaded successfully!");
    }
  };

  const removeImage = () => {
    setForm((prev) => ({ ...prev, item_image: null }));
    toast.success("Image removed successfully!");
  };

  const validateForm = () => {
    const validationErrors = {};

    if (!form.name.trim()) {
      validationErrors.name = "Item name is required";
    }

    if (!form.category) {
      validationErrors.category = "Category is required";
    }

    if (!form.tax_preference) {
      validationErrors.tax_preference = "Tax preference is required";
    }

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
        validationErrors.selling_price =
          "Selling price is required for sellable items";
      } else if (parseFloat(form.selling_price) <= 0) {
        validationErrors.selling_price = "Selling price must be greater than 0";
      }

      if (!form.sales_account) {
        validationErrors.sales_account =
          "Sales account is required for sellable items";
      }
    }

    if (form.is_purchasable) {
      if (!form.cost_price) {
        validationErrors.cost_price =
          "Cost price is required for purchasable items";
      } else if (parseFloat(form.cost_price) <= 0) {
        validationErrors.cost_price = "Cost price must be greater than 0";
      }

      if (!form.purchase_account) {
        validationErrors.purchase_account =
          "Purchase account is required for purchasable items";
      }
    }

    // STOCK VALIDATION COMMENTED OUT FOR FUTURE USE
    /*
    if (!isEdit && form.product_type === "goods") {
      const hasAnyOpeningStock = form.opening_stock_qty || form.opening_stock_rate || form.opening_stock_date;
      const hasAllOpeningStock = form.opening_stock_qty && form.opening_stock_rate && form.opening_stock_date;

      if (hasAnyOpeningStock && !hasAllOpeningStock) {
        if (!form.opening_stock_qty) {
          validationErrors.opening_stock_qty = "Opening stock quantity is required when setting opening stock";
        }
        if (!form.opening_stock_rate) {
          validationErrors.opening_stock_rate = "Opening stock rate is required when setting opening stock";
        }
        if (!form.opening_stock_date) {
          validationErrors.opening_stock_date = "Opening stock date is required when setting opening stock";
        }
      } else if (hasAllOpeningStock) {
        if (Number(form.opening_stock_qty) <= 0) {
          validationErrors.opening_stock_qty = "Opening stock quantity must be greater than 0";
        }
        if (Number(form.opening_stock_rate) <= 0) {
          validationErrors.opening_stock_rate = "Opening stock rate must be greater than 0";
        }
        
        const stockDate = new Date(form.opening_stock_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (stockDate > today) {
          validationErrors.opening_stock_date = "Opening stock date cannot be in the future";
        }
      }
    }
    */

    setErrors(validationErrors);
    return validationErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0) {
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError, {
        duration: 4000,
        position: "top-center",
      });

      const salesErrors = ["selling_price", "sales_account", "service_charge"];
      const purchaseErrors = ["cost_price", "purchase_account"];
      // Removed stock errors from error detection since we're not using stock now

      const hasSalesError = Object.keys(validationErrors).some((key) =>
        salesErrors.some((error) => key.includes(error)),
      );
      const hasPurchaseError = Object.keys(validationErrors).some((key) =>
        purchaseErrors.some((error) => key.includes(error)),
      );

      if (hasSalesError) {
        setActiveTab("Sales");
      } else if (hasPurchaseError) {
        setActiveTab("Purchase");
      } else {
        setActiveTab("General");
      }

      return;
    }

    setLoading(true);
    setApiError(null);

    const toastId = toast.loading(
      isEdit ? "Updating item..." : "Creating item...",
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

        if (response.data.detail?.includes("Zoho sync failed")) {
          toast.success("✅ Item saved locally successfully!", { id: toastId });
          toast.warning(
            "⚠️ Zoho sync failed. You can try syncing it later from the items list.",
            {
              duration: 5000,
              position: "top-center",
            },
          );
        } else {
          const successMessage = isEdit
            ? "Item updated successfully!"
            : // Removed opening stock success message since stock is not used now
              "Item created successfully!";

          toast.success(`✅ ${successMessage}`, {
            id: toastId,
            duration: 3000,
            position: "top-center",
          });
        }
      } else if (response.data?.detail) {
        toast.error(response.data.detail, {
          id: toastId,
          duration: 4000,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Error saving item:", error);
      let errorMessage = "Failed to save item. Please check your connection.";

      if (error.response?.data) {
        if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.errors) {
          errorMessage = Object.values(error.response.data.errors)
            .flat()
            .join(", ");
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(`❌ ${errorMessage}`, {
        id: toastId,
        duration: 5000,
        position: "top-center",
      });
      setApiError(errorMessage);
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
      // STOCK FIELDS COMMENTED OUT FOR FUTURE USE
      // opening_stock_qty: "",
      // opening_stock_rate: "",
      // opening_stock_date: "",
      // current_stock: "",
    });
    setErrors({});
    setIsEdit(false);
    setEditId(null);
    setCurrentPage("list");
    setActiveTab("General");
    setApiError(null);
  };

  const handleEdit = (item) => {
    const formData = {
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
      // STOCK FIELDS COMMENTED OUT FOR FUTURE USE
      // opening_stock_qty: item.opening_stock_qty || "",
      // opening_stock_rate: item.opening_stock_rate || "",
      // opening_stock_date: item.opening_stock_date || "",
      // current_stock: item.current_stock || "",
    };

    setForm(formData);
    setErrors({});
    setEditId(item.id);
    setIsEdit(true);
    setCurrentPage("form");
    setActiveTab("General");
    setOpenViewModal(false);
    setApiError(null);
    setActionMenuId(null);
  };

  const handleView = (item) => {
    setViewedItem(item);
    setOpenViewModal(true);
    setActionMenuId(null);
  };

  const showDeleteConfirmation = (id, itemName) => {
    toast.dismiss();

    toast.custom(
      (t) => (
        <div className="flex flex-col gap-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">
                Delete Item?
              </h3>
              <p className="text-sm font-medium text-gray-700 mt-1">
                {itemName}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                This will permanently delete the item from your inventory and
                Zoho Books.
              </p>
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
              Delete Item
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    );
  };

  const performIndividualDelete = async (id, itemName) => {
    const toastId = toast.loading(`Deleting item "${itemName}"...`, {
      position: "top-center",
    });

    try {
      await api.delete(`${ITEMS_API_URL}${id}/`);

      setItems((prev) => prev.filter((item) => item.id !== id));
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));

      toast.success(`✅ Item "${itemName}" deleted successfully`, {
        id: toastId,
        duration: 3000,
        position: "top-center",
      });
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        `❌ Failed to delete item: ${
          error.response?.data?.detail || error.message || "Network error"
        }`,
        {
          id: toastId,
          duration: 4000,
          position: "top-center",
        },
      );
    }
  };

  const showBulkDeleteConfirmation = () => {
    if (selectedItems.length === 0) {
      toast("Please select at least one item to delete.", {
        icon: "⚠️",
        duration: 3000,
        position: "top-center",
      });
      return;
    }

    toast.dismiss();

    toast.custom(
      (t) => (
        <div className="flex flex-col gap-4 bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-w-md">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Trash2 className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">
                Delete {selectedItems.length} Item
                {selectedItems.length > 1 ? "s" : ""}?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently remove the selected item
                {selectedItems.length > 1 ? "s" : ""} from your inventory and
                Zoho Books.
              </p>
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
                await performBulkDelete();
              }}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition duration-200 flex items-center gap-2"
            >
              <Trash2 size={16} />
              Delete Permanently
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-center",
      },
    );
  };

  const performBulkDelete = async () => {
    const toastId = toast.loading(
      `Deleting ${selectedItems.length} item${
        selectedItems.length > 1 ? "s" : ""
      }...`,
      {
        position: "top-center",
      },
    );

    try {
      const idsToDelete = Array.from(selectedItems);

      const deletePromises = idsToDelete.map(async (id) => {
        try {
          await api.delete(`${ITEMS_API_URL}${id}/`);
          return { success: true, id };
        } catch (error) {
          return { success: false, id, error: error.message };
        }
      });

      const results = await Promise.all(deletePromises);

      const successfulDeletes = results.filter((r) => r.success);
      const failedDeletes = results.filter((r) => !r.success);

      await fetchItems();
      setSelectedItems([]);

      if (failedDeletes.length === 0) {
        toast.success(
          `✅ Successfully deleted ${successfulDeletes.length} item${
            successfulDeletes.length > 1 ? "s" : ""
          }`,
          {
            id: toastId,
            duration: 4000,
            position: "top-center",
          },
        );
      } else if (successfulDeletes.length > 0) {
        toast.success(
          `✅ Deleted ${successfulDeletes.length} item${
            successfulDeletes.length > 1 ? "s" : ""
          }, ❌ ${failedDeletes.length} failed`,
          {
            id: toastId,
            duration: 5000,
            position: "top-center",
          },
        );
      } else {
        toast.error("❌ Failed to delete all selected items", {
          id: toastId,
          duration: 4000,
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("❌ An error occurred during bulk delete", {
        id: toastId,
        duration: 4000,
        position: "top-center",
      });
    }
  };

  const handleSyncToZoho = async (id) => {
    const toastId = toast.loading("Syncing to Zoho...");
    try {
      setSyncStatus((prev) => ({ ...prev, [id]: "syncing" }));
      const response = await api.post(`${ITEMS_API_URL}${id}/sync-to-zoho/`);

      if (response.data.success || response.data.zoho_item_id) {
        setSyncStatus((prev) => ({ ...prev, [id]: "synced" }));
        await fetchItems();
        toast.success("Item synced to Zoho successfully!", {
          id: toastId,
          duration: 3000,
          position: "top-center",
        });
      } else {
        setSyncStatus((prev) => ({ ...prev, [id]: "failed" }));
        toast.error(
          "Sync failed: " + (response.data.error || "Unknown error"),
          {
            id: toastId,
            duration: 4000,
            position: "top-center",
          },
        );
      }
    } catch (error) {
      console.error("Error syncing to Zoho:", error);
      setSyncStatus((prev) => ({ ...prev, [id]: "failed" }));
      toast.error(
        "Sync failed: " +
          (error.response?.data?.error || error.message || "Network error"),
        {
          id: toastId,
          duration: 4000,
          position: "top-center",
        },
      );
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id],
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(filteredItems.map((item) => item.id));
      toast.success(`Selected all ${filteredItems.length} items`, {
        duration: 2000,
        position: "top-center",
      });
    } else {
      setSelectedItems([]);
      toast.success("Cleared all selections", {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hsn_or_sac?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType =
        filterType === "All" || item.product_type === filterType.toLowerCase();
      const matchesSellable =
        filterSellable === "All" ||
        (filterSellable === "Yes" && item.is_sellable) ||
        (filterSellable === "No" && !item.is_sellable);
      const matchesCategory =
        filterCategory === "All" || item.category === filterCategory;
      return matchesSearch && matchesType && matchesSellable && matchesCategory;
    });
  }, [items, searchTerm, filterType, filterSellable, filterCategory]);

  const LabelWithInfo = ({ children }) => (
    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-1">
      {children} <Info size={12} className="text-gray-400" />
    </label>
  );

  const handleRefresh = async () => {
    const toastId = toast.loading("Refreshing items...");
    try {
      await fetchItems();
      toast.success("Items refreshed successfully!", {
        id: toastId,
        duration: 2000,
        position: "top-center",
      });
    } catch (error) {
      toast.error("Failed to refresh items", {
        id: toastId,
        duration: 3000,
        position: "top-center",
      });
    }
  };

  const handleClearFilters = () => {
    if (
      !searchTerm &&
      filterType === "All" &&
      filterSellable === "All" &&
      filterCategory === "All"
    ) {
      toast.info("No filters to clear", {
        duration: 2000,
        position: "top-center",
      });
      return;
    }

    setSearchTerm("");
    setFilterType("All");
    setFilterSellable("All");
    setFilterCategory("All");
    toast.success("All filters cleared", {
      duration: 2000,
      position: "top-center",
    });
  };

  // REMOVED "Stock" TAB FROM THE TABS ARRAY SINCE WE'RE NOT USING IT NOW
  const tabs = [
    { name: "General", icon: Settings },
    { name: "Sales", icon: DollarSign },
    { name: "Purchase", icon: ShoppingBag },
    // { name: "Stock", icon: Package }, // COMMENTED OUT FOR FUTURE USE
  ];

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

  // Render functions for tabs
  function renderGeneralTab() {
    return (
      <div className="space-y-6">
        <div>
          <LabelWithInfo>Product Type</LabelWithInfo>
          <div className="flex gap-6">
            {PRODUCT_TYPES.map((type) => (
              <label
                key={type}
                className="flex items-center text-sm cursor-pointer"
              >
                <input
                  type="radio"
                  name="product_type"
                  value={type}
                  checked={form.product_type === type}
                  onChange={handleChange}
                  className="mr-3 h-4 w-4"
                />
                <span
                  className={`text-base ${
                    form.product_type === type
                      ? "font-semibold text-blue-700"
                      : "text-gray-700"
                  }`}
                >
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
          {!errors.name && (
            <p className="text-xs text-gray-500 mt-1">
              Enter a descriptive name for the item (max 200 characters)
            </p>
          )}
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
                  {pref.replace("_", " ").charAt(0).toUpperCase() +
                    pref.replace("_", " ").slice(1)}
                </option>
              ))}
            </select>
            {errors.tax_preference && (
              <ValidationError message={errors.tax_preference} />
            )}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium flex items-center gap-1 mb-2">
            GST Treatment
          </label>
          <select
            name="gst_treatment"
            value={form.gst_treatment}
            onChange={handleChange}
            className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select GST Treatment</option>
            {GST_TREATMENTS.map((treatment, index) => (
              <option key={index} value={treatment}>
                {treatment}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            Select the appropriate GST treatment for this item
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <LabelWithInfo>
                {form.product_type === "goods" ? "HSN Code" : "SAC Code"}
                {form.product_type === "service" && (
                  <span className="text-red-500">*</span>
                )}
              </LabelWithInfo>
            </div>
            <div className="relative">
              <input
                type="text"
                name="hsn_or_sac"
                value={form.hsn_or_sac}
                onChange={handleChange}
                className={getInputClass("hsn_or_sac")}
                placeholder={
                  form.product_type === "goods"
                    ? "Enter HSN code (4-8 digits)"
                    : "Enter SAC code (6 digits)"
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-500"
              >
                <Search size={16} />
              </button>
            </div>
            {errors.hsn_or_sac && (
              <ValidationError message={errors.hsn_or_sac} />
            )}
            {!errors.hsn_or_sac && (
              <p className="text-xs text-gray-500 mt-2">
                {form.product_type === "goods"
                  ? "HSN code must be 4-8 digits for goods (optional)"
                  : "SAC code must be exactly 6 digits for services"}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <LabelWithInfo>SKU</LabelWithInfo>
            </div>
            <input
              type="text"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="SKU-IPH-13-BLK"
            />
            <p className="text-xs text-gray-500 mt-2">
              Unique identifier for this item (optional)
            </p>
          </div>
        </div>

        <div className="pt-2">
          <LabelWithInfo>Item Image</LabelWithInfo>
          <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center min-h-[160px] relative hover:border-blue-400 transition bg-gray-50">
            {form.item_image ? (
              <>
                <img
                  src={
                    typeof form.item_image === "string"
                      ? form.item_image
                      : URL.createObjectURL(form.item_image)
                  }
                  alt="Item Preview"
                  className="max-h-28 object-contain rounded mb-3"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 z-10 shadow"
                >
                  <X size={16} />
                </button>
                <p className="text-sm text-gray-600 mt-2">
                  {typeof form.item_image === "string"
                    ? "Image uploaded"
                    : form.item_image.name}
                </p>
              </>
            ) : (
              <>
                <Image size={32} className="text-gray-400 mb-3" />
                <p className="text-gray-600 text-center text-base mb-2">
                  Drag and drop or{" "}
                  <span className="text-blue-600 font-semibold cursor-pointer">
                    Browse File
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Supports JPG, PNG up to 5MB
                </p>
              </>
            )}
            <input
              type="file"
              name="item_image"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderSalesTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center pb-2">
          <h3 className="font-semibold text-lg text-gray-800">
            Selling Details
          </h3>
          <label className="flex items-center ml-auto text-sm text-blue-600 cursor-pointer">
            <input
              type="checkbox"
              name="is_sellable"
              checked={form.is_sellable}
              onChange={handleChange}
              className="mr-3 h-4 w-4"
            />
            Sellable Item
          </label>
        </div>

        {form.is_sellable ? (
          <div className="space-y-6 p-4 border-2 rounded-lg bg-blue-50">
            <div>
              <label className="text-sm font-medium flex items-center gap-1 mb-2">
                Selling Price <span className="text-red-500">*</span>
              </label>
              <div
                className={
                  errors.selling_price
                    ? "flex border-2 border-red-500 rounded-lg overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-red-50"
                    : "flex border-2 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                }
              >
                <span className="bg-gray-200 text-gray-700 p-3 text-sm font-medium">
                  ₹ INR
                </span>
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
              {errors.selling_price && (
                <ValidationError message={errors.selling_price} />
              )}
              {!errors.selling_price && (
                <p className="text-xs text-gray-500 mt-2">
                  Price at which this item will be sold
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium flex items-center gap-1 mb-2">
                Service Charge (Optional)
              </label>
              <div className="flex border-2 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                <span className="bg-gray-200 text-gray-700 p-3 text-sm font-medium">
                  ₹ INR
                </span>
                <input
                  type="number"
                  name="service_charge"
                  value={form.service_charge}
                  onChange={handleChange}
                  className="p-3 w-full focus:outline-none text-sm bg-transparent"
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
                    {ACCOUNT_DISPLAY_NAMES[account] || account}
                  </option>
                ))}
              </select>
              {errors.sales_account && (
                <ValidationError message={errors.sales_account} />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2">
                Sales Description
              </label>
              <textarea
                name="sales_description"
                value={form.sales_description}
                onChange={handleChange}
                className="border p-3 w-full rounded-lg h-32 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Optional description for invoices/estimates"
              />
              <p className="text-xs text-gray-500 mt-2">
                This description will appear on sales documents
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed rounded-lg bg-gray-50 text-center">
            <p className="text-gray-500 text-base">
              Mark this item as 'Sellable' to define sales-related details.
            </p>
          </div>
        )}
      </div>
    );
  }

  function renderPurchaseTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center pb-2">
          <h3 className="font-semibold text-lg text-gray-800">
            Purchasing Details
          </h3>
          <label className="flex items-center ml-auto text-sm text-blue-600 cursor-pointer">
            <input
              type="checkbox"
              name="is_purchasable"
              checked={form.is_purchasable}
              onChange={handleChange}
              className="mr-3 h-4 w-4"
            />
            Purchasable Item
          </label>
        </div>

        {form.is_purchasable ? (
          <div className="space-y-6 p-4 border-2 rounded-lg bg-green-50">
            <div>
              <label className="text-sm font-medium flex items-center gap-1 mb-2">
                Cost Price <span className="text-red-500">*</span>
              </label>
              <div
                className={
                  errors.cost_price
                    ? "flex border-2 border-red-500 rounded-lg overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-red-50"
                    : "flex border-2 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500"
                }
              >
                <span className="bg-gray-200 text-gray-700 p-3 text-sm font-medium">
                  ₹ INR
                </span>
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
              {errors.cost_price && (
                <ValidationError message={errors.cost_price} />
              )}
              {!errors.cost_price && (
                <p className="text-xs text-gray-500 mt-2">
                  Price at which this item is purchased
                </p>
              )}
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
                    {ACCOUNT_DISPLAY_NAMES[account] || account}
                  </option>
                ))}
              </select>
              {errors.purchase_account && (
                <ValidationError message={errors.purchase_account} />
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-2">
                Preferred Vendor
              </label>
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
              <label className="text-sm font-medium mb-2">
                Purchase Description
              </label>
              <textarea
                name="purchase_description"
                value={form.purchase_description}
                onChange={handleChange}
                className="border p-3 w-full rounded-lg h-32 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Optional notes for purchase orders"
              />
            </div>
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed rounded-lg bg-gray-50 text-center">
            <p className="text-gray-500 text-base">
              Mark this item as 'Purchasable' to define cost and vendor details.
            </p>
          </div>
        )}
      </div>
    );
  }

  // STOCK TAB FUNCTION COMMENTED OUT FOR FUTURE USE
  /*
  function renderStockTab() {
    return (
      <div className="space-y-6">
        <div className="flex items-center pb-2">
          <h3 className="font-semibold text-lg text-gray-800">
            Stock Information
          </h3>
        </div>

        {form.product_type === "goods" ? (
          <div className="space-y-6">
            {!isEdit && (
              <div className="p-4 border-2 rounded-lg bg-yellow-50">
                <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package size={16} />
                  Opening Stock (Optional - Only during creation)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      Opening Quantity
                      {(form.opening_stock_rate || form.opening_stock_date) && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="number"
                      name="opening_stock_qty"
                      value={form.opening_stock_qty}
                      onChange={handleChange}
                      min="0"
                      step="1"
                      className={getInputClass("opening_stock_qty")}
                      placeholder="e.g., 100"
                    />
                    {errors.opening_stock_qty && <ValidationError message={errors.opening_stock_qty} />}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      Opening Rate (₹)
                      {(form.opening_stock_qty || form.opening_stock_date) && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <div className={errors.opening_stock_rate 
                      ? "flex border-2 border-red-500 rounded-lg overflow-hidden focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500 bg-red-50" 
                      : "flex border-2 rounded-lg overflow-hidden focus-within:border-yellow-500 focus-within:ring-1 focus-within:ring-yellow-500"
                    }>
                      <span className="bg-gray-200 text-gray-700 px-3 py-3 text-sm font-medium">
                        ₹
                      </span>
                      <input
                        type="number"
                        name="opening_stock_rate"
                        value={form.opening_stock_rate}
                        onChange={handleChange}
                        min="0"
                        step="0.01"
                        className="p-3 w-full focus:outline-none text-sm bg-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    {errors.opening_stock_rate && <ValidationError message={errors.opening_stock_rate} />}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                      Stock Date
                      {(form.opening_stock_qty || form.opening_stock_rate) && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    <input
                      type="date"
                      name="opening_stock_date"
                      value={form.opening_stock_date}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      className={getInputClass("opening_stock_date")}
                    />
                    {errors.opening_stock_date && <ValidationError message={errors.opening_stock_date} />}
                  </div>
                </div>

                {form.opening_stock_qty && form.opening_stock_rate && !errors.opening_stock_qty && !errors.opening_stock_rate && (
                  <div className="mt-4 p-4 bg-white rounded-lg border-2 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Total Opening Stock Value:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{(
                          Number(form.opening_stock_qty) * 
                          Number(form.opening_stock_rate)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {form.opening_stock_qty} units × ₹{Number(form.opening_stock_rate).toFixed(2)} per unit
                    </p>
                  </div>
                )}

                {(form.opening_stock_qty || form.opening_stock_rate || form.opening_stock_date) && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          opening_stock_qty: "",
                          opening_stock_rate: "",
                          opening_stock_date: "",
                        }));
                        const newErrors = { ...errors };
                        delete newErrors.opening_stock_qty;
                        delete newErrors.opening_stock_rate;
                        delete newErrors.opening_stock_date;
                        setErrors(newErrors);
                        toast.success("Opening stock fields cleared", {
                          duration: 2000,
                          position: "top-center",
                        });
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                    >
                      <X size={14} />
                      Clear Opening Stock
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 border-2 rounded-lg bg-blue-50">
              <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={16} />
                Current Stock
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1 mb-2">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="current_stock"
                    value={form.current_stock}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className="border p-3 w-full rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter current stock quantity"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Current available quantity in inventory
                  </p>
                </div>

                {form.current_stock && form.cost_price && (
                  <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Current Stock Value:
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        ₹{(
                          Number(form.current_stock) * 
                          Number(form.cost_price)
                        ).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {form.current_stock} units × ₹{Number(form.cost_price).toFixed(2)} per unit
                    </p>
                  </div>
                )}
              </div>

              {(form.opening_stock_qty || form.current_stock) && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
                  <h5 className="text-sm font-semibold text-gray-800 mb-3">Stock Summary</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Opening Stock</p>
                      <p className="text-sm font-medium">
                        {form.opening_stock_qty ? `${form.opening_stock_qty} units` : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Current Stock</p>
                      <p className="text-sm font-medium">
                        {form.current_stock ? `${form.current_stock} units` : "0 units"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-700 space-y-1">
                  <p className="font-medium">Stock Management Notes:</p>
                  <ul className="list-disc list-inside space-y-0.5 ml-2">
                    <li>Opening stock can only be set during item creation</li>
                    <li>All three opening stock fields must be filled together</li>
                    <li>Stock date cannot be in the future</li>
                    <li>Current stock will be updated automatically with purchases/sales</li>
                    <li>You can manually adjust current stock here if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 border-2 border-dashed rounded-lg bg-gray-50 text-center">
            <p className="text-gray-500 text-base">
              Stock management is only available for goods items.
            </p>
          </div>
        )}
      </div>
    );
  }
  */

  const FilterBar = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 p-6 bg-white rounded-xl shadow-sm border mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 flex-grow">
        <div className="relative w-full md:w-auto md:flex-grow max-w-lg">
          <input
            type="text"
            placeholder="Search by Item Name, SKU, HSN Code or Category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-2 p-3 pl-10 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-500" />
            <span className="text-sm text-gray-700 font-medium">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border-2 p-2 rounded-lg text-sm bg-white cursor-pointer focus:border-blue-500"
            >
              <option value="All">All Types</option>
              <option value="Goods">Goods</option>
              <option value="Service">Service</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 font-medium">Sellable:</span>
            <select
              value={filterSellable}
              onChange={(e) => setFilterSellable(e.target.value)}
              className="border-2 p-2 rounded-lg text-sm bg-white cursor-pointer focus:border-blue-500"
            >
              <option value="All">All Statuses</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 font-medium">Category:</span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border-2 p-2 rounded-lg text-sm bg-white cursor-pointer focus:border-blue-500"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter((cat) => cat.id).map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center space-x-4 w-full md:w-auto">
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 shadow"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>

        {selectedItems.length > 0 && (
          <button
            onClick={showBulkDeleteConfirmation}
            disabled={loading}
            className="bg-red-500 text-white px-4 py-3 rounded-lg flex items-center gap-2 text-sm shadow hover:bg-red-600 transition disabled:opacity-50"
          >
            <Trash2 size={18} /> Delete ({selectedItems.length})
          </button>
        )}

        {(searchTerm ||
          filterType !== "All" ||
          filterSellable !== "All" ||
          filterCategory !== "All") && (
          <button
            onClick={handleClearFilters}
            className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium"
          >
            <X size={16} /> Clear Filters
          </button>
        )}
      </div>
    </div>
  );

  // Fixed Action Menu Component with proper click handling
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleView(item);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Eye size={14} /> View Details
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(item);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit3 size={14} /> Edit Item
              </button>
              {!item.zoho_item_id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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
                onClick={(e) => {
                  e.stopPropagation();
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

  const ItemsTable = () => {
    const getCreatedBy = (item) => {
      // If backend is only sending user ID (number), hide it
      if (typeof item.created_by === "number") return "—";

      return item.created_by?.name || item.created_by || "—";
    };

    // REMOVED STOCK STATUS FUNCTION SINCE WE'RE NOT USING STOCK NOW
    /*
    const getStockStatus = (stock) => {
      if (stock > 10) return { text: "In Stock", color: "text-green-600", bg: "bg-green-100" };
      if (stock > 0) return { text: "Low Stock", color: "text-yellow-600", bg: "bg-yellow-100" };
      return { text: "Out of Stock", color: "text-red-600", bg: "bg-red-100" };
    };
    */

    const truncateId = (id) => {
      if (!id) return "N/A";
      const idStr = String(id);
      return idStr.length > 8 ? `${idStr.slice(0, 8)}...` : idStr;
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-4 px-4 text-left w-12">
                  <input
                    type="checkbox"
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={
                      filteredItems.length > 0 &&
                      selectedItems.length === filteredItems.length
                    }
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[200px]">
                  Item Details
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">
                  Category
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[100px]">
                  Type
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">
                  Pricing
                </th>
                {/* REMOVED STOCK COLUMN SINCE WE'RE NOT USING IT NOW */}
                {/* <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">
                  Stock
                </th> */}
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[140px]">
                  HSN/SAC & GST
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[140px]">
                  Created By
                </th>

                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[120px]">
                  Sync Status
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    {" "}
                    {/* Changed colSpan from 9 to 8 */}
                    <div className="flex flex-col items-center justify-center">
                      <RefreshCw
                        size={32}
                        className="animate-spin text-blue-500 mb-3"
                      />
                      <p className="text-gray-600">Loading items...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    {" "}
                    {/* Changed colSpan from 9 to 8 */}
                    <div className="flex flex-col items-center justify-center">
                      <Search size={40} className="text-gray-400 mb-3" />
                      <p className="text-gray-600 text-lg font-medium">
                        No items found
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {items.length === 0
                          ? "Try adding your first item!"
                          : "Try adjusting your filters."}
                      </p>
                      {items.length === 0 && (
                        <button
                          onClick={() => setCurrentPage("form")}
                          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-blue-700 transition"
                        >
                          <PlusCircle size={18} /> Add New Item
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  // REMOVED STOCK STATUS SINCE WE'RE NOT USING IT NOW
                  // const stockStatus = getStockStatus(item.current_stock || 0);
                  return (
                    <tr
                      key={item.id}
                      className={`border-b hover:bg-gray-50 ${
                        selectedItems.includes(item.id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          {item.item_image ? (
                            <img
                              src={item.item_image}
                              className="w-12 h-12 object-contain rounded-lg border"
                              alt={item.name}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border text-gray-400">
                              <Image size={20} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm mb-1">
                              {item.name}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                SKU: {item.sku || "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">
                            {CATEGORIES.find((cat) => cat.id === item.category)
                              ?.name || "N/A"}
                          </span>
                          <span className="text-xs text-gray-500">
                            ID: {truncateId(item.id)}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full w-fit ${
                              item.product_type === "goods"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {item.product_type?.charAt(0).toUpperCase() +
                              item.product_type?.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {item.is_sellable ? "Sellable" : "Not Sellable"} •{" "}
                            {item.is_purchasable
                              ? "Purchasable"
                              : "Not Purchasable"}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-900">
                              ₹{parseFloat(item.selling_price || 0).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">
                              Selling
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              ₹{parseFloat(item.cost_price || 0).toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">Cost</span>
                          </div>
                        </div>
                      </td>
                      {/* REMOVED STOCK COLUMN DATA SINCE WE'RE NOT USING IT NOW */}
                      {/*
                      <td className="py-4 px-4">
                        {item.product_type === "goods" ? (
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-semibold ${stockStatus.color}`}>
                                {item.current_stock || 0} units
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${stockStatus.bg} ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </div>
                            {item.opening_stock_qty && (
                              <span className="text-xs text-gray-500">
                                Opening: {item.opening_stock_qty} units
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">N/A</span>
                        )}
                      </td>
                      */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">
                              {item.hsn_or_sac || "N/A"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {item.product_type === "goods" ? "HSN" : "SAC"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">GST:</span>
                            <span className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                              {item.gst_treatment || "Not set"}
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* ✅ CREATED BY COLUMN */}
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700 font-medium">
                          {getCreatedBy(item)}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSyncToZoho(item.id);
                          }}
                          disabled={syncStatus[item.id] === "syncing"}
                          className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 w-full justify-center ${
                            item.zoho_item_id
                              ? "bg-green-100 text-green-800"
                              : syncStatus[item.id] === "syncing"
                                ? "bg-yellow-100 text-yellow-800"
                                : syncStatus[item.id] === "failed"
                                  ? "bg-red-100 text-red-800"
                                  : item.sync_status === "FAILED"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                          } hover:opacity-90 transition disabled:opacity-50`}
                        >
                          {syncStatus[item.id] === "syncing" ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : item.zoho_item_id ? (
                            <Check size={12} />
                          ) : syncStatus[item.id] === "failed" ||
                            item.sync_status === "FAILED" ? (
                            <X size={12} />
                          ) : (
                            <Upload size={12} />
                          )}
                          {item.zoho_item_id
                            ? "Synced"
                            : syncStatus[item.id] === "syncing"
                              ? "Syncing..."
                              : syncStatus[item.id] === "failed" ||
                                  item.sync_status === "FAILED"
                                ? "Failed"
                                : "Sync"}
                        </button>
                        {item.zoho_item_id && (
                          <div className="text-[10px] text-gray-500 text-center mt-1 truncate">
                            ID: {truncateId(item.zoho_item_id)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <ActionMenu
                          itemId={item.id}
                          itemName={item.name}
                          item={item}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const ViewItemModal = () => {
    const getCreatedBy = (item) => {
      if (typeof item.created_by === "number") return "—";
      return item.created_by?.name || item.created_by || "—";
    };

    if (!viewedItem) return null;

    const DetailRow = ({ label, value, strong = false }) => (
      <div className="flex justify-between items-start py-3 border-b">
        <span className="text-sm font-medium text-gray-600 min-w-[160px] pr-4">
          {label}
        </span>
        <span
          className={`text-sm text-gray-800 text-right flex-1 ${strong ? "font-semibold" : ""}`}
        >
          {value || <span className="text-gray-400 italic">Not set</span>}
        </span>
      </div>
    );

    const Section = ({
      title,
      children,
      bgColor = "gray-50",
      titleColor = "blue-700",
    }) => (
      <div className={`border rounded-lg p-4 bg-${bgColor}`}>
        <h3
          className={`text-lg font-semibold mb-3 border-b pb-2 text-${titleColor}`}
        >
          {title}
        </h3>
        {children}
      </div>
    );

    return (
      <div className="fixed inset-0 bg-opacity-50 flex justify-center items-center z-50 p-4 mt-15">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Eye size={20} /> Item Details: {viewedItem.name}
            </h2>
            <button
              onClick={() => setOpenViewModal(false)}
              className="text-gray-500 hover:text-red-600 p-1"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {viewedItem.item_image && (
                <div className="md:col-span-3 flex justify-center mb-4">
                  <img
                    src={viewedItem.item_image}
                    alt={viewedItem.name}
                    className="max-h-48 object-contain rounded-lg border p-2"
                  />
                </div>
              )}

              <div className="md:col-span-3">
                <Section
                  title="General Information"
                  bgColor="gray-50"
                  titleColor="blue-700"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <DetailRow
                        label="Product Type"
                        value={
                          viewedItem.product_type?.charAt(0).toUpperCase() +
                          viewedItem.product_type?.slice(1)
                        }
                      />
                      <DetailRow
                        label="Category"
                        value={
                          CATEGORIES.find(
                            (cat) => cat.id === viewedItem.category,
                          )?.name ||
                          viewedItem.category ||
                          "Not set"
                        }
                      />
                      <DetailRow label="SKU" value={viewedItem.sku} />
                      <DetailRow
                        label="Unit"
                        value={
                          UNIT_DISPLAY_NAMES[viewedItem.unit] || viewedItem.unit
                        }
                      />
                    </div>
                    <div>
                      <DetailRow
                        label={
                          viewedItem.product_type === "goods"
                            ? "HSN Code"
                            : "SAC Code"
                        }
                        value={viewedItem.hsn_or_sac}
                      />
                      <DetailRow
                        label="Tax Preference"
                        value={
                          viewedItem.tax_preference
                            ?.replace("_", " ")
                            .charAt(0)
                            .toUpperCase() +
                          viewedItem.tax_preference?.replace("_", " ").slice(1)
                        }
                      />
                      <DetailRow
                        label="GST Treatment"
                        value={viewedItem.gst_treatment}
                      />
                      <DetailRow
                        label="Zoho Item ID"
                        value={viewedItem.zoho_item_id || "Not synced"}
                      />
                      <DetailRow
                        label="Created By"
                        value={getCreatedBy(viewedItem)}
                      />
                    </div>
                  </div>
                </Section>
              </div>

              {/* REMOVED STOCK INFORMATION SECTION SINCE WE'RE NOT USING IT NOW */}
              {/*
              {viewedItem.product_type === "goods" && (
                <div className="md:col-span-3">
                  <Section title="Stock Information" bgColor="yellow-50" titleColor="yellow-700">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <DetailRow
                          label="Opening Stock Quantity"
                          value={viewedItem.opening_stock_qty || "Not set"}
                        />
                      </div>
                      <div>
                        <DetailRow
                          label="Opening Stock Rate"
                          value={
                            viewedItem.opening_stock_rate
                              ? `₹${parseFloat(viewedItem.opening_stock_rate || 0).toFixed(2)}`
                              : "Not set"
                          }
                        />
                      </div>
                      <div>
                        <DetailRow
                          label="Opening Stock Date"
                          value={
                            viewedItem.opening_stock_date
                              ? new Date(viewedItem.opening_stock_date).toLocaleDateString()
                              : "Not set"
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <DetailRow
                        label="Current Stock"
                        value={`${viewedItem.current_stock || 0} units`}
                        strong={true}
                      />
                      {viewedItem.opening_stock_qty && viewedItem.opening_stock_rate && (
                        <DetailRow
                          label="Opening Stock Value"
                          value={`₹${(
                            Number(viewedItem.opening_stock_qty) * 
                            Number(viewedItem.opening_stock_rate)
                          ).toFixed(2)}`}
                        />
                      )}
                    </div>
                  </Section>
                </div>
              )}
              */}

              {viewedItem.is_sellable && (
                <div className="md:col-span-3">
                  <Section
                    title="Sales Details"
                    bgColor="green-50"
                    titleColor="green-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <DetailRow
                          label="Selling Price"
                          value={`₹${parseFloat(viewedItem.selling_price || 0).toFixed(2)}`}
                          strong={true}
                        />
                        <DetailRow
                          label="Service Charge"
                          value={
                            viewedItem.service_charge
                              ? `₹${parseFloat(viewedItem.service_charge || 0).toFixed(2)}`
                              : "Not set"
                          }
                        />
                      </div>
                      <div>
                        <DetailRow
                          label="Sales Account"
                          value={
                            ACCOUNT_DISPLAY_NAMES[viewedItem.sales_account] ||
                            viewedItem.sales_account
                          }
                        />
                        <DetailRow
                          label="Sales Description"
                          value={viewedItem.sales_description}
                        />
                      </div>
                    </div>
                  </Section>
                </div>
              )}

              {viewedItem.is_purchasable && (
                <div className="md:col-span-3">
                  <Section
                    title="Purchase Details"
                    bgColor="red-50"
                    titleColor="red-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <DetailRow
                          label="Cost Price"
                          value={`₹${parseFloat(viewedItem.cost_price || 0).toFixed(2)}`}
                          strong={true}
                        />
                        <DetailRow
                          label="Purchase Account"
                          value={
                            ACCOUNT_DISPLAY_NAMES[
                              viewedItem.purchase_account
                            ] || viewedItem.purchase_account
                          }
                        />
                      </div>
                      <div>
                        <DetailRow
                          label="Preferred Vendor"
                          value={
                            VENDORS.find(
                              (v) => v.id === viewedItem.preferred_vendor,
                            )?.name || viewedItem.preferred_vendor
                          }
                        />
                        <DetailRow
                          label="Purchase Description"
                          value={viewedItem.purchase_description}
                        />
                      </div>
                    </div>
                  </Section>
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex flex-col md:flex-row justify-between gap-4">
            <div>
              {viewedItem.created_at && (
                <p className="text-xs text-gray-500">
                  Created:{" "}
                  {new Date(viewedItem.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setOpenViewModal(false);
                  handleEdit(viewedItem);
                }}
                className="px-5 py-2 bg-yellow-500 text-white rounded-lg flex items-center gap-2 hover:bg-yellow-600 transition shadow whitespace-nowrap"
              >
                <Edit3 size={18} /> Edit Item
              </button>
              {!viewedItem.zoho_item_id && (
                <button
                  onClick={() => {
                    handleSyncToZoho(viewedItem.id);
                    setOpenViewModal(false);
                  }}
                  className="px-5 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 hover:bg-green-600 transition shadow whitespace-nowrap"
                >
                  <Upload size={18} /> Sync to Zoho
                </button>
              )}
              <button
                onClick={() => setOpenViewModal(false)}
                className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition shadow whitespace-nowrap"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFormPage = () => (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-200 transition w-fit"
            >
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back to Items</span>
            </button>

            <div className="flex-1 md:text-center">
              <h1 className="text-xl md:text-3xl font-bold text-blue-700 leading-tight">
                {isEdit ? "Edit Item" : "Create New Item"}
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">
                {isEdit
                  ? "Update item details"
                  : "Add a new item to your inventory"}
              </p>
            </div>

            <div className="hidden md:block w-[140px]" />
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg border overflow-hidden"
        >
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  type="button"
                  onClick={() => setActiveTab(tab.name)}
                  className={`px-6 py-4 text-sm font-medium flex items-center gap-2 transition whitespace-nowrap ${
                    activeTab === tab.name
                      ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <tab.icon size={18} /> {tab.name} Information
                </button>
              ))}
            </div>
          </div>

          <div className="p-8">
            {activeTab === "General" && renderGeneralTab()}
            {activeTab === "Sales" && renderSalesTab()}
            {activeTab === "Purchase" && renderPurchaseTab()}
            {/* REMOVED STOCK TAB RENDER SINCE WE'RE NOT USING IT NOW */}
            {/* {activeTab === "Stock" && renderStockTab()} */}
          </div>

          <div className="p-6 border-t bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Fields marked with <span className="text-red-500">*</span> are
                required
              </p>
              {Object.keys(errors).length > 0 && (
                <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle size={14} />
                  <span>Please fix the validation errors above</span>
                </div>
              )}
            </div>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || Object.keys(errors).length > 0}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw size={18} className="animate-spin" />
                    {isEdit ? "Updating..." : "Saving..."}
                  </span>
                ) : isEdit ? (
                  "Update Item"
                ) : (
                  "Save Item"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  const renderListPage = () => (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
                <Smartphone size={22} />
              </div>

              <div>
                <h1 className="text-xl md:text-3xl font-bold text-blue-700 leading-tight">
                  Items Management
                </h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                  Manage items and sync with Zoho Books
                </p>
              </div>
            </div>

            <div className="flex w-full md:w-auto">
              <button
                onClick={() => setCurrentPage("form")}
                className="w-full md:w-auto bg-blue-600 text-white px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow hover:bg-blue-700 transition font-medium"
              >
                <PlusCircle size={18} />
                Add New Item
              </button>
            </div>
          </div>
        </div>

        {apiError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <X size={20} />
            <span>{apiError}</span>
            <button
              onClick={() => setApiError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <FilterBar />

        <div className="hidden md:block">
          <ItemsTable />
        </div>

        <div className="md:hidden space-y-4">
          {loading && filteredItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <RefreshCw className="animate-spin mx-auto mb-3" />
              Loading items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No items found
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`bg-white rounded-xl shadow border p-4 space-y-4 ${
                  selectedItems.includes(item.id) ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    {item.item_image ? (
                      <img
                        src={item.item_image}
                        className="w-12 h-12 object-contain rounded border"
                        alt={item.name}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                        <Image size={20} />
                      </div>
                    )}

                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.category && (
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs">
                            {CATEGORIES.find((cat) => cat.id === item.category)
                              ?.name || item.category}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="h-4 w-4 text-blue-600"
                  />
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded-full font-medium ${
                      item.product_type === "goods"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.product_type}
                  </span>

                  <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    HSN/SAC: {item.hsn_or_sac || "N/A"}
                  </span>

                  {/* REMOVED STOCK DISPLAY FROM MOBILE VIEW SINCE WE'RE NOT USING IT NOW */}
                  {/*
                  {item.product_type === "goods" && (
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      item.current_stock > 0 ? "bg-green-100 text-green-700" : 
                      item.current_stock === 0 ? "bg-red-100 text-red-700" : 
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      Stock: {item.current_stock || 0}
                    </span>
                  )}
                  */}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Selling</p>
                    <p className="font-semibold">
                      {item.is_sellable
                        ? `₹${parseFloat(item.selling_price || 0).toFixed(2)}`
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Cost</p>
                    <p className="font-semibold">
                      {item.is_purchasable
                        ? `₹${parseFloat(item.cost_price || 0).toFixed(2)}`
                        : "-"}
                    </p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSyncToZoho(item.id);
                    }}
                    disabled={syncStatus[item.id] === "syncing"}
                    className={`w-full py-2 rounded-lg text-sm font-medium flex justify-center items-center gap-2 ${
                      item.zoho_item_id
                        ? "bg-green-100 text-green-800"
                        : syncStatus[item.id] === "syncing"
                          ? "bg-yellow-100 text-yellow-800"
                          : syncStatus[item.id] === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {syncStatus[item.id] === "syncing" ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : item.zoho_item_id ? (
                      <Check size={14} />
                    ) : (
                      <Upload size={14} />
                    )}
                    {item.zoho_item_id ? "Synced" : "Sync to Zoho"}
                  </button>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleView(item);
                    }}
                    className="flex-1 bg-gray-100 py-2 rounded-lg text-sm hover:bg-gray-200 transition flex items-center justify-center gap-1"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(item);
                    }}
                    className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-200 transition flex items-center justify-center gap-1"
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showDeleteConfirmation(item.id, item.name);
                    }}
                    className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg text-sm hover:bg-red-200 transition flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {openViewModal && <ViewItemModal />}
      </div>
    </div>
  );

  return <>{currentPage === "list" ? renderListPage() : renderFormPage()}</>;
}
