import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedLayout from "./Layout/ProtectedLayout";
import LoginPage from "./pages/loginPage/LoginPage";

import Dashboard from "./pages/Dashboard/Dashboard";
import GrowTagsDashboard from "./pages/Dashboard/GrowTagsDashboard";
import CustomersDashboard from "./pages/Dashboard/CustomersDashboard";
import FranchiseDashboard from "./pages/Dashboard/FranchiseDashboard";
import OtherShopDashboard from "./pages/Dashboard/OtherShopDashboard";

import GrowTags from "./pages/Growtags/GrowTags";
import AssignGrowTags from "./pages/Growtags/AssignGrowTags";
import Complaints from "./pages/complaints/Complaints";
import CustomerComplaintRegister from "./pages/complaints/CustomerComplaintRegister";
import Shops from "./pages/Shops/Shops";
import Customers from "./pages/customers/Customers";
import Items from "./pages/Items/Items";
import Invoice from "./pages/Invoice/Invoice";
import Reports from "./pages/Reports/Reports";
import Expenses from "./pages/Expenses/Expenses";
import Leads from "./pages/Leads/Leads";

import ProtectedRoute from "./auth/ProtectedRoute";
import Unauthorized from "./pages/Unauthorization/Unauthorized";
import NotFound from "./pages/Unauthorization/NotFound";
import Stock from "./pages/Stock/Stock";
import Vendor from "./pages/Purchases/Vendor";
import PurchaseOrder from "./pages/Purchases/PurchaseOrder";
import Bill from "./pages/Purchases/Bill";
import CustomerRegister from "./pages/loginPage/CustomerRegister";

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 900,
        }}
      />

      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/customer-register" element={<CustomerRegister />} />

        {/* ALL PROTECTED ROUTES WITH LAYOUT */}
        <Route element={<ProtectedLayout />}>
          {/* ADMIN ROUTES */}
          <Route
            path="/admindashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* GROWTAG ROUTES */}
          <Route
            path="/growtagdashboard"
            element={
              <ProtectedRoute allowedRoles={["GROWTAG"]}>
                <GrowTagsDashboard />
              </ProtectedRoute>
            }
          />

          {/* CUSTOMER ROUTES */}
          <Route
            path="/customerdashboard"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                <CustomersDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/customercomplaintself"
            element={
              <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                <CustomerComplaintRegister />
              </ProtectedRoute>
            }
          />

          {/* FRANCHISE ROUTES */}
          <Route
            path="/franchisedashboard"
            element={
              <ProtectedRoute allowedRoles={["FRANCHISE"]}>
                <FranchiseDashboard />
              </ProtectedRoute>
            }
          />

          {/* OTHER SHOP ROUTES */}
          <Route
            path="/othershopdashboard"
            element={
              <ProtectedRoute allowedRoles={["OTHERSHOP"]}>
                <OtherShopDashboard />
              </ProtectedRoute>
            }
          />

          {/* COMMON ROUTES - Accessible by multiple roles */}
          <Route
            path="/growtags"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP"]}>
                <GrowTags />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/assign-growtags"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AssignGrowTags />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/shops"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP", "GROWTAG"]}>
                <Shops />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/complaints"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GROWTAG", "FRANCHISE", "OTHERSHOP", "CUSTOMER"]}>
                <Complaints />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/leads"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Leads />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/customers"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP", "GROWTAG"]}>
                <Customers />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/items"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <Items />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/stock"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP", "GROWTAG"]}>
                <Stock />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/vendors"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP"]}>
                <Vendor />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/purchase-orders"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP", "GROWTAG"]}>
                <PurchaseOrder />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/bills"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP", "GROWTAG"]}>
                <Bill />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/expenses"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "FRANCHISE", "OTHERSHOP"]}>
                <Expenses />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/invoice"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GROWTAG", "FRANCHISE", "OTHERSHOP", "CUSTOMER"]}>
                <Invoice />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "GROWTAG", "FRANCHISE", "OTHERSHOP"]}>
                <Reports />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* DEFAULT REDIRECT */}
        <Route path="/" element={<LoginPage />} />

        {/* 404 PAGE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}