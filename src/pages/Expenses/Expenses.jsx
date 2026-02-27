// src/pages/Expenses/Expenses.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, Calendar, DollarSign, Tag, FileText, CreditCard, X, ArrowLeft, CheckCircle, XCircle, Info, AlertCircle, Check, Eye, User } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from "@/API/axiosInstance";

// View Modal Component
const ViewModal = ({ expense, onClose }) => {
  if (!expense) return null;

  const getStatusColor = (status) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format amount in Indian Rupees
  const formatRupees = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-blue-700">Expense Details - ID: {expense.id}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-600 text-lg">✖</button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Expense Information</h3>
              <div>
                <label className="block text-sm font-medium text-gray-600">Title</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg">{expense.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Merchant</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg">{expense.merchant || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Amount</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg font-semibold">{formatRupees(expense.amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Date</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg">{expense.date}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Category & Status</h3>
              <div>
                <label className="block text-sm font-medium text-gray-600">Category</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg">{expense.category?.name || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Status</label>
                <span className={`mt-1 px-3 py-1 rounded-full text-xs font-semibold inline-block ${getStatusColor(expense.status)}`}>
                  {expense.status}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Payment Method</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg">{expense.payment_method}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Created By</label>
                <p className="mt-1 p-2 bg-gray-50 rounded-lg">{expense.created_by || 'admin'}</p>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">System Information</h3>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <label className="block text-sm font-medium text-gray-600">Created At</label>
                  <p className="mt-1 text-sm">{expense.created_at ? new Date(expense.created_at).toLocaleString() : 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600">Updated At</label>
                  <p className="mt-1 text-sm">{expense.updated_at ? new Date(expense.updated_at).toLocaleString() : 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [viewingExpense, setViewingExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCreatedBy, setFilterCreatedBy] = useState('All');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    merchant: '',
    category_id: '',
    amount: '',
    payment_method: 'CASH',
    status: 'PENDING',
    receipt: null
  });
  const [errors, setErrors] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CREDIT_CARD', label: 'Credit Card' },
    { value: 'DEBIT_CARD', label: 'Debit Card' },
    { value: 'COMPANY_CARD', label: 'Company Card' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'CHECK', label: 'Check' },
    { value: 'PAYPAL', label: 'PayPal' },
    { value: 'OTHER', label: 'Other' }
  ];
  
  const statuses = ['PENDING', 'APPROVED', 'REJECTED'];

  // Fetch expenses from API
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/expenses/');
      setExpenses(response.data);
    } catch (error) {
      console.error("Fetch expenses error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view expenses");
      } else {
        toast.error(error.response?.data?.detail || "Failed to fetch expenses");
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories from API
  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get('/api/expense-categories/');
      setCategories(response.data);
    } catch (error) {
      console.error("Fetch categories error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to view categories");
      } else {
        toast.error(error.response?.data?.detail || "Failed to fetch categories");
      }
    }
  };

  // Add new category
  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    try {
      const response = await axiosInstance.post('/api/expense-categories/', {
        name: newCategoryName.trim(),
        is_active: true
      });

      const newCategory = response.data;
      setCategories([...categories, newCategory]);
      setFormData({...formData, category_id: newCategory.id});
      setNewCategoryName('');
      setShowNewCategory(false);
      setErrors({...errors, category_id: ''});
      toast.success(`Category "${newCategory.name}" added successfully`);
    } catch (error) {
      console.error("Add category error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to add categories");
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.name?.[0] || 'Failed to add category');
      } else {
        toast.error(error.response?.data?.detail || 'Failed to add category');
      }
    }
  };

  // Add expense
  const addExpense = async () => {
    const toastId = toast.loading('Adding expense...');
    
    try {
      const expenseData = {
        category_id: parseInt(formData.category_id),
        title: formData.title,
        merchant: formData.merchant || '',
        amount: parseFloat(formData.amount).toFixed(2),
        date: formData.date,
        payment_method: formData.payment_method,
        status: formData.status,
        receipt: null
      };

      const response = await axiosInstance.post('/api/expenses/', expenseData);
      
      const newExpense = response.data;
      // Fetch the complete expense with category details
      const completeExpense = {
        ...newExpense,
        category: categories.find(c => c.id === parseInt(formData.category_id))
      };
      setExpenses([completeExpense, ...expenses]);
      toast.success(`Expense "${formData.title}" added successfully`, { id: toastId });
      resetForm();
    } catch (error) {
      console.error("Add expense error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.", { id: toastId });
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to add expenses", { id: toastId });
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessages = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        toast.error(errorMessages || 'Failed to add expense', { id: toastId });
      } else {
        toast.error(error.response?.data?.detail || 'Failed to add expense', { id: toastId });
      }
    }
  };

  // Update expense
  const updateExpense = async () => {
    const toastId = toast.loading('Updating expense...');
    
    try {
      const expenseData = {
        category_id: parseInt(formData.category_id),
        title: formData.title,
        merchant: formData.merchant || '',
        amount: parseFloat(formData.amount).toFixed(2),
        date: formData.date,
        payment_method: formData.payment_method,
        status: formData.status,
        receipt: null
      };

      const response = await axiosInstance.put(`/api/expenses/${editingExpense.id}/`, expenseData);
      
      const updatedExpense = response.data;
      // Fetch the complete expense with category details
      const completeExpense = {
        ...updatedExpense,
        category: categories.find(c => c.id === parseInt(formData.category_id))
      };
      setExpenses(expenses.map(exp => 
        exp.id === editingExpense.id ? completeExpense : exp
      ));
      toast.success(`Expense "${formData.title}" updated successfully`, { id: toastId });
      resetForm();
    } catch (error) {
      console.error("Update expense error:", error);
      
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.", { id: toastId });
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to edit this expense", { id: toastId });
      } else if (error.response?.status === 404) {
        toast.error("Expense not found. It may have been deleted.", { id: toastId });
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        const errorMessages = Object.entries(errorData)
          .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
          .join('\n');
        toast.error(errorMessages || 'Failed to update expense', { id: toastId });
      } else {
        toast.error(error.response?.data?.detail || 'Failed to update expense', { id: toastId });
      }
    }
  };

  // Delete expense
  const handleDelete = (id) => {
    const expenseToDelete = expenses.find(exp => exp.id === id);
    
    toast.dismiss();
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete expense "{expenseToDelete?.title}"?</p>
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
                const dt = toast.loading(`Deleting expense...`);
                
                try {
                  await axiosInstance.delete(`/api/expenses/${id}/`);
                  
                  setExpenses(expenses.filter(exp => exp.id !== id));
                  setSelectedExpenses(prev => prev.filter(expId => expId !== id));
                  toast.success(`Expense "${expenseToDelete?.title}" deleted successfully`, { id: dt });
                } catch (error) {
                  console.error("Delete expense error:", error);
                  
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.", { id: dt });
                  } else if (error.response?.status === 403) {
                    toast.error("You don't have permission to delete this expense", { id: dt });
                  } else {
                    toast.error(error.response?.data?.detail || 'Failed to delete expense', { id: dt });
                  }
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // Bulk delete expenses
  const handleBulkDelete = () => {
    if (selectedExpenses.length === 0) {
      toast.error('Please select expenses to delete');
      return;
    }

    const expenseNames = expenses
      .filter(exp => selectedExpenses.includes(exp.id))
      .map(exp => exp.title)
      .join('\n');

    toast.dismiss();
    toast(
      (t) => (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete {selectedExpenses.length} expense(s)?</p>
          <p className="text-xs text-gray-500 bg-gray-50 p-2 rounded max-h-32 overflow-y-auto whitespace-pre-line">
            {expenseNames}
          </p>
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
                const dt = toast.loading(`Deleting ${selectedExpenses.length} expenses...`);
                
                try {
                  const results = await Promise.all(
                    selectedExpenses.map(async (id) => {
                      try {
                        await axiosInstance.delete(`/api/expenses/${id}/`);
                        return { id, ok: true };
                      } catch (error) {
                        return { id, ok: false, status: error.response?.status || 0 };
                      }
                    })
                  );

                  const deleted = results.filter((r) => r.ok).map((r) => r.id);
                  const forbidden = results.filter((r) => r.status === 403).map((r) => r.id);
                  const notFound = results.filter((r) => r.status === 404).map((r) => r.id);

                  if (deleted.length > 0) {
                    setExpenses(prev => prev.filter(exp => !deleted.includes(exp.id)));
                    setSelectedExpenses([]);
                    setIsSelectAll(false);
                  }

                  if (deleted.length === selectedExpenses.length) {
                    toast.success(`${deleted.length} expense(s) deleted successfully`, { id: dt });
                  } else {
                    if (deleted.length > 0) {
                      toast.success(`${deleted.length} deleted successfully`, { id: dt });
                    }
                    if (forbidden.length > 0) {
                      toast.error(`${forbidden.length} expense(s) could not be deleted (no permission)`);
                    }
                    if (notFound.length > 0) {
                      toast.error(`${notFound.length} expense(s) not found — already deleted?`);
                    }
                  }
                } catch (error) {
                  toast.error('Failed to delete some expenses', { id: dt });
                }
              }}
              className="px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }
    );
  };

  // Initial data fetch
  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get unique createdBy values for filter
  const createdByOptions = useMemo(() => {
    const creators = expenses.map(exp => exp.created_by).filter(Boolean);
    return ['All', ...new Set(creators)];
  }, [expenses]);

  // Format amount in Indian Rupees
  const formatRupees = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.category_id) newErrors.category_id = 'Category is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be a positive number';
    if (!formData.payment_method) newErrors.payment_method = 'Payment method is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in all required fields correctly');
      return false;
    }
    
    return true;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (editingExpense) {
      updateExpense();
    } else {
      addExpense();
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
      merchant: expense.merchant || '',
      category_id: expense.category?.id?.toString() || expense.category_id?.toString() || '',
      amount: expense.amount.toString(),
      payment_method: expense.payment_method,
      status: expense.status,
      receipt: null
    });
    setErrors({});
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      merchant: '',
      category_id: '',
      amount: '',
      payment_method: 'CASH',
      status: 'PENDING',
      receipt: null
    });
    setEditingExpense(null);
    setShowModal(false);
    setViewingExpense(null);
    setShowNewCategory(false);
    setNewCategoryName('');
    setErrors({});
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('All');
    setFilterCreatedBy('All');
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || expense.status === filterStatus;
    const matchesCreatedBy = filterCreatedBy === 'All' || expense.created_by === filterCreatedBy;
    
    return matchesSearch && matchesStatus && matchesCreatedBy;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Desktop Table View
  const renderTableView = () => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-12 px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">
                <input
                  type="checkbox"
                  checked={isSelectAll}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">ID</th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Date</th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-left">Category</th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Amount</th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Payment</th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Created By</th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Status</th>
              <th className="px-4 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredExpenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-center">
                  <input
                    type="checkbox"
                    checked={selectedExpenses.includes(expense.id)}
                    onChange={() => handleSelectExpense(expense.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4 text-sm font-mono text-gray-600">#{expense.id}</td>
                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {expense.date}
                </td>
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium">
                    <Tag size={12} className="mr-1" />
                    {expense.category?.name || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right whitespace-nowrap">
                  {formatRupees(expense.amount)}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 text-center">
                  <span className="inline-flex items-center gap-1">
                    <CreditCard size={12} className="text-gray-400" />
                    {expense.payment_method}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 text-center">
                  <span className="inline-flex items-center gap-1 capitalize">
                    <User size={12} className="text-gray-400" />
                    {expense.created_by || 'admin'}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                    {expense.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleView(expense)}
                      className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleEdit(expense)}
                      className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
                      title="Edit Expense"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Delete Expense"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredExpenses.length === 0 && !loading && (
        <div className="text-center py-12">
          <Search className="mx-auto text-gray-300 mb-3" size={48} />
          <p className="text-gray-500 text-lg">No expenses found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 mt-2">Loading expenses...</p>
        </div>
      )}
    </div>
  );

  // Mobile Card View
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
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-gray-500">#{expense.id}</span>
                <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(expense.status)}`}>
                  {expense.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{expense.date}</p>
            </div>
          </div>
        </div>

        {/* Expense Details */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Category</p>
            <div className="flex items-center gap-1">
              <Tag size={14} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{expense.category?.name || 'N/A'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Payment</p>
            <div className="flex items-center gap-1">
              <CreditCard size={14} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-900">{expense.payment_method}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Created By</p>
            <div className="flex items-center gap-1">
              <User size={14} className="text-gray-400" />
              <p className="text-sm font-medium text-gray-900 capitalize">{expense.created_by || 'admin'}</p>
            </div>
          </div>
        </div>

        {/* Amount and Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatRupees(expense.amount)}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleView(expense)}
              className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              title="View Details"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() => handleEdit(expense)}
              className="p-2 rounded-lg bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors"
              title="Edit Expense"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(expense.id)}
              className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Delete Expense"
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by title, merchant, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-400 flex-shrink-0" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All Status</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Created By Filter */}
              <div className="flex items-center gap-2">
                <User size={18} className="text-gray-400 flex-shrink-0" />
                <select
                  value={filterCreatedBy}
                  onChange={(e) => setFilterCreatedBy(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="All">All Creators</option>
                  {createdByOptions.filter(opt => opt !== 'All').map(creator => (
                    <option key={creator} value={creator} className="capitalize">
                      {creator}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters */}
            {(searchTerm || filterStatus !== 'All' || filterCreatedBy !== 'All') && (
              <div className="flex justify-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <X size={16} />
                  Clear all filters
                </button>
              </div>
            )}

            {/* Active Filters Display */}
            {(searchTerm || filterStatus !== 'All' || filterCreatedBy !== 'All') && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filterStatus !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                    Status: {filterStatus}
                    <button onClick={() => setFilterStatus('All')} className="hover:text-blue-900">
                      <X size={12} />
                    </button>
                  </span>
                )}
                {filterCreatedBy !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200 capitalize">
                    Created by: {filterCreatedBy}
                    <button onClick={() => setFilterCreatedBy('All')} className="hover:text-blue-900">
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            )}
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

        {/* Content Area - Conditional rendering based on screen size */}
        {isMobile ? (
          /* Mobile Card View */
          <div className="space-y-4">
            {filteredExpenses.map(renderCardView)}
            
            {filteredExpenses.length === 0 && !loading && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <Search className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500">No expenses found</p>
                <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filter</p>
              </div>
            )}
          </div>
        ) : (
          /* Desktop Table View */
          renderTableView()
        )}
      </div>

      {/* Edit/Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
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
                    Amount (₹) *
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
                    value={formData.category_id}
                    onChange={(e) => {
                      if (e.target.value === '__add_new__') {
                        setShowNewCategory(true);
                        setFormData({...formData, category_id: ''});
                        if (errors.category_id) setErrors({...errors, category_id: ''});
                      } else {
                        setFormData({...formData, category_id: e.target.value});
                        if (errors.category_id) setErrors({...errors, category_id: ''});
                      }
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.category_id ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                    <option value="__add_new__" className="text-blue-600 font-medium">+ Add New Category</option>
                  </select>
                  {errors.category_id && !showNewCategory && (
                    <p className="mt-1 text-xs text-red-600">{errors.category_id}</p>
                  )}
                  
                  {showNewCategory && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="New category"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                        className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        onClick={addCategory}
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
                    value={formData.payment_method}
                    onChange={(e) => {
                      setFormData({...formData, payment_method: e.target.value});
                      if (errors.payment_method) setErrors({...errors, payment_method: ''});
                    }}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.payment_method ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select payment method</option>
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>{method.label}</option>
                    ))}
                  </select>
                  {errors.payment_method && (
                    <p className="mt-1 text-xs text-red-600">{errors.payment_method}</p>
                  )}
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
    </div>
  );
};

export default ExpenseTracker;