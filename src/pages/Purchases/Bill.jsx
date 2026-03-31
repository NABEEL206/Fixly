// src/pages/Purchases/Bill.jsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  X,
  Plus,
  Trash2,
  Save,
  Edit,
  Eye,
  Search,
  Filter,
  User,
  Building,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText,
  Menu,
} from "lucide-react";
import toast from "react-hot-toast";
import axiosInstance from "@/API/axiosInstance";
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
        className={`w-full px-2 py-1.5 border rounded text-sm text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white ${
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
            ? `${selectedItem.name} - ₹${formatPrice(selectedItem.selling_price)}`
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
                    {item.selling_price && (
                      <div className="text-xs text-gray-500">
                        ₹{formatPrice(item.selling_price)}
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

// Searchable Dropdown Component for Shops and Growtags
const SearchableDropdown = ({
  options,
  value,
  onChange,
  placeholder,
  label,
  error,
  disabled = false,
  getDisplayValue,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter((option) => {
      const displayText = getDisplayValue(option).toLowerCase();
      return displayText.includes(searchTerm.toLowerCase());
    });
  }, [options, searchTerm, getDisplayValue]);

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
        <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
          {selectedOption ? getDisplayValue(selectedOption) : placeholder}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden">
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-2.5 text-gray-400"
              />
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-64">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500 text-center">
                No {label.toLowerCase()} found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                >
                  {getDisplayValue(option)}
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

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" },
];

const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHECK", label: "Check" },
  { value: "CREDIT_CARD", label: "Credit Card" },
  { value: "DEBIT_CARD", label: "Debit Card" },
  { value: "UPI", label: "UPI" },
  { value: "OTHER", label: "Other" },
];

const getOwnerTypeOptionsByRole = (role) => {
  if (role === "ADMIN") {
    return [
      { value: "shop", label: "Shop" },
      { value: "growtag", label: "GrowTag" },
    ];
  }
  if (role === "GROWTAG") {
    return [{ value: "growtag", label: "GrowTag" }];
  }
  return [{ value: "shop", label: "Shop" }];
};

const ACCOUNT_TYPES = [
  "Cost of Goods Sold",
  "Expense",
  "Other Expense",
  "Fixed Asset",
  "Other Asset",
  "Inventory",
  "Raw Materials",
];

// Utility function to remove leading zeros from numeric strings
const removeLeadingZerosFromNumeric = (value) => {
  if (!value && value !== 0) return value;
  const stringValue = String(value);
  if (stringValue === "0") return "0";
  const trimmed = stringValue.replace(/^0+(?=\d)/, "");
  if (trimmed === "" || trimmed === ".") return "0";
  if (trimmed.includes(".")) {
    const [whole, decimal] = trimmed.split(".");
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

// ==================== PAYMENT MODAL COMPONENT ====================
const PaymentModal = ({
  selectedBill,
  paymentForm,
  paymentErrors,
  isSubmitting,
  handlePaymentInputChange,
  recordPayment,
  closePaymentModal,
}) => {
  if (!selectedBill) return null;

  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-600 p-2 rounded-lg mr-3">
                <CreditCard className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                  Record Payment
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedBill?.bill_number}
                </p>
              </div>
            </div>
            <button
              onClick={closePaymentModal}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="text-base sm:text-lg font-bold text-gray-900">
                ₹{selectedBill?.total?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Amount Paid:</span>
              <span className="text-base sm:text-lg font-bold text-green-600">
                ₹{selectedBill?.amount_paid?.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="text-sm font-medium text-gray-700">
                Balance Due:
              </span>
              <span className="text-base sm:text-xl font-bold text-red-600">
                ₹{selectedBill?.balance_due?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="payment_date"
                value={paymentForm.payment_date}
                onChange={handlePaymentInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                <input
                  type="text"
                  inputMode="decimal"
                  name="amount"
                  value={formatNumberForInput(paymentForm.amount)}
                  onChange={(e) => {
                    const processed = removeLeadingZerosFromNumeric(
                      e.target.value,
                    );
                    handlePaymentInputChange({
                      target: { name: "amount", value: processed },
                    });
                  }}
                  onBlur={(e) => {
                    const numValue = parseFloat(e.target.value) || 0;
                    handlePaymentInputChange({
                      target: { name: "amount", value: numValue.toString() },
                    });
                  }}
                  className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="method"
                value={paymentForm.method}
                onChange={handlePaymentInputChange}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference Number
              </label>
              <input
                type="text"
                name="reference"
                value={paymentForm.reference}
                onChange={handlePaymentInputChange}
                placeholder="e.g., Check No, Transaction ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={closePaymentModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={recordPayment}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CreditCard size={16} />
              )}
              Record Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== VIEW MODAL COMPONENT ====================
const ViewBillModal = ({
  formData,
  shops,
  growtags,
  getStatusColor,
  getPaymentStatusColor,
  onClose,
  onEdit,
  canEdit,
}) => {
  return (
    <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl my-4 sm:my-8 mx-2 sm:mx-4">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                  Bill Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bill_number}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          <div className="flex flex-col sm:flex-row items-start justify-between mb-6 pb-4 border-b">
            <div className="mb-3 sm:mb-0">
              <h4 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {formData.bill_number}
              </h4>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span>Bill Date: {formData.bill_date}</span>
                <span>•</span>
                <span>Due Date: {formData.due_date}</span>
              </div>
              {formData.order_number && (
                <div className="text-xs text-gray-500 mt-2">
                  Order Number: {formData.order_number}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <span
                className={`px-2 sm:px-3 py-1 text-xs rounded-full font-medium ${getStatusColor(formData.status)}`}
              >
                {formData.status}
              </span>
              <span
                className={`px-2 sm:px-3 py-1 text-xs rounded-full font-medium ${getPaymentStatusColor(formData.payment_status)}`}
              >
                {formData.payment_status}
              </span>
            </div>
          </div>

          {(formData.assigned_shop || formData.assigned_shop_name) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
                <Building size={16} className="mr-2" />
                Assigned To
              </h5>
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-100">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Shop Name
                    </p>
                    <p className="text-sm text-gray-900 font-medium">
                      {formData.assigned_shop_name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Shop Type
                    </p>
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                      {formData.assigned_shop_type || "N/A"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Shop ID
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.assigned_shop || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
              <User size={16} className="mr-2" />
              Owner Information
            </h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Owner Type
                  </p>
                  <p className="text-sm text-gray-900 font-medium capitalize">
                    {formData.owner_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Owner
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.owner_type === "shop"
                      ? shops.find((s) => s.id === formData.shop)?.shopname ||
                        "N/A"
                      : growtags.find((g) => g.id === formData.growtag)?.name ||
                        "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
              <Building size={16} className="mr-2" />
              Vendor Information
            </h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Vendor Name
                  </p>
                  <p className="text-sm text-gray-900 font-medium">
                    {formData.vendor_name || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Email
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.vendor_email || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.vendor_phone || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    GSTIN
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.vendor_gstin || "N/A"}
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Address
                  </p>
                  <p className="text-sm text-gray-900">
                    {formData.vendor_address || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(formData.ship_to || formData.bill_to) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Shipping & Billing
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formData.ship_to && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Ship To
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {formData.ship_to}
                    </p>
                  </div>
                )}
                {formData.bill_to && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Bill To
                    </p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">
                      {formData.bill_to}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Items
            </h5>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Qty
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Rate
                    </th>
                    <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items && formData.items.length > 0 ? (
                    formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 sm:px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">
                            {item.name || "N/A"}
                          </p>
                          {item.item && (
                            <p className="text-xs text-gray-500">
                              ID: {item.item}
                            </p>
                          )}
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <p className="text-sm text-gray-600">
                            {item.description || "-"}
                          </p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 text-right">
                          {item.qty}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900 text-right">
                          ₹{parseFloat(item.rate).toFixed(2)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          ₹{parseFloat(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-3 sm:px-4 py-3 text-center text-gray-500"
                      >
                        No items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {formData.payments && formData.payments.length > 0 && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
                <CreditCard size={16} className="mr-2" />
                Payment History
              </h5>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full min-w-[400px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Method
                      </th>
                      <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.payments.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">
                          {payment.payment_date}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm text-gray-900">
                          {payment.method}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-sm font-medium text-green-600 text-right">
                          ₹{payment.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-full sm:w-1/2 bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">
                    ₹{parseFloat(formData.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Discount:</span>
                  <span className="font-medium text-red-600">
                    -₹{parseFloat(formData.total_discount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-medium">
                    ₹{parseFloat(formData.total_tax).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    TDS ({formData.tds_percent}%):
                  </span>
                  <span className="font-medium text-red-600">
                    -₹{parseFloat(formData.tds_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                  <span className="text-base font-bold text-gray-800">
                    Total:
                  </span>
                  <span className="text-base font-bold text-blue-600">
                    ₹{parseFloat(formData.total).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">
                    ₹{parseFloat(formData.amount_paid).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-base font-bold text-gray-800">
                    Balance Due:
                  </span>
                  <span className="text-base font-bold text-red-600">
                    ₹{parseFloat(formData.balance_due).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            {canEdit && (
              <button
                onClick={onEdit}
                className="px-3 sm:px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg flex items-center"
              >
                <Edit size={16} className="mr-2" />
                Edit Bill
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 sm:px-5 py-2 text-sm font-medium bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const Bill = () => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [bills, setBills] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [shops, setShops] = useState([]);
  const [growtags, setGrowtags] = useState([]);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPaymentStatus, setFilterPaymentStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedBills, setSelectedBills] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split("T")[0],
    amount: "",
    method: "CASH",
    reference: "",
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [billDetailsCache, setBillDetailsCache] = useState({});
  const { user } = useAuth();
  const role = user?.role;

  const canView = canAccess(role, PERMISSIONS.bills.view);
  const canCreate = canAccess(role, PERMISSIONS.bills.create);
  const canEdit = canAccess(role, PERMISSIONS.bills.edit);
  const canDelete = canAccess(role, PERMISSIONS.bills.delete);

  const getShopDisplayValue = (shop) => {
    const shopType = shop.shop_type?.toLowerCase();
    const icon =
      shopType === "franchise" ? "🏬" : shopType === "other_shop" ? "🛍️" : "🏪";
    const typeLabel =
      shop.shop_type === "franchise"
        ? "Franchise"
        : shop.shop_type === "other_shop"
          ? "Other Shop"
          : "Other Shop";
    return `${icon} ${typeLabel} — ${shop.shopname}`;
  };

  const getGrowtagDisplayValue = (growtag) => `🏷️ ${growtag.name}`;

  if (!canView) {
    return (
      <div className="p-10 text-center text-red-500 font-semibold">
        You do not have permission to access Bills
      </div>
    );
  }

  const initialFormState = {
    id: null,
    owner_type: "shop",
    shop: null,
    growtag: null,
    assigned_shop: null,
    assigned_shop_name: "",
    assigned_shop_type: "",
    status: "DRAFT",
    vendor: null,
    bill_number: "",
    order_number: "",
    bill_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_status: "UNPAID",
    vendor_name: "",
    vendor_email: "",
    vendor_phone: "",
    vendor_gstin: "",
    vendor_address: "",
    ship_to: "",
    bill_to: "",
    items: [
      {
        id: null,
        item: null,
        name: "",
        description: "",
        account: "Cost of Goods Sold",
        qty: 1,
        rate: 0,
        tax_percent: 0,
        discount_percent: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    total_discount: 0,
    total_tax: 0,
    tds_percent: 0,
    tds_amount: 0,
    shipping_charges: 0,
    adjustment: 0,
    total: 0,
    amount_paid: 0,
    balance_due: 0,
    notes: "",
    terms_and_conditions: "",
    payments: [],
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchVendors();
    fetchShops();
    fetchGrowtags();
    fetchItems();
    fetchBills();
  }, []);

  useEffect(() => {
    if (selectedBill) {
      setPaymentForm({
        payment_date: new Date().toISOString().split("T")[0],
        amount: selectedBill.balance_due.toFixed(2),
        method: "CASH",
        reference: "",
      });
      setPaymentErrors({});
    }
  }, [selectedBill?.id]);

  useEffect(() => {
    if (!role) return;
    setFormData((prev) => ({
      ...prev,
      owner_type: role === "GROWTAG" ? "growtag" : "shop",
      shop: role !== "GROWTAG" ? null : prev.shop,
      growtag: role === "GROWTAG" ? prev.growtag : null,
    }));
  }, [role]);

  const toggleRow = (index) =>
    setExpandedRows((prev) => ({ ...prev, [index]: !prev[index] }));

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    setSelectedBills(checked ? filteredBills.map((bill) => bill.id) : []);
  };

  const handleSelectBill = (billId, checked) => {
    setSelectedBills((prev) =>
      checked ? [...prev, billId] : prev.filter((id) => id !== billId),
    );
    setSelectAll(false);
  };

  const fetchVendors = async () => {
    try {
      const response = await axiosInstance.get("/api/vendors/");
      const data = response.data;
      setVendors(
        Array.isArray(data) ? data : data?.data || data?.results || [],
      );
    } catch (error) {
      console.error("Fetch vendors error:", error);
      if (error.response?.status !== 401 && error.response?.status !== 403)
        toast.error("Failed to load vendors");
    }
  };

  const fetchShops = async () => {
    try {
      const response = await axiosInstance.get("/api/shops/");
      const data = response.data;
      setShops(Array.isArray(data) ? data : data?.data || data?.results || []);
    } catch (error) {
      console.error("Fetch shops error:", error);
    }
  };

  const fetchGrowtags = async () => {
    try {
      const response = await axiosInstance.get("/api/growtags/");
      const data = response.data;
      setGrowtags(
        Array.isArray(data) ? data : data?.data || data?.results || [],
      );
    } catch (error) {
      console.error("Fetch growtags error:", error);
    }
  };

  const fetchItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await axiosInstance.get("/zoho/local-items/");
      const data = response.data;
      let itemsList = Array.isArray(data)
        ? data
        : data?.data || data?.results || [];
      const transformedItems = itemsList.map((item) => ({
        id: item.id,
        name: item.name,
        selling_price: parseFloat(item.selling_price) || 0,
        sales_description: item.sales_description || "",
        is_active: item.is_active,
      }));
      setItems(transformedItems.filter((item) => item.is_active));
    } catch (error) {
      console.error("Fetch items error:", error);
      if (error.response?.status !== 401 && error.response?.status !== 403)
        toast.error("Failed to load items");
    } finally {
      setIsLoadingItems(false);
    }
  };

  const fetchBillDetails = async (id) => {
    try {
      if (billDetailsCache[id]) return billDetailsCache[id];
      const response = await axiosInstance.get(`/api/bills/${id}/`);
      const bill = response.data.data || response.data;
      const detailedBill = {
        id: bill?.id,
        owner_type: bill?.owner_type || "shop",
        shop: bill?.shop,
        growtag: bill?.growtag,
        assigned_shop: bill?.assigned_shop,
        assigned_shop_name: bill?.assigned_shop_name || "",
        assigned_shop_type: bill?.assigned_shop_type || "",
        status: bill?.status || "DRAFT",
        vendor: bill?.vendor,
        bill_number: bill?.bill_number || "",
        order_number: bill?.order_number || "",
        bill_date: bill?.bill_date || "",
        due_date: bill?.due_date || "",
        payment_status: bill?.payment_status || "UNPAID",
        vendor_name: bill?.vendor_name || "",
        vendor_email: bill?.vendor_email || "",
        vendor_phone: bill?.vendor_phone || "",
        vendor_gstin: bill?.vendor_gstin || "",
        vendor_address: bill?.vendor_address || "",
        ship_to: bill?.ship_to || "",
        bill_to: bill?.bill_to || "",
        items:
          bill?.items?.map((item) => ({
            id: item?.id,
            item: item?.item,
            name: item?.name || "",
            description: item?.description || "",
            account: item?.account || "Cost of Goods Sold",
            qty: parseFloat(item?.qty) || 1,
            rate: parseFloat(item?.rate) || 0,
            tax_percent: parseFloat(item?.tax_percent) || 0,
            discount_percent: parseFloat(item?.discount_percent) || 0,
            amount: parseFloat(item?.amount) || 0,
          })) || [],
        payments:
          bill?.payments?.map((payment) => ({
            id: payment?.id,
            payment_date: payment?.payment_date || "",
            amount: parseFloat(payment?.amount) || 0,
            method: payment?.method || "",
            reference: payment?.reference || "",
          })) || [],
        subtotal: parseFloat(bill?.subtotal) || 0,
        total_discount: parseFloat(bill?.total_discount) || 0,
        total_tax: parseFloat(bill?.total_tax) || 0,
        tds_percent: parseFloat(bill?.tds_percent) || 0,
        tds_amount: parseFloat(bill?.tds_amount) || 0,
        shipping_charges: parseFloat(bill?.shipping_charges || 0) || 0,
        adjustment: parseFloat(bill?.adjustment || 0) || 0,
        total: parseFloat(bill?.total) || 0,
        amount_paid: parseFloat(bill?.amount_paid) || 0,
        balance_due: parseFloat(bill?.balance_due) || 0,
        notes: bill?.notes || "",
        terms_and_conditions: bill?.terms_and_conditions || "",
      };
      setBillDetailsCache((prev) => ({ ...prev, [id]: detailedBill }));
      return detailedBill;
    } catch (error) {
      console.error(`Fetch bill details error for ID ${id}:`, error);
      return null;
    }
  };

  const fetchBills = async () => {
    setIsLoading(true);
    try {
      const response = await axiosInstance.get("/api/bills/");
      const data = response.data;
      let billsList = Array.isArray(data)
        ? data
        : data?.data || data?.results || [];
      const transformedBills = billsList.map(
        (bill) =>
          billDetailsCache[bill?.id] || {
            id: bill?.id,
            owner_type: bill?.owner_type || "shop",
            shop: bill?.shop,
            growtag: bill?.growtag,
            assigned_shop: bill?.assigned_shop,
            assigned_shop_name: bill?.assigned_shop_name || "",
            assigned_shop_type: bill?.assigned_shop_type || "",
            status: bill?.status || "DRAFT",
            vendor: bill?.vendor,
            bill_number: bill?.bill_number || "",
            order_number: bill?.order_number || "",
            bill_date: bill?.bill_date || "",
            due_date: bill?.due_date || "",
            payment_status: bill?.payment_status || "UNPAID",
            vendor_name: bill?.vendor_name || "",
            vendor_email: bill?.vendor_email || "",
            vendor_phone: bill?.vendor_phone || "",
            vendor_gstin: bill?.vendor_gstin || "",
            vendor_address: bill?.vendor_address || "",
            ship_to: bill?.ship_to || "",
            bill_to: bill?.bill_to || "",
            items: [],
            payments:
              bill?.payments?.map((payment) => ({
                id: payment?.id,
                payment_date: payment?.payment_date || "",
                amount: parseFloat(payment?.amount) || 0,
                method: payment?.method || "",
                reference: payment?.reference || "",
              })) || [],
            subtotal: parseFloat(bill?.subtotal) || 0,
            total_discount: parseFloat(bill?.total_discount) || 0,
            total_tax: parseFloat(bill?.total_tax) || 0,
            tds_percent: parseFloat(bill?.tds_percent) || 0,
            tds_amount: parseFloat(bill?.tds_amount) || 0,
            shipping_charges: parseFloat(bill?.shipping_charges || 0) || 0,
            adjustment: parseFloat(bill?.adjustment || 0) || 0,
            total: parseFloat(bill?.total) || 0,
            amount_paid: parseFloat(bill?.amount_paid) || 0,
            balance_due: parseFloat(bill?.balance_due) || 0,
            notes: bill?.notes || "",
            terms_and_conditions: bill?.terms_and_conditions || "",
          },
      );
      setBills(transformedBills);
    } catch (error) {
      console.error("Fetch bills error:", error);
      if (error.response?.status !== 401 && error.response?.status !== 403)
        toast.error("Failed to load bills");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDetailedData = async (id) => {
    setIsFetchingDetails(true);
    const detailedData = await fetchBillDetails(id);
    setIsFetchingDetails(false);
    if (detailedData) {
      setBills((prev) =>
        prev.map((bill) =>
          bill.id === id ? { ...bill, ...detailedData } : bill,
        ),
      );
      return detailedData;
    }
    return null;
  };

  const calculateDueDate = (billDate) => {
    const date = new Date(billDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split("T")[0];
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.vendor) newErrors.vendor = "Vendor is required";
    if (!formData.owner_type) newErrors.owner_type = "Owner type is required";
    if (formData.owner_type === "shop" && !formData.shop)
      newErrors.shop = "Shop is required when owner type is shop";
    if (formData.owner_type === "growtag" && !formData.growtag)
      newErrors.growtag = "Growtag is required when owner type is growtag";
    if (!formData.bill_date) newErrors.bill_date = "Bill Date is required";
    if (!formData.due_date) newErrors.due_date = "Due Date is required";
    else if (new Date(formData.due_date) < new Date(formData.bill_date))
      newErrors.due_date = "Due date cannot be before bill date";
    if (!formData.bill_to.trim())
      newErrors.bill_to = "Bill To address is required";
    if (formData.items.length === 0)
      newErrors.items = "At least one item is required";
    else {
      formData.items.forEach((item, index) => {
        if (!item.name.trim())
          newErrors[`item_${index}_name`] = "Item name is required";
        if (item.qty <= 0)
          newErrors[`item_${index}_qty`] = "Quantity must be greater than 0";
        if (item.rate < 0)
          newErrors[`item_${index}_rate`] = "Rate cannot be negative";
        if (item.tax_percent < 0 || item.tax_percent > 100)
          newErrors[`item_${index}_tax_percent`] =
            "Tax must be between 0 and 100";
        if (item.discount_percent < 0 || item.discount_percent > 100)
          newErrors[`item_${index}_discount_percent`] =
            "Discount must be between 0 and 100";
      });
    }
    if (formData.tds_percent < 0 || formData.tds_percent > 100)
      newErrors.tds_percent = "TDS must be between 0 and 100";
    if (formData.amount_paid < 0)
      newErrors.amount_paid = "Amount paid cannot be negative";
    if (formData.amount_paid > formData.total)
      newErrors.amount_paid = "Amount paid cannot exceed total";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePaymentForm = () => {
    const newErrors = {};
    if (!paymentForm.payment_date)
      newErrors.payment_date = "Payment date is required";
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0)
      newErrors.amount = "Valid amount is required";
    else if (
      parseFloat(paymentForm.amount) > parseFloat(selectedBill?.balance_due)
    )
      newErrors.amount = `Amount cannot exceed balance due (₹${selectedBill?.balance_due?.toFixed(2)})`;
    if (!paymentForm.method) newErrors.method = "Payment method is required";
    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateItemAmount = (item) => {
    const baseAmount = item.qty * item.rate;
    const discountAmount = (baseAmount * item.discount_percent) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;
    const taxAmount = (amountAfterDiscount * item.tax_percent) / 100;
    return amountAfterDiscount + taxAmount;
  };

  const calculateTotals = (
    items,
    tdsPercent,
    shippingCharges,
    adjustment,
    amountPaid,
  ) => {
    let subtotal = 0,
      totalTax = 0,
      totalDiscount = 0;
    items.forEach((item) => {
      const baseAmount = item.qty * item.rate;
      subtotal += baseAmount;
      totalDiscount += (baseAmount * item.discount_percent) / 100;
      const amountAfterDiscount =
        baseAmount - (baseAmount * item.discount_percent) / 100;
      totalTax += (amountAfterDiscount * item.tax_percent) / 100;
    });
    const tdsAmount = (subtotal * tdsPercent) / 100;
    const total =
      subtotal -
      totalDiscount +
      totalTax -
      tdsAmount +
      shippingCharges +
      adjustment;
    const balanceDue = total - amountPaid;
    const paid = amountPaid;
    const grandTotal = total;
    let paymentStatus = "UNPAID";
    if (paid === 0) paymentStatus = "UNPAID";
    else if (paid < grandTotal) paymentStatus = "PARTIALLY_PAID";
    else paymentStatus = "PAID";
    return {
      subtotal,
      totalTax,
      totalDiscount,
      tds_amount: tdsAmount,
      total,
      balanceDue,
      paymentStatus,
    };
  };

  const handleOwnerTypeChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      owner_type: value,
      shop: null,
      growtag: null,
    }));
    if (errors.owner_type) setErrors((prev) => ({ ...prev, owner_type: "" }));
  };

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find((v) => v.id === parseInt(vendorId));
    if (vendor) {
      setFormData((prev) => ({
        ...prev,
        vendor: vendor.id,
        vendor_name: vendor.name || "",
        vendor_email: vendor.email || "",
        vendor_phone: vendor.phone || "",
        vendor_address: vendor.address || "",
        vendor_gstin: vendor.gstin || "",
      }));
      if (errors.vendor) setErrors((prev) => ({ ...prev, vendor: "" }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vendor: null,
        vendor_name: "",
        vendor_email: "",
        vendor_phone: "",
        vendor_address: "",
        vendor_gstin: "",
      }));
    }
  };

  const handleShopSelect = (shopId) => {
    setFormData({ ...formData, shop: shopId });
    if (errors.shop) setErrors((prev) => ({ ...prev, shop: "" }));
  };

  const handleGrowtagSelect = (growtagId) => {
    setFormData({ ...formData, growtag: growtagId });
    if (errors.growtag) setErrors((prev) => ({ ...prev, growtag: "" }));
  };

  const handleItemSelection = (index, selectedItemId) => {
    const selectedItem = items.find(
      (item) => String(item.id) === String(selectedItemId),
    );
    if (!selectedItem) return;
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        item: selectedItem.id,
        name: selectedItem.name,
        description: selectedItem.sales_description || "",
        rate: selectedItem.selling_price || 0,
        account: "Cost of Goods Sold",
        qty: 1,
      };
      // Recalculate amount for this item
      updatedItems[index].amount = calculateItemAmount(updatedItems[index]);
      // Recalculate totals
      const totals = calculateTotals(
        updatedItems,
        prev.tds_percent,
        prev.shipping_charges,
        prev.adjustment,
        prev.amount_paid,
      );
      return { ...prev, items: updatedItems, ...totals };
    });
    if (errors[`item_${index}_name`])
      setErrors((prev) => ({ ...prev, [`item_${index}_name`]: "" }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updates = { [name]: value };
    if (name === "bill_date") updates.due_date = calculateDueDate(value);
    setFormData((prev) => ({ ...prev, ...updates }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
    if (paymentErrors[name])
      setPaymentErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    if (["qty", "rate", "tax_percent", "discount_percent"].includes(field)) {
      const processedValue = removeLeadingZerosFromNumeric(value);
      newItems[index][field] = parseFloat(processedValue) || 0;
    } else {
      newItems[index][field] = value;
    }
    newItems[index].amount = calculateItemAmount(newItems[index]);
    const totals = calculateTotals(
      newItems,
      formData.tds_percent,
      formData.shipping_charges,
      formData.adjustment,
      formData.amount_paid,
    );
    setFormData((prev) => ({ ...prev, items: newItems, ...totals }));
    if (errors[`item_${index}_${field}`])
      setErrors((prev) => ({ ...prev, [`item_${index}_${field}`]: "" }));
  };

  const addItem = () =>
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: null,
          item: null,
          name: "",
          description: "",
          account: "Cost of Goods Sold",
          qty: 1,
          rate: 0,
          tax_percent: 0,
          discount_percent: 0,
          amount: 0,
        },
      ],
    }));

  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.error("At least one item is required");
      return;
    }
    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(
      newItems,
      formData.tds_percent,
      formData.shipping_charges,
      formData.adjustment,
      formData.amount_paid,
    );
    setFormData((prev) => ({ ...prev, items: newItems, ...totals }));
  };

  const handleChargesChange = (field, value) => {
    const newValue = parseFloat(removeLeadingZerosFromNumeric(value)) || 0;
    const totals = calculateTotals(
      formData.items,
      field === "tds_percent" ? newValue : formData.tds_percent,
      field === "shipping_charges" ? newValue : formData.shipping_charges,
      field === "adjustment" ? newValue : formData.adjustment,
      field === "amount_paid" ? newValue : formData.amount_paid,
    );
    setFormData((prev) => ({ ...prev, [field]: newValue, ...totals }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedBill(null);
    setPaymentErrors({});
    setPaymentForm({
      payment_date: new Date().toISOString().split("T")[0],
      amount: "",
      method: "CASH",
      reference: "",
    });
  };

  const recordPayment = async () => {
    if (!selectedBill) {
      toast.error("No bill selected");
      return;
    }
    if (!validatePaymentForm()) {
      toast.error("Fix errors");
      return;
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading("Recording payment...");
    try {
      let entered = Number(paymentForm.amount);
      let balance = Number(selectedBill.balance_due);
      entered = Math.round(entered * 100);
      balance = Math.round(balance * 100);
      const finalAmount = Math.min(entered, balance) / 100;
      const paymentData = {
        payment_date: paymentForm.payment_date,
        amount: finalAmount.toFixed(2),
        method: paymentForm.method,
        reference: paymentForm.reference || "",
      };
      await axiosInstance.post(
        `/api/bills/${selectedBill.id}/add-payment/`,
        paymentData,
      );
      const paidAmount = parseFloat(paymentData.amount);
      setBills((prev) =>
        prev.map((bill) => {
          if (bill.id !== selectedBill.id) return bill;
          const newAmountPaid = parseFloat(bill.amount_paid) + paidAmount;
          const newBalance = parseFloat(bill.balance_due) - paidAmount;
          let newStatus = "UNPAID";
          if (newAmountPaid === 0) newStatus = "UNPAID";
          else if (newBalance > 0) newStatus = "PARTIALLY_PAID";
          else newStatus = "PAID";
          return {
            ...bill,
            amount_paid: newAmountPaid,
            balance_due: newBalance < 0 ? 0 : newBalance,
            payment_status: newStatus,
          };
        }),
      );
      setSelectedBill((prev) => {
        if (!prev) return prev;
        const newAmountPaid = parseFloat(prev.amount_paid) + paidAmount;
        const newBalance = parseFloat(prev.balance_due) - paidAmount;
        let newStatus = "UNPAID";
        if (newAmountPaid === 0) newStatus = "UNPAID";
        else if (newBalance > 0) newStatus = "PARTIALLY_PAID";
        else newStatus = "PAID";
        return {
          ...prev,
          amount_paid: newAmountPaid,
          balance_due: newBalance < 0 ? 0 : newBalance,
          payment_status: newStatus,
        };
      });
      toast.success("Payment recorded!", { id: loadingToast });
      setShowPaymentModal(false);
      setSelectedBill(null);
    } catch (error) {
      toast.error(
        error.response?.data?.amount ||
          error.response?.data?.detail ||
          "Failed to record payment",
        { id: loadingToast },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const transformToAPIFormat = (data) => ({
    owner_type: data.owner_type,
    shop: data.owner_type === "shop" ? data.shop : null,
    growtag: data.owner_type === "growtag" ? data.growtag : null,
    status: data.status,
    vendor: data.vendor,
    bill_number: data.bill_number,
    order_number: data.order_number || "",
    bill_date: data.bill_date,
    due_date: data.due_date,
    payment_status: data.payment_status,
    vendor_name: data.vendor_name,
    vendor_email: data.vendor_email,
    vendor_phone: data.vendor_phone,
    vendor_gstin: data.vendor_gstin,
    vendor_address: data.vendor_address,
    ship_to: data.ship_to,
    bill_to: data.bill_to,
    items: data.items.map((item) => ({
      item: item.item,
      name: item.name,
      description: item.description,
      account: item.account,
      qty: item.qty,
      rate: item.rate,
      tax_percent: item.tax_percent,
      discount_percent: item.discount_percent,
    })),
    subtotal: data.subtotal,
    total_discount: data.total_discount,
    total_tax: data.total_tax,
    tds_percent: data.tds_percent,
    shipping_charges: data.shipping_charges,
    adjustment: data.adjustment,
    total: data.total,
    amount_paid: data.amount_paid,
    notes: data.notes,
    terms_and_conditions: data.terms_and_conditions,
  });

  const createBill = async () => {
    if (!canCreate) {
      toast.error("You don't have permission to create bill");
      return;
    }
    if (!validateForm()) {
      toast.error("Please fix all errors before submitting");
      return;
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading("Creating bill...");
    try {
      const apiData = transformToAPIFormat(formData);
      const response = await axiosInstance.post("/api/bills/", apiData);
      const newBill = response.data.data || response.data;
      const transformedBill = {
        id: newBill?.id,
        owner_type: newBill?.owner_type || "shop",
        shop: newBill?.shop,
        growtag: newBill?.growtag,
        assigned_shop: newBill?.assigned_shop,
        assigned_shop_name: newBill?.assigned_shop_name || "",
        assigned_shop_type: newBill?.assigned_shop_type || "",
        status: newBill?.status || "DRAFT",
        vendor: newBill?.vendor,
        bill_number: newBill?.bill_number || "",
        order_number: newBill?.order_number || "",
        bill_date: newBill?.bill_date || "",
        due_date: newBill?.due_date || "",
        payment_status: newBill?.payment_status || "UNPAID",
        vendor_name: newBill?.vendor_name || formData.vendor_name,
        vendor_email: newBill?.vendor_email || formData.vendor_email,
        vendor_phone: newBill?.vendor_phone || formData.vendor_phone,
        vendor_gstin: newBill?.vendor_gstin || formData.vendor_gstin,
        vendor_address: newBill?.vendor_address || formData.vendor_address,
        ship_to: newBill?.ship_to || "",
        bill_to: newBill?.bill_to || "",
        items:
          newBill?.items?.map((item) => ({
            id: item?.id,
            item: item?.item,
            name: item?.name || "",
            description: item?.description || "",
            account: item?.account || "Cost of Goods Sold",
            qty: parseFloat(item?.qty) || 1,
            rate: parseFloat(item?.rate) || 0,
            tax_percent: parseFloat(item?.tax_percent) || 0,
            discount_percent: parseFloat(item?.discount_percent) || 0,
            amount: parseFloat(item?.amount) || 0,
          })) || [],
        payments:
          newBill?.payments?.map((payment) => ({
            id: payment?.id,
            payment_date: payment?.payment_date || "",
            amount: parseFloat(payment?.amount) || 0,
            method: payment?.method || "",
            reference: payment?.reference || "",
          })) || [],
        subtotal: parseFloat(newBill?.subtotal) || 0,
        total_discount: parseFloat(newBill?.total_discount) || 0,
        total_tax: parseFloat(newBill?.total_tax) || 0,
        tds_percent: parseFloat(newBill?.tds_percent) || 0,
        tds_amount: parseFloat(newBill?.tds_amount) || 0,
        shipping_charges: parseFloat(newBill?.shipping_charges || 0) || 0,
        adjustment: parseFloat(newBill?.adjustment || 0) || 0,
        total: parseFloat(newBill?.total) || 0,
        amount_paid: parseFloat(newBill?.amount_paid) || 0,
        balance_due: parseFloat(newBill?.balance_due) || 0,
        notes: newBill?.notes || "",
        terms_and_conditions: newBill?.terms_and_conditions || "",
      };
      setBillDetailsCache((prev) => ({
        ...prev,
        [transformedBill.id]: transformedBill,
      }));
      setBills((prev) => [transformedBill, ...prev]);
      toast.success("Bill created successfully!", { id: loadingToast });
      resetForm();
    } catch (error) {
      console.error("Create bill error:", error);
      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = Object.keys(apiErrors)
          .map((key) => `${key}: ${apiErrors[key]}`)
          .join(", ");
        toast.error(errorMessages || "Validation failed", { id: loadingToast });
      } else {
        toast.error("Failed to create bill", { id: loadingToast });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateBill = async () => {
    if (!canEdit) {
      toast.error("You don't have permission to edit bill");
      return;
    }
    if (!validateForm()) {
      toast.error("Please fix all errors before updating");
      return;
    }
    setIsSubmitting(true);
    const loadingToast = toast.loading("Updating bill...");
    try {
      const apiData = transformToAPIFormat(formData);
      const response = await axiosInstance.put(
        `/api/bills/${formData.id}/`,
        apiData,
      );
      const updatedBill = response.data.data || response.data;
      const transformedBill = {
        id: updatedBill?.id,
        owner_type: updatedBill?.owner_type || "shop",
        shop: updatedBill?.shop,
        growtag: updatedBill?.growtag,
        assigned_shop: updatedBill?.assigned_shop,
        assigned_shop_name: updatedBill?.assigned_shop_name || "",
        assigned_shop_type: updatedBill?.assigned_shop_type || "",
        status: updatedBill?.status || "DRAFT",
        vendor: updatedBill?.vendor,
        bill_number: updatedBill?.bill_number || "",
        order_number: updatedBill?.order_number || "",
        bill_date: updatedBill?.bill_date || "",
        due_date: updatedBill?.due_date || "",
        payment_status: updatedBill?.payment_status || "UNPAID",
        vendor_name: updatedBill?.vendor_name || formData.vendor_name,
        vendor_email: updatedBill?.vendor_email || formData.vendor_email,
        vendor_phone: updatedBill?.vendor_phone || formData.vendor_phone,
        vendor_gstin: updatedBill?.vendor_gstin || formData.vendor_gstin,
        vendor_address: updatedBill?.vendor_address || formData.vendor_address,
        ship_to: updatedBill?.ship_to || "",
        bill_to: updatedBill?.bill_to || "",
        items:
          updatedBill?.items?.map((item) => ({
            id: item?.id,
            item: item?.item,
            name: item?.name || "",
            description: item?.description || "",
            account: item?.account || "Cost of Goods Sold",
            qty: parseFloat(item?.qty) || 1,
            rate: parseFloat(item?.rate) || 0,
            tax_percent: parseFloat(item?.tax_percent) || 0,
            discount_percent: parseFloat(item?.discount_percent) || 0,
            amount: parseFloat(item?.amount) || 0,
          })) || [],
        payments:
          updatedBill?.payments?.map((payment) => ({
            id: payment?.id,
            payment_date: payment?.payment_date || "",
            amount: parseFloat(payment?.amount) || 0,
            method: payment?.method || "",
            reference: payment?.reference || "",
          })) || [],
        subtotal: parseFloat(updatedBill?.subtotal) || 0,
        total_discount: parseFloat(updatedBill?.total_discount) || 0,
        total_tax: parseFloat(updatedBill?.total_tax) || 0,
        tds_percent: parseFloat(updatedBill?.tds_percent) || 0,
        tds_amount: parseFloat(updatedBill?.tds_amount) || 0,
        shipping_charges: parseFloat(updatedBill?.shipping_charges || 0) || 0,
        adjustment: parseFloat(updatedBill?.adjustment || 0) || 0,
        total: parseFloat(updatedBill?.total) || 0,
        amount_paid: parseFloat(updatedBill?.amount_paid) || 0,
        balance_due: parseFloat(updatedBill?.balance_due) || 0,
        notes: updatedBill?.notes || "",
        terms_and_conditions: updatedBill?.terms_and_conditions || "",
      };
      setBillDetailsCache((prev) => ({
        ...prev,
        [transformedBill.id]: transformedBill,
      }));
      setBills((prev) =>
        prev.map((bill) =>
          bill.id === transformedBill.id ? transformedBill : bill,
        ),
      );
      toast.success("Bill updated successfully!", { id: loadingToast });
      resetForm();
    } catch (error) {
      console.error("Update bill error:", error);
      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = Object.keys(apiErrors)
          .map((key) => `${key}: ${apiErrors[key]}`)
          .join(", ");
        toast.error(errorMessages || "Validation failed", { id: loadingToast });
      } else {
        toast.error("Failed to update bill", { id: loadingToast });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteBill = (id) => {
    if (!canDelete) {
      toast.error("You don't have permission to delete bill");
      return;
    }
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete Bill?</p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const loadingToast = toast.loading("Deleting bill...");
                try {
                  await axiosInstance.delete(`/api/bills/${id}/`);
                  setBillDetailsCache((prev) => {
                    const newCache = { ...prev };
                    delete newCache[id];
                    return newCache;
                  });
                  setBills((prev) => prev.filter((bill) => bill.id !== id));
                  setSelectedBills((prev) =>
                    prev.filter((billId) => billId !== id),
                  );
                  toast.success("Bill deleted successfully", {
                    id: loadingToast,
                  });
                } catch (error) {
                  toast.error("Failed to delete bill", { id: loadingToast });
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
  };

  const handleBulkDelete = () => {
    if (!canDelete) {
      toast.error("You don't have permission to delete bills");
      return;
    }
    if (selectedBills.length === 0) {
      toast.error("Please select at least one bill to delete");
      return;
    }
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">
            Delete {selectedBills.length} selected{" "}
            {selectedBills.length === 1 ? "bill" : "bills"}?
          </p>
          <p className="text-xs text-gray-500">This action cannot be undone.</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 bg-gray-200 rounded-md text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                const loadingToast = toast.loading(
                  `Deleting ${selectedBills.length} bills...`,
                );
                try {
                  const results = await Promise.allSettled(
                    selectedBills.map((id) =>
                      axiosInstance.delete(`/api/bills/${id}/`),
                    ),
                  );
                  const successful = results.filter(
                    (r) => r.status === "fulfilled",
                  ).length;
                  setBillDetailsCache((prev) => {
                    const newCache = { ...prev };
                    selectedBills.forEach((id) => delete newCache[id]);
                    return newCache;
                  });
                  setBills((prev) =>
                    prev.filter((bill) => !selectedBills.includes(bill.id)),
                  );
                  setSelectedBills([]);
                  setSelectAll(false);
                  toast.success(
                    `Successfully deleted ${successful} ${successful === 1 ? "bill" : "bills"}`,
                    { id: loadingToast },
                  );
                } catch (error) {
                  toast.error("Failed to delete some bills", {
                    id: loadingToast,
                  });
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
  };

  const editBill = async (bill) => {
    const loadingToast = toast.loading("Loading bill details...");
    try {
      let detailedBill = bill;
      if (!bill.items || bill.items.length === 0)
        detailedBill = await loadDetailedData(bill.id);
      if (detailedBill) {
        const itemsWithDefaults = detailedBill.items.map((item) => ({
          id: item.id,
          item: item.item,
          name: item.name || "",
          description: item.description || "",
          account: item.account || "Cost of Goods Sold",
          qty: parseFloat(item.qty) || 1,
          rate: parseFloat(item.rate) || 0,
          tax_percent: parseFloat(item.tax_percent) || 0,
          discount_percent: parseFloat(item.discount_percent) || 0,
          amount: parseFloat(item.amount) || 0,
        }));
        setFormData({ ...detailedBill, items: itemsWithDefaults });
        setEditMode(true);
        setViewMode(false);
        setShowForm(true);
        toast.dismiss(loadingToast);
      } else {
        toast.error("Failed to load bill details", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Failed to load bill details", { id: loadingToast });
    }
  };

  const viewBill = async (bill) => {
    const loadingToast = toast.loading("Loading bill details...");
    try {
      let detailedBill = bill;
      if (!bill.items || bill.items.length === 0)
        detailedBill = await loadDetailedData(bill.id);
      if (detailedBill) {
        const itemsWithDefaults = detailedBill.items.map((item) => ({
          id: item.id,
          item: item.item,
          name: item.name || "",
          description: item.description || "",
          account: item.account || "Cost of Goods Sold",
          qty: parseFloat(item.qty) || 1,
          rate: parseFloat(item.rate) || 0,
          tax_percent: parseFloat(item.tax_percent) || 0,
          discount_percent: parseFloat(item.discount_percent) || 0,
          amount: parseFloat(item.amount) || 0,
        }));
        setFormData({ ...detailedBill, items: itemsWithDefaults });
        setViewMode(true);
        setEditMode(false);
        setShowForm(true);
        toast.dismiss(loadingToast);
      } else {
        toast.error("Failed to load bill details", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Failed to load bill details", { id: loadingToast });
    }
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
    setEditMode(false);
    setViewMode(false);
    setErrors({});
    setExpandedRows({});
  };

  const newBill = async () => {
    const loadingToast = toast.loading("Loading data...");
    try {
      if (!growtags.length) await fetchGrowtags();
      if (!items.length) await fetchItems();
      const billDate = new Date().toISOString().split("T")[0];
      const dueDate = calculateDueDate(billDate);
      setFormData({
        ...initialFormState,
        bill_number: "", // Empty - backend will generate
        bill_date: billDate,
        due_date: dueDate,
        owner_type: role === "GROWTAG" ? "growtag" : "shop",
      });
      setShowForm(true);
      setEditMode(false);
      setViewMode(false);
      setExpandedRows({});
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.error("Failed to load required data. Please try again.", {
        id: loadingToast,
      });
    }
  };

  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setShowPaymentModal(true);
  };

  const downloadBillPDF = async (billId) => {
    const loadingToast = toast.loading("Loading PDF...");
    try {
      const response = await axiosInstance.get(
        `/purchase-bills/${billId}/pdf/`,
        { responseType: "blob" },
      );
      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `bill_${billId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss(loadingToast);
    } catch (error) {
      toast.error("Failed to load PDF", { id: loadingToast });
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterStatus("");
    setFilterPaymentStatus("");
  };

  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      (bill.bill_number?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (bill.vendor_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (bill.status?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (bill.payment_status?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      ) ||
      (bill.assigned_shop_name?.toLowerCase() || "").includes(
        searchTerm.toLowerCase(),
      );
    const matchesStatus = !filterStatus || bill.status === filterStatus;
    const matchesPaymentStatus =
      !filterPaymentStatus || bill.payment_status === filterPaymentStatus;
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-200 text-gray-800";
      case "OPEN":
        return "bg-blue-200 text-blue-800";
      case "CANCELLED":
        return "bg-red-200 text-red-800";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case "PAID":
        return "bg-green-200 text-green-800";
      case "PARTIALLY_PAID":
        return "bg-yellow-200 text-yellow-800";
      case "UNPAID":
        return "bg-red-200 text-red-800";
      case "OVERDUE":
        return "bg-red-300 text-red-900";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      {showPaymentModal && selectedBill && (
        <PaymentModal
          selectedBill={selectedBill}
          paymentForm={paymentForm}
          paymentErrors={paymentErrors}
          isSubmitting={isSubmitting}
          handlePaymentInputChange={handlePaymentInputChange}
          recordPayment={recordPayment}
          closePaymentModal={closePaymentModal}
        />
      )}
      {viewMode && (
        <ViewBillModal
          formData={formData}
          shops={shops}
          growtags={growtags}
          getStatusColor={getStatusColor}
          getPaymentStatusColor={getPaymentStatusColor}
          canEdit={canEdit}
          onClose={() => {
            setViewMode(false);
            setShowForm(false);
            setEditMode(false);
            setSelectedBill(null);
          }}
          onEdit={() => {
            setEditMode(true);
            setShowForm(true);
            setViewMode(false);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Bills
          </h1>
          {!showForm && (
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              {selectedBills.length > 0 && canDelete && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-red-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
                >
                  <Trash2 size={16} />
                  <span className="hidden sm:inline">Delete Selected</span>
                  <span className="sm:hidden">({selectedBills.length})</span>
                </button>
              )}
              <button
                onClick={newBill}
                disabled={isSubmitting || isFetchingDetails}
                className="flex items-center gap-2 bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {isSubmitting || isFetchingDetails ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Plus size={18} />
                )}
                <span className="hidden sm:inline">New Bill</span>
                <span className="sm:hidden">New</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {!showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow overflow-hidden">
          <div className="p-3 border-b sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between bg-gray-100 px-4 py-2 rounded-lg"
            >
              <span className="text-sm font-medium text-gray-700">Filters</span>
              <Menu size={18} className="text-gray-500" />
            </button>
          </div>

          <div
            className={`p-4 border-b ${mobileMenuOpen ? "block" : "hidden sm:block"}`}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-3 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search by Bill Number, Vendor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  disabled={isLoading}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1 sm:flex-none"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  disabled={isLoading}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm flex-1 sm:flex-none"
                >
                  <option value="">All Payment</option>
                  {PAYMENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {(searchTerm || filterStatus || filterPaymentStatus) && (
                  <button
                    onClick={clearFilters}
                    disabled={isLoading}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg flex items-center"
                  >
                    <X size={14} className="mr-1" />
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="sm:hidden divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading bills...</p>
              </div>
            ) : filteredBills.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No bills found. Create your first one!
              </div>
            ) : (
              filteredBills.map((bill) => (
                <div key={bill.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selectedBills.includes(bill.id)}
                        onChange={(e) =>
                          handleSelectBill(bill.id, e.target.checked)
                        }
                        className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-blue-600 text-sm">
                          {bill.bill_number}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {bill.vendor_name || "N/A"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bill.status)}`}
                    >
                      {bill.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div>
                      <span className="text-gray-500">Bill Date:</span>
                      <span className="ml-1">{bill.bill_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Due Date:</span>
                      <span className="ml-1">{bill.due_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total:</span>
                      <span className="ml-1 font-medium">
                        ₹{parseFloat(bill.total).toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Balance:</span>
                      <span className="ml-1 font-medium text-red-600">
                        ₹{parseFloat(bill.balance_due).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-3 pt-2 border-t">
                    {canView && (
                      <button
                        onClick={() => viewBill(bill)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    {canEdit && (
                      <button
                        onClick={() => downloadBillPDF(bill.id)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                      >
                        <FileText size={16} />
                      </button>
                    )}
                    {canEdit &&
                      bill?.status === "OPEN" &&
                      bill?.payment_status !== "PAID" &&
                      Number(bill?.balance_due) > 0 && (
                        <button
                          onClick={() => openPaymentModal(bill)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <CreditCard size={16} />
                        </button>
                      )}
                    {canEdit && (
                      <button
                        onClick={() => editBill(bill)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Edit size={16} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => deleteBill(bill.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-10">
                    <input
                      type="checkbox"
                      checked={selectAll && filteredBills.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Bill Number
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Bill Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span>Loading bills...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td
                      colSpan="11"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No bills found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <input
                          type="checkbox"
                          checked={selectedBills.includes(bill.id)}
                          onChange={(e) =>
                            handleSelectBill(bill.id, e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-center">
                        {bill.bill_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {bill.vendor_name || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {bill.bill_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {bill.due_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bill.status)}`}
                        >
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(bill.payment_status)}`}
                        >
                          {bill.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center">
                        ₹{parseFloat(bill.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-center">
                        ₹{parseFloat(bill.balance_due).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="flex gap-2 justify-center">
                          {canView && (
                            <button
                              onClick={() => viewBill(bill)}
                              className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded"
                            >
                              <Eye size={18} />
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => downloadBillPDF(bill.id)}
                              className="p-1.5 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                            >
                              <FileText size={18} />
                            </button>
                          )}
                          {canEdit &&
                            bill?.status === "OPEN" &&
                            bill?.payment_status !== "PAID" &&
                            Number(bill?.balance_due) > 0 && (
                              <button
                                onClick={() => openPaymentModal(bill)}
                                className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded"
                              >
                                <CreditCard size={18} />
                              </button>
                            )}
                          {canEdit && (
                            <button
                              onClick={() => editBill(bill)}
                              className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => deleteBill(bill.id)}
                              className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded"
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

      {/* Bill Form */}
      {showForm && !viewMode && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-4 sm:p-6 border-b flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {editMode ? "Edit" : "New"} Bill
            </h2>
            <button
              onClick={resetForm}
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-4 sm:p-6">
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
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
                  <p className="text-xs sm:text-sm text-blue-700">
                    <span className="font-medium">Required:</span> Vendor,
                    Owner, Bill Date, Due Date, Bill To Address, Items (with Qty
                    & Rate)
                  </p>
                  <p className="text-xs sm:text-sm text-blue-700 mt-1">
                    <span className="font-medium">Note:</span> Bill number is
                    auto-generated by the system
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Number{" "}
                    <span className="text-green-600 text-xs font-normal">
                      (Auto-generated)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="bill_number"
                    value={formData.bill_number}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed text-sm"
                    placeholder="Will be generated by system"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Number
                  </label>
                  <input
                    type="text"
                    name="order_number"
                    value={formData.order_number}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="bill_date"
                    value={formData.bill_date}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.bill_date ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.bill_date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bill_date}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    min={formData.bill_date}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.due_date ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.due_date && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.due_date}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Owner Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="owner_type"
                    value={formData.owner_type}
                    onChange={(e) => handleOwnerTypeChange(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
                  >
                    {getOwnerTypeOptionsByRole(role).map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {errors.owner_type && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.owner_type}
                    </p>
                  )}
                </div>
                {formData.owner_type === "shop" && role !== "GROWTAG" && (
                  <SearchableDropdown
                    options={shops}
                    value={formData.shop}
                    onChange={handleShopSelect}
                    placeholder="Select Shop"
                    label="Shop"
                    error={errors.shop}
                    disabled={isSubmitting}
                    getDisplayValue={getShopDisplayValue}
                  />
                )}
                {formData.owner_type === "growtag" && (
                  <SearchableDropdown
                    options={growtags}
                    value={formData.growtag}
                    onChange={handleGrowtagSelect}
                    placeholder="Select Growtag"
                    label="Growtag"
                    error={errors.growtag}
                    disabled={isSubmitting}
                    getDisplayValue={getGrowtagDisplayValue}
                  />
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className="w-full px-2 py-2 border border-gray-300 rounded text-sm"
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

            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Vendor Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <SearchableVendorSelect
                    options={vendors}
                    value={formData.vendor}
                    onChange={handleVendorChange}
                    placeholder="-- Select Vendor --"
                    label="Select Vendor"
                    error={errors.vendor}
                    disabled={isSubmitting}
                  />
                </div>
                {formData.vendor && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Name
                        </label>
                        <input
                          type="text"
                          value={formData.vendor_name}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Email
                        </label>
                        <input
                          type="email"
                          value={formData.vendor_email}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.vendor_phone}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor GSTIN
                        </label>
                        <input
                          type="text"
                          value={formData.vendor_gstin}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Vendor Address
                        </label>
                        <input
                          type="text"
                          value={formData.vendor_address}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Shipping & Billing Addresses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill To <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="bill_to"
                    value={formData.bill_to}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${errors.bill_to ? "border-red-500" : "border-gray-300"}`}
                  />
                  {errors.bill_to && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bill_to}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ship To
                  </label>
                  <textarea
                    name="ship_to"
                    value={formData.ship_to}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows="3"
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <h3 className="text-base sm:text-lg font-semibold">
                  Item Details
                </h3>
                {!viewMode && (
                  <button
                    onClick={addItem}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                )}
              </div>
              {errors.items && (
                <p className="text-red-500 text-xs mb-2">{errors.items}</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-64">
                        Item <span className="text-red-500">*</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                        Account
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                        Qty <span className="text-red-500">*</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                        Rate <span className="text-red-500">*</span>
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                        Tax %
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">
                        Disc %
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                        Amount
                      </th>
                      {!viewMode && (
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items && formData.items.length > 0 ? (
                      formData.items.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-between">
                                <SearchableItemSelect
                                  items={items}
                                  value={item.item}
                                  onChange={(value) =>
                                    handleItemSelection(index, value)
                                  }
                                  disabled={isSubmitting}
                                  index={index}
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleRow(index)}
                                  className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                >
                                  {expandedRows[index] ? (
                                    <ChevronUp size={16} />
                                  ) : (
                                    <ChevronDown size={16} />
                                  )}
                                </button>
                              </div>
                              {errors[`item_${index}_name`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`item_${index}_name`]}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={item.description || ""}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                disabled={isSubmitting}
                                placeholder="Description"
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={item.account || "Cost of Goods Sold"}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "account",
                                    e.target.value,
                                  )
                                }
                                disabled={isSubmitting}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                              >
                                {ACCOUNT_TYPES.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatNumberForInput(item.qty)}
                                onChange={(e) =>
                                  handleItemChange(index, "qty", e.target.value)
                                }
                                onBlur={(e) => {
                                  const numValue =
                                    parseFloat(e.target.value) || 0;
                                  handleItemChange(index, "qty", numValue);
                                }}
                                disabled={isSubmitting}
                                className={`w-full px-2 py-1.5 border rounded text-sm ${errors[`item_${index}_qty`] ? "border-red-500" : "border-gray-300"}`}
                              />
                              {errors[`item_${index}_qty`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`item_${index}_qty`]}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="relative">
                                <span className="absolute left-2 top-2 text-gray-500">
                                  ₹
                                </span>
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={formatNumberForInput(item.rate)}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "rate",
                                      e.target.value,
                                    )
                                  }
                                  onBlur={(e) => {
                                    const numValue =
                                      parseFloat(e.target.value) || 0;
                                    handleItemChange(index, "rate", numValue);
                                  }}
                                  disabled={isSubmitting}
                                  className={`w-full pl-6 pr-2 py-1.5 border rounded text-sm ${errors[`item_${index}_rate`] ? "border-red-500" : "border-gray-300"}`}
                                />
                              </div>
                              {errors[`item_${index}_rate`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`item_${index}_rate`]}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={formatNumberForInput(item.tax_percent)}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "tax_percent",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) => {
                                  const numValue =
                                    parseFloat(e.target.value) || 0;
                                  handleItemChange(
                                    index,
                                    "tax_percent",
                                    numValue,
                                  );
                                }}
                                disabled={isSubmitting}
                                className={`w-full px-2 py-1.5 border rounded text-sm ${errors[`item_${index}_tax_percent`] ? "border-red-500" : "border-gray-300"}`}
                              />
                              {errors[`item_${index}_tax_percent`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`item_${index}_tax_percent`]}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={formatNumberForInput(
                                  item.discount_percent,
                                )}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "discount_percent",
                                    e.target.value,
                                  )
                                }
                                onBlur={(e) => {
                                  const numValue =
                                    parseFloat(e.target.value) || 0;
                                  handleItemChange(
                                    index,
                                    "discount_percent",
                                    numValue,
                                  );
                                }}
                                disabled={isSubmitting}
                                className={`w-full px-2 py-1.5 border rounded text-sm ${errors[`item_${index}_discount_percent`] ? "border-red-500" : "border-gray-300"}`}
                              />
                              {errors[`item_${index}_discount_percent`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`item_${index}_discount_percent`]}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-right text-sm">
                              ₹{item.amount.toFixed(2)}
                            </td>
                            {!viewMode && (
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => removeItem(index)}
                                  disabled={isSubmitting}
                                  className="text-red-600 hover:text-red-800 p-1.5 rounded"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            )}
                          </tr>
                          {expandedRows[index] && (
                            <tr className="bg-gray-50">
                              <td
                                colSpan={!viewMode ? "9" : "8"}
                                className="px-3 py-2"
                              >
                                <div className="text-sm text-gray-600">
                                  <p className="font-medium mb-1">
                                    Additional Details:
                                  </p>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <div>
                                      <span className="text-xs text-gray-500">
                                        Item ID:
                                      </span>
                                      <p className="text-sm">
                                        {item.item || "Not linked"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">
                                        Line Total:
                                      </span>
                                      <p className="text-sm font-medium">
                                        ₹{item.amount.toFixed(2)}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">
                                        Account Type:
                                      </span>
                                      <p className="text-sm">{item.account}</p>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={!viewMode ? "9" : "8"}
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

            <div className="mb-6">
              <div className="flex justify-end">
                <div className="w-full sm:w-2/3 lg:w-1/2 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      ₹{formData.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Discount:</span>
                    <span className="font-medium text-red-600">
                      -₹{formData.total_discount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-medium">
                      ₹{formData.total_tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">TDS (%):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formatNumberForInput(formData.tds_percent)}
                        onChange={(e) =>
                          handleChargesChange("tds_percent", e.target.value)
                        }
                        onBlur={(e) => {
                          const numValue = parseFloat(e.target.value) || 0;
                          handleChargesChange("tds_percent", numValue);
                        }}
                        disabled={isSubmitting}
                        className="w-20 px-2 py-1 border rounded text-right text-sm"
                      />
                      <span className="font-medium text-red-600">
                        -₹{formData.tds_amount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Shipping Charges:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatNumberForInput(formData.shipping_charges)}
                      onChange={(e) =>
                        handleChargesChange("shipping_charges", e.target.value)
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value) || 0;
                        handleChargesChange("shipping_charges", numValue);
                      }}
                      disabled={isSubmitting}
                      className="w-28 sm:w-32 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Adjustment:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatNumberForInput(formData.adjustment)}
                      onChange={(e) =>
                        handleChargesChange("adjustment", e.target.value)
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value) || 0;
                        handleChargesChange("adjustment", numValue);
                      }}
                      disabled={isSubmitting}
                      className="w-28 sm:w-32 px-2 py-1 border border-gray-300 rounded text-right text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                    <span className="text-base sm:text-lg font-bold text-gray-800">
                      Total:
                    </span>
                    <span className="text-base sm:text-lg font-bold text-blue-600">
                      ₹{formData.total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Amount Paid:</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={formatNumberForInput(formData.amount_paid)}
                      onChange={(e) =>
                        handleChargesChange("amount_paid", e.target.value)
                      }
                      onBlur={(e) => {
                        const numValue = parseFloat(e.target.value) || 0;
                        handleChargesChange("amount_paid", numValue);
                      }}
                      disabled={isSubmitting}
                      className="w-28 sm:w-32 px-2 py-1 border rounded text-right text-sm"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="text-base sm:text-lg font-bold text-gray-800">
                      Balance Due:
                    </span>
                    <span className="text-base sm:text-lg font-bold text-red-600">
                      ₹{formData.balance_due.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-end">
                <div className="w-full sm:w-2/3 lg:w-1/2">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-sm font-medium text-gray-700">
                      Payment Status:
                    </span>
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-medium ${getPaymentStatusColor(formData.payment_status)}`}
                    >
                      {formData.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-base sm:text-lg font-semibold mb-4">
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms_and_conditions"
                    value={formData.terms_and_conditions}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    rows="4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Enter terms and conditions..."
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="Enter any additional notes..."
                  />
                </div>
              </div>
            </div>

            {!viewMode && (
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={editMode ? updateBill : createBill}
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 min-w-[140px] sm:min-w-[160px] order-1 sm:order-2"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={18} />
                  )}
                  <span>{editMode ? "Update" : "Save"} Bill</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Bill;
