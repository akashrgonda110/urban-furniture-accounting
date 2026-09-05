import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { canAccess, defaultRoute } from "./context/permissions";
import Layout from "./components/Layout";

// Auth pages
import Login  from "./pages/Login";
import Signup from "./pages/Signup";

// App pages
import Dashboard      from "./pages/Dashboard";
import Contacts       from "./pages/Contacts";
import Products       from "./pages/Products";
import SalesOrders    from "./pages/sales/SalesOrders";
import Invoices       from "./pages/sales/Invoices";
import PurchaseOrders from "./pages/purchases/PurchaseOrders";
import Bills          from "./pages/purchases/Bills";
import Payments       from "./pages/Payments";
import ChartOfAccounts from "./pages/accounting/ChartOfAccounts";
import Journals       from "./pages/accounting/Journals";
import JournalEntries from "./pages/accounting/JournalEntries";
import AnalyticAccounts from "./pages/AnalyticAccounts";
import Budgets        from "./pages/Budgets";
import BalanceSheet   from "./pages/reports/BalanceSheet";
import ProfitLoss     from "./pages/reports/ProfitLoss";
import BudgetReport   from "./pages/reports/BudgetReport";
import MyPortal       from "./pages/MyPortal";
import UserManagement from "./pages/UserManagement";

// ── Guards ────────────────────────────────────────────────────────────────────

/** Redirect unauthenticated users to /login */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ marginTop: 80 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/** Redirect already-logged-in users away from /login and /signup */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading" style={{ marginTop: 80 }}>Loading…</div>;
  if (user) return <Navigate to={defaultRoute(user.role)} replace />;
  return children;
}

/**
 * RoleRoute — wraps a protected page.
 * If the current user's role is not allowed for `path`, shows an Access Denied screen.
 */
function RoleRoute({ path, children }) {
  const { user } = useAuth();
  const role = user?.role || "";

  if (!canAccess(role, path)) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Access Denied</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 14, maxWidth: 360, margin: "0 auto 20px" }}>
          Your role (<strong>{role}</strong>) does not have permission to access this page.
          Contact your administrator if you need access.
        </p>
        <a href={defaultRoute(role)} style={{ color: "var(--primary)", fontSize: 14 }}>
          ← Back to your home page
        </a>
      </div>
    );
  }
  return children;
}

/** Convenience: authenticated + role-checked + wrapped in Layout */
function Page({ path, children }) {
  return (
    <PrivateRoute>
      <Layout>
        <RoleRoute path={path}>{children}</RoleRoute>
      </Layout>
    </PrivateRoute>
  );
}

// ── Routes ────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Contact User portal */}
      <Route path="/my-portal" element={<Page path="/my-portal"><MyPortal /></Page>} />

      {/* Admin + Accountant */}
      <Route path="/"                      element={<Page path="/"><Dashboard /></Page>} />
      <Route path="/contacts"              element={<Page path="/contacts"><Contacts /></Page>} />
      <Route path="/products"              element={<Page path="/products"><Products /></Page>} />
      <Route path="/sales/orders"          element={<Page path="/sales/orders"><SalesOrders /></Page>} />
      <Route path="/sales/invoices"        element={<Page path="/sales/invoices"><Invoices /></Page>} />
      <Route path="/purchases/orders"      element={<Page path="/purchases/orders"><PurchaseOrders /></Page>} />
      <Route path="/purchases/bills"       element={<Page path="/purchases/bills"><Bills /></Page>} />
      <Route path="/payments"              element={<Page path="/payments"><Payments /></Page>} />
      <Route path="/accounting/accounts"   element={<Page path="/accounting/accounts"><ChartOfAccounts /></Page>} />
      <Route path="/accounting/journals"   element={<Page path="/accounting/journals"><Journals /></Page>} />
      <Route path="/accounting/entries"    element={<Page path="/accounting/entries"><JournalEntries /></Page>} />
      <Route path="/analytic"              element={<Page path="/analytic"><AnalyticAccounts /></Page>} />
      <Route path="/budgets"               element={<Page path="/budgets"><Budgets /></Page>} />
      <Route path="/reports/balance-sheet" element={<Page path="/reports/balance-sheet"><BalanceSheet /></Page>} />
      <Route path="/reports/profit-loss"   element={<Page path="/reports/profit-loss"><ProfitLoss /></Page>} />
      <Route path="/reports/budget"        element={<Page path="/reports/budget"><BudgetReport /></Page>} />

      {/* Fallback */}
      <Route path="*" element={<PrivateRoute><Navigate to={"/my-portal"} replace /></PrivateRoute>} />
    </Routes>
  );
}

// Fallback redirect reads user role
function SmartFallback() {
  const { user } = useAuth();
  return <Navigate to={defaultRoute(user?.role)} replace />;
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

