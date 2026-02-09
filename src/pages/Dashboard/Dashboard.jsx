import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { BASE_URL } from "@/API/BaseURL";

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
  Users,
  Store,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Calendar,
  UserPlus,
  RefreshCw,
  Building,
  StoreIcon,
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

export default function AdminDashboard() {
  // year state
  const currentYear = new Date().getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);

  // State for API data
  const [dashboardData, setDashboardData] = useState({
    loading: true,
    error: null,
    year: null,

    cards: {
      total_complaints: 0,
      total_growtags: 0,
      franchise_shops: 0,
      other_shops: 0,
      total_earnings: 0,
    },

    summary: {
      today_complaints: 0,
      pending_complaints: 0,
      active_complaints: 0,
      resolved_complaints: 0,
    },

    charts: {},
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const resolutionRate = dashboardData.cards.total_complaints
    ? Math.round(
        (dashboardData.summary.resolved_complaints /
          dashboardData.cards.total_complaints) *
          100
      )
    : 0;

  // Charts Data
  const complaintsChart = {
    labels: dashboardData.charts?.complaints_overview?.labels || [],

    datasets: [
      {
        label: "Total Complaints",
        data: dashboardData.charts?.complaints_overview?.totals || [],
        backgroundColor: "rgba(59,130,246,0.8)",
        borderRadius: 6,
      },
    ],
  };

  const growTagsChart = {
    labels: dashboardData.charts?.growtags_growth?.labels || [],

    datasets: [
      {
        label: "GrowTags",
        data: dashboardData.charts?.growtags_growth?.totals || [],
        borderColor: "rgba(34,197,94,1)",
        backgroundColor: "rgba(34,197,94,0.15)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
      },
    ],
  };

  // Franchise Shops Chart
  const franchiseShopsChart = {
    labels: dashboardData.charts?.franchise_shops_growth?.labels || [],

    datasets: [
      {
        label: "Franchise Shops",
        data: dashboardData.charts?.franchise_shops_growth?.totals || [],
        backgroundColor: "rgba(59,130,246,0.8)",
        borderRadius: 6,
      },
    ],
  };

  // Other Shops Chart
  const otherShopsChart = {
    labels: dashboardData.charts?.other_shops_growth?.labels || [],

    datasets: [
      {
        label: "Other Shops",
        data: dashboardData.charts?.other_shops_growth?.totals || [],
        backgroundColor: "rgba(168,85,247,0.8)",
        borderRadius: 6,
      },
    ],
  };

  // Revenue Chart
  const revenueChart = {
    labels: dashboardData.charts?.revenue_trend?.labels || [],

    datasets: [
      {
        label: "Revenue (₹)",
        data: dashboardData.charts?.revenue_trend?.amounts || [],
        borderColor: "rgba(245,158,11,1)",
        backgroundColor: "rgba(245,158,11,0.15)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const performanceChart = {
    labels: [
      "Complaints",
      "GrowTags",
      "Franchise Shops",
      "Other Shops",
      "Admin Earnings",
    ],
    datasets: [
      {
        label: "Growth Performance",
        data: [
          dashboardData.charts?.growth_performance?.complaints || 0,
          dashboardData.charts?.growth_performance?.growtags || 0,
          dashboardData.charts?.growth_performance?.franchise_shops || 0,
          dashboardData.charts?.growth_performance?.other_shops || 0,
          dashboardData.charts?.growth_performance?.admin_earnings || 0,
        ],
        backgroundColor: [
          "rgba(59,130,246,0.7)",
          "rgba(34,197,94,0.7)",
          "rgba(29,78,216,0.7)",
          "rgba(168,85,247,0.7)",
          "rgba(245,158,11,0.7)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: false, // ⭐ THIS FIXES IT
          color: "#374151", // visible text
          font: {
            size: 12,
            weight: "500",
          },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
        ticks: {
          color: "#374151",
          font: { size: 11 },
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        enabled: true,
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        display: false,
      },
    },
  };

  const performanceChartOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y: {
        ...chartOptions.scales.y,
        ticks: {
          callback: function (value) {
            return value + "%";
          },
          font: {
            size: 11,
          },
        },
      },
    },
  };

  // API Integration Function
  const fetchDashboardData = async () => {
    setDashboardData((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      // ✅ MATCH AuthContext token key
      const token = localStorage.getItem("access_token");

      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      const response = await fetch(
        `${BASE_URL}/api/admin/dashboard/?year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401 || response.status === 403) {
        throw new Error("You are not authorized to access this dashboard.");
      }

      if (!response.ok) {
        throw new Error("Failed to load dashboard data.");
      }

      const data = await response.json();
      console.log("response", data);

      setDashboardData({
        loading: false,
        error: null,
        year: data.year,
        cards: data.cards,
        summary: data.summary,
        charts: data.charts,
      });
    } catch (error) {
      setDashboardData((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Something went wrong",
      }));

      console.error("Dashboard API error:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedYear]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin <span className="text-blue-600">Dashboard</span>
              </h1>
            </div>
            <p className="text-gray-600 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {today}
            </p>
          </div>
          {/* year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-4 py-2 border rounded-xl text-sm bg-white shadow-sm"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <button
            onClick={fetchDashboardData}
            disabled={dashboardData.loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
          >
            {dashboardData.loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Grid - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {/* Total Complaints */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Total Complaints
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {dashboardData.loading
              ? "..."
              : dashboardData.cards.total_complaints.toLocaleString()}
          </p>
        </div>

        {/* Total GrowTags */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Total GrowTags
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {dashboardData.loading
              ? "..."
              : dashboardData.cards.total_growtags.toLocaleString()}
          </p>
        </div>

        {/* Franchise Shops */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Franchise Shops
          </h3>
          <p className="text-3xl font-bold text-blue-700">
            {dashboardData.loading
              ? "..."
              : dashboardData.cards.franchise_shops.toLocaleString()}
          </p>
        </div>

        {/* Other Shops */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <StoreIcon className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Other Shops
          </h3>
          <p className="text-3xl font-bold text-purple-600">
            {dashboardData.loading
              ? "..."
              : dashboardData.cards.other_shops.toLocaleString()}
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-amber-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-amber-600">
            {dashboardData.loading
              ? "..."
              : `₹${dashboardData.cards.total_earnings.toLocaleString()}`}
          </p>
        </div>
      </div>

      {/* Stats Grid - Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Complaints */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Today’s Complaints
          </h3>
          <p className="text-3xl font-bold text-blue-600">
            {dashboardData.loading
              ? "..."
              : dashboardData.summary.today_complaints}
          </p>
        </div>

        {/* Pending Complaints */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Pending Complaints
          </h3>
          <p className="text-3xl font-bold text-yellow-600">
            {dashboardData.loading
              ? "..."
              : dashboardData.summary.pending_complaints}
          </p>
        </div>

        {/* Active Complaints */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Active Complaints
          </h3>
          <p className="text-3xl font-bold text-orange-600">
            {dashboardData.loading
              ? "..."
              : dashboardData.summary.active_complaints}
          </p>
        </div>

        {/* Completed Complaints */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">
            Completed Complaints
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {dashboardData.loading
              ? "..."
              : dashboardData.summary.resolved_complaints}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaints Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Complaints Overview
            </h2>
            <p className="text-gray-500 text-sm">Monthly complaints overview</p>
          </div>
          <div className="h-80">
            {!dashboardData.loading && (
              <Bar data={complaintsChart} options={chartOptions} />
            )}
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
            <p className="text-gray-500 text-sm">Monthly revenue growth</p>
          </div>
          <div className="h-80">
            {!dashboardData.loading && (
              <Line data={revenueChart} options={lineChartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Charts Section - Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* GrowTags Growth */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">GrowTags Growth</h2>
            <p className="text-gray-500 text-sm">
              Yearly new GrowTag registrations
            </p>
          </div>
          <div className="h-80">
            {!dashboardData.loading && (
              <Line data={growTagsChart} options={lineChartOptions} />
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Growth Performance
            </h2>
            <p className="text-gray-500 text-sm">
              Yearly growth rates across all metrics
            </p>
          </div>
          <div className="h-80">
            {!dashboardData.loading && (
              <Bar data={performanceChart} options={performanceChartOptions} />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Charts Section - Shops Growth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Franchise Shops Growth */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Building className="w-5 h-5 text-blue-700" />
              <h2 className="text-xl font-bold text-gray-900">
                Franchise Shops Growth
              </h2>
            </div>
            <p className="text-gray-500 text-sm">
              Yearly franchise shops growth trend
            </p>
          </div>

          <div className="h-72">
            {!dashboardData.loading && (
              <Bar data={franchiseShopsChart} options={chartOptions} />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-bold text-blue-700">
                {dashboardData.loading
                  ? "..."
                  : dashboardData.cards.franchise_shops}
              </span>
            </div>
          </div>
        </div>

        {/* Other Shops Growth */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <StoreIcon className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">
                Other Shops Growth
              </h2>
            </div>
            <p className="text-gray-500 text-sm">
              Yearly other shops growth trend
            </p>
          </div>

          <div className="h-72">
            {!dashboardData.loading && (
              <Bar data={otherShopsChart} options={chartOptions} />
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total:{" "}
              <span className="font-bold text-purple-600">
                {dashboardData.loading
                  ? "..."
                  : dashboardData.cards.other_shops}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
