import React from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  Title,
} from "chart.js";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Activity,
  Calendar,
  Users,
  FileText,
  UserCheck
} from "lucide-react";

ChartJS.register(
  BarElement,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
  Title
);

export default function FranchiseDashboard() {
  // 🔐 Logged-in Franchise details
  const franchiseName = "Premium Mobile Services";
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // 📌 Franchise Dashboard Stats
  const totalAssignedComplaints = 245;
  const todaysComplaints = 18;
  const growTagsCount = 12;
  const totalRevenue = 124500;
  const completedWork = 178;
  const pendingWork = 67;
  const workAssignedToGrowtag = 112;
  const resolutionRate = Math.round((completedWork / totalAssignedComplaints) * 100);

  // 💰 Revenue Growth
  const lastMonthRevenue = 109500;
  const revenueGrowth = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);

  // All months for charts
  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // 📊 Complaints Overview Chart
  const complaintsChart = {
    labels: allMonths,
    datasets: [
      {
        label: "Complaints Assigned",
        data: [18, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: "Complaints Resolved",
        data: [15, 19, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  // 📊 Revenue Growth Chart
  const revenueChart = {
    labels: allMonths,
    datasets: [
      {
        label: "Revenue (₹)",
        data: [8500, 9200, 10100, 11500, 12800, 14200, 15600, 17100, 18500, 19800, 21200, 22400],
        borderColor: "rgba(168, 85, 247, 1)",
        backgroundColor: "rgba(168, 85, 247, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(168, 85, 247, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  const complaintsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
            family: "'Inter', sans-serif"
          },
          padding: 20,
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        displayColors: false,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      }
    }
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `Revenue: ₹${context.raw.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value) {
            return '₹' + value.toLocaleString();
          },
          font: {
            size: 11,
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{franchiseName}</span>
            </h1>
          </div>
          <p className="text-gray-600 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {today}
          </p>
        </div>
      </div>

      {/* Main Stats Grid - 7 Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Assigned Complaints Card - Blue */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              +8%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Assigned Complaints</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-blue-600">{totalAssignedComplaints}</p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              style={{ width: '82%' }}
            ></div>
          </div>
        </div>

        {/* Today's Complaints Card - Indigo */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Today
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Today's Complaints</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-indigo-600">{todaysComplaints}</p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
              style={{ width: '72%' }}
            ></div>
          </div>
        </div>

        {/* My GrowTags Count Card - Purple */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              {growTagsCount} Active
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">My GrowTags Count</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-purple-600">{growTagsCount}</p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
              style={{ width: '75%' }}
            ></div>
          </div>
        </div>

        {/* Total Revenue Card - Green */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              +{revenueGrowth}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Revenue</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-green-600">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
              style={{ width: '68%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Second Row Stats Grid - 3 Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Completed Work Card - Teal */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-teal-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
            <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
              {resolutionRate}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Completed Work</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-teal-600">{completedWork}</p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full"
              style={{ width: `${resolutionRate}%` }}
            ></div>
          </div>
        </div>

        {/* Pending Work Card - Orange */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Pending
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Pending Work</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-orange-600">{pendingWork}</p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
              style={{ width: '27%' }}
            ></div>
          </div>
        </div>

        {/* Work Assigned to GrowTag Card - Red */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Assigned
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Work Assigned to GrowTag</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-red-600">{workAssignedToGrowtag}</p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full"
              style={{ width: '46%' }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaints Overview Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Complaints Overview</h2>
            <p className="text-gray-500 text-sm">Yearly assigned vs resolved complaints across franchise</p>
          </div>
          <div className="h-80">
            <Bar data={complaintsChart} options={complaintsChartOptions} />
          </div>
        </div>

        {/* Revenue Growth Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Revenue Growth</h2>
            <p className="text-gray-500 text-sm">Yearly revenue trend for the franchise</p>
          </div>
          <div className="h-80">
            <Line data={revenueChart} options={revenueChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}