import React, { useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FileWarning,
  Users,
  Store,
  Boxes,
  Receipt,
  X,
  LogOut,
  Home,
  AlertCircle,
  Briefcase,
  Building,
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Users2,
  ClipboardList,
  ChevronDown,
  ShoppingCart,
  UserCircle,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "/src/auth/AuthContext";
import toast from "react-hot-toast";

const isMobileView = () => window.innerWidth < 768;

export default function Sidebar({ isOpen, closeSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const shopType = user?.shop_type; // Get shop_type for SHOP role
  const [openMenus, setOpenMenus] = useState({});
  const isNavigating = useRef(false);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
    // Don't show logout confirmation if already navigating
    if (isNavigating.current) return;

    toast.custom(
      (t) => (
        <div
          className="flex flex-col gap-3 bg-white rounded-lg shadow-xl p-4 max-w-sm border border-gray-200"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-sm font-medium text-gray-800">
            Are you sure you want to logout?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 rounded-md text-sm bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                // Set navigating flag to prevent multiple toasts
                isNavigating.current = true;

                // Dismiss the confirmation toast
                toast.dismiss(t.id);

                try {
                  // Show loading state
                  const loadingToast = toast.loading("Logging out...");

                  // Perform logout
                  await logout();

                  // Update loading toast to success
                  toast.success("Logged out successfully", {
                    id: loadingToast,
                    duration: 2000,
                  });

                  // Small delay to ensure toast is visible before navigation
                  setTimeout(() => {
                    navigate("/login", { replace: true });
                    if (isMobileView()) closeSidebar();
                    // Reset navigating flag after navigation
                    setTimeout(() => {
                      isNavigating.current = false;
                    }, 500);
                  }, 500);
                } catch (error) {
                  console.error("Logout error:", error);
                  toast.error("Failed to logout. Please try again.");
                  isNavigating.current = false;
                }
              }}
              className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: "top-center",
        className: "z-[9999]",
      },
    );
  };

  // Role-based menu items configuration
  const roleBasedMenuItems = {
    // ADMIN - Full access
    ADMIN: [
      {
        path: "/admindashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      { path: "/leads", label: "Leads", icon: <TrendingUp size={20} /> },
      {
        path: "/complaints",
        label: "Complaints",
        icon: <FileWarning size={20} />,
      },
      { path: "/customers", label: "Customers", icon: <Users2 size={20} /> },
      { path: "/shops", label: "Shops", icon: <Store size={20} /> },
      { path: "/growtags", label: "Grow Tags", icon: <Users size={20} /> },
      {
        path: "/assign-growtags",
        label: "Assign Grow Tags",
        icon: <ClipboardList size={20} />,
      },
      { path: "/items", label: "Items", icon: <Package size={20} /> },
      { path: "/stock", label: "Stock", icon: <Boxes size={20} /> },
      {
        label: "Purchase",
        icon: <DollarSign size={20} />,
        children: [
          { path: "/vendors", label: "Vendors" },
          { path: "/expenses", label: "Expenses" },
          { path: "/purchase-orders", label: "Purchase Orders" },
          { path: "/bills", label: "Bills" },
        ],
      },
      { path: "/invoice", label: "Invoice", icon: <Receipt size={20} /> },
      { path: "/reports", label: "Reports", icon: <BarChart3 size={20} /> },
    ],

    // GROWTAG - Field technicians
    GROWTAG: [
      {
        path: "/growtagdashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        path: "/complaints",
        label: "Complaints",
        icon: <FileWarning size={20} />,
      },
      { path: "/customers", label: "Customers", icon: <Users2 size={20} /> },
      { path: "/shops", label: "Shops", icon: <Store size={20} /> },
       {
        label: "Purchase",
        icon: <DollarSign size={20} />,
        children: [
          // { path: "/vendors", label: "Vendors" },
          // { path: "/expenses", label: "Expenses" },
          { path: "/purchase-orders", label: "Purchase Orders" },
          { path: "/bills", label: "Bills" },
        ],
      },
      { path: "/invoice", label: "Invoice", icon: <Receipt size={20} /> },
      { path: "/stock", label: "Stock", icon: <Boxes size={20} /> },
      { path: "/reports", label: "Reports", icon: <BarChart3 size={20} /> },

    ],

    // CUSTOMER - End users
    CUSTOMER: [
      {
        path: "/customerdashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        path: "/customercomplaintself",
        label: "Register Complaint",
        icon: <FileWarning size={20} />,
      },
      {
        path: "/complaints",
        label: "My Complaints",
        icon: <AlertCircle size={20} />,
      },
      { path: "/invoice", label: "My Invoices", icon: <Receipt size={20} /> },
      {
        path: "/profile",
        label: "My Profile",
        icon: <UserCircle size={20} />,
      },
      {
        path: "/support",
        label: "Support",
        icon: <HelpCircle size={20} />,
      },
    ],

    // SHOP - Base shop menu (will be extended based on shop_type)
    SHOP: [
      {
        path: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={20} />,
      },
      {
        path: "/complaints",
        label: "Complaints",
        icon: <FileWarning size={20} />,
      },
      { path: "/customers", label: "Customers", icon: <Users2 size={20} /> },
      { path: "/shops", label: "Shops", icon: <Store size={20} /> },
      { path: "/growtags", label: "Grow Tags", icon: <Users size={20} /> },
      { path: "/invoice", label: "Invoice", icon: <Receipt size={20} /> },
      { path: "/reports", label: "Reports", icon: <BarChart3 size={20} /> },
      { path: "/stock", label: "Stock", icon: <Boxes size={20} /> },
      {
        label: "Purchase",
        icon: <DollarSign size={20} />,
        children: [
          { path: "/vendors", label: "Vendors" },
          { path: "/expenses", label: "Expenses" },
          { path: "/purchase-orders", label: "Purchase Orders" },
          { path: "/bills", label: "Bills" },
        ],
      },
    ],
  };

  // Get menu items based on role and shop_type
  const getMenuItems = () => {
    if (!role) return [];

    // Handle SHOP role with shop_type
    if (role === "SHOP") {
      const baseMenu = roleBasedMenuItems.SHOP || [];

      // Customize dashboard path based on shop_type
      const customizedMenu = baseMenu.map((item) => {
        if (item.path === "/dashboard") {
          // Set correct dashboard path based on shop_type
          if (shopType === "franchise") {
            return { ...item, path: "/franchisedashboard" };
          } else if (shopType === "othershop") {
            return { ...item, path: "/othershopdashboard" };
          }
        }
        return item;
      });

      return customizedMenu;
    }

    // For other roles, return directly from mapping
    return roleBasedMenuItems[role] || [];
  };

  const menuItems = getMenuItems();

  const getSidebarHeader = () => {
    if (!user) return "Dashboard";

    // Handle SHOP role with shop_type
    if (role === "SHOP") {
      if (shopType === "franchise") {
        return user?.name || "Franchise Shop";
      } else if (shopType === "othershop") {
        return user?.name || "Other Shop";
      }
      return user?.name || "Shop";
    }

    // Handle other roles
    switch (role) {
      case "ADMIN":
        return "Fixly Admin";
      case "GROWTAG":
        return user?.name || "Grow Tag";
      case "CUSTOMER":
        return user?.name || "Customer";
      default:
        return user?.name || "Dashboard";
    }
  };

  const getRoleDisplay = () => {
    if (!role) return "";

    // Handle SHOP role with shop_type
    if (role === "SHOP") {
      if (shopType === "franchise") {
        return "Franchise";
      } else if (shopType === "othershop") {
        return "Other Shop";
      }
      return "Shop";
    }

    // Handle other roles
    switch (role) {
      case "GROWTAG":
        return "Grow Tag";
      case "ADMIN":
        return "Admin";
      case "CUSTOMER":
        return "Customer";
      default:
        return role;
    }
  };

  // Add this for debugging
  console.log("Sidebar - User:", user);
  console.log("Sidebar - Role:", role);
  console.log("Sidebar - Shop Type:", shopType);
  console.log("Sidebar - Menu items:", menuItems);

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-[#111827] text-white flex flex-col z-40
      transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Close mobile */}
      <div className="p-3 flex justify-end md:hidden">
        <button
          onClick={closeSidebar}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <X size={22} />
        </button>
      </div>

      {/* MENU */}
      <div className="flex-grow px-4 overflow-y-auto py-4 mt-15">
        {menuItems.length > 0 ? (
          <nav className="space-y-1">
            {menuItems.map((item, idx) => {
              if (item.children) {
                const isOpen = openMenus[item.label];
                return (
                  <div key={idx}>
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                      text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                    >
                      {item.icon}
                      <span className="flex-grow text-sm text-left">
                        {item.label}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child, cIdx) => (
                          <NavLink
                            key={cIdx}
                            to={child.path}
                            onClick={() => {
                              if (isMobileView()) closeSidebar();
                            }}
                            className={({ isActive }) =>
                              `block px-3 py-1.5 rounded text-sm transition
                              ${
                                isActive
                                  ? "bg-[#2563EB] text-white font-medium"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-white"
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={idx}
                  to={item.path}
                  onClick={() => {
                    if (isMobileView()) closeSidebar();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                    ${
                      isActive
                        ? "bg-[#2563EB] text-white font-medium"
                        : "text-gray-300 hover:bg-gray-700 hover:text-white"
                    }`
                  }
                >
                  {item.icon}
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        ) : (
          <div className="text-gray-400 text-center py-4">
            No menu items available
          </div>
        )}
      </div>
    </div>
  );
}
