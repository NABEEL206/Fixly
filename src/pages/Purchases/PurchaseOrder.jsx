// src/pages/Purchases/PurchaseOrder.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
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
} from "lucide-react";
import axiosInstance from "@/API/axiosInstance";
import toast from "react-hot-toast";

// Utility function to ensure only numbers are entered and remove leading zeros
const processNumericInput = (value, allowDecimal = true, maxLength = null) => {
  if (!value && value !== 0) return "";

  // Convert to string
  let stringValue = String(value);

  // Remove any non-numeric characters except decimal point if allowed
  if (allowDecimal) {
    // Allow digits and at most one decimal point
    const matches = stringValue.match(/^(\d*\.?\d*)/);
    stringValue = matches ? matches[1] : "";
  } else {
    // Only digits
    stringValue = stringValue.replace(/[^\d]/g, "");
  }

  // Apply max length if specified
  if (maxLength && stringValue.length > maxLength) {
    stringValue = stringValue.slice(0, maxLength);
  }

  return stringValue;
};

// Remove leading zeros from numeric strings
const removeLeadingZeros = (value) => {
  if (!value && value !== 0) return "";

  const stringValue = String(value);

  // If it's just "0", keep it
  if (stringValue === "0") return "0";

  // If it's a decimal number starting with 0
  if (stringValue.startsWith("0.")) return stringValue;

  // Remove leading zeros but keep the rest
  const trimmed = stringValue.replace(/^0+(?=\d)/, "");

  // If empty after trimming, return "0"
  return trimmed || "0";
};

// Format number for display in input fields
const formatNumberForInput = (value) => {
  if (value === 0 || value === "0") return "0";
  if (!value && value !== 0) return "";
  return String(value);
};

// Validate if string contains only numbers (and optional decimal)
const isValidNumber = (value, allowDecimal = true) => {
  if (!value && value !== 0) return true;
  const stringValue = String(value);
  if (allowDecimal) {
    return /^\d*\.?\d*$/.test(stringValue);
  }
  return /^\d*$/.test(stringValue);
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "RECEIVED", label: "Received" },
  { value: "CANCELLED", label: "Cancelled" },
];

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

  // Bulk selection states
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Cache for detailed purchase orders
  const [poDetailsCache, setPoDetailsCache] = useState({});

  // Use ref to track toast ID
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
    expectedDeliveryDate: "",
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
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  // Get unique createdBy values for filter
  const uniqueCreatedBy = React.useMemo(() => {
    const set = new Set();
    purchaseOrders.forEach((po) => {
      if (po.created_by) set.add(po.created_by);
    });
    return Array.from(set).sort();
  }, [purchaseOrders]);

  // Get unique status values for filter
  const uniqueStatuses = React.useMemo(() => {
    const set = new Set();
    purchaseOrders.forEach((po) => {
      if (po.status) set.add(po.status);
    });
    return Array.from(set).sort();
  }, [purchaseOrders]);

  // Fetch vendors and items on component mount
  useEffect(() => {
    fetchVendors();
    fetchItems();
    fetchPurchaseOrders();
  }, []);

  // Reset selectedPOs when filtered PO list changes
  useEffect(() => {
    setSelectedPOs([]);
    setSelectAll(false);
  }, [searchTerm, filterStatus, filterCreatedBy, purchaseOrders.length]);

  // Fetch vendors from API
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

      // Network error handled globally
      if (!error.response) return;

      toast.error("Failed to load vendors");
    }
  };

  // Fetch items from API
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

  // Fetch single purchase order details
  const fetchPurchaseOrderDetails = async (id) => {
    try {
      // Check cache first
      if (poDetailsCache[id]) {
        return poDetailsCache[id];
      }

      const response = await axiosInstance.get(`/api/purchase-orders/${id}/`);
      const data = response.data;
      const order = data.data || data;

      // Transform the detailed data
      let itemsArray = [];
      if (order?.items && Array.isArray(order.items)) {
        itemsArray = order.items.map((item) => ({
          id: item?.id || null,
          itemId: item?.id || "",
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
      };

      // Update cache
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

  // Fetch purchase orders from API
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

  // Load detailed data when needed
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

  // Generate PO Number
  const generatePONumber = () => {
    const prefix = "PO";
    const date = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    return `${prefix}-${date}-${random}`;
  };

  // Handle vendor selection
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

  // Handle item selection from catalog
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

  // Handle manual description change
  const handleDescriptionChange = (index, value) => {
    handleItemChange(index, "description", value);
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.poNumber.trim()) {
      newErrors.poNumber = "PO Number is required";
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = "Vendor selection is required";
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

  // Calculate item amount
  const calculateItemAmount = (item) => {
    const baseAmount = item.quantity * item.unitPrice;
    const discountAmount = (baseAmount * item.discount) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;
    const taxAmount = (amountAfterDiscount * item.tax) / 100;
    return amountAfterDiscount + taxAmount;
  };

  // Calculate totals
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

  // Handle input change for main form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let processedValue = value;
    if (["shippingCharges", "adjustment"].includes(name)) {
      // Allow only numbers and decimal point
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

  // Handle item field changes - UPDATED to only allow numbers
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    // Process numeric fields to only allow numbers
    if (["quantity", "unitPrice", "tax", "discount"].includes(field)) {
      // Determine if decimal is allowed
      const allowDecimal = field !== "quantity"; // Quantity should be whole numbers only
      const maxLength = field === "quantity" ? 6 : 10;

      // Process the input to only allow valid characters
      let processedValue = processNumericInput(value, allowDecimal, maxLength);

      // Remove leading zeros for display
      if (field === "quantity") {
        processedValue = removeLeadingZeros(processedValue);
      }

      newItems[index][field] = processedValue;

      // Parse to number for calculations
      const numericValue = parseFloat(processedValue) || 0;
      newItems[index][field + "Numeric"] = numericValue;
    } else {
      newItems[index][field] = value;
    }

    // Recalculate amount using numeric values
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

  // Handle blur for numeric fields to ensure proper formatting
  const handleNumericBlur = (index, field, value) => {
    const newItems = [...formData.items];
    const numericValue = parseFloat(value) || 0;

    // Format the number properly on blur (remove leading zeros)
    let formattedValue = numericValue.toString();

    // For quantity, ensure it's a whole number
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

  // Add new item
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

  // Remove item
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

  // Handle charges change
  const handleChargesChange = (field, value) => {
    // Allow only numbers and decimal point
    let processedValue = processNumericInput(value, true, 10);

    setFormData((prev) => ({
      ...prev,
      [field]: processedValue,
    }));

    // Use the numeric value for calculations
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

  // Transform form data to API format
  const transformToAPIFormat = (data) => {
    return {
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
  };

  // Create Purchase Order
  const createPO = async () => {
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
          itemId: item?.id || "",
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

  // Update Purchase Order
  const updatePO = async () => {
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
          itemId: item?.id || "",
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

  // Delete Single Purchase Order
  const deletePO = (id) => {
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

  // Bulk Delete Purchase Orders
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

  // Handle select all
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedPOs(filteredPOs.map((po) => po.id));
    } else {
      setSelectedPOs([]);
    }
  };

  // Handle single select
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

  // Edit Purchase Order
  const editPO = async (po) => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    try {
      let detailedPO = po;

      if (!po.items || po.items.length === 0 || !po.vendorEmail) {
        detailedPO = await loadDetailedData(po.id);
      }

      if (detailedPO) {
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
          items: detailedPO.items.map((item) => ({
            ...item,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            tax: item.tax.toString(),
            discount: item.discount.toString(),
            amount: item.amount,
          })),
          subtotal: detailedPO.subtotal,
          totalDiscount: detailedPO.totalDiscount,
          totalTax: detailedPO.totalTax,
          shippingCharges: detailedPO.shippingCharges?.toString() || "0",
          adjustment: detailedPO.adjustment?.toString() || "0",
          grandTotal: detailedPO.grandTotal,
          terms: detailedPO.terms || "",
          notes: detailedPO.notes || "",
          created_by: detailedPO.created_by,
        });
        setEditMode(true);
        setViewMode(false);
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

  // View Purchase Order
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

  // Reset Form
  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
    setEditMode(false);
    setViewMode(false);
    setErrors({});
    setIsSubmitting(false);
  };

  // New PO
  const newPO = () => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }

    setFormData({
      ...initialFormState,
      poNumber: generatePONumber(),
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
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterCreatedBy("");
  };

  // Filter POs
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

  // View Modal Component
  const ViewModal = () => (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
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
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
          <div className="flex gap-3">
            {selectedPOs.length > 0 && (
              <button
                onClick={handleBulkDelete}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
              >
                <Trash2 size={20} />
                Delete Selected ({selectedPOs.length})
              </button>
            )}
            {!showForm && (
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      disabled={isLoading || filteredPOs.length === 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PO Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedPOs.includes(po.id)}
                          onChange={() => handleSelectPO(po.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {po.poNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {po.vendorName || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po.poDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po.expectedDeliveryDate || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{po.grandTotal?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {po.created_by || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewPO(po)}
                            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            onClick={() => editPO(po)}
                            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>

                          <button
                            onClick={() => handleDownloadPOPdf(po.id)}
                            className="text-indigo-600 hover:text-indigo-800 p-1.5 hover:bg-indigo-50 rounded transition-colors"
                            title="PDF"
                          >
                            <FileText size={18} />
                          </button>

                          <button
                            onClick={() => deletePO(po.id)}
                            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
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
                    <span className="font-medium">Required:</span> PO Number,
                    Vendor, Delivery Date, Items (with Qty & Unit Price)
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
                    PO Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="poNumber"
                    value={formData.poNumber}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.poNumber ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.poNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.poNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    PO Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="poDate"
                    value={formData.poDate}
                    onChange={handleInputChange}
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
              </div>
            </div>

            {/* Vendor Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Vendor Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Vendor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.vendorName ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {errors.vendorName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.vendorName}
                    </p>
                  )}
                </div>

                {formData.vendorId && (
                  <>
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

            {/* Items */}
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
                            <select
                              value={item.itemId}
                              onChange={(e) =>
                                handleItemSelection(index, e.target.value)
                              }
                              disabled={isSubmitting}
                              className={`w-full min-w-[200px] px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                                errors[`item_${index}_itemName`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                            >
                              <option value="">-- Select Item --</option>
                              {items.map((catalogItem) => (
                                <option
                                  key={catalogItem.id}
                                  value={catalogItem.id}
                                >
                                  {catalogItem.name} - ₹
                                  {parseFloat(
                                    catalogItem.selling_price ||
                                      catalogItem.cost_price ||
                                      0,
                                  ).toFixed(2)}
                                </option>
                              ))}
                            </select>
                            {item.itemId && (
                              <p className="text-xs text-gray-500 mt-1">
                                Selected: {item.itemName} - ₹
                                {parseFloat(item.unitPrice).toFixed(2)}
                              </p>
                            )}
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
