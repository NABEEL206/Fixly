import React, { useState, useMemo, useEffect, useRef } from "react";
import axiosInstance from "@/API/axiosInstance";
import {
  Package,
  Store,
  Building2,
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
import toast from "react-hot-toast";

// Stock Location Types
const STOCK_TYPES = {
  FRANCHISE: "franchise",
  OTHER_SHOP: "other_shop",
  GROW_TAG: "grow_tag",
};

const STOCK_TYPE_LABELS = {
  franchise: "Franchise Stock",
  other_shop: "Other Shop Stock",
  grow_tag: "Grow Tag Stock",
};

// Helper functions for entity names and headers
const getEntityHeaderForTab = (activeTab) => {
  switch (activeTab) {
    case STOCK_TYPES.FRANCHISE:
      return "Franchise";
    case STOCK_TYPES.OTHER_SHOP:
      return "Shop";
    case STOCK_TYPES.GROW_TAG:
      return "Grow Tag";
    default:
      return "Entity";
  }
};

const getItemEntityNameForTab = (item, activeTab) => {
  switch (activeTab) {
    case STOCK_TYPES.FRANCHISE:
      return item.shop_name || "Unknown Franchise";
    case STOCK_TYPES.OTHER_SHOP:
      return item.shop_name || "Unknown Shop";
    case STOCK_TYPES.GROW_TAG:
      return item.growtag || "Unknown Grow Tag";
    default:
      return "Unknown";
  }
};

const getStockStatus = (quantity) => {
  const qty = parseFloat(quantity) || 0;
  if (qty > 10) {
    return { label: "In Stock", bgColor: "bg-green-100", textColor: "text-green-800" };
  } else if (qty > 0) {
    return { label: "Low Stock", bgColor: "bg-yellow-100", textColor: "text-yellow-800" };
  } else {
    return { label: "Out of Stock", bgColor: "bg-red-100", textColor: "text-red-800" };
  }
};

// Get unique franchises from API data
const getUniqueFranchises = (data) => {
  const franchises = new Set();
  data
    .filter(item => item.owner_type === 'shop' && item.shop_type === 'franchise')
    .forEach(item => {
      if (item.shop_name) {
        franchises.add(JSON.stringify({
          value: item.shop?.toString(),
          label: item.shop_name
        }));
      }
    });
  return Array.from(franchises).map(f => JSON.parse(f));
};

// Get unique shops from API data
const getUniqueShops = (data) => {
  const shops = new Set();
  data
    .filter(item => item.owner_type === 'shop' && item.shop_type !== 'franchise')
    .forEach(item => {
      if (item.shop_name) {
        shops.add(JSON.stringify({
          value: item.shop?.toString(),
          label: item.shop_name
        }));
      }
    });
  return Array.from(shops).map(s => JSON.parse(s));
};

// Get unique grow tags from API data
const getUniqueGrowTags = (data) => {
  const growTags = new Set();
  data
    .filter(item => item.owner_type === 'grow_tag')
    .forEach(item => {
      if (item.growtag) {
        growTags.add(JSON.stringify({
          value: item.growtag?.toString(),
          label: item.growtag
        }));
      }
    });
  return Array.from(growTags).map(g => JSON.parse(g));
};

// Get unique items from API data
const getUniqueItems = (data) => {
  const items = new Set();
  data.forEach(item => {
    if (item.item_name) {
      items.add(JSON.stringify({
        value: item.item?.toString(),
        label: item.item_name
      }));
    }
  });
  return Array.from(items).map(item => JSON.parse(item));
};

// Categories
const CATEGORIES = [
  { id: "All", name: "All Categories" },
  { id: "electronics", name: "Electronics" },
  { id: "hardwares", name: "Hardwares" },
  { id: "repair_parts", name: "Repair Parts" },
  { id: "consumables", name: "Consumables" },
];

// Enhanced Dropdown Component
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

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isOpen]);

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
        onClick={() => {
          setIsOpen(!isOpen);
          setSearchValue("");
        }}
        className="flex items-center gap-2 border-2 p-2 rounded-lg text-sm bg-white cursor-pointer hover:border-blue-500 transition min-w-[200px] focus:outline-none focus:border-blue-500"
      >
        {Icon && <Icon size={16} className="text-gray-500" />}
        <span className="flex-1 text-left truncate">{selectedOption?.label || placeholder}</span>
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
              />
              <Search size={14} className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              {searchValue && (
                <button
                  onClick={() => setSearchValue("")}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                  onClick={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                    setSearchValue("");
                  }}
                  className={`w-full text-left px-4 py-2 hover:bg-blue-50 transition text-sm ${
                    selectedValue === option.value ? "bg-blue-100 text-blue-700" : "text-gray-700"
                  }`}
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
  const [loading, setLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState("all");
  const [selectedItem, setSelectedItem] = useState("all");
  const [filterCategory, setFilterCategory] = useState("All");
  
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

  // Fetch stock data from API
  const fetchStockData = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/stocks/');
      
      // Handle different response structures
      let data = response.data;
      if (data.results && Array.isArray(data.results)) {
        data = data.results;
      }
      
      if (Array.isArray(data)) {
        setStockData(data);
      } else {
        console.error('Unexpected data format:', data);
        setStockData([]);
      }
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast.error('Failed to fetch stock data');
      setStockData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  // Filter data based on active tab
  const tabData = useMemo(() => {
    if (!stockData.length) return [];
    
    switch (activeTab) {
      case STOCK_TYPES.FRANCHISE:
        return stockData.filter(item => 
          item.owner_type === 'shop' && item.shop_type === 'franchise'
        );
      case STOCK_TYPES.OTHER_SHOP:
        return stockData.filter(item => 
          item.owner_type === 'shop' && item.shop_type !== 'franchise'
        );
      case STOCK_TYPES.GROW_TAG:
        return stockData.filter(item => 
          item.owner_type === 'grow_tag'
        );
      default:
        return [];
    }
  }, [stockData, activeTab]);

  // Get dynamic options based on active tab
  const entityOptions = useMemo(() => {
    const options = [{ value: 'all', label: `All ${STOCK_TYPE_LABELS[activeTab].split(' ')[0]}s` }];
    
    switch (activeTab) {
      case STOCK_TYPES.FRANCHISE:
        return [...options, ...getUniqueFranchises(stockData)];
      case STOCK_TYPES.OTHER_SHOP:
        return [...options, ...getUniqueShops(stockData)];
      case STOCK_TYPES.GROW_TAG:
        return [...options, ...getUniqueGrowTags(stockData)];
      default:
        return options;
    }
  }, [stockData, activeTab]);

  const itemOptions = useMemo(() => {
    return [{ value: 'all', label: 'All Items' }, ...getUniqueItems(tabData)];
  }, [tabData]);

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

  const getEntityId = (item) => {
    switch (activeTab) {
      case STOCK_TYPES.FRANCHISE:
      case STOCK_TYPES.OTHER_SHOP:
        return item.shop?.toString();
      case STOCK_TYPES.GROW_TAG:
        return item.growtag?.toString();
      default:
        return null;
    }
  };

  const filteredStock = useMemo(() => {
    return tabData.filter((item) => {
      const matchesCategory = filterCategory === "All" || item.category === filterCategory;
      const matchesEntity = selectedEntity === "all" || getEntityId(item) === selectedEntity;
      const matchesItem = selectedItem === "all" || item.item?.toString() === selectedItem;
      
      return matchesCategory && matchesEntity && matchesItem;
    });
  }, [tabData, filterCategory, selectedEntity, selectedItem]);

  const handleAdjustStock = async () => {
    if (!adjustmentModal.item) return;

    const toastId = toast.loading("Adjusting stock...");

    try {
      // Call your stock adjustment API endpoint
      await axiosInstance.post('/api/stocks/adjust/', {
        stock_id: adjustmentModal.item.id,
        quantity: adjustmentModal.quantity,
        type: adjustmentModal.type,
        reason: adjustmentModal.reason
      });

      // Refresh stock data after adjustment
      await fetchStockData();
      
      toast.success("Stock adjusted successfully!", { id: toastId });
      closeAdjustmentModal();
    } catch (error) {
      console.error("Error adjusting stock:", error);
      toast.error(error.response?.data?.message || "Failed to adjust stock", { id: toastId });
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
    return filteredStock.reduce((total, item) => total + (parseFloat(item.qty_on_hand) || 0), 0);
  }, [filteredStock]);

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
                  setSelectedEntity("all");
                  setSelectedItem("all");
                  setFilterCategory("All");
                }}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition whitespace-nowrap ${
                  isActive
                    ? "border-b-2 border-blue-600 text-blue-700 bg-blue-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                {getTabIcon(type)}
                <span>{STOCK_TYPE_LABELS[type]}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-blue-200 text-blue-800" : "bg-gray-200 text-gray-600"}`}>
                  {stockData.filter(item => {
                    if (type === STOCK_TYPES.FRANCHISE) return item.owner_type === 'shop' && item.shop_type === 'franchise';
                    if (type === STOCK_TYPES.OTHER_SHOP) return item.owner_type === 'shop' && item.shop_type !== 'franchise';
                    if (type === STOCK_TYPES.GROW_TAG) return item.owner_type === 'grow_tag';
                    return false;
                  }).length}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const StockStats = () => {
    const inStock = filteredStock.filter((item) => parseFloat(item.qty_on_hand) > 10).length;
    const lowStock = filteredStock.filter((item) => {
      const qty = parseFloat(item.qty_on_hand);
      return qty > 0 && qty <= 10;
    }).length;
    const outOfStock = filteredStock.filter((item) => parseFloat(item.qty_on_hand) === 0).length;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{totalItems.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Stock Items</p>
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
              <p className="text-sm text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <AlertCircle className="text-yellow-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <X className="text-red-600" size={24} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const FilterBar = () => {
    return (
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-center justify-end">
          {/* Entity Filter */}
          <EnhancedDropdown
            options={entityOptions}
            selectedValue={selectedEntity}
            onSelect={setSelectedEntity}
            placeholder={STOCK_TYPE_LABELS[activeTab].split(' ')[0].toLowerCase()}
            icon={getEntityIcon()}
          />

          {/* Item Filter */}
          <EnhancedDropdown
            options={itemOptions}
            selectedValue={selectedItem}
            onSelect={setSelectedItem}
            placeholder="items"
            icon={Package}
          />

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <EnhancedDropdown
              options={CATEGORIES.map((cat) => ({ value: cat.id, label: cat.name }))}
              selectedValue={filterCategory}
              onSelect={setFilterCategory}
              placeholder="categories"
            />
          </div>
        </div>
      </div>
    );
  };

  const StockTable = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading stock data...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Item</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">SKU</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">{getEntityHeaderForTab(activeTab)}</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Type</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Qty On Hand</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Reorder Level</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="py-4 px-4 text-left text-sm font-semibold text-gray-700">Last Updated</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStock.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={48} className="text-gray-400 mb-3" />
                      <p className="text-gray-600 text-lg font-medium">No stock items found</p>
                      <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => {
                  const status = getStockStatus(item.qty_on_hand);
                  const qty = parseFloat(item.qty_on_hand) || 0;
                  const reorderLevel = parseFloat(item.reorder_level) || 0;

                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <Package size={20} className="text-gray-400" />
                          </div>
                          <span className="font-medium text-gray-900">{item.item_name || "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{item.item_sku || "N/A"}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-700">{getItemEntityNameForTab(item, activeTab)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {item.shop_type || "N/A"}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-lg font-bold text-gray-900">{qty.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{reorderLevel.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openViewModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openAdjustmentModal(item, "add")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Add Stock"
                          >
                            <Plus size={16} />
                          </button>
                          <button
                            onClick={() => openAdjustmentModal(item, "remove")}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
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
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-lg border p-8">
          <div className="flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading stock data...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="md:hidden space-y-4">
        {filteredStock.length === 0 ? (
          <div className="text-center py-10">
            <Package size={48} className="mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 text-lg font-medium">No stock items found</p>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          filteredStock.map((item) => {
            const status = getStockStatus(item.qty_on_hand);
            const qty = parseFloat(item.qty_on_hand) || 0;

            return (
              <div key={item.id} className="bg-white rounded-xl shadow border p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package size={24} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.item_name || "N/A"}</h3>
                    <p className="text-xs text-gray-500 mt-1">SKU: {item.item_sku || "N/A"}</p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        {item.shop_type || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500">{getEntityHeaderForTab(activeTab)}</p>
                    <p className="text-sm text-gray-700 font-medium">{getItemEntityNameForTab(item, activeTab)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity</p>
                    <p className="text-xl font-bold text-gray-900">{qty.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Reorder Level</p>
                    <p className="text-sm font-medium text-gray-900">{parseFloat(item.reorder_level || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.textColor}`}>
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => openViewModal(item)}
                    className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm hover:bg-blue-100 transition font-medium flex items-center justify-center gap-1"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    onClick={() => openAdjustmentModal(item, "add")}
                    className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-sm hover:bg-green-100 transition font-medium flex items-center justify-center gap-1"
                  >
                    <Plus size={14} /> Add
                  </button>
                  <button
                    onClick={() => openAdjustmentModal(item, "remove")}
                    className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-sm hover:bg-red-100 transition font-medium flex items-center justify-center gap-1"
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
    const currentStock = parseFloat(adjustmentModal.item.qty_on_hand) || 0;
    const newStock = isAdd ? currentStock + adjustmentModal.quantity : Math.max(0, currentStock - adjustmentModal.quantity);

    return (
      <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
          <div className={`p-4 border-b ${isAdd ? "bg-green-50" : "bg-red-50"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAdd ? <Plus className="text-green-600" size={24} /> : <Minus className="text-red-600" size={24} />}
                <h2 className="text-lg font-semibold text-gray-900">{isAdd ? "Add" : "Remove"} Stock</h2>
              </div>
              <button onClick={closeAdjustmentModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{adjustmentModal.item.item_name}</p>
              <p className="text-xs text-gray-500 mt-1">
                SKU: {adjustmentModal.item.item_sku || "N/A"} | {getItemEntityNameForTab(adjustmentModal.item, activeTab)}
              </p>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">Current Stock:</span>
              <span className="text-lg font-bold text-gray-900">{currentStock.toFixed(2)} units</span>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Quantity to {isAdd ? "Add" : "Remove"}</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdjustmentModal((prev) => ({ ...prev, quantity: Math.max(0, prev.quantity - 1) }))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjustmentModal.quantity}
                  onChange={(e) => setAdjustmentModal((prev) => ({ ...prev, quantity: Math.max(0, parseFloat(e.target.value) || 0) }))}
                  className="flex-1 border-2 p-2 rounded-lg text-center text-lg font-semibold focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <button
                  onClick={() => setAdjustmentModal((prev) => ({ ...prev, quantity: prev.quantity + 1 }))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className={`p-3 rounded-lg ${isAdd ? "bg-green-50" : "bg-red-50"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">New Stock:</span>
                <span className={`text-xl font-bold ${isAdd ? "text-green-600" : "text-red-600"}`}>{newStock.toFixed(2)} units</span>
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
              className="flex-1 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAdjustStock}
              disabled={adjustmentModal.quantity === 0}
              className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdd ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
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
    const status = getStockStatus(item.qty_on_hand);
    const qty = parseFloat(item.qty_on_hand) || 0;
    const reorderLevel = parseFloat(item.reorder_level) || 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 border-b bg-blue-50 sticky top-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye size={20} className="text-blue-600" />
                Stock Details
              </h2>
              <button onClick={closeViewModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package size={32} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{item.item_name || "N/A"}</h3>
                <p className="text-sm text-gray-500 mt-1">SKU: {item.item_sku || "N/A"}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {item.shop_type || "N/A"}
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
                  <p className="text-sm text-gray-600">Entity Name</p>
                  <p className="text-sm font-medium text-gray-900">{getItemEntityNameForTab(item, activeTab)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Owner Type</p>
                  <p className="text-sm font-medium text-gray-900">{item.owner_type || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Quantity on Hand</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {qty.toFixed(2)} <span className="text-sm text-gray-500">units</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Reorder Level</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {reorderLevel.toFixed(2)} <span className="text-sm text-gray-500">units</span>
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">Additional Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Stock ID:</span>
                  <span className="font-medium text-gray-900">{item.id}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Item ID:</span>
                  <span className="font-medium text-gray-900">{item.item || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Shop ID:</span>
                  <span className="font-medium text-gray-900">{item.shop || "N/A"}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(item.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t bg-gray-50 flex gap-3">
            <button
              onClick={() => {
                closeViewModal();
                openAdjustmentModal(item, "add");
              }}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              Add Stock
            </button>
            <button
              onClick={() => {
                closeViewModal();
                openAdjustmentModal(item, "remove");
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
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