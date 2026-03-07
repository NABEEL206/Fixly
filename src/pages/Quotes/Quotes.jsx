// src/pages/Quotes.jsx
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Eye,
  Upload,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Receipt,
  Info,
  Save,
  Edit3,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/API/axiosInstance";
import { useNavigate } from "react-router-dom";

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "accepted", label: "Accepted" },
  { value: "converted", label: "Converted" },
  { value: "expired", label: "Expired" },
];

// GST rate options
const gstRates = [0, 0.25, 3, 5, 12, 18, 28];

// Service charge options
const SERVICE_CHARGE_OPTIONS = [
  { value: "none", label: "No Service Charge" },
  { value: "fixed", label: "Fixed Amount (₹)" },
  { value: "percentage", label: "Percentage (%)" },
];

// Helper function to remove leading zeros from a number string
const removeLeadingZeros = (value) => {
  if (value === "" || value === null || value === undefined) return "";

  // Convert to string
  const stringValue = String(value);

  // If it's just "0", keep it
  if (stringValue === "0") return "0";

  // Remove leading zeros
  return stringValue.replace(/^0+(?=\d)/, "");
};

// Helper function to format number input
const formatNumberInput = (value) => {
  if (value === "" || value === null || value === undefined) return "";

  const stringValue = String(value);

  // If it's a decimal number, handle carefully
  if (stringValue.includes(".")) {
    const [whole, decimal] = stringValue.split(".");
    const formattedWhole = whole.replace(/^0+(?=\d)/, "") || "0";
    return `${formattedWhole}.${decimal}`;
  }

  // Remove leading zeros for whole numbers
  return stringValue.replace(/^0+(?=\d)/, "") || "0";
};

const Quotes = () => {
  // Company registered state - constant
  const COMPANY_STATE = "Kerala";
  const navigate = useNavigate();

  // States for list view
  const [quotations, setQuotations] = useState([]);
  const [filteredQuotations, setFilteredQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedQuotes, setSelectedQuotes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // States for form view
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add", "edit", "view"
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    customer: null,
    place_of_supply: "",
    quote_number: "",
    reference_number: "",
    quote_date: new Date().toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [],
    terms_conditions:
      "1. All prices are in Indian Rupee (₹)\n2. Taxes as applicable\n3. Payment terms: 30 days\n4. This is a quotation only and not an invoice",
    notes: "",
    subtotal: 0,
    discount_type: "percentage",
    discount_value: 0,
    discount_amount: 0,
    taxable_amount: 0,
    total_igst: 0,
    total_cgst: 0,
    total_sgst: 0,
    total_tax: 0,
    shipping_charge: 0,
    adjustment: 0,
    // Service charge fields
    service_charge_type: "none", // "none", "fixed", "percentage"
    service_charge_value: 0,
    service_charge_amount: 0,
    grand_total: 0,
    status: "draft",
  });

  // Cache for detailed quotations
  const [quoteDetailsCache, setQuoteDetailsCache] = useState({});

  // Determine tax treatment based on place of supply vs company state
  const getTaxTreatment = (placeOfSupply) => {
    if (!placeOfSupply)
      return {
        type: "unknown",
        label: "Select place of supply",
        description:
          "Tax treatment will be determined based on place of supply",
        isIntraState: false,
        isInterState: false,
      };

    const isIntraState =
      placeOfSupply.toLowerCase() === COMPANY_STATE.toLowerCase();
    return {
      type: isIntraState ? "intra" : "inter",
      label: isIntraState ? "Intra-state (CGST + SGST)" : "Inter-state (IGST)",
      description: isIntraState
        ? `Supply within ${COMPANY_STATE} - Tax split equally as CGST and SGST`
        : `Supply outside ${COMPANY_STATE} - Tax applied as IGST`,
      isIntraState: isIntraState,
      isInterState: !isIntraState,
    };
  };

  // Get current tax treatment
  const taxTreatment = getTaxTreatment(formData.place_of_supply);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Recalculate all items when place of supply changes
  useEffect(() => {
    if (formData.items.length > 0) {
      const newItems = formData.items.map((item) => {
        const calculatedItem = { ...item };
        calculateItemDetails(calculatedItem);
        return calculatedItem;
      });
      setFormData((prev) => ({ ...prev, items: newItems }));
      calculateTotals(newItems);
    }
  }, [formData.place_of_supply]);

  useEffect(() => {
    if (formData.items.length > 0) {
      calculateTotals(formData.items);
    }
  }, [
    formData.discount_value,
    formData.discount_type,
    formData.shipping_charge,
    formData.adjustment,
    formData.service_charge_type,
    formData.service_charge_value,
  ]);

  // Filter quotations based on search and status
  useEffect(() => {
    let filtered = quotations;

    if (filterStatus !== "all") {
      filtered = filtered.filter((q) => q.status === filterStatus);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.quote_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.customer_area?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredQuotations(filtered);
    setCurrentPage(1);
  }, [searchTerm, quotations, filterStatus]);

  // Reset selected quotes when filtered quotations change
  useEffect(() => {
    setSelectedQuotes([]);
    setSelectAll(false);
  }, [filteredQuotations]);

  // Pagination calculation
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuotations.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [customersData, itemsData] = await Promise.all([
        fetchCustomers(),
        fetchItems(),
      ]);

      setCustomers(customersData);
      setItems(itemsData);

      await fetchQuotations();
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Error loading data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get("/api/customers/");
      return response.data;
    } catch (error) {
      console.error("Error fetching customers:", error);
      throw error;
    }
  };

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const response = await axiosInstance.get("/zoho/local-items/");
      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }
      if (data?.results && Array.isArray(data.results)) {
        return data.results;
      }
      return [];
    } catch (error) {
      console.error("Error fetching items:", error);
      toast.error("Failed to fetch items");
      throw error;
    } finally {
      setItemsLoading(false);
    }
  };
  const fetchQuotations = async () => {
    try {
      const res = await axiosInstance.get("/zoho/quotations/");
      const data = res.data;

      const list = Array.isArray(data) ? data : data.results || [];

      setQuotations(list);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("Failed to load quotations");
    }
  };

  // Fetch single quotation details
  const fetchQuotationDetails = async (id) => {
    try {
      const res = await axiosInstance.get(`/zoho/quotations/${id}/`);
      const data = res.data;

      const mappedData = {
        id: data.id,
        customer: customers.find((c) => c.id === data.customer) || null,
        place_of_supply: data.customer_state || "",
        quote_number: data.quotation_number,
        reference_number: data.reference_number || "",
        quote_date: data.quotation_date,
        expiry_date: data.expiry_date,
        status: data.status?.toLowerCase() || "draft",

        items:
          data.lines?.map((line) => ({
            item: items.find((i) => i.id === line.item) || null,
            item_id: line.item,
            item_name: line.item_name,
            description: line.description || "",
            quantity: parseFloat(line.qty),
            rate: parseFloat(line.rate),
            gst_rate: parseFloat(line.gst_percent || 0),
            taxable_value: parseFloat(line.taxable_amount || 0),
            total: parseFloat(line.line_total || 0),
            igst: 0,
            cgst: 0,
            sgst: 0,
          })) || [],

        subtotal: parseFloat(data.sub_total || 0),
        discount_type:
          data.discount_type === "PERCENT" ? "percentage" : "fixed",
        discount_value: parseFloat(data.discount_value || 0),
        discount_amount: parseFloat(data.discount_amount || 0),
        taxable_amount: parseFloat(data.taxable_amount || 0),

        total_igst: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_tax: Object.values(data.gst_breakdown || {}).reduce(
          (sum, g) => sum + parseFloat(g.tax || 0),
          0,
        ),

        shipping_charge: parseFloat(data.shipping_charge || 0),
        adjustment: parseFloat(data.adjustment || 0),

        service_charge_type:
          data.service_charge_type === "AMOUNT"
            ? "fixed"
            : data.service_charge_type === "PERCENTAGE"
              ? "percentage"
              : "none",

        service_charge_value: parseFloat(data.service_charge_value || 0),
        service_charge_amount: parseFloat(data.service_charge_total || 0),

        grand_total: parseFloat(data.grand_total || 0),

        terms_conditions: data.terms_conditions || "",
        notes: data.notes || "",
      };

      return mappedData;
    } catch (error) {
      console.error("Error fetching quotation details:", error);
      toast.error("Failed to load quotation details");
      return null;
    }
  };

  // Load detailed data when needed (for view or edit)
  const loadDetailedData = async (id) => {
    setIsFetchingDetails(true);
    try {
      const detailedData = await fetchQuotationDetails(id);
      if (detailedData) {
        // Update the specific quotation in the list with detailed data
        setQuotations((prev) =>
          prev.map((q) => (q.id === id ? { ...q, ...detailedData } : q)),
        );
        return detailedData;
      }
      return null;
    } catch (error) {
      console.error("Error loading detailed data:", error);
      return null;
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const generateQuoteNumber = () => {
    const newQuoteNumber = `QUOTE-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(4, "0")}`;
    setFormData((prev) => ({
      ...prev,
      quote_number: newQuoteNumber,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) {
      newErrors.customer = "Customer is required";
    }

    if (!formData.place_of_supply) {
      newErrors.place_of_supply = "Place of supply is required";
    }

    if (!formData.quote_number) {
      newErrors.quote_number = "Quote number is required";
    }

    if (!formData.quote_date) {
      newErrors.quote_date = "Quote date is required";
    }

    if (!formData.expiry_date) {
      newErrors.expiry_date = "Expiry date is required";
    }

    if (formData.items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    formData.items.forEach((item, index) => {
      if (!item.item_id) {
        newErrors[`item_${index}`] = "Item selection required";
      }
      if (item.quantity <= 0) {
        newErrors[`quantity_${index}`] = "Quantity must be greater than 0";
      }
      if (item.rate < 0) {
        newErrors[`rate_${index}`] = "Rate cannot be negative";
      }
    });

    // Validate service charge if enabled
    if (formData.service_charge_type !== "none") {
      if (formData.service_charge_value < 0) {
        newErrors.service_charge = "Service charge cannot be negative";
      }
      if (
        formData.service_charge_type === "percentage" &&
        formData.service_charge_value > 100
      ) {
        newErrors.service_charge =
          "Service charge percentage cannot exceed 100%";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCustomerChange = (e) => {
    const customerId = parseInt(e.target.value);
    const selectedCustomer = customers.find((c) => c.id === customerId);
    setFormData({
      ...formData,
      customer: selectedCustomer,
      place_of_supply: selectedCustomer?.state || "",
    });
    if (errors.customer) {
      setErrors({ ...errors, customer: null });
    }
  };

  const handlePlaceOfSupplyChange = (e) => {
    const newPlaceOfSupply = e.target.value;
    setFormData({
      ...formData,
      place_of_supply: newPlaceOfSupply,
    });
    if (errors.place_of_supply) {
      setErrors({ ...errors, place_of_supply: null });
    }
  };

  const addItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          item: null,
          item_id: "",
          item_name: "",
          description: "",
          quantity: 1,
          rate: 0,
          gst_rate: 18,
          taxable_value: 0,
          total: 0,
          igst: 0,
          cgst: 0,
          sgst: 0,
        },
      ],
    });
    if (errors.items) {
      setErrors({ ...errors, items: null });
    }
  };

  const removeItemRow = (index) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }

    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];

    if (field === "item_id") {
      const selectedItem = items.find((i) => i.id === parseInt(value));
      if (selectedItem) {
        newItems[index].item = selectedItem;
        newItems[index].item_id = value;
        newItems[index].item_name = selectedItem.name || "";
        newItems[index].rate = parseFloat(selectedItem.selling_price) || 0;
        newItems[index].description = selectedItem.sales_description || "";

        let gstRate = 18;
        if (selectedItem.gst_treatment) {
          const match = selectedItem.gst_treatment.match(/GST_(\d+(\.\d+)?)/);
          if (match && match[1]) {
            gstRate = parseFloat(match[1]);
          }
        }
        newItems[index].gst_rate = gstRate;
      }
    } else {
      // Handle number fields to remove leading zeros
      if (field === "quantity" || field === "rate") {
        // Remove leading zeros but keep as string for input
        const formattedValue = removeLeadingZeros(value);
        newItems[index][field] =
          formattedValue === "" ? 0 : parseFloat(formattedValue) || 0;
      } else {
        newItems[index][field] =
          field === "description" ? value : parseFloat(value) || 0;
      }
    }

    calculateItemDetails(newItems[index]);

    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);

    if (errors[`item_${index}`]) {
      setErrors({ ...errors, [`item_${index}`]: null });
    }
  };

  const calculateItemDetails = (item) => {
    const quantity = item.quantity || 0;
    const rate = item.rate || 0;
    const gstRate = item.gst_rate || 0;

    item.taxable_value = quantity * rate;

    if (taxTreatment.isIntraState) {
      item.cgst = (item.taxable_value * gstRate) / 200;
      item.sgst = (item.taxable_value * gstRate) / 200;
      item.igst = 0;
    } else {
      item.igst = (item.taxable_value * gstRate) / 100;
      item.cgst = 0;
      item.sgst = 0;
    }

    item.total =
      item.taxable_value +
      (item.igst || 0) +
      (item.cgst || 0) +
      (item.sgst || 0);
  };

  const calculateServiceCharge = (subtotal) => {
    let serviceChargeAmount = 0;

    if (formData.service_charge_type === "fixed") {
      serviceChargeAmount = parseFloat(formData.service_charge_value) || 0;
    } else if (formData.service_charge_type === "percentage") {
      serviceChargeAmount =
        (subtotal * (parseFloat(formData.service_charge_value) || 0)) / 100;
    }

    return serviceChargeAmount;
  };

  const calculateTotals = (items) => {
    const subtotal = items.reduce(
      (sum, item) => sum + (item.taxable_value || 0),
      0,
    );

    let discountAmount = 0;

    if (formData.discount_type === "percentage") {
      discountAmount =
        (subtotal * (parseFloat(formData.discount_value) || 0)) / 100;
    } else {
      discountAmount = parseFloat(formData.discount_value) || 0;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    const discountedSubtotal = subtotal - discountAmount;

    const discountRatio = subtotal > 0 ? discountedSubtotal / subtotal : 1;

    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    items.forEach((item) => {
      const adjustedTaxableRaw = (item.taxable_value || 0) * discountRatio;
      const adjustedTaxable = parseFloat(adjustedTaxableRaw.toFixed(2));

      if (taxTreatment.isIntraState) {
        const cgst = parseFloat(
          ((adjustedTaxable * item.gst_rate) / 200).toFixed(2),
        );
        const sgst = parseFloat(
          ((adjustedTaxable * item.gst_rate) / 200).toFixed(2),
        );

        totalCgst += cgst;
        totalSgst += sgst;
      } else {
        const igst = parseFloat(
          ((adjustedTaxable * item.gst_rate) / 100).toFixed(2),
        );
        totalIgst += igst;
      }
    });

    totalIgst = parseFloat(totalIgst.toFixed(2));
    totalCgst = parseFloat(totalCgst.toFixed(2));
    totalSgst = parseFloat(totalSgst.toFixed(2));

    const totalTax = totalIgst + totalCgst + totalSgst;

    const shipping = parseFloat(formData.shipping_charge) || 0;
    const adjustment = parseFloat(formData.adjustment) || 0;

    // Calculate service charge
    const serviceChargeAmount = calculateServiceCharge(discountedSubtotal);

    const grandTotal =
      discountedSubtotal +
      totalTax +
      shipping +
      adjustment +
      serviceChargeAmount;

    setFormData((prev) => ({
      ...prev,
      subtotal,
      discount_amount: discountAmount,
      taxable_amount: discountedSubtotal,
      total_igst: totalIgst,
      total_cgst: totalCgst,
      total_sgst: totalSgst,
      total_tax: totalTax,
      service_charge_amount: serviceChargeAmount,
      grand_total: parseFloat(grandTotal.toFixed(2)),
    }));
  };

  const handleFileChange = (e) => {
    setAttachedFile(e.target.files[0]);
  };

  const handleServiceChargeChange = (field, value) => {
    // Remove leading zeros for service charge value
    if (field === "service_charge_value") {
      const formattedValue = removeLeadingZeros(value);
      setFormData((prev) => ({
        ...prev,
        [field]: formattedValue === "" ? 0 : parseFloat(formattedValue) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (errors.service_charge) {
      setErrors({ ...errors, service_charge: null });
    }
  };

  const handleDiscountValueChange = (value) => {
    const formattedValue = removeLeadingZeros(value);
    setFormData((prev) => ({
      ...prev,
      discount_value:
        formattedValue === "" ? 0 : parseFloat(formattedValue) || 0,
    }));
  };

  const handleShippingChargeChange = (value) => {
    const formattedValue = removeLeadingZeros(value);
    setFormData((prev) => ({
      ...prev,
      shipping_charge:
        formattedValue === "" ? 0 : parseFloat(formattedValue) || 0,
    }));
  };

  const handleAdjustmentChange = (value) => {
    const formattedValue = removeLeadingZeros(value);
    setFormData((prev) => ({
      ...prev,
      adjustment: formattedValue === "" ? 0 : parseFloat(formattedValue) || 0,
    }));
  };

  const handleSaveQuotation = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(
      formMode === "add" ? "Creating quotation..." : "Updating quotation...",
    );

    try {
      const payload = {
        customer: formData.customer?.id,
        quotation_number: formData.quote_number,
        quotation_date: formData.quote_date,
        expiry_date: formData.expiry_date,
        company_state: COMPANY_STATE,
        supply_type: "GOODS",

        discount_type:
          formData.discount_type === "percentage" ? "PERCENT" : "AMOUNT",

        discount_value: String(formData.discount_value || "0"),
        shipping_charge: String(formData.shipping_charge || "0"),

        service_charge_type:
          formData.service_charge_type === "fixed"
            ? "AMOUNT"
            : formData.service_charge_type === "percentage"
              ? "PERCENTAGE"
              : "NONE",

        service_charge_value: String(formData.service_charge_value || "0"),
        adjustment: String(formData.adjustment || "0"),

        lines: formData.items.map((item) => ({
          item: parseInt(item.item_id),
          description: item.description || "",
          qty: String(item.quantity),
          rate: String(item.rate),
          gst_percent: String(item.gst_rate),
        })),
      };

      if (formMode === "add") {
        await axiosInstance.post("/zoho/quotations/", payload);
      } else {
        await axiosInstance.put(`/zoho/quotations/${formData.id}/`, payload);
      }

      toast.success(
        `Quotation ${formMode === "add" ? "created" : "updated"} successfully`,
        { id: loadingToast },
      );

      await fetchQuotations();

      resetForm();
      setShowForm(false);
    } catch (error) {
      console.error("Save quotation error:", error);
      console.log("Error status:", error.response?.status);
      console.log("Error data:", error.response?.data);

      toast.error(
        error.response?.data?.detail ||
          JSON.stringify(error.response?.data) ||
          "Error saving quotation",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuotation = (id) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete Quotation?
          </p>
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
                const loadingToast = toast.loading("Deleting quotation...");

                try {
                  await axiosInstance.delete(`/zoho/quotations/${id}/`);

                  // refresh list from API
                  await fetchQuotations();

                  toast.success("Quotation deleted successfully", {
                    id: loadingToast,
                  });
                } catch (error) {
                  console.error("Error deleting quotation:", error);
                  console.log("Error data:", error.response?.data);

                  toast.error("Error deleting quotation", { id: loadingToast });
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleBulkDelete = () => {
    if (selectedQuotes.length === 0) {
      toast.error("No quotations selected");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete {selectedQuotes.length} Quotations?
          </p>
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
                const loadingToast = toast.loading(
                  `Deleting ${selectedQuotes.length} quotations...`,
                );

                try {
                  await Promise.all(
                    selectedQuotes.map((id) =>
                      axiosInstance.delete(`/zoho/quotations/${id}/`),
                    ),
                  );

                  await fetchQuotations();

                  setSelectedQuotes([]);
                  setSelectAll(false);

                  toast.success(
                    `${selectedQuotes.length} quotations deleted successfully`,
                    { id: loadingToast },
                  );
                } catch (error) {
                  console.error("Bulk delete error:", error);
                  console.log("Error data:", error.response?.data);

                  toast.error("Error deleting quotations", {
                    id: loadingToast,
                  });
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity },
    );
  };

  const handleConvertToInvoice = (quotation) => {
    navigate("/invoice", {
      state: { quotationData: quotation },
    });
  };

  const handleSelectQuote = (id) => {
    setSelectedQuotes((prev) => {
      if (prev.includes(id)) {
        return prev.filter((quoteId) => quoteId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedQuotes(currentItems.map((q) => q.id));
    } else {
      setSelectedQuotes([]);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("all");
  };

  const handleNewQuotation = () => {
    setFormMode("add");
    resetForm();
    generateQuoteNumber();
    setShowForm(true);
  };

  const handleEditQuotation = async (quotation) => {
    setFormMode("edit");
    setIsFetchingDetails(true);

    const detailedData = await fetchQuotationDetails(quotation.id);

    if (detailedData) {
      setFormData(detailedData);
      setShowForm(true);
    }

    setIsFetchingDetails(false);
  };

  const handleViewQuotation = async (quotation) => {
    setFormMode("view");
    setIsFetchingDetails(true);

    const detailedData = await fetchQuotationDetails(quotation.id);

    if (detailedData) {
      setFormData(detailedData);
      setShowForm(true);
    }

    setIsFetchingDetails(false);
  };

  const resetForm = () => {
    setFormData({
      id: null,
      customer: null,
      place_of_supply: "",
      quote_number: "",
      reference_number: "",
      quote_date: new Date().toISOString().split("T")[0],
      expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      items: [],
      terms_conditions:
        "1. All prices are in Indian Rupee (₹)\n2. Taxes as applicable\n3. Payment terms: 30 days\n4. This is a quotation only and not an invoice",
      notes: "",
      subtotal: 0,
      discount_type: "percentage",
      discount_value: 0,
      discount_amount: 0,
      taxable_amount: 0,
      total_igst: 0,
      total_cgst: 0,
      total_sgst: 0,
      total_tax: 0,
      shipping_charge: 0,
      adjustment: 0,
      service_charge_type: "none",
      service_charge_value: 0,
      service_charge_amount: 0,
      grand_total: 0,
      status: "draft",
    });
    setErrors({});
    setAttachedFile(null);
  };

  const handleCancelForm = () => {
    resetForm();
    setShowForm(false);
    setFormMode("add");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: "bg-gray-200", text: "text-gray-800", label: "Draft" },
      sent: { bg: "bg-blue-200", text: "text-blue-800", label: "Sent" },
      accepted: {
        bg: "bg-green-200",
        text: "text-green-800",
        label: "Accepted",
      },
      converted: {
        bg: "bg-purple-200",
        text: "text-purple-800",
        label: "Converted",
      },
      expired: { bg: "bg-red-200", text: "text-red-800", label: "Expired" },
    };

    const config = statusConfig[status] || statusConfig.draft;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {!showForm ? (
        /* List View */
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">Quotations</h1>
              <div className="flex gap-3">
                {selectedQuotes.length > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    disabled={loading || isFetchingDetails}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={20} />
                    Delete Selected ({selectedQuotes.length})
                  </button>
                )}
                <button
                  onClick={handleNewQuotation}
                  disabled={loading || isFetchingDetails}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={20} />
                  New Quotation
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-4 border-b">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search by Quote Number, Customer, Area..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter size={18} className="text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    disabled={loading}
                    className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="all">All Status</option>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {(searchTerm || filterStatus !== "all") && (
                  <button
                    onClick={clearFilters}
                    disabled={loading}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <X size={16} className="mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        disabled={loading || currentItems.length === 0}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quote #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          <span>Loading quotations...</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No quotations found. Create your first one!
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={selectedQuotes.includes(quotation.id)}
                            onChange={() => handleSelectQuote(quotation.id)}
                            disabled={isFetchingDetails}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(
                            quotation.quotation_date,
                          ).toLocaleDateString("en-IN")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {quotation.quotation_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {quotation.customer_name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {quotation.customer_area},{" "}
                              {quotation.customer_pincode}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(quotation.expiry_date).toLocaleDateString(
                            "en-IN",
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(quotation.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                          ₹{parseFloat(quotation.grand_total || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleViewQuotation(quotation)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            <button
                              onClick={() => handleEditQuotation(quotation)}
                              className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteQuotation(quotation.id)
                              }
                              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                            <button
                              onClick={() => handleConvertToInvoice(quotation)}
                              className="text-purple-600 hover:text-purple-800 p-1.5 hover:bg-purple-50 rounded transition-colors"
                              title="Convert to Invoice"
                            >
                              <Receipt size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredQuotations.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredQuotations.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium">
                    {filteredQuotations.length}
                  </span>{" "}
                  results
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        currentPage === i + 1
                          ? "bg-blue-600 text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow">
          {/* Form Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-600 p-2 rounded-lg mr-3">
                  <FileText className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {formMode === "add"
                      ? "Create New Quotation"
                      : formMode === "edit"
                        ? "Edit Quotation"
                        : "View Quotation"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {formMode === "add"
                      ? "Fill in the details to create a new quotation"
                      : formMode === "edit"
                        ? "Modify the quotation details below"
                        : "View quotation details"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Info Box */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Required Fields
                  </h4>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Required:</span> Customer,
                    Place of Supply, Quote Number, Quote Date, Expiry Date,
                    Items (with selection, quantity & rate)
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.customer ? "border-red-500" : "border-gray-300"
                      } ${formMode === "view" ? "bg-gray-50" : ""}`}
                      value={formData.customer?.id || ""}
                      onChange={handleCustomerChange}
                      disabled={formMode === "view" || isSubmitting}
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.customer_name} - {customer.area},{" "}
                          {customer.state} - {customer.pincode}
                        </option>
                      ))}
                    </select>
                    {errors.customer && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.customer}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Place of Supply <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.place_of_supply
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${formMode === "view" ? "bg-gray-50" : ""}`}
                      value={formData.place_of_supply}
                      onChange={handlePlaceOfSupplyChange}
                      disabled={formMode === "view" || isSubmitting}
                      placeholder="Enter state (e.g., Kerala, Tamil Nadu)"
                    />

                    {formData.place_of_supply && (
                      <div
                        className={`mt-2 p-3 rounded-lg flex items-start gap-2 ${
                          taxTreatment.isIntraState
                            ? "bg-green-50 border border-green-200"
                            : "bg-blue-50 border border-blue-200"
                        }`}
                      >
                        <Info
                          className={`w-4 h-4 mt-0.5 ${
                            taxTreatment.isIntraState
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        />
                        <div>
                          <p
                            className={`text-xs font-medium ${
                              taxTreatment.isIntraState
                                ? "text-green-800"
                                : "text-blue-800"
                            }`}
                          >
                            {taxTreatment.label}
                          </p>
                          <p
                            className={`text-xs ${
                              taxTreatment.isIntraState
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {taxTreatment.description}
                          </p>
                        </div>
                      </div>
                    )}

                    {errors.place_of_supply && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.place_of_supply}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quote Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.quote_number
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${formMode === "view" ? "bg-gray-50" : ""}`}
                      value={formData.quote_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          quote_number: e.target.value,
                        })
                      }
                      disabled={formMode === "view" || isSubmitting}
                    />
                    {errors.quote_number && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.quote_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reference Number
                    </label>
                    <input
                      type="text"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent border-gray-300 ${
                        formMode === "view" ? "bg-gray-50" : ""
                      }`}
                      value={formData.reference_number}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reference_number: e.target.value,
                        })
                      }
                      disabled={formMode === "view" || isSubmitting}
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quote Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.quote_date ? "border-red-500" : "border-gray-300"
                      } ${formMode === "view" ? "bg-gray-50" : ""}`}
                      value={formData.quote_date}
                      onChange={(e) =>
                        setFormData({ ...formData, quote_date: e.target.value })
                      }
                      disabled={formMode === "view" || isSubmitting}
                    />
                    {errors.quote_date && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.quote_date}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.expiry_date
                          ? "border-red-500"
                          : "border-gray-300"
                      } ${formMode === "view" ? "bg-gray-50" : ""}`}
                      value={formData.expiry_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          expiry_date: e.target.value,
                        })
                      }
                      disabled={formMode === "view" || isSubmitting}
                    />
                    {errors.expiry_date && (
                      <p className="mt-1 text-xs text-red-600">
                        {errors.expiry_date}
                      </p>
                    )}
                  </div>

                  {formMode !== "add" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        disabled={formMode === "view" || isSubmitting}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    Items
                    {formData.place_of_supply && (
                      <span
                        className={`ml-2 text-sm font-normal ${
                          taxTreatment.isIntraState
                            ? "text-green-600"
                            : "text-blue-600"
                        }`}
                      >
                        ({taxTreatment.label})
                      </span>
                    )}
                  </h3>
                  {formMode !== "view" && (
                    <button
                      onClick={addItemRow}
                      disabled={isSubmitting || itemsLoading}
                      className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
                    >
                      <Plus size={16} />
                      Add Item
                    </button>
                  )}
                </div>

                {errors.items && (
                  <p className="text-red-500 text-xs mb-2">{errors.items}</p>
                )}

                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item <span className="text-red-500">*</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty <span className="text-red-500">*</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate (₹) <span className="text-red-500">*</span>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          GST %
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total (₹)
                        </th>
                        {formMode !== "view" && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Action
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {formData.items.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <select
                              className={`w-full min-w-[200px] px-2 py-1.5 border rounded text-sm ${
                                errors[`item_${index}`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } ${formMode === "view" ? "bg-gray-50" : ""}`}
                              value={row.item_id}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "item_id",
                                  e.target.value,
                                )
                              }
                              disabled={
                                formMode === "view" ||
                                isSubmitting ||
                                itemsLoading
                              }
                            >
                              <option value="">Select item</option>
                              {items.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} - ₹
                                  {parseFloat(item.selling_price).toFixed(2)}
                                </option>
                              ))}
                            </select>
                            {errors[`item_${index}`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`item_${index}`]}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <input
                                type="text"
                                className={`w-full min-w-[200px] px-2 py-1.5 border border-gray-300 rounded text-sm ${
                                  formMode === "view" ? "bg-gray-50" : ""
                                }`}
                                value={row.description || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                disabled={formMode === "view" || isSubmitting}
                                placeholder="Item description..."
                              />
                              {row.item_id && formMode !== "view" && (
                                <div className="absolute right-2 top-2 text-xs text-gray-400">
                                  <Edit3 size={14} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              className={`w-20 px-2 py-1.5 border rounded text-sm text-center ${
                                errors[`quantity_${index}`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } ${formMode === "view" ? "bg-gray-50" : ""}`}
                              value={row.quantity || ""}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                // Remove leading zeros but keep as string for input
                                const formattedValue =
                                  removeLeadingZeros(rawValue);
                                handleItemChange(
                                  index,
                                  "quantity",
                                  formattedValue,
                                );
                              }}
                              onBlur={(e) => {
                                // Ensure it's a valid number on blur
                                const numValue =
                                  parseFloat(e.target.value) || 0;
                                if (numValue !== row.quantity) {
                                  handleItemChange(index, "quantity", numValue);
                                }
                              }}
                              disabled={formMode === "view" || isSubmitting}
                              min="1"
                              step="1"
                            />
                            {errors[`quantity_${index}`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`quantity_${index}`]}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              className={`w-28 px-2 py-1.5 border rounded text-sm text-center ${
                                errors[`rate_${index}`]
                                  ? "border-red-500"
                                  : "border-gray-300"
                              } ${formMode === "view" ? "bg-gray-50" : ""}`}
                              value={row.rate || ""}
                              onChange={(e) => {
                                const rawValue = e.target.value;
                                // Remove leading zeros but keep as string for input
                                const formattedValue =
                                  removeLeadingZeros(rawValue);
                                handleItemChange(index, "rate", formattedValue);
                              }}
                              onBlur={(e) => {
                                // Ensure it's a valid number on blur
                                const numValue =
                                  parseFloat(e.target.value) || 0;
                                if (numValue !== row.rate) {
                                  handleItemChange(index, "rate", numValue);
                                }
                              }}
                              disabled={formMode === "view" || isSubmitting}
                              min="0"
                              step="0.01"
                            />
                            {errors[`rate_${index}`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`rate_${index}`]}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              className="w-20 px-2 py-1.5 border border-gray-300 rounded text-sm text-center"
                              value={row.gst_rate}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "gst_rate",
                                  e.target.value,
                                )
                              }
                              disabled={formMode === "view" || isSubmitting}
                            >
                              {gstRates.map((rate) => (
                                <option key={rate} value={rate}>
                                  {rate}%
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 font-medium">
                            ₹{row.total?.toFixed(2)}
                          </td>
                          {formMode !== "view" && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => removeItemRow(index)}
                                disabled={isSubmitting}
                                className="p-1 text-red-600 hover:text-red-800 rounded-full hover:bg-red-50"
                                title="Remove Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terms, Notes, and Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Terms and Conditions
                    </label>
                    <textarea
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                        formMode === "view" ? "bg-gray-50" : ""
                      }`}
                      rows="4"
                      value={formData.terms_conditions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          terms_conditions: e.target.value,
                        })
                      }
                      disabled={formMode === "view" || isSubmitting}
                      placeholder="Enter terms and conditions..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm ${
                        formMode === "view" ? "bg-gray-50" : ""
                      }`}
                      rows="3"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      disabled={formMode === "view" || isSubmitting}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Attachment
                    </label>
                    <div className="flex items-center gap-3">
                      <label
                        className={`cursor-pointer px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2 ${
                          formMode === "view"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Upload className="w-4 h-4" />
                        Choose File
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          disabled={formMode === "view" || isSubmitting}
                        />
                      </label>
                      {attachedFile && (
                        <span className="text-sm text-gray-600">
                          {attachedFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-4">
                    Summary
                  </h3>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">
                        ₹{formData.subtotal.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Discount:</span>
                      <div className="flex items-center gap-2">
                        {formMode !== "view" && (
                          <>
                            <select
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              value={formData.discount_type}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  discount_type: e.target.value,
                                }))
                              }
                              disabled={formMode === "view" || isSubmitting}
                            >
                              <option value="percentage">%</option>
                              <option value="fixed">₹</option>
                            </select>
                            <input
                              type="number"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                              value={formData.discount_value || ""}
                              onChange={(e) =>
                                handleDiscountValueChange(e.target.value)
                              }
                              onBlur={(e) => {
                                const numValue =
                                  parseFloat(e.target.value) || 0;
                                if (numValue !== formData.discount_value) {
                                  setFormData((prev) => ({
                                    ...prev,
                                    discount_value: numValue,
                                  }));
                                }
                              }}
                              disabled={formMode === "view" || isSubmitting}
                              min="0"
                              step="0.01"
                            />
                          </>
                        )}
                        <span className="font-medium w-20 text-right">
                          ₹{formData.discount_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Shipping Charge:</span>
                      {formMode !== "view" ? (
                        <input
                          type="number"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                          value={formData.shipping_charge || ""}
                          onChange={(e) =>
                            handleShippingChargeChange(e.target.value)
                          }
                          onBlur={(e) => {
                            const numValue = parseFloat(e.target.value) || 0;
                            if (numValue !== formData.shipping_charge) {
                              setFormData((prev) => ({
                                ...prev,
                                shipping_charge: numValue,
                              }));
                            }
                          }}
                          disabled={formMode === "view" || isSubmitting}
                          min="0"
                          step="0.01"
                        />
                      ) : (
                        <span className="font-medium">
                          ₹{formData.shipping_charge.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Service Charge Section */}
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Settings size={14} className="text-gray-500" />
                        Service Charge:
                      </span>
                      <div className="flex items-center gap-2">
                        {formMode !== "view" && (
                          <>
                            <select
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              value={formData.service_charge_type}
                              onChange={(e) =>
                                handleServiceChargeChange(
                                  "service_charge_type",
                                  e.target.value,
                                )
                              }
                              disabled={formMode === "view" || isSubmitting}
                            >
                              {SERVICE_CHARGE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            {formData.service_charge_type !== "none" && (
                              <input
                                type="number"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                                value={formData.service_charge_value || ""}
                                onChange={(e) =>
                                  handleServiceChargeChange(
                                    "service_charge_value",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) => {
                                  const numValue =
                                    parseFloat(e.target.value) || 0;
                                  if (
                                    numValue !== formData.service_charge_value
                                  ) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      service_charge_value: numValue,
                                    }));
                                  }
                                }}
                                disabled={formMode === "view" || isSubmitting}
                                min="0"
                                step="0.01"
                              />
                            )}
                          </>
                        )}
                        <span className="font-medium w-20 text-right">
                          ₹{formData.service_charge_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {errors.service_charge && (
                      <p className="text-red-500 text-xs">
                        {errors.service_charge}
                      </p>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Adjustment:</span>
                      {formMode !== "view" ? (
                        <input
                          type="number"
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                          value={formData.adjustment || ""}
                          onChange={(e) =>
                            handleAdjustmentChange(e.target.value)
                          }
                          onBlur={(e) => {
                            const numValue = parseFloat(e.target.value) || 0;
                            if (numValue !== formData.adjustment) {
                              setFormData((prev) => ({
                                ...prev,
                                adjustment: numValue,
                              }));
                            }
                          }}
                          disabled={formMode === "view" || isSubmitting}
                          step="0.01"
                        />
                      ) : (
                        <span className="font-medium">
                          ₹{formData.adjustment.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="border-t border-gray-200 my-2"></div>

                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxable Amount:</span>
                      <span className="font-medium">
                        ₹{formData.taxable_amount.toFixed(2)}
                      </span>
                    </div>

                    {taxTreatment.isInterState && formData.total_igst > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">IGST:</span>
                        <span className="font-medium">
                          ₹{formData.total_igst.toFixed(2)}
                        </span>
                      </div>
                    )}

                    {taxTreatment.isIntraState && (
                      <>
                        {formData.total_cgst > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">CGST:</span>
                            <span className="font-medium">
                              ₹{formData.total_cgst.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {formData.total_sgst > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">SGST:</span>
                            <span className="font-medium">
                              ₹{formData.total_sgst.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="border-t border-gray-200 my-2"></div>

                    <div className="flex justify-between text-base font-bold">
                      <span>Grand Total:</span>
                      <span>₹{formData.grand_total.toFixed(2)}</span>
                    </div>

                    {formData.place_of_supply && (
                      <div
                        className={`p-2 rounded-lg mt-2 ${
                          taxTreatment.isIntraState
                            ? "bg-green-50"
                            : "bg-blue-50"
                        }`}
                      >
                        <p
                          className={`text-xs ${
                            taxTreatment.isIntraState
                              ? "text-green-700"
                              : "text-blue-700"
                          }`}
                        >
                          <strong>Transaction Type:</strong>{" "}
                          {taxTreatment.label}
                        </p>
                      </div>
                    )}

                    {formData.service_charge_type !== "none" &&
                      formData.service_charge_amount > 0 && (
                        <div className="p-2 rounded-lg mt-2 bg-purple-50 border border-purple-200">
                          <p className="text-xs text-purple-700">
                            <strong>Service Charge:</strong>{" "}
                            {formData.service_charge_type === "fixed"
                              ? `₹${formData.service_charge_value.toFixed(2)} fixed`
                              : `${formData.service_charge_value}% (₹${formData.service_charge_amount.toFixed(2)})`}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div>
              {formMode === "view" && (
                <button
                  onClick={() => setFormMode("edit")}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <Edit3 size={16} />
                  Edit Quotation
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCancelForm}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              {formMode !== "view" && (
                <button
                  onClick={handleSaveQuotation}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 min-w-[160px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {formMode === "add" ? "Creating..." : "Updating..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>
                        {formMode === "add" ? "Create" : "Update"} Quotation
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quotes;
