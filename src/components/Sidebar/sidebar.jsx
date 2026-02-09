import React, { useState } from "react";
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
} from "lucide-react";
import { useAuth } from "/src/auth/AuthContext";
import toast from "react-hot-toast";

const isMobileView = () => window.innerWidth < 768;

export default function Sidebar({ isOpen, closeSidebar }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;
  const [openMenus, setOpenMenus] = useState({});

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLogout = () => {
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
              className="px-3 py-1.5 rounded-md text-sm bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                toast.success("Logged out successfully");
                setTimeout(() => {
                  logout();
                  navigate("/login");
                  if (isMobileView()) closeSidebar();
                }, 200);
              }}
              className="px-3 py-1.5 rounded-md text-sm bg-red-600 text-white"
            >
              Logout
            </button>
          </div>
        </div>
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const roleBasedMenuItems = {
    ADMIN: [
      { path: "/admindashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      { path: "/leads", label: "Leads", icon: <TrendingUp size={20} /> },
      { path: "/complaints", label: "Complaints", icon: <FileWarning size={20} /> },
      { path: "/customers", label: "Customers", icon: <Users2 size={20} /> },
      { path: "/shops", label: "Shops", icon: <Store size={20} /> },
      { path: "/growtags", label: "Grow Tags", icon: <Users size={20} /> },
      { path: "/assign-growtags", label: "Assign Grow Tags", icon: <ClipboardList size={20} /> },
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
  };

  const menuItems = roleBasedMenuItems[role] || [];

  const getSidebarHeader = () => {
    switch (role) {
      case "ADMIN":
        return "Fixly Admin";
      case "GROW_TAG":
        return user?.name || "Grow Tag";
      case "CUSTOMER":
        return user?.name || "Customer";
      case "FRANCHISE":
        return user?.name || "Franchise";
      case "OTHER_SHOP":
        return user?.name || "Shop";
      default:
        return "Dashboard";
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 h-screen w-64 bg-[#111827] text-white flex flex-col z-40
      transform transition-transform duration-300
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      {/* Close mobile */}
      <div className="p-3 flex justify-end md:hidden">
        <button onClick={closeSidebar} className="p-1 hover:bg-gray-700 rounded">
          <X size={22} />
        </button>
      </div>

      {/* Header */}
      <div className="px-4 pt-3 pb-4 text-center">
        <h1 className="text-lg font-bold truncate">{getSidebarHeader()}</h1>
        <p className="text-gray-400 text-xs capitalize truncate">
          {role?.toLowerCase().replace("_", " ")}
        </p>
      </div>

      {/* MENU */}
      <div className="flex-grow px-4 overflow-y-auto">
        <nav className="space-y-1">
          {menuItems.map((item, idx) => {
            if (item.children) {
              const isOpen = openMenus[item.label];
              return (
                <div key={idx}>
                  <button
                    onClick={() => toggleMenu(item.label)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                    text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    {item.icon}
                    <span className="flex-grow text-sm text-left">{item.label}</span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isOpen && (
                    <div className="ml-8 mt-1 space-y-1">
                      {item.children.map((child, cIdx) => (
                        <NavLink
                          key={cIdx}
                          to={child.path}
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
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                  ${
                    isActive
                      ? "bg-[#2563EB] text-white font-medium border-l-2 border-white shadow-sm"
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
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg
          bg-red-600 hover:bg-red-700 text-sm"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );
}
