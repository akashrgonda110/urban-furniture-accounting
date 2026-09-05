import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";

// Auth pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// App pages
import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Products from "./pages/Products";

import SalesOrders from "./pages/sales/SalesOrders";
import Invoices from "./pages/sales/Invoices";

import PurchaseOrders from "./pages/purchases/PurchaseOrders";
import Bills from "./pages/purchases/Bills";

import Payments from "./pages/Payments";

import ChartOfAccounts from "./pages/accounting/ChartOfAccounts";
import Journals from "./pages/accounting/Journals";
import JournalEntries from "./pages/accounting/JournalEntries";

import AnalyticAccounts from "./pages/AnalyticAccounts";
import Budgets from "./pages/Budgets";

import BalanceSheet from "./pages/reports/BalanceSheet";
import ProfitLoss from "./pages/reports/ProfitLoss";
import BudgetReport from "./pages/reports/BudgetReport";

// Redirects unauthenticated users to /login
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ marginTop: 80 }}>Loading…</div>;
  return user ? children : <Navigate to="/login" replace />;
}

// Redirects already-logged-in users away from /login and /signup
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ marginTop: 80 }}>Loading…</div>;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Protected routes — wrapped in Layout */}
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/contacts" element={<PrivateRoute><Layout><Contacts /></Layout></PrivateRoute>} />
      <Route path="/products" element={<PrivateRoute><Layout><Products /></Layout></PrivateRoute>} />

      <Route path="/sales/orders"   element={<PrivateRoute><Layout><SalesOrders /></Layout></PrivateRoute>} />
      <Route path="/sales/invoices" element={<PrivateRoute><Layout><Invoices /></Layout></PrivateRoute>} />

      <Route path="/purchases/orders" element={<PrivateRoute><Layout><PurchaseOrders /></Layout></PrivateRoute>} />
      <Route path="/purchases/bills"  element={<PrivateRoute><Layout><Bills /></Layout></PrivateRoute>} />

      <Route path="/payments" element={<PrivateRoute><Layout><Payments /></Layout></PrivateRoute>} />

      <Route path="/accounting/accounts" element={<PrivateRoute><Layout><ChartOfAccounts /></Layout></PrivateRoute>} />
      <Route path="/accounting/journals" element={<PrivateRoute><Layout><Journals /></Layout></PrivateRoute>} />
      <Route path="/accounting/entries"  element={<PrivateRoute><Layout><JournalEntries /></Layout></PrivateRoute>} />

      <Route path="/analytic" element={<PrivateRoute><Layout><AnalyticAccounts /></Layout></PrivateRoute>} />
      <Route path="/budgets"  element={<PrivateRoute><Layout><Budgets /></Layout></PrivateRoute>} />

      <Route path="/reports/balance-sheet" element={<PrivateRoute><Layout><BalanceSheet /></Layout></PrivateRoute>} />
      <Route path="/reports/profit-loss"   element={<PrivateRoute><Layout><ProfitLoss /></Layout></PrivateRoute>} />
      <Route path="/reports/budget"        element={<PrivateRoute><Layout><BudgetReport /></Layout></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
