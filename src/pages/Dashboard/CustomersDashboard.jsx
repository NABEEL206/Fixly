// src/pages/CustomerDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  Clock,
  Mail,
  Phone,
  User,
  FileText,
  Loader2,
  Eye,
  MapPin,
  Calendar,
  Award,
  Smartphone,
  Star,
  MapPinned,
  IdCard,
  Home,
  Hash,
  CalendarDays,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import axiosInstance from "@/API/axiosInstance";

const CustomersDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    resolved: 0,
    inProgress: 0
  });

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axiosInstance.get('api/customers/dashboard');
        
        if (response.data) {
          setDashboardData(response.data);
          
          // Set complaints from recent_complaints
          const recentComplaints = response.data.recent_complaints || [];
          setComplaints(recentComplaints);
          
          // Set stats from counts
          setStats({
            total: response.data.counts?.total || 0,
            pending: response.data.counts?.pending || 0,
            inProgress: response.data.counts?.in_progress || 0,
            resolved: response.data.counts?.resolved || 0
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.message || 'Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pending': { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      'In Progress': { bg: 'bg-blue-100', text: 'text-blue-700', icon: Loader2 },
      'Assigned': { bg: 'bg-purple-100', text: 'text-purple-700', icon: Loader2 },
      'Resolved': { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle }
    };

    const config = statusConfig[status] || statusConfig['Pending'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const ComplaintDetailModal = ({ complaint, onClose }) => {
    if (!complaint) return null;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl">
          <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-slate-50 to-gray-50">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Complaint Details</h2>
              <p className="text-sm text-gray-500 mt-1">ID: {complaint.code || complaint.complaint_id}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition"
            >
              ✕
            </button>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2">
                {getStatusBadge(complaint.status)}
              </div>

              <div className="bg-gray-50 p-5 rounded-xl">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  Complaint Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Issue Title</p>
                    <p className="text-gray-900 font-medium">{complaint.issue_title || complaint.title}</p>
                  </div>
                  {complaint.issue_subtitle && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Subtitle</p>
                      <p className="text-gray-600">{complaint.issue_subtitle}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Phone Model</p>
                    <p className="text-gray-900 font-medium">{complaint.phone_model}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-5 rounded-xl">
                  <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <User size={16} className="text-blue-600" />
                    Assignment Details
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Assigned To</p>
                      <p className="text-gray-900 font-medium">{complaint.assigned_to || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Created On</p>
                      <p className="text-gray-900 flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400" />
                        {complaint.date ? new Date(complaint.date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition font-medium shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const profile = dashboardData?.profile || {};
  const counts = dashboardData?.counts || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Stylish Customer Details Card - Light White Colors */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white via-gray-50 to-blue-50 rounded-3xl p-8 mb-8 shadow-xl border border-gray-200/50">
          {/* Decorative elements - light */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/30 rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-100/20 rounded-full -ml-20 -mb-20"></div>
          
          <div className="relative z-10">
            {/* Header with badge */}
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-200">
                <IdCard className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-800">Customer Profile</h1>
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  ID: #{profile.id} • Member since {profile.member_since || 'N/A'}
                </p>
              </div>
            </div>

            {/* Main Info Grid - Light White */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Personal Info */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-500" />
                    Personal Information
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-2.5 rounded-xl">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Full Name</p>
                        <p className="text-gray-800 text-xl font-semibold">{profile.full_name || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-2.5 rounded-xl">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Email Address</p>
                        <p className="text-gray-700 text-lg">{profile.email || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-2.5 rounded-xl">
                        <Phone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Phone Number</p>
                        <p className="text-gray-800 text-lg font-medium">{profile.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Address */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all h-full">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <MapPinned className="w-5 h-5 text-blue-500" />
                    Address Details
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-2.5 rounded-xl">
                        <Home className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-400 text-xs uppercase tracking-wider">Address</p>
                        <p className="text-gray-700 text-lg">{profile.address || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-xl">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider">State</p>
                          <p className="text-gray-800 text-base font-medium">{profile.state || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-xl">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Pincode</p>
                          <p className="text-gray-800 text-base font-medium">{profile.pincode || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {profile.area && (
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-xl">
                          <MapPin className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Area</p>
                          <p className="text-gray-800 text-base font-medium">{profile.area}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Stats Badges */}
                  <div className="mt-6 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
                      <Award size={12} />
                      {profile.is_active ? 'Active Customer' : 'Inactive Customer'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs border border-purple-200">
                      <Star size={12} />
                      {profile.complaints_count || 0} Total Complaints
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-100 rounded-xl">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.total}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Total Complaints</h3>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-amber-100 rounded-xl">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.pending}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Pending</h3>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-sky-100 rounded-xl">
                <Loader2 className="w-5 h-5 text-sky-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.inProgress}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">In Progress</h3>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-emerald-100 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-2xl font-bold text-gray-800">{stats.resolved}</span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">Resolved</h3>
          </div>
        </div>

        {/* Recent Complaints */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-blue-600" />
              Recent Complaints
            </h3>
          </div>
          
          {complaints.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No complaints found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Hash size={14} className="text-gray-400" />
                        ID
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <CalendarDays size={14} className="text-gray-400" />
                        Date
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FileText size={14} className="text-gray-400" />
                        Issue
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Smartphone size={14} className="text-gray-400" />
                        Phone Model
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Clock size={14} className="text-gray-400" />
                        Status
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <User size={14} className="text-gray-400" />
                        Assigned To
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-medium text-blue-600">{complaint.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {complaint.date ? new Date(complaint.date).toLocaleDateString('en-IN') : 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{complaint.issue_title}</p>
                          {complaint.issue_subtitle && (
                            <p className="text-xs text-gray-500">{complaint.issue_subtitle}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{complaint.phone_model}</span>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(complaint.status)}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{complaint.assigned_to || 'Not assigned'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-medium"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
        />
      )}
    </div>
  );
};

export default CustomersDashboard;