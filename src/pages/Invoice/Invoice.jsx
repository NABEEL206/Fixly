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
  FileText,
  Settings,
  Printer,
  Download,
  CreditCard,
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

// Service charge options
const SERVICE_CHARGE_OPTIONS = [
  { value: "NONE", label: "No Service Charge" },
  { value: "AMOUNT", label: "Fixed Amount (₹)" },
  { value: "PERCENTAGE", label: "Percentage (%)" },
];

// Payment methods matching API expectations
const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "UPI", label: "UPI" },
  { value: "BANK", label: "Bank Transfer" },
];

// Utility function to remove leading zeros from numeric strings
const removeLeadingZerosFromNumeric = (value) => {
  if (!value && value !== 0) return value;

  // Convert to string if it's a number
  const stringValue = String(value);

  // If it's just "0", keep it
  if (stringValue === "0") return "0";

  // Remove leading zeros but keep the number
  const trimmed = stringValue.replace(/^0+(?=\d)/, "");

  // If the result is empty or just a decimal point, return "0"
  if (trimmed === "" || trimmed === ".") return "0";

  // If it's a decimal number, ensure proper format
  if (trimmed.includes(".")) {
    const [whole, decimal] = trimmed.split(".");
    // Remove leading zeros from whole part
    const formattedWhole = whole.replace(/^0+(?=\d)/, "") || "0";
    return `${formattedWhole}.${decimal}`;
  }

  return trimmed;
};

// Format number for display in input fields
const formatNumberForInput = (value) => {
  if (value === 0 || value === "0") return "0";
  if (!value && value !== 0) return "";
  return String(value);
};

// Helper function to transform API invoice data to frontend format
const transformInvoiceData = (apiInvoice) => {
  const safeInv = apiInvoice || {};

  // Determine assign type and name
  let assign_type = null;
  let assign_id = null;
  let assign_name = null;
  let assign_shop_type = null;

  if (safeInv.assigned_shop) {
    assign_type = "shop";
    assign_id = safeInv.assigned_shop;
    assign_name = safeInv.assigned_shop_name || "";
    assign_shop_type = safeInv.assigned_shop_type
      ? safeInv.assigned_shop_type.toUpperCase()
      : null;
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
      description: safeLine.description || safeLine.item_description || "",
      service_charge_type: safeLine.service_charge_type || "AMOUNT",
      service_charge_value: parseFloat(safeLine.service_charge_value) || 0,
      service_charge_amount: parseFloat(safeLine.service_charge_amount) || 0,
      gst_treatment: safeLine.gst_treatment || "GST_5",
      line_amount: parseFloat(safeLine.line_amount) || 0,
      taxable_amount: parseFloat(safeLine.taxable_amount) || 0,
      line_tax: parseFloat(safeLine.line_tax) || 0,
      line_total: parseFloat(safeLine.line_total) || 0,
    };
  });

  // Get payments
  const payments = Array.isArray(safeInv.payments)
    ? safeInv.payments.map((p) => ({
        ...p,
        amount: parseFloat(p.amount) || 0,
        id: p.id,
        invoice: p.invoice,
        invoice_number: p.invoice_number,
        payment_date: p.payment_date,
        payment_mode: p.payment_mode,
        reference_no: p.reference_no,
        notes: p.notes,
        pdf_url: p.pdf_url,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }))
    : [];

  // Calculate amount paid and balance due
  const amountPaid = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount || 0),
    0,
  );
  const grandTotal = parseFloat(safeInv.grand_total) || 0;

  return {
    id: safeInv.id,
    customer: safeInv.customer,
    customer_name: safeInv.customer_name,
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
    discount_amount: parseFloat(safeInv.discount_amount) || 0,
    shipping_charge: parseFloat(safeInv.shipping_charge) || 0,
    adjustment: parseFloat(safeInv.adjustment) || 0,
    service_charge_type: safeInv.service_charge_type || "NONE",
    service_charge_value: parseFloat(safeInv.service_charge_value) || 0,
    service_charge_amount: parseFloat(safeInv.service_charge_amount) || 0,
    terms_conditions: safeInv.terms_conditions || "",
    notes: safeInv.notes || "",
    lines: lines,
    items: items,
    sub_total: parseFloat(safeInv.sub_total) || 0,
    service_charge_total: parseFloat(safeInv.service_charge_total) || 0,
    taxable_amount: parseFloat(safeInv.taxable_amount) || 0,
    gst_breakdown: safeInv.gst_breakdown || {},
    grand_total: grandTotal,
    amount_paid: amountPaid,
    balance_due: grandTotal - amountPaid,
    payments: payments,
    supply_type: safeInv.supply_type || "INTRASTATE",
    gst_mode: safeInv.gst_mode || "CGST+SGST",
    pdf_url: safeInv.pdf_url,
    sync_status: safeInv.sync_status,
    last_error: safeInv.last_error,
    created_at: safeInv.created_at,
    updated_at: safeInv.updated_at,
    created_by_display: safeInv.created_by_display,
  };
};

// ==================== PAYMENT MODAL COMPONENT ====================
const PaymentModal = ({
  selectedInvoice,
  paymentForm,
  paymentErrors,
  isSubmitting,
  handlePaymentInputChange,
  recordPayment,
  closePaymentModal,
}) => {
  if (!selectedInvoice) return null;

  return (
    <div className="fixed inset-0  flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-green-600 p-2 rounded-lg">
              <CreditCard className="text-white" size={18} />
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Record Payment
              </h3>
              <p className="text-xs text-gray-500">
                Invoice #{selectedInvoice?.invoice_number}
              </p>
            </div>
          </div>

          <button
            onClick={closePaymentModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="px-5 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-3 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Total</p>
              <p className="font-semibold text-gray-800">
                ₹{selectedInvoice?.grand_total?.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs">Paid</p>
              <p className="font-semibold text-green-600">
                ₹{selectedInvoice?.amount_paid?.toFixed(2)}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-xs">Balance</p>
              <p className="font-bold text-red-600">
                ₹{selectedInvoice?.balance_due?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Payment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Payment Date
            </label>

            <input
              type="date"
              name="payment_date"
              value={paymentForm.payment_date}
              onChange={handlePaymentInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Amount
            </label>

            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">₹</span>

              <input
                type="text"
                inputMode="decimal"
                name="amount"
                value={paymentForm.amount}
                onChange={(e) => {
                  const value = e.target.value;

                  // allow only numbers and decimal
                  if (/^\d*\.?\d*$/.test(value)) {
                    handlePaymentInputChange({
                      target: {
                        name: "amount",
                        value: value,
                      },
                    });
                  }
                }}
                className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Payment Method
            </label>

            <select
              name="method"
              value={paymentForm.method}
              onChange={handlePaymentInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Reference
            </label>

            <input
              type="text"
              name="reference"
              value={paymentForm.reference}
              onChange={handlePaymentInputChange}
              placeholder="Transaction ID / Check No"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t bg-gray-50">
          <button
            onClick={closePaymentModal}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={recordPayment}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CreditCard size={16} />
            )}
            Record Payment
          </button>
        </div>
      </div>
    </div>
  );
};

const getStatusBadge = (status) => {
  const base = "px-3 py-1 text-xs rounded-full font-semibold border";

  switch (status) {
    case "DRAFT":
      return base + " bg-gray-50 text-gray-700 border-gray-300";
    case "SENT":
      return base + " bg-blue-50 text-blue-700 border-blue-300";
    case "CANCELLED":
      return base + " bg-red-50 text-red-700 border-red-300";
    default:
      return base + " bg-gray-50 text-gray-700 border-gray-300";
  }
};

// View Modal Component
const InvoiceViewModal = ({
  invoice,
  customers,
  onClose,
  onEdit,
  onPDF,
  onAddPayment,
}) => {
  // Safe number formatting function
  const formatNumber = (value) => {
    if (value === null || value === undefined || isNaN(value)) return "0.00";
    const num = Number(value);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };

  const getCustomerName = (customerId) => {
    if (!customerId) return "Unknown Customer";
    const customer = customers.find((c) => c.id === customerId);
    return customer?.customer_name || "Unknown Customer";
  };

  const getCustomerDetails = (customerId) => {
    if (!customerId) return null;
    return customers.find((c) => c.id === customerId);
  };

  const calculateSubtotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const qty = Number(item?.qty) || 0;
      const rate = Number(item?.rate) || 0;
      return sum + qty * rate;
    }, 0);
  };

  const calculateServiceChargeTotal = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const amount = Number(item?.service_charge_amount) || 0;
      return sum + amount;
    }, 0);
  };

  const calculateTaxableAmount = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => {
      const amount = Number(item?.taxable_amount) || 0;
      return sum + amount;
    }, 0);
  };

  if (!invoice) return null;

  const customerDetails = getCustomerDetails(invoice.customer);

  // Safe calculations with proper number handling
  const subtotal = calculateSubtotal(invoice.items || []);
  const serviceChargeTotal = calculateServiceChargeTotal(invoice.items || []);
  const taxableAmount = calculateTaxableAmount(invoice.items || []);

  const discountAmount = Number(invoice.discount_amount) || 0;
  const afterDiscount = taxableAmount - discountAmount;

  const shippingCharge = Number(invoice.shipping_charge) || 0;
  const adjustment = Number(invoice.adjustment) || 0;

  const afterShippingAndAdjustment =
    afterDiscount + shippingCharge + adjustment;

  // Calculate GST total safely
  const totalGST = Object.values(invoice.gst_breakdown || {}).reduce(
    (sum, tax) => sum + (Number(tax?.tax) || 0),
    0,
  );

  const grandTotal = afterShippingAndAdjustment + totalGST;

  // Calculate amount paid and balance due
  const amountPaid = Number(invoice.amount_paid) || 0;
  const balanceDue = grandTotal - amountPaid;

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container - Centered */}
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {/* Modal Content */}
          <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-3" size={24} />
                  <div>
                    <h3 className="text-lg font-semibold">Invoice Details</h3>
                    <p className="text-xs text-blue-100 mt-1">
                      {invoice.invoice_number}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-white hover:bg-blue-500 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mb-4">
                {balanceDue > 0 && (
                  <button
                    onClick={() => {
                      onClose();
                      onAddPayment(invoice);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                  >
                    <CreditCard size={16} />
                    Record Payment
                  </button>
                )}
                <button
                  onClick={() => {
                    onClose();
                    onEdit();
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  <Edit size={16} />
                  Edit
                </button>
                {invoice.pdf_url && (
                  <button
                    onClick={() => onPDF(invoice.pdf_url)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Eye size={16} />
                    View PDF
                  </button>
                )}
              </div>

              {/* Invoice Info - Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Left Column - Invoice Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 pb-2 border-b">
                    Invoice Information
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Number:</span>
                      <span className="font-medium">
                        {invoice.invoice_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Date:</span>
                      <span>{invoice.invoice_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span>{invoice.due_date || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={getStatusBadge(invoice.status)}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Supply Type:</span>
                      <span>{invoice.supply_type || "INTRASTATE"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">GST Mode:</span>
                      <span>{invoice.gst_mode || "CGST+SGST"}</span>
                    </div>
                    {invoice.sync_status && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sync Status:</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            invoice.sync_status === "SYNCED"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {invoice.sync_status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Customer Information */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 pb-2 border-b">
                    Customer Information
                  </h4>
                  <div className="space-y-3 text-sm">
                    {/* Customer Name */}
                    <div>
                      <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                        Name
                      </span>
                      <p className="font-medium text-base">
                        {invoice.customer_name ||
                          getCustomerName(invoice.customer)}
                      </p>
                    </div>

                    {/* Contact Information - Two Column */}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                          Phone
                        </span>
                        <p className="font-medium">
                          {invoice.customer_phone ||
                            customerDetails?.customer_phone ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                          Email
                        </span>
                        <p className="font-medium break-all">
                          {invoice.customer_email ||
                            customerDetails?.email ||
                            "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Address */}
                    {(invoice.customer_address || customerDetails?.address) && (
                      <div>
                        <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                          Address
                        </span>
                        <p className="text-gray-800">
                          {invoice.customer_address || customerDetails?.address}
                        </p>
                      </div>
                    )}

                    {/* Location Information - Three Column */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                          City
                        </span>
                        <p>
                          {invoice.customer_city ||
                            customerDetails?.area ||
                            customerDetails?.city ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                          Pincode
                        </span>
                        <p>
                          {invoice.customer_pincode ||
                            customerDetails?.pincode ||
                            "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                          State
                        </span>
                        <p className="font-medium">
                          {invoice.customer_state ||
                            customerDetails?.state ||
                            "Kerala"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Info - Only if exists */}
              {invoice.assign_name && (
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 pb-2 border-b">
                    Assignment Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                        Assign Type
                      </span>
                      <p className="font-medium capitalize flex items-center gap-1">
                        {invoice.assign_type === "shop" ? "🏪" : "🏷️"}
                        {invoice.assign_type}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                        Assigned To
                      </span>
                      <p className="font-medium">{invoice.assign_name}</p>
                    </div>
                    {invoice.assign_shop_type && (
                      <div>
                        <span className="text-gray-600 block text-xs uppercase tracking-wider mb-1">
                          Shop Type
                        </span>
                        <p className="font-medium">
                          {invoice.assign_shop_type}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 pb-2 border-b">
                  Items
                </h4>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">
                          Item
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                          Qty
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                          Rate (₹)
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                          Service
                        </th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-600">
                          GST %
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">
                          Amount (₹)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {invoice.items?.map((item, index) => {
                        const itemQty = Number(item?.qty) || 0;
                        const itemRate = Number(item?.rate) || 0;
                        const itemServiceAmount =
                          Number(item?.service_charge_amount) || 0;
                        const itemAmount =
                          itemQty * itemRate + itemServiceAmount;

                        return (
                          <React.Fragment key={index}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium">
                                  {item.item_name}
                                </div>
                                {(item.description ||
                                  item.item_description) && (
                                  <div className="text-xs text-gray-500 mt-1 italic">
                                    {item.description || item.item_description}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                {itemQty}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                ₹{formatNumber(itemRate)}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                {itemServiceAmount > 0 ? (
                                  <span className="text-purple-600 font-medium">
                                    ₹{formatNumber(itemServiceAmount)}
                                    {item.service_charge_type ===
                                      "PERCENTAGE" &&
                                      ` (${Number(item.service_charge_value) || 0}%)`}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                  {item.gst_treatment
                                    ?.replace("GST_", "")
                                    .replace("_", ".")}
                                  %
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                ₹{formatNumber(itemAmount)}
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary - Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left Column - Terms & Notes */}
                <div className="space-y-4">
                  {invoice.terms_conditions && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2 pb-2 border-b">
                        Terms & Conditions
                      </h4>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {invoice.terms_conditions}
                      </p>
                    </div>
                  )}

                  {invoice.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2 pb-2 border-b">
                        Notes
                      </h4>
                      <p className="text-sm text-gray-600">{invoice.notes}</p>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(invoice.discount_type ||
                    invoice.service_charge_type !== "NONE") && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-700 mb-2 pb-2 border-b">
                        Additional Information
                      </h4>
                      <div className="space-y-2 text-sm">
                        {invoice.discount_type &&
                          Number(invoice.discount_value) > 0 && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Discount Type:
                              </span>
                              <span className="font-medium">
                                {invoice.discount_type}
                              </span>
                            </div>
                          )}
                        {invoice.service_charge_type !== "NONE" &&
                          Number(invoice.service_charge_value) > 0 && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Service Charge Type:
                                </span>
                                <span className="font-medium">
                                  {invoice.service_charge_type}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">
                                  Service Charge Value:
                                </span>
                                <span className="font-medium">
                                  {invoice.service_charge_type === "PERCENTAGE"
                                    ? `${Number(invoice.service_charge_value) || 0}%`
                                    : `₹${formatNumber(invoice.service_charge_value)}`}
                                </span>
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Financial Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3 pb-2 border-b">
                    Financial Summary
                  </h4>
                  <div className="space-y-2 text-sm">
                    {/* Sub Total */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sub Total:</span>
                      <span className="font-medium">
                        ₹{formatNumber(subtotal)}
                      </span>
                    </div>

                    {/* Service Charges */}
                    {serviceChargeTotal > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Service Charges:</span>
                        <span className="font-medium">
                          + ₹{formatNumber(serviceChargeTotal)}
                        </span>
                      </div>
                    )}

                    {/* Taxable Amount */}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">
                        Taxable Amount:
                      </span>
                      <span className="font-bold">
                        ₹{formatNumber(taxableAmount)}
                      </span>
                    </div>

                    {/* Discount */}
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>
                          Discount{" "}
                          {invoice.discount_type === "PERCENT"
                            ? `(${Number(invoice.discount_value) || 0}%)`
                            : ""}
                          :
                        </span>
                        <span className="font-medium">
                          - ₹{formatNumber(discountAmount)}
                        </span>
                      </div>
                    )}

                    {/* After Discount */}
                    <div className="flex justify-between">
                      <span className="text-gray-600">After Discount:</span>
                      <span className="font-medium">
                        ₹{formatNumber(afterDiscount)}
                      </span>
                    </div>

                    {/* Shipping Charge */}
                    {shippingCharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping Charge:</span>
                        <span className="font-medium">
                          + ₹{formatNumber(shippingCharge)}
                        </span>
                      </div>
                    )}

                    {/* Adjustment */}
                    {adjustment > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Adjustment:</span>
                        <span className="font-medium">
                          + ₹{formatNumber(adjustment)}
                        </span>
                      </div>
                    )}

                    {/* After Shipping & Adjustment */}
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">
                        After Charges:
                      </span>
                      <span className="font-bold">
                        ₹{formatNumber(afterShippingAndAdjustment)}
                      </span>
                    </div>

                    {/* GST Breakdown */}
                    {Object.keys(invoice.gst_breakdown || {}).length > 0 && (
                      <>
                        <div className="flex justify-between items-center pt-2">
                          <span className="font-medium text-gray-700">
                            GST Details:
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              invoice.customer_state === "Kerala"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {invoice.gst_mode ||
                              (invoice.customer_state === "Kerala"
                                ? "CGST+SGST"
                                : "IGST")}
                          </span>
                        </div>
                        {Object.entries(invoice.gst_breakdown).map(
                          ([key, tax]) => {
                            const taxAmount = Number(tax?.tax) || 0;
                            return (
                              taxAmount > 0 && (
                                <div
                                  key={key}
                                  className="flex justify-between text-xs pl-4"
                                >
                                  <span className="text-gray-600">
                                    GST {tax.rate}%:
                                  </span>
                                  <span className="font-medium">
                                    + ₹{formatNumber(taxAmount)}
                                  </span>
                                </div>
                              )
                            );
                          },
                        )}
                        <div className="flex justify-between text-sm font-medium pt-1">
                          <span className="text-gray-700">Total GST:</span>
                          <span className="font-bold text-blue-600">
                            ₹{formatNumber(totalGST)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Grand Total */}
                    <div className="flex justify-between pt-3 border-t-2 border-gray-300 text-base">
                      <span className="font-bold text-gray-800">
                        GRAND TOTAL:
                      </span>
                      <span className="font-bold text-blue-700 text-lg">
                        ₹{formatNumber(grandTotal)}
                      </span>
                    </div>

                    {/* Amount Paid & Balance Due */}
                    {amountPaid > 0 && (
                      <>
                        <div className="flex justify-between pt-2 text-sm">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-medium text-green-600">
                            ₹{formatNumber(amountPaid)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-300">
                          <span className="font-medium text-gray-700">
                            Balance Due:
                          </span>
                          <span className="font-bold text-red-600">
                            ₹{formatNumber(balanceDue)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Payments History */}
              {invoice.payments && invoice.payments.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard size={18} className="text-green-600" />
                    Payment History
                  </h4>

                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Method</th>
                          <th className="p-3 text-left">Reference</th>
                          <th className="p-3 text-right">Amount</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {invoice.payments.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50">
                            <td className="p-3">{p.payment_date}</td>

                            <td className="p-3">
                              {p.payment_mode || p.method}
                            </td>

                            <td className="p-3">
                              {p.reference_no || p.reference || "-"}
                            </td>

                            <td className="p-3 text-right font-semibold text-green-600">
                              ₹{formatNumber(p.amount)}
                            </td>

                            <td className="p-3 text-center">
                              <button
                                onClick={() =>
                                  onPDF(`/zoho/invoice-payments/${p.id}/pdf/`)
                                }
                                className="flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800"
                              >
                                <FileText size={14} />
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Error Info - if any */}
              {invoice.last_error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-700 mb-1 flex items-center gap-1">
                    <AlertCircle size={14} />
                    Error Information
                  </h4>
                  <p className="text-sm text-red-600">{invoice.last_error}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Initial state for invoice form
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

  invoice_number: "",
  status: "DRAFT",
  invoice_date: new Date().toISOString().split("T")[0],
  due_date: new Date(new Date().setDate(new Date().getDate() + 7))
    .toISOString()
    .split("T")[0],

  discount_type: "PERCENT",
  discount_value: 0,
  discount_amount: 0,

  shipping_charge: 0,
  adjustment: 0,

  service_charge_type: "NONE",
  service_charge_value: 0,
  service_charge_amount: 0,

  terms_conditions: "",
  notes: "",

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
  amount_paid: 0,
  balance_due: 0,
  payments: [],
};

const Invoice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const complaintData = location.state?.complaintData;
  const quotationData = location.state?.quotationData;
  const [quotationId, setQuotationId] = useState(null);

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
  const [pdfId, setPdfId] = useState(null); // Track which PDF is loading

  const [invoiceData, setInvoiceData] = useState(initialInvoiceState);
  const [customerComplaints, setCustomerComplaints] = useState([]);
  const [selectedInvoices, setSelectedInvoices] = useState([]);

  // View modal state
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState(null);

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "CASH",
    reference: "",
    notes: "",
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});

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
      toast.error("Please log in to view invoices");
    }
  }, []);

  useEffect(() => {
    if (location.state?.quotationId) {
      setQuotationId(location.state.quotationId);
    }
  }, [location.state]);

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

  // Initialize payment form when selectedInvoiceForPayment changes
  useEffect(() => {
    if (selectedInvoiceForPayment) {
      const balanceDue = Number(
        (
          parseFloat(selectedInvoiceForPayment.grand_total || 0) -
          parseFloat(selectedInvoiceForPayment.amount_paid || 0)
        ).toFixed(2),
      );

      setPaymentForm({
        payment_date: new Date().toISOString().split("T")[0],
        amount: balanceDue.toFixed(2),
        method: "CASH",
        reference: "",
        notes: "",
      });

      setPaymentErrors({});
    }
  }, [selectedInvoiceForPayment]);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      const response = await axiosInstance.get("/api/customers/");
      const data = response.data;
      setCustomers(Array.isArray(data) ? data : data?.results || []);
    } catch (error) {
      console.error("Fetch customers error:", error);
      toast.error("Failed to load customers");
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
      toast.error("Failed to load items");
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
    const numbers = invoices
      .map((inv) => {
        const match = inv.invoice_number?.match(/INV-(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(Boolean);

    const next = numbers.length ? Math.max(...numbers) + 1 : 1;

    return `INV-${String(next).padStart(4, "0")}`;
  };

  // Fetch invoices from API
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/zoho/local-invoices/");
      const data = response.data;
      const invoicesList = Array.isArray(data) ? data : data?.results || [];

      // Transform each invoice using the helper
      const transformed = invoicesList.map(transformInvoiceData);

      setInvoices(transformed);
    } catch (error) {
      console.error("Fetch invoices error:", error);
      if (error.response?.status !== 401 && error.response?.status !== 404) {
        toast.error("Failed to load invoices");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Validate Payment Form
  const validatePaymentForm = () => {
    const newErrors = {};

    if (!paymentForm.payment_date) {
      newErrors.payment_date = "Payment date is required";
    }

    const balanceDue = Number(
      (
        parseFloat(selectedInvoiceForPayment.grand_total || 0) -
        parseFloat(selectedInvoiceForPayment.amount_paid || 0)
      ).toFixed(2),
    );

    const amount = parseFloat(paymentForm.amount) || 0;

    if (!paymentForm.amount || amount <= 0) {
      newErrors.amount = "Valid amount is required";
    } else if (amount > balanceDue) {
      newErrors.amount = `Amount cannot exceed balance due (₹${balanceDue.toFixed(2)})`;
    }

    if (!paymentForm.method) {
      newErrors.method = "Payment method is required";
    }

    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Record Payment
  const recordPayment = async () => {
    if (!selectedInvoiceForPayment) {
      toast.error("No invoice selected");
      return;
    }

    if (!validatePaymentForm()) {
      toast.error("Please fix payment errors");
      return;
    }

    setIsSubmittingPayment(true);
    const loadingToast = toast.loading("Recording payment...");

    try {
      const paymentData = {
        invoice: selectedInvoiceForPayment.id,
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_mode: paymentForm.method,
        reference_no: paymentForm.reference || `PAY-${Date.now()}`,
        notes:
          paymentForm.notes ||
          `Payment recorded for invoice ${selectedInvoiceForPayment.invoice_number}`,
      };

      // Create payment
      await axiosInstance.post("/zoho/invoice-payments/", paymentData);

      // Refresh invoices to update balance and payment history
      await fetchInvoices();

      toast.success("Payment recorded successfully!", { id: loadingToast });
      closePaymentModal();
    } catch (error) {
      console.error("Payment error:", error);

      if (error.response) {
        let errorMessage = "Failed to record payment";

        if (error.response.status === 400) {
          const errorData = error.response.data;
          if (typeof errorData === "object") {
            const errors = Object.entries(errorData)
              .map(([key, value]) => `${key}: ${value}`)
              .join(", ");
            errorMessage = errors;
          }
        } else if (error.response.status === 404) {
          errorMessage = "Payment API endpoint not found";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again.";
        }

        toast.error(errorMessage, { id: loadingToast });

        if (error.response.data) {
          setPaymentErrors((prev) => ({
            ...prev,
            ...error.response.data,
          }));
        }
      } else if (error.request) {
        toast.error("No response from server. Check your connection.", {
          id: loadingToast,
        });
      } else {
        toast.error("Error: " + error.message, { id: loadingToast });
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handle payment input change
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (paymentErrors[name]) {
      setPaymentErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Close payment modal
  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedInvoiceForPayment(null);
    setPaymentErrors({});
    setPaymentForm({
      payment_date: new Date().toISOString().split("T")[0],
      amount: "",
      method: "CASH",
      reference: "",
      notes: "",
    });
  };

  // Open payment modal
  const openPaymentModal = (invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setShowPaymentModal(true);
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

    const afterDiscount = Math.max(0, taxableAmount - discountAmount);

    // Add shipping charge and adjustment
    const shippingCharge = parseFloat(invoiceData.shipping_charge) || 0;
    const adjustment = parseFloat(invoiceData.adjustment) || 0;

    const afterShippingAndAdjustment =
      afterDiscount + shippingCharge + adjustment;

    // Calculate GST breakdown
    let totalGST = 0;
    const gstBreakdown = {};

    itemsWithCalculations.forEach((item) => {
      const itemTaxable = item.taxable_amount;
      const proportion = taxableAmount > 0 ? itemTaxable / taxableAmount : 0;
      const itemGstBase = afterDiscount * proportion;

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

    const grandTotal = afterShippingAndAdjustment + totalGST;

    return {
      subTotal,
      serviceChargeTotal,
      taxableAmount,
      discountAmount,
      afterDiscount,
      shippingCharge,
      adjustment,
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
    invoiceData.shipping_charge,
    invoiceData.adjustment,
    invoiceData.customer_state,
  ]);

  // Handle customer selection change
  const handleCustomerChange = (customerId) => {
    const id = customerId ? parseInt(customerId) : null;
    const customer = customers.find((c) => c.id === id);

    let assign_type = null;
    let assign_id = null;
    let assign_name = "";

    const complaints = customer?.complaints_history || [];
    setCustomerComplaints(complaints);

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

    setInvoiceData((prev) => ({
      ...prev,
      customer: id,
      customer_phone: customer?.customer_phone || "",
      customer_email: customer?.email || "",
      customer_address: customer?.address || "",
      customer_state: customer?.state || "Kerala",
      customer_city: customer?.area || customer?.city || "",
      customer_pincode: customer?.pincode || "",
      assign_type: assign_type || prev.assign_type,
      assign_id: assign_id || prev.assign_id,
      assign_name: assign_name || prev.assign_name,
    }));
  };

  // Handle complaint data
  useEffect(() => {
    if (complaintData && customers.length > 0) {
      const customer = customers.find((c) => c.id === complaintData.customer);

      setInvoiceData((prev) => ({
        ...prev,
        invoice_number: generateInvoiceNumber(),
        invoice_date: new Date().toISOString().split("T")[0],
        customer: customer?.id || null,
        customer_phone: customer?.customer_phone || "",
        customer_email: customer?.email || "",
        customer_address: customer?.address || "",
        customer_state: customer?.state || "Kerala",
        customer_city: customer?.area || customer?.city || "",
        customer_pincode: customer?.pincode || "",

        // ⭐ ADD THIS
        invoice_number: generateInvoiceNumber(),
        invoice_date: new Date().toISOString().split("T")[0],
        status: "SENT",
      }));

      setCurrentScreen("form");
      setEditIndex(null);

      // ⭐ Prevent duplicate prefill
      navigate(location.pathname, { replace: true });
    }
  }, [complaintData, customers, invoices]);

  useEffect(() => {
    if (quotationData && customers.length > 0 && invoices.length > 0) {
      const customer = customers.find((c) => c.id === quotationData.customer);

      const quoteItems = quotationData.items || quotationData.lines || [];

      const mappedItems = quoteItems.map((item) => ({
        item_id: item.item || item.item_id,
        item_name: item.item_name || "",
        qty: parseFloat(item.qty || item.quantity) || 1,
        rate: parseFloat(item.rate) || 0,
        description: item.description || "",
        service_charge_type: item.service_charge_type || "AMOUNT",
        service_charge_value: parseFloat(item.service_charge_value || 0),
        service_charge_amount: 0,
        gst_treatment: item.gst_treatment || `GST_${item.gst_rate || 5}`,
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

        invoice_number: generateInvoiceNumber(),
        invoice_date: new Date().toISOString().split("T")[0],
        due_date: quotationData.expiry_date || "",
        status: "SENT",

        items: mappedItems,

        discount_type: quotationData.discount_type || "PERCENT",
        discount_value: parseFloat(quotationData.discount_value || 0),

        shipping_charge: parseFloat(quotationData.shipping_charge || 0),
        adjustment: parseFloat(quotationData.adjustment || 0),

        service_charge_type: quotationData.service_charge_type || "NONE",
        service_charge_value: parseFloat(
          quotationData.service_charge_value || 0,
        ),

        terms_conditions: quotationData.terms_conditions || "",
        notes: quotationData.notes || "",

        amount_paid: 0,
        balance_due: 0,
        payments: [],
      }));

      setCurrentScreen("form");
      setEditIndex(null);

      toast.success("Quotation converted to invoice");

      navigate(location.pathname, { replace: true });
    }
  }, [quotationData, customers, invoices]); // ⭐ FIX

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    const duplicate = invoices.find(
      (inv) =>
        inv.invoice_number === invoiceData.invoice_number &&
        inv.id !== invoiceData.id,
    );

    if (duplicate) {
      newErrors.invoice_number = "Invoice number already exists";
    }

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

    // Validate new fields
    if (invoiceData.shipping_charge < 0) {
      newErrors.shipping_charge = "Shipping charge cannot be negative";
    }

    if (invoiceData.adjustment < 0) {
      newErrors.adjustment = "Adjustment cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Transform to API format
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
      shipping_charge: formatNumber(
        parseFloat(invoiceData.shipping_charge) || 0,
      ),
      adjustment: formatNumber(parseFloat(invoiceData.adjustment) || 0),
      service_charge_type: invoiceData.service_charge_type || "NONE",
      service_charge_value: formatNumber(
        parseFloat(invoiceData.service_charge_value) || 0,
      ),
      terms_conditions: invoiceData.terms_conditions || "",
      notes: invoiceData.notes || "",
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
      toast.error("Please fix validation errors");
      return;
    }

    // Check if there are any valid items
    const validItems = invoiceData.items.filter((item) => item.item_id);
    if (validItems.length === 0) {
      toast.error("At least one valid item is required");
      return;
    }

    setIsLoading(true);
    const loadingToast = toast.loading(
      editIndex !== null ? "Updating invoice..." : "Creating invoice...",
    );

    try {
      const apiData = transformToAPIFormat();

      if (editIndex !== null && invoiceData.id) {
        await axiosInstance.put(
          `/zoho/local-invoices/${invoiceData.id}/`,
          apiData,
        );
      } else {
        const res = await axiosInstance.post("/zoho/local-invoices/", apiData);

        if (quotationId) {
          await axiosInstance.patch(`/zoho/quotations/${quotationId}/`, {
            status: "CONVERTED",
          });
        }
      }

      toast.success(
        `Invoice ${editIndex !== null ? "updated" : "created"} successfully!`,
        { id: loadingToast },
      );
      await fetchInvoices();
      exitScreen();
    } catch (error) {
      console.error("Save invoice error:", error);
      toast.dismiss(loadingToast);

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

          toast.error(errorMessage);
        } else {
          toast.error(error.response.data?.message || "Failed to save invoice");
        }
      } else if (error.request) {
        toast.error("No response from server. Please check your connection.");
      } else {
        toast.error("Error: " + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk delete invoices
  const bulkDeleteInvoices = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("No invoices selected");
      return;
    }

    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete {selectedInvoices.length} Invoices?
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
                const loadingToast = toast.loading("Deleting invoices...");

                try {
                  await Promise.all(
                    selectedInvoices.map((id) =>
                      axiosInstance.delete(`/zoho/local-invoices/${id}/`),
                    ),
                  );

                  await fetchInvoices();
                  setSelectedInvoices([]);

                  toast.success(`${selectedInvoices.length} invoices deleted`, {
                    id: loadingToast,
                  });
                } catch (error) {
                  console.error("Bulk delete error:", error);
                  toast.error("Error deleting invoices", { id: loadingToast });
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

  // Handle view invoice
  const handleView = (invoice) => {
    console.log("Opening view modal for invoice:", invoice);
    setSelectedInvoiceForView(invoice);
    setViewModalOpen(true);
  };

  // Edit invoice
  const handleEdit = (invoice) => {
    const customer = customers.find((c) => c.id === invoice.customer);

    setInvoiceData({
      ...initialInvoiceState, // start from default structure
      ...invoice, // then apply invoice values
      items: invoice.items?.length ? invoice.items : initialInvoiceState.items,

      customer_phone: invoice.customer_phone || customer?.customer_phone || "",
      customer_email: invoice.customer_email || customer?.email || "",
      customer_address: invoice.customer_address || customer?.address || "",
      customer_state: invoice.customer_state || customer?.state || "Kerala",
      customer_city:
        invoice.customer_city || customer?.area || customer?.city || "",
      customer_pincode: invoice.customer_pincode || customer?.pincode || "",
    });

    setCustomerComplaints(customer?.complaints_history || []);

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
                  toast.error("Error deleting invoice", { id: loadingToast });
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
  const openPDF = async (url, id = null) => {
    if (!url) return;

    if (id) setPdfId(id);
    else setPdfLoading(true);

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
      toast.error("Failed to open PDF");
    } finally {
      if (id) setPdfId(null);
      else setPdfLoading(false);
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

    setInvoiceData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
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
        description:
          updatedItems[index].description ||
          selectedItem?.sales_description ||
          "",
        gst_treatment:
          selectedItem?.gst_treatment?.replace("IGST", "GST") || "GST_5",
        service_charge_value: parseFloat(selectedItem?.service_charge) || 0,
      };
    } else if (field === "qty" || field === "rate") {
      // Handle leading zeros for number inputs
      const formattedValue = removeLeadingZerosFromNumeric(value);
      updatedItems[index][field] =
        formattedValue === "" ? 0 : parseFloat(formattedValue) || 0;
    } else if (field === "service_charge_value") {
      const formattedValue = removeLeadingZerosFromNumeric(value);
      updatedItems[index].service_charge_value =
        formattedValue === "" ? 0 : parseFloat(formattedValue) || 0;

      // Calculate service charge amount immediately for UI
      const itemAmount = updatedItems[index].qty * updatedItems[index].rate;
      if (updatedItems[index].service_charge_type === "PERCENTAGE") {
        updatedItems[index].service_charge_amount =
          (itemAmount * (parseFloat(formattedValue) || 0)) / 100;
      } else {
        updatedItems[index].service_charge_amount =
          parseFloat(formattedValue) || 0;
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

    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
  };

  // Remove item
  const removeItem = (index) => {
    if (invoiceData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }

    const updatedItems = invoiceData.items.filter((_, i) => i !== index);

    setInvoiceData((prev) => ({
      ...prev,
      items: updatedItems,
    }));
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
        (inv.customer_name || getCustomerName(inv.customer) || "")
          .toLowerCase()
          .includes(search) ||
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
      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          selectedInvoice={selectedInvoiceForPayment}
          paymentForm={paymentForm}
          paymentErrors={paymentErrors}
          isSubmitting={isSubmittingPayment}
          handlePaymentInputChange={handlePaymentInputChange}
          recordPayment={recordPayment}
          closePaymentModal={closePaymentModal}
        />
      )}

      {/* View Modal */}
      {viewModalOpen && (
        <InvoiceViewModal
          invoice={selectedInvoiceForView}
          customers={customers}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedInvoiceForView(null);
          }}
          onEdit={() => {
            setViewModalOpen(false);
            handleEdit(selectedInvoiceForView);
          }}
          onPDF={openPDF}
          onAddPayment={openPaymentModal}
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
              {selectedInvoices.length > 0 && (
                <button
                  onClick={bulkDeleteInvoices}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete Selected ({selectedInvoices.length})
                </button>
              )}
              <button
                onClick={() => {
                  if (!invoices.length) {
                    toast.error("Invoices still loading...");
                    return;
                  }

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
              filteredInvoices.map((inv) => {
                const balanceDue = Number(
                  (
                    parseFloat(inv.grand_total || 0) -
                    parseFloat(inv.amount_paid || 0)
                  ).toFixed(2),
                );
                return (
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
                          {inv.customer_name || getCustomerName(inv.customer)}
                        </div>
                        {inv.assign_name && (
                          <div className="flex items-center gap-2 text-xs mt-1">
                            {inv.assign_shop_type && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-semibold">
                                {inv.assign_shop_type}
                              </span>
                            )}

                            <span className="text-gray-700">
                              {inv.assign_name}
                            </span>
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

                    {balanceDue > 0 ? (
                      <div className="mb-3 text-xs flex justify-between">
                        <span className="text-gray-600">Balance Due:</span>
                        <span className="font-semibold text-red-600">
                          ₹{format(balanceDue)}
                        </span>
                      </div>
                    ) : (
                      <div className="mb-3 text-xs flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-semibold text-green-600">
                          Paid
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between pt-3 border-t">
                      <button
                        onClick={() => handleView(inv)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => handleEdit(inv)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      {balanceDue > 0.01 && (
                        <button
                          onClick={() => openPaymentModal(inv)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                          title="Record Payment"
                        >
                          <CreditCard size={18} />
                        </button>
                      )}
                      {inv.pdf_url && (
                        <button
                          onClick={() => openPDF(inv.pdf_url, inv.id)}
                          disabled={pdfId === inv.id}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                          title="View PDF"
                        >
                          {pdfId === inv.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <FileText size={18} />
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
                );
              })
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
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
                    <th className="px-6 py-3 text-center">Invoice #</th>
                    <th className="px-6 py-3 text-center">Customer</th>
                    <th className="px-6 py-3 text-center">Date</th>
                    <th className="px-6 py-3 text-center">Due Date</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Total</th>
                    <th className="px-6 py-3 text-center">Payment</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-10 text-center text-gray-500"
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
                        colSpan="9"
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        {quickSearch ? "No invoices found" : "No invoices yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const balanceDue =
                        parseFloat(inv.grand_total || 0) -
                        parseFloat(inv.amount_paid || 0);
                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.includes(inv.id)}
                              onChange={() => toggleInvoiceSelection(inv.id)}
                            />
                          </td>
                          <td className="px-6 py-4 font-semibold text-blue-600 text-center">
                            {inv.invoice_number}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {inv.customer_name || getCustomerName(inv.customer)}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center">
                            {inv.invoice_date}
                          </td>
                          <td className="px-6 py-4 text-gray-600 text-center">
                            {inv.due_date || "-"}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={getStatusBadge(inv.status)}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-gray-800 text-center">
                            ₹{format(inv.grand_total)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {(() => {
                              const grandTotal = parseFloat(
                                inv.grand_total || 0,
                              );
                              const amountPaid = parseFloat(
                                inv.amount_paid || 0,
                              );
                              const balanceDue = grandTotal - amountPaid;

                              let paymentStatus = "UNPAID";

                              if (amountPaid >= grandTotal)
                                paymentStatus = "PAID";
                              else if (amountPaid > 0)
                                paymentStatus = "PARTIAL";

                              return (
                                <div className="flex flex-col items-center gap-1">
                                  {paymentStatus === "PAID" && (
                                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                      Paid
                                    </span>
                                  )}

                                  {paymentStatus === "PARTIAL" && (
                                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                                      Partial
                                    </span>
                                  )}

                                  {paymentStatus === "UNPAID" && (
                                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                      Unpaid
                                    </span>
                                  )}

                                  {/* Payment Receipt Buttons */}
                                  {inv.payments?.length > 0 && (
                                    <button
                                      onClick={() => {
                                        const latestPayment =
                                          inv.payments[inv.payments.length - 1];
                                        openPDF(
                                          `/zoho/invoice-payments/${latestPayment.id}/pdf/`,
                                        );
                                      }}
                                      className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                    >
                                      <FileText size={12} />
                                      Receipt
                                    </button>
                                  )}

                                  {balanceDue > 0 && (
                                    <span className="text-xs text-red-600 font-medium">
                                      Balance: ₹{format(balanceDue)}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleView(inv)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                title="View"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(inv)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              {balanceDue > 0 && (
                                <button
                                  onClick={() => openPaymentModal(inv)}
                                  className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                                  title="Record Payment"
                                >
                                  <CreditCard size={16} />
                                </button>
                              )}
                              {inv.pdf_url && (
                                <button
                                  onClick={() => openPDF(inv.pdf_url, inv.id)}
                                  disabled={pdfId === inv.id}
                                  className="p-1.5 text-purple-600 hover:bg-purple-50 rounded disabled:opacity-50"
                                  title="View PDF"
                                >
                                  {pdfId === inv.id ? (
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <FileText size={16} />
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
                      );
                    })
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
                      ? shops.map((shop) => {
                          const shopType = shop.shop_type?.toLowerCase();

                          const icon =
                            shopType === "franchise"
                              ? "🏬"
                              : shopType === "other_shop"
                                ? "🛍️"
                                : "🏪";

                          return (
                            <option key={shop.id} value={shop.id}>
                              {icon}{" "}
                              {shop.shop_type?.replace("_", " ").toUpperCase()}{" "}
                              — {shop.shopname}
                            </option>
                          );
                        })
                      : growtags.map((gt) => (
                          <option key={gt.id} value={gt.id}>
                            🏷️ Growtag — {gt.name}
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
                    setInvoiceData((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="SENT">SENT</option>
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
                  onChange={(e) => {
                    const newDate = e.target.value;

                    const dueDate = new Date(newDate);
                    dueDate.setDate(dueDate.getDate() + 7);

                    setInvoiceData({
                      ...invoiceData,
                      invoice_date: newDate,
                      due_date: dueDate.toISOString().split("T")[0],
                    });
                  }}
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
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-700 mb-3">
                  Customer Information
                </h4>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name</span>
                    <p className="font-medium">
                      {getCustomerName(invoiceData.customer)}
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500">Phone</span>
                    <p>{invoiceData.customer_phone || "N/A"}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">Email</span>
                    <p>{invoiceData.customer_email || "N/A"}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">State</span>
                    <p>{invoiceData.customer_state || "Kerala"}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">City</span>
                    <p>{invoiceData.customer_city || "N/A"}</p>
                  </div>

                  <div>
                    <span className="text-gray-500">Pincode</span>
                    <p>{invoiceData.customer_pincode || "N/A"}</p>
                  </div>

                  <div className="col-span-2">
                    <span className="text-gray-500">Address</span>
                    <p>{invoiceData.customer_address || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            {invoiceData.customer && customerComplaints.length > 0 && (
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
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                        Item
                      </th>

                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        Qty
                      </th>

                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        Rate (₹)
                      </th>

                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        Service Charge
                      </th>

                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        GST %
                      </th>

                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">
                        Amount
                      </th>

                      <th className="px-4 py-2 text-center text-xs font-semibold text-gray-600">
                        Action
                      </th>
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
                              onBlur={(e) => {
                                const numValue =
                                  parseFloat(e.target.value) || 0;
                                if (numValue !== item.qty) {
                                  updateItem(index, "qty", numValue);
                                }
                              }}
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
                              onBlur={(e) => {
                                const numValue =
                                  parseFloat(e.target.value) || 0;
                                if (numValue !== item.rate) {
                                  updateItem(index, "rate", numValue);
                                }
                              }}
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
                            <div className="flex items-center border rounded-lg overflow-hidden w-[200px] bg-white">
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
                                placeholder="Service charge"
                                className="w-[130px] px-3 py-1.5 text-sm text-right outline-none"
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
                                className="w-[70px] px-2 py-1.5 text-sm bg-gray-100 border-l outline-none cursor-pointer"
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

            {/* Terms, Notes, and Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold mb-2">Terms & Conditions</h4>
                  <textarea
                    value={invoiceData.terms_conditions}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        terms_conditions: e.target.value,
                      })
                    }
                    rows="6"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Enter terms and conditions..."
                  />
                </div>

                <div>
                  <h4 className="font-bold mb-2">Notes</h4>
                  <textarea
                    value={invoiceData.notes || ""}
                    onChange={(e) =>
                      setInvoiceData({
                        ...invoiceData,
                        notes: e.target.value,
                      })
                    }
                    rows="4"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* Invoice Summary Card */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-semibold mb-3 text-gray-700">
                  Invoice Summary
                </h4>
                <div className="space-y-3">
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

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={invoiceData.discount_type}
                        onChange={(e) =>
                          setInvoiceData({
                            ...invoiceData,
                            discount_type: e.target.value,
                          })
                        }
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="PERCENT">%</option>
                        <option value="AMOUNT">₹</option>
                      </select>
                      <input
                        type="number"
                        value={invoiceData.discount_value || ""}
                        onChange={(e) => {
                          const formattedValue = removeLeadingZerosFromNumeric(
                            e.target.value,
                          );
                          setInvoiceData({
                            ...invoiceData,
                            discount_value:
                              formattedValue === ""
                                ? 0
                                : parseFloat(formattedValue) || 0,
                          });
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          if (numValue !== invoiceData.discount_value) {
                            setInvoiceData({
                              ...invoiceData,
                              discount_value: numValue,
                            });
                          }
                        }}
                        min="0"
                        max={
                          invoiceData.discount_type === "PERCENT"
                            ? 100
                            : calculatedTotals.taxableAmount
                        }
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                      />
                      <span className="font-medium w-16 text-right">
                        - ₹{format(calculatedTotals.discountAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Shipping Charge */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Shipping Charge:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={invoiceData.shipping_charge || ""}
                        onChange={(e) => {
                          const formattedValue = removeLeadingZerosFromNumeric(
                            e.target.value,
                          );
                          setInvoiceData({
                            ...invoiceData,
                            shipping_charge:
                              formattedValue === ""
                                ? 0
                                : parseFloat(formattedValue) || 0,
                          });
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          if (numValue !== invoiceData.shipping_charge) {
                            setInvoiceData({
                              ...invoiceData,
                              shipping_charge: numValue,
                            });
                          }
                        }}
                        min="0"
                        step="0.01"
                        className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                      />
                    </div>
                  </div>

                  {/* Adjustment */}
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Adjustment:</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={invoiceData.adjustment || ""}
                        onChange={(e) => {
                          const formattedValue = removeLeadingZerosFromNumeric(
                            e.target.value,
                          );
                          setInvoiceData({
                            ...invoiceData,
                            adjustment:
                              formattedValue === ""
                                ? 0
                                : parseFloat(formattedValue) || 0,
                          });
                        }}
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          if (numValue !== invoiceData.adjustment) {
                            setInvoiceData({
                              ...invoiceData,
                              adjustment: numValue,
                            });
                          }
                        }}
                        step="0.01"
                        className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span className="text-gray-600">After Discount:</span>
                    <span>₹{format(calculatedTotals.afterDiscount)}</span>
                  </div>

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
                              <span>+ ₹{format(tax.tax)}</span>
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
                    <span>GRAND TOTAL:</span>
                    <span>₹{format(calculatedTotals.grandTotal)}</span>
                  </div>

                  {/* Tax Treatment Info */}
                  {invoiceData.customer_state && (
                    <div
                      className={`p-2 rounded-lg mt-2 ${
                        calculatedTotals.isSameState
                          ? "bg-green-50"
                          : "bg-blue-50"
                      }`}
                    >
                      <p
                        className={`text-xs ${
                          calculatedTotals.isSameState
                            ? "text-green-700"
                            : "text-blue-700"
                        }`}
                      >
                        <strong>Transaction Type:</strong>{" "}
                        {calculatedTotals.isSameState
                          ? "Intra-state (CGST + SGST)"
                          : "Inter-state (IGST)"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
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
