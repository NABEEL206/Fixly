import React, { useEffect, useState, useMemo } from "react";
// Import all necessary icons
import {
  X,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ClipboardList,
  MapPin,
  Building,
  Phone,
  Mail,
  User,
  Shield,
  Package,
  Landmark,
  View,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { BASE_URL } from "@/API/BaseURL";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

// ✅ auto attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----------------------------------------------------
// 1. Password Input Component (Eye Icon Toggle)
// ----------------------------------------------------
const PasswordInput = ({ name, label, value, onChange, error, isEdit }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div>
      <label className="text-sm">
        {label} {isEdit ? "(leave empty to keep old)" : "*"}
      </label>
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          className={`w-full p-1 pr-10 border rounded text-sm focus:outline-none focus:ring-1 ${
            error
              ? "border-red-500 focus:ring-red-500"
              : "focus:border-blue-400 focus:ring-blue-400"
          }`}
          placeholder={isEdit ? "(leave empty to keep old)" : ""}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
        >
          {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// ----------------------------------------------------
// 3. View Modal Component (Shop Details + Complaints)
// ----------------------------------------------------
const ViewModal = ({ shop, onClose }) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      if (!shop || !shop.id) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get(`/complaints/?shop_id=${shop.id}`);

        // Assuming the response is an array of complaint objects
        setComplaints(res.data);
      } catch (err) {
        console.error("Error fetching complaints:", err);
        toast.error("Failed to load assigned complaints.");
        setComplaints([]);
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [shop]);

  if (!shop) return null;

  return (
    <div className="fixed inset-0  bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white w-full max-w-3xl p-6 rounded-xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center border-b pb-2">
          <View size={24} className="mr-2 text-blue-600" /> Shop Details:{" "}
          {shop.shopname} (ID: {shop.id})
        </h2>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <DetailItem
            icon={<Building size={16} />}
            label="Type"
            value={shop.shop_type?.toUpperCase()}
          />

          <DetailItem
            icon={<Shield size={16} />}
            label="Owner"
            value={shop.owner}
          />

          <DetailItem
            icon={<Phone size={16} />}
            label="Phone"
            value={shop.phone}
          />

          <DetailItem
            icon={<Mail size={16} />}
            label="Email"
            value={shop.email || "N/A"}
          />

          <DetailItem
            icon={<Package size={16} />}
            label="GST PIN"
            value={shop.gst_pin || "N/A"}
          />

          <DetailItem
            icon={<Landmark size={16} />}
            label="Status"
            value={shop.status ? "Active" : "Inactive"}
            color={shop.status ? "text-green-600" : "text-red-600"}
          />

          {/* ✅ CREATED BY */}
          <DetailItem
            icon={<User size={16} />}
            label="Created By"
            value={
              shop.created_by?.username ||
              shop.created_by?.email ||
              shop.created_by ||
              "—"
            }
          />
        </div>

        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <MapPin size={18} className="mr-2 text-red-500" /> Location Details
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm mb-6 border-b pb-4">
          <DetailItem label="Address" value={shop.address} fullWidth />
          <DetailItem label="Pincode" value={shop.pincode} />
          <DetailItem label="Area" value={shop.area} />
          <DetailItem label="State" value={shop.state || "N/A"} />
        </div>

        <h3 className="text-lg font-semibold mb-3 flex items-center">
          <ClipboardList size={18} className="mr-2 text-blue-600" /> Assigned
          Complaints ({complaints.length})
        </h3>

        {loading ? (
          <p className="text-gray-500 text-center">Loading complaints...</p>
        ) : complaints.length === 0 ? (
          <p className="text-gray-500 text-center">
            No active complaints are currently assigned to this shop.
          </p>
        ) : (
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-xs text-gray-500">
                  <th className="px-4 py-2">Complaint ID</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Assigned At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {complaints.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2 font-medium">
                      {c.complaint_id || c.id}
                    </td>
                    <td className="px-4 py-2 truncate max-w-[150px]">
                      {c.title || "N/A"}
                    </td>
                    <td className="px-4 py-2">{c.status || "N/A"}</td>
                    <td className="px-4 py-2">
                      {new Date(
                        c.assigned_at || c.created_at,
                      ).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper for ViewModal item
const DetailItem = ({
  icon,
  label,
  value,
  color = "text-gray-800",
  fullWidth = false,
}) => (
  <div className={fullWidth ? "col-span-2" : ""}>
    <div className="flex items-center text-gray-500 mb-0.5">
      {icon} <span className="ml-2 font-medium">{label}:</span>
    </div>
    <p className={`pl-5 ${color} font-semibold break-words`}>{value}</p>
  </div>
);

// ----------------------------------------------------
// 4. Main Shops Component
// ----------------------------------------------------
export default function Shops() {
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingBulkDelete, setPendingBulkDelete] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewShop, setViewShop] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = (visibleShops) => {
    if (selectedIds.length === visibleShops.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(visibleShops.map((s) => s.id));
    }
  };

  const [form, setForm] = useState({
    shoptype: "franchise",
    name: "",
    owner: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    state: "",
    pincode: "",
    area: "",
    gstpin: "",
    status: "Active",
  });

  const [errors, setErrors] = useState({});
  const [areaList, setAreaList] = useState([]);
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState("");
  const filteredShops = useMemo(() => {
    const text = search.toLowerCase().trim();

    return shops.filter((shop) => {
      const matchText =
        shop.id?.toString().includes(text) ||
        shop.shopname?.toLowerCase().includes(text);

      const matchType = filterType === "all" || shop.shop_type === filterType;

      return matchText && matchType;
    });
  }, [shops, search, filterType]);

  const [pincodeError, setPincodeError] = useState("");
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);

  const [originalShopInfo, setOriginalShopInfo] = useState({
    id: null,
    name: "",
  }); // LOAD SHOPS

  const showDeleteToast = (message, onConfirm) => {
    toast.custom(
      (t) => (
        <div className="bg-white border shadow-lg rounded-lg px-4 py-3 flex items-center justify-between gap-3 w-[360px]">
          <span className="text-sm text-gray-700">{message}</span>

          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                onConfirm();
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 5000 },
    );
  };

  const loadShops = async () => {
    try {
      const res = await api.get("/shops/");

      // ✅ handle both list & wrapped response
      const shopsData = Array.isArray(res.data)
        ? res.data
        : res.data.data
          ? [res.data.data]
          : [];

      setShops(shopsData);
    } catch (err) {
      toast.error("Failed to load shops");
      setShops([]);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  // HANDLE INPUT CHANGE (PINCODE FIXED)
  const handleChange = async (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    // ----------------------------------
    // 🟢 PINCODE HANDLING
    // ----------------------------------
    if (name === "pincode") {
      // 🔴 EMPTY PINCODE
      if (!value) {
        setAreaList([]);
        setForm((prev) => ({
          ...prev,
          area: "",
          state: "",
        }));
        setPincodeError("Pincode is required");
        return;
      }

      // 🔴 NOT 6 DIGITS
      if (value.length !== 6) {
        setAreaList([]);
        setForm((prev) => ({
          ...prev,
          area: "",
          state: "",
        }));
        setPincodeError("Pincode must be exactly 6 digits");
        return;
      }

      // 🟢 VALID LENGTH → API CALL
      setIsPincodeLoading(true);
      setPincodeError("");

      setIsPincodeLoading(true);
      setPincodeError("");

      try {
        const res = await axios.get(
          `https://api.postalpincode.in/pincode/${value}`,
          { timeout: 8000 }, // ⏱️ network timeout
        );

        // ❌ INVALID PINCODE
        if (res.data[0]?.Status !== "Success") {
          setAreaList([]);
          setForm((prev) => ({
            ...prev,
            area: "",
            state: "",
          }));
          setPincodeError("Invalid pincode. Please check and try again.");
          return;
        }

        // ✅ VALID PINCODE
        const postOffices = res.data[0].PostOffice || [];
        const areas = postOffices.map((p) => p.Name);
        const stateName = postOffices[0]?.State || "";

        setAreaList(areas);
        setForm((prev) => ({
          ...prev,
          area: areas[0] || "",
          state: stateName,
        }));

        setPincodeError("");
      } catch (error) {
        // 🌐 NETWORK ERROR
        console.error("Pincode API Error:", error);

        setAreaList([]);
        setForm((prev) => ({
          ...prev,
          area: "",
          state: "",
        }));

        setPincodeError("Network connection lost. Please check your internet.");
      } finally {
        setIsPincodeLoading(false);
      }
    }
  }; // RESET FORM

  const resetForm = () => {
    setForm({
      shoptype: "franchise",
      name: "",
      owner: "",
      phone: "",
      email: "",
      password: "",
      address: "",
      state: "",
      pincode: "",
      area: "",
      gstpin: "",
      status: "Active",
    });
    setAreaList([]);
    setErrors({});
  }; // ============================================ // VALIDATION FOR *ALL FIELDS* // ============================================

  const validateForm = () => {
    let newErrors = {};

    if (!form.shoptype.trim()) newErrors.shoptype = "Shop type is required.";
    if (!form.name.trim()) newErrors.name = "Shop name is required.";
    if (!form.owner.trim()) newErrors.owner = "Owner name is required.";

    const phoneRegex = /^\d{10}$/;
    if (!form.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(form.phone.trim())) {
      newErrors.phone = "Phone must be exactly 10 digits.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(form.email.trim())) {
      newErrors.email = "Invalid email format.";
    }

    if (!isEdit && !form.password.trim()) {
      newErrors.password = "Password is required for new shops.";
    }

    if (!form.address.trim()) newErrors.address = "Address is required.";

    if (!form.state.trim()) newErrors.state = "State is required.";

    const pincodeRegex = /^\d{6}$/;
    if (!form.pincode.trim()) {
      newErrors.pincode = "Pincode is required.";
    } else if (!pincodeRegex.test(form.pincode.trim())) {
      newErrors.pincode = "Pincode must be exactly 6 digits.";
    }

    if (!form.area.trim()) newErrors.area = "Area is required.";

    if (!form.gstpin.trim()) {
      newErrors.gstpin = "GST number is required.";
    } else if (form.gstpin.trim().length !== 15) {
      newErrors.gstpin = "GST number must be 15 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }; // SAVE OR UPDATE SHOP

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    const loadingToast = toast.loading(
      isEdit
        ? `Updating shop "${originalShopInfo.name}" (ID: ${editId})...`
        : `Saving new shop "${form.name}"...`,
    );

    const payload = {
      shop_type: form.shoptype,
      shopname: form.name,
      owner: form.owner,
      phone: form.phone,
      email: form.email,
      ...((!isEdit || form.password) && { password: form.password }),
      address: form.address,
      state: form.state,
      pincode: form.pincode,
      area: form.area,
      gst_pin: form.gstpin,
      status: form.status === "Active",
    };

    try {
      if (isEdit) {
        await api.put(`/shops/${editId}/`, payload);

        toast.success(
          `Shop "${form.name}" (ID: ${editId}) updated successfully!`,
        );
      } else {
        const res = await api.post("/shops/", payload);

        const createdShop = res.data?.data;

        toast.success(
          `New Shop "${createdShop?.shopname}" (ID: ${createdShop?.id}) added successfully!`,
        );
      }

      toast.dismiss(loadingToast);

      resetForm();
      setOriginalShopInfo({ id: null, name: "" });
      setOpenForm(false);
      setIsEdit(false);
      loadShops();
    } catch (err) {
      toast.dismiss(loadingToast);
      let errorMessage = "Failed to save shop. Please try again.";
      if (err.response && err.response.data) {
        const errorData = err.response.data;

        if (typeof errorData === "string") {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (
          errorData.non_field_errors &&
          errorData.non_field_errors.length > 0
        ) {
          errorMessage = errorData.non_field_errors[0];
        } else {
          const fieldErrorKeys = Object.keys(errorData);
          for (const key of fieldErrorKeys) {
            if (Array.isArray(errorData[key]) && errorData[key].length > 0) {
              errorMessage = errorData[key][0];
              break;
            }
          }
        }
      }

      toast.error(errorMessage);
    }
  }; // DELETE SHOP
  const deleteShop = (id) => {
    const shop = shops.find((s) => s.id === id);
    const shopName = shop?.shopname || "this shop";

    showDeleteToast(`Delete "${shopName}"?`, async () => {
      const loadingToast = toast.loading(`Deleting "${shopName}"...`);

      try {
        await api.delete(`/shops/${id}/`);

        toast.success(`"${shopName}" deleted successfully`, {
          id: loadingToast,
        });
        loadShops();
      } catch (error) {
        toast.error("Failed to delete shop", { id: loadingToast });
      }
    });
  };

  // bulk deletion
  const bulkDeleteShops = () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one shop");
      return;
    }

    showDeleteToast(
      `Delete ${selectedIds.length} selected shop(s)?`,
      async () => {
        const loadingToast = toast.loading(
          `Deleting ${selectedIds.length} shop(s)...`,
        );

        try {
          await Promise.all(
            selectedIds.map((id) => api.delete(`/shops/${id}/`)),
          );

          toast.success(`${selectedIds.length} shop(s) deleted successfully`, {
            id: loadingToast,
          });

          setSelectedIds([]);
          loadShops();
        } catch (error) {
          toast.error("Bulk delete failed", { id: loadingToast });
        }
      },
    );
  };

  // EDIT SHOP
  const startEdit = (shop) => {
    setIsEdit(true);
    setEditId(shop.id);
    setOpenForm(true);

    setOriginalShopInfo({ id: shop.id, name: shop.shopname });
    setForm({
      shoptype: shop.shop_type,
      name: shop.shopname,
      owner: shop.owner,
      phone: shop.phone,
      email: shop.email || "",
      password: "",
      address: shop.address,
      state: shop.state || "",
      pincode: shop.pincode,
      area: shop.area || "",
      gstpin: shop.gst_pin,
      status: shop.status ? "Active" : "Inactive",
    }); // Load areas on edit

    if (shop.pincode) {
      axios
        .get(`https://api.postalpincode.in/pincode/${shop.pincode}`)
        .then((res) => {
          if (res.data[0]?.Status === "Success") {
            const postOffices = res.data[0].PostOffice || [];

            const areas = postOffices.map((p) => p.Name);
            const stateName = postOffices[0]?.State || "";

            setAreaList(areas);

            setForm((prev) => ({
              ...prev,
              state: stateName, // ✅ PREFILL STATE
              area: shop.area || areas[0], // ✅ KEEP OLD AREA
            }));
          }
        })
        .catch(() => {
          setAreaList([]);
        });
    }

    setErrors({});
  };

  // START VIEW MODAL
  const startView = (shop) => {
    setViewShop(shop);
  }; // Helper function to render input fields and error messages - MODIFIED FOR TEXTAREA

  const renderInputField = (
    name,
    label,
    type = "text",
    maxLength,
    isOptional = false,
    rows = 3,
  ) => (
    <div>
           {" "}
      <label className="text-sm">
                {label} {isOptional ? "(optional)" : "*"}     {" "}
      </label>
           {" "}
      {type === "textarea" ? (
        <textarea
          name={name}
          rows={rows}
          value={form[name]}
          onChange={handleChange}
          className={`w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 resize-none ${
            errors[name]
              ? "border-red-500 focus:ring-red-500"
              : "focus:border-blue-400 focus:ring-blue-400"
          }`}
        />
      ) : (
        <input
          type={type}
          name={name}
          maxLength={maxLength}
          value={form[name]}
          onChange={handleChange}
          className={`w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 ${
            errors[name]
              ? "border-red-500 focus:ring-red-500"
              : "focus:border-blue-400 focus:ring-blue-400"
          }`}
        />
      )}
           {" "}
      {errors[name] && (
        <p className="text-red-500 text-xs mt-1">{errors[name]}</p>
      )}
         {" "}
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
            <Toaster position="top-center" />
      {viewShop && (
        <ViewModal shop={viewShop} onClose={() => setViewShop(null)} />
      )}
            {/* HEADER */}     {" "}
      <div className="flex justify-between items-center mb-6">
               {" "}
        <h1 className="text-2xl font-semibold text-gray-800">Manage Shops</h1> 
             {" "}
        {!openForm && (
          <button
            onClick={() => {
              setOpenForm(true);
              setIsEdit(false);
              resetForm();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
                        + Add Shop          {" "}
          </button>
        )}
             {" "}
      </div>
            {/* SEARCH: MODIFIED TO INCLUDE SEARCH ICON */}     {" "}
      <div className="mb-4 relative w-80">
               {" "}
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search size={16} className="text-gray-400" />       {" "}
        </div>
               {" "}
        <input
          type="text"
          placeholder="Search shops..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border rounded-lg pl-10 focus:ring-blue-500 focus:border-blue-500"
        />
             {" "}
      </div>
                  {/* TABLE */}     {" "}
      <div className="hidden md:block bg-white rounded-2xl shadow-lg border overflow-x-auto">
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span className="text-sm text-red-700 font-medium">
              {selectedIds.length} shop(s) selected
            </span>

            <button
              onClick={bulkDeleteShops}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-semibold shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition"
            >
              <Trash2 size={16} />
              Delete Selected
            </button>
          </div>
        )}
        <table className="w-full text-lg table-auto border-collapse">
          <thead>
            <tr className="bg-[#e8f1ff] text-gray-700 text-center text-xs">
              {/* SELECT ALL */}
              <th className="w-10 px-2 py-2 border-r">
                <input
                  type="checkbox"
                  checked={
                    filteredShops.length > 0 &&
                    selectedIds.length === filteredShops.length
                  }
                  onChange={() => toggleSelectAll(filteredShops)}
                  className="accent-blue-500"
                />
              </th>

              <th className="w-12 px-2 py-2 border-r">ID</th>
              <th className="w-16 px-2 py-2 border-r">Type</th>
              <th className="w-28 px-2 py-2 border-r">Name</th>
              <th className="w-24 px-2 py-2 border-r">Owner</th>
              <th className="w-32 px-2 py-2 border-r">Email</th>
              <th className="w-20 px-2 py-2 border-r">Phone</th>
              <th className="w-24 px-2 py-2 border-r whitespace-nowrap">
                Created By
              </th>

              <th className="w-24 px-2 py-2 border-r">State</th>
              <th className="w-16 px-2 py-2 border-r">Pincode</th>
              <th className="w-20 px-2 py-2 border-r">GST</th>
              <th className="w-16 px-2 py-2 border-r">Status</th>
              <th className="w-48 px-2 py-2">Actions</th>
            </tr>
          </thead>

          <tbody className="text-center text-xs">
            {filteredShops.map((shop) => (
              <tr
                key={shop.id}
                className="border-b hover:bg-gray-50 transition"
              >
                {/* ROW CHECKBOX */}
                <td className="px-2 py-2 border-r">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(shop.id)}
                    onChange={() => toggleSelect(shop.id)}
                    className="accent-blue-500"
                  />
                </td>

                <td className="px-2 py-2 border-r">{shop.id}</td>
                <td className="px-2 py-2 border-r">{shop.shop_type}</td>
                <td className="px-2 py-2 border-r truncate">{shop.shopname}</td>
                <td className="px-2 py-2 border-r truncate">{shop.owner}</td>
                <td className="px-2 py-2 border-r truncate">{shop.email}</td>
                <td className="px-2 py-2 border-r">{shop.phone}</td>

                {/* ✅ CREATED BY */}
                <td className="px-2 py-2 border-r whitespace-nowrap text-gray-400">
                  {shop.created_by ?? "—"}
                </td>

                <td className="px-2 py-2 border-r truncate">{shop.state}</td>
                <td className="px-2 py-2 border-r">{shop.pincode}</td>
                <td className="px-2 py-2 border-r truncate">{shop.gst_pin}</td>

                <td className="px-2 py-2 border-r">
                  {shop.status ? "Active" : "Inactive"}
                </td>

                <td className="px-2 py-2 flex gap-1 justify-center">
                  <button
                    onClick={() => startView(shop)}
                    className="px-2 py-1 bg-blue-500 text-white rounded-lg text-xs"
                  >
                    <View size={14} />
                  </button>

                  <button
                    onClick={() => startEdit(shop)}
                    className="px-2 py-1 bg-yellow-500 text-white rounded-lg text-xs"
                  >
                    <Edit size={14} />
                  </button>

                  <button
                    onClick={() => deleteShop(shop.id)}
                    className="px-2 py-1 bg-red-600 text-white rounded-lg text-xs"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
             {" "}
      </div>
      {/* MOBILE CARD VIEW */}
      <div className="block md:hidden space-y-4">
        {shops
          .filter((shop) => {
            const s = search.toLowerCase();
            return (
              (shop.shopname || "").toLowerCase().includes(s) ||
              (shop.owner || "").toLowerCase().includes(s) ||
              (shop.phone || "").toLowerCase().includes(s) ||
              (shop.state || "").toLowerCase().includes(s)
            );
          })
          .map((shop) => (
            <div
              key={shop.id}
              className="bg-white rounded-xl shadow border p-4 space-y-2"
            >
              {/* HEADER */}
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 truncate">
                  {shop.shopname}
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    shop.status
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {shop.status ? "Active" : "Inactive"}
                </span>
              </div>

              {/* DETAILS */}
              <div className="text-xs text-gray-600 space-y-1">
                <p>
                  <b>ID:</b> {shop.id}
                </p>
                <p>
                  <b>Type:</b> {shop.shop_type}
                </p>
                <p>
                  <b>Owner:</b> {shop.owner}
                </p>
                <p>
                  <b>Phone:</b> {shop.phone}
                </p>
                <p>
                  <b>Email:</b> {shop.email || "N/A"}
                </p>
                <p>
                  <b>State:</b> {shop.state}
                </p>
                <p>
                  <b>Pincode:</b> {shop.pincode}
                </p>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => startView(shop)}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-500 text-white py-2 rounded-lg text-xs"
                >
                  <View size={14} /> View
                </button>

                <button
                  onClick={() => startEdit(shop)}
                  className="flex-1 flex items-center justify-center gap-1 bg-yellow-500 text-white py-2 rounded-lg text-xs"
                >
                  <Edit size={14} /> Edit
                </button>

                <button
                  onClick={() => deleteShop(shop.id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white py-2 rounded-lg text-xs"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
      </div>
      {/* FORM MODAL */}     {" "}
      {openForm && (
        <div className="fixed inset-0 mt-15  bg-opacity-40 flex justify-center items-start overflow-auto py-6 z-50">
                   {" "}
          <div className="bg-white w-full max-w-2xl p-6 rounded-2xl shadow-xl relative">
                       {" "}
            <button
              onClick={() => setOpenForm(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
            >
                            <X size={22} />           {" "}
            </button>
                       {" "}
            <h2 className="text-xl font-semibold mb-4 text-center">
                           {" "}
              {isEdit ? `Update Shop: ${form.name}` : "Add New Shop"}         
               {" "}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              {/* ================= LEFT COLUMN ================= */}
              <div className="space-y-2">
                {/* SHOP TYPE */}
                <div>
                  <label className="text-sm">Shop Type *</label>
                  <select
                    name="shoptype"
                    value={form.shoptype}
                    onChange={handleChange}
                    className={`w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 ${
                      errors.shoptype
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:border-blue-400 focus:ring-blue-400"
                    }`}
                  >
                    <option value="franchise">Franchise</option>
                    <option value="othershop">Other Shop</option>
                  </select>
                  {errors.shoptype && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.shoptype}
                    </p>
                  )}
                </div>

                {/* SHOP NAME */}
                {renderInputField("name", "Shop Name")}

                {/* PINCODE (CUSTOM – WITH ERROR + LOADING) */}
                <div>
                  <label className="text-sm">Pincode *</label>

                  <input
                    type="text"
                    name="pincode"
                    maxLength={6}
                    value={form.pincode}
                    onChange={handleChange}
                    className={`w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 ${
                      pincodeError || errors.pincode
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:border-blue-400 focus:ring-blue-400"
                    }`}
                    placeholder="Enter 6-digit pincode"
                  />

                  {isPincodeLoading && (
                    <p className="text-xs text-gray-500 mt-1">
                      Fetching location…
                    </p>
                  )}

                  {(pincodeError || errors.pincode) && (
                    <p className="text-red-500 text-xs mt-1">
                      {pincodeError || errors.pincode}
                    </p>
                  )}
                </div>

                {/* AREA */}
                <div>
                  <label className="text-sm">Area *</label>
                  <select
                    name="area"
                    value={form.area}
                    onChange={handleChange}
                    disabled={areaList.length === 0}
                    className={`w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 ${
                      errors.area
                        ? "border-red-500 focus:ring-red-500"
                        : "focus:border-blue-400 focus:ring-blue-400"
                    }`}
                  >
                    {areaList.length === 0 ? (
                      <option value="">-- Enter Pincode First --</option>
                    ) : (
                      areaList.map((a, i) => (
                        <option key={i} value={a}>
                          {a}
                        </option>
                      ))
                    )}
                  </select>
                  {errors.area && (
                    <p className="text-red-500 text-xs mt-1">{errors.area}</p>
                  )}
                </div>

                {/* STATE (AUTO-FILLED, READ-ONLY) */}
                <div>
                  <label className="text-sm">State *</label>
                  <input
                    type="text"
                    value={form.state}
                    readOnly
                    className="w-full p-1 border rounded bg-gray-100 text-sm cursor-not-allowed"
                    placeholder="Auto-filled from pincode"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                  )}
                </div>
              </div>

              {/* ================= RIGHT COLUMN ================= */}
              <div className="space-y-2">
                {/* PHONE */}
                {renderInputField("phone", "Phone", "text", 10)}

                {/* EMAIL */}
                {renderInputField("email", "Email", "email")}

                {/* PASSWORD */}
                <PasswordInput
                  name="password"
                  label="Password"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  isEdit={isEdit}
                />

                {/* GST */}
                {renderInputField("gstpin", "GST Number", "text", 15)}

                {/* OWNER */}
                {renderInputField("owner", "Owner")}

                {/* STATUS */}
                <div>
                  <label className="text-sm">Status *</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full p-1 border rounded text-sm focus:outline-none focus:ring-1 focus:border-blue-400 focus:ring-blue-400"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* ADDRESS – FULL WIDTH */}
              <div className="col-span-2">
                {renderInputField(
                  "address",
                  "Address",
                  "textarea",
                  undefined,
                  false,
                  3,
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <div className="col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white p-2 rounded text-sm hover:bg-green-700 transition"
                >
                  {isEdit ? "Update Shop" : "Save Shop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
