import React, { useState, useEffect, useRef } from "react";
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
  UserCheck,
  ShoppingBag,
  Package,
  TrendingUp
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

export default function OtherShopDashboard() {
  // 🔐 Shop details
  const shopName = "City Mobile Center";
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // 📌 Shop Dashboard Stats
  const totalAssignedComplaints = 245;
  const todaysComplaints = 18;
  const growTagsCount = 12;
  const totalRevenue = 124500;
  const completedComplaints = 178;
  const pendingComplaints = 67;
  const complaintsAssignedToGrowTag = 112;
  const completionRate = Math.round((completedComplaints / totalAssignedComplaints) * 100);

  // 💰 Revenue Growth
  const lastMonthRevenue = 109500;
  const revenueGrowth = ((totalRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1);

  // Progress bar widths (in percentages)
  const progressWidths = {
    totalAssignedComplaints: 82,
    todaysComplaints: 72,
    growTagsCount: 75,
    totalRevenue: 68,
    completedComplaints: completionRate,
    pendingComplaints: 27,
    complaintsAssignedToGrowTag: 46
  };

  // Animation state
  const [animatedProgress, setAnimatedProgress] = useState({
    totalAssignedComplaints: 0,
    todaysComplaints: 0,
    growTagsCount: 0,
    totalRevenue: 0,
    completedComplaints: 0,
    pendingComplaints: 0,
    complaintsAssignedToGrowTag: 0
  });

  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef(null);

  // Animate progress bars on mount
  useEffect(() => {
    let startTime = null;
    const duration = 1500; // 1.5 seconds animation

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

      const easedProgress = easeOutCubic(progress);

      setAnimatedProgress({
        totalAssignedComplaints: Math.round(progressWidths.totalAssignedComplaints * easedProgress),
        todaysComplaints: Math.round(progressWidths.todaysComplaints * easedProgress),
        growTagsCount: Math.round(progressWidths.growTagsCount * easedProgress),
        totalRevenue: Math.round(progressWidths.totalRevenue * easedProgress),
        completedComplaints: Math.round(progressWidths.completedComplaints * easedProgress),
        pendingComplaints: Math.round(progressWidths.pendingComplaints * easedProgress),
        complaintsAssignedToGrowTag: Math.round(progressWidths.complaintsAssignedToGrowTag * easedProgress)
      });

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Animated Progress Bar Component
  const AnimatedProgressBar = ({ widthKey, colorFrom, colorTo }) => {
    const currentWidth = animatedProgress[widthKey] || 0;
    
    return (
      <div className="mt-4 h-2 bg-gray-100 rounded-full overflow-hidden relative">
        {/* Background shimmer effect during animation */}
        {isAnimating && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        )}
        
        {/* Main progress bar */}
        <div 
          className={`h-full rounded-full transition-all duration-300 ease-out relative z-10 ${
            isAnimating ? 'animate-pulse-subtle' : ''
          }`}
          style={{ 
            width: `${currentWidth}%`,
            background: `linear-gradient(to right, ${colorFrom}, ${colorTo})`,
            boxShadow: `0 2px 8px ${colorFrom}40`
          }}
        >
          {/* Glow effect at the end */}
          <div 
            className="absolute right-0 top-0 h-full w-2 opacity-70"
            style={{
              background: `linear-gradient(to right, transparent, ${colorTo})`,
              filter: 'blur(4px)'
            }}
          />
        </div>

        {/* Dots along the progress bar */}
        <div className="absolute inset-0 flex justify-between items-center px-1 z-0">
          {[...Array(5)].map((_, i) => (
            <div 
              key={i}
              className="w-1 h-1 rounded-full bg-white/40"
            />
          ))}
        </div>
      </div>
    );
  };

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
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
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
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Add custom animation styles */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header Section */}
      <div className="mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{shopName}</span>
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
          <AnimatedProgressBar 
            widthKey="totalAssignedComplaints"
            colorFrom="#3b82f6"
            colorTo="#1d4ed8"
          />
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
          <AnimatedProgressBar 
            widthKey="todaysComplaints"
            colorFrom="#6366f1"
            colorTo="#4338ca"
          />
        </div>

        {/* My Grow Tag Count Card - Purple */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-50 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
              {growTagsCount} Active
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">My Grow Tag Count</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-purple-600">{growTagsCount}</p>
          </div>
          <AnimatedProgressBar 
            widthKey="growTagsCount"
            colorFrom="#8b5cf6"
            colorTo="#7c3aed"
          />
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
          <AnimatedProgressBar 
            widthKey="totalRevenue"
            colorFrom="#10b981"
            colorTo="#059669"
          />
        </div>
      </div>

      {/* Second Row Stats Grid - 3 Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Completed Complaints Card - Teal */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-teal-50 rounded-xl">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
            <span className="text-sm font-medium text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
              {completionRate}%
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Completed Complaints</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-teal-600">{completedComplaints}</p>
          </div>
          <AnimatedProgressBar 
            widthKey="completedComplaints"
            colorFrom="#14b8a6"
            colorTo="#0d9488"
          />
        </div>

        {/* Pending Complaints Card - Orange */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-xl">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              Pending
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Pending Complaints</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-orange-600">{pendingComplaints}</p>
          </div>
          <AnimatedProgressBar 
            widthKey="pendingComplaints"
            colorFrom="#f97316"
            colorTo="#ea580c"
          />
        </div>

        {/* Complaints Assigned to GrowTag Card - Red */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-red-50 rounded-xl">
              <UserCheck className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
              Assigned
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Complaints Assigned to GrowTag</h3>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-red-600">{complaintsAssignedToGrowTag}</p>
          </div>
          <AnimatedProgressBar 
            widthKey="complaintsAssignedToGrowTag"
            colorFrom="#ef4444"
            colorTo="#dc2626"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaints Overview Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Complaints Overview</h2>
            <p className="text-gray-500 text-sm">Yearly assigned vs resolved complaints</p>
          </div>
          <div className="h-80">
            <Bar data={complaintsChart} options={complaintsChartOptions} />
          </div>
        </div>

        {/* Revenue Growth Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Revenue Growth</h2>
            <p className="text-gray-500 text-sm">Yearly revenue trend</p>
          </div>
          <div className="h-80">
            <Line data={revenueChart} options={revenueChartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}