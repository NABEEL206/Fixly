import React, { useEffect, useState } from "react";
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
  TrendingUp,
  Users,
  Package,
  Shield,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { BASE_URL } from "@/API/BaseURL";
import toast from "react-hot-toast";
import axios from "axios";

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

// Create axios instance with default config for DRF Token Authentication
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to add token in DRF format
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (response.data.access) {
            localStorage.setItem("access_token", response.data.access);
            originalRequest.headers.Authorization = `Token ${response.data.access}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    
    return Promise.reject(error);
  }
);

export default function GrowTagsDashboard() {
  const { user } = useAuth();
  const [animateStats, setAnimateStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [yearMetaData, setYearMetaData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    totalComplaints: 0,
    todayComplaints: 0,
    completedWork: 0,
    earnings: 0,
    pendingWork: 0,
    resolutionRate: 0,
  });

  // Today's date formatting
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // Fetch year meta data first
  useEffect(() => {
    fetchYearMetaData();
  }, []);

  // Fetch dashboard data when year is selected or changed
  useEffect(() => {
    if (selectedYear) {
      fetchDashboardData(selectedYear);
    }
  }, [selectedYear]);

  const fetchYearMetaData = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const growtagId = user?.id;

      if (!growtagId) {
        console.error("Growtag ID not found");
        return;
      }

      console.log("Fetching year meta data...");
      const response = await api.get(`/api/growtag/dashboard/meta/?growtag_id=${growtagId}`);
      
      console.log("Year meta data received:", response.data);
      setYearMetaData(response.data);
      
      // Set default year
      if (response.data.default_year) {
        setSelectedYear(response.data.default_year);
      }
      
    } catch (error) {
      console.error("Error fetching year meta data:", error);
      toast.error("Failed to load year data");
    }
  };

  const fetchDashboardData = async (year) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const growtagId = user?.id;
      
      if (!token) {
        toast.error("No access token found. Please login again.");
        setLoading(false);
        return;
      }

      if (!growtagId) {
        toast.error("Growtag ID not found");
        setLoading(false);
        return;
      }

      console.log(`Fetching dashboard data for year ${year}...`);
      
      const response = await api.get(`/api/growtag/dashboard/?year=${year}`);
      
      console.log("Dashboard data received:", response.data);
      setDashboardData(response.data);
      
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Authentication failed. Please login again.");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          localStorage.removeItem("user");
          window.location.href = "/login";
        } else if (error.response.status === 403) {
          toast.error("You don't have permission to access this dashboard");
        } else if (error.response.status === 404) {
          toast.error("Dashboard API endpoint not found");
        } else {
          toast.error(error.response.data?.detail || `Error ${error.response.status}: Failed to load dashboard`);
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate resolution rate
  const resolutionRate = dashboardData?.cards?.total_assigned_complaints > 0
    ? Math.round((dashboardData.cards.completed_work / dashboardData.cards.total_assigned_complaints) * 100)
    : 0;

  // Calculate earnings growth
  const earningsGrowth = "0";

  // Initialize animations when data loads
  useEffect(() => {
    if (dashboardData) {
      setAnimateStats(true);
      
      const duration = 1500;
      const startTime = Date.now();

      const animate = () => {
        const now = Date.now();
        const progress = Math.min((now - startTime) / duration, 1);
        
        setAnimatedValues({
          totalComplaints: Math.floor(progress * (dashboardData.cards?.total_assigned_complaints || 0)),
          todayComplaints: Math.floor(progress * (dashboardData.cards?.todays_complaints || 0)),
          completedWork: Math.floor(progress * (dashboardData.cards?.completed_work || 0)),
          earnings: Math.floor(progress * (dashboardData.cards?.total_earnings || 0)),
          pendingWork: Math.floor(progress * (dashboardData.cards?.pending_work || 0)),
          resolutionRate: Math.floor(progress * resolutionRate),
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    }
  }, [dashboardData]);

  // Charts data
  const complaintsChart = {
    labels: dashboardData?.charts?.complaints_overview?.labels || 
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Complaints Assigned",
        data: dashboardData?.charts?.complaints_overview?.assigned || 
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: "Complaints Resolved",
        data: dashboardData?.charts?.complaints_overview?.resolved || 
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  const earningsChart = {
    labels: dashboardData?.charts?.earnings_trend?.labels || 
            ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: "Earnings (₹)",
        data: dashboardData?.charts?.earnings_trend?.amounts || 
              [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        borderColor: "rgba(168, 85, 247, 1)",
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, "rgba(168, 85, 247, 0.3)");
          gradient.addColorStop(1, "rgba(168, 85, 247, 0.0)");
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "rgba(168, 85, 247, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const complaintsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
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
    },
    hover: {
      animationDuration: 400
    }
  };

  const earningsChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeOutQuart'
    },
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
            return `Earnings: ₹${context.raw.toLocaleString()}`;
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
    },
    hover: {
      animationDuration: 400
    }
  };

  // Loading state
  if (loading || !yearMetaData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header Section with Year Selector */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="transform transition-all duration-500 hover:scale-[1.01]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg animate-pulse-slow">
                <Activity className="w-6 h-6 text-blue-600 animate-bounce-slow" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-blue-600 animate-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {dashboardData?.growtag?.name || user?.name || "GrowTag"}
                </span>
              </h1>
            </div>
            <p className="text-gray-600 flex items-center gap-2 animate-slide-up">
              <Calendar className="w-4 h-4" />
              {dashboardData?.date ? new Date(dashboardData.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }) : today}
            </p>
          </div>

          {/* Year Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsYearDropdownOpen(!isYearDropdownOpen)}
              className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
            >
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-700">Year: {selectedYear}</span>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isYearDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isYearDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                {yearMetaData.years.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsYearDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors duration-200 first:rounded-t-lg last:rounded-b-lg
                      ${selectedYear === year ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-700'}`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Complaints Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up"
             style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl animate-pulse-slow">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-bounce-in">
              {dashboardData?.cards?.total_assigned_complaints > 0 ? 'Active' : 'No Data'}
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Assigned Complaints</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-blue-600 font-mono animate-count-up">
              {animatedValues.totalComplaints}
            </p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-progress"
              style={{ 
                width: dashboardData?.cards?.total_assigned_complaints > 0 ? '86%' : '0%',
                animationDelay: '500ms'
              }}
            ></div>
          </div>
        </div>

        {/* Today's Complaints Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up"
             style={{ animationDelay: '200ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-indigo-50 rounded-xl animate-pulse-slow">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full animate-bounce-in">
              Today
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Today's Complaints</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-indigo-600 font-mono animate-count-up">
              {animatedValues.todayComplaints}
            </p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full animate-progress"
              style={{ 
                width: dashboardData?.cards?.todays_complaints > 0 ? '60%' : '0%',
                animationDelay: '600ms'
              }}
            ></div>
          </div>
        </div>

        {/* Completed Work Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up"
             style={{ animationDelay: '300ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-xl animate-pulse-slow">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full animate-bounce-in">
              {animatedValues.resolutionRate}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Completed Work</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-green-600 font-mono animate-count-up">
              {animatedValues.completedWork}
            </p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full animate-progress"
              style={{ 
                width: `${resolutionRate}%`,
                animationDelay: '700ms'
              }}
            ></div>
          </div>
        </div>

        {/* Earnings Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up"
             style={{ animationDelay: '400ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl animate-pulse-slow">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full animate-bounce-in">
              +{earningsGrowth}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Earnings</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-purple-600 font-mono animate-count-up">
              ₹{animatedValues.earnings.toLocaleString()}
            </p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full animate-progress"
              style={{ 
                width: dashboardData?.cards?.total_earnings > 0 ? '65%' : '0%',
                animationDelay: '800ms'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaints Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform transition-all duration-500 hover:scale-[1.01] animate-slide-up"
             style={{ animationDelay: '500ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Complaints Overview - {selectedYear}</h2>
            <p className="text-gray-500 text-sm">Yearly assigned vs resolved complaints</p>
          </div>
          <div className="h-80 animate-fade-in">
            <Bar data={complaintsChart} options={complaintsChartOptions} />
          </div>
        </div>

        {/* Earnings Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform transition-all duration-500 hover:scale-[1.01] animate-slide-up"
             style={{ animationDelay: '600ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Earnings Trend - {selectedYear}</h2>
            <p className="text-gray-500 text-sm">Yearly earnings growth</p>
          </div>
          <div className="h-80 animate-fade-in">
            <Line data={earningsChart} options={earningsChartOptions} />
          </div>
        </div>
      </div>

      {/* Pending Work Card */}
      <div className="grid grid-cols-1">
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform transition-all duration-500 hover:scale-[1.01] animate-slide-up"
             style={{ animationDelay: '700ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-yellow-50 rounded-xl animate-pulse-slow">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <span className="text-sm font-medium text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full animate-bounce-in">
              Pending
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Pending Work</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-yellow-600 font-mono animate-count-up">
              {animatedValues.pendingWork}
            </p>
          </div>
          <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full animate-progress"
              style={{ 
                width: dashboardData?.cards?.pending_work > 0 ? '40%' : '0%',
                animationDelay: '900ms'
              }}
            ></div>
          </div>
        </div>
      </div>

    </div>
  );
}