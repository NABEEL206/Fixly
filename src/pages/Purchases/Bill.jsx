import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Edit, Eye, Search, Download, Send } from 'lucide-react';

const Bill = () => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, billId: null });

  // Predefined vendors list
  const [vendors, setVendors] = useState([
    {
      id: 1,
      name: 'ABC Suppliers Ltd',
      email: 'contact@abcsuppliers.com',
      phone: '9876543210',
      address: '123 Business Park, Mumbai, Maharashtra - 400001',
      gstin: '27AABCU9603R1ZV'
    },
    {
      id: 2,
      name: 'XYZ Corporation',
      email: 'info@xyzcorp.com',
      phone: '9876543211',
      address: '456 Industrial Area, Delhi - 110001',
      gstin: '07AACFX1234B1Z5'
    },
    {
      id: 3,
      name: 'Global Trading Co',
      email: 'sales@globaltrading.com',
      phone: '9876543212',
      address: '789 Export Zone, Bangalore, Karnataka - 560001',
      gstin: '29AADCG7123M1ZK'
    },
    {
      id: 4,
      name: 'Prime Materials Inc',
      email: 'orders@primematerials.com',
      phone: '9876543213',
      address: '321 Manufacturing Hub, Chennai, Tamil Nadu - 600001',
      gstin: '33AABCP1234D1Z1'
    },
    {
      id: 5,
      name: 'Tech Solutions Pvt Ltd',
      email: 'support@techsolutions.com',
      phone: '9876543214',
      address: '654 Tech Park, Hyderabad, Telangana - 500001',
      gstin: '36AACTS1234E1Z2'
    }
  ]);

  const initialFormState = {
    id: null,
    billNumber: '',
    orderNumber: '',
    vendorId: '',
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorAddress: '',
    vendorGSTIN: '',
    billDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    paymentTerms: 'Net 30',
    status: 'Draft',
    paymentStatus: 'Unpaid',
    shipTo: '',
    billTo: '',
    items: [
      {
        itemName: '',
        description: '',
        accountType: 'Cost of Goods Sold',
        quantity: 1,
        rate: 0,
        tax: 0,
        discount: 0,
        amount: 0
      }
    ],
    subtotal: 0,
    totalTax: 0,
    totalDiscount: 0,
    tds: 0,
    shippingCharges: 0,
    adjustment: 0,
    total: 0,
    amountPaid: 0,
    balanceDue: 0,
    notes: '',
    termsAndConditions: '',
    attachments: []
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  const accountTypes = [
    'Cost of Goods Sold',
    'Expense',
    'Other Expense',
    'Fixed Asset',
    'Other Asset',
    'Inventory',
    'Raw Materials'
  ];

  const paymentTermsList = [
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60',
    'Due on Receipt',
    'Due End of Month',
    'Due End of Next Month'
  ];

  // Predefined items for dropdown with descriptions
  const [itemsList] = useState([
    { name: 'Raw Materials', description: 'Materials used in production' },
    { name: 'Office Supplies', description: 'Stationery and office essentials' },
    { name: 'Equipment', description: 'Machinery and tools' },
    { name: 'Software License', description: 'Annual software subscription' },
    { name: 'Consulting Services', description: 'Professional consulting hours' },
    { name: 'Marketing Services', description: 'Digital marketing and advertising' },
    { name: 'Maintenance Services', description: 'Equipment maintenance and repairs' },
    { name: 'Transportation', description: 'Shipping and logistics costs' },
    { name: 'Utilities', description: 'Water, electricity, and gas' },
    { name: 'Rent', description: 'Monthly facility rent' }
  ]);

  // Generate Bill Number
  const generateBillNumber = () => {
    const prefix = 'BILL';
    const date = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${date}-${random}`;
  };

  // Show Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Calculate due date based on payment terms
  const calculateDueDate = (billDate, paymentTerms) => {
    const date = new Date(billDate);
    
    switch(paymentTerms) {
      case 'Net 15':
        date.setDate(date.getDate() + 15);
        break;
      case 'Net 30':
        date.setDate(date.getDate() + 30);
        break;
      case 'Net 45':
        date.setDate(date.getDate() + 45);
        break;
      case 'Net 60':
        date.setDate(date.getDate() + 60);
        break;
      case 'Due on Receipt':
        break;
      case 'Due End of Month':
        date.setMonth(date.getMonth() + 1, 0);
        break;
      case 'Due End of Next Month':
        date.setMonth(date.getMonth() + 2, 0);
        break;
      default:
        date.setDate(date.getDate() + 30);
    }
    
    return date.toISOString().split('T')[0];
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.billNumber.trim()) {
      newErrors.billNumber = 'Bill Number is required';
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor Name is required';
    }

    if (!formData.vendorEmail.trim()) {
      newErrors.vendorEmail = 'Vendor Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.vendorEmail)) {
      newErrors.vendorEmail = 'Invalid email format';
    }

    if (!formData.vendorPhone.trim()) {
      newErrors.vendorPhone = 'Vendor Phone is required';
    } else if (!/^\d{10}$/.test(formData.vendorPhone.replace(/[-\s]/g, ''))) {
      newErrors.vendorPhone = 'Phone must be 10 digits';
    }

    if (!formData.vendorAddress.trim()) {
      newErrors.vendorAddress = 'Vendor Address is required';
    }

    if (formData.vendorGSTIN && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.vendorGSTIN)) {
      newErrors.vendorGSTIN = 'Invalid GSTIN format';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due Date is required';
    } else if (new Date(formData.dueDate) < new Date(formData.billDate)) {
      newErrors.dueDate = 'Due date cannot be before bill date';
    }

    if (!formData.billTo.trim()) {
      newErrors.billTo = 'Bill To address is required';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.itemName.trim()) {
        newErrors[`item_${index}_itemName`] = 'Item name is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.rate < 0) {
        newErrors[`item_${index}_rate`] = 'Rate cannot be negative';
      }
      if (item.tax < 0 || item.tax > 100) {
        newErrors[`item_${index}_tax`] = 'Tax must be between 0 and 100';
      }
      if (item.discount < 0 || item.discount > 100) {
        newErrors[`item_${index}_discount`] = 'Discount must be between 0 and 100';
      }
    });

    if (formData.tds < 0 || formData.tds > 100) {
      newErrors.tds = 'TDS must be between 0 and 100';
    }

    if (formData.amountPaid < 0) {
      newErrors.amountPaid = 'Amount paid cannot be negative';
    }

    if (formData.amountPaid > formData.total) {
      newErrors.amountPaid = 'Amount paid cannot exceed total';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate item amount
  const calculateItemAmount = (item) => {
    const baseAmount = item.quantity * item.rate;
    const discountAmount = (baseAmount * item.discount) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;
    const taxAmount = (amountAfterDiscount * item.tax) / 100;
    return amountAfterDiscount + taxAmount;
  };

  // Calculate totals
  const calculateTotals = (items, tds, shippingCharges, adjustment, amountPaid) => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    items.forEach(item => {
      const baseAmount = item.quantity * item.rate;
      subtotal += baseAmount;
      totalDiscount += (baseAmount * item.discount) / 100;
      const amountAfterDiscount = baseAmount - (baseAmount * item.discount) / 100;
      totalTax += (amountAfterDiscount * item.tax) / 100;
    });

    const tdsAmount = (subtotal * tds) / 100;
    const total = subtotal - totalDiscount + totalTax - tdsAmount + parseFloat(shippingCharges || 0) + parseFloat(adjustment || 0);
    const balanceDue = total - parseFloat(amountPaid || 0);

    return { subtotal, totalTax, totalDiscount, total, balanceDue };
  };

  // Handle vendor selection
  const handleVendorChange = (e) => {
    const vendorId = e.target.value;
    
    if (vendorId === '') {
      // Clear vendor fields
      setFormData(prev => ({
        ...prev,
        vendorId: '',
        vendorName: '',
        vendorEmail: '',
        vendorPhone: '',
        vendorAddress: '',
        vendorGSTIN: ''
      }));
    } else {
      const selectedVendor = vendors.find(v => v.id === parseInt(vendorId));
      if (selectedVendor) {
        setFormData(prev => ({
          ...prev,
          vendorId: selectedVendor.id,
          vendorName: selectedVendor.name,
          vendorEmail: selectedVendor.email,
          vendorPhone: selectedVendor.phone,
          vendorAddress: selectedVendor.address,
          vendorGSTIN: selectedVendor.gstin
        }));
        
        // Clear vendor-related errors
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.vendorName;
          delete newErrors.vendorEmail;
          delete newErrors.vendorPhone;
          delete newErrors.vendorAddress;
          delete newErrors.vendorGSTIN;
          return newErrors;
        });
      }
    }
  };

  // Handle item selection from dropdown
  const handleItemSelect = (index, itemName) => {
    const selectedItem = itemsList.find(item => item.name === itemName);
    if (selectedItem) {
      handleItemChange(index, 'itemName', selectedItem.name);
      handleItemChange(index, 'description', selectedItem.description);
    } else {
      handleItemChange(index, 'itemName', itemName);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let updates = { [name]: value };

    // Auto-calculate due date when bill date or payment terms change
    if (name === 'billDate' || name === 'paymentTerms') {
      const billDate = name === 'billDate' ? value : formData.billDate;
      const paymentTerms = name === 'paymentTerms' ? value : formData.paymentTerms;
      updates.dueDate = calculateDueDate(billDate, paymentTerms);
    }

    // Update payment status based on amount paid
    if (name === 'amountPaid') {
      const paid = parseFloat(value) || 0;
      if (paid === 0) {
        updates.paymentStatus = 'Unpaid';
      } else if (paid < formData.total) {
        updates.paymentStatus = 'Partially Paid';
      } else if (paid >= formData.total) {
        updates.paymentStatus = 'Paid';
      }
    }

    setFormData(prev => ({
      ...prev,
      ...updates
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle item change
  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    newItems[index].amount = calculateItemAmount(newItems[index]);

    const totals = calculateTotals(
      newItems, 
      formData.tds, 
      formData.shippingCharges, 
      formData.adjustment, 
      formData.amountPaid
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
          itemName: '',
          description: '',
          accountType: 'Cost of Goods Sold',
          quantity: 1,
          rate: 0,
          tax: 0,
          discount: 0,
          amount: 0
        }
      ]
    }));
  };

  // Remove item
  const removeItem = (index) => {
    if (formData.items.length === 1) {
      showToast('At least one item is required', 'error');
      return;
    }

    const newItems = formData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(
      newItems, 
      formData.tds, 
      formData.shippingCharges, 
      formData.adjustment, 
      formData.amountPaid
    );

    setFormData(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }));
  };

  // Handle charges change
  const handleChargesChange = (field, value) => {
    const newValue = field === 'tds' ? (parseFloat(value) || 0) : parseFloat(value) || 0;
    const newData = { ...formData, [field]: newValue };
    
    const totals = calculateTotals(
      newData.items, 
      newData.tds, 
      newData.shippingCharges, 
      newData.adjustment, 
      newData.amountPaid
    );

    // Update payment status
    let paymentStatus = formData.paymentStatus;
    if (field === 'amountPaid') {
      if (newValue === 0) {
        paymentStatus = 'Unpaid';
      } else if (newValue < totals.total) {
        paymentStatus = 'Partially Paid';
      } else if (newValue >= totals.total) {
        paymentStatus = 'Paid';
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: newValue,
      ...totals,
      paymentStatus
    }));

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Create Bill
  const createBill = () => {
    if (!validateForm()) {
      showToast('Please fix all errors before submitting', 'error');
      return;
    }

    const newBill = {
      ...formData,
      id: Date.now(),
      billNumber: formData.billNumber || generateBillNumber(),
      createdAt: new Date().toISOString()
    };

    setBills(prev => [...prev, newBill]);
    showToast('Bill created successfully!', 'success');
    resetForm();
  };

  // Update Bill
  const updateBill = () => {
    if (!validateForm()) {
      showToast('Please fix all errors before updating', 'error');
      return;
    }

    setBills(prev =>
      prev.map(bill => (bill.id === formData.id ? { ...formData, updatedAt: new Date().toISOString() } : bill))
    );
    showToast('Bill updated successfully!', 'success');
    resetForm();
  };

  // Show delete confirmation
  const showDeleteConfirm = (id) => {
    setDeleteConfirm({ show: true, billId: id });
  };

  // Delete Bill
  const deleteBill = () => {
    setBills(prev => prev.filter(bill => bill.id !== deleteConfirm.billId));
    showToast('Bill deleted successfully!', 'success');
    setDeleteConfirm({ show: false, billId: null });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, billId: null });
  };

  // Edit Bill
  const editBill = (bill) => {
    setFormData(bill);
    setEditMode(true);
    setViewMode(false);
    setShowForm(true);
  };

  // View Bill
  const viewBill = (bill) => {
    setFormData(bill);
    setViewMode(true);
    setEditMode(false);
    setShowForm(true);
  };

  // Reset Form
  const resetForm = () => {
    setFormData(initialFormState);
    setShowForm(false);
    setEditMode(false);
    setViewMode(false);
    setErrors({});
  };

  // New Bill
  const newBill = () => {
    setFormData({
      ...initialFormState,
      billNumber: generateBillNumber(),
      dueDate: calculateDueDate(initialFormState.billDate, initialFormState.paymentTerms)
    });
    setShowForm(true);
    setEditMode(false);
    setViewMode(false);
  };

  // Filter Bills
  const filteredBills = bills.filter(bill =>
    bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bill.paymentStatus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status badge color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Draft': return 'bg-gray-200 text-gray-800';
      case 'Sent': return 'bg-blue-200 text-blue-800';
      case 'Approved': return 'bg-green-200 text-green-800';
      case 'Rejected': return 'bg-red-200 text-red-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch(status) {
      case 'Paid': return 'bg-green-200 text-green-800';
      case 'Partially Paid': return 'bg-yellow-200 text-yellow-800';
      case 'Unpaid': return 'bg-red-200 text-red-800';
      case 'Overdue': return 'bg-red-300 text-red-900';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this bill? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={deleteBill}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">Bills</h1>
          {!showForm && (
            <button
              onClick={newBill}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              New Bill
            </button>
          )}
        </div>
      </div>

      {/* Bill List */}
      {!showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by Bill Number, Vendor, Status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                {filteredBills.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                      No bills found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  filteredBills.map((bill) => (
                    <tr key={bill.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{bill.billNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bill.vendorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.billDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{bill.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bill.status)}`}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(bill.paymentStatus)}`}>
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{bill.total.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ₹{bill.balanceDue.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => viewBill(bill)}
                            className="text-blue-600 hover:text-blue-800"
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => editBill(bill)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => showDeleteConfirm(bill.id)}
                            className="text-red-600 hover:text-red-800"
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

      {/* Bill Form */}
      {showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {viewMode ? 'View' : editMode ? 'Edit' : 'New'} Bill
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
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
                    name="billNumber"
                    value={formData.billNumber}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.billNumber ? 'border-red-500' : 'border-gray-300'
                    } ${viewMode ? 'bg-gray-100' : ''}`}
                  />
                  {errors.billNumber && <p className="text-red-500 text-xs mt-1">{errors.billNumber}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Number
                  </label>
                  <input
                    type="text"
                    name="orderNumber"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    placeholder="Optional"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="billDate"
                    value={formData.billDate}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode ? 'bg-gray-100' : ''
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode ? 'bg-gray-100' : ''
                    }`}
                  >
                    {paymentTermsList.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dueDate ? 'border-red-500' : 'border-gray-300'
                    } ${viewMode ? 'bg-gray-100' : ''}`}
                  />
                  {errors.dueDate && <p className="text-red-500 text-xs mt-1">{errors.dueDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode ? 'bg-gray-100' : ''
                    }`}
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <select
                    name="paymentStatus"
                    value={formData.paymentStatus}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode ? 'bg-gray-100' : ''
                    }`}
                  >
                    <option value="Unpaid">Unpaid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Paid">Paid</option>
                    <option value="Overdue">Overdue</option>
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
                    value={formData.vendorId || ''}
                    onChange={handleVendorChange}
                    disabled={viewMode}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.vendorName ? 'border-red-500' : 'border-gray-300'
                    } ${viewMode ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">-- Select a Vendor --</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {errors.vendorName && <p className="text-red-500 text-xs mt-1">{errors.vendorName}</p>}
                </div>

                {formData.vendorName && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Name
                      </label>
                      <input
                        type="text"
                        value={formData.vendorName}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor Email
                      </label>
                      <input
                        type="email"
                        value={formData.vendorEmail}
                        disabled
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
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vendor GSTIN
                      </label>
                      <input
                        type="text"
                        value={formData.vendorGSTIN}
                        disabled
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
                        disabled
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
                    name="shipTo"
                    value={formData.shipTo}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    rows="3"
                    placeholder="Optional"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.shipTo ? 'border-red-500' : 'border-gray-300'
                    } ${viewMode ? 'bg-gray-100' : ''}`}
                  />
                  {errors.shipTo && <p className="text-red-500 text-xs mt-1">{errors.shipTo}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill To <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="billTo"
                    value={formData.billTo}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    rows="3"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.billTo ? 'border-red-500' : 'border-gray-300'
                    } ${viewMode ? 'bg-gray-100' : ''}`}
                  />
                  {errors.billTo && <p className="text-red-500 text-xs mt-1">{errors.billTo}</p>}
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
                    className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
                  >
                    <Plus size={16} />
                    Add Item
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rate</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax %</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Disc %</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      {!viewMode && <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">
                          <select
                            value={item.itemName}
                            onChange={(e) => handleItemSelect(index, e.target.value)}
                            disabled={viewMode}
                            className={`w-full px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_itemName`] ? 'border-red-500' : 'border-gray-300'
                            } ${viewMode ? 'bg-gray-100' : ''}`}
                          >
                            <option value="">-- Select Item --</option>
                            {itemsList.map((itemOption, idx) => (
                              <option key={idx} value={itemOption.name}>
                                {itemOption.name}
                              </option>
                            ))}
                          </select>
                          {errors[`item_${index}_itemName`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_itemName`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            disabled={viewMode}
                            placeholder="Auto-filled from item selection"
                            className={`w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              viewMode ? 'bg-gray-100' : ''
                            }`}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={item.accountType}
                            onChange={(e) => handleItemChange(index, 'accountType', e.target.value)}
                            disabled={viewMode}
                            className={`w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm ${
                              viewMode ? 'bg-gray-100' : ''
                            }`}
                          >
                            {accountTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            disabled={viewMode}
                            min="1"
                            className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                            } ${viewMode ? 'bg-gray-100' : ''}`}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                            disabled={viewMode}
                            min="0"
                            step="0.01"
                            className={`w-24 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_rate`] ? 'border-red-500' : 'border-gray-300'
                            } ${viewMode ? 'bg-gray-100' : ''}`}
                          />
                          {errors[`item_${index}_rate`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_rate`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.tax}
                            onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                            disabled={viewMode}
                            min="0"
                            max="100"
                            step="0.01"
                            className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_tax`] ? 'border-red-500' : 'border-gray-300'
                            } ${viewMode ? 'bg-gray-100' : ''}`}
                          />
                          {errors[`item_${index}_tax`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_tax`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.discount}
                            onChange={(e) => handleItemChange(index, 'discount', parseFloat(e.target.value) || 0)}
                            disabled={viewMode}
                            min="0"
                            max="100"
                            step="0.01"
                            className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_discount`] ? 'border-red-500' : 'border-gray-300'
                            } ${viewMode ? 'bg-gray-100' : ''}`}
                          />
                          {errors[`item_${index}_discount`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_discount`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          ₹{item.amount.toFixed(2)}
                        </td>
                        {!viewMode && (
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove Item"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
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
                    <span className="font-medium text-red-600">-₹{formData.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Tax:</span>
                    <span className="font-medium">₹{formData.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">TDS (%):</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.tds}
                        onChange={(e) => handleChargesChange('tds', e.target.value)}
                        disabled={viewMode}
                        min="0"
                        max="100"
                        step="0.01"
                        className={`w-20 px-2 py-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                          errors.tds ? 'border-red-500' : 'border-gray-300'
                        } ${viewMode ? 'bg-gray-100' : ''}`}
                      />
                      <span className="font-medium text-red-600">-₹{((formData.subtotal * formData.tds) / 100).toFixed(2)}</span>
                    </div>
                  </div>
                  {errors.tds && <p className="text-red-500 text-xs text-right">{errors.tds}</p>}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping Charges:</span>
                    <input
                      type="number"
                      value={formData.shippingCharges}
                      onChange={(e) => handleChargesChange('shippingCharges', e.target.value)}
                      disabled={viewMode}
                      min="0"
                      step="0.01"
                      className={`w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        viewMode ? 'bg-gray-100' : ''
                      }`}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Adjustment:</span>
                    <input
                      type="number"
                      value={formData.adjustment}
                      onChange={(e) => handleChargesChange('adjustment', e.target.value)}
                      disabled={viewMode}
                      step="0.01"
                      className={`w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        viewMode ? 'bg-gray-100' : ''
                      }`}
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
                      value={formData.amountPaid}
                      onChange={(e) => handleChargesChange('amountPaid', e.target.value)}
                      disabled={viewMode}
                      min="0"
                      step="0.01"
                      className={`w-32 px-2 py-1 border rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        errors.amountPaid ? 'border-red-500' : 'border-gray-300'
                      } ${viewMode ? 'bg-gray-100' : ''}`}
                    />
                  </div>
                  {errors.amountPaid && <p className="text-red-500 text-xs text-right">{errors.amountPaid}</p>}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="text-lg font-bold text-gray-800">Balance Due:</span>
                    <span className="text-lg font-bold text-red-600">₹{formData.balanceDue.toFixed(2)}</span>
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
                    name="termsAndConditions"
                    value={formData.termsAndConditions}
                    onChange={handleInputChange}
                    disabled={viewMode}
                    rows="4"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode ? 'bg-gray-100' : ''
                    }`}
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
                    disabled={viewMode}
                    rows="4"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      viewMode ? 'bg-gray-100' : ''
                    }`}
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
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={editMode ? updateBill : createBill}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  <Save size={20} />
                  {editMode ? 'Update' : 'Save'} Bill
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