// src/pages/Sales/Invoice.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axiosInstance from "@/API/axiosInstance";
import {
  Plus,
  X,
  Edit,
  Trash2,
  ChevronLeft,
  RotateCcw,
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  User,
  Save,
  LogIn,
  Eye,
  FileText
} from "lucide-react";
import toast from "react-hot-toast";

// Helper function
const format = (num) => Number(num || 0).toFixed(2);

// GST options that match backend - complete list with all rates
const gstOptions = [
  { value: "GST_0", label: "No Tax (0%)", rate: 0 },
  { value: "GST_0_25", label: "0.25% GST", rate: 0.25 },
  { value: "GST_3", label: "3% GST", rate: 3 },
  { value: "GST_5", label: "5% GST", rate: 5 },
  { value: "GST_12", label: "12% GST", rate: 12 },
  { value: "GST_18", label: "18% GST", rate: 18 },
  { value: "GST_28", label: "28% GST", rate: 28 },
];

const getStatusBadge = (status) => {
  const base = "px-3 py-1 text-xs rounded-full font-semibold border";
  switch (status) {
    case "PAID":
      return base + " bg-green-50 text-green-700 border-green-300";
    case "PARTIALLY_PAID":
      return base + " bg-yellow-50 text-yellow-700 border-yellow-300";
    case "DRAFT":
      return base + " bg-gray-50 text-gray-700 border-gray-300";
    case "OVERDUE":
      return base + " bg-red-50 text-red-700 border-red-300";
    case "SENT":
      return base + " bg-blue-50 text-blue-700 border-blue-300";
    case "CANCELLED":
      return base + " bg-gray-200 text-gray-700 border-gray-400";
    default:
      return base + " bg-blue-50 text-blue-700 border-blue-300";
  }
};

// Initial state for a new invoice - REMOVED customer_name
const initialInvoiceState = {
  id: null,
  customer: null,
  customer_phone: "",
  customer_email: "",
  customer_address: "",
  customer_state: "Kerala",
  customer_city: "",
  customer_pincode: "",
  assign_type: "shop",
  assign_id: null,
  assign_name: "",
  assign_shop_type: null,
  invoice_number: "",
  status: "DRAFT",
  invoice_date: new Date().toISOString().split("T")[0],
  due_date: "",
  discount_type: "PERCENT",
  discount_value: 0,
  terms_conditions: `1. Payment Terms: Payment is due within 15 days of invoice date.
2. Late Payment: 1.5% monthly interest on overdue amounts.
3. Delivery: Delivery subject to stock availability.
4. Warranty: 1-year warranty from invoice date.
5. Jurisdiction: Disputes subject to Kerala jurisdiction.`,
  items: [
    {
      item_id: null,
      item_name: "",
      qty: 1,
      rate: 0,
      description: "",
      service_charge_type: "AMOUNT",
      service_charge_value: 0,
      service_charge_amount: 0,
      gst_treatment: "GST_5",
    },
  ],
  sub_total: 0,
  service_charge_total: 0,
  taxable_amount: 0,
  gst_breakdown: {},
  grand_total: 0,
  supply_type: "INTRASTATE",
  gst_mode: "CGST+SGST",
  pdf_url: "",
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-100 border-green-300 text-green-800"
      : type === "error"
        ? "bg-red-100 border-red-300 text-red-800"
        : "bg-blue-100 border-blue-300 text-blue-800";

  const icon =
    type === "success" ? (
      <CheckCircle size={20} />
    ) : type === "error" ? (
      <AlertCircle size={20} />
    ) : (
      <Info size={20} />
    );

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg flex items-center gap-3 ${bgColor}`}
      style={{ animation: "slideIn 0.3s ease-out" }}
    >
      {icon}
      <div className="font-medium">{message}</div>
      <button
        onClick={onClose}
        className="ml-4 text-gray-500 hover:text-gray-700"
      >
        <X size={18} />
      </button>
    </div>
  );
};

const Invoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const complaintData = location.state?.complaintData;
  const quotationData = location.state?.quotationData;

  const [currentScreen, setCurrentScreen] = useState("list");
  const [editIndex, setEditIndex] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [shops, setShops] = useState([]);
  const [growtags, setGrowtags] = useState([]);
  const [quickSearch, setQuickSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const [invoiceData, setInvoiceData] = useState(initialInvoiceState);
  const [customerComplaints, setCustomerComplaints] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // Validation states
  const [errors, setErrors] = useState({});
  const [toastMsg, setToastMsg] = useState({
    show: false,
    message: "",
    type: "",
  });
  // Helper function to get customer name from ID
  const getCustomerName = (customerId) => {
    if (!customerId) return "Unknown Customer";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.customer_name || "Unknown Customer";
  };
  // Toggle single invoice checkbox
  const toggleInvoiceSelection = (id) => {
    setSelectedInvoices((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // Select all invoices
  const toggleSelectAll = () => {
    if (selectedInvoices.length === filteredInvoices.length) {
      setSelectedInvoices([]);
    } else {
      setSelectedInvoices(filteredInvoices.map((inv) => inv.id));
    }
  };

  // Check authentication status
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    setIsAuthenticated(!!token);

    if (!token) {
      showToast("Please log in to view invoices", "info");
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchCustomers();
      fetchItems();
      fetchShops();
      fetchGrowtags();
      fetchInvoices();
    }
  }, [isAuthenticated]);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get("/api/customers/");
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error("Fetch customers error:", error);
    }
  };

  // Fetch items from API
  const fetchItems = async () => {
    try {
      const response = await axiosInstance.get("/zoho/local-items/");
      const data = response.data;
      setItems(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error("Fetch items error:", error);
    }
  };

  // Fetch shops from API
  const fetchShops = async () => {
    try {
      const response = await axiosInstance.get("/api/shops/");
      const data = response.data;
      setShops(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error("Fetch shops error:", error);
    }
  };

  // Fetch growtags from API
  const fetchGrowtags = async () => {
    try {
      const response = await axiosInstance.get("/api/growtags/");
      const data = response.data;
      setGrowtags(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error("Fetch growtags error:", error);
    }
  };

  // Generate invoice number
  const generateInvoiceNumber = () => {
    const lastInvoice = invoices[0];
    let lastNumber = 0;

    if (lastInvoice && lastInvoice.invoice_number) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) {
        lastNumber = parseInt(match[1]);
      }
    }

    const newNumber = (lastNumber + 1).toString().padStart(4, "0");
    return `INV-${newNumber}`;
  };

  // Fetch invoices from API - REMOVED customer_name from state
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/zoho/local-invoices/");
      const data = response.data;
      const invoicesList = Array.isArray(data) ? data : data?.results || [];

      // Transform API data to frontend format - store only customer ID
      const transformed = invoicesList.map((inv) => {
        const safeInv = inv || {};

        // Determine assign type and name
        let assign_type = null;
        let assign_id = null;
        let assign_name = null;
        let assign_shop_type = null;

        if (safeInv.assigned_shop) {
          assign_type = "shop";
          assign_id = safeInv.assigned_shop;
          assign_name = safeInv.assigned_shop_name || "";
          assign_shop_type = safeInv.assigned_shop_type || null;
        } else if (safeInv.assigned_growtag) {
          assign_type = "growtag";
          assign_id = safeInv.assigned_growtag;
          assign_name = safeInv.assigned_growtag_name || "";
        }

        // Safely transform lines
        const lines = Array.isArray(safeInv.lines) ? safeInv.lines : [];
        const items = lines.map((line) => {
          const safeLine = line || {};
          return {
            id: safeLine.id || null,
            item_id: safeLine.item || null,
            item_name: safeLine.item_name || "",
            qty: parseFloat(safeLine.qty) || 0,
            rate: parseFloat(safeLine.rate) || 0,
            description: safeLine.description || "",
            service_charge_type: safeLine.service_charge_type || "AMOUNT",
            service_charge_value:
              parseFloat(safeLine.service_charge_value) || 0,
            service_charge_amount:
              parseFloat(safeLine.service_charge_amount) || 0,
            gst_treatment: safeLine.gst_treatment || "GST_5",
            line_amount: parseFloat(safeLine.line_amount) || 0,
            taxable_amount: parseFloat(safeLine.taxable_amount) || 0,
            line_tax: parseFloat(safeLine.line_tax) || 0,
            line_total: parseFloat(safeLine.line_total) || 0,
          };
        });

        // Store only customer ID, not customer_name
        return {
          id: safeInv.id,
          customer: safeInv.customer,
          customer_phone: safeInv.customer_phone,
          customer_email: safeInv.customer_email,
          customer_address: safeInv.customer_address,
          customer_state: safeInv.customer_state || "Kerala",
          customer_city: safeInv.customer_city,
          customer_pincode: safeInv.customer_pincode,
          assign_type,
          assign_id,
          assign_name,
          assign_shop_type,
          invoice_number: safeInv.invoice_number,
          status: safeInv.status,
          invoice_date: safeInv.invoice_date,
          due_date: safeInv.due_date,
          discount_type: safeInv.discount_type || "PERCENT",
          discount_value: parseFloat(safeInv.discount_value) || 0,
          terms_conditions: safeInv.terms_conditions || "",
          lines: lines,
          items: items,
          sub_total: parseFloat(safeInv.sub_total) || 0,
          service_charge_total: parseFloat(safeInv.service_charge_total) || 0,
          taxable_amount: parseFloat(safeInv.taxable_amount) || 0,
          gst_breakdown: safeInv.gst_breakdown || {},
          grand_total: parseFloat(safeInv.grand_total) || 0,
          supply_type: safeInv.supply_type || "INTRASTATE",
          gst_mode: safeInv.gst_mode || "CGST+SGST",
          pdf_url: safeInv.pdf_url,
          sync_status: safeInv.sync_status,
          last_error: safeInv.last_error,
        };
      });

      setInvoices(transformed);
    } catch (error) {
      console.error("Fetch invoices error:", error);
      if (error.response?.status !== 401 && error.response?.status !== 404) {
        showToast("Failed to load invoices", "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals for display during editing
  const calculatedTotals = useMemo(() => {
    // Calculate line amounts and service charges
    let subTotal = 0;
    let serviceChargeTotal = 0;

    const itemsWithCalculations = invoiceData.items.map((item) => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const lineAmount = qty * rate;
      subTotal += lineAmount;

      // Calculate service charge
      const serviceValue = parseFloat(item.service_charge_value) || 0;
      let serviceAmount = 0;
      if (item.service_charge_type === "PERCENTAGE") {
        serviceAmount = (lineAmount * serviceValue) / 100;
      } else {
        serviceAmount = serviceValue;
      }
      serviceChargeTotal += serviceAmount;

      return {
        ...item,
        line_amount: lineAmount,
        service_charge_amount: serviceAmount,
        taxable_amount: lineAmount + serviceAmount,
      };
    });

    const taxableAmount = subTotal + serviceChargeTotal;

    // Calculate discount
    const discountValue = parseFloat(invoiceData.discount_value) || 0;
    let discountAmount = 0;
    if (invoiceData.discount_type === "PERCENT") {
      discountAmount = (taxableAmount * discountValue) / 100;
    } else {
      discountAmount = discountValue;
    }
    discountAmount = Math.min(discountAmount, taxableAmount);

    const gstBase = Math.max(0, taxableAmount - discountAmount);

    // Calculate GST breakdown
    let totalGST = 0;
    const gstBreakdown = {};

    itemsWithCalculations.forEach((item) => {
      const itemTaxable = item.taxable_amount;
      const proportion = taxableAmount > 0 ? itemTaxable / taxableAmount : 0;
      const itemGstBase = gstBase * proportion;

      // Get GST rate from gst_treatment
      const gstRate = parseFloat(
        (item.gst_treatment || "GST_5").replace("GST_", "").replace("_", "."),
      );

      const gstAmount = (gstRate / 100) * itemGstBase;
      totalGST += gstAmount;

      // Build breakdown
      const rateKey = `GST_${item.gst_treatment?.replace("GST_", "")}`;
      if (!gstBreakdown[rateKey]) {
        gstBreakdown[rateKey] = {
          rate: gstRate.toString(),
          taxable: 0,
          tax: 0,
        };
      }
      gstBreakdown[rateKey].taxable += itemGstBase;
      gstBreakdown[rateKey].tax += gstAmount;
    });

    const grandTotal = gstBase + totalGST;

    return {
      subTotal,
      serviceChargeTotal,
      taxableAmount,
      discountAmount,
      gstBase,
      totalGST,
      grandTotal,
      gstBreakdown,
      itemsWithCalculations,
      isSameState: invoiceData.customer_state === "Kerala",
      gstMode: invoiceData.customer_state === "Kerala" ? "CGST+SGST" : "IGST",
    };
  }, [
    invoiceData.items,
    invoiceData.discount_value,
    invoiceData.discount_type,
    invoiceData.customer_state,
  ]);

  // Handle customer selection change
  const handleCustomerChange = (customerId) => {
    const id = customerId ? parseInt(customerId) : null;
    const customer = customers.find((c) => c.id === id);

    let assign_type = null;
    let assign_id = null;
    let assign_name = "";

    // get complaints
    const complaints = customer?.complaints_history || [];
    setCustomerComplaints(complaints);

    // get latest complaint
    const latestComplaint =
      complaints.length > 0 ? complaints[complaints.length - 1] : null;

    if (latestComplaint?.assigned_to_display) {
      assign_type =
        latestComplaint.assigned_to_display.assign_type === "shop"
          ? "shop"
          : "growtag";

      assign_id = latestComplaint.assigned_to_display.id;
      assign_name = latestComplaint.assigned_to_display.name;
    }

    setInvoiceData({
      ...invoiceData,
      customer: id,
      customer_phone: customer?.customer_phone || "",
      customer_email: customer?.email || "",
      customer_address: customer?.address || "",
      customer_state: customer?.state || "Kerala",
      customer_city: customer?.area || customer?.city || "",
      customer_pincode: customer?.pincode || "",
      assign_type: assign_type || "shop",
      assign_id: assign_id,
      assign_name: assign_name,
    });
  };

  // Handle complaint data
  useEffect(() => {
    if (complaintData && customers.length > 0) {
      const customer = customers.find((c) => c.id === complaintData.customer);
      setInvoiceData((prev) => ({
        ...prev,
        customer: customer?.id || null,
        customer_phone: customer?.customer_phone || "",
        customer_email: customer?.email || "",
        customer_address: customer?.address || "",
        customer_state: customer?.state || "Kerala",
        customer_city: customer?.area || customer?.city || "",
        customer_pincode: customer?.pincode || "",
      }));
      setCurrentScreen("form");
      setEditIndex(null);
    }
  }, [complaintData, customers]);

  // Handle quotation data
  useEffect(() => {
    if (quotationData && customers.length > 0) {
      const customer = customers.find((c) => c.id === quotationData.customer);
      const defaultGst = "GST_5";

      // Transform quotation items
      const items = (quotationData.items || []).map((item) => ({
        item_id: item.item,
        item_name: item.item_name,
        qty: parseFloat(item.quantity),
        rate: parseFloat(item.rate),
        description: item.description || "",
        service_charge_type: item.service_charge_type || "AMOUNT",
        service_charge_value: parseFloat(item.service_charge_value || 0),
        service_charge_amount: 0,
        gst_treatment: item.gst_treatment || defaultGst,
      }));

      setInvoiceData((prev) => ({
        ...prev,
        customer: customer?.id || null,
        customer_phone: customer?.customer_phone || "",
        customer_email: customer?.email || "",
        customer_address: customer?.address || "",
        customer_state: customer?.state || "Kerala",
        customer_city: customer?.area || customer?.city || "",
        customer_pincode: customer?.pincode || "",
        invoice_number: `INV-${quotationData.quote_number?.split("-").pop() || String(invoices.length + 1).padStart(4, "0")}`,
        invoice_date:
          quotationData.quote_date || new Date().toISOString().split("T")[0],
        due_date: quotationData.expiry_date || "",
        items: items,
        discount_type: quotationData.discount_type || "PERCENT",
        discount_value: parseFloat(quotationData.discount_value || 0),
        terms_conditions:
          quotationData.terms_conditions || prev.terms_conditions,
      }));

      setCurrentScreen("form");
      setEditIndex(null);
    }
  }, [quotationData, customers, invoices.length]);

  // Show toast notification
  const showToast = (message, type = "error") => {
    setToastMsg({ show: true, message, type });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!invoiceData.customer) {
      newErrors.customer = "Customer is required";
    } else if (isNaN(parseInt(invoiceData.customer))) {
      newErrors.customer = "Invalid customer selected";
    }

    if (!invoiceData.invoice_number) {
      newErrors.invoice_number = "Invoice number is required";
    }

    if (!invoiceData.invoice_date) {
      newErrors.invoice_date = "Invoice date is required";
    }

    if (
      invoiceData.due_date &&
      new Date(invoiceData.due_date) < new Date(invoiceData.invoice_date)
    ) {
      newErrors.due_date = "Due date cannot be before invoice date";
    }

    if (invoiceData.items.length === 0) {
      newErrors.items = "At least one item is required";
    } else {
      invoiceData.items.forEach((item, index) => {
        if (!item.item_id) {
          newErrors[`item_${index}`] = "Item is required";
        }
        if (!item.qty || item.qty <= 0) {
          newErrors[`qty_${index}`] = "Valid quantity required";
        }
        if (!item.rate || item.rate < 0) {
          newErrors[`rate_${index}`] = "Valid rate required";
        }
        if (!item.gst_treatment) {
          newErrors[`gst_${index}`] = "GST rate is required";
        }
      });
    }

    if (invoiceData.discount_value < 0) {
      newErrors.discount = "Discount cannot be negative";
    }
    if (
      invoiceData.discount_type === "PERCENT" &&
      invoiceData.discount_value > 100
    ) {
      newErrors.discount = "Discount percentage cannot exceed 100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Transform to API format - with proper data formatting
  const transformToAPIFormat = () => {
    // Format numbers to 2 decimal places as strings
    const formatNumber = (num) => {
      const value = parseFloat(num) || 0;
      return value.toFixed(2);
    };

    const discountValue = parseFloat(invoiceData.discount_value) || 0;

    // Prepare lines payload with validation
    const lines_payload = invoiceData.items
      .filter((item) => item.item_id) // Only include items with valid item_id
      .map((item) => ({
        item_id: parseInt(item.item_id),
        qty: parseFloat(item.qty) || 1,
        rate: formatNumber(parseFloat(item.rate) || 0),
        description: item.description || "",
        service_charge_type: item.service_charge_type || "AMOUNT",
        service_charge_value: formatNumber(
          parseFloat(item.service_charge_value) || 0,
        ),
        gst_treatment: item.gst_treatment || "GST_5",
      }));

    const apiData = {
      customer: parseInt(invoiceData.customer),
      status: invoiceData.status || "DRAFT",
      invoice_date: invoiceData.invoice_date,
      due_date: invoiceData.due_date || null,
      discount_type: invoiceData.discount_type || "PERCENT",
      discount_value: formatNumber(discountValue),
      terms_conditions: invoiceData.terms_conditions || "",
      lines_payload: lines_payload,
    };

    // Add assign fields if selected
    if (invoiceData.assign_type === "shop" && invoiceData.assign_id) {
      apiData.assigned_shop = parseInt(invoiceData.assign_id);
    } else if (invoiceData.assign_type === "growtag" && invoiceData.assign_id) {
      apiData.assigned_growtag = parseInt(invoiceData.assign_id);
    }

    return apiData;
  };

  // Save invoice
  const saveInvoice = async () => {
    if (!validateForm()) {
      showToast("Please fix validation errors", "error");
      return;
    }

    // Check if there are any valid items
    const validItems = invoiceData.items.filter((item) => item.item_id);
    if (validItems.length === 0) {
      showToast("At least one valid item is required", "error");
      return;
    }

    setIsLoading(true);
    try {
      const apiData = transformToAPIFormat();

      let response;
      if (editIndex !== null && invoiceData.id) {
        response = await axiosInstance.put(
          `/zoho/local-invoices/${invoiceData.id}/`,
          apiData,
        );
      } else {
        response = await axiosInstance.post("/zoho/local-invoices/", apiData);
      }

      showToast(
        `Invoice ${editIndex !== null ? "updated" : "created"} successfully!`,
        "success",
      );
      await fetchInvoices();
      exitScreen();
    } catch (error) {
      console.error("Save invoice error:", error);

      if (error.response) {
        console.error("Error status:", error.response.status);
        console.error("Error data:", error.response.data);

        if (error.response.status === 400) {
          const errorData = error.response.data;
          let errorMessage = "Validation failed";

          if (typeof errorData === "object") {
            const errors = [];
            Object.keys(errorData).forEach((key) => {
              if (Array.isArray(errorData[key])) {
                errors.push(`${key}: ${errorData[key].join(", ")}`);
              } else if (typeof errorData[key] === "object") {
                Object.keys(errorData[key]).forEach((subKey) => {
                  errors.push(`${key}.${subKey}: ${errorData[key][subKey]}`);
                });
              } else {
                errors.push(`${key}: ${errorData[key]}`);
              }
            });
            errorMessage = errors.join("\n");
          }

          showToast(errorMessage, "error");
        } else {
          showToast(
            error.response.data?.message || "Failed to save invoice",
            "error",
          );
        }
      } else if (error.request) {
        showToast(
          "No response from server. Please check your connection.",
          "error",
        );
      } else {
        showToast("Error: " + error.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Edit invoice - REMOVED customer_name from state
  const handleEdit = (invoice) => {
    // Don't copy customer_name from invoice - it will be derived from customers list
    const { customer_name, ...invoiceWithoutName } = invoice;

    setInvoiceData({
      ...invoiceWithoutName,
      items: invoice.items || [],
    });
    setEditIndex(invoices.findIndex((i) => i.id === invoice.id));
    setCurrentScreen("form");
  };

  const handleDelete = (id) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete this invoice?
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
                const loadingToast = toast.loading("Deleting invoice...");

                try {
                  await axiosInstance.delete(`/zoho/local-invoices/${id}/`);

                  await fetchInvoices();

                  toast.success("Invoice deleted successfully", {
                    id: loadingToast,
                  });
                } catch (error) {
                  console.error("Delete invoice error:", error);

                  toast.error("Error deleting invoice", {
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

  // Open PDF in new tab using axios
  const openPDF = async (url) => {
    if (!url) return;

    setPdfLoading(true);
    try {
      const response = await axiosInstance.get(url, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
    } catch (error) {
      console.error("Error opening PDF:", error);
      showToast("Failed to open PDF", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  // Add item
  const addItem = () => {
    const newItem = {
      item_id: null,
      item_name: "",
      qty: 1,
      rate: 0,
      description: "",
      service_charge_type: "AMOUNT",
      service_charge_value: 0,
      service_charge_amount: 0,
      gst_treatment: "GST_5",
    };
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, newItem],
    });
  };

  // Update item
  const updateItem = (index, field, value) => {
    const updatedItems = [...invoiceData.items];

    if (field === "item_id") {
      const selectedItem = items.find((i) => i.id === parseInt(value));

      updatedItems[index] = {
        ...updatedItems[index],
        item_id: parseInt(value),
        item_name: selectedItem?.name || "",
        rate: parseFloat(selectedItem?.selling_price) || 0,

        // auto fill description from items API
        description:
          updatedItems[index].description ||
          selectedItem?.sales_description ||
          "",

        // optional: auto fill GST if available
        gst_treatment:
          selectedItem?.gst_treatment?.replace("IGST", "GST") || "GST_5",

        // optional: auto fill service charge
        service_charge_value: parseFloat(selectedItem?.service_charge) || 0,
      };
    } else if (field === "qty" || field === "rate") {
      updatedItems[index][field] = parseFloat(value) || 0;
    } else if (field === "service_charge_value") {
      updatedItems[index].service_charge_value = parseFloat(value) || 0;

      // Calculate service charge amount immediately for UI
      const itemAmount = updatedItems[index].qty * updatedItems[index].rate;
      if (updatedItems[index].service_charge_type === "PERCENTAGE") {
        updatedItems[index].service_charge_amount =
          (itemAmount * (parseFloat(value) || 0)) / 100;
      } else {
        updatedItems[index].service_charge_amount = parseFloat(value) || 0;
      }
    } else if (field === "service_charge_type") {
      updatedItems[index].service_charge_type = value;

      // Recalculate service charge amount when type changes
      const itemAmount = updatedItems[index].qty * updatedItems[index].rate;
      if (value === "PERCENTAGE") {
        updatedItems[index].service_charge_amount =
          (itemAmount * (updatedItems[index].service_charge_value || 0)) / 100;
      } else {
        updatedItems[index].service_charge_amount =
          updatedItems[index].service_charge_value || 0;
      }
    } else {
      updatedItems[index][field] = value;
    }

    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Remove item
  const removeItem = (index) => {
    if (invoiceData.items.length === 1) {
      showToast("At least one item is required", "error");
      return;
    }
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items: updatedItems });
  };

  // Exit screen
  const exitScreen = () => {
    setCurrentScreen("list");
    setEditIndex(null);
    setInvoiceData(initialInvoiceState);
    setErrors({});
  };

  // Handle login redirect
  const handleLogin = () => {
    navigate("/login");
  };

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    const search = quickSearch.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoice_number?.toLowerCase().includes(search) ||
        (getCustomerName(inv.customer) || "").toLowerCase().includes(search) ||
        inv.status?.toLowerCase().includes(search),
    );
  }, [invoices, quickSearch, customers]);

  // Add animation style
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="text-blue-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to access and manage your invoices.
          </p>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 font-medium"
          >
            <LogIn size={18} />
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8 font-sans">
      {toastMsg.show && (
        <Toast
          message={toastMsg.message}
          type={toastMsg.type}
          onClose={() => setToastMsg({ show: false, message: "", type: "" })}
        />
      )}

      {/* LIST VIEW */}
      {currentScreen === "list" && (
        <>
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                Invoices
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your sales invoices
              </p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setInvoiceData({
                    ...initialInvoiceState,
                    invoice_number: generateInvoiceNumber(),
                    items: [
                      {
                        item_id: null,
                        item_name: "",
                        qty: 1,
                        rate: 0,
                        description: "",
                        service_charge_type: "AMOUNT",
                        service_charge_value: 0,
                        service_charge_amount: 0,
                        gst_treatment: "GST_5",
                      },
                    ],
                  });

                  setCurrentScreen("form");
                }}
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Plus size={18} /> New Invoice
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search invoices..."
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {selectedInvoices.length > 0 && (
            <div className="mb-4 flex gap-3">
              <button
                onClick={bulkDeleteInvoices}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete Selected ({selectedInvoices.length})
              </button>
            </div>
          )}

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                <p className="text-gray-500">Loading invoices...</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {quickSearch ? "No invoices found" : "No invoices yet"}
              </div>
            ) : (
              filteredInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-lg shadow p-4 border"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-blue-600 font-bold">
                        {inv.invoice_number}
                      </div>
                      <div className="font-medium mt-1">
                        {getCustomerName(inv.customer)}
                      </div>
                      {inv.assign_name && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                          {inv.assign_type === "shop" ? "🏪" : "🏷️"}
                          {inv.assign_name}
                        </div>
                      )}
                    </div>
                    <span className={getStatusBadge(inv.status)}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <div className="text-gray-500">Date</div>
                      <div>{inv.invoice_date}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Due Date</div>
                      <div>{inv.due_date || "N/A"}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${inv.customer_state === "Kerala" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                    >
                      <MapPin size={12} />
                      {inv.customer_state}
                    </div>
                    <div className="font-bold text-gray-800">
                      ₹{format(inv.grand_total)}
                    </div>
                  </div>

                  <div className="flex justify-between pt-3 border-t">
                    <button
                      onClick={() => handleEdit(inv)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    {inv.pdf_url && (
                      <button
                        onClick={() => openPDF(inv.pdf_url)}
                        disabled={pdfLoading}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                        title="View PDF"
                      >
                        {pdfLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(inv.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredInvoices.length > 0 &&
                          selectedInvoices.length === filteredInvoices.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Invoice #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Assign To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Due Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        <Loader2
                          className="animate-spin mx-auto mb-2"
                          size={24}
                        />
                        Loading invoices...
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        {quickSearch ? "No invoices found" : "No invoices yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedInvoices.includes(inv.id)}
                            onChange={() => toggleInvoiceSelection(inv.id)}
                          />
                        </td>
                        <td className="px-6 py-4 font-medium text-blue-600">
                          {inv.invoice_number}
                        </td>
                        <td className="px-6 py-4">
                          {getCustomerName(inv.customer)}
                        </td>
                        <td className="px-6 py-4">
                          {inv.assign_name ? (
                            <div className="flex items-center gap-1">
                              <span>
                                {inv.assign_type === "shop" ? "🏪" : "🏷️"}
                              </span>
                              <span>{inv.assign_name}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {inv.invoice_date}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {inv.due_date || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${inv.customer_state === "Kerala" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                          >
                            <MapPin size={12} />
                            {inv.customer_state}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={getStatusBadge(inv.status)}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold">
                          ₹{format(inv.grand_total)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(inv)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            {inv.pdf_url && (
                              <button
                                onClick={() => openPDF(inv.pdf_url)}
                                disabled={pdfLoading}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                                title="View PDF"
                              >
                                {pdfLoading ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <Eye size={16} />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(inv.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} />
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
        </>
      )}

      {/* FORM VIEW */}
      {currentScreen === "form" && (
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={exitScreen}
              className="flex items-center text-blue-600 hover:text-blue-800 gap-1"
            >
              <ChevronLeft size={20} /> Back to Invoices
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-600" size={20} />
                  <h4 className="font-bold text-gray-800">
                    Please fix the following errors:
                  </h4>
                </div>
                <ul className="list-disc pl-5 text-sm text-red-700">
                  {Object.entries(errors).map(([key, msg]) => (
                    <li key={key}>{msg}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Customer Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  value={invoiceData.customer || ""}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg ${errors.customer ? "border-red-500" : "border-gray-300"}`}
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer_name} - {c.customer_phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unified Assign Field */}
              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">
                  Assign To
                </label>
                <div className="flex gap-2">
                  <select
                    value={invoiceData.assign_type}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        assign_type: e.target.value,
                        assign_id: null,
                        assign_name: "",
                      })
                    }
                    className="w-1/3 px-3 py-2 border rounded-lg bg-gray-50"
                  >
                    <option value="shop">Shop</option>
                    <option value="growtag">Growtag</option>
                  </select>
                  <select
                    value={invoiceData.assign_id || ""}
                    onChange={(e) => {
                      const id = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      const item =
                        invoiceData.assign_type === "shop"
                          ? shops.find((s) => s.id === id)
                          : growtags.find((g) => g.id === id);
                      setInvoiceData({
                        ...invoiceData,
                        assign_id: id,
                        assign_name: item?.shopname || item?.name || "",
                      });
                    }}
                    className="w-2/3 px-3 py-2 border rounded-lg"
                  >
                    <option value="">None</option>
                    {invoiceData.assign_type === "shop"
                      ? shops.map((shop) => (
                          <option key={shop.id} value={shop.id}>
                            {shop.shopname}
                          </option>
                        ))
                      : growtags.map((gt) => (
                          <option key={gt.id} value={gt.id}>
                            {gt.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={invoiceData.status}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PAID">PAID</option>
                  <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                  <option value="SENT">SENT</option>
                  <option value="OVERDUE">OVERDUE</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">
                  Invoice Number *
                </label>

                <input
                  type="text"
                  value={invoiceData.invoice_number}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      invoice_number: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${
                    errors.invoice_number ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="INV-0001"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">
                  Invoice Date *
                </label>
                <input
                  type="date"
                  value={invoiceData.invoice_date}
                  onChange={(e) =>
                    setInvoiceData({
                      ...invoiceData,
                      invoice_date: e.target.value,
                    })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${errors.invoice_date ? "border-red-500" : "border-gray-300"}`}
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={invoiceData.due_date || ""}
                  min={invoiceData.invoice_date}
                  onChange={(e) =>
                    setInvoiceData({ ...invoiceData, due_date: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-lg ${errors.due_date ? "border-red-500" : "border-gray-300"}`}
                />
              </div>
            </div>

            {/* Customer Details Display */}
            {invoiceData.customer && (
              <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <User size={18} /> Customer Details
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium">
                      {getCustomerName(invoiceData.customer)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium">{invoiceData.customer_phone}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{invoiceData.customer_email}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">State:</span>
                    <p className="font-medium">{invoiceData.customer_state}</p>
                  </div>
                </div>
              </div>
            )}

            {customerComplaints.length > 0 && (
              <div className="mb-6 p-4 bg-yellow-50 rounded-lg border">
                <h4 className="font-semibold mb-3">Customer Complaints</h4>

                {customerComplaints.map((c) => (
                  <div key={c.id} className="border-b py-2 text-sm">
                    <div>
                      <b>Model:</b> {c.phone_model}
                    </div>
                    <div>
                      <b>Issue:</b> {c.issue_details}
                    </div>
                    <div>
                      <b>Status:</b> {c.status}
                    </div>
                    <div>
                      <b>Assigned To:</b> {c.assigned_to_display?.name}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Items Table */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Items</h3>
                <button
                  onClick={addItem}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                >
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {errors.items && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {errors.items}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm">Item</th>
                      <th className="px-4 py-2 text-center text-sm">Qty</th>
                      <th className="px-4 py-2 text-center text-sm">
                        Rate (₹)
                      </th>
                      <th className="px-4 py-2 text-center text-sm">Service</th>
                      <th className="px-4 py-2 text-center text-sm">Tax %</th>
                      <th className="px-4 py-2 text-right text-sm">Amount</th>
                      <th className="px-4 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr className="border-t">
                          <td className="px-4 py-2">
                            <select
                              value={item.item_id || ""}
                              onChange={(e) =>
                                updateItem(index, "item_id", e.target.value)
                              }
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              <option value="">Select Item</option>
                              {items.map((i) => (
                                <option key={i.id} value={i.id}>
                                  {i.name}
                                </option>
                              ))}
                            </select>
                            {errors[`item_${index}`] && (
                              <div className="text-xs text-red-500 mt-1">
                                {errors[`item_${index}`]}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.qty || ""}
                              onChange={(e) =>
                                updateItem(index, "qty", e.target.value)
                              }
                              min="1"
                              className="w-20 px-2 py-1 border rounded text-center text-sm"
                            />
                            {errors[`qty_${index}`] && (
                              <div className="text-xs text-red-500 mt-1">
                                {errors[`qty_${index}`]}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              value={item.rate || ""}
                              onChange={(e) =>
                                updateItem(index, "rate", e.target.value)
                              }
                              min="0"
                              step="0.01"
                              className="w-24 px-2 py-1 border rounded text-right text-sm"
                            />
                            {errors[`rate_${index}`] && (
                              <div className="text-xs text-red-500 mt-1">
                                {errors[`rate_${index}`]}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center border rounded-lg overflow-hidden w-[110px] bg-white">
                              <input
                                type="number"
                                value={item.service_charge_value || ""}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "service_charge_value",
                                    e.target.value,
                                  )
                                }
                                min="0"
                                placeholder="0"
                                className="w-full px-2 py-1.5 text-sm text-right outline-none"
                              />

                              <select
                                value={item.service_charge_type}
                                onChange={(e) =>
                                  updateItem(
                                    index,
                                    "service_charge_type",
                                    e.target.value,
                                  )
                                }
                                className="px-2 py-1.5 text-sm bg-gray-100 border-l outline-none cursor-pointer"
                              >
                                <option value="AMOUNT">₹</option>
                                <option value="PERCENTAGE">%</option>
                              </select>
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <select
                              value={item.gst_treatment || "GST_5"}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "gst_treatment",
                                  e.target.value,
                                )
                              }
                              className="w-full px-2 py-1 border rounded text-sm"
                            >
                              {gstOptions.map((option, idx) => (
                                <option key={idx} value={option.value}>
                                  {option.rate}%
                                </option>
                              ))}
                            </select>
                            {errors[`gst_${index}`] && (
                              <div className="text-xs text-red-500 mt-1">
                                {errors[`gst_${index}`]}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            ₹{format(item.qty * item.rate)}
                            {item.service_charge_amount > 0 && (
                              <div className="text-xs text-purple-600">
                                + ₹{format(item.service_charge_amount)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X size={16} />
                            </button>
                          </td>
                        </tr>
                        {/* Description row below item column */}
                        <tr className="bg-gray-50">
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              value={item.description || ""}
                              onChange={(e) =>
                                updateItem(index, "description", e.target.value)
                              }
                              placeholder="Item description (optional)"
                              className="w-full px-3 py-1.5 border rounded text-sm bg-white"
                            />
                          </td>

                          {/* empty cells to keep table alignment */}
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoice Summary Card - Using calculated values for real-time updates */}
            <div className="mb-8 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold mb-3 text-gray-700">
                Invoice Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sub Total:</span>
                  <span className="font-medium">
                    ₹{format(calculatedTotals.subTotal)}
                  </span>
                </div>

                {calculatedTotals.serviceChargeTotal > 0 && (
                  <div className="flex justify-between text-sm text-purple-600">
                    <span>Service Charges:</span>
                    <span className="font-bold">
                      + ₹{format(calculatedTotals.serviceChargeTotal)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="font-medium">Taxable Amount:</span>
                  <span className="font-bold">
                    ₹{format(calculatedTotals.taxableAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Discount:</span>
                  <div className="flex w-40">
                    <input
                      type="number"
                      value={invoiceData.discount_value || ""}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          discount_value: parseFloat(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max={
                        invoiceData.discount_type === "PERCENT"
                          ? 100
                          : calculatedTotals.taxableAmount
                      }
                      className="w-24 px-2 py-1 border rounded-l text-right text-sm"
                    />
                    <select
                      value={invoiceData.discount_type}
                      onChange={(e) =>
                        setInvoiceData({
                          ...invoiceData,
                          discount_type: e.target.value,
                        })
                      }
                      className="w-16 px-2 py-1 border border-l-0 rounded-r text-sm bg-gray-50"
                    >
                      <option value="PERCENT">%</option>
                      <option value="AMOUNT">₹</option>
                    </select>
                  </div>
                </div>

                {calculatedTotals.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount Amount:</span>
                    <span className="font-bold">
                      - ₹{format(calculatedTotals.discountAmount)}
                    </span>
                  </div>
                )}

                {/* GST Breakdown */}
                {calculatedTotals.totalGST > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">GST:</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${calculatedTotals.isSameState ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}
                      >
                        {calculatedTotals.gstMode}
                      </span>
                    </div>
                    {Object.entries(calculatedTotals.gstBreakdown).map(
                      ([key, tax]) =>
                        tax.tax > 0 && (
                          <div
                            key={key}
                            className="flex justify-between text-xs text-gray-600 pl-4"
                          >
                            <span>GST {tax.rate}%:</span>
                            <span>₹{format(tax.tax)}</span>
                          </div>
                        ),
                    )}
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total GST:</span>
                      <span>₹{format(calculatedTotals.totalGST)}</span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t-2 text-lg font-bold text-blue-700">
                  <span>TOTAL:</span>
                  <span>₹{format(calculatedTotals.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="mb-8">
              <h4 className="font-bold mb-2">Terms & Conditions</h4>
              <textarea
                value={invoiceData.terms_conditions}
                onChange={(e) =>
                  setInvoiceData({
                    ...invoiceData,
                    terms_conditions: e.target.value,
                  })
                }
                rows="4"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter terms and conditions..."
              />
            </div>

            {/* PDF Link - Show only if PDF exists */}
            {invoiceData.pdf_url && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye size={18} className="text-blue-600" />
                  <span className="text-sm text-gray-700">
                    Invoice PDF available
                  </span>
                </div>
                <button
                  onClick={() => openPDF(invoiceData.pdf_url)}
                  disabled={pdfLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {pdfLoading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Eye size={14} />
                  )}
                  View PDF
                </button>
              </div>
            )}

            {/* Create/Update Button at Bottom */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={saveInvoice}
                disabled={isLoading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-lg font-semibold"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                {editIndex !== null ? "Update Invoice" : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoice;
