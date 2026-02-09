import React from 'react';
import {
  User, Phone, Mail, MapPin, Calendar, Smartphone,
  CheckCircle, Clock, AlertCircle
} from 'lucide-react';

const CustomerDashboard = () => {
  // Customer data from your API response
  const customer = {
    id: 1,
    customer_phone: "8086770440",
    email: "alzamanpoothakkal@gmail.com",
    complaints_history: [
      {
        id: 1,
        phone_model: "vivo",
        issue_details: "Speaker",
        status: "Assigned",
        assign_to: "franchise",
        created_at: "2025-12-15T10:46:31.970618Z"
      }
    ],
    customer_name: "Zaman",
    password: "123456",
    address: "manjeri",
    pincode: "673642",
    created_at: "2025-12-15T10:46:31.955308Z"
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Assigned': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Assigned': return <AlertCircle size={16} className="text-amber-600" />;
      case 'Completed': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'In Progress': return <Clock size={16} className="text-blue-600" />;
      default: return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Header with improved design */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg">
            <h1 className="text-2xl font-bold text-white mb-1">Welcome, {customer.customer_name}</h1>
            <p className="text-blue-100 opacity-90">Your dashboard overview</p>
          </div>
        </div>

        {/* Customer Info Card - Enhanced */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <User size={18} className="text-blue-600" />
              </div>
              My Information
            </h2>
            <div className="text-xs font-medium px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
              Customer ID: #{customer.id}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <User size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Name</p>
                <p className="font-semibold text-gray-800">{customer.customer_name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Phone size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Phone</p>
                <p className="font-semibold text-gray-800">{customer.customer_phone}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Mail size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Email</p>
                <p className="font-semibold text-gray-800">{customer.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <MapPin size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Address</p>
                <p className="font-semibold text-gray-800">{customer.address}, {customer.pincode}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Calendar size={18} className="text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Member Since</p>
                <p className="font-semibold text-gray-800">{formatDate(customer.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Complaints History - Enhanced */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-1">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <Smartphone size={18} className="text-amber-600" />
                </div>
                My Repair Requests
              </h2>
              <p className="text-gray-500 text-sm">Track all your repair requests in one place</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 font-medium">
                Total: <span className="text-blue-600 font-bold">{customer.complaints_history.length}</span>
              </span>
            </div>
          </div>

          {customer.complaints_history.length > 0 ? (
            <div className="space-y-4">
              {customer.complaints_history.map((complaint) => (
                <div 
                  key={complaint.id} 
                  className="border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Smartphone size={18} className="text-blue-600" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 text-lg">{complaint.phone_model}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1.5 text-sm rounded-full flex items-center gap-2 font-medium border ${getStatusColor(complaint.status)}`}>
                              {getStatusIcon(complaint.status)}
                              {complaint.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-12 space-y-2">
                        <p className="text-gray-700">
                          <span className="font-medium">Issue:</span> {complaint.issue_details}
                        </p>
                        <p className="text-gray-600 text-sm">
                          <span className="font-medium">Assigned to:</span> {complaint.assign_to}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="inline-block bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-500 mb-1">Submitted on</p>
                        <p className="font-medium text-gray-800">
                          {formatDate(complaint.created_at)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Request #{complaint.id}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No repair requests yet</h3>
              <p className="text-gray-500">Submit your first repair request to get started</p>
            </div>
          )}
        </div>

        {/* Summary Cards - Enhanced */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Completed Requests</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {customer.complaints_history.filter(c => c.status === 'Completed').length}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <CheckCircle size={24} className="text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Requests</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {customer.complaints_history.length}
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertCircle size={24} className="text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Enhanced */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600 text-sm">
              Need help? Contact support at support@example.com
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © {new Date().getFullYear()} DeviceCare. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;