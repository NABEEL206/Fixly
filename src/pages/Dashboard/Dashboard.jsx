import React, { useState, useEffect } from "react";
import { Bar, Line } from "react-chartjs-2";
import { BASE_URL } from "@/API/BaseURL";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";

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
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Calendar,
  RefreshCw,
  Building,
  Store,
  ChevronDown,
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
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  
  // State for meta data
  const [metaData, setMetaData] = useState({
    loading: true,
    error: null,
    start_year: 2026,
    current_year: 2026,
    years: [2026],
    default_year: 2026
  });
  
  const [selectedYear, setSelectedYear] = useState(null);
  
  // State for dashboard data
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
    charts: {
      complaints_overview: { labels: [], totals: [] },
      revenue_trend: { labels: [], amounts: [] },
      growtags_growth: { labels: [], totals: [] },
      franchise_shops_growth: { labels: [], totals: [] },
      other_shops_growth: { labels: [], totals: [] },
      growth_performance: {
        complaints: 0,
        growtags: 0,
        franchise_shops: 0,
        other_shops: 0,
        admin_earnings: 0
      }
    }
  });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  // Fetch meta data on component mount
  useEffect(() => {
    fetchMetaData();
  }, []);

  // Set selected year once meta data is loaded
  useEffect(() => {
    if (metaData.default_year && !selectedYear) {
      setSelectedYear(metaData.default_year);
    }
  }, [metaData.default_year]);

  // Fetch dashboard data when selected year changes
  useEffect(() => {
    if (selectedYear) {
      fetchDashboardData();
    }
  }, [selectedYear]);

  // Fetch meta data from API
  const fetchMetaData = async () => {
    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/admin/dashboard/meta/`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load meta data");
      }

      const data = await response.json();
      
      setMetaData({
        loading: false,
        error: null,
        start_year: data.start_year,
        current_year: data.current_year,
        years: data.years,
        default_year: data.default_year
      });
      
    } catch (error) {
      setMetaData(prev => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load year data",
      }));
      console.error("Meta data API error:", error);
    }
  };

  // Fetch dashboard data from API
  const fetchDashboardData = async () => {
    setDashboardData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `${BASE_URL}/api/admin/dashboard/?year=${selectedYear}`,
        {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to load dashboard data");
      }

      const data = await response.json();
      
      setDashboardData({
        loading: false,
        error: null,
        year: data.year,
        cards: data.cards,
        summary: data.summary,
        charts: data.charts,
      });
    } catch (error) {
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: error.message || "Failed to load dashboard data",
      }));
      console.error("Dashboard API error:", error);
    }
  };

  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // Charts Data Configuration
  const complaintsChart = {
    labels: dashboardData.charts?.complaints_overview?.labels || [],
    datasets: [{
      label: "Total Complaints",
      data: dashboardData.charts?.complaints_overview?.totals || [],
      backgroundColor: "rgba(59,130,246,0.8)",
      borderRadius: 6,
    }],
  };

  const growTagsChart = {
    labels: dashboardData.charts?.growtags_growth?.labels || [],
    datasets: [{
      label: "GrowTags",
      data: dashboardData.charts?.growtags_growth?.totals || [],
      borderColor: "rgba(34,197,94,1)",
      backgroundColor: "rgba(34,197,94,0.15)",
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
    }],
  };

  const franchiseShopsChart = {
    labels: dashboardData.charts?.franchise_shops_growth?.labels || [],
    datasets: [{
      label: "Franchise Shops",
      data: dashboardData.charts?.franchise_shops_growth?.totals || [],
      backgroundColor: "rgba(59,130,246,0.8)",
      borderRadius: 6,
    }],
  };

  const otherShopsChart = {
    labels: dashboardData.charts?.other_shops_growth?.labels || [],
    datasets: [{
      label: "Other Shops",
      data: dashboardData.charts?.other_shops_growth?.totals || [],
      backgroundColor: "rgba(168,85,247,0.8)",
      borderRadius: 6,
    }],
  };

  const revenueChart = {
    labels: dashboardData.charts?.revenue_trend?.labels || [],
    datasets: [{
      label: "Revenue (₹)",
      data: dashboardData.charts?.revenue_trend?.amounts || [],
      borderColor: "rgba(245,158,11,1)",
      backgroundColor: "rgba(245,158,11,0.15)",
      fill: true,
      tension: 0.4,
    }],
  };

  const performanceChart = {
    labels: ["Complaints", "GrowTags", "Franchise", "Other Shops", "Earnings"],
    datasets: [{
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
    }],
  };

  // Chart options with integer-only Y-axis
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        display: true,
        grid: { display: false },
        ticks: {
          autoSkip: false,
          color: "#374151",
          font: { size: 12, weight: "500" },
          maxRotation: 0,
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0,0,0,0.05)" },
        ticks: {
          color: "#374151",
          font: { size: 11 },
          callback: function(value) {
            if (Number.isInteger(value)) {
              return value;
            }
            return null;
          },
          stepSize: 1,
        },
        afterBuildTicks: function(scale) {
          const ticks = scale.ticks.map(tick => Math.round(tick.value));
          scale.ticks = [...new Set(ticks)].map(value => ({ value }));
        },
      },
    },
    plugins: {
      legend: { display: true },
      tooltip: { 
        enabled: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += Math.round(context.parsed.y);
            }
            return label;
          }
        }
      },
    },
  };

  const lineChartOptions = {
    ...chartOptions,
    plugins: { ...chartOptions.plugins, legend: { display: false } },
  };

  // Error state
  const error = metaData.error || dashboardData.error;

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => {
              fetchMetaData();
              if (selectedYear) fetchDashboardData();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

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
          
          <div className="flex items-center gap-3">
            {/* Year Filter Dropdown */}
            <div className="relative">
              <select
                value={selectedYear || ''}
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="appearance-none px-4 py-2 pr-10 border rounded-xl text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={metaData.loading}
              >
                {metaData.years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <button
              onClick={() => {
                fetchMetaData();
                if (selectedYear) fetchDashboardData();
              }}
              disabled={dashboardData.loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${dashboardData.loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Year Info */}
        {!metaData.loading && (
          <div className="mt-2 text-sm text-gray-500">
            Showing data for year: <span className="font-semibold text-blue-600">{selectedYear}</span>
            {metaData.years.length > 1 && (
              <span className="ml-2">(Available years: {metaData.years.join(', ')})</span>
            )}
          </div>
        )}
      </div>

      {/* Stats Grid - Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Complaints"
          value={dashboardData.loading ? "..." : dashboardData.cards.total_complaints}
          icon={<AlertCircle className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
          loading={dashboardData.loading}
        />
        <StatCard
          title="Total GrowTags"
          value={dashboardData.loading ? "..." : dashboardData.cards.total_growtags}
          icon={<Users className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50"
          textColor="text-green-600"
          loading={dashboardData.loading}
        />
        <StatCard
          title="Franchise Shops"
          value={dashboardData.loading ? "..." : dashboardData.cards.franchise_shops}
          icon={<Building className="w-6 h-6 text-blue-700" />}
          bgColor="bg-blue-100"
          textColor="text-blue-700"
          loading={dashboardData.loading}
        />
        <StatCard
          title="Other Shops"
          value={dashboardData.loading ? "..." : dashboardData.cards.other_shops}
          icon={<Store className="w-6 h-6 text-purple-600" />}
          bgColor="bg-purple-50"
          textColor="text-purple-600"
          loading={dashboardData.loading}
        />
        <StatCard
          title="Total Revenue"
          value={dashboardData.loading ? "..." : `₹${dashboardData.cards.total_earnings.toLocaleString()}`}
          icon={<DollarSign className="w-6 h-6 text-amber-600" />}
          bgColor="bg-amber-50"
          textColor="text-amber-600"
          loading={dashboardData.loading}
        />
      </div>

      {/* Stats Grid - Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Complaints"
          value={dashboardData.loading ? "..." : dashboardData.summary.today_complaints}
          icon={<AlertCircle className="w-6 h-6 text-blue-600" />}
          bgColor="bg-blue-50"
          textColor="text-blue-600"
          loading={dashboardData.loading}
        />
        <StatCard
          title="Pending Complaints"
          value={dashboardData.loading ? "..." : dashboardData.summary.pending_complaints}
          icon={<Clock className="w-6 h-6 text-yellow-600" />}
          bgColor="bg-yellow-50"
          textColor="text-yellow-600"
          loading={dashboardData.loading}
        />
        <StatCard
          title="Active Complaints"
          value={dashboardData.loading ? "..." : dashboardData.summary.active_complaints}
          icon={<Activity className="w-6 h-6 text-orange-600" />}
          bgColor="bg-orange-50"
          textColor="text-orange-600"
          loading={dashboardData.loading}
        />
        <StatCard
          title="Resolved Complaints"
          value={dashboardData.loading ? "..." : dashboardData.summary.resolved_complaints}
          icon={<CheckCircle className="w-6 h-6 text-green-600" />}
          bgColor="bg-green-50"
          textColor="text-green-600"
          loading={dashboardData.loading}
        />
      </div>

      {/* Charts Section - Only show when not loading */}
      {!dashboardData.loading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="Complaints Overview" subtitle={`Monthly complaints overview for ${selectedYear}`}>
              <Bar data={complaintsChart} options={chartOptions} />
            </ChartCard>

            <ChartCard title="Revenue Trend" subtitle={`Monthly revenue growth for ${selectedYear}`}>
              <Line data={revenueChart} options={lineChartOptions} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ChartCard title="GrowTags Growth" subtitle={`Yearly new GrowTag registrations in ${selectedYear}`}>
              <Line data={growTagsChart} options={lineChartOptions} />
            </ChartCard>

            <ChartCard title="Growth Performance" subtitle={`Yearly growth rates for ${selectedYear}`}>
              <Bar data={performanceChart} options={chartOptions} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard 
              title="Franchise Shops Growth" 
              subtitle={`Yearly franchise shops growth in ${selectedYear}`}
              icon={<Building className="w-5 h-5 text-blue-700" />}
              footer={
                <div className="text-sm text-gray-600">
                  Total: <span className="font-bold text-blue-700">{dashboardData.cards.franchise_shops}</span>
                </div>
              }
            >
              <Bar data={franchiseShopsChart} options={chartOptions} />
            </ChartCard>

            <ChartCard 
              title="Other Shops Growth" 
              subtitle={`Yearly other shops growth in ${selectedYear}`}
              icon={<Store className="w-5 h-5 text-purple-600" />}
              footer={
                <div className="text-sm text-gray-600">
                  Total: <span className="font-bold text-purple-600">{dashboardData.cards.other_shops}</span>
                </div>
              }
            >
              <Bar data={otherShopsChart} options={chartOptions} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}

// Reusable StatCard Component
const StatCard = ({ title, value, icon, bgColor, textColor, loading }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 ${bgColor} rounded-xl`}>{icon}</div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-2">{title}</h3>
    <p className={`text-3xl font-bold ${loading ? 'text-gray-400' : textColor}`}>
      {loading ? (
        <span className="inline-block w-12 h-8 bg-gray-200 rounded animate-pulse"></span>
      ) : (
        value
      )}
    </p>
  </div>
);

// Reusable ChartCard Component
const ChartCard = ({ title, subtitle, children, icon, footer }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      <p className="text-gray-500 text-sm">{subtitle}</p>
    </div>
    <div className="h-80">{children}</div>
    {footer && <div className="mt-4">{footer}</div>}
  </div>
);