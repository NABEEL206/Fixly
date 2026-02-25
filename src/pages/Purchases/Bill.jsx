import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Save, Edit, Eye, Search, Download, Send, Filter, User, Building, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = "http://127.0.0.1:8000/api";
const ZOHO_BASE_URL = "http://127.0.0.1:8000/zoho";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for zoho endpoints
const zohoApi = axios.create({
  baseURL: ZOHO_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

zohoApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      toast.error("You don't have permission to perform this action");
    } else if (error.response?.status === 401) {
      toast.error("Please login again");
    }
    return Promise.reject(error);
  }
);

zohoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      toast.error("You don't have permission to perform this action");
    } else if (error.response?.status === 401) {
      toast.error("Please login again");
    }
    return Promise.reject(error);
  }
);

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "OPEN", label: "Open" },
  { value: "CANCELLED", label: "Cancelled" }
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "UNPAID", label: "Unpaid" },
  { value: "PARTIALLY_PAID", label: "Partially Paid" },
  { value: "PAID", label: "Paid" },
  { value: "OVERDUE", label: "Overdue" }
];

const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Check", label: "Check" },
  { value: "Credit Card", label: "Credit Card" },
  { value: "Debit Card", label: "Debit Card" },
  { value: "UPI", label: "UPI" },
  { value: "Other", label: "Other" }
];

const OWNER_TYPE_OPTIONS = [
  { value: "shop", label: "Shop" },
  { value: "growtag", label: "Growtag" }
];

const ACCOUNT_TYPES = [
  'Cost of Goods Sold',
  'Expense',
  'Other Expense',
  'Fixed Asset',
  'Other Asset',
  'Inventory',
  'Raw Materials'
];

// Toast utility functions
const showToast = {
  loading: (message) => toast.loading(message),
  success: (message, id) => toast.success(message, { id }),
  error: (message, id) => toast.error(message, { id }),
  dismiss: (id) => toast.dismiss(id),
  promise: (promise, messages) => toast.promise(promise, messages)
};

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'Cash',
    reference: ''
  });
  const [paymentErrors, setPaymentErrors] = useState({});

  // Cache for detailed bills
  const [billDetailsCache, setBillDetailsCache] = useState({});

  const initialFormState = {
    id: null,
    owner_type: 'shop',
    shop: null,
    growtag: null,
    status: 'DRAFT',
    vendor: null,
    bill_number: '',
    order_number: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_status: 'UNPAID',
    // Vendor snapshot fields
    vendor_name: '',
    vendor_email: '',
    vendor_phone: '',
    vendor_gstin: '',
    vendor_address: '',
    // Shipping/Billing
    ship_to: '',
    bill_to: '',
    // Items
    items: [
      {
        id: null,
        item: null,
        name: '',
        description: '',
        account: 'Cost of Goods Sold',
        qty: 1,
        rate: 0,
        tax_percent: 0,
        discount_percent: 0,
        amount: 0
      }
    ],
    // Totals
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
    notes: '',
    terms_and_conditions: '',
    payments: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  // Fetch vendors, shops, growtags, items on component mount
  useEffect(() => {
    fetchVendors();
    fetchShops();
    fetchGrowtags();
    fetchItems();
    fetchBills();
  }, []);

  // Toggle expanded row
  const toggleRow = (index) => {
    setExpandedRows(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Fetch vendors from API
  const fetchVendors = async () => {
    try {
      const response = await api.get('/vendors/');
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
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error("Failed to load vendors");
      }
    }
  };

  // Fetch shops from API
  const fetchShops = async () => {
    try {
      const response = await api.get('/shops/');
      const data = response.data;
      let shopsList = [];
      
      if (Array.isArray(data)) {
        shopsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        shopsList = data.data;
      } else if (data?.results) {
        shopsList = data.results;
      }
      
      setShops(shopsList);
    } catch (error) {
      console.error("Fetch shops error:", error);
    }
  };

  // Fetch growtags from API
  const fetchGrowtags = async () => {
    try {
      const response = await api.get('/growtags/');
      const data = response.data;
      let growtagsList = [];
      
      if (Array.isArray(data)) {
        growtagsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        growtagsList = data.data;
      } else if (data?.results) {
        growtagsList = data.results;
      }
      
      setGrowtags(growtagsList);
    } catch (error) {
      console.error("Fetch growtags error:", error);
    }
  };

  // Fetch items from Zoho API
  const fetchItems = async () => {
    setIsLoadingItems(true);
    try {
      const response = await zohoApi.get('/local-items/');
      const data = response.data;
      let itemsList = [];
      
      if (Array.isArray(data)) {
        itemsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        itemsList = data.data;
      } else if (data?.results) {
        itemsList = data.results;
      }
      
      // Transform items to a consistent format
      const transformedItems = itemsList.map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        unit: item.unit,
        selling_price: parseFloat(item.selling_price) || 0,
        cost_price: parseFloat(item.cost_price) || 0,
        service_charge: parseFloat(item.service_charge) || 0,
        tax_preference: item.tax_preference,
        gst_treatment: item.gst_treatment,
        hsn_or_sac: item.hsn_or_sac,
        sales_description: item.sales_description || '',
        purchase_description: item.purchase_description || '',
        is_purchasable: item.is_purchasable,
        is_sellable: item.is_sellable,
        is_active: item.is_active,
        product_type: item.product_type,
        sync_status: item.sync_status
      }));
      
      setItems(transformedItems);
    } catch (error) {
      console.error("Fetch items error:", error);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error("Failed to load items");
      }
    } finally {
      setIsLoadingItems(false);
    }
  };

  // Fetch single bill details
  const fetchBillDetails = async (id) => {
    try {
      // Check cache first
      if (billDetailsCache[id]) {
        return billDetailsCache[id];
      }

      const response = await api.get(`/bills/${id}/`);
      const data = response.data;
      const bill = data.data || data;

      // Transform the detailed data
      let itemsArray = [];
      if (bill?.items && Array.isArray(bill.items)) {
        itemsArray = bill.items.map(item => ({
          id: item?.id || null,
          item: item?.item || null,
          name: item?.name || '',
          description: item?.description || '',
          account: item?.account || 'Cost of Goods Sold',
          qty: parseFloat(item?.qty) || 1,
          rate: parseFloat(item?.rate) || 0,
          tax_percent: parseFloat(item?.tax_percent) || 0,
          discount_percent: parseFloat(item?.discount_percent) || 0,
          amount: parseFloat(item?.amount) || 0
        }));
      }

      let paymentsArray = [];
      if (bill?.payments && Array.isArray(bill.payments)) {
        paymentsArray = bill.payments.map(payment => ({
          id: payment?.id || null,
          payment_date: payment?.payment_date || '',
          amount: parseFloat(payment?.amount) || 0,
          method: payment?.method || '',
          reference: payment?.reference || '',
          created_at: payment?.created_at || ''
        }));
      }

      const detailedBill = {
        id: bill?.id || null,
        owner_type: bill?.owner_type || 'shop',
        shop: bill?.shop || null,
        growtag: bill?.growtag || null,
        status: bill?.status || 'DRAFT',
        vendor: bill?.vendor || null,
        bill_number: bill?.bill_number || '',
        order_number: bill?.order_number || '',
        bill_date: bill?.bill_date || '',
        due_date: bill?.due_date || '',
        payment_status: bill?.payment_status || 'UNPAID',
        vendor_name: bill?.vendor_name || '',
        vendor_email: bill?.vendor_email || '',
        vendor_phone: bill?.vendor_phone || '',
        vendor_gstin: bill?.vendor_gstin || '',
        vendor_address: bill?.vendor_address || '',
        ship_to: bill?.ship_to || '',
        bill_to: bill?.bill_to || '',
        items: itemsArray,
        payments: paymentsArray,
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
        notes: bill?.notes || '',
        terms_and_conditions: bill?.terms_and_conditions || ''
      };

      // Update cache
      setBillDetailsCache(prev => ({
        ...prev,
        [id]: detailedBill
      }));

      return detailedBill;
    } catch (error) {
      console.error(`Fetch bill details error for ID ${id}:`, error);
      if (error.response?.status !== 401 && error.response?.status !== 403) {
        toast.error("Failed to load bill details");
      }
      return null;
    }
  };

  // Fetch bills from API
  const fetchBills = async () => {
    setIsLoading(true);
    
    try {
      const response = await api.get('/bills/');
      const data = response.data;
      let billsList = [];
      
      if (Array.isArray(data)) {
        billsList = data;
      } else if (data?.data && Array.isArray(data.data)) {
        billsList = data.data;
      } else if (data?.results) {
        billsList = data.results;
      }
      
      // Transform API data
      const transformedBills = billsList.map(bill => {
        const cachedDetail = billDetailsCache[bill?.id];
        
        if (cachedDetail) {
          return cachedDetail;
        }

        let paymentsArray = [];
        if (bill?.payments && Array.isArray(bill.payments)) {
          paymentsArray = bill.payments.map(payment => ({
            id: payment?.id || null,
            payment_date: payment?.payment_date || '',
            amount: parseFloat(payment?.amount) || 0,
            method: payment?.method || '',
            reference: payment?.reference || '',
            created_at: payment?.created_at || ''
          }));
        }

        return {
          id: bill?.id || null,
          owner_type: bill?.owner_type || 'shop',
          shop: bill?.shop || null,
          growtag: bill?.growtag || null,
          status: bill?.status || 'DRAFT',
          vendor: bill?.vendor || null,
          bill_number: bill?.bill_number || '',
          order_number: bill?.order_number || '',
          bill_date: bill?.bill_date || '',
          due_date: bill?.due_date || '',
          payment_status: bill?.payment_status || 'UNPAID',
          vendor_name: bill?.vendor_name || '',
          vendor_email: bill?.vendor_email || '',
          vendor_phone: bill?.vendor_phone || '',
          vendor_gstin: bill?.vendor_gstin || '',
          vendor_address: bill?.vendor_address || '',
          ship_to: bill?.ship_to || '',
          bill_to: bill?.bill_to || '',
          items: [],
          payments: paymentsArray,
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
          notes: bill?.notes || '',
          terms_and_conditions: bill?.terms_and_conditions || ''
        };
      });
      
      setBills(transformedBills);
    } catch (error) {
      console.error("Fetch bills error:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        return;
      }
      toast.error("Failed to load bills");
    } finally {
      setIsLoading(false);
    }
  };

  // Load detailed data when needed
  const loadDetailedData = async (id) => {
    setIsFetchingDetails(true);
    const detailedData = await fetchBillDetails(id);
    setIsFetchingDetails(false);
    
    if (detailedData) {
      setBills(prev => 
        prev.map(bill => bill.id === id ? { ...bill, ...detailedData } : bill)
      );
      return detailedData;
    }
    return null;
  };

  // Generate Bill Number
  const generateBillNumber = () => {
    const prefix = 'BILL';
    const date = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${date}-${random}`;
  };

  // Calculate due date (30 days from bill date as default)
  const calculateDueDate = (billDate) => {
    const date = new Date(billDate);
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.bill_number.trim()) {
      newErrors.bill_number = 'Bill Number is required';
    }

    if (!formData.vendor) {
      newErrors.vendor = 'Vendor is required';
    }

    if (!formData.owner_type) {
      newErrors.owner_type = 'Owner type is required';
    }

    if (formData.owner_type === 'shop' && !formData.shop) {
      newErrors.shop = 'Shop is required when owner type is shop';
    }

    if (formData.owner_type === 'growtag' && !formData.growtag) {
      newErrors.growtag = 'Growtag is required when owner type is growtag';
    }

    if (!formData.bill_date) {
      newErrors.bill_date = 'Bill Date is required';
    }

    if (!formData.due_date) {
      newErrors.due_date = 'Due Date is required';
    } else if (new Date(formData.due_date) < new Date(formData.bill_date)) {
      newErrors.due_date = 'Due date cannot be before bill date';
    }

    if (!formData.bill_to.trim()) {
      newErrors.bill_to = 'Bill To address is required';
    }

    // Validate items
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    } else {
      formData.items.forEach((item, index) => {
        if (!item.name.trim()) {
          newErrors[`item_${index}_name`] = 'Item name is required';
        }
        if (item.qty <= 0) {
          newErrors[`item_${index}_qty`] = 'Quantity must be greater than 0';
        }
        if (item.rate < 0) {
          newErrors[`item_${index}_rate`] = 'Rate cannot be negative';
        }
        if (item.tax_percent < 0 || item.tax_percent > 100) {
          newErrors[`item_${index}_tax_percent`] = 'Tax must be between 0 and 100';
        }
        if (item.discount_percent < 0 || item.discount_percent > 100) {
          newErrors[`item_${index}_discount_percent`] = 'Discount must be between 0 and 100';
        }
      });
    }

    if (formData.tds_percent < 0 || formData.tds_percent > 100) {
      newErrors.tds_percent = 'TDS must be between 0 and 100';
    }

    if (formData.amount_paid < 0) {
      newErrors.amount_paid = 'Amount paid cannot be negative';
    }

    if (formData.amount_paid > formData.total) {
      newErrors.amount_paid = 'Amount paid cannot exceed total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Payment Form
  const validatePaymentForm = () => {
    const newErrors = {};

    if (!paymentForm.payment_date) {
      newErrors.payment_date = 'Payment date is required';
    }

    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    } else if (parseFloat(paymentForm.amount) > selectedBill?.balance_due) {
      newErrors.amount = `Amount cannot exceed balance due (₹${selectedBill?.balance_due?.toFixed(2)})`;
    }

    if (!paymentForm.method) {
      newErrors.method = 'Payment method is required';
    }

    setPaymentErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate item amount
  const calculateItemAmount = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const baseAmount = qty * rate;
    
    const discountPercent = parseFloat(item.discount_percent) || 0;
    const discountAmount = (baseAmount * discountPercent) / 100;
    
    const amountAfterDiscount = baseAmount - discountAmount;
    
    const taxPercent = parseFloat(item.tax_percent) || 0;
    const taxAmount = (amountAfterDiscount * taxPercent) / 100;
    
    return amountAfterDiscount + taxAmount;
  };

  // Calculate totals
  const calculateTotals = (items, tdsPercent, shippingCharges, adjustment, amountPaid) => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const baseAmount = qty * rate;
      
      subtotal += baseAmount;
      
      const discountPercent = parseFloat(item.discount_percent) || 0;
      totalDiscount += (baseAmount * discountPercent) / 100;
      
      const amountAfterDiscount = baseAmount - (baseAmount * discountPercent) / 100;
      const taxPercent = parseFloat(item.tax_percent) || 0;
      totalTax += (amountAfterDiscount * taxPercent) / 100;
    });

    const tdsAmount = (subtotal * (parseFloat(tdsPercent) || 0)) / 100;
    const total = subtotal - totalDiscount + totalTax - tdsAmount + 
                  parseFloat(shippingCharges || 0) + parseFloat(adjustment || 0);
    const balanceDue = total - parseFloat(amountPaid || 0);

    // Determine payment status
    let paymentStatus = formData.payment_status;
    if (amountPaid === 0) {
      paymentStatus = 'UNPAID';
    } else if (amountPaid < total) {
      paymentStatus = 'PARTIALLY_PAID';
    } else if (amountPaid >= total) {
      paymentStatus = 'PAID';
    }

    return { 
      subtotal, 
      totalTax, 
      totalDiscount, 
      tds_amount: tdsAmount,
      total, 
      balanceDue,
      paymentStatus 
    };
  };

  // Handle owner type change
  const handleOwnerTypeChange = (value) => {
    setFormData(prev => ({
      ...prev,
      owner_type: value,
      shop: null,
      growtag: null
    }));
    if (errors.owner_type) {
      setErrors(prev => ({ ...prev, owner_type: '' }));
    }
  };

  // Handle vendor selection
  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find(v => v.id === parseInt(vendorId));
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendor: vendor.id,
        vendor_name: vendor.name || '',
        vendor_email: vendor.email || '',
        vendor_phone: vendor.phone || '',
        vendor_address: vendor.address || '',
        vendor_gstin: vendor.gstin || ''
      }));
      if (errors.vendor) {
        setErrors(prev => ({ ...prev, vendor: '' }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        vendor: null,
        vendor_name: '',
        vendor_email: '',
        vendor_phone: '',
        vendor_address: '',
        vendor_gstin: ''
      }));
    }
  };

  // Handle item selection from catalog
  const handleItemSelection = (index, itemId) => {
    const item = items.find(i => i.id === parseInt(itemId));
    if (item) {
      const newItems = [...formData.items];
      newItems[index].item = item.id;
      newItems[index].name = item.name || '';
      // Use purchase_description for purchase bills
      newItems[index].description = item.purchase_description || item.sales_description || '';
      // Use cost_price for purchase bills
      newItems[index].rate = parseFloat(item.cost_price || 0);
      
      newItems[index].amount = calculateItemAmount(newItems[index]);
      
      const totals = calculateTotals(
        newItems, 
        formData.tds_percent, 
        formData.shipping_charges, 
        formData.adjustment, 
        formData.amount_paid
      );

      setFormData(prev => ({
        ...prev,
        items: newItems,
        ...totals
      }));

      // Clear any errors for this item
      if (errors[`item_${index}_name`]) {
        setErrors(prev => ({ ...prev, [`item_${index}_name`]: '' }));
      }
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let updates = { [name]: value };

    // Auto-calculate due date when bill date changes
    if (name === 'bill_date') {
      updates.due_date = calculateDueDate(value);
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle payment input change
  const handlePaymentInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
    if (paymentErrors[name]) {
      setPaymentErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    
    if (field === 'qty' || field === 'rate' || field === 'tax_percent' || field === 'discount_percent') {
      newItems[index][field] = parseFloat(value) || 0;
    } else {
      newItems[index][field] = value;
    }
    
    newItems[index].amount = calculateItemAmount(newItems[index]);

    const totals = calculateTotals(
      newItems, 
      formData.tds_percent, 
      formData.shipping_charges, 
      formData.adjustment, 
      formData.amount_paid
    );

    setFormData(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }));

    if (errors[`item_${index}_${field}`]) {
      setErrors(prev => ({ ...prev, [`item_${index}_${field}`]: '' }));
    }
  };

  // Add new item
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: null,
          item: null,
          name: '',
          description: '',
          account: 'Cost of Goods Sold',
          qty: 1,
          rate: 0,
          tax_percent: 0,
          discount_percent: 0,
          amount: 0
        }
      ]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length === 1) {
      toast.error('At least one item is required');
      return;
    }

    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(
      newItems, 
      formData.tds_percent, 
      formData.shipping_charges, 
      formData.adjustment, 
      formData.amount_paid
    );

    setFormData(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }));
  };

  // Handle charges change
  const handleChargesChange = (field, value) => {
    const newValue = parseFloat(value) || 0;
    
    const totals = calculateTotals(
      formData.items, 
      field === 'tds_percent' ? newValue : formData.tds_percent,
      field === 'shipping_charges' ? newValue : formData.shipping_charges,
      field === 'adjustment' ? newValue : formData.adjustment,
      field === 'amount_paid' ? newValue : formData.amount_paid
    );

    setFormData(prev => ({
      ...prev,
      [field]: newValue,
      ...totals
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Record Payment
  const recordPayment = async () => {
    if (!validatePaymentForm()) {
      toast.error('Please fix all payment errors');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Recording payment...');

    try {
      const paymentData = {
        payments: [
          {
            payment_date: paymentForm.payment_date,
            amount: parseFloat(paymentForm.amount).toFixed(2),
            method: paymentForm.method,
            reference: paymentForm.reference || ''
          }
        ]
      };

      const response = await api.patch(`/bills/${selectedBill.id}/`, paymentData);
      
      const responseData = response.data;
      const updatedBill = responseData.data || responseData;

      // Transform response to frontend format
      let itemsArray = [];
      if (updatedBill?.items && Array.isArray(updatedBill.items)) {
        itemsArray = updatedBill.items.map(item => ({
          id: item?.id || null,
          item: item?.item || null,
          name: item?.name || '',
          description: item?.description || '',
          account: item?.account || 'Cost of Goods Sold',
          qty: parseFloat(item?.qty) || 1,
          rate: parseFloat(item?.rate) || 0,
          tax_percent: parseFloat(item?.tax_percent) || 0,
          discount_percent: parseFloat(item?.discount_percent) || 0,
          amount: parseFloat(item?.amount) || 0
        }));
      }

      let paymentsArray = [];
      if (updatedBill?.payments && Array.isArray(updatedBill.payments)) {
        paymentsArray = updatedBill.payments.map(payment => ({
          id: payment?.id || null,
          payment_date: payment?.payment_date || '',
          amount: parseFloat(payment?.amount) || 0,
          method: payment?.method || '',
          reference: payment?.reference || '',
          created_at: payment?.created_at || ''
        }));
      }

      const transformedBill = {
        id: updatedBill?.id || null,
        owner_type: updatedBill?.owner_type || 'shop',
        shop: updatedBill?.shop || null,
        growtag: updatedBill?.growtag || null,
        status: updatedBill?.status || 'DRAFT',
        vendor: updatedBill?.vendor || null,
        bill_number: updatedBill?.bill_number || '',
        order_number: updatedBill?.order_number || '',
        bill_date: updatedBill?.bill_date || '',
        due_date: updatedBill?.due_date || '',
        payment_status: updatedBill?.payment_status || 'UNPAID',
        vendor_name: updatedBill?.vendor_name || '',
        vendor_email: updatedBill?.vendor_email || '',
        vendor_phone: updatedBill?.vendor_phone || '',
        vendor_gstin: updatedBill?.vendor_gstin || '',
        vendor_address: updatedBill?.vendor_address || '',
        ship_to: updatedBill?.ship_to || '',
        bill_to: updatedBill?.bill_to || '',
        items: itemsArray,
        payments: paymentsArray,
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
        notes: updatedBill?.notes || '',
        terms_and_conditions: updatedBill?.terms_and_conditions || ''
      };

      // Update cache
      setBillDetailsCache(prev => ({
        ...prev,
        [transformedBill.id]: transformedBill
      }));

      // Update bills list
      setBills(prev =>
        prev.map(bill => (bill.id === transformedBill.id ? transformedBill : bill))
      );

      // Update form data if we're viewing/editing this bill
      if (formData.id === transformedBill.id) {
        setFormData(transformedBill);
      }

      toast.success('Payment recorded successfully!', { id: loadingToast });
      
      // Close payment modal
      setShowPaymentModal(false);
      setSelectedBill(null);
      setPaymentForm({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        method: 'Cash',
        reference: ''
      });
    } catch (error) {
      console.error("Record payment error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.dismiss(loadingToast);
        return;
      }
      
      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = [];
        
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(', ')}`);
          } else if (typeof apiErrors[key] === 'string') {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join('\n') || "Validation failed", { id: loadingToast });
      } else {
        toast.error(error.response?.data?.message || "Failed to record payment", { id: loadingToast });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Transform form data to API format
  const transformToAPIFormat = (data) => {
    const apiData = {
      owner_type: data.owner_type,
      shop: data.owner_type === 'shop' ? data.shop : null,
      growtag: data.owner_type === 'growtag' ? data.growtag : null,
      status: data.status,
      vendor: data.vendor,
      bill_number: data.bill_number,
      order_number: data.order_number || '',
      bill_date: data.bill_date,
      due_date: data.due_date,
      payment_status: data.payment_status,
      // Vendor snapshot fields
      vendor_name: data.vendor_name,
      vendor_email: data.vendor_email,
      vendor_phone: data.vendor_phone,
      vendor_gstin: data.vendor_gstin || '',
      vendor_address: data.vendor_address,
      // Shipping/Billing
      ship_to: data.ship_to || '',
      bill_to: data.bill_to,
      // Items
      items: data.items.map(item => ({
        item: item.item, // This links to the LocalItem
        name: item.name,
        description: item.description || '',
        account: item.account || 'Cost of Goods Sold',
        qty: item.qty,
        rate: item.rate,
        tax_percent: item.tax_percent,
        discount_percent: item.discount_percent
      })),
      // Totals (will be calculated on backend)
      tds_percent: data.tds_percent,
      shipping_charges: data.shipping_charges,
      adjustment: data.adjustment,
      notes: data.notes || '',
      terms_and_conditions: data.terms_and_conditions || ''
    };

    return apiData;
  };

  // Create Bill
  const createBill = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before submitting');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating bill...');

    try {
      const apiData = transformToAPIFormat(formData);
      const response = await api.post('/bills/', apiData);
      
      const responseData = response.data;
      const newBill = responseData.data || responseData;

      // Transform response to frontend format
      let itemsArray = [];
      if (newBill?.items && Array.isArray(newBill.items)) {
        itemsArray = newBill.items.map(item => ({
          id: item?.id || null,
          item: item?.item || null,
          name: item?.name || '',
          description: item?.description || '',
          account: item?.account || 'Cost of Goods Sold',
          qty: parseFloat(item?.qty) || 1,
          rate: parseFloat(item?.rate) || 0,
          tax_percent: parseFloat(item?.tax_percent) || 0,
          discount_percent: parseFloat(item?.discount_percent) || 0,
          amount: parseFloat(item?.amount) || 0
        }));
      }

      let paymentsArray = [];
      if (newBill?.payments && Array.isArray(newBill.payments)) {
        paymentsArray = newBill.payments.map(payment => ({
          id: payment?.id || null,
          payment_date: payment?.payment_date || '',
          amount: parseFloat(payment?.amount) || 0,
          method: payment?.method || '',
          reference: payment?.reference || '',
          created_at: payment?.created_at || ''
        }));
      }

      const transformedBill = {
        id: newBill?.id || null,
        owner_type: newBill?.owner_type || 'shop',
        shop: newBill?.shop || null,
        growtag: newBill?.growtag || null,
        status: newBill?.status || 'DRAFT',
        vendor: newBill?.vendor || null,
        bill_number: newBill?.bill_number || '',
        order_number: newBill?.order_number || '',
        bill_date: newBill?.bill_date || '',
        due_date: newBill?.due_date || '',
        payment_status: newBill?.payment_status || 'UNPAID',
        vendor_name: newBill?.vendor_name || formData.vendor_name,
        vendor_email: newBill?.vendor_email || formData.vendor_email,
        vendor_phone: newBill?.vendor_phone || formData.vendor_phone,
        vendor_gstin: newBill?.vendor_gstin || formData.vendor_gstin,
        vendor_address: newBill?.vendor_address || formData.vendor_address,
        ship_to: newBill?.ship_to || '',
        bill_to: newBill?.bill_to || '',
        items: itemsArray,
        payments: paymentsArray,
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
        notes: newBill?.notes || '',
        terms_and_conditions: newBill?.terms_and_conditions || ''
      };

      // Update cache
      setBillDetailsCache(prev => ({
        ...prev,
        [transformedBill.id]: transformedBill
      }));

      setBills(prev => [transformedBill, ...prev]);
      
      toast.success(responseData.message || 'Bill created successfully!', { id: loadingToast });
      resetForm();
    } catch (error) {
      console.error("Create bill error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.dismiss(loadingToast);
        return;
      }
      
      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = [];
        
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(', ')}`);
          } else if (typeof apiErrors[key] === 'string') {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join('\n') || "Validation failed", { id: loadingToast });
      } else {
        toast.error(error.response?.data?.message || "Failed to create bill", { id: loadingToast });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Bill
  const updateBill = async () => {
    if (!validateForm()) {
      toast.error('Please fix all errors before updating');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Updating bill...');

    try {
      const apiData = transformToAPIFormat(formData);
      const response = await api.put(`/bills/${formData.id}/`, apiData);
      
      const responseData = response.data;
      const updatedBill = responseData.data || responseData;

      // Transform response to frontend format
      let itemsArray = [];
      if (updatedBill?.items && Array.isArray(updatedBill.items)) {
        itemsArray = updatedBill.items.map(item => ({
          id: item?.id || null,
          item: item?.item || null,
          name: item?.name || '',
          description: item?.description || '',
          account: item?.account || 'Cost of Goods Sold',
          qty: parseFloat(item?.qty) || 1,
          rate: parseFloat(item?.rate) || 0,
          tax_percent: parseFloat(item?.tax_percent) || 0,
          discount_percent: parseFloat(item?.discount_percent) || 0,
          amount: parseFloat(item?.amount) || 0
        }));
      }

      let paymentsArray = [];
      if (updatedBill?.payments && Array.isArray(updatedBill.payments)) {
        paymentsArray = updatedBill.payments.map(payment => ({
          id: payment?.id || null,
          payment_date: payment?.payment_date || '',
          amount: parseFloat(payment?.amount) || 0,
          method: payment?.method || '',
          reference: payment?.reference || '',
          created_at: payment?.created_at || ''
        }));
      }

      const transformedBill = {
        id: updatedBill?.id || null,
        owner_type: updatedBill?.owner_type || 'shop',
        shop: updatedBill?.shop || null,
        growtag: updatedBill?.growtag || null,
        status: updatedBill?.status || 'DRAFT',
        vendor: updatedBill?.vendor || null,
        bill_number: updatedBill?.bill_number || '',
        order_number: updatedBill?.order_number || '',
        bill_date: updatedBill?.bill_date || '',
        due_date: updatedBill?.due_date || '',
        payment_status: updatedBill?.payment_status || 'UNPAID',
        vendor_name: updatedBill?.vendor_name || formData.vendor_name,
        vendor_email: updatedBill?.vendor_email || formData.vendor_email,
        vendor_phone: updatedBill?.vendor_phone || formData.vendor_phone,
        vendor_gstin: updatedBill?.vendor_gstin || formData.vendor_gstin,
        vendor_address: updatedBill?.vendor_address || formData.vendor_address,
        ship_to: updatedBill?.ship_to || '',
        bill_to: updatedBill?.bill_to || '',
        items: itemsArray,
        payments: paymentsArray,
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
        notes: updatedBill?.notes || '',
        terms_and_conditions: updatedBill?.terms_and_conditions || ''
      };

      // Update cache
      setBillDetailsCache(prev => ({
        ...prev,
        [transformedBill.id]: transformedBill
      }));

      setBills(prev =>
        prev.map(bill => (bill.id === transformedBill.id ? transformedBill : bill))
      );
      
      toast.success(responseData.message || 'Bill updated successfully!', { id: loadingToast });
      resetForm();
    } catch (error) {
      console.error("Update bill error:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.dismiss(loadingToast);
        return;
      }
      
      if (error.response?.status === 400) {
        const apiErrors = error.response.data;
        const errorMessages = [];
        
        Object.keys(apiErrors).forEach(key => {
          if (Array.isArray(apiErrors[key])) {
            errorMessages.push(`${key}: ${apiErrors[key].join(', ')}`);
          } else if (typeof apiErrors[key] === 'string') {
            errorMessages.push(apiErrors[key]);
          }
        });

        toast.error(errorMessages.join('\n') || "Validation failed", { id: loadingToast });
      } else {
        toast.error(error.response?.data?.message || "Failed to update bill", { id: loadingToast });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Bill
  const deleteBill = (id) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete Bill?</p>
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
                const loadingToast = toast.loading("Deleting bill...");
                
                try {
                  await api.delete(`/bills/${id}/`);
                  setBillDetailsCache(prev => {
                    const newCache = { ...prev };
                    delete newCache[id];
                    return newCache;
                  });
                  setBills(prev => prev.filter(bill => bill.id !== id));
                  toast.success("Bill deleted successfully", { id: loadingToast });
                } catch (error) {
                  console.error("Delete bill error:", error);
                  
                  if (error.response?.status === 401 || error.response?.status === 403) {
                    toast.dismiss(loadingToast);
                    return;
                  }
                  
                  toast.error(error.response?.data?.message || "Failed to delete bill", { id: loadingToast });
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

  // Edit Bill
  const editBill = async (bill) => {
    const loadingToast = toast.loading('Loading bill details...');
    
    try {
      let detailedBill = bill;
      
      if (!bill.items || bill.items.length === 0) {
        detailedBill = await loadDetailedData(bill.id);
      }
      
      if (detailedBill) {
        // Ensure items have all required fields
        const itemsWithDefaults = detailedBill.items.map(item => ({
          id: item.id || null,
          item: item.item || null,
          name: item.name || '',
          description: item.description || '',
          account: item.account || 'Cost of Goods Sold',
          qty: parseFloat(item.qty) || 1,
          rate: parseFloat(item.rate) || 0,
          tax_percent: parseFloat(item.tax_percent) || 0,
          discount_percent: parseFloat(item.discount_percent) || 0,
          amount: parseFloat(item.amount) || 0
        }));

        setFormData({
          ...detailedBill,
          items: itemsWithDefaults
        });
        setEditMode(true);
        setViewMode(false);
        setShowForm(true);
        toast.dismiss(loadingToast);
      } else {
        toast.error('Failed to load bill details', { id: loadingToast });
      }
    } catch (error) {
      console.error("Error loading bill details:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.dismiss(loadingToast);
        return;
      }
      
      toast.error('Failed to load bill details', { id: loadingToast });
    }
  };

  // View Bill
  const viewBill = async (bill) => {
    const loadingToast = toast.loading('Loading bill details...');
    
    try {
      let detailedBill = bill;
      
      if (!bill.items || bill.items.length === 0) {
        detailedBill = await loadDetailedData(bill.id);
      }
      
      if (detailedBill) {
        // Ensure items have all required fields
        const itemsWithDefaults = detailedBill.items.map(item => ({
          id: item.id || null,
          item: item.item || null,
          name: item.name || '',
          description: item.description || '',
          account: item.account || 'Cost of Goods Sold',
          qty: parseFloat(item.qty) || 1,
          rate: parseFloat(item.rate) || 0,
          tax_percent: parseFloat(item.tax_percent) || 0,
          discount_percent: parseFloat(item.discount_percent) || 0,
          amount: parseFloat(item.amount) || 0
        }));

        setFormData({
          ...detailedBill,
          items: itemsWithDefaults
        });
        setViewMode(true);
        setEditMode(false);
        setShowForm(true);
        toast.dismiss(loadingToast);
      } else {
        toast.error('Failed to load bill details', { id: loadingToast });
      }
    } catch (error) {
      console.error("Error loading bill details:", error);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.dismiss(loadingToast);
        return;
      }
      
      toast.error('Failed to load bill details', { id: loadingToast });
    }
  };

  // Reset Form
  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
    setEditMode(false);
    setViewMode(false);
    setErrors({});
    setExpandedRows({});
  };

  // New Bill
  const newBill = () => {
    const billDate = new Date().toISOString().split('T')[0];
    setFormData({
      ...initialFormState,
      bill_number: generateBillNumber(),
      bill_date: billDate,
      due_date: calculateDueDate(billDate)
    });
    setShowForm(true);
    setEditMode(false);
    setViewMode(false);
    setExpandedRows({});
  };

  // Open Payment Modal
  const openPaymentModal = (bill) => {
    setSelectedBill(bill);
    setPaymentForm({
      payment_date: new Date().toISOString().split('T')[0],
      amount: bill.balance_due.toFixed(2),
      method: 'Cash',
      reference: ''
    });
    setPaymentErrors({});
    setShowPaymentModal(true);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterPaymentStatus('');
  };

  // Filter Bills
  const filteredBills = bills.filter(bill => {
    const matchesSearch = 
      (bill.bill_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (bill.vendor_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (bill.status?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (bill.payment_status?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filterStatus || bill.status === filterStatus;
    const matchesPaymentStatus = !filterPaymentStatus || bill.payment_status === filterPaymentStatus;
    
    return matchesSearch && matchesStatus && matchesPaymentStatus;
  });

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'DRAFT': return 'bg-gray-200 text-gray-800';
      case 'OPEN': return 'bg-blue-200 text-blue-800';
      case 'CANCELLED': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'PAID': return 'bg-green-200 text-green-800';
      case 'PARTIALLY_PAID': return 'bg-yellow-200 text-yellow-800';
      case 'UNPAID': return 'bg-red-200 text-red-800';
      case 'OVERDUE': return 'bg-red-300 text-red-900';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  // Payment Modal Component
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-600 p-2 rounded-lg mr-3">
                <CreditCard className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Record Payment
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedBill?.bill_number}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedBill(null);
                setPaymentErrors({});
              }}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-white/50 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* Bill Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Total Amount:</span>
              <span className="text-lg font-bold text-gray-900">₹{selectedBill?.total?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Amount Paid:</span>
              <span className="text-lg font-bold text-green-600">₹{selectedBill?.amount_paid?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-300">
              <span className="text-sm font-medium text-gray-700">Balance Due:</span>
              <span className="text-xl font-bold text-red-600">₹{selectedBill?.balance_due?.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Form */}
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
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  paymentErrors.payment_date ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {paymentErrors.payment_date && (
                <p className="text-red-500 text-xs mt-1">{paymentErrors.payment_date}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={paymentForm.amount}
                  onChange={handlePaymentInputChange}
                  min="0.01"
                  max={selectedBill?.balance_due}
                  step="0.01"
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    paymentErrors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {paymentErrors.amount && (
                <p className="text-red-500 text-xs mt-1">{paymentErrors.amount}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="method"
                value={paymentForm.method}
                onChange={handlePaymentInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  paymentErrors.method ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method.value} value={method.value}>{method.label}</option>
                ))}
              </select>
              {paymentErrors.method && (
                <p className="text-red-500 text-xs mt-1">{paymentErrors.method}</p>
              )}
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

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedBill(null);
                setPaymentErrors({});
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={recordPayment}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Recording...</span>
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // View Modal Component
  const ViewModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl my-8">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Bill Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.bill_number}
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

        {/* Modal Body */}
        <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Bill Info & Status */}
          <div className="flex items-start justify-between mb-6 pb-4 border-b">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 mb-2">
                {formData.bill_number}
              </h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
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
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(formData.status)}`}>
                {formData.status}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getPaymentStatusColor(formData.payment_status)}`}>
                {formData.payment_status}
              </span>
            </div>
          </div>

          {/* Owner Information */}
          <div className="mb-6">
            <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
              <User size={16} className="mr-2" />
              Owner Information
            </h5>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Owner Type</p>
                  <p className="text-sm text-gray-900 font-medium capitalize">{formData.owner_type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Owner</p>
                  <p className="text-sm text-gray-900">
                    {formData.owner_type === 'shop' 
                      ? shops.find(s => s.id === formData.shop)?.shopname || 'N/A'
                      : growtags.find(g => g.id === formData.growtag)?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
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
                  <p className="text-xs font-medium text-gray-500 mb-1">Vendor Name</p>
                  <p className="text-sm text-gray-900 font-medium">{formData.vendor_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-900">{formData.vendor_email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-sm text-gray-900">{formData.vendor_phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">GSTIN</p>
                  <p className="text-sm text-gray-900">{formData.vendor_gstin || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                  <p className="text-sm text-gray-900">{formData.vendor_address || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Billing */}
          {(formData.ship_to || formData.bill_to) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Shipping & Billing
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.ship_to && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Ship To</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.ship_to}</p>
                  </div>
                )}
                {formData.bill_to && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Bill To</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.bill_to}</p>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Disc %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items && formData.items.length > 0 ? (
                    formData.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{item.name || 'N/A'}</p>
                          {item.item && (
                            <p className="text-xs text-gray-500">ID: {item.item}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">{item.description || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-600">{item.account || 'Cost of Goods Sold'}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.qty}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{parseFloat(item.rate).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.tax_percent}%</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.discount_percent}%</td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₹{parseFloat(item.amount).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-3 text-center text-gray-500">
                        No items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments */}
          {formData.payments && formData.payments.length > 0 && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide flex items-center">
                <CreditCard size={16} className="mr-2" />
                Payment History
              </h5>
              <div className="overflow-x-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.payments.map((payment, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">{payment.payment_date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{payment.method}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{payment.reference || '-'}</td>
                        <td className="px-4 py-3 text-sm font-medium text-green-600 text-right">₹{payment.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-full md:w-1/2 bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">₹{parseFloat(formData.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Discount:</span>
                  <span className="font-medium text-red-600">-₹{parseFloat(formData.total_discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-medium">₹{parseFloat(formData.total_tax).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">TDS ({formData.tds_percent}%):</span>
                  <span className="font-medium text-red-600">-₹{parseFloat(formData.tds_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">₹{parseFloat(formData.shipping_charges).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Adjustment:</span>
                  <span className="font-medium">₹{parseFloat(formData.adjustment).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                  <span className="text-base font-bold text-gray-800">Total:</span>
                  <span className="text-base font-bold text-blue-600">₹{parseFloat(formData.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium text-green-600">₹{parseFloat(formData.amount_paid).toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-base font-bold text-gray-800">Balance Due:</span>
                  <span className="text-base font-bold text-red-600">₹{parseFloat(formData.balance_due).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms & Notes */}
          {(formData.terms_and_conditions || formData.notes) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Additional Information
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.terms_and_conditions && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Terms & Conditions</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.terms_and_conditions}</p>
                  </div>
                )}
                {formData.notes && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Notes</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setViewMode(false);
                  setEditMode(true);
                }}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
              >
                <Edit size={16} className="mr-2" />
                Edit Bill
              </button>
              {formData.payment_status !== 'PAID' && formData.balance_due > 0 && (
                <button
                  onClick={() => {
                    setViewMode(false);
                    openPaymentModal(formData);
                  }}
                  className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors flex items-center"
                >
                  <CreditCard size={16} className="mr-2" />
                  Record Payment
                </button>
              )}
            </div>
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
      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal />}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Bills</h1>
          {!showForm && (
            <button
              onClick={newBill}
              disabled={isSubmitting || isFetchingDetails}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting || isFetchingDetails ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  New Bill
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Bill List */}
      {!showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by Bill Number, Vendor, Status..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  disabled={isLoading}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  disabled={isLoading}
                  className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Payment</option>
                  {PAYMENT_STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Clear Filters Button */}
              {(searchTerm || filterStatus || filterPaymentStatus) && (
                <button
                  onClick={clearFilters}
                  disabled={isLoading}
                  className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span>Loading bills...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No bills found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{bill.bill_number}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.vendor_name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.bill_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.due_date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(bill.payment_status)}`}>
                          {bill.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{parseFloat(bill.total).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ₹{parseFloat(bill.balance_due).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewBill(bill)}
                            disabled={isFetchingDetails}
                            className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View"
                          >
                            {isFetchingDetails ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            ) : (
                              <Eye size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => editBill(bill)}
                            disabled={isFetchingDetails}
                            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Edit"
                          >
                            {isFetchingDetails ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            ) : (
                              <Edit size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => deleteBill(bill.id)}
                            disabled={isFetchingDetails}
                            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                          {bill.payment_status !== 'PAID' && bill.balance_due > 0 && (
                            <button
                              onClick={() => openPaymentModal(bill)}
                              disabled={isFetchingDetails}
                              className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Record Payment"
                            >
                              <CreditCard size={18} />
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

      {/* Bill Form */}
      {showForm && !viewMode && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {editMode ? 'Edit' : 'New'} Bill
            </h2>
            <button 
              onClick={resetForm} 
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            {/* Info Box */}
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h4 className="text-sm font-medium text-blue-800 mb-1">Required Fields</h4>
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Required:</span> Bill Number, Vendor, Owner, Bill Date, Due Date, Bill To Address, Items (with Qty & Rate)
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">Optional:</span> Order Number, Shipping Address, Tax, Discount, TDS, Notes, Terms
                  </p>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bill_number"
                    value={formData.bill_number}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.bill_number ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.bill_number && <p className="text-red-500 text-xs mt-1">{errors.bill_number}</p>}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.bill_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.bill_date && <p className="text-red-500 text-xs mt-1">{errors.bill_date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleInputChange}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.due_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.due_date && <p className="text-red-500 text-xs mt-1">{errors.due_date}</p>}
                </div>
              </div>
            </div>

            {/* Owner Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Owner Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Owner Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.owner_type}
                    onChange={(e) => handleOwnerTypeChange(e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.owner_type ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {OWNER_TYPE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {errors.owner_type && <p className="text-red-500 text-xs mt-1">{errors.owner_type}</p>}
                </div>

                {formData.owner_type === 'shop' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Shop <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.shop || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, shop: e.target.value ? parseInt(e.target.value) : null }))}
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.shop ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Select Shop --</option>
                      {shops.map(shop => (
                        <option key={shop.id} value={shop.id}>{shop.shopname}</option>
                      ))}
                    </select>
                    {errors.shop && <p className="text-red-500 text-xs mt-1">{errors.shop}</p>}
                  </div>
                )}

                {formData.owner_type === 'growtag' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Growtag <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.growtag || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, growtag: e.target.value ? parseInt(e.target.value) : null }))}
                      disabled={isSubmitting}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.growtag ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Select Growtag --</option>
                      {growtags.map(growtag => (
                        <option key={growtag.id} value={growtag.id}>{growtag.name} ({growtag.grow_id})</option>
                      ))}
                    </select>
                    {errors.growtag && <p className="text-red-500 text-xs mt-1">{errors.growtag}</p>}
                  </div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    {STATUS_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
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
                    value={formData.vendor || ''}
                    onChange={(e) => handleVendorChange(e.target.value)}
                    disabled={isSubmitting}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.vendor ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </select>
                  {errors.vendor && <p className="text-red-500 text-xs mt-1">{errors.vendor}</p>}
                </div>

                {formData.vendor && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Name
                      </label>
                      <input
                        type="text"
                        value={formData.vendor_name}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Shipping & Billing */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Shipping & Billing Addresses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.bill_to ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.bill_to && <p className="text-red-500 text-xs mt-1">{errors.bill_to}</p>}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Item Details</h3>
                {!viewMode && (
                  <button
                    onClick={addItem}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-64">Item <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Account</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Qty <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Rate <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Tax %</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-20">Disc %</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">Amount</th>
                      {!viewMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-16">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items && formData.items.length > 0 ? (
                      formData.items.map((item, index) => (
                        <React.Fragment key={index}>
                          <tr className="border-t hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-between">
                                <select
                                  value={item.item || ''}
                                  onChange={(e) => handleItemSelection(index, e.target.value)}
                                  disabled={isSubmitting}
                                  className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                    errors[`item_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                                  }`}
                                >
                                  <option value="">-- Select an item --</option>
                                  {isLoadingItems ? (
                                    <option disabled>Loading items...</option>
                                  ) : (
                                    items.filter(item => item.is_purchasable !== false).map(catalogItem => (
                                      <option key={catalogItem.id} value={catalogItem.id}>
                                        {catalogItem.name}
                                      </option>
                                    ))
                                  )}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => toggleRow(index)}
                                  className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                                >
                                  {expandedRows[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </button>
                              </div>
                              {errors[`item_${index}_name`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_name`]}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.description || ''}
                                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                  disabled={isSubmitting}
                                  placeholder="Description"
                                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={item.account || 'Cost of Goods Sold'}
                                onChange={(e) => handleItemChange(index, 'account', e.target.value)}
                                disabled={isSubmitting}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                {ACCOUNT_TYPES.map(type => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => handleItemChange(index, 'qty', e.target.value)}
                                disabled={isSubmitting}
                                min="1"
                                className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                  errors[`item_${index}_qty`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              {errors[`item_${index}_qty`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_qty`]}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.rate}
                                onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                disabled={isSubmitting}
                                min="0"
                                step="0.01"
                                className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                  errors[`item_${index}_rate`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              {errors[`item_${index}_rate`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_rate`]}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.tax_percent}
                                onChange={(e) => handleItemChange(index, 'tax_percent', e.target.value)}
                                disabled={isSubmitting}
                                min="0"
                                max="100"
                                step="0.01"
                                className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                  errors[`item_${index}_tax_percent`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              {errors[`item_${index}_tax_percent`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_tax_percent`]}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                value={item.discount_percent}
                                onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                                disabled={isSubmitting}
                                min="0"
                                max="100"
                                step="0.01"
                                className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                                  errors[`item_${index}_discount_percent`] ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                              {errors[`item_${index}_discount_percent`] && (
                                <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_discount_percent`]}</p>
                              )}
                            </td>
                            <td className="px-3 py-2 font-medium text-right">
                              ₹{item.amount.toFixed(2)}
                            </td>
                            {!viewMode && (
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => removeItem(index)}
                                  disabled={isSubmitting}
                                  className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Remove Item"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            )}
                          </tr>
                          {expandedRows[index] && (
                            <tr className="bg-gray-50">
                              <td colSpan={!viewMode ? "9" : "8"} className="px-3 py-2">
                                <div className="text-sm text-gray-600">
                                  <p className="font-medium mb-1">Additional Details:</p>
                                  <div className="grid grid-cols-3 gap-4">
                                    <div>
                                      <span className="text-xs text-gray-500">Item ID:</span>
                                      <p className="text-sm">{item.item || 'Not linked'}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">Line Total:</span>
                                      <p className="text-sm font-medium">₹{item.amount.toFixed(2)}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">Account Type:</span>
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
                        <td colSpan={!viewMode ? "9" : "8"} className="px-3 py-4 text-center text-gray-500">
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
                    <span className="font-medium">₹{formData.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Discount:</span>
                    <span className="font-medium text-red-600">-₹{formData.total_discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-medium">₹{formData.total_tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">TDS (%):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.tds_percent}
                        onChange={(e) => handleChargesChange('tds_percent', e.target.value)}
                        disabled={isSubmitting}
                        min="0"
                        max="100"
                        step="0.01"
                        className={`w-20 px-2 py-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          errors.tds_percent ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      <span className="font-medium text-red-600">-₹{formData.tds_amount.toFixed(2)}</span>
                    </div>
                  </div>
                  {errors.tds_percent && <p className="text-red-500 text-xs text-right">{errors.tds_percent}</p>}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping Charges:</span>
                    <input
                      type="number"
                      value={formData.shipping_charges}
                      onChange={(e) => handleChargesChange('shipping_charges', e.target.value)}
                      disabled={isSubmitting}
                      min="0"
                      step="0.01"
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Adjustment:</span>
                    <input
                      type="number"
                      value={formData.adjustment}
                      onChange={(e) => handleChargesChange('adjustment', e.target.value)}
                      disabled={isSubmitting}
                      step="0.01"
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold text-gray-800">Total:</span>
                    <span className="text-lg font-bold text-blue-600">₹{formData.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Amount Paid:</span>
                    <input
                      type="number"
                      value={formData.amount_paid}
                      onChange={(e) => handleChargesChange('amount_paid', e.target.value)}
                      disabled={isSubmitting}
                      min="0"
                      step="0.01"
                      className={`w-32 px-2 py-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.amount_paid ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.amount_paid && <p className="text-red-500 text-xs text-right">{errors.amount_paid}</p>}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="text-lg font-bold text-gray-800">Balance Due:</span>
                    <span className="text-lg font-bold text-red-600">₹{formData.balance_due.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="mb-6">
              <div className="flex justify-end">
                <div className="w-full md:w-1/2">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-sm font-medium text-gray-700">Payment Status:</span>
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${getPaymentStatusColor(formData.payment_status)}`}>
                      {formData.payment_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Terms */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter any additional notes..."
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {!viewMode && (
              <div className="flex justify-end gap-4">
                <button
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={editMode ? updateBill : createBill}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{editMode ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      <span>{editMode ? 'Update' : 'Save'} Bill</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {viewMode && (
              <div className="flex justify-end gap-4">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setViewMode(false);
                    setEditMode(true);
                  }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Edit size={20} />
                  Edit Bill
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