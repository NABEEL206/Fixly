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

export default function GrowTagsDashboard() {
  const [animateStats, setAnimateStats] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({
    totalComplaints: 0,
    todayComplaints: 0,
    completedWork: 0,
    earnings: 0,
    pendingWork: 0,
    resolutionRate: 0,
  });

  // 🔐 Logged-in GrowTag details
  const growTagName = "Nabeel GrowTag";
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  // 📌 Complaint stats
  const totalAssignedComplaints = 86;
  const todayComplaints = 6;
  const completedWork = 52;
  const pendingWork = 34;
  const resolutionRate = Math.round((completedWork / totalAssignedComplaints) * 100);

  // 💰 Earnings
  const myEarnings = 32500;
  const lastMonthEarnings = 28900;
  const earningsGrowth = ((myEarnings - lastMonthEarnings) / lastMonthEarnings * 100).toFixed(1);

  // All months for charts
  const allMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Initialize animations
  useEffect(() => {
    setAnimateStats(true);
    
    const duration = 1500;
    const steps = 60;
    const increment = (target, current) => (target - current) / steps;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      
      setAnimatedValues({
        totalComplaints: Math.floor(progress * totalAssignedComplaints),
        todayComplaints: Math.floor(progress * todayComplaints),
        completedWork: Math.floor(progress * completedWork),
        earnings: Math.floor(progress * myEarnings),
        pendingWork: Math.floor(progress * pendingWork),
        resolutionRate: Math.floor(progress * resolutionRate),
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, []);

  // 📊 Complaints Chart
  const complaintsChart = {
    labels: allMonths,
    datasets: [
      {
        label: "Complaints Assigned",
        data: [10, 14, 12, 16, 18, 16, 14, 15, 17, 19, 20, 22],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgba(59, 130, 246, 1)",
        borderWidth: 2,
        borderRadius: 6,
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
      },
      {
        label: "Complaints Resolved",
        data: [8, 12, 10, 14, 16, 15, 13, 14, 16, 18, 19, 21],
        backgroundColor: "rgba(34, 197, 94, 0.8)",
        borderColor: "rgba(34, 197, 94, 1)",
        borderWidth: 2,
        borderRadius: 6,
        animation: {
          duration: 2000,
          delay: 500,
          easing: 'easeOutQuart'
        }
      },
    ],
  };

  // 📊 Earnings Chart
  const earningsChart = {
    labels: allMonths,
    datasets: [
      {
        label: "Earnings (₹)",
        data: [4000, 5500, 6200, 7100, 8600, 9100, 9800, 10500, 11200, 12000, 12800, 13500],
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
        animation: {
          duration: 2000,
          easing: 'easeOutQuart'
        }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header Section with Animation */}
      <div className="mb-8 animate-fade-in">
        <div className="transform transition-all duration-500 hover:scale-[1.01]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg animate-pulse-slow">
              <Activity className="w-6 h-6 text-blue-600 animate-bounce-slow" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600 animate-gradient bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {growTagName}
              </span>
            </h1>
          </div>
          <p className="text-gray-600 flex items-center gap-2 animate-slide-up">
            <Calendar className="w-4 h-4" />
            {today}
          </p>
        </div>
      </div>

      {/* Stats Grid with Staggered Animations */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Complaints Card - Blue */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-slide-up"
             style={{ animationDelay: '100ms' }}>
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-50 rounded-xl animate-pulse-slow">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-bounce-in">
              +12%
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
                width: '86%',
                animationDelay: '500ms'
              }}
            ></div>
          </div>
        </div>

        {/* Today's Complaints Card - Indigo */}
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
                width: '60%',
                animationDelay: '600ms'
              }}
            ></div>
          </div>
        </div>

        {/* Completed Work Card - Green */}
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

        {/* Earnings Card - Purple */}
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
                width: '65%',
                animationDelay: '800ms'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Charts Section with Animation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Complaints Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 transform transition-all duration-500 hover:scale-[1.01] animate-slide-up"
             style={{ animationDelay: '500ms' }}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Complaints Overview</h2>
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
            <h2 className="text-xl font-bold text-gray-900">Earnings Trend</h2>
            <p className="text-gray-500 text-sm">Yearly earnings growth</p>
          </div>
          <div className="h-80 animate-fade-in">
            <Line data={earningsChart} options={earningsChartOptions} />
          </div>
        </div>
      </div>

      {/* Pending Work Card - Yellow with Animation */}
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
                width: '40%',
                animationDelay: '900ms'
              }}
            ></div>
          </div>
        </div>
      </div>

    </div>
  );
}