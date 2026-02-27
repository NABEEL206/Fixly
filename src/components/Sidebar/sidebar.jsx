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

const isMobileView = () => window.innerWidth < 768;

export default function Sidebar({ isOpen, closeSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const [openMenus, setOpenMenus] = useState({});
  const isNavigating = useRef(false);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };



  // Role-based menu items configuration - Updated with actual roles
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
          { path: "/purchase-orders", label: "Purchase Orders" },
          { path: "/bills", label: "Bills" },
        ],
      },
      { path: "/invoice", label: "Invoice", icon: <Receipt size={20} /> },
      { path: "/stock", label: "Stock", icon: <Boxes size={20} /> },
      { path: "/reports", label: "Reports", icon: <BarChart3 size={20} /> },
    ],

    // FRANCHISE - Franchise shops
    FRANCHISE: [
      {
        path: "/franchisedashboard",
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

    // OTHERSHOP - Other shops
    OTHERSHOP: [
      {
        path: "/othershopdashboard",
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
  };

  // Get menu items based on role
  const getMenuItems = () => {
    if (!role) return [];
    
    // Return menu items for the specific role
    return roleBasedMenuItems[role] || [];
  };

  const menuItems = getMenuItems();

  const getSidebarHeader = () => {
    if (!user) return "Dashboard";

    // Handle different roles
    switch (role) {
      case "ADMIN":
        return "Fixly Admin";
      case "GROWTAG":
        return user?.name || "Grow Tag";
      case "FRANCHISE":
        return user?.name || "Franchise Shop";
      case "OTHERSHOP":
        return user?.name || "Other Shop";
      case "CUSTOMER":
        return user?.name || "Customer";
      default:
        return user?.name || "Dashboard";
    }
  };

  const getRoleDisplay = () => {
    if (!role) return "";

    // Handle different roles
    switch (role) {
      case "ADMIN":
        return "Admin";
      case "GROWTAG":
        return "Grow Tag";
      case "FRANCHISE":
        return "Franchise";
      case "OTHERSHOP":
        return "Other Shop";
      case "CUSTOMER":
        return "Customer";
      default:
        return role;
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-[#111827] text-white flex flex-col z-40
      transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Header with user info */}
      <div className="p-4 border-b border-gray-700">
        <div className="font-semibold text-lg truncate">{getSidebarHeader()}</div>
        <div className="text-xs text-gray-400 mt-1">{getRoleDisplay()}</div>
      </div>

      {/* Close mobile button */}
      <div className="p-3 flex justify-end md:hidden absolute top-2 right-2">
        <button
          onClick={closeSidebar}
          className="p-1 hover:bg-gray-700 rounded"
        >
          <X size={22} />
        </button>
      </div>

      {/* MENU */}
      <div className="flex-grow px-4 overflow-y-auto py-4">
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