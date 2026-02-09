import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { BASE_URL } from "@/API/BaseURL";
import {
  Package,
  Store,
  Building2,
  Tag,
  Search,
  Filter,
  Save,
  X,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  ChevronDown,
  User,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

// Axios instance with Authorization
const api = axios.create({
  baseURL: BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Stock Location Types
const STOCK_TYPES = {
  FRANCHISE: "franchise",
  OTHER_SHOP: "other_shop",
  GROW_TAG: "grow_tag",
};

const STOCK_TYPE_LABELS = {
  franchise: "Franchise",
  other_shop: "Other Shop",
  grow_tag: "Grow Tag",
};

// Reduced Demo data - only 2 items per type
const DEMO_DATA = {
  franchise: [
    {
      id: 1,
      name: "iPhone 15 Pro",
      sku: "IP15P-256-BLK",
      category: "electronics",
      quantity: 25,
      cost_price: 89999,
      selling_price: 99999,
      image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400",
      description: "Latest iPhone with A17 Pro chip",
      franchise: "Main Franchise",
      franchise_id: "F001",
      franchise_location: "Mumbai",
      min_stock: 10,
      max_stock: 50,
      created_at: "2024-01-15",
      updated_at: "2024-01-30",
    },
    {
      id: 2,
      name: "MacBook Air M2",
      sku: "MBA-M2-512",
      category: "electronics",
      quantity: 5,
      cost_price: 109999,
      selling_price: 129999,
      image: "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400",
      description: "Lightweight laptop with Apple Silicon",
      franchise: "South Franchise",
      franchise_id: "F002",
      franchise_location: "Bangalore",
      min_stock: 3,
      max_stock: 15,
      created_at: "2024-01-10",
      updated_at: "2024-01-28",
    },
  ],
  other_shop: [
    {
      id: 6,
      name: "Logitech MX Master 3S",
      sku: "LOG-MX3S",
      category: "electronics",
      quantity: 35,
      cost_price: 8999,
      selling_price: 10999,
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400",
      description: "Premium wireless mouse",
      shop: "Tech Gadgets Store",
      shop_id: "S001",
      shop_location: "Kolkata",
      min_stock: 15,
      max_stock: 60,
      created_at: "2024-01-18",
      updated_at: "2024-01-30",
    },
    {
      id: 7,
      name: "Samsung 4K Monitor",
      sku: "SAM-32UHD",
      category: "hardwares",
      quantity: 3,
      cost_price: 32999,
      selling_price: 39999,
      image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400",
      description: "32-inch 4K UHD monitor",
      shop: "Office Supplies Plus",
      shop_id: "S004",
      shop_location: "Pune",
      min_stock: 2,
      max_stock: 10,
      created_at: "2024-01-28",
      updated_at: "2024-01-30",
    },
  ],
  grow_tag: [  // Changed to show student names instead of tag names
    {
      id: 11,
      name: "iPhone Screen Protector",
      sku: "ISP-15-GLAS",
      category: "repair_parts",
      quantity: 120,
      cost_price: 499,
      selling_price: 999,
      image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400",
      description: "Tempered glass for iPhone 15 series",
      student_name: "Manhar",  // Changed from tag to student_name
      student_id: "ST001",     // Changed from tag_id to student_id
      student_location: "Room 101",  // Changed from tag_location
      min_stock: 50,
      max_stock: 200,
      created_at: "2024-01-15",
      updated_at: "2024-01-30",
    },
    {
      id: 12,
      name: "USB-C Charging Cable",
      sku: "USB-C-2M",
      category: "consumables",
      quantity: 45,
      cost_price: 299,
      selling_price: 599,
      image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
      description: "2m fast charging USB-C cable",
      student_name: "Manu",    // Changed from tag to student_name
      student_id: "ST002",     // Changed from tag_id to student_id
      student_location: "Room 102",  // Changed from tag_location
      min_stock: 20,
      max_stock: 100,
      created_at: "2024-01-20",
      updated_at: "2024-01-29",
    },
  ],
};

// Options
const FRANCHISE_OPTIONS = [
  { value: "all", label: "All Franchises" },
  { value: "F001", label: "Main Franchise" },
  { value: "F002", label: "South Franchise" },
];

const SHOP_OPTIONS = [
  { value: "all", label: "All Shops" },
  { value: "S001", label: "Tech Gadgets Store" },
  { value: "S004", label: "Office Supplies Plus" },
];

const STUDENT_OPTIONS = [  // Changed from GROW_TAG_OPTIONS to STUDENT_OPTIONS
  { value: "all", label: "All Growtags" },
  { value: "ST001", label: "Manhar" },
  { value: "ST002", label: "Manu" },
];

const CATEGORIES = [
  { id: "All", name: "All Categories" },
  { id: "electronics", name: "Electronics" },
  { id: "hardwares", name: "Hardwares" },
  { id: "repair_parts", name: "Repair Parts" },
  { id: "consumables", name: "Consumables" },
];

// Enhanced Dropdown Component - Fixed focus issues
const EnhancedDropdown = ({ options, selectedValue, onSelect, placeholder, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue) || options[0];

  const filteredOptions = useMemo(() => {
    if (!searchValue) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchValue("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          setSearchValue(""); // Clear search when opening
        }}
        className="flex items-center gap-2 border-2 p-2 rounded-lg text-sm bg-white cursor-pointer hover:border-blue-500 transition min-w-[200px] focus:outline-none focus:border-blue-500"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
            setSearchValue("");
          }
        }}
      >
        {Icon && <Icon size={16} className="text-gray-500" />}
        <span className="flex-1 text-left truncate">{selectedOption.label}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border rounded-lg shadow-lg z-50 max-h-60 overflow-hidden">
          <div className="p-2 border-b">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`Search ${placeholder.toLowerCase()}...`}
                className="w-full p-2 pl-8 border rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                    setSearchValue("");
                  }
                }}
              />
              <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              {searchValue && (
                <button
                  onClick={() => setSearchValue("")}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="py-1 max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect(option.value);
                    setIsOpen(false);
                    setSearchValue("");
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm ${
                    selectedValue === option.value ? "bg-blue-100 text-blue-700" : "text-gray-700"
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect(option.value);
                      setIsOpen(false);
                      setSearchValue("");
                    }
                  }}
                >
                  {option.label}
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Stock = () => {
  const [activeTab, setActiveTab] = useState(STOCK_TYPES.FRANCHISE);
  const [stockData, setStockData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedEntity, setSelectedEntity] = useState("all");
  
  const searchInputRef = useRef(null);

  const [adjustmentModal, setAdjustmentModal] = useState({
    isOpen: false,
    item: null,
    quantity: 0,
    type: "add",
    reason: "",
  });

  const [viewModal, setViewModal] = useState({
    isOpen: false,
    item: null,
  });

  // Create stable callbacks
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 10);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 10);
    }
  }, []);

  // Focus search input on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchStockData = () => {
    const data = DEMO_DATA[activeTab] || [];
    setStockData(data);
  };

  useEffect(() => {
    fetchStockData();
    setSelectedEntity("all");
    setSearchTerm("");
    setFilterCategory("All");
    setFilterStatus("All");
  }, [activeTab]);

  // Focus search input when tab changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 50);
    
    return () => clearTimeout(timer);
  }, [activeTab]);

  const getItemEntityName = (item) => {
    if (activeTab === STOCK_TYPES.FRANCHISE) {
      return item.franchise || "Unknown Franchise";
    } else if (activeTab === STOCK_TYPES.OTHER_SHOP) {
      return item.shop || "Unknown Shop";
    } else if (activeTab === STOCK_TYPES.GROW_TAG) {
      return item.student_name || "Unknown Student";
    }
    return "Unknown";
  };

  const getItemEntityLabel = (item) => {
    if (activeTab === STOCK_TYPES.FRANCHISE) {
      return `${item.franchise || "Unknown Franchise"}`;
    } else if (activeTab === STOCK_TYPES.OTHER_SHOP) {
      return `${item.shop || "Unknown Shop"}`;
    } else if (activeTab === STOCK_TYPES.GROW_TAG) {
      return `${item.student_name || "Unknown Student"}`;
    }
    return "Unknown";
  };

  const getEntityId = (item) => {
    if (activeTab === STOCK_TYPES.FRANCHISE) {
      return item.franchise_id;
    } else if (activeTab === STOCK_TYPES.OTHER_SHOP) {
      return item.shop_id;
    } else if (activeTab === STOCK_TYPES.GROW_TAG) {
      return item.student_id;
    }
    return null;
  };

  const filteredStock = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    return stockData.filter((item) => {
      const entityName = getItemEntityLabel(item);
      const searchableText = `${item.name} ${item.sku} ${item.category} ${entityName}`.toLowerCase();
      const matchesSearch = !searchLower || searchableText.includes(searchLower);

      const matchesCategory = filterCategory === "All" || item.category === filterCategory;

      const matchesStatus =
        filterStatus === "All" ||
        (filterStatus === "In Stock" && item.quantity > 10) ||
        (filterStatus === "Low Stock" && item.quantity > 0 && item.quantity <= 10) ||
        (filterStatus === "Out of Stock" && item.quantity === 0);

      const itemEntityId = getEntityId(item);
      const matchesEntity = selectedEntity === "all" || itemEntityId === selectedEntity;

      return matchesSearch && matchesCategory && matchesStatus && matchesEntity;
    });
  }, [stockData, searchTerm, filterCategory, filterStatus, selectedEntity, activeTab]);

  const getStockStatus = (quantity) => {
    if (quantity > 10) {
      return { label: "In Stock", bgColor: "bg-green-100", textColor: "text-green-800" };
    } else if (quantity > 0) {
      return { label: "Low Stock", bgColor: "bg-yellow-100", textColor: "text-yellow-800" };
    } else {
      return { label: "Out of Stock", bgColor: "bg-red-100", textColor: "text-red-800" };
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustmentModal.item) return;

    const toastId = toast.loading("Adjusting stock...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      setStockData((prevData) =>
        prevData.map((item) =>
          item.id === adjustmentModal.item.id
            ? {
                ...item,
                quantity:
                  adjustmentModal.type === "add"
                    ? item.quantity + adjustmentModal.quantity
                    : Math.max(0, item.quantity - adjustmentModal.quantity),
                updated_at: new Date().toISOString().split("T")[0],
              }
            : item,
        ),
      );

      toast.success("Stock adjusted successfully!", { id: toastId });
      closeAdjustmentModal();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error("Failed to adjust stock", { id: toastId });
    }
  };

  const openAdjustmentModal = (item, type = "add") => {
    setAdjustmentModal({ isOpen: true, item, quantity: 0, type, reason: "" });
  };

  const closeAdjustmentModal = () => {
    setAdjustmentModal({ isOpen: false, item: null, quantity: 0, type: "add", reason: "" });
  };

  const openViewModal = (item) => {
    setViewModal({ isOpen: true, item });
  };

  const closeViewModal = () => {
    setViewModal({ isOpen: false, item: null });
  };

  const totalItems = useMemo(() => {
    return filteredStock.reduce((total, item) => total + item.quantity, 0);
  }, [filteredStock]);

  const StockStats = () => {
    const inStock = filteredStock.filter((item) => item.quantity > 10).length;
    const lowStock = filteredStock.filter((item) => item.quantity > 0 && item.quantity <= 10).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock</p>
              <p className="text-2xl font-bold text-green-600">{inStock}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TabNavigation = () => {
    const getTabIcon = (type) => {
      switch (type) {
        case STOCK_TYPES.FRANCHISE:
          return <Building2 size={18} />;
        case STOCK_TYPES.OTHER_SHOP:
          return <Store size={18} />;
        case STOCK_TYPES.GROW_TAG:
          return <User size={18} />;
        default:
          return <Package size={18} />;
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="flex overflow-x-auto">
          {Object.values(STOCK_TYPES).map((type) => {
            const isActive = activeTab === type;

            return (
              <button
                key={type}
                onClick={() => {
                  setActiveTab(type);
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {getTabIcon(type)}
                <span>{STOCK_TYPE_LABELS[type]} Stock</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-600"}`}>
                  {stockData.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const FilterBar = () => {
    const getEntityOptions = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return FRANCHISE_OPTIONS;
        case STOCK_TYPES.OTHER_SHOP:
          return SHOP_OPTIONS;
        case STOCK_TYPES.GROW_TAG:
          return STUDENT_OPTIONS;
        default:
          return [];
      }
    };

    const getEntityIcon = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return Building2;
        case STOCK_TYPES.OTHER_SHOP:
          return Store;
        case STOCK_TYPES.GROW_TAG:
          return User;
        default:
          return Package;
      }
    };

    const getEntityPlaceholder = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return "franchises";
        case STOCK_TYPES.OTHER_SHOP:
          return "shops";
        case STOCK_TYPES.GROW_TAG:
          return "students";
        default:
          return "entities";
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="relative w-full md:w-96">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, SKU, category, or entity..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="w-full border-2 p-3 pl-10 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              autoComplete="off"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                type="button"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <EnhancedDropdown
              options={getEntityOptions()}
              selectedValue={selectedEntity}
              onSelect={setSelectedEntity}
              placeholder={getEntityPlaceholder()}
              icon={getEntityIcon()}
            />

            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <EnhancedDropdown
                options={CATEGORIES.map((cat) => ({ value: cat.id, label: cat.name }))}
                selectedValue={filterCategory}
                onSelect={setFilterCategory}
                placeholder="categories"
              />
            </div>

            <EnhancedDropdown
              options={[
                { value: "All", label: "All Status" },
                { value: "In Stock", label: "In Stock" },
                { value: "Low Stock", label: "Low Stock" },
                { value: "Out of Stock", label: "Out of Stock" },
              ]}
              selectedValue={filterStatus}
              onSelect={setFilterStatus}
              placeholder="status"
            />
          </div>
        </div>
      </div>
    );
  };

  const StockTable = () => {
    const getTableHeaderForEntity = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return "Franchise Name";
        case STOCK_TYPES.OTHER_SHOP:
          return "Shop Name";
        case STOCK_TYPES.GROW_TAG:
          return "Grow tags";
        default:
          return "Entity";
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredStock.map((item) => item.id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    checked={selectedItems.length === filteredStock.length && filteredStock.length > 0}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                </th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700 min-w-[250px]">Item Details</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Category</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">{getTableHeaderForEntity()}</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Current Stock</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="text-gray-400 mb-3" />
                      <p className="text-gray-600 text-lg font-medium">No stock items found</p>
                      <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const status = getStockStatus(item.quantity);

                  return (
                    <tr key={item.id} className={`border-b hover:bg-gray-50 transition ${selectedItems.includes(item.id) ? "bg-blue-50" : ""}`}>
                      <td className="py-4 px-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, item.id]);
                            } else {
                              setSelectedItems(selectedItems.filter((id) => id !== item.id));
                            }
                          }}
                          className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg border" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                            <p className="text-xs text-gray-500">SKU: {item.sku || "N/A"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {item.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-700">{getItemEntityLabel(item)}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">{item.quantity}</span>
                          <span className="text-xs text-gray-500">units</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-gray-900">₹{(item.cost_price || 0).toFixed(2)}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openViewModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openAdjustmentModal(item, "add")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                            title="Add Stock"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => openAdjustmentModal(item, "remove")}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                            title="Remove Stock"
                          >
                            <Minus size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const MobileStockCards = () => {
    const getEntityLabelForCard = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return "Franchise";
        case STOCK_TYPES.OTHER_SHOP:
          return "Shop";
        case STOCK_TYPES.GROW_TAG:
          return "Student";
        default:
          return "Entity";
      }
    };

    return (
      <div className="md:hidden space-y-4">
        {filteredStock.length === 0 ? (
          <div className="text-center py-10">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 text-lg font-medium">No stock items found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters or search term</p>
          </div>
        ) : (
          filteredStock.map((item) => {
            const status = getStockStatus(item.quantity);

            return (
              <div key={item.id} className="bg-white rounded-xl shadow border p-4 space-y-4">
                <div className="flex items-start gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg border" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package size={24} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">SKU: {item.sku || "N/A"}</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        {item.category || "Uncategorized"}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">{getEntityLabelForCard()}</p>
                  <p className="text-sm text-gray-700 font-medium">{getItemEntityLabel(item)}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">Current Stock</p>
                    <p className="text-xl font-bold text-gray-900">{item.quantity}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                      {status.label}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Unit Price</p>
                    <p className="text-sm font-medium text-gray-900">₹{(item.cost_price || 0).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => openViewModal(item)}
                    className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-100 transition font-medium flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    onClick={() => openAdjustmentModal(item, "add")}
                    className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm hover:bg-green-100 transition font-medium flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                  <button
                    onClick={() => openAdjustmentModal(item, "remove")}
                    className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm hover:bg-red-100 transition font-medium flex items-center justify-center gap-1 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                  >
                    <Minus size={14} /> Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  const AdjustmentModal = () => {
    if (!adjustmentModal.isOpen || !adjustmentModal.item) return null;

    const isAdd = adjustmentModal.type === "add";
    const currentStock = adjustmentModal.item.quantity;
    const newStock = isAdd ? currentStock + adjustmentModal.quantity : Math.max(0, currentStock - adjustmentModal.quantity);

    const getEntityLabelForModal = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return "Franchise:";
        case STOCK_TYPES.OTHER_SHOP:
          return "Shop:";
        case STOCK_TYPES.GROW_TAG:
          return "Student:";
        default:
          return "Entity:";
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className={`p-4 border-b ${isAdd ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAdd ? <Plus className="text-green-600" size={24} /> : <Minus className="text-red-600" size={24} />}
                <h2 className="text-lg font-semibold text-gray-900">{isAdd ? "Add" : "Remove"} Stock</h2>
              </div>
              <button 
                onClick={closeAdjustmentModal} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{adjustmentModal.item.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                SKU: {adjustmentModal.item.sku || "N/A"} | {getEntityLabelForModal()} {getItemEntityLabel(adjustmentModal.item)}
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Current Stock:</span>
              <span className="text-lg font-bold text-gray-900">{currentStock} units</span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Quantity to {isAdd ? "Add" : "Remove"}</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjustmentModal((prev) => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  value={adjustmentModal.quantity}
                  onChange={(e) => setAdjustmentModal((prev) => ({ ...prev, quantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                  className="flex-1 border-2 p-2 rounded-lg text-center text-lg font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setAdjustmentModal((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${isAdd ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">New Stock:</span>
                <span className={`text-xl font-bold ${isAdd ? "text-green-600" : "text-red-600"}`}>{newStock} units</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                {isAdd ? <TrendingUp size={16} className="text-green-600" /> : <TrendingDown size={16} className="text-red-600" />}
                <span className={`text-xs ${isAdd ? "text-green-600" : "text-red-600"}`}>
                  {isAdd ? "+" : "-"}
                  {adjustmentModal.quantity} units
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Reason for Adjustment</label>
              <textarea
                value={adjustmentModal.reason}
                onChange={(e) => setAdjustmentModal((prev) => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for stock adjustment..."
                className="w-full border-2 p-3 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                rows="3"
              />
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={closeAdjustmentModal}
              className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustStock}
              disabled={adjustmentModal.quantity === 0}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                isAdd ? "bg-green-600 hover:bg-green-700 focus:ring-green-500" : "bg-red-600 hover:bg-red-700 focus:ring-red-500"
              }`}
            >
              <Save size={16} />
              Confirm {isAdd ? "Addition" : "Removal"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ViewDetailsModal = () => {
    if (!viewModal.isOpen || !viewModal.item) return null;

    const item = viewModal.item;
    const status = getStockStatus(item.quantity);

    const getEntityLabelForModal = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return "Franchise Name";
        case STOCK_TYPES.OTHER_SHOP:
          return "Shop Name";
        case STOCK_TYPES.GROW_TAG:
          return "Student Name";
        default:
          return "Entity Name";
      }
    };

    const getEntityValue = () => {
      return getItemEntityLabel(item);
    };

    const getEntityLocation = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return item.franchise_location || "N/A";
        case STOCK_TYPES.OTHER_SHOP:
          return item.shop_location || "N/A";
        case STOCK_TYPES.GROW_TAG:
          return item.student_location || "N/A";
        default:
          return "N/A";
      }
    };

    const getLocationLabel = () => {
      switch (activeTab) {
        case STOCK_TYPES.FRANCHISE:
          return "Franchise Location";
        case STOCK_TYPES.OTHER_SHOP:
          return "Shop Location";
        case STOCK_TYPES.GROW_TAG:
          return "Student Location";
        default:
          return "Location";
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b bg-blue-50 sticky top-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={20} className="text-blue-600" />
                Stock Details
              </h2>
              <button 
                onClick={closeViewModal} 
                className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-lg border" />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package size={32} className="text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">SKU: {item.sku || "N/A"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {item.category || "Uncategorized"}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Entity Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Entity Type</p>
                  <p className="text-sm font-medium text-gray-900">{STOCK_TYPE_LABELS[activeTab]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{getEntityLabelForModal()}</p>
                  <p className="text-sm font-medium text-gray-900">{getEntityValue()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">{getLocationLabel()}</p>
                  <p className="text-sm font-medium text-gray-900">{getEntityLocation()}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Current Stock</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {item.quantity} <span className="text-sm text-gray-500">units</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Unit Price</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">₹{(item.cost_price || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Selling Price:</span>
                  <span className="font-medium text-green-600">₹{(item.selling_price || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Min Stock Level:</span>
                  <span className="font-medium text-gray-900">{item.min_stock || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Max Stock Level:</span>
                  <span className="font-medium text-gray-900">{item.max_stock || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-gray-900">{item.updated_at || "N/A"}</span>
                </div>
                {item.description && (
                  <div className="py-2">
                    <span className="text-gray-600 block mb-1">Description:</span>
                    <p className="text-gray-900">{item.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={() => {
                closeViewModal();
                openAdjustmentModal(item, "add");
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            >
              <Plus size={16} />
              Add Stock
            </button>
            <button
              onClick={() => {
                closeViewModal();
                openAdjustmentModal(item, "remove");
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              <Minus size={16} />
              Remove Stock
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-blue-700">Stock Management</h1>
              <p className="text-sm md:text-base text-gray-600 mt-1">Monitor and adjust stock across all locations</p>
            </div>
          </div>
        </div>

        <TabNavigation />
        <StockStats />
        <FilterBar />
        
        <div className="hidden md:block">
          <StockTable />
        </div>

        <MobileStockCards />
        <AdjustmentModal />
        <ViewDetailsModal />
      </div>
    </div>
  );
};

export default Stock;