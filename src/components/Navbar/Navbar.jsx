import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "/src/auth/AuthContext";
import toast from "react-hot-toast";


export default function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
      });
      setCurrentTime(timeString);
    };

    // Update time immediately
    updateTime();
    
    // Update time every second
    const timeIntervalId = setInterval(updateTime, 1000);

    // Handle resize for mobile detection
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup intervals and listeners
    return () => {
      clearInterval(timeIntervalId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

const handleLogout = () => {
  // 🔑 Close any existing toasts first
  toast.dismiss();

  toast(
    (t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-800">
          Are you sure you want to logout?
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 rounded-md text-sm bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>

          <button
            onClick={() => {
              toast.dismiss(t.id);

              // 🔐 Clear session
              sessionStorage.clear();

              // 🔓 Logout
              logout();

              // 🔁 Redirect
              navigate("/login", { replace: true });

              // ♻️ Hard refresh (keeps your current logic)
              setTimeout(() => {
                window.location.reload();
              }, 50);
            }}
            className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: "top-center",
    }
  );
};


  // Role-based styling configuration
  const roleConfig = {
    ADMIN: {
      badgeColor: "bg-gradient-to-r from-purple-600 to-pink-600",
      icon: "👑",
      label: "Admin"
    },
    GROW_TAG: {
      badgeColor: "bg-gradient-to-r from-green-600 to-emerald-600",
      icon: "🏷️",
      label: "Grow Tag"
    },
    CUSTOMER: {
      badgeColor: "bg-gradient-to-r from-blue-600 to-cyan-600",
      icon: "👤",
      label: "Customer"
    },
    FRANCHISE: {
      badgeColor: "bg-gradient-to-r from-orange-600 to-amber-600",
      icon: "🏪",
      label: "Franchise"
    },
    OTHER_SHOP: {
      badgeColor: "bg-gradient-to-r from-red-600 to-pink-600",
      icon: "🛍️",
      label: "Other Shop"
    },
  };

  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-800 to-blue-700 text-white flex items-center px-3 md:px-6 shadow-lg z-50">
        <div className="flex items-center space-x-2 md:space-x-4">
          <button 
            onClick={toggleSidebar} 
            className="text-2xl md:text-3xl font-bold p-1 hover:opacity-80 transition-opacity hover:bg-blue-900/30 rounded-lg p-2"
          > 
            ☰
          </button>
          
          {/* Logo - Mobile Optimized */}
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
              <img
                src="/src/assets/Fixly_1_-removebg-preview (1).png"
                alt="Fixly Logo"
                className="w-6 h-6 md:w-8 md:h-8 object-contain"
              />
            </div>
            <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
              Fixly Mobiles
            </h1>
          </div>
        </div>
        <div className="ml-auto">
          <span className="text-xs md:text-sm text-gray-300">Loading...</span>
        </div>
      </nav>
    );
  }

  const currentRole = user.role.toUpperCase();
  const config = roleConfig[currentRole] || roleConfig.CUSTOMER;

  // Get clean user name (remove duplicates)
  const getUserDisplayName = () => {
    if (!user.name) {
      return user.email ? user.email.split('@')[0].replace('.', ' ') : "User";
    }
    
    const nameParts = user.name.split(' ');
    const uniqueParts = [];
    const seen = new Set();
    
    for (const part of nameParts) {
      const lowerPart = part.toLowerCase();
      if (!seen.has(lowerPart)) {
        seen.add(lowerPart);
        uniqueParts.push(part);
      }
    }
    
    return uniqueParts.join(' ');
  };

  const displayName = getUserDisplayName();
  const mobileTime = `${currentTime.split(':')[0]}:${currentTime.split(':')[1]}`;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-800 to-blue-700 text-white flex items-center px-2 md:px-6 shadow-lg z-50">
      
      {/* LEFT SIDE → Mobile Optimized Hamburger + Logo */}
      <div className="flex items-center space-x-1 md:space-x-3 min-w-0">
        {/* Hamburger Button - Always Visible */}
        <button 
          onClick={toggleSidebar} 
          className="
            w-10 h-10
            md:w-12 md:h-12
            flex items-center justify-center
            text-xl md:text-2xl font-bold
            hover:bg-blue-900/30 
            rounded-lg 
            transition-all duration-200
            active:scale-95
            shrink-0
          "
          aria-label="Toggle sidebar"
        > 
          ☰
        </button>

        {/* Logo Container - Mobile Optimized */}
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
          {/* Logo - Responsive sizing */}
          <div className="
            w-9 h-9
            md:w-12 md:h-12
            lg:w-14 lg:h-14
            bg-white 
            rounded-lg
            md:rounded-xl
            flex items-center justify-center 
            shadow-md
            hover:shadow-lg 
            transition-all duration-300
            overflow-hidden
            shrink-0
          ">
            <img
              src="/src/assets/Fixly_1_-removebg-preview (1).png"
              alt="Fixly Logo"
              className="
                w-7 h-7
                md:w-9 md:h-9
                lg:w-11 lg:h-11
                object-contain
                p-0.5
              "
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="text-blue-800 font-bold text-sm md:text-lg lg:text-xl">FM</div>';
              }}
            />
          </div>
          
          {/* Brand Name - Responsive text */}
          <div className="flex flex-col min-w-0">
            <h1 className="
              text-sm
              md:text-lg
              lg:text-xl
              font-bold 
              bg-gradient-to-r from-white to-gray-200 
              bg-clip-text text-transparent
              truncate
            ">
              Fixly Mobiles
            </h1>
            {/* Optional tagline - only on larger screens */}
            {!isMobile && (
              <span className="text-xs text-blue-200/80 truncate">
                Professional Management
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE → Mobile Optimized Controls */}
      <div className="ml-auto flex items-center space-x-2 md:space-x-4 lg:space-x-6 min-w-0"> 

        {/* Time Display - Responsive */}
        {!isMobile ? (
          // Desktop Time Display
          <div className="hidden md:flex flex-col items-end bg-blue-900/40 px-3 py-1.5 md:px-4 md:py-2 rounded-lg backdrop-blur-sm min-w-[100px]">
            <div className="flex items-center space-x-1 md:space-x-2">
              <span className="text-yellow-300 animate-pulse text-sm">🕒</span>
              <div className="text-xs md:text-sm font-mono font-bold">{currentTime}</div>
            </div>
            <div className="text-[10px] md:text-xs text-blue-200">Live Time</div>
          </div>
        ) : (
          // Mobile Time Display - Compact
          <div className="flex items-center bg-blue-900/40 px-2 py-1 rounded-lg backdrop-blur-sm min-w-[60px] justify-center">
            <div className="text-xs font-mono font-semibold">{mobileTime}</div>
          </div>
        )}

        {/* User Display - Mobile Optimized */}
        <div className="relative group">
          <div className="
            flex items-center 
            bg-blue-900/30 
            px-2 py-1.5
            md:px-3 md:py-2 
            rounded-xl 
            hover:bg-blue-900/40 
            transition-all 
            cursor-default 
            backdrop-blur-sm
            min-w-0
          ">
            {/* User Icon - Responsive */}
            <div className={`
              w-7 h-7
              md:w-8 md:h-8
              lg:w-9 lg:h-9
              rounded-full 
              ${config.badgeColor} 
              flex items-center justify-center
              shrink-0
            `}>
              <span className="text-xs md:text-sm lg:text-base">{config.icon}</span>
            </div>
            
            {/* User Info - Hidden on mobile, visible on desktop */}
            {!isMobile && (
              <div className="hidden md:block ml-2 min-w-0">
                <div className="text-xs lg:text-sm font-bold truncate max-w-[80px] lg:max-w-[100px]">
                  {displayName}
                </div>
                <div className="text-[10px] lg:text-xs text-gray-300 truncate">
                  {config.label}
                </div>
              </div>
            )}
          </div>
          
          {/* User Info Tooltip - Shows on hover */}
          <div className="
            absolute right-0 top-full mt-2 
            hidden group-hover:block 
            bg-gray-900/95 backdrop-blur-sm 
            text-white px-4 py-3 
            rounded-lg text-sm 
            shadow-2xl z-50 
            min-w-[220px] 
            border border-gray-700
          ">
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${config.badgeColor} flex items-center justify-center`}>
                <span className="text-lg">{config.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="font-bold truncate">{displayName}</div>
                <div className="text-xs text-gray-300">{config.label}</div>
              </div>
            </div>
            <div className="space-y-2 border-t border-gray-700 pt-3">
              {user.email && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs">Email:</span>
                  <span className="font-semibold text-xs truncate ml-2">{user.email}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-xs">Phone:</span>
                  <span className="font-semibold text-xs">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-xs">Status:</span>
                <span className="text-green-400 text-xs font-semibold">● Online</span>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button - Mobile Optimized */}
        <div className="relative group shrink-0">
          <button
            onClick={handleLogout}
            className="
              flex items-center justify-center
              bg-gradient-to-r from-red-600 to-red-700 
              w-9 h-9
              md:w-auto md:h-auto md:px-4 md:py-2.5
              rounded-lg 
              hover:from-red-700 hover:to-red-800 
              transition-all 
              shadow-md hover:shadow-xl 
              active:scale-95
            "
            aria-label="Logout"
          >
            {/* Logout Icon - Responsive */}
            <svg 
              className="
                w-4 h-4
                md:w-5 md:h-5
                lg:w-6 lg:h-6 
                transform group-hover:translate-x-0.5 
                transition-transform
              " 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            
            {/* Logout Text - Hidden on mobile */}
            <span className="hidden md:inline font-medium ml-1 text-sm lg:text-base">
              Logout
            </span>
          </button>
          
          {/* Logout Tooltip - Shows on hover */}
          <div className="
            absolute right-0 top-full mt-2 
            hidden group-hover:block 
            bg-gray-900/95 backdrop-blur-sm 
            text-white px-3 py-2 
            rounded-lg text-sm 
            shadow-xl z-50 
            whitespace-nowrap 
            border border-gray-700
          ">
            <div className="font-semibold text-xs md:text-sm">Sign Out</div>
            <div className="text-[10px] md:text-xs text-gray-300">End current session</div>
          </div>
        </div>

      </div>

    </nav>
  );
}