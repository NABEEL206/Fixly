import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";

// 
// CRUCIAL IMPORTS
//
import html2canvas from 'html2canvas'; 
import { jsPDF } from 'jspdf';
import { 
  Plus, X, Edit, Trash2, Eye, Download, Mail, ChevronLeft, 
  RotateCcw, Search, Percent, IndianRupee, MapPin, Flag, Loader2,
  FileText, Menu, MoreVertical, Users, Store, Tag, Building,
  AlertCircle, CheckCircle, Info
} from "lucide-react";

// Helper function
const format = (num) => Number(num || 0).toFixed(2);

// Demo Data with States (Including Kerala customers)
const demoCustomers = [
  { name: "John Doe", state: "Kerala", city: "Kochi" },
  { name: "Jane Smith", state: "Karnataka", city: "Bangalore" },
  { name: "Acme Corp", state: "Tamil Nadu", city: "Chennai" },
  { name: "Global Traders", state: "Kerala", city: "Thiruvananthapuram" },
  { name: "Tech Solutions", state: "Kerala", city: "Kozhikode" },
  { name: "Northern Imports", state: "Delhi", city: "New Delhi" },
  { name: "Western Exports", state: "Gujarat", city: "Ahmedabad" },
  { name: "Southern Foods", state: "Kerala", city: "Alappuzha" },
];

const demoItems = [
  { name: "Product A", rate: 100 },
  { name: "Product B", rate: 200 },
  { name: "Product C", rate: 300 },
  { name: "Product D", rate: 400 },
  { name: "Product E", rate: 500 },
];

// Define GST options for same state (CGST+SGST) and different state (IGST)
const gstOptionsSameState = [
  { label: "No Tax (0%)", totalRate: 0, cgst: 0, sgst: 0, igst: 0 },
  { label: "5% GST (2.5% CGST + 2.5% SGST)", totalRate: 5, cgst: 2.5, sgst: 2.5, igst: 0 },
  { label: "12% GST (6% CGST + 6% SGST)", totalRate: 12, cgst: 6, sgst: 6, igst: 0 },
  { label: "18% GST (9% CGST + 9% SGST)", totalRate: 18, cgst: 9, sgst: 9, igst: 0 },
  { label: "28% GST (14% CGST + 14% SGST)", totalRate: 28, cgst: 14, sgst: 14, igst: 0 },
];

const gstOptionsOtherState = [
  { label: "No Tax (0%)", totalRate: 0, cgst: 0, sgst: 0, igst: 0 },
  { label: "5% IGST", totalRate: 5, cgst: 0, sgst: 0, igst: 5 },
  { label: "12% IGST", totalRate: 12, cgst: 0, sgst: 0, igst: 12 },
  { label: "18% IGST", totalRate: 18, cgst: 0, sgst: 0, igst: 18 },
  { label: "28% IGST", totalRate: 28, cgst: 0, sgst: 0, igst: 28 },
];

// Business Information (Your Company's State - KERALA)
const BUSINESS_INFO = {
  name: "MALAYALI ENTERPRISES",
  state: "Kerala", // Your company's registered state
  address: "123 Business Street, Ernakulam, Kerala, 682001",
  gstin: "32ABCDE1234F1Z5", // Kerala GSTIN starts with 32
  phone: "+91 97460 12345",
  email: "info@malayalienterprises.com",
  bankDetails: {
    name: "State Bank of India",
    accountNumber: "123456789012",
    ifscCode: "SBIN0000123",
    branch: "Ernakulam Main"
  }
};

// Demo assigned data based on complaint ID
const assignedDataByComplaint = {
  "CMP001": {
    assignTo: "Franchise",
    assignedTo: "Franchise A - Kochi",
    assignedDate: "2024-01-15",
    details: "Assigned for service and repair"
  },
  "CMP002": {
    assignTo: "Grow Tag",
    assignedTo: "Grow Tag - Premium",
    assignedDate: "2024-01-16",
    details: "Assigned for quality check"
  },
  "CMP003": {
    assignTo: "Other Shop",
    assignedTo: "Other Shop 1 - Electronics",
    assignedDate: "2024-01-17",
    details: "Assigned for parts replacement"
  },
  "CMP004": {
    assignTo: "Franchise",
    assignedTo: "Franchise B - Thiruvananthapuram",
    assignedDate: "2024-01-18",
    details: "Assigned for warranty service"
  }
};

const getStatusBadge = (status) => {
  const base = "px-3 py-1 text-xs rounded-full font-semibold border";
  switch (status) {
    case "Paid":
      return base + " bg-green-50 text-green-700 border-green-300";
    case "Partially Paid":
      return base + " bg-yellow-50 text-yellow-700 border-yellow-300";
    default:
      return base + " bg-blue-50 text-blue-700 border-blue-300"; 
  }
};

// Initial state for a new invoice
const initialInvoiceState = {
  customer: { name: "", state: "", city: "" },
  complaintId: "",
  invoiceId: "", 
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: "",
  status: "Draft",
  items: [{ 
    item: "",
    description: "",
    qty: 1, 
    rate: 0,
    serviceCharge: 0,
    serviceChargeType: 'rupee',
    gstTreatment: "No Tax (0%)",
    gstRate: 0, 
    cgst: 0, 
    sgst: 0, 
    igst: 0 
  }],
  discount: 0,
  discountType: 'rupee',
  termsAndConditions: `1. Payment Terms: Payment is due within ${new Date().getDate() + 15} days of invoice date.
2. Late Payment: 1.5% monthly interest on overdue amounts.
3. Delivery: Delivery subject to stock availability.
4. Warranty: 1-year warranty from invoice date.
5. Jurisdiction: Disputes subject to Kerala jurisdiction.`,
};

// Helper function to parse number input properly
const parseNumberInput = (value) => {
  // If value is empty string, return 0
  if (value === '') return 0;
  
  // If value is a string starting with 0 and has more digits, parse it as number
  // This handles cases like "012525" -> 12525
  if (typeof value === 'string' && value.startsWith('0') && value.length > 1) {
    // Remove leading zeros and parse
    const cleaned = value.replace(/^0+/, '');
    return cleaned === '' ? 0 : Number(cleaned);
  }
  
  // Otherwise, convert to number
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Toast Component
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-100 border-green-300 text-green-800' :
                  type === 'error' ? 'bg-red-100 border-red-300 text-red-800' :
                  'bg-blue-100 border-blue-300 text-blue-800';

  const icon = type === 'success' ? <CheckCircle size={20} /> :
               type === 'error' ? <AlertCircle size={20} /> :
               <Info size={20} />;

  return (
    <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg flex items-center gap-3 ${bgColor} animate-slideIn`}>
      {icon}
      <div className="font-medium">{message}</div>
      <button onClick={onClose} className="ml-4 text-gray-500 hover:text-gray-700">
        <X size={18} />
      </button>
    </div>
  );
};

const Invoice = () => {
  
  const location = useLocation();
  const complaintData = location.state?.complaintData;
  const [currentScreen, setCurrentScreen] = useState("list");
  const [editIndex, setEditIndex] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [selectedGSTRate, setSelectedGSTRate] = useState(gstOptionsSameState[0].label);
  const [quickSearch, setQuickSearch] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const previewRef = useRef(null); 
  const [invoiceData, setInvoiceData] = useState(initialInvoiceState);
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  // Get appropriate GST options based on customer's state
  const getGstOptionsForCustomer = useCallback(() => {
    const customerState = invoiceData.customer.state;
    if (customerState && customerState === BUSINESS_INFO.state) {
      return gstOptionsSameState;
    } else {
      return gstOptionsOtherState;
    }
  }, [invoiceData.customer.state]);

  // Update GST treatments when customer changes
  useEffect(() => {
    if (invoiceData.customer.name) {
      const gstOptions = getGstOptionsForCustomer();
      const defaultGst = gstOptions[0];
      
      const updatedItems = invoiceData.items.map(item => ({
        ...item,
        gstTreatment: defaultGst.label,
        gstRate: defaultGst.totalRate,
        cgst: defaultGst.cgst,
        sgst: defaultGst.sgst,
        igst: defaultGst.igst
      }));

      setInvoiceData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  }, [invoiceData.customer.state, getGstOptionsForCustomer]);

  // When complaint ID changes, fetch assigned details
  useEffect(() => {
    if (invoiceData.complaintId && assignedDataByComplaint[invoiceData.complaintId]) {
      // In a real app, you would fetch this data from an API
      console.log("Found assigned data for complaint:", invoiceData.complaintId);
    }
  }, [invoiceData.complaintId]);

  useEffect(() => {
    if (complaintData) {
      setInvoiceData((prev) => ({
        ...prev,
        complaintId: complaintData.id,
        customer: {
          name: complaintData.customer_name,
          state: complaintData.state,
          city: complaintData.city,
        },
      }));

      // 🔥 DIRECTLY OPEN FORM (skip invoice list)
      setCurrentScreen("form");
      setEditIndex(null);
    }
  }, [complaintData]);

  // Auto-generate invoice ID
  useEffect(() => {
    if (currentScreen === "form" && editIndex === null) {
      if (!invoiceData.invoiceId || invoiceData.invoiceId.startsWith("INV-Auto")) {
        const nextId = `INV-${String(invoices.length + 1).padStart(3, '0')}`;
        setInvoiceData(prev => ({ ...prev, invoiceId: nextId }));
      }
    }
  }, [currentScreen, editIndex, invoices.length]);

  // Calculate totals for current invoice with CORRECT GST logic
  const { 
    subTotal, 
    totalServiceCharge,
    taxableAmount,
    discountAmount,
    gstBase,
    totalTax, 
    total, 
    cgstAmount, 
    sgstAmount, 
    igstAmount,
    taxBreakdown,
    isSameState,
    gstTreatmentLabel
  } = useMemo(() => {
    let subTotal = 0;
    let totalServiceCharge = 0;

    const isSameState = invoiceData.customer.state === BUSINESS_INFO.state;
    const gstTreatmentLabel = isSameState ? "CGST + SGST" : "IGST";

    // First pass: Calculate subTotal and totalServiceCharge
    invoiceData.items.forEach(item => {
      const itemAmount = item.qty * item.rate;
      subTotal += itemAmount;
      
      let itemServiceCharge = 0;
      if (item.serviceChargeType === 'percentage') {
        itemServiceCharge = (itemAmount * Number(item.serviceCharge || 0)) / 100;
      } else {
        itemServiceCharge = Number(item.serviceCharge || 0);
      }
      
      totalServiceCharge += itemServiceCharge;
    });

    // Calculate Taxable Amount (Sub Total + Service Charge)
    const taxableAmount = subTotal + totalServiceCharge;
    
    // Calculate discount amount (apply to Taxable Amount)
    let discountAmount = 0;
    if (invoiceData.discountType === 'percentage') {
      discountAmount = (taxableAmount * Number(invoiceData.discount || 0)) / 100;
    } else {
      discountAmount = Number(invoiceData.discount || 0);
    }
    
    // Ensure discount doesn't exceed taxable amount
    discountAmount = Math.min(discountAmount, taxableAmount);
    
    // Calculate GST Base (Taxable Amount - Discount)
    const gstBase = Math.max(0, taxableAmount - discountAmount);
    
    // Second pass: Calculate GST on the GST Base proportionally per item
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    let taxBreakdown = {};
    
    invoiceData.items.forEach(item => {
      const itemAmount = item.qty * item.rate;
      
      let itemServiceCharge = 0;
      if (item.serviceChargeType === 'percentage') {
        itemServiceCharge = (itemAmount * Number(item.serviceCharge || 0)) / 100;
      } else {
        itemServiceCharge = Number(item.serviceCharge || 0);
      }
      
      // Calculate this item's proportion of the total taxable amount
      const itemTaxableAmount = itemAmount + itemServiceCharge;
      const itemProportion = taxableAmount > 0 ? itemTaxableAmount / taxableAmount : 0;
      
      // Calculate this item's share of the GST base
      const itemGstBase = gstBase * itemProportion;
      
      // Calculate GST on the item's share of GST base
      const itemCGST = (Number(item.cgst || 0) / 100) * itemGstBase;
      const itemSGST = (Number(item.sgst || 0) / 100) * itemGstBase;
      const itemIGST = (Number(item.igst || 0) / 100) * itemGstBase;
      
      totalCGST += itemCGST;
      totalSGST += itemSGST;
      totalIGST += itemIGST;

      const gstRate = item.gstRate;
      if (!taxBreakdown[gstRate]) {
        taxBreakdown[gstRate] = {
          rate: gstRate,
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          total: 0
        };
      }
      
      taxBreakdown[gstRate].taxable += itemGstBase;
      taxBreakdown[gstRate].cgst += itemCGST;
      taxBreakdown[gstRate].sgst += itemSGST;
      taxBreakdown[gstRate].igst += itemIGST;
      taxBreakdown[gstRate].total += itemCGST + itemSGST + itemIGST;
    });

    const totalTax = totalCGST + totalSGST + totalIGST;
    const total = gstBase + totalTax;

    return { 
      subTotal, 
      totalServiceCharge,
      taxableAmount,
      discountAmount,
      gstBase,
      totalTax, 
      total, 
      cgstAmount: totalCGST, 
      sgstAmount: totalSGST, 
      igstAmount: totalIGST,
      taxBreakdown,
      isSameState,
      gstTreatmentLabel
    };
  }, [invoiceData.items, invoiceData.customer.state, invoiceData.discount, invoiceData.discountType]);

  // Calculate invoice total for list view (with correct GST logic)
  const calculateInvoiceTotal = useCallback((inv) => {
    let invSubTotal = 0;
    let totalServiceCharge = 0;
    
    // First pass: Calculate subTotal and service charge
    inv.items.forEach(item => {
      const itemAmount = item.qty * item.rate;
      invSubTotal += itemAmount;
      
      let itemServiceCharge = 0;
      if (item.serviceChargeType === 'percentage') {
        itemServiceCharge = (itemAmount * Number(item.serviceCharge || 0)) / 100;
      } else {
        itemServiceCharge = Number(item.serviceCharge || 0);
      }
      
      totalServiceCharge += itemServiceCharge;
    });
    
    // Taxable Amount
    const taxableAmount = invSubTotal + totalServiceCharge;
    
    // Discount (apply to Taxable Amount)
    let discountAmount = 0;
    if (inv.discountType === 'percentage') {
      discountAmount = (taxableAmount * Number(inv.discount || 0)) / 100;
    } else {
      discountAmount = Number(inv.discount || 0);
    }
    
    // Ensure discount doesn't exceed taxable amount
    discountAmount = Math.min(discountAmount, taxableAmount);
    
    // GST Base
    const gstBase = Math.max(0, taxableAmount - discountAmount);
    
    // Second pass: Calculate GST proportionally
    let totalCGST = 0;
    let totalSGST = 0;
    let totalIGST = 0;
    
    inv.items.forEach(item => {
      const itemAmount = item.qty * item.rate;
      
      let itemServiceCharge = 0;
      if (item.serviceChargeType === 'percentage') {
        itemServiceCharge = (itemAmount * Number(item.serviceCharge || 0)) / 100;
      } else {
        itemServiceCharge = Number(item.serviceCharge || 0);
      }
      
      // Calculate this item's proportion of the total taxable amount
      const itemTaxableAmount = itemAmount + itemServiceCharge;
      const itemProportion = taxableAmount > 0 ? itemTaxableAmount / taxableAmount : 0;
      
      // Calculate this item's share of the GST base
      const itemGstBase = gstBase * itemProportion;
      
      // Calculate GST on the item's share of GST base
      const itemCGST = (Number(item.cgst || 0) / 100) * itemGstBase;
      const itemSGST = (Number(item.sgst || 0) / 100) * itemGstBase;
      const itemIGST = (Number(item.igst || 0) / 100) * itemGstBase;
      
      totalCGST += itemCGST;
      totalSGST += itemSGST;
      totalIGST += itemIGST;
    });
    
    const totalTax = totalCGST + totalSGST + totalIGST;
    return gstBase + totalTax;
  }, []);

  // Filtering Logic
  const filteredInvoices = useMemo(() => {
    const search = quickSearch.toLowerCase();
    
    return invoices.filter(inv => {
      const matchesSearch = 
        inv.invoiceId.toLowerCase().includes(search) ||
        inv.customer.name.toLowerCase().includes(search) ||
        inv.status.toLowerCase().includes(search);

      return matchesSearch;
    });
  }, [invoices, quickSearch]);

  // Get assigned details for current complaint ID
  const assignedDetails = useMemo(() => {
    if (invoiceData.complaintId && assignedDataByComplaint[invoiceData.complaintId]) {
      return assignedDataByComplaint[invoiceData.complaintId];
    }
    return null;
  }, [invoiceData.complaintId]);

  const exitScreen = () => {
    setCurrentScreen("list");
    setEditIndex(null);
    setSelectedGSTRate(gstOptionsSameState[0].label);
    setInvoiceData(initialInvoiceState);
    setErrors({});
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Customer Name validation
    if (!invoiceData.customer.name || invoiceData.customer.name.trim() === "") {
      newErrors.customerName = "Customer name is required";
    }
    
    // Invoice ID validation
    if (!invoiceData.invoiceId || invoiceData.invoiceId.trim() === "") {
      newErrors.invoiceId = "Invoice ID is required";
    } else if (!/^INV-\d{3,}$/.test(invoiceData.invoiceId)) {
      newErrors.invoiceId = "Invoice ID should be in format INV-001, INV-002, etc.";
    }
    
    // Complaint ID validation
    if (invoiceData.complaintId && !/^[A-Za-z0-9\-_]+$/.test(invoiceData.complaintId)) {
      newErrors.complaintId = "Complaint ID can only contain letters, numbers, hyphens, and underscores";
    }
    
    // Items validation
    if (invoiceData.items.length === 0) {
      newErrors.items = "At least one item is required";
    } else {
      invoiceData.items.forEach((item, index) => {
        if (!item.item || item.item.trim() === "") {
          newErrors[`item-${index}`] = "Item name is required";
        }
        if (item.qty <= 0) {
          newErrors[`qty-${index}`] = "Quantity must be greater than 0";
        }
        if (item.rate < 0) {
          newErrors[`rate-${index}`] = "Rate cannot be negative";
        }
        if (!item.rate || item.rate === 0) {
          newErrors[`rate-${index}`] = "Rate is required";
        }
        if (item.serviceCharge < 0) {
          newErrors[`serviceCharge-${index}`] = "Service charge cannot be negative";
        }
      });
    }
    
    // Discount validation
    if (invoiceData.discount < 0) {
      newErrors.discount = "Discount cannot be negative";
    }
    if (invoiceData.discountType === 'percentage' && invoiceData.discount > 100) {
      newErrors.discount = "Discount percentage cannot exceed 100%";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Show toast notification
  const showToast = (message, type = "error") => {
    setToast({ show: true, message, type });
  };
  
  // Save invoice with validation
  const saveInvoice = () => {
    if (!validateForm()) {
      showToast("Please fix all validation errors before saving.", "error");
      
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        const element = document.querySelector(`[data-error="${firstError}"]`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }
    
    // Check if invoice ID already exists (for new invoices only)
    if (editIndex === null) {
      const existingInvoice = invoices.find(inv => inv.invoiceId === invoiceData.invoiceId);
      if (existingInvoice) {
        showToast(`Invoice ID "${invoiceData.invoiceId}" already exists. Please use a different ID.`, "error");
        return;
      }
    }
    
    if (editIndex !== null) {
      const updated = [...invoices];
      updated[editIndex] = invoiceData;
      setInvoices(updated);
      showToast(`Invoice ${invoiceData.invoiceId} updated successfully!`, "success");
    } else {
      let finalInvoiceData = {...invoiceData};
      setInvoices([...invoices, finalInvoiceData]);
      showToast(`Invoice ${invoiceData.invoiceId} created successfully!`, "success");
    }
    
    // Clear form after successful save
    setTimeout(() => {
      exitScreen();
    }, 1500);
  };

  const handleEdit = (index) => {
    const inv = invoices[index];
    setInvoiceData(inv);
    setEditIndex(index);
    setErrors({});
    
    const gstOptions = inv.customer.state === BUSINESS_INFO.state ? gstOptionsSameState : gstOptionsOtherState;
    setSelectedGSTRate(gstOptions[0].label);
    setCurrentScreen("form");
  };

  const handleView = (index) => {
    setInvoiceData(invoices[index]);
    setCurrentScreen("preview");
  };

  const handleDelete = (index) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      const deletedInvoice = invoices[index];
      setInvoices(invoices.filter((_, i) => i !== index));
      showToast(`Invoice ${deletedInvoice.invoiceId} deleted successfully!`, "success");
    }
  };

  // Add item row with service charge
  const addItem = () => {
    const gstOptions = getGstOptionsForCustomer();
    const defaultGst = gstOptions[0];
    
    const newItem = { 
      item: "",
      description: "",
      isManual: false,
      qty: 1,
      rate: 0,
      serviceCharge: 0,
      serviceChargeType: 'rupee',
      gstTreatment: defaultGst.label,
      gstRate: defaultGst.totalRate, 
      cgst: defaultGst.cgst, 
      sgst: defaultGst.sgst, 
      igst: defaultGst.igst 
    };

    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, newItem],
    });
    
    // Clear item errors when adding new item
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith('item-') || key.startsWith('qty-') || key.startsWith('rate-') || key.startsWith('serviceCharge-')) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  // Update item row including service charge
  const updateItem = (index, key, value) => {
    const updated = [...invoiceData.items];
    
    if (key === "gstTreatment") {
      const gstOptions = getGstOptionsForCustomer();
      const rateOption = gstOptions.find(o => o.label === value);
      if (rateOption) {
        updated[index] = {
          ...updated[index],
          gstTreatment: value,
          gstRate: rateOption.totalRate,
          cgst: rateOption.cgst,
          sgst: rateOption.sgst,
          igst: rateOption.igst
        };
      }
    } else {
      // Use parseNumberInput for numeric fields to handle leading zeros properly
      if (key === 'qty' || key === 'rate' || key === 'serviceCharge') {
        const parsedValue = parseNumberInput(value);
        updated[index][key] = parsedValue;
        
        // Clear validation error for this field
        const newErrors = { ...errors };
        delete newErrors[`${key}-${index}`];
        setErrors(newErrors);
      } else {
        updated[index][key] = value;
        
        // Clear validation error for this field
        if (key === 'item') {
          const newErrors = { ...errors };
          delete newErrors[`item-${index}`];
          setErrors(newErrors);
        }
      }

      if (key === "item") {
        const selected = demoItems.find((i) => i.name === value);
        if (selected) updated[index].rate = selected.rate;
      }
    }

    setInvoiceData({ ...invoiceData, items: updated });
  };

  const removeItem = (index) => {
    const updated = invoiceData.items.filter((_, i) => i !== index);
    setInvoiceData({ ...invoiceData, items: updated });
    
    // Clear errors for removed item
    const newErrors = { ...errors };
    Object.keys(newErrors).forEach(key => {
      if (key.startsWith(`item-${index}`) || 
          key.startsWith(`qty-${index}`) || 
          key.startsWith(`rate-${index}`) || 
          key.startsWith(`serviceCharge-${index}`)) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  // Update GST for all items
  const updateAllGST = (optionLabel) => {
    const gstOptions = getGstOptionsForCustomer();
    const rateOption = gstOptions.find(o => o.label === optionLabel); 
    
    if (rateOption) {
      setSelectedGSTRate(optionLabel);
      const updatedItems = invoiceData.items.map(item => ({
        ...item,
        gstTreatment: optionLabel,
        gstRate: rateOption.totalRate,
        cgst: rateOption.cgst,
        sgst: rateOption.sgst,
        igst: rateOption.igst
      }));
      
      setInvoiceData({
        ...invoiceData,
        items: updatedItems
      });
    }
  }

  // Enhanced PDF Download Functionality
  const handleDownloadPDF = async () => {
    if (!previewRef.current) {
      console.error("No preview element found");
      return;
    }

    setGeneratingPDF(true);
    
    try {
      const invoiceElement = previewRef.current;
      
      const originalStyles = {
        width: invoiceElement.style.width,
        padding: invoiceElement.style.padding,
      };
      
      invoiceElement.style.width = '794px';
      invoiceElement.style.padding = '0px';
      
      const canvas = await html2canvas(invoiceElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('invoice-preview');
          if (clonedElement) {
            clonedElement.style.boxShadow = 'none';
            clonedElement.style.border = 'none';
          }
        }
      });

      invoiceElement.style.width = originalStyles.width;
      invoiceElement.style.padding = originalStyles.padding;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 5;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pdfWidth / 2, pdfHeight - 10, { align: 'center' });
      pdf.text(`Invoice ID: ${invoiceData.invoiceId}`, pdfWidth / 2, pdfHeight - 5, { align: 'center' });
      
      pdf.save(`invoice-${invoiceData.invoiceId}.pdf`);
      
      showToast(`PDF downloaded successfully!`, "success");
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF. Please try again.', "error");
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSendEmail = () => {
    showToast(`Email simulated: Invoice ${invoiceData.invoiceId} sent to ${invoiceData.customer.name}.`, "success");
  };

  // Function to calculate item service charge
  const calculateItemServiceCharge = (item) => {
    const itemAmount = item.qty * item.rate;
    if (item.serviceChargeType === 'percentage') {
      return (itemAmount * Number(item.serviceCharge || 0)) / 100;
    } else {
      return Number(item.serviceCharge || 0);
    }
  };

  // Handle discount change with proper number parsing
  const handleDiscountChange = (value) => {
    const parsedValue = parseNumberInput(value);
    setInvoiceData({ ...invoiceData, discount: parsedValue });
    
    // Clear discount error
    const newErrors = { ...errors };
    delete newErrors.discount;
    setErrors(newErrors);
  };

  // Handle terms and conditions change
  const handleTermsChange = (value) => {
    setInvoiceData({ ...invoiceData, termsAndConditions: value });
  };

  // Get icon for assign to type
  const getAssignToIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'franchise': return <Building size={16} />;
      case 'grow tag': return <Tag size={16} />;
      case 'other shop': return <Store size={16} />;
      default: return <Users size={16} />;
    }
  };

  // Handle customer change with validation
  const handleCustomerChange = (e) => {
    const selectedCustomer = demoCustomers.find(c => c.name === e.target.value);
    if (selectedCustomer) {
      setInvoiceData({ 
        ...invoiceData, 
        customer: { ...selectedCustomer } 
      });
      
      // Clear customer name error
      const newErrors = { ...errors };
      delete newErrors.customerName;
      setErrors(newErrors);
    }
  };

  // Handle invoice ID change with validation
  const handleInvoiceIdChange = (e) => {
    setInvoiceData({ ...invoiceData, invoiceId: e.target.value });
    
    // Clear invoice ID error
    const newErrors = { ...errors };
    delete newErrors.invoiceId;
    setErrors(newErrors);
  };

  // Handle complaint ID change with validation
  const handleComplaintIdChange = (e) => {
    setInvoiceData({ ...invoiceData, complaintId: e.target.value });
    
    // Clear complaint ID error
    const newErrors = { ...errors };
    delete newErrors.complaintId;
    setErrors(newErrors);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 lg:p-10 font-sans">
      {/* Toast Notification */}
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ show: false, message: "", type: "" })} 
        />
      )}

      {/* INVOICE LIST VIEW - Mobile Responsive */}
      {currentScreen === "list" && (
        <>
          <div className="mb-6">
            {/* Mobile Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
              <div className="flex justify-between items-center sm:block">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-800">Invoices 🧾</h2>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-gray-600">
                    <Flag className="text-green-600" size={12} />
                    <span className="truncate">Kerala GST Registered</span>
                    <MapPin size={12} />
                    <span>State: <strong className="text-green-700">{BUSINESS_INFO.state}</strong></span>
                  </div>
                </div>
                {/* Mobile Menu Button */}
                <button 
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="sm:hidden p-2 rounded-lg bg-gray-100"
                >
                  <Menu size={24} />
                </button>
              </div>
              
              <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:block`}>
                <button
                  onClick={() => setCurrentScreen("form")}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 sm:px-5 sm:py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-150 ease-in-out flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
                >
                  <Plus size={18} /> New Invoice
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Bar - Mobile Optimized */}
          <div className="mb-6 relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invoices..."
              className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 text-gray-700 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
              value={quickSearch}
              onChange={(e) => setQuickSearch(e.target.value)}
            />
          </div>

          {quickSearch && (
            <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 shadow-sm">
              <p className="text-xs sm:text-sm font-medium flex items-center">
                <Search size={14} className="inline mr-2" />
                Filtered by: <span className="font-bold ml-1">"{quickSearch}"</span>
              </p>
              <button 
                onClick={() => setQuickSearch("")} 
                className="text-xs text-yellow-600 hover:text-yellow-900 flex items-center gap-1 font-semibold"
              >
                <RotateCcw size={12} /> Clear
              </button>
            </div>
          )}

          {/* Mobile Invoice Cards for Small Screens */}
          <div className="sm:hidden">
            {filteredInvoices.length ? (
              <div className="space-y-4">
                {filteredInvoices.map((inv, index) => {
                  const isSameState = inv.customer.state === BUSINESS_INFO.state;
                  return (
                    <div key={index} className="bg-white shadow-lg rounded-xl p-4 border border-gray-200">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-blue-600 font-bold text-lg">{inv.invoiceId}</div>
                          <div className="font-medium text-gray-800 mt-1">{inv.customer.name}</div>
                          <div className="text-xs text-gray-500">{inv.customer.city}</div>
                        </div>
                        <span className={getStatusBadge(inv.status)}>
                          {inv.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                        <div>
                          <div className="text-gray-500">Date</div>
                          <div className="font-medium">{inv.invoiceDate}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Due Date</div>
                          <div className="font-medium">{inv.dueDate || 'N/A'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className={`flex items-center gap-2 ${isSameState ? 'text-green-600' : 'text-blue-600'}`}>
                          <MapPin size={14} />
                          <span className={`px-2 py-1 text-xs rounded-full ${isSameState ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                            {inv.customer.state}
                            {isSameState && ' ✓'}
                          </span>
                        </div>
                        <div className="font-bold text-gray-800 text-lg">
                          ₹{format(calculateInvoiceTotal(inv))}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleView(index)}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200"
                            title="View"
                          >
                            <Eye size={18} className="text-gray-600" />
                          </button>
                          <button 
                            onClick={() => handleEdit(index)}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100"
                            title="Edit"
                          >
                            <Edit size={18} className="text-blue-600" />
                          </button>
                          <button 
                            onClick={() => handleDelete(index)}
                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100"
                            title="Delete"
                          >
                            <Trash2 size={18} className="text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 text-lg bg-white rounded-xl shadow-lg p-6">
                {quickSearch
                  ? `No invoices match: "${quickSearch}"`
                  : "Start by creating your first invoice!"}
                {!quickSearch && (
                  <button
                    onClick={() => setCurrentScreen("form")}
                    className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-150 ease-in-out flex items-center justify-center gap-2 font-medium mx-auto"
                  >
                    <Plus size={18} /> Create First Invoice
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Invoice Table */}
          <div className="hidden sm:block bg-white shadow-xl rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    {["Invoice ID", "Customer", "Customer State", "Date", "Due Date", "Status", "Total", "Actions"].map(
                      (t, i) => (
                        <th
                          key={i}
                          className="py-4 px-4 text-left text-gray-600 uppercase text-xs font-semibold tracking-wider"
                        >
                          {t}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>
                  {filteredInvoices.length ? (
                    filteredInvoices.map((inv, index) => {
                      const isSameState = inv.customer.state === BUSINESS_INFO.state;
                      return (
                        <tr key={index} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition duration-100">
                          <td className="py-4 px-4 text-blue-600 font-medium">{inv.invoiceId}</td>
                          <td className="py-4 px-4 text-gray-700">
                            <div className="font-medium">{inv.customer.name}</div>
                            <div className="text-xs text-gray-500">{inv.customer.city}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className={`flex items-center gap-2 ${isSameState ? 'text-green-600' : 'text-blue-600'}`}>
                              <MapPin size={14} />
                              <span className={`px-2 py-1 text-xs rounded-full ${isSameState ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                {inv.customer.state}
                                {isSameState && ' ✓'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {isSameState ? 'CGST+SGST' : 'IGST'}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-500">{inv.invoiceDate}</td>
                          <td className="py-4 px-4 text-gray-500">{inv.dueDate || 'N/A'}</td>
                          <td className="py-4 px-4">
                            <span className={getStatusBadge(inv.status)}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 font-bold text-gray-800">
                            ₹{format(calculateInvoiceTotal(inv))}
                          </td>

                          <td className="py-4 px-4 flex items-center gap-3">
                            <Eye className="cursor-pointer text-gray-500 hover:text-green-500" size={18} onClick={() => handleView(index)} title="View" />
                            <Edit
                              className="cursor-pointer text-blue-600 hover:text-blue-800" size={18}
                              onClick={() => handleEdit(index)} title="Edit"
                            />
                            <Trash2
                              className="cursor-pointer text-red-600 hover:text-red-800" size={18}
                              onClick={() => handleDelete(index)} title="Delete"
                            />
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500 text-lg">
                        {quickSearch
                          ? `No invoices match the search term: "${quickSearch}"`
                          : "Start by creating your first invoice!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      
      {/* INVOICE FORM VIEW - Mobile Responsive */}
      {(currentScreen === "form") && (
        <div className="max-w-6xl mx-auto p-1 sm:p-2"> 
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <button 
              onClick={exitScreen} 
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium gap-1 p-2 rounded-lg hover:bg-white transition w-full sm:w-auto"
            >
              <ChevronLeft size={24} /> Back to Invoices
            </button>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={saveInvoice}
                className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg shadow-md hover:bg-blue-700 transition duration-150 font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                {editIndex !== null ? "Update Invoice" : "Save Invoice"}
              </button>
            </div>
          </div>
          
          <div className="bg-white shadow-xl rounded-xl p-4 sm:p-6 md:p-8">
            {/* Validation Summary */}
            {Object.keys(errors).length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" data-error="validation-summary">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-600" size={20} />
                  <h4 className="text-lg font-bold text-gray-800">Please fix the following errors:</h4>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-red-700">
                  {Object.entries(errors).map(([key, message]) => (
                    <li key={key}>{message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 border-b pb-3">
              <div className="w-full">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-800 mb-2">
                  {editIndex !== null ? `Edit: ${invoiceData.invoiceId}` : "New Invoice"}
                </h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1 text-gray-600">
                    <Flag size={12} className="text-green-600" />
                    <span>Business: <strong className="text-green-700">{BUSINESS_INFO.state}</strong></span>
                  </div>
                  {invoiceData.customer.name && (
                    <div className={`flex items-center gap-1 ${invoiceData.customer.state === BUSINESS_INFO.state ? 'text-green-600' : 'text-blue-600'}`}>
                      <span>•</span>
                      <span>Customer: <strong>{invoiceData.customer.state}</strong></span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${invoiceData.customer.state === BUSINESS_INFO.state ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {invoiceData.customer.state === BUSINESS_INFO.state ? 'CGST+SGST' : 'IGST'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
              {/* Customer Selection */}
              <div className="col-span-full sm:col-span-2 lg:col-span-1" data-error="customerName">
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Customer <span className="text-red-500">*</span>
                  {errors.customerName && <span className="text-red-500 text-xs ml-2">({errors.customerName})</span>}
                </label>
                <select
                  className={`w-full border rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${
                    errors.customerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={invoiceData.customer.name || ""}
                  onChange={handleCustomerChange}
                >
                  <option value="">Select Customer</option>
                  {demoCustomers.map((c, i) => (
                    <option key={i} value={c.name}>
                      {c.name} - {c.city}, {c.state}
                      {c.state === BUSINESS_INFO.state && " ✓"}
                    </option>
                  ))}
                </select>
              </div>

              <div data-error="invoiceId">
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Invoice ID <span className="text-red-500">*</span>
                  {errors.invoiceId && <span className="text-red-500 text-xs ml-2">({errors.invoiceId})</span>}
                </label>
                <input
                  className={`w-full border rounded-lg px-3 py-2.5 text-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${
                    errors.invoiceId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={invoiceData.invoiceId}
                  onChange={handleInvoiceIdChange}
                  placeholder="INV-001"
                />
              </div>
              
              <div data-error="complaintId">
                <label className="text-sm font-medium text-gray-600 block mb-1">
                  Complaint ID
                  {errors.complaintId && <span className="text-red-500 text-xs ml-2">({errors.complaintId})</span>}
                </label>
                <input
                  className={`w-full border rounded-lg px-3 py-2.5 text-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base ${
                    errors.complaintId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  value={invoiceData.complaintId}
                  onChange={handleComplaintIdChange}
                  placeholder="CMP001"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Status</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  value={invoiceData.status}
                  onChange={(e) => setInvoiceData({ ...invoiceData, status: e.target.value })}
                >
                  <option>Draft</option>
                  <option>Paid</option>
                  <option>Partially Paid</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Invoice Date</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Due Date</label>
             <input
  type="date"
  min={invoiceData.invoiceDate}   // 🔥 prevents selecting earlier date
  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
  value={invoiceData.dueDate}
  onChange={(e) => {
    const selected = e.target.value;

    // Extra safety
    if (selected < invoiceData.invoiceDate) {
      showToast("Due date cannot be before invoice date", "error");
      return;
    }

    setInvoiceData({ ...invoiceData, dueDate: selected });
  }}
/>

              </div>
              
              {/* GST Application Dropdown */}
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1">Apply GST to All Items</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                  value={selectedGSTRate}
                  onChange={(e) => updateAllGST(e.target.value)}
                >
                  {getGstOptionsForCustomer().map((option, index) => (
                    <option key={index} value={option.label}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-xs text-gray-500">
                  {invoiceData.customer.state === BUSINESS_INFO.state 
                    ? "CGST + SGST" 
                    : "IGST"}
                </div>
              </div>
            </div>

            {/* Assigned Details Section - Shows when complaint ID has assigned data */}
            {assignedDetails && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="text-blue-600" size={20} />
                  <h4 className="text-lg font-bold text-gray-800">Assigned Details</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Assign To</div>
                    <div className="flex items-center gap-2">
                      {getAssignToIcon(assignedDetails.assignTo)}
                      <span className="font-medium">{assignedDetails.assignTo}</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Assigned To</div>
                    <div className="font-medium">{assignedDetails.assignedTo}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Assigned Date</div>
                    <div className="font-medium">{assignedDetails.assignedDate}</div>
                  </div>
                </div>
                {assignedDetails.details && (
                  <div className="mt-3 bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Details</div>
                    <div className="text-sm">{assignedDetails.details}</div>
                  </div>
                )}
              </div>
            )}

            <h4 className="text-lg sm:text-xl font-bold text-gray-800 mt-6 mb-4">Items Breakdown</h4>
            
            {errors.items && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" data-error="items">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">{errors.items}</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[800px] sm:min-w-0">
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left text-xs sm:text-sm font-semibold text-gray-700">Item <span className="text-red-500">*</span></th>
                        <th className="p-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Qty <span className="text-red-500">*</span></th>
                        <th className="p-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Rate (₹) <span className="text-red-500">*</span></th>
                        <th className="p-3 text-center text-xs sm:text-sm font-semibold text-gray-700">Service</th>
                        <th className="p-3 text-center text-xs sm:text-sm font-semibold text-gray-700">GST</th>
                        <th className="p-3 text-right text-xs sm:text-sm font-semibold text-gray-700">Amount</th>
                        <th className="p-3 text-center text-xs sm:text-sm font-semibold text-gray-700"></th>
                      </tr>
                    </thead>

                    <tbody>
                      {invoiceData.items.map((row, index) => (
                        <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                          <td className="p-3 align-top" data-error={`item-${index}`}>
                            <input
                              list={`items-${index}`}
                              type="text"
                              placeholder="Select item"
                              className={`w-full border rounded-md px-3 py-2 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`item-${index}`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              value={row.item}
                              onChange={(e) => {
                                const value = e.target.value;
                                updateItem(index, "item", value);

                                const selected = demoItems.find(i => i.name === value);
                                if (selected) {
                                  updateItem(index, "rate", selected.rate);
                                }
                              }}
                            />

                            <datalist id={`items-${index}`}>
                              {demoItems.map((i, idx) => (
                                <option key={idx} value={i.name}>
                                  {i.name}
                                </option>
                              ))}
                            </datalist>

                            {errors[`item-${index}`] && (
                              <div className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={12} />
                                {errors[`item-${index}`]}
                              </div>
                            )}

                            {row.item && (
                              <textarea
                                rows={2}
                                placeholder="Description"
                                className="mt-2 w-full border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                value={row.description}
                                onChange={(e) =>
                                  updateItem(index, "description", e.target.value)
                                }
                              />
                            )}
                          </td>

                          <td className="p-3" data-error={`qty-${index}`}>
                            <input
                              type="number"
                              className={`w-full border rounded-md px-2 py-1.5 text-xs sm:text-sm text-center focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`qty-${index}`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              value={row.qty === 0 ? "" : row.qty}
                              onChange={(e) => updateItem(index, "qty", e.target.value)}
                              min="1"
                              placeholder="1"
                            />
                            {errors[`qty-${index}`] && (
                              <div className="mt-1 text-xs text-red-500 text-center">
                                {errors[`qty-${index}`]}
                              </div>
                            )}
                          </td>

                          <td className="p-3" data-error={`rate-${index}`}>
                            <input
                              type="number"
                              className={`w-full border rounded-md px-2 py-1.5 text-xs sm:text-sm text-center focus:ring-blue-500 focus:border-blue-500 ${
                                errors[`rate-${index}`] ? 'border-red-500' : 'border-gray-300'
                              }`}
                              value={row.rate === 0 ? "" : row.rate}
                              onChange={(e) => updateItem(index, "rate", e.target.value)}
                              min="0"
                              placeholder="0"
                            />
                            {errors[`rate-${index}`] && (
                              <div className="mt-1 text-xs text-red-500 text-center">
                                {errors[`rate-${index}`]}
                              </div>
                            )}
                          </td>

                          {/* Service Charge Column */}
                          <td className="p-3" data-error={`serviceCharge-${index}`}>
                            <div className="flex flex-col sm:flex-row items-center gap-1">
                              <input
                                type="number"
                                className={`w-full border rounded-md px-2 py-1.5 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 ${
                                  errors[`serviceCharge-${index}`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                                value={row.serviceCharge === 0 ? "" : row.serviceCharge}
                                onChange={(e) => updateItem(index, "serviceCharge", e.target.value)}
                                min="0"
                                placeholder="0"
                              />
                              <select
                                className="w-full sm:w-auto border border-gray-300 rounded-md px-2 py-1.5 text-xs sm:text-sm bg-gray-100 focus:ring-blue-500 focus:border-blue-500"
                                value={row.serviceChargeType}
                                onChange={(e) => updateItem(index, "serviceChargeType", e.target.value)}
                              >
                                <option value="rupee">₹</option>
                                <option value="percentage">%</option>
                              </select>
                            </div>
                            {errors[`serviceCharge-${index}`] && (
                              <div className="mt-1 text-xs text-red-500 text-center">
                                {errors[`serviceCharge-${index}`]}
                              </div>
                            )}
                          </td>

                          {/* GST Treatment Column */}
                          <td className="p-3">
                            <select
                              className={`w-full border rounded-md px-2 py-1.5 text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 ${invoiceData.customer.state === BUSINESS_INFO.state ? 'border-green-300' : 'border-blue-300'}`}
                              value={row.gstTreatment}
                              onChange={(e) => updateItem(index, "gstTreatment", e.target.value)}
                            >
                              {getGstOptionsForCustomer().map((option, idx) => (
                                <option key={idx} value={option.label}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="p-3 text-right font-medium text-gray-800 text-xs sm:text-sm">
                            ₹{format(row.qty * row.rate)}
                            {row.serviceCharge > 0 && (
                              <div className="text-xs text-gray-500">
                                + ₹{format(calculateItemServiceCharge(row))}
                              </div>
                            )}
                          </td>

                          <td className="p-3 text-center">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove Item"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <button
              onClick={addItem}
              className="mt-4 text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium text-sm w-full sm:w-auto justify-center sm:justify-start"
            >
              <Plus size={16} /> Add Another Item
            </button>

            {/* TOTALS SUMMARY - Mobile Responsive */}
            <div className="flex justify-end mt-8">
              <div className="w-full sm:w-96 p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-sm">
                <div className="space-y-2">
                  {/* Sub Total */}
                  <div className="flex justify-between text-sm sm:text-base py-1">
                    <span className="text-gray-600">Sub Total:</span>
                    <span className="font-medium">₹{format(subTotal)}</span>
                  </div>

                  {/* Service Charge */}
                  {totalServiceCharge > 0 && (
                    <div className="flex justify-between text-sm sm:text-base py-1 text-purple-600">
                      <span className="font-medium">Service Charge:</span>
                      <span className="font-bold">+ ₹{format(totalServiceCharge)}</span>
                    </div>
                  )}

                  {/* Taxable Amount */}
                  <div className="flex justify-between text-sm sm:text-base py-1 border-t border-gray-200 pt-2">
                    <span className="font-semibold text-gray-700">Taxable Amount:</span>
                    <span className="font-bold">₹{format(taxableAmount)}</span>
                  </div>

                  {/* Discount */}
                  <div className="flex justify-between items-center py-1" data-error="discount">
                    <span className="text-gray-600 text-sm sm:text-base">Discount:</span>
                    <div className="flex w-1/2 sm:w-3/5">
                      <input
                        type="number"
                        className={`w-full border rounded-l-md px-2 py-0.5 text-right text-xs sm:text-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${
                          errors.discount ? 'border-red-500' : 'border-gray-300'
                        }`}
                        value={invoiceData.discount === 0 ? "" : invoiceData.discount}
                        onChange={(e) => handleDiscountChange(e.target.value)}
                        min="0"
                        max={invoiceData.discountType === 'percentage' ? 100 : taxableAmount}
                        placeholder="0"
                      />
                      <select
                        className="border border-gray-300 border-l-0 rounded-r-md px-1 py-0.5 text-xs sm:text-sm bg-gray-100 text-gray-700"
                        value={invoiceData.discountType}
                        onChange={(e) => setInvoiceData({ ...invoiceData, discountType: e.target.value })}
                      >
                        <option value="percentage">%</option>
                        <option value="rupee">₹</option>
                      </select>
                    </div>
                  </div>
                  {errors.discount && (
                    <div className="text-right text-xs text-red-500">{errors.discount}</div>
                  )}

                  {/* Discount Amount */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between py-1 text-xs sm:text-sm text-red-600">
                      <span className="font-semibold">Discount Amount:</span>
                      <span className="font-semibold">- ₹{format(discountAmount)}</span>
                    </div>
                  )}

                  {/* GST Base */}
                  <div className="flex justify-between text-sm sm:text-base py-1 border-t border-gray-200 pt-2">
                    <span className="font-semibold text-blue-600">GST Base:</span>
                    <span className="font-bold text-blue-700">₹{format(gstBase)}</span>
                  </div>

                  {/* GST Breakdown */}
                  {totalTax > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-gray-700 text-xs sm:text-sm">GST Breakdown:</h5>
                        <span className={`text-xs px-2 py-1 rounded ${isSameState ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {gstTreatmentLabel}
                        </span>
                      </div>
                      {Object.values(taxBreakdown).map((tax, idx) => {
                        if (tax.total === 0) return null;
                        
                        return (
                          <div key={idx} className="text-xs text-gray-600 space-y-1">
                            <div className="flex justify-between">
                              <span>GST {tax.rate}%:</span>
                              <span>₹{format(tax.total)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Total Tax */}
                  {totalTax > 0 && (
                    <div className="flex justify-between py-1 text-xs sm:text-sm text-gray-700">
                      <span className="font-semibold">Total GST:</span>
                      <span className="font-bold">₹{format(totalTax)}</span>
                    </div>
                  )}

                  {/* Grand Total */}
                  <div className="flex justify-between mt-3 border-t border-gray-300 pt-3 font-extrabold text-lg sm:text-xl text-blue-700">
                    <span>TOTAL:</span>
                    <span>₹{format(total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TERMS AND CONDITIONS SECTION */}
            <div className="mt-8 border-t pt-8">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={20} className="text-blue-600" />
                <h4 className="text-lg sm:text-xl font-bold text-gray-800">Terms & Conditions</h4>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-200">
                <textarea
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm sm:text-base"
                  value={invoiceData.termsAndConditions}
                  onChange={(e) => handleTermsChange(e.target.value)}
                  placeholder="Enter terms and conditions..."
                />
                <div className="mt-2 text-xs text-gray-500">
                  <p>💡 Include payment terms, delivery conditions, warranty, etc.</p>
                </div>
              </div>
            </div>

            <div className="text-center sm:text-right mt-8">
              <button
                onClick={saveInvoice}
                className="bg-blue-600 text-white px-6 py-3 sm:px-8 sm:py-3 rounded-lg shadow-lg hover:bg-blue-700 transition duration-150 font-semibold text-base sm:text-lg w-full sm:w-auto"
              >
                {editIndex !== null ? "Update Invoice" : "Save Invoice"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PREVIEW VIEW - Mobile Responsive */}
      {currentScreen === "preview" && (
        <div className="max-w-6xl mx-auto p-1 sm:p-2"> 
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <button 
              onClick={exitScreen} 
              className="flex items-center text-blue-600 hover:text-blue-800 font-medium gap-1 p-2 rounded-lg hover:bg-white transition w-full sm:w-auto"
            >
              <ChevronLeft size={24} /> Back to Invoices
            </button>

            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleSendEmail}
                className="bg-green-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow hover:bg-green-700 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium w-full sm:w-auto"
                disabled={generatingPDF}
              >
                <Mail size={14} /> Email
              </button>
              <button
                onClick={handleDownloadPDF}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg shadow hover:bg-red-700 flex items-center justify-center gap-2 text-xs sm:text-sm font-medium w-full sm:w-auto"
                disabled={generatingPDF}
              >
                {generatingPDF ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <Download size={14} /> PDF
                  </>
                )}
              </button>
            </div>
          </div>
        
          {/* Invoice Preview Content */}
          <div id="invoice-preview" ref={previewRef} className="bg-white p-4 sm:p-6 md:p-8 shadow-xl rounded-xl overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-start border-b pb-4 sm:pb-6 mb-4 sm:mb-6 gap-4">
              <div className="w-full">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">{BUSINESS_INFO.name}</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">{BUSINESS_INFO.address}</p>
                <p className="text-xs sm:text-sm text-gray-600">GSTIN: {BUSINESS_INFO.gstin}</p>
                <p className="text-xs sm:text-sm text-gray-600">Phone: {BUSINESS_INFO.phone}</p>
                <p className="text-xs sm:text-sm text-gray-600">Email: {BUSINESS_INFO.email}</p>
              </div>
              
              <div className="text-right w-full lg:w-auto">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-blue-700 mb-2">INVOICE</h1>
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg inline-block w-full lg:w-auto">
                  <div className="text-xs sm:text-sm text-gray-600">Invoice ID</div>
                  <div className="text-xl sm:text-2xl font-bold text-blue-700">{invoiceData.invoiceId}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-2">Date: {invoiceData.invoiceDate}</div>
                  {invoiceData.dueDate && (
                    <div className="text-xs sm:text-sm text-red-600">Due: {invoiceData.dueDate}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2">Bill From:</h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="font-semibold text-sm sm:text-base">{BUSINESS_INFO.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{BUSINESS_INFO.address}</p>
                  <p className="text-xs sm:text-sm text-gray-600">GSTIN: {BUSINESS_INFO.gstin}</p>
                  <p className="text-xs sm:text-sm text-gray-600">State: {BUSINESS_INFO.state}</p>
                </div>
              </div>
              
              <div className="mt-4 lg:mt-0">
                <h3 className="text-base sm:text-lg font-bold text-gray-700 mb-2">Bill To:</h3>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  <p className="font-semibold text-sm sm:text-base">{invoiceData.customer.name}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{invoiceData.customer.city}, {invoiceData.customer.state}</p>
                  <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs ${invoiceData.customer.state === BUSINESS_INFO.state ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {invoiceData.customer.state === BUSINESS_INFO.state ? 'Same State (CGST+SGST)' : 'Other State (IGST)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Details in Preview */}
            {assignedDetails && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="text-blue-600" size={20} />
                  <h4 className="text-lg font-bold text-gray-800">Assigned Details</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Assign To</div>
                    <div className="flex items-center gap-2">
                      {getAssignToIcon(assignedDetails.assignTo)}
                      <span className="font-medium">{assignedDetails.assignTo}</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Assigned To</div>
                    <div className="font-medium">{assignedDetails.assignedTo}</div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Assigned Date</div>
                    <div className="font-medium">{assignedDetails.assignedDate}</div>
                  </div>
                </div>
                {assignedDetails.details && (
                  <div className="mt-3 bg-white p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">Details</div>
                    <div className="text-sm">{assignedDetails.details}</div>
                  </div>
                )}
              </div>
            )}

            {/* Items Table - Mobile Responsive */}
            <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6 sm:mb-8">
              <div className="min-w-[600px] sm:min-w-0">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-800 text-white">
                    <tr>
                      <th className="p-2 sm:p-3 text-left text-xs sm:text-sm">Item</th>
                      <th className="p-2 sm:p-3 text-center text-xs sm:text-sm">Qty</th>
                      <th className="p-2 sm:p-3 text-center text-xs sm:text-sm">Rate</th>
                      <th className="p-2 sm:p-3 text-center text-xs sm:text-sm">Service</th>
                      <th className="p-2 sm:p-3 text-center text-xs sm:text-sm">GST</th>
                      <th className="p-2 sm:p-3 text-right text-xs sm:text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 sm:p-3">
                          <div className="font-medium text-xs sm:text-sm">{item.item || "Item"}</div>
                          {item.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {item.description}
                            </div>
                          )}
                        </td>

                        <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">{item.qty}</td>
                        <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">₹{format(item.rate)}</td>
                        <td className="p-2 sm:p-3 text-center text-xs sm:text-sm">
                          {item.serviceCharge > 0 ? (
                            <span className="text-purple-600 text-xs sm:text-sm">
                              {item.serviceCharge}{item.serviceChargeType === 'percentage' ? '%' : '₹'}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-2 sm:p-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${item.gstRate > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {item.gstRate}%
                          </span>
                        </td>
                        <td className="p-2 sm:p-3 text-right font-medium text-xs sm:text-sm">
                          ₹{format(item.qty * item.rate)}
                          {item.serviceCharge > 0 && (
                            <div className="text-xs text-gray-500">
                              + ₹{format(calculateItemServiceCharge(item))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Section - Mobile Responsive */}
            <div className="flex justify-end">
              <div className="w-full sm:w-96 bg-gray-50 p-4 sm:p-6 rounded-lg">
                <div className="space-y-2 sm:space-y-3">
                  {/* Sub Total */}
                  <div className="flex justify-between text-sm sm:text-base">
                    <span className="text-gray-600">Sub Total:</span>
                    <span className="font-medium">₹{format(subTotal)}</span>
                  </div>
                  
                  {/* Service Charge */}
                  {totalServiceCharge > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-purple-600">
                      <span className="font-medium">Service Charge:</span>
                      <span className="font-bold">+ ₹{format(totalServiceCharge)}</span>
                    </div>
                  )}
                  
                  {/* Taxable Amount */}
                  <div className="flex justify-between border-t border-gray-300 pt-2 text-sm sm:text-base">
                    <span className="font-semibold text-gray-700">Taxable Amount:</span>
                    <span className="font-bold">₹{format(taxableAmount)}</span>
                  </div>
                  
                  {/* Discount */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm sm:text-base text-red-600">
                      <span className="font-medium">Discount:</span>
                      <span className="font-bold">- ₹{format(discountAmount)}</span>
                    </div>
                  )}
                  
                  {/* GST Base */}
                  <div className="flex justify-between border-t border-gray-300 pt-2 text-sm sm:text-base">
                    <span className="font-semibold text-blue-600">GST Base:</span>
                    <span className="font-bold text-blue-700">₹{format(gstBase)}</span>
                  </div>
                  
                  {/* GST Breakdown */}
                  {totalTax > 0 && (
                    <div className="pt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-gray-700 text-sm">GST:</span>
                        <span className={`text-xs px-2 py-1 rounded ${isSameState ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                          {gstTreatmentLabel}
                        </span>
                      </div>
                      {Object.values(taxBreakdown).map((tax, idx) => {
                        if (tax.total === 0) return null;
                        return (
                          <div key={idx} className="text-xs text-gray-600 space-y-1 mb-2">
                            <div className="flex justify-between">
                              <span>GST {tax.rate}%:</span>
                              <span>₹{format(tax.total)}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex justify-between border-t border-gray-300 pt-2 text-sm sm:text-base">
                        <span className="font-semibold">Total GST:</span>
                        <span className="font-bold">₹{format(totalTax)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Grand Total */}
                  <div className="pt-3 sm:pt-4 border-t border-gray-300">
                    <div className="flex justify-between text-lg sm:text-xl font-extrabold text-blue-700">
                      <span>TOTAL:</span>
                      <span>₹{format(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="text-base sm:text-lg font-bold text-gray-700 mb-2">Bank Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Bank: <span className="font-medium">{BUSINESS_INFO.bankDetails.name}</span></p>
                  <p className="text-xs sm:text-sm text-gray-600">Account: <span className="font-medium">{BUSINESS_INFO.bankDetails.accountNumber}</span></p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">IFSC: <span className="font-medium">{BUSINESS_INFO.bankDetails.ifscCode}</span></p>
                  <p className="text-xs sm:text-sm text-gray-600">Branch: <span className="font-medium">{BUSINESS_INFO.bankDetails.branch}</span></p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions Section */}
            {invoiceData.termsAndConditions && (
              <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
                <h4 className="text-base sm:text-lg font-bold text-gray-700 mb-2">Terms & Conditions</h4>
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                  {invoiceData.termsAndConditions.split('\n').map((line, index) => (
                    line.trim() && (
                      <div key={index} className="flex items-start mb-1 sm:mb-2 text-xs sm:text-sm text-gray-600">
                        <span className="mr-2">•</span>
                        <span>{line.trim()}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Status and Footer */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-center sm:text-left">
                  <div className={getStatusBadge(invoiceData.status)}>
                    {invoiceData.status}
                  </div>
                </div>
                <div className="text-center sm:text-right text-xs sm:text-sm text-gray-500">
                  <p>Generated: {new Date().toLocaleDateString()}</p>
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Add CSS animation for toast */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default Invoice;