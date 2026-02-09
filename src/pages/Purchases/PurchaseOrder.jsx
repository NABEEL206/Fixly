import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Edit, Eye, Search, Building, Package } from 'lucide-react';

const PurchaseOrder = () => {
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, poId: null });

  // Sample vendors data
  const vendors = [
    {
      id: 1,
      name: 'Tech Solutions Inc.',
      email: 'contact@techsolutions.com',
      phone: '5551234567',
      address: '123 Tech Street, San Francisco, CA'
    },
    {
      id: 2,
      name: 'Global Supplies Ltd.',
      email: 'info@globalsupplies.com',
      phone: '5559876543',
      address: '456 Business Ave, New York, NY'
    },
    {
      id: 3,
      name: 'Logistics Pro',
      email: 'support@logisticspro.com',
      phone: '5554567890',
      address: '789 Logistics Blvd, Chicago, IL'
    },
    {
      id: 4,
      name: 'Office Essentials Co.',
      email: 'orders@officeessentials.com',
      phone: '5553216547',
      address: '321 Office Park, Boston, MA'
    }
  ];

  // Sample items catalog with detailed descriptions
  const itemsCatalog = [
    { id: 1, name: 'Laptop Dell XPS 15', description: 'High-performance laptop with Intel i7 processor', unitPrice: 95000 },
    { id: 2, name: 'Office Chair Ergonomic', description: 'Comfortable office chair with lumbar support', unitPrice: 18000 },
    { id: 3, name: 'Desk Standing Adjustable', description: 'Height adjustable standing desk', unitPrice: 45000 },
    { id: 4, name: 'Monitor 27" 4K', description: '4K Ultra HD monitor with HDR support', unitPrice: 30000 },
    { id: 5, name: 'Keyboard Mechanical', description: 'RGB mechanical keyboard with Cherry MX switches', unitPrice: 11000 },
    { id: 6, name: 'Mouse Wireless', description: 'Ergonomic wireless mouse with precision tracking', unitPrice: 3500 },
    { id: 7, name: 'Printer Laser Color', description: 'Color laser printer with duplex printing', unitPrice: 60000 },
    { id: 8, name: 'Router WiFi 6', description: 'High-speed WiFi 6 router with mesh support', unitPrice: 15000 },
    { id: 9, name: 'Headset Noise Cancelling', description: 'Wireless noise cancelling headset with mic', unitPrice: 22000 },
    { id: 10, name: 'Webcam HD 1080p', description: 'Full HD 1080p webcam with auto-focus', unitPrice: 6500 },
    { id: 11, name: 'USB Hub 7-Port', description: '7-port USB 3.0 hub with power adapter', unitPrice: 2800 },
    { id: 12, name: 'Cable Management Kit', description: 'Complete cable organizer and management kit', unitPrice: 1800 },
    { id: 13, name: 'Surge Protector', description: '12-outlet surge protector with USB ports', unitPrice: 2500 },
    { id: 14, name: 'Desk Lamp LED', description: 'Adjustable LED desk lamp with touch control', unitPrice: 4500 },
    { id: 15, name: 'Whiteboard 4x6', description: 'Magnetic whiteboard with marker tray', unitPrice: 9500 }
  ];

  const initialFormState = {
    id: null,
    poNumber: '',
    vendorId: '',
    vendorName: '',
    vendorEmail: '',
    vendorPhone: '',
    vendorAddress: '',
    poDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    shipTo: '',
    billTo: '',
    status: 'Draft',
    items: [
      {
        itemId: '',
        itemName: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        tax: 0,
        discount: 0,
        amount: 0
      }
    ],
    subtotal: 0,
    totalTax: 0,
    totalDiscount: 0,
    shippingCharges: 0,
    adjustment: 0,
    grandTotal: 0,
    terms: '',
    notes: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  // Generate PO Number
  const generatePONumber = () => {
    const prefix = 'PO';
    const date = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${date}-${random}`;
  };

  // Show Toast Notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  // Handle vendor selection
  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find(v => v.id === parseInt(vendorId));
    if (vendor) {
      setFormData(prev => ({
        ...prev,
        vendorId: vendor.id,
        vendorName: vendor.name,
        vendorEmail: vendor.email,
        vendorPhone: vendor.phone,
        vendorAddress: vendor.address
      }));
      if (errors.vendorName) {
        setErrors(prev => ({ ...prev, vendorName: '' }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        vendorId: '',
        vendorName: '',
        vendorEmail: '',
        vendorPhone: '',
        vendorAddress: ''
      }));
    }
  };

  // Handle item selection from catalog
  const handleItemSelection = (index, itemId) => {
    const item = itemsCatalog.find(i => i.id === parseInt(itemId));
    if (item) {
      handleItemChange(index, 'itemId', item.id);
      handleItemChange(index, 'itemName', item.name);
      handleItemChange(index, 'description', item.description);
      handleItemChange(index, 'unitPrice', item.unitPrice);
    } else {
      handleItemChange(index, 'itemId', '');
      handleItemChange(index, 'itemName', '');
      handleItemChange(index, 'description', '');
      handleItemChange(index, 'unitPrice', 0);
    }
  };

  // Validate Form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.poNumber.trim()) {
      newErrors.poNumber = 'PO Number is required';
    }

    if (!formData.vendorName.trim()) {
      newErrors.vendorName = 'Vendor selection is required';
    }

    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected Delivery Date is required';
    } else if (new Date(formData.expectedDeliveryDate) <= new Date(formData.poDate)) {
      newErrors.expectedDeliveryDate = 'Delivery date must be after PO date';
    }

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.itemName.trim()) {
        newErrors[`item_${index}_itemName`] = 'Item selection is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantity must be greater than 0';
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${index}_unitPrice`] = 'Unit price must be greater than 0';
      }
      if (item.tax < 0 || item.tax > 100) {
        newErrors[`item_${index}_tax`] = 'Tax must be between 0 and 100';
      }
      if (item.discount < 0 || item.discount > 100) {
        newErrors[`item_${index}_discount`] = 'Discount must be between 0 and 100';
      }
    });

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

    items.forEach(item => {
      const baseAmount = item.quantity * item.unitPrice;
      subtotal += baseAmount;
      totalDiscount += (baseAmount * item.discount) / 100;
      const amountAfterDiscount = baseAmount - (baseAmount * item.discount) / 100;
      totalTax += (amountAfterDiscount * item.tax) / 100;
    });

    const grandTotal = subtotal - totalDiscount + totalTax + parseFloat(shippingCharges || 0) + parseFloat(adjustment || 0);

    return { subtotal, totalTax, totalDiscount, grandTotal };
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

    const totals = calculateTotals(newItems, formData.shippingCharges, formData.adjustment);

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
          itemId: '',
          itemName: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
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
    const totals = calculateTotals(newItems, formData.shippingCharges, formData.adjustment);

    setFormData(prev => ({
      ...prev,
      items: newItems,
      ...totals
    }));
  };

  // Handle charges change
  const handleChargesChange = (field, value) => {
    const newValue = parseFloat(value) || 0;
    const newData = { ...formData, [field]: newValue };
    const totals = calculateTotals(newData.items, newData.shippingCharges, newData.adjustment);

    setFormData(prev => ({
      ...prev,
      [field]: newValue,
      ...totals
    }));
  };

  // Create Purchase Order
  const createPO = () => {
    if (!validateForm()) {
      showToast('Please fix all errors before submitting', 'error');
      return;
    }

    const newPO = {
      ...formData,
      id: Date.now(),
      poNumber: formData.poNumber || generatePONumber(),
      createdAt: new Date().toISOString()
    };

    setPurchaseOrders(prev => [...prev, newPO]);
    showToast('Purchase Order created successfully!', 'success');
    resetForm();
  };

  // Update Purchase Order
  const updatePO = () => {
    if (!validateForm()) {
      showToast('Please fix all errors before updating', 'error');
      return;
    }

    setPurchaseOrders(prev =>
      prev.map(po => (po.id === formData.id ? { ...formData, updatedAt: new Date().toISOString() } : po))
    );
    showToast('Purchase Order updated successfully!', 'success');
    resetForm();
  };

  // Show delete confirmation
  const showDeleteConfirm = (id) => {
    setDeleteConfirm({ show: true, poId: id });
  };

  // Delete Purchase Order
  const deletePO = () => {
    setPurchaseOrders(prev => prev.filter(po => po.id !== deleteConfirm.poId));
    showToast('Purchase Order deleted successfully!', 'success');
    setDeleteConfirm({ show: false, poId: null });
  };

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm({ show: false, poId: null });
  };

  // Edit Purchase Order
  const editPO = (po) => {
    setFormData(po);
    setEditMode(true);
    setViewMode(false);
    setShowForm(true);
  };

  // View Purchase Order
  const viewPO = (po) => {
    setFormData(po);
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

  // New PO
  const newPO = () => {
    setFormData({
      ...initialFormState,
      poNumber: generatePONumber()
    });
    setShowForm(true);
    setEditMode(false);
    setViewMode(false);
  };

  // Filter POs
  const filteredPOs = purchaseOrders.filter(po =>
    po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    po.status.toLowerCase().includes(searchTerm.toLowerCase())
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

        {/* Modal Body */}
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
            </div>
            <span className={`px-3 py-1 text-sm rounded-full font-medium ${
              formData.status === 'Draft' ? 'bg-gray-200 text-gray-800' :
              formData.status === 'Sent' ? 'bg-blue-200 text-blue-800' :
              formData.status === 'Approved' ? 'bg-green-200 text-green-800' :
              'bg-yellow-200 text-yellow-800'
            }`}>
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
                  <p className="text-xs font-medium text-gray-500 mb-1">Vendor Name</p>
                  <p className="text-sm text-gray-900 font-medium">{formData.vendorName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Email</p>
                  <p className="text-sm text-gray-900">{formData.vendorEmail}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Phone</p>
                  <p className="text-sm text-gray-900">{formData.vendorPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Address</p>
                  <p className="text-sm text-gray-900">{formData.vendorAddress}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping & Billing - Only show if data exists */}
          {(formData.shipTo || formData.billTo) && (
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                Shipping & Billing
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.shipTo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Ship To</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.shipTo}</p>
                  </div>
                )}
                {formData.billTo && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Bill To</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.billTo}</p>
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
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tax %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount %</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.itemName}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">₹{item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.tax}%</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.discount}%</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">₹{item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
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
                  <span className="font-medium">₹{formData.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Discount:</span>
                  <span className="font-medium text-red-600">-₹{formData.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Tax:</span>
                  <span className="font-medium">₹{formData.totalTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="font-medium">₹{formData.shippingCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Adjustment:</span>
                  <span className="font-medium">₹{formData.adjustment.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                  <span className="text-base font-bold text-gray-800">Grand Total:</span>
                  <span className="text-base font-bold text-blue-600">₹{formData.grandTotal.toFixed(2)}</span>
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
                    <p className="text-xs font-medium text-gray-500 mb-2">Terms & Conditions</p>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{formData.terms}</p>
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
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white ${
          toast.type === 'success' ? 'bg-green-500' : 
          toast.type === 'error' ? 'bg-red-500' : 
          'bg-yellow-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this purchase order? This action cannot be undone.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={deletePO}
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
          <h1 className="text-3xl font-bold text-gray-800">Purchase Orders</h1>
          {!showForm && (
            <button
              onClick={newPO}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              New Purchase Order
            </button>
          )}
        </div>
      </div>

      {/* PO List */}
      {!showForm && (
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by PO Number, Vendor, or Status..."
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPOs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                      No purchase orders found. Create your first one!
                    </td>
                  </tr>
                ) : (
                  filteredPOs.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">{po.poNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{po.vendorName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.poDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.expectedDeliveryDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          po.status === 'Draft' ? 'bg-gray-200 text-gray-800' :
                          po.status === 'Sent' ? 'bg-blue-200 text-blue-800' :
                          po.status === 'Approved' ? 'bg-green-200 text-green-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{po.grandTotal.toFixed(2)}
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
                            onClick={() => showDeleteConfirm(po.id)}
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
              {editMode ? 'Edit' : 'New'} Purchase Order
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
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
                    <span className="font-medium">Required:</span> PO Number, Vendor, Delivery Date, Items (with Qty & Unit Price)
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <span className="font-medium">Optional:</span> Shipping/Billing Addresses, Tax, Discount, Terms, Notes
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.poNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.poNumber && <p className="text-red-500 text-xs mt-1">{errors.poNumber}</p>}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Delivery Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expectedDeliveryDate"
                    value={formData.expectedDeliveryDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expectedDeliveryDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.expectedDeliveryDate && <p className="text-red-500 text-xs mt-1">{errors.expectedDeliveryDate}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Approved">Approved</option>
                    <option value="Pending">Pending</option>
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.vendorName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name}
                      </option>
                    ))}
                  </select>
                  {errors.vendorName && <p className="text-red-500 text-xs mt-1">{errors.vendorName}</p>}
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
              <h3 className="text-lg font-semibold mb-4">Shipping & Billing <span className="text-sm text-gray-500 font-normal">(Optional)</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ship To Address
                  </label>
                  <textarea
                    name="shipTo"
                    value={formData.shipTo}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter shipping address..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bill To Address
                  </label>
                  <textarea
                    name="billTo"
                    value={formData.billTo}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter billing address..."
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
                  className="flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition text-sm"
                >
                  <Plus size={16} />
                  Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unit Price <span className="text-red-500">*</span></th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tax %</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Discount %</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="px-3 py-2">
                          <select
                            value={item.itemId}
                            onChange={(e) => handleItemSelection(index, e.target.value)}
                            className={`w-full min-w-[200px] px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_itemName`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          >
                            <option value="">-- Select Item --</option>
                            {itemsCatalog.map(catalogItem => (
                              <option key={catalogItem.id} value={catalogItem.id}>
                                {catalogItem.name}
                              </option>
                            ))}
                          </select>
                          {item.itemName && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                          {errors[`item_${index}_itemName`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_itemName`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="1"
                            className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_quantity`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`item_${index}_quantity`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_quantity`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={`w-28 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_unitPrice`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`item_${index}_unitPrice`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_unitPrice`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.tax}
                            onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_tax`] ? 'border-red-500' : 'border-gray-300'
                            }`}
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
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="0"
                            className={`w-20 px-2 py-1 border rounded focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                              errors[`item_${index}_discount`] ? 'border-red-500' : 'border-gray-300'
                            }`}
                          />
                          {errors[`item_${index}_discount`] && (
                            <p className="text-red-500 text-xs mt-1">{errors[`item_${index}_discount`]}</p>
                          )}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          ₹{item.amount.toFixed(2)}
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded transition-colors"
                            title="Remove Item"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
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
                    <span className="text-gray-600">Shipping Charges:</span>
                    <input
                      type="number"
                      value={formData.shippingCharges}
                      onChange={(e) => handleChargesChange('shippingCharges', e.target.value)}
                      min="0"
                      step="0.01"
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Adjustment:</span>
                    <input
                      type="number"
                      value={formData.adjustment}
                      onChange={(e) => handleChargesChange('adjustment', e.target.value)}
                      step="0.01"
                      className="w-32 px-2 py-1 border border-gray-300 rounded text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t-2 border-gray-300">
                    <span className="text-lg font-bold text-gray-800">Grand Total:</span>
                    <span className="text-lg font-bold text-blue-600">₹{formData.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms & Notes - Optional */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-4">Additional Information <span className="text-sm text-gray-500 font-normal">(Optional)</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms & Conditions
                  </label>
                  <textarea
                    name="terms"
                    value={formData.terms}
                    onChange={handleInputChange}
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
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={editMode ? updatePO : createPO}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <Save size={20} />
                {editMode ? 'Update' : 'Save'} Purchase Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrder;