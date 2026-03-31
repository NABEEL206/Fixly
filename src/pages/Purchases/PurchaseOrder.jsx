// src/pages/Purchases/PurchaseOrder.jsx
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Edit,
  Eye,
  Search,
  Building,
  Package,
  Edit3,
  User,
  Filter,
  FileText,
  ChevronDown,
} from "lucide-react";
import axiosInstance from "@/API/axiosInstance";
import toast from "react-hot-toast";
import { PERMISSIONS } from "@/config/permissions";
import { canAccess } from "@/utils/canAccess";
import { useAuth } from "@/auth/AuthContext";
import ReactDOM from "react-dom";

// Portal component for rendering dropdown outside modal
const Portal = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return ReactDOM.createPortal(children, document.body);
};

// Searchable Select Component for Vendors
const SearchableVendorSelect = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((vendor) =>
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm]);

  const selectedOption = options.find((opt) => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} <span className="text-red-500">*</span>
      </label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 border rounded-lg bg-white text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        } ${disabled ? "bg-gray-50 cursor-not-allowed" : ""}`}
      >
        <span className="flex items-center gap-2">
          <Building size={16} className="text-gray-400" />
          <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="text"
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No vendors found
              </div>
            ) : (
              filteredOptions.map((vendor) => (
                <button
                  key={vendor.id}
                  type="button"
                  onClick={() => {
                    onChange(vendor.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Building size={14} className="text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {vendor.name}
                    </div>
                    {vendor.phone && (
                      <div className="text-xs text-gray-500">
                        {vendor.phone}
                      </div>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Searchable Item Select Component for table rows
const SearchableItemSelect = ({
  items,
  value,
  onChange,
  disabled = false,
  index,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter((item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [items, searchTerm]);

  const selectedItem = items.find((item) => item.id === value);

  const updatePosition = useCallback(() => {
    if (buttonRef.current && isOpen) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      window.addEventListener("scroll", updatePosition);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper function to format price safely
  const formatPrice = (price) => {
    if (price === null || price === undefined) return "0.00";
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full min-w-[200px] px-2 py-1.5 border rounded text-sm text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${
          disabled ? "bg-gray-50 cursor-not-allowed" : ""
        }`}
        style={{ minHeight: "34px" }}
      >
        <span
          className={
            selectedItem ? "text-gray-900 truncate" : "text-gray-400 truncate"
          }
          style={{ maxWidth: "calc(100% - 20px)" }}
        >
          {selectedItem
            ? `${selectedItem.name} - ₹${formatPrice(selectedItem.selling_price || selectedItem.cost_price)}`
            : "Select Item"}
        </span>
        <ChevronDown size={14} className="text-gray-400 flex-shrink-0 ml-1" />
      </button>

      {isOpen && !disabled && (
        <Portal>
          <div
            ref={dropdownRef}
            style={{
              position: "absolute",
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: "250px",
              maxHeight: "300px",
              zIndex: 99999,
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
              boxShadow:
                "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
            }}
          >
            <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
              <div className="relative">
                <Search
                  size={12}
                  className="absolute left-2 top-2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-7 pr-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
              {filteredItems.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No items found
                </div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onChange(item.id);
                      setIsOpen(false);
                      setSearchTerm("");
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </div>
                    {(item.selling_price || item.cost_price) && (
                      <div className="text-xs text-gray-500">
                        ₹{formatPrice(item.selling_price || item.cost_price)}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </Portal>
      )}
    </>
  );
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

// Utility function to ensure only numbers are entered and remove leading zeros
const processNumericInput = (value, allowDecimal = true, maxLength = null) => {
  if (!value && value !== 0) return "";

  let stringValue = String(value);

  if (allowDecimal) {
    const matches = stringValue.match(/^(\d*\.?\d*)/);
    stringValue = matches ? matches[1] : "";
  } else {
    stringValue = stringValue.replace(/[^\d]/g, "");
  }

  if (maxLength && stringValue.length > maxLength) {
    stringValue = stringValue.slice(0, maxLength);
  }

  return stringValue;
};

// Remove leading zeros from numeric strings
const removeLeadingZeros = (value) => {
  if (!value && value !== 0) return "";

  const stringValue = String(value);

  if (stringValue === "0") return "0";
  if (stringValue.startsWith("0.")) return stringValue;

  const trimmed = stringValue.replace(/^0+(?=\d)/, "");
  return trimmed || "0";
};

// Format number for display in input fields
const formatNumberForInput = (value) => {
  if (value === 0 || value === "0") return "0";
  if (!value && value !== 0) return "";
  return String(value);
};

const PurchaseOrder = () => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shops, setShops] = useState([]);
  const [growtags, setGrowtags] = useState([]);

  const [selectedPOs, setSelectedPOs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [poDetailsCache, setPoDetailsCache] = useState({});

  const [assignSearchTerm, setAssignSearchTerm] = useState("");
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const assignDropdownRef = useRef(null);

  const toastIdRef = useRef(null);

  const initialFormState = {
    id: null,
    poNumber: "",
    vendorId: "",
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    vendorAddress: "",
    poDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: new Date(new Date().setDate(new Date().getDate() + 7))
      .toISOString()
      .split("T")[0],
    shipTo: "",
    billTo: "",
    status: "DRAFT",
    items: [],
    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    shippingCharges: 0,
    adjustment: 0,
    grandTotal: 0,
    terms: "",
    notes: "",
    created_by: null,
    assign_type: "shop",
    assign_id: null,
    assign_name: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const { user } = useAuth();
  const role = user?.role;

  const canView = canAccess(role, PERMISSIONS.purchaseOrders.view);
  const canCreate = canAccess(role, PERMISSIONS.purchaseOrders.create);
  const canEdit = canAccess(role, PERMISSIONS.purchaseOrders.edit);
  const canDelete = canAccess(role, PERMISSIONS.purchaseOrders.delete);

  const getFilteredAssignItems = () => {
    if (formData.assign_type === "shop") {
      return shops.filter((shop) =>
        shop.shopname?.toLowerCase().includes(assignSearchTerm.toLowerCase()),
      );
    } else {
      return growtags.filter((growtag) =>
        growtag.name?.toLowerCase().includes(assignSearchTerm.toLowerCase()),
      );
    }
  };

  const getShopIcon = (shopType) => {
    const type = shopType?.toLowerCase();
    if (type === "franchise") return "🏬";
    if (type === "other_shop") return "🛍️";
    return "🏪";
  };

  const getShopTypeLabel = (shopType) => {
    const type = shopType?.toLowerCase();
    if (type === "franchise") return "Franchise Shop";
    if (type === "other_shop") return "Other Shop";
    return "Other Shop";
  };

  const getAssignTypeIcon = () => {
    if (formData.assign_type === "shop") return "🏪";
    return "🏷️";
  };

  const getAssignTypeLabel = () => {
    if (formData.assign_type === "shop") return "Shop";
    return "GrowTag ";
  };

  const getSelectedDisplayText = () => {
    if (!formData.assign_id) return "";
    if (formData.assign_type === "shop") {
      const shop = shops.find((s) => s.id === formData.assign_id);
      if (shop) {
        const icon = getShopIcon(shop.shop_type);
        const typeLabel = getShopTypeLabel(shop.shop_type);
        return `${icon} ${shop.shopname} (${typeLabel})`;
      }
    } else {
      const growtag = growtags.find((g) => g.id === formData.assign_id);
      if (growtag) {
        return `🏷️ ${growtag.name}`;
      }
    }
    return "";
  };

  useEffect(() => {
    if (!role) return;

    setFormData((prev) => ({
      ...prev,
      assign_type: role === "GROWTAG" ? "growtag" : "shop",
      assign_id: null,
      assign_name: "",
    }));
  }, [role]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        assignDropdownRef.current &&
        !assignDropdownRef.current.contains(event.target)
      ) {
        setShowAssignDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!canView) {
    return (
      <div className="p-10 text-center text-red-500 font-semibold">
        You do not have permission to access Purchase Orders
      </div>
    );
  }

  const uniqueCreatedBy = React.useMemo(() => {
    const set = new Set();
    purchaseOrders.forEach((po) => {
      if (po.created_by) set.add(po.created_by);
    });
    return Array.from(set).sort();
  }, [purchaseOrders]);

  const uniqueStatuses = React.useMemo(() => {
    const set = new Set();
    purchaseOrders.forEach((po) => {
      if (po.status) set.add(po.status);
    });
    return Array.from(set).sort();
  }, [purchaseOrders]);

  useEffect(() => {
    fetchVendors();
    fetchItems();
    fetchPurchaseOrders();
    fetchShops();
    fetchGrowtags();
  }, []);

  useEffect(() => {
    setSelectedPOs([]);
    setSelectAll(false);
  }, [searchTerm, filterStatus, filterCreatedBy, purchaseOrders.length]);

  const fetchVendors = async () => {
    try {
      const response = await axiosInstance.get("/api/vendors/");
      const data = response.data;
      let vendorsList = [];

      if (Array.isArray(data)) {
        vendorsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        vendorsList = data.data;
      } else if (data?.results) {
        vendorsList = data.results;
      }

      setVendors(vendorsList);
    } catch (error) {
      console.error("Fetch vendors error:", error);
      if (!error.response) return;
      toast.error("Failed to load vendors");
    }
  };

  const fetchItems = async () => {
    try {
      const response = await axiosInstance.get("/zoho/local-items/");
      const data = response.data;
      let itemsList = [];

      if (Array.isArray(data)) {
        itemsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        itemsList = data.data;
      } else if (data?.results) {
        itemsList = data.results;
      }

      setItems(itemsList);
    } catch (error) {
      console.error("Fetch items error:", error);
      if (!error.response) return;
      toast.error("Failed to load items");
    }
  };

  const fetchShops = async () => {
    try {
      const res = await axiosInstance.get("/api/shops/");
      const data = res.data;
      setShops(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error("Fetch shops error:", err);
    }
  };

  const fetchGrowtags = async () => {
    try {
      const res = await axiosInstance.get("/api/growtags/");
      const data = res.data;
      setGrowtags(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      console.error("Fetch growtags error:", err);
    }
  };

  const fetchPurchaseOrderDetails = async (id) => {
    try {
      if (poDetailsCache[id]) {
        return poDetailsCache[id];
      }

      const response = await axiosInstance.get(`/api/purchase-orders/${id}/`);
      const data = response.data;
      const order = data.data || data;

      let itemsArray = [];
      if (order?.items && Array.isArray(order.items)) {
        itemsArray = order.items.map((item) => ({
          id: item?.id || null,
          itemId: item?.item_id ? Number(item.item_id) : Number(item?.id) || "",
          itemName: item?.item_name || "",
          description: item?.description || "",
          quantity: parseFloat(item?.qty) || 0,
          unitPrice: parseFloat(item?.unit_price) || 0,
          tax: parseFloat(item?.tax_percent) || 0,
          discount: parseFloat(item?.discount_percent) || 0,
          amount: parseFloat(item?.line_total) || 0,
        }));
      }

      const vendorDetails = order?.vendor_details || {};

      let assign_type = "shop";
      let assign_id = null;
      let assign_name = "";

      if (order?.assigned_shop) {
        assign_type = "shop";
        assign_id = order.assigned_shop;
        const shop = shops.find((s) => s.id === order.assigned_shop);
        assign_name = shop?.shopname || "";
      } else if (order?.assigned_growtag) {
        assign_type = "growtag";
        assign_id = order.assigned_growtag;
        const growtag = growtags.find((g) => g.id === order.assigned_growtag);
        assign_name = growtag?.name || "";
      }

      const detailedOrder = {
        id: order?.id || null,
        poNumber: order?.po_number || "",
        vendorId: order?.vendor || "",
        vendorName: vendorDetails?.name || "",
        vendorEmail: vendorDetails?.email || "",
        vendorPhone: vendorDetails?.phone || "",
        vendorAddress: vendorDetails?.address || "",
        poDate: order?.po_date || "",
        expectedDeliveryDate: order?.expected_delivery_date || "",
        shipTo: order?.ship_to || "",
        billTo: order?.bill_to || "",
        status: order?.status || "DRAFT",
        items: itemsArray,
        subtotal: parseFloat(order?.subtotal) || 0,
        totalDiscount: parseFloat(order?.total_discount) || 0,
        totalTax: parseFloat(order?.total_tax) || 0,
        shippingCharges: parseFloat(order?.shipping_charges || 0) || 0,
        adjustment: parseFloat(order?.adjustment || 0) || 0,
        grandTotal: parseFloat(order?.grand_total) || 0,
        terms: order?.terms_and_conditions || "",
        notes: order?.notes || "",
        created_by: order?.created_by || null,
        assign_type: assign_type,
        assign_id: assign_id,
        assign_name: assign_name,
      };

      setPoDetailsCache((prev) => ({
        ...prev,
        [id]: detailedOrder,
      }));

      return detailedOrder;
    } catch (error) {
      console.error(`Fetch PO details error for ID ${id}:`, error);
      return null;
    }
  };

  const fetchPurchaseOrders = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/api/purchase-orders/");
      const data = response.data;
      let ordersList = [];

      if (Array.isArray(data)) {
        ordersList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        ordersList = data.data;
      } else if (data?.results) {
        ordersList = data.results;
      }

      const transformedOrders = ordersList.map((order) => {
        const cachedDetail = poDetailsCache[order?.id];

        if (cachedDetail) {
          return cachedDetail;
        }

        return {
          id: order?.id || null,
          poNumber: order?.po_number || "",
          vendorName:
            order?.vendor_name ||
            order?.vendor?.name ||
            order?.vendor_details?.name ||
            "",
          vendorId: order?.vendor || order?.vendor_id || "",
          poDate: order?.po_date || "",
          expectedDeliveryDate: order?.expected_delivery_date || "",
          status: order?.status || "DRAFT",
          grandTotal: parseFloat(order?.grand_total) || 0,
          created_by: order?.created_by || null,
          vendorEmail: "",
          vendorPhone: "",
          vendorAddress: "",
          items: [],
          subtotal: 0,
          totalDiscount: 0,
          totalTax: 0,
          shippingCharges: 0,
          adjustment: 0,
          terms: "",
          notes: "",
          shipTo: "",
          billTo: "",
        };
      });

      setPurchaseOrders(transformedOrders);
    } catch (error) {
      console.error("Fetch purchase orders error:", error);
      if (!error.response) return;
      if (error.response?.status === 401 || error.response?.status === 403) {
        return;
      }
      toast.error("Failed to load purchase orders");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetailedData = async (id) => {
    const detailedData = await fetchPurchaseOrderDetails(id);
    if (detailedData) {
      setPurchaseOrders((prev) =>
        prev.map((po) => (po.id === id ? { ...po, ...detailedData } : po)),
      );
      return detailedData;
    }
    return null;
  };

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find((v) => v.id === parseInt(vendorId));
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        vendorPhone: vendor.phone,
        vendorAddress: vendor.address,
      }));
      if (errors.vendorName) {
        setErrors((prev) => ({ ...prev, vendorName: "" }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        vendorId: "",
        vendorName: "",
        vendorEmail: "",
        vendorPhone: "",
        vendorAddress: "",
      }));
    }
  };

  const handleItemSelection = (index, itemId) => {
    const selectedItem = items.find((i) => i.id === parseInt(itemId));

    if (selectedItem) {
      const newItems = [...formData.items];

      const price = parseFloat(
        selectedItem.selling_price || selectedItem.cost_price || 0,
      );

      newItems[index] = {
        ...newItems[index],
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        description:
          selectedItem.purchase_description || selectedItem.description || "",
        unitPrice: price,
        amount: 0,
      };

      newItems[index].amount = calculateItemAmount(newItems[index]);

      const totals = calculateTotals(
        newItems,
        formData.shippingCharges,
        formData.adjustment,
      );

      setFormData((prev) => ({
        ...prev,
        items: newItems,
        ...totals,
      }));

      if (errors[`item_${index}_itemName`]) {
        setErrors((prev) => ({ ...prev, [`item_${index}_itemName`]: "" }));
      }
    }
  };

  const handleDescriptionChange = (index, value) => {
    handleItemChange(index, "description", value);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = "Vendor selection is required";
    }

    if (!formData.assign_id) {
      newErrors.assign_id = "Please select Assign To";
    }

    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = "Expected Delivery Date is required";
    } else if (
      new Date(formData.expectedDeliveryDate) <= new Date(formData.poDate)
    ) {
      newErrors.expectedDeliveryDate = "Delivery date must be after PO date";
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
    } else {
      formData.items.forEach((item, index) => {
        if (!item.itemName.trim()) {
          newErrors[`item_${index}_itemName`] = "Item selection is required";
        }
        if (item.quantity <= 0) {
          newErrors[`item_${index}_quantity`] =
            "Quantity must be greater than 0";
        }
        if (item.unitPrice <= 0) {
          newErrors[`item_${index}_unitPrice`] =
            "Unit price must be greater than 0";
        }
        if (item.tax < 0 || item.tax > 100) {
          newErrors[`item_${index}_tax`] = "Tax must be between 0 and 100";
        }
        if (item.discount < 0 || item.discount > 100) {
          newErrors[`item_${index}_discount`] =
            "Discount must be between 0 and 100";
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateItemAmount = (item) => {
    const baseAmount = item.quantity * item.unitPrice;
    const discountAmount = (baseAmount * item.discount) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;
    const taxAmount = (amountAfterDiscount * item.tax) / 100;
    return amountAfterDiscount + taxAmount;
  };

  const calculateTotals = (items, shippingCharges, adjustment) => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach((item) => {
      const baseAmount = item.quantity * item.unitPrice;
      subtotal += baseAmount;
      totalDiscount += (baseAmount * item.discount) / 100;
      const amountAfterDiscount =
        baseAmount - (baseAmount * item.discount) / 100;
      totalTax += (amountAfterDiscount * item.tax) / 100;
    });

    const grandTotal =
      subtotal -
      totalDiscount +
      totalTax +
      parseFloat(shippingCharges || 0) +
      parseFloat(adjustment || 0);

    return { subtotal, totalTax, totalDiscount, grandTotal };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (["shippingCharges", "adjustment"].includes(name)) {
      processedValue = processNumericInput(value, true, 10);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    if (["quantity", "unitPrice", "tax", "discount"].includes(field)) {
      const allowDecimal = field !== "quantity";
      const maxLength = field === "quantity" ? 6 : 10;

      let processedValue = processNumericInput(value, allowDecimal, maxLength);

      if (field === "quantity") {
        processedValue = removeLeadingZeros(processedValue);
      }

      newItems[index][field] = processedValue;

      const numericValue = parseFloat(processedValue) || 0;
      newItems[index][field + "Numeric"] = numericValue;
    } else {
      newItems[index][field] = value;
    }

    const itemForCalculation = {
      ...newItems[index],
      quantity: parseFloat(newItems[index].quantity) || 0,
      unitPrice: parseFloat(newItems[index].unitPrice) || 0,
      tax: parseFloat(newItems[index].tax) || 0,
      discount: parseFloat(newItems[index].discount) || 0,
    };

    newItems[index].amount = calculateItemAmount(itemForCalculation);

    const totals = calculateTotals(
      newItems,
      formData.shippingCharges,
      formData.adjustment,
    );

    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
    }));

    if (errors[`item_${index}_${field}`]) {
      setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: "" }));
    }
  };

  const handleNumericBlur = (index, field, value) => {
    const newItems = [...formData.items];
    const numericValue = parseFloat(value) || 0;

    let formattedValue = numericValue.toString();

    if (field === "quantity") {
      formattedValue = Math.floor(numericValue).toString();
    }

    newItems[index][field] = formattedValue;

    const itemForCalculation = {
      ...newItems[index],
      quantity: parseFloat(newItems[index].quantity) || 0,
      unitPrice: parseFloat(newItems[index].unitPrice) || 0,
      tax: parseFloat(newItems[index].tax) || 0,
      discount: parseFloat(newItems[index].discount) || 0,
    };

    newItems[index].amount = calculateItemAmount(itemForCalculation);

    const totals = calculateTotals(
      newItems,
      formData.shippingCharges,
      formData.adjustment,
    );

    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          itemId: "",
          itemName: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          tax: 0,
          discount: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }

    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(
      newItems,
      formData.shippingCharges,
      formData.adjustment,
    );

    setFormData((prev) => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  };

  const handleChargesChange = (field, value) => {
    let processedValue = processNumericInput(value, true, 10);

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));

    const numericValue = parseFloat(processedValue) || 0;
    const newData = { ...formData, [field]: numericValue };
    const totals = calculateTotals(
      newData.items,
      newData.shippingCharges,
      newData.adjustment,
    );

    setFormData((prev) => ({
      ...prev,
      ...totals,
    }));
  };

  const transformToAPIFormat = (data) => {
    const apiData = {
      po_number: data.poNumber,
      vendor: data.vendorId,
      po_date: data.poDate,
      expected_delivery_date: data.expectedDeliveryDate || null,
      ship_to: data.shipTo || null,
      bill_to: data.billTo || null,
      status: data.status,
      items: data.items.map((item) => ({
        item_name: item.itemName,
        description: item.description || "",
        qty: parseFloat(item.quantity) || 0,
        unit_price: parseFloat(item.unitPrice) || 0,
        tax_percent: parseFloat(item.tax) || 0,
        discount_percent: parseFloat(item.discount) || 0,
      })),
      shipping_charges: parseFloat(data.shippingCharges) || 0,
      adjustment: parseFloat(data.adjustment) || 0,
      terms_and_conditions: data.terms || null,
      notes: data.notes || null,
    };

    if (data.assign_type === "shop" && data.assign_id) {
      apiData.assigned_shop = data.assign_id;
    }

    if (data.assign_type === "growtag" && data.assign_id) {
      apiData.assigned_growtag = data.assign_id;
    }

    return apiData;
  };

  const createPO = async () => {
    if (!canCreate) {
      toast.error("You don't have permission to create purchase order");
      return;
    }
    if (!validateForm()) {
      toast.error("Please fix all errors before submitting");
      return;
    }

    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating purchase order...");
    toastIdRef.current = toastId;

    try {
      const apiData = transformToAPIFormat(formData);

      if (formData.assign_type === "shop" && formData.assign_id) {
        apiData.assigned_shop = formData.assign_id;
      }
      if (formData.assign_type === "growtag" && formData.assign_id) {
        apiData.assigned_growtag = formData.assign_id;
      }

      const response = await axiosInstance.post(
        "/api/purchase-orders/",
        apiData,
      );

      const responseData = response.data;
      const newOrder = responseData.data || responseData;

      let itemsArray = [];
      if (newOrder?.items && Array.isArray(newOrder.items)) {
        itemsArray = newOrder.items.map((item) => ({
          id: item?.id || null,
          itemId: item?.item_id || item?.id || "",
          itemName: item?.item_name || "",
          description: item?.description || "",
          quantity: parseFloat(item?.qty) || 0,
          unitPrice: parseFloat(item?.unit_price) || 0,
          tax: parseFloat(item?.tax_percent) || 0,
          discount: parseFloat(item?.discount_percent) || 0,
          amount: parseFloat(item?.line_total) || 0,
        }));
      }

      const vendorDetails = newOrder?.vendor_details || {};

      const transformedOrder = {
        id: newOrder?.id || null,
        poNumber: newOrder?.po_number || "",
        vendorId: newOrder?.vendor || "",
        vendorName: vendorDetails?.name || formData.vendorName,
        vendorEmail: vendorDetails?.email || formData.vendorEmail,
        vendorPhone: vendorDetails?.phone || formData.vendorPhone,
        vendorAddress: vendorDetails?.address || formData.vendorAddress,
        poDate: newOrder?.po_date || "",
        expectedDeliveryDate: newOrder?.expected_delivery_date || "",
        shipTo: newOrder?.ship_to || "",
        billTo: newOrder?.bill_to || "",
        status: newOrder?.status || "DRAFT",
        items: itemsArray,
        subtotal: parseFloat(newOrder?.subtotal) || 0,
        totalDiscount: parseFloat(newOrder?.total_discount) || 0,
        totalTax: parseFloat(newOrder?.total_tax) || 0,
        shippingCharges: parseFloat(newOrder?.shipping_charges || 0) || 0,
        adjustment: parseFloat(newOrder?.adjustment || 0) || 0,
        grandTotal: parseFloat(newOrder?.grand_total) || 0,
        terms: newOrder?.terms_and_conditions || "",
        notes: newOrder?.notes || "",
        created_by: newOrder?.created_by || null,
      };

      setPoDetailsCache((prev) => ({
        ...prev,
        [transformedOrder.id]: transformedOrder,
      }));

      setPurchaseOrders((prev) => [transformedOrder, ...prev]);

      toast.success(
        responseData.message || "Purchase Order created successfully!",
        { id: toastId },
      );

      resetForm();
    } catch (error) {
      console.error("Create PO error:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.dismiss(toastId);
        toastIdRef.current = null;
        setIsSubmitting(false);
        return;
      }

      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = [];

        Object.keys(apiErrors).forEach((key) => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(", ")}`);
          } else if (typeof apiErrors[key] === "string") {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join("\n") || "Validation failed", {
          id: toastId,
        });
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create purchase order",
          { id: toastId },
        );
      }

      toastIdRef.current = null;
      setIsSubmitting(false);
    }
  };

  const updatePO = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit purchase order");
      return;
    }
    if (!validateForm()) {
      toast.error("Please fix all errors before updating");
      return;
    }

    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating purchase order...");
    toastIdRef.current = toastId;

    try {
      const apiData = transformToAPIFormat(formData);

      if (formData.assign_type === "shop" && formData.assign_id) {
        apiData.assigned_shop = formData.assign_id;
      }
      if (formData.assign_type === "growtag" && formData.assign_id) {
        apiData.assigned_growtag = formData.assign_id;
      }

      const response = await axiosInstance.put(
        `/api/purchase-orders/${formData.id}/`,
        apiData,
      );

      const responseData = response.data;
      const updatedOrder = responseData.data || responseData;

      let itemsArray = [];
      if (updatedOrder?.items && Array.isArray(updatedOrder.items)) {
        itemsArray = updatedOrder.items.map((item) => ({
          id: item?.id || null,
          itemId: item?.item_id || item?.id || "",
          itemName: item?.item_name || "",
          description: item?.description || "",
          quantity: parseFloat(item?.qty) || 0,
          unitPrice: parseFloat(item?.unit_price) || 0,
          tax: parseFloat(item?.tax_percent) || 0,
          discount: parseFloat(item?.discount_percent) || 0,
          amount: parseFloat(item?.line_total) || 0,
        }));
      }

      const vendorDetails = updatedOrder?.vendor_details || {};

      const transformedOrder = {
        id: updatedOrder?.id || null,
        poNumber: updatedOrder?.po_number || "",
        vendorId: updatedOrder?.vendor || "",
        vendorName: vendorDetails?.name || formData.vendorName,
        vendorEmail: vendorDetails?.email || formData.vendorEmail,
        vendorPhone: vendorDetails?.phone || formData.vendorPhone,
        vendorAddress: vendorDetails?.address || formData.vendorAddress,
        poDate: updatedOrder?.po_date || "",
        expectedDeliveryDate: updatedOrder?.expected_delivery_date || "",
        shipTo: updatedOrder?.ship_to || "",
        billTo: updatedOrder?.bill_to || "",
        status: updatedOrder?.status || "DRAFT",
        items: itemsArray,
        subtotal: parseFloat(updatedOrder?.subtotal) || 0,
        totalDiscount: parseFloat(updatedOrder?.total_discount) || 0,
        totalTax: parseFloat(updatedOrder?.total_tax) || 0,
        shippingCharges: parseFloat(updatedOrder?.shipping_charges || 0) || 0,
        adjustment: parseFloat(updatedOrder?.adjustment || 0) || 0,
        grandTotal: parseFloat(updatedOrder?.grand_total) || 0,
        terms: updatedOrder?.terms_and_conditions || "",
        notes: updatedOrder?.notes || "",
        created_by: updatedOrder?.created_by || null,
      };

      setPoDetailsCache((prev) => ({
        ...prev,
        [transformedOrder.id]: transformedOrder,
      }));

      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.id === transformedOrder.id ? transformedOrder : po,
        ),
      );

      toast.success(
        responseData.message || "Purchase Order updated successfully!",
        { id: toastId },
      );

      resetForm();
    } catch (error) {
      console.error("Update PO error:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.dismiss(toastId);
        toastIdRef.current = null;
        setIsSubmitting(false);
        return;
      }

      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = [];

        Object.keys(apiErrors).forEach((key) => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(", ")}`);
          } else if (typeof apiErrors[key] === "string") {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join("\n") || "Validation failed", {
          id: toastId,
        });
      } else {
        toast.error(
          error.response?.data?.message || "Failed to update purchase order",
          { id: toastId },
        );
      }

      toastIdRef.current = null;
      setIsSubmitting(false);
    }
  };

  const deletePO = (id) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete purchase order");
      return;
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    const deleteToastId = toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete Purchase Order?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                toastIdRef.current = null;
              }}
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading("Deleting purchase order...");
                toastIdRef.current = dt;

                try {
                  await axiosInstance.delete(`/api/purchase-orders/${id}/`);
                  setPoDetailsCache((prev) => {
                    const newCache = { ...prev };
                    delete newCache[id];
                    return newCache;
                  });

                  await fetchPurchaseOrders();
                  setPurchaseOrders((prev) =>
                    prev.filter((po) => po.id !== id),
                  );
                  toast.success("Purchase Order deleted successfully", {
                    id: dt,
                  });
                  toastIdRef.current = null;
                } catch (error) {
                  console.error("Delete PO error:", error);

                  if (
                    error.response?.status === 401 ||
                    error.response?.status === 403
                  ) {
                    toast.dismiss(dt);
                    toastIdRef.current = null;
                    return;
                  }

                  toast.error(
                    error.response?.data?.message ||
                      "Failed to delete purchase order",
                    { id: dt },
                  );
                  toastIdRef.current = null;
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );

    toastIdRef.current = deleteToastId;
  };

  const handleBulkDelete = () => {
    if (selectedPOs.length === 0) {
      toast.error("No purchase orders selected");
      return;
    }

    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    const deleteToastId = toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete {selectedPOs.length} Purchase{" "}
            {selectedPOs.length === 1 ? "Order" : "Orders"}?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                toastIdRef.current = null;
              }}
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const dt = toast.loading(
                  `Deleting ${selectedPOs.length} purchase orders...`,
                );
                toastIdRef.current = dt;

                let successCount = 0;
                let failCount = 0;
                const failedIds = [];

                try {
                  for (const id of selectedPOs) {
                    try {
                      await axiosInstance.delete(`/api/purchase-orders/${id}/`);
                      setPoDetailsCache((prev) => {
                        const newCache = { ...prev };
                        delete newCache[id];
                        return newCache;
                      });
                      successCount++;
                    } catch (error) {
                      console.error(`Error deleting PO ${id}:`, error);
                      failCount++;
                      failedIds.push(id);
                    }
                  }

                  await fetchPurchaseOrders();
                  setSelectedPOs([]);
                  setSelectAll(false);

                  if (failCount === 0) {
                    toast.success(
                      `${successCount} purchase order${successCount === 1 ? "" : "s"} deleted successfully`,
                      { id: dt },
                    );
                  } else {
                    toast.success(
                      `${successCount} deleted, ${failCount} failed`,
                      { id: dt },
                    );
                    if (failedIds.length > 0) {
                      console.log("Failed to delete IDs:", failedIds);
                    }
                  }

                  toastIdRef.current = null;
                } catch (error) {
                  console.error("Bulk delete error:", error);
                  toast.error("Failed to delete selected purchase orders", {
                    id: dt,
                  });
                  toastIdRef.current = null;
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >
              Delete All
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );

    toastIdRef.current = deleteToastId;
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedPOs(filteredPOs.map((po) => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  const handleSelectPO = (id) => {
    setSelectedPOs((prev) => {
      if (prev.includes(id)) {
        return prev.filter((poId) => poId !== id);
      } else {
        return [...prev, id];
      }
    });
    setSelectAll(false);
  };

  const editPO = async (po) => {
    try {
      if (!items.length) {
        await fetchItems();
      }

      let detailedPO = po;

      if (!po.items || po.items.length === 0 || !po.vendorEmail) {
        detailedPO = await loadDetailedData(po.id);
      }

      if (detailedPO) {
        const transformedItems = detailedPO.items.map((item) => ({
          ...item,
          itemId: Number(item.itemId || item.id),
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          tax: item.tax.toString(),
          discount: item.discount.toString(),
          amount: item.amount,
        }));

        setFormData({
          id: detailedPO.id,
          poNumber: detailedPO.poNumber,
          vendorId: detailedPO.vendorId,
          vendorName: detailedPO.vendorName,
          vendorEmail: detailedPO.vendorEmail,
          vendorPhone: detailedPO.vendorPhone,
          vendorAddress: detailedPO.vendorAddress,
          poDate: detailedPO.poDate,
          expectedDeliveryDate: detailedPO.expectedDeliveryDate,
          shipTo: detailedPO.shipTo || "",
          billTo: detailedPO.billTo || "",
          status: detailedPO.status,
          items: transformedItems,
          subtotal: detailedPO.subtotal,
          totalDiscount: detailedPO.totalDiscount,
          totalTax: detailedPO.totalTax,
          shippingCharges: detailedPO.shippingCharges?.toString() || "0",
          adjustment: detailedPO.adjustment?.toString() || "0",
          grandTotal: detailedPO.grandTotal,
          terms: detailedPO.terms || "",
          notes: detailedPO.notes || "",
          created_by: detailedPO.created_by,
          assign_type: detailedPO.assign_type || "shop",
          assign_id: detailedPO.assign_id || null,
          assign_name: detailedPO.assign_name || "",
        });

        setEditMode(true);
        setViewMode(false);
        setShowForm(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const viewPO = async (po) => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    try {
      let detailedPO = po;

      if (!po.items || po.items.length === 0) {
        detailedPO = await loadDetailedData(po.id);
      }

      if (detailedPO) {
        setFormData(detailedPO);
        setViewMode(true);
        setEditMode(false);
        setShowForm(true);
      } else {
        toast.error("Failed to load purchase order details");
      }
    } catch (error) {
      console.error("Error loading PO details:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        return;
      }

      toast.error("Failed to load purchase order details");
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
    setEditMode(false);
    setViewMode(false);
    setErrors({});
    setIsSubmitting(false);
    setAssignSearchTerm("");
    setShowAssignDropdown(false);
  };

  const newPO = async () => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    const loadingToast = toast.loading("Loading data...");

    try {
      if (!items.length) {
        await fetchItems();
      }

      if (!vendors.length) {
        await fetchVendors();
      }

      if (role === "ADMIN" || role === "GROWTAG") {
        if (!growtags.length) {
          await fetchGrowtags();
        }
      }

      if (role === "ADMIN" || role === "FRANCHISE" || role === "OTHERSHOP") {
        if (!shops.length) {
          await fetchShops();
        }
      }

      const poDate = new Date().toISOString().split("T")[0];
      const deliveryDate = new Date(
        new Date().setDate(new Date().getDate() + 7),
      )
        .toISOString()
        .split("T")[0];

      setFormData({
        ...initialFormState,
        poNumber: "",
        poDate: poDate,
        expectedDeliveryDate: deliveryDate,
        assign_type: role === "GROWTAG" ? "growtag" : "shop",
        items: [
          {
            itemId: "",
            itemName: "",
            description: "",
            quantity: "1",
            unitPrice: "0",
            tax: "0",
            discount: "0",
            amount: 0,
          },
        ],
      });

      setShowForm(true);
      setEditMode(false);
      setViewMode(false);

      toast.dismiss(loadingToast);
    } catch (error) {
      console.error("Error loading data for new PO:", error);
      toast.error("Failed to load required data. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterCreatedBy("");
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    const matchesSearch =
      (po.poNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (po.vendorName?.toLowerCase() || "").includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || po.status === filterStatus;
    const matchesCreatedBy =
      !filterCreatedBy || po.created_by === filterCreatedBy;

    return matchesSearch && matchesStatus && matchesCreatedBy;
  });

  const handleDownloadPOPdf = async (id) => {
    const loadingToast = toast.loading("Generating PDF...");

    try {
      const response = await axiosInstance.get(`/purchase-orders/${id}/pdf/`, {
        responseType: "blob",
      });

      const pdfBlob = new Blob([response.data], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);

      window.open(pdfUrl, "_blank");

      toast.success("PDF opened", { id: loadingToast });
    } catch (error) {
      console.error("PO PDF error:", error);

      if (!error.response) return;

      toast.error("Failed to open PDF", { id: loadingToast });
    }
  };

  const ViewModal = () => (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl my-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Package className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Purchase Order Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.poNumber}
                </p>
              </div>
            </div>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* PO Info & Status */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                {formData.poNumber}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>PO Date: {formData.poDate}</span>
                <span>•</span>
                <span>Delivery: {formData.expectedDeliveryDate}</span>
              </div>
              {formData.created_by && (
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                  <User size={12} className="text-gray-400" />
                  <span>Created by: {formData.created_by}</span>
                </div>
              )}
            </div>
            <span
              className={`px-3 py-1 text-sm rounded-full font-medium ${
                formData.status === "DRAFT"
                  ? "bg-gray-200 text-gray-800"
                  : formData.status === "SENT"
                    ? "bg-blue-200 text-blue-800"
                    : formData.status === "RECEIVED"
                      ? "bg-green-200 text-green-800"
                      : formData.status === "CANCELLED"
                        ? "bg-red-200 text-red-800"
                        : "bg-yellow-200 text-yellow-800"
              }`}
            >
              {formData.status}
            </span>
          </div>

          {/* Assign To Information */}
          {(formData.assign_name || formData.assign_id) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
                <Building size={16} className="mr-2" />
                Assigned To
              </h5>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      {formData.assign_type === "shop" ? "Shop" : "GrowTag"}
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {getSelectedDisplayText() ||
                        formData.assign_name ||
                        "Not Assigned"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vendor Information */}
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
              <Building size={16} className="mr-2" />
              Vendor Information
            </h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Vendor Name
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {formData.vendorName || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Email
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.vendorEmail || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.vendorPhone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Address
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.vendorAddress || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Billing */}
          {(formData.shipTo || formData.billTo) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Shipping & Billing
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.shipTo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Ship To
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {formData.shipTo}
                    </p>
                  </div>
                )}
                {formData.billTo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Bill To
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {formData.billTo}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Items */}
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Items
            </h5>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Tax %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Discount %
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items && formData.items.length > 0 ? (
                    formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {item.itemName || "N/A"}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">
                            {item.description || "-"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          ₹{parseFloat(item.unitPrice).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.tax}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {item.discount}%
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          ₹{item.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-4 py-3 text-center text-gray-500"
                      >
                        No items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-full md:w-1/2 bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ₹{formData.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Discount:</span>
                  <span className="font-medium text-red-600">
                    -₹{formData.totalDiscount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-medium">
                    ₹{formData.totalTax.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">
                    ₹{parseFloat(formData.shippingCharges).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Adjustment:</span>
                  <span className="font-medium">
                    ₹{parseFloat(formData.adjustment).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                  <span className="text-base font-bold text-gray-800">
                    Grand Total:
                  </span>
                  <span className="text-base font-bold text-blue-600">
                    ₹{formData.grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          {(formData.terms || formData.notes) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Additional Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.terms && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Terms & Conditions
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {formData.terms}
                    </p>
                  </div>
                )}
                {formData.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Notes
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {formData.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            {canEdit && (
              <button
                onClick={() => {
                  setViewMode(false);
                  setEditMode(true);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
              >
                <Edit size={16} className="mr-2" />
                Edit Purchase Order
              </button>
            )}
            <button
              onClick={resetForm}
              className="px-5 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 px-4 sm:px-6 lg:px-8">
        {/* Desktop Layout */}
        <div className="hidden sm:flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
          <div className="flex gap-3">
            {selectedPOs.length > 0 && canDelete && (
              <button
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <Trash2 size={20} />
                Delete Selected ({selectedPOs.length})
              </button>
            )}

            {!showForm && canCreate && (
              <button
                onClick={newPO}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                <Plus size={20} />
                New Purchase Order
              </button>
            )}
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800">
              Purchase Orders
            </h1>

            <div className="flex flex-col gap-3">
              {selectedPOs.length > 0 && canDelete && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50 w-full"
                >
                  <Trash2 size={20} />
                  Delete Selected ({selectedPOs.length})
                </button>
              )}

              {!showForm && canCreate && (
                <button
                  onClick={newPO}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 w-full"
                >
                  <Plus size={20} />
                  New Purchase Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PO List */}
      {!showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by PO Number or Vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filter */}
              {uniqueStatuses.length > 0 && (
                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                  >
                    <option value="">All Status</option>
                    {uniqueStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Created By Filter */}
              {uniqueCreatedBy.length > 0 && (
                <div className="flex items-center gap-2">
                  <User size={18} className="text-gray-400" />
                  <select
                    value={filterCreatedBy}
                    onChange={(e) => setFilterCreatedBy(e.target.value)}
                    className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
                  >
                    <option value="">All Creators</option>
                    {uniqueCreatedBy.map((creator) => (
                      <option key={creator} value={creator}>
                        {creator}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Clear Filters Button */}
              {(searchTerm || filterStatus || filterCreatedBy) && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
                >
                  <X size={16} className="mr-1" />
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="block lg:hidden">
            <div className="space-y-4">
              {/* Select All Card for Mobile */}
              {filteredPOs.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    disabled={isLoading || filteredPOs.length === 0}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </div>
              )}

              {isLoading ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Loading purchase orders...
                  </div>
                </div>
              ) : filteredPOs.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                  No purchase orders found. Create your first one!
                </div>
              ) : (
                filteredPOs.map((po) => (
                  <div
                    key={po.id}
                    className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
                  >
                    {/* Card Header with Checkbox and Actions */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPOs.includes(po.id)}
                            onChange={() => handleSelectPO(po.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-500">
                              PO Number
                            </div>
                            <div className="text-base font-semibold text-blue-600">
                              {po.poNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {canView && (
                            <button
                              onClick={() => viewPO(po)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => editPO(po)}
                              className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPOPdf(po.id)}
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                            title="PDF"
                          >
                            <FileText size={18} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => deletePO(po.id)}
                              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Vendor
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            {po.vendorName || "N/A"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </div>
                          <div className="mt-1">
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full ${
                                po.status === "DRAFT"
                                  ? "bg-gray-200 text-gray-800"
                                  : po.status === "SENT"
                                    ? "bg-blue-200 text-blue-800"
                                    : po.status === "RECEIVED"
                                      ? "bg-green-200 text-green-800"
                                      : po.status === "CANCELLED"
                                        ? "bg-red-200 text-red-800"
                                        : "bg-yellow-200 text-yellow-800"
                              }`}
                            >
                              {po.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            PO Date
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            {po.poDate}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Delivery Date
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            {po.expectedDeliveryDate || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Total Amount
                          </div>
                          <div className="text-base font-bold text-gray-900 mt-1">
                            ₹{po.grandTotal?.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created By
                          </div>
                          <div className="text-sm text-gray-900 mt-1">
                            {po.created_by || "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Original Table for Desktop */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={isLoading || filteredPOs.length === 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        Loading purchase orders...
                      </div>
                    </td>
                  </tr>
                ) : filteredPOs.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No purchase orders found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedPOs.includes(po.id)}
                          onChange={() => handleSelectPO(po.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-center">
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {po.vendorName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {po.poDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {po.expectedDeliveryDate || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            po.status === "DRAFT"
                              ? "bg-gray-200 text-gray-800"
                              : po.status === "SENT"
                                ? "bg-blue-200 text-blue-800"
                                : po.status === "RECEIVED"
                                  ? "bg-green-200 text-green-800"
                                  : po.status === "CANCELLED"
                                    ? "bg-red-200 text-red-800"
                                    : "bg-yellow-200 text-yellow-800"
                          }`}
                        >
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        ₹{po.grandTotal?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {po.created_by || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          {canView && (
                            <button
                              onClick={() => viewPO(po)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => editPO(po)}
                              className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDownloadPOPdf(po.id)}
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                            title="PDF"
                          >
                            <FileText size={18} />
                          </button>
                          {canDelete && (
                            <button
                              onClick={() => deletePO(po.id)}
                              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewMode && <ViewModal />}

      {/* PO Form */}
      {showForm && !viewMode && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {editMode ? "Edit" : "New"} Purchase Order
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {/* Info Box */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Required Fields
                  </h4>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Required:</span> Vendor,
                    Assign To, Delivery Date, Items (with Qty & Unit Price)
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">Note:</span> Quantity fields
                    accept only numbers (no decimals), Price/Tax/Discount accept
                    decimal numbers
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Number{" "}
                    <span className="text-green-600 text-xs font-normal">
                      (Auto-generated)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="poNumber"
                    value={formData.poNumber}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                    placeholder="Will be generated by system"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="poDate"
                    value={formData.poDate}
                    onChange={(e) => {
                      const newDate = e.target.value;

                      const deliveryDate = new Date(newDate);
                      deliveryDate.setDate(deliveryDate.getDate() + 7);

                      setFormData({
                        ...formData,
                        poDate: newDate,
                        expectedDeliveryDate: deliveryDate
                          .toISOString()
                          .split("T")[0],
                      });
                    }}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expectedDeliveryDate"
                    min={formData.poDate}
                    value={formData.expectedDeliveryDate}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expectedDeliveryDate
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errors.expectedDeliveryDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.expectedDeliveryDate}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ASSIGN TO SECTION WITH SEARCH */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To <span className="text-red-500">*</span>
                  </label>

                  <div className="flex gap-2">
                    <select
                      value={formData.assign_type}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          assign_type: e.target.value,
                          assign_id: null,
                          assign_name: "",
                        }));
                        setAssignSearchTerm("");
                        setShowAssignDropdown(false);
                        if (errors.assign_id) {
                          setErrors((prev) => ({ ...prev, assign_id: "" }));
                        }
                      }}
                      className={`w-36 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                        errors.assign_id ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      {role === "ADMIN" && (
                        <>
                          <option value="shop">🏪 Shop</option>
                          <option value="growtag">🏷️ GrowTag</option>
                        </>
                      )}
                      {(role === "FRANCHISE" || role === "OTHERSHOP") && (
                        <option value="shop">🏪 Shop</option>
                      )}
                      {role === "GROWTAG" && (
                        <option value="growtag">🏷️ GrowTag</option>
                      )}
                    </select>

                    <div className="relative flex-1" ref={assignDropdownRef}>
                      <button
                        type="button"
                        onClick={() =>
                          setShowAssignDropdown(!showAssignDropdown)
                        }
                        className={`w-full px-3 py-2 border rounded-lg bg-white text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.assign_id
                            ? "border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <span
                          className={
                            formData.assign_id
                              ? "text-gray-900"
                              : "text-gray-400"
                          }
                        >
                          {formData.assign_id
                            ? getSelectedDisplayText()
                            : `-- Select ${getAssignTypeLabel()} --`}
                        </span>
                        <ChevronDown size={16} className="text-gray-400" />
                      </button>

                      {showAssignDropdown && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
                          <div className="p-2 border-b border-gray-200">
                            <div className="relative">
                              <Search
                                size={14}
                                className="absolute left-3 top-2.5 text-gray-400"
                              />
                              <input
                                type="text"
                                placeholder={`Search ${getAssignTypeLabel()}...`}
                                value={assignSearchTerm}
                                onChange={(e) =>
                                  setAssignSearchTerm(e.target.value)
                                }
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                            </div>
                          </div>

                          <div className="overflow-y-auto max-h-64">
                            {getFilteredAssignItems().length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                                No {getAssignTypeLabel().toLowerCase()} found
                              </div>
                            ) : (
                              getFilteredAssignItems().map((item) => {
                                if (formData.assign_type === "shop") {
                                  const icon = getShopIcon(item.shop_type);
                                  const typeLabel = getShopTypeLabel(
                                    item.shop_type,
                                  );
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          assign_id: item.id,
                                          assign_name: item.shopname,
                                        });
                                        setShowAssignDropdown(false);
                                        setAssignSearchTerm("");
                                        if (errors.assign_id) {
                                          setErrors((prev) => ({
                                            ...prev,
                                            assign_id: "",
                                          }));
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2"
                                    >
                                      <span className="text-lg">{icon}</span>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                          {item.shopname}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {typeLabel}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                } else {
                                  return (
                                    <button
                                      key={item.id}
                                      type="button"
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          assign_id: item.id,
                                          assign_name: item.name,
                                        });
                                        setShowAssignDropdown(false);
                                        setAssignSearchTerm("");
                                        if (errors.assign_id) {
                                          setErrors((prev) => ({
                                            ...prev,
                                            assign_id: "",
                                          }));
                                        }
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors flex items-center gap-2"
                                    >
                                      <span className="text-lg">🏷️</span>
                                      <div className="flex-1">
                                        <div className="text-sm font-medium text-gray-900">
                                          {item.name}
                                        </div>
                                      </div>
                                    </button>
                                  );
                                }
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {formData.assign_id && (
                    <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded-md flex items-center gap-1">
                      <span>✓</span>
                      <span>Assigned to: {getSelectedDisplayText()}</span>
                    </div>
                  )}
                  {errors.assign_id && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.assign_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Information with Searchable Select */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Vendor Information</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <SearchableVendorSelect
                    options={vendors}
                    value={formData.vendorId}
                    onChange={handleVendorChange}
                    placeholder="-- Select Vendor --"
                    label="Select Vendor"
                    error={errors.vendorName}
                    disabled={isSubmitting}
                  />
                </div>

                {formData.vendorId && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Email
                        </label>
                        <input
                          type="email"
                          value={formData.vendorEmail}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.vendorPhone}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Address
                        </label>
                        <input
                          type="text"
                          value={formData.vendorAddress}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shipping & Billing - Optional */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Shipping & Billing{" "}
                <span className="text-sm text-gray-500 font-normal">
                  (Optional)
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill To Address
                  </label>
                  <textarea
                    name="billTo"
                    value={formData.billTo}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter billing address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ship To Address
                  </label>
                  <textarea
                    name="shipTo"
                    value={formData.shipTo}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter shipping address..."
                  />
                </div>
              </div>
            </div>

            {/* Items with Searchable Item Select */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Items</h3>
                <button
                  onClick={addItem}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              {errors.items && (
                <p className="text-red-500 text-xs mb-2">{errors.items}</p>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Item <span className="text-red-500">*</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Qty <span className="text-red-500">*</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Unit Price <span className="text-red-500">*</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Tax %
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Discount %
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items && formData.items.length > 0 ? (
                      formData.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            <SearchableItemSelect
                              items={items}
                              value={item.itemId}
                              onChange={(value) =>
                                handleItemSelection(index, value)
                              }
                              disabled={isSubmitting}
                              index={index}
                            />
                            {errors[`item_${index}_itemName`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`item_${index}_itemName`]}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.description || ""}
                                onChange={(e) =>
                                  handleDescriptionChange(index, e.target.value)
                                }
                                disabled={isSubmitting}
                                placeholder="Enter description..."
                                className="w-full min-w-[200px] px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              {item.itemId && (
                                <div className="absolute right-2 top-1.5 text-xs text-gray-400">
                                  <Edit3 size={14} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleNumericBlur(
                                  index,
                                  "quantity",
                                  e.target.value,
                                )
                              }
                              disabled={isSubmitting}
                              placeholder="0"
                              className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                errors[`item_${index}_quantity`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`item_${index}_quantity`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`item_${index}_quantity`]}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "unitPrice",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleNumericBlur(
                                  index,
                                  "unitPrice",
                                  e.target.value,
                                )
                              }
                              disabled={isSubmitting}
                              placeholder="0.00"
                              className={`w-28 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                errors[`item_${index}_unitPrice`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`item_${index}_unitPrice`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`item_${index}_unitPrice`]}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.tax}
                              onChange={(e) =>
                                handleItemChange(index, "tax", e.target.value)
                              }
                              onBlur={(e) =>
                                handleNumericBlur(index, "tax", e.target.value)
                              }
                              disabled={isSubmitting}
                              placeholder="0"
                              className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                errors[`item_${index}_tax`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`item_${index}_tax`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`item_${index}_tax`]}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.discount}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "discount",
                                  e.target.value,
                                )
                              }
                              onBlur={(e) =>
                                handleNumericBlur(
                                  index,
                                  "discount",
                                  e.target.value,
                                )
                              }
                              disabled={isSubmitting}
                              placeholder="0"
                              className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                errors[`item_${index}_discount`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            />
                            {errors[`item_${index}_discount`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`item_${index}_discount`]}
                              </p>
                            )}
                          </td>
                          <td className="px-3 py-2 font-medium">
                            ₹{item.amount.toFixed(2)}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeItem(index)}
                              disabled={isSubmitting}
                              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                              title="Remove Item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="8"
                          className="px-3 py-4 text-center text-gray-500"
                        >
                          No items added. Click "Add Item" to add items.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="mb-6">
              <div className="flex justify-end">
                <div className="w-full md:w-1/2 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ₹{formData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Discount:</span>
                    <span className="font-medium text-red-600">
                      -₹{formData.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-medium">
                      ₹{formData.totalTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping Charges:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.shippingCharges}
                      onChange={(e) =>
                        handleChargesChange("shippingCharges", e.target.value)
                      }
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange(
                          "shippingCharges",
                          value.toString(),
                        );
                      }}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Adjustment:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formData.adjustment}
                      onChange={(e) =>
                        handleChargesChange("adjustment", e.target.value)
                      }
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        handleChargesChange("adjustment", value.toString());
                      }}
                      disabled={isSubmitting}
                      placeholder="0.00"
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold text-gray-800">
                      Grand Total:
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      ₹{formData.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Notes - Optional */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">
                Additional Information{" "}
                <span className="text-sm text-gray-500 font-normal">
                  (Optional)
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Payment terms, delivery conditions, etc..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Any additional notes or special instructions..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <button
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={editMode ? updatePO : createPO}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {editMode ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    {editMode ? "Update" : "Save"} Purchase Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;
