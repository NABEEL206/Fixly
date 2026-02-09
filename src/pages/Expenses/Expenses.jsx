import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, Calendar, DollarSign, Tag, Upload, FileText, CreditCard, X, ArrowLeft, CheckCircle, XCircle, Info, AlertCircle, Check, Eye, Grid, List } from 'lucide-react';

const Toast = ({ message, type, onClose }) => {
  const icons = {
    success: <CheckCircle className="text-green-500" size={20} />,
    error: <XCircle className="text-red-500" size={20} />,
    info: <Info className="text-blue-500" size={20} />,
    warning: <AlertCircle className="text-yellow-500" size={20} />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200'
  };

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${bgColors[type]} z-50 animate-slideIn`}>
      {icons[type]}
      <span className="text-sm font-medium text-gray-800">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-gray-400 hover:text-gray-600"
      >
        <X size={18} />
      </button>
    </div>
  );
};

// New View Modal Component
const ViewModal = ({ expense, onClose }) => {
  if (!expense) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-5 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                View Expense Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">Complete expense information</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{expense.title}</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                    {expense.status}
                  </span>
                  <span className="text-sm text-gray-500">ID: {expense.id}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${expense.amount.toFixed(2)}</div>
                <div className="text-sm text-gray-500 mt-1">{expense.date}</div>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Tag size={16} />
                  Category
                </h4>
                <p className="text-gray-900">{expense.category}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Tag size={16} />
                  Merchant
                </h4>
                <p className="text-gray-900">{expense.merchant || 'Not specified'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <CreditCard size={16} />
                  Payment Method
                </h4>
                <p className="text-gray-900">{expense.paymentMethod}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                  <Calendar size={16} />
                  Date
                </h4>
                <p className="text-gray-900">{expense.date}</p>
              </div>
            </div>

            {/* Receipt Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <FileText size={16} />
                Receipt
              </h4>
              {expense.receipt ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-blue-600">
                    <FileText size={20} />
                    <span>{expense.receipt.name}</span>
                  </div>
                  <a
                    href={expense.receipt.data}
                    download={expense.receipt.name}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Download
                  </a>
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-gray-500">No receipt uploaded</p>
                </div>
              )}
            </div>

            {/* Additional Notes (if any) */}
            {expense.notes && (
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Additional Notes</h4>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{expense.notes}</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([
    { 
      id: 1, 
      title: 'Office Printer Supplies',
      date: '2024-01-15', 
      merchant: 'Office Supplies Co', 
      category: 'Office Supplies', 
      amount: 245.50, 
      paymentMethod: 'Credit Card',
      receipt: null,
      status: 'Approved',
      notes: 'Purchased for the main office printer'
    },
    { 
      id: 2, 
      title: 'Development Laptop',
      date: '2024-01-18', 
      merchant: 'Tech Store', 
      category: 'Equipment', 
      amount: 1299.99, 
      paymentMethod: 'Company Card',
      receipt: { name: 'invoice_tech.pdf', data: '#' },
      status: 'Pending',
      notes: 'For new developer hire'
    },
    { 
      id: 3, 
      title: 'Client Meeting Lunch',
      date: '2024-01-20', 
      merchant: 'Coffee Shop', 
      category: 'Meals', 
      amount: 45.30, 
      paymentMethod: 'Cash',
      receipt: null,
      status: 'Approved',
      notes: 'Meeting with ABC Corp clients'
    },
  ]);

  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [categories, setCategories] = useState(['Office Supplies', 'Equipment', 'Meals', 'Travel', 'Accommodation', 'Software', 'Other']);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    merchant: '',
    category: '',
    amount: '',
    paymentMethod: '',
    receipt: null,
    status: 'Pending',
    notes: ''
  });
  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'

  const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Company Card', 'Bank Transfer', 'Check', 'PayPal', 'Other'];
  const statuses = ['Pending', 'Approved', 'Rejected'];

  // Check if mobile view
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const addToast = (message, type) => {
    const id = Date.now();
    const newToast = { id, message, type };
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Handle expense selection
  const handleSelectExpense = (id) => {
    setSelectedExpenses(prev =>
      prev.includes(id)
        ? prev.filter(expId => expId !== id)
        : [...prev, id]
    );
  };

  // Select all expenses
  const handleSelectAll = () => {
    if (isSelectAll) {
      setSelectedExpenses([]);
    } else {
      const allIds = filteredExpenses.map(exp => exp.id);
      setSelectedExpenses(allIds);
    }
    setIsSelectAll(!isSelectAll);
  };

  // Bulk delete selected expenses
  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0) {
      addToast('Please select expenses to delete', 'warning');
      return;
    }

    const expenseNames = expenses
      .filter(exp => selectedExpenses.includes(exp.id))
      .map(exp => exp.title);

    if (window.confirm(`Are you sure you want to delete ${selectedExpenses.length} expense(s)?\n\n${expenseNames.join('\n')}`)) {
      setExpenses(prev => prev.filter(exp => !selectedExpenses.includes(exp.id)));
      addToast(`Deleted ${selectedExpenses.length} expense(s) successfully`, 'success');
      setSelectedExpenses([]);
      setIsSelectAll(false);
    } else {
      addToast('Bulk delete cancelled', 'info');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be a positive number';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      addToast('Please fill in all required fields correctly', 'error');
      return false;
    }
    
    return true;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        addToast('File size should be less than 5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({...formData, receipt: { name: file.name, data: reader.result }});
        addToast('Receipt uploaded successfully', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (editingExpense) {
      setExpenses(expenses.map(exp => 
        exp.id === editingExpense.id 
          ? { ...formData, id: editingExpense.id, amount: parseFloat(formData.amount) }
          : exp
      ));
      addToast(`Expense "${formData.title}" updated successfully`, 'success');
    } else {
      const newExpense = { 
        ...formData, 
        id: Date.now(), 
        amount: parseFloat(formData.amount) 
      };
      setExpenses([...expenses, newExpense]);
      addToast(`Expense "${formData.title}" added successfully`, 'success');
    }
    resetForm();
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      if (!categories.includes(newCategoryName.trim())) {
        setCategories([...categories, newCategoryName.trim()]);
        setFormData({...formData, category: newCategoryName.trim()});
        setNewCategoryName('');
        setShowNewCategory(false);
        setErrors({...errors, category: ''});
        addToast(`Category "${newCategoryName.trim()}" added successfully`, 'success');
      } else {
        addToast('This category already exists', 'warning');
      }
    } else {
      addToast('Category name cannot be empty', 'error');
    }
  };

  const handleView = (expense) => {
    setViewingExpense(expense);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      date: expense.date,
      merchant: expense.merchant,
      category: expense.category,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      receipt: expense.receipt,
      status: expense.status,
      notes: expense.notes || ''
    });
    setErrors({});
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const expenseToDelete = expenses.find(exp => exp.id === id);
    
    if (window.confirm(`Are you sure you want to delete "${expenseToDelete.title}"?`)) {
      setExpenses(expenses.filter(exp => exp.id !== id));
      addToast(`Expense "${expenseToDelete.title}" deleted successfully`, 'success');
    } else {
      addToast('Deletion cancelled', 'info');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      merchant: '',
      category: '',
      amount: '',
      paymentMethod: '',
      receipt: null,
      status: 'Pending',
      notes: ''
    });
    setEditingExpense(null);
    setShowModal(false);
    setViewingExpense(null);
    setShowNewCategory(false);
    setNewCategoryName('');
    setErrors({});
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'All' || expense.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const approvedTotal = filteredExpenses.filter(e => e.status === 'Approved').reduce((sum, exp) => sum + exp.amount, 0);
  const pendingTotal = filteredExpenses.filter(e => e.status === 'Pending').reduce((sum, exp) => sum + exp.amount, 0);

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Render table row with view option
  const renderTableRow = (expense) => (
    <tr key={expense.id} className="hover:bg-gray-50 border-b border-gray-200">
      <td className="px-4 py-4 text-center">
        <input
          type="checkbox"
          checked={selectedExpenses.includes(expense.id)}
          onChange={() => handleSelectExpense(expense.id)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      <td className="px-4 py-4 text-sm font-medium text-gray-900 min-w-[180px]">
        <div className="line-clamp-2">{expense.title}</div>
      </td>

      <td className="px-4 py-4 text-sm text-gray-600 text-center whitespace-nowrap">
        {expense.date}
      </td>

      <td className="px-4 py-4 text-sm text-gray-600 text-center min-w-[140px]">
        <div className="line-clamp-2">{expense.merchant || "—"}</div>
      </td>

      <td className="px-4 py-4 text-sm text-gray-600 text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          <Tag size={14} className="text-gray-400" />
          <span>{expense.category}</span>
        </div>
      </td>

      <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-center whitespace-nowrap">
        ${expense.amount.toFixed(2)}
      </td>

      <td className="px-4 py-4 text-sm text-gray-600 text-center whitespace-nowrap">
        <div className="inline-flex items-center gap-1">
          <CreditCard size={14} className="text-gray-400" />
          <span>{expense.paymentMethod}</span>
        </div>
      </td>

      <td className="px-4 py-4 text-sm text-center whitespace-nowrap">
        {expense.receipt ? (
          <a
            href={expense.receipt.data}
            download={expense.receipt.name}
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
          >
            <FileText size={14} />
            View
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>

      <td className="px-4 py-4 text-center whitespace-nowrap">
        <span
          className={`px-3 py-1 text-xs rounded-full font-semibold ${getStatusColor(
            expense.status
          )}`}
        >
          {expense.status}
        </span>
      </td>

      <td className="px-4 py-4 text-center whitespace-nowrap">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => handleView(expense)}
            className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="View details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => handleEdit(expense)}
            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            title="Edit expense"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(expense.id)}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            title="Delete expense"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  // Render card view
  const renderCardView = (expense) => (
    <div key={expense.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4">
        {/* Card Header with Checkbox */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedExpenses.includes(expense.id)}
              onChange={() => handleSelectExpense(expense.id)}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <h3 className="font-medium text-gray-900">{expense.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                  {expense.status}
                </span>
                <span className="text-xs text-gray-500">{expense.date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expense Details */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Merchant</p>
            <p className="text-sm font-medium text-gray-900">{expense.merchant || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Category</p>
            <div className="flex items-center gap-1">
              <Tag size={14} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{expense.category}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment</p>
            <div className="flex items-center gap-1">
              <CreditCard size={14} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{expense.paymentMethod}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Receipt</p>
            {expense.receipt ? (
              <a 
                href={expense.receipt.data} 
                download={expense.receipt.name}
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <FileText size={14} />
                View
              </a>
            ) : (
              <p className="text-sm text-gray-400">No receipt</p>
            )}
          </div>
        </div>

        {/* Amount and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${expense.amount.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleView(expense)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="View details"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => handleEdit(expense)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit expense"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(expense.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete expense"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Toast Container */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* View Modal */}
      {viewingExpense && (
        <ViewModal
          expense={viewingExpense}
          onClose={() => setViewingExpense(null)}
        />
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Expense Tracker</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track your business expenses</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors w-full md:w-auto"
              >
                <Plus size={20} />
                <span>New Expense</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <DollarSign size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Expenses</p>
                  <p className="text-2xl font-bold text-gray-900">${totalExpenses.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <div className="bg-green-600 p-3 rounded-lg">
                  <DollarSign size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">${approvedTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-600 p-3 rounded-lg">
                  <DollarSign size={24} className="text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">${pendingTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedExpenses.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Check className="text-blue-600" size={20} />
                <span className="text-sm font-medium text-gray-900">
                  {selectedExpenses.length} expense(s) selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {isSelectAll ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 size={18} />
                  Delete Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters and View Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title, merchant, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All">All Status</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            {/* View Mode Toggle */}
            {!isMobile && (
              <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'table' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Table view"
                >
                  <List size={20} />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'card' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Card view"
                >
                  <Grid size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Select All Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelectAll}
              onChange={handleSelectAll}
              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              {isSelectAll ? 'All expenses selected' : 'Select all expenses'}
            </span>
          </div>
          <span className="text-sm text-gray-500">
            {filteredExpenses.length} expense(s) found
          </span>
        </div>

        {/* Content Area */}
        {isMobile ? (
          /* Mobile always uses card view */
          <div className="space-y-4">
            {filteredExpenses.map(renderCardView)}
            
            {filteredExpenses.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Search className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No expenses found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Desktop Table View with Scroll */
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-16 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                      <input
                        type="checkbox"
                        checked={isSelectAll}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-left min-w-[180px]">
                      Title
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center min-w-[140px]">
                      Merchant
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Category
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Payment
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Receipt
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredExpenses.map(renderTableRow)}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                <Search className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No expenses found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Card View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredExpenses.map(renderCardView)}
            
            {filteredExpenses.length === 0 && (
              <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Search className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No expenses found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-5 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                  </h2>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <FileText size={14} className="inline mr-1" />
                    Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Office Printer Supplies"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({...formData, title: e.target.value});
                      if (errors.title) setErrors({...errors, title: ''});
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Merchant */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Tag size={14} className="inline mr-1" />
                    Merchant
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Starbucks, Amazon (Optional)"
                    value={formData.merchant}
                    onChange={(e) => {
                      setFormData({...formData, merchant: e.target.value});
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <DollarSign size={14} className="inline mr-1" />
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => {
                      setFormData({...formData, amount: e.target.value});
                      if (errors.amount) setErrors({...errors, amount: ''});
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.amount ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.amount && (
                    <p className="mt-1 text-xs text-red-600">{errors.amount}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowNewCategory(true);
                        setFormData({...formData, category: ''});
                        if (errors.category) setErrors({...errors, category: ''});
                      } else {
                        setFormData({...formData, category: e.target.value});
                        if (errors.category) setErrors({...errors, category: ''});
                      }
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__" className="text-blue-600 font-medium">+ Add New Category</option>
                  </select>
                  {errors.category && !showNewCategory && (
                    <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                  )}
                  
                  {showNewCategory && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="New category"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleAddCategory}
                        className="px-2 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowNewCategory(false);
                          setNewCategoryName('');
                        }}
                        className="px-2 py-1.5 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  {showNewCategory && errors.category && (
                    <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Calendar size={14} className="inline mr-1" />
                    Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => {
                      setFormData({...formData, date: e.target.value});
                      if (errors.date) setErrors({...errors, date: ''});
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.date && (
                    <p className="mt-1 text-xs text-red-600">{errors.date}</p>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <CreditCard size={14} className="inline mr-1" />
                    Payment Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => {
                      setFormData({...formData, paymentMethod: e.target.value});
                      if (errors.paymentMethod) setErrors({...errors, paymentMethod: ''});
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.paymentMethod ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                  {errors.paymentMethod && (
                    <p className="mt-1 text-xs text-red-600">{errors.paymentMethod}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    placeholder="Add any additional notes about this expense..."
                    rows="3"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Upload Receipt */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Upload size={14} className="inline mr-1" />
                    Upload Receipt
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className={`border-2 border-dashed rounded-lg p-2.5 text-center hover:border-blue-500 transition-colors ${
                        formData.receipt ? 'border-blue-300 bg-blue-50' : 'border-gray-300'
                      }`}>
                        <Upload size={18} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-600 truncate px-2">
                          {formData.receipt ? formData.receipt.name : 'Click to upload'}
                        </p>
                        <p className="text-xs text-gray-400">Max 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    {formData.receipt && (
                      <button
                        onClick={() => {
                          setFormData({...formData, receipt: null});
                          addToast('Receipt removed', 'info');
                        }}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {statuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-200">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for toast animation and line clamp */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(-20px) translateX(-50%);
            opacity: 0;
          }
          to {
            transform: translateY(0) translateX(-50%);
            opacity: 1;
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default ExpenseTracker;