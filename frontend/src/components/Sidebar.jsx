import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_LABELS = {
  admin: "Admin / Business Owner",
  accountant: "Accountant",
  contact_user: "Contact User",
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Urban Furniture</h1>
        <span>Accounting System</span>
      </div>

      <nav>
        <NavLink to="/" end>📊 Dashboard</NavLink>

        <div className="nav-label">Master Data</div>
        <NavLink to="/contacts">👥 Contacts</NavLink>
        <NavLink to="/products">📦 Products</NavLink>

        <div className="nav-label">Sales</div>
        <NavLink to="/sales/orders" className="sub">Sales Orders</NavLink>
        <NavLink to="/sales/invoices" className="sub">Invoices</NavLink>

        <div className="nav-label">Purchases</div>
        <NavLink to="/purchases/orders" className="sub">Purchase Orders</NavLink>
        <NavLink to="/purchases/bills" className="sub">Bills</NavLink>

        <div className="nav-label">Finance</div>
        <NavLink to="/payments">💳 Payments</NavLink>

        <div className="nav-label">Accounting</div>
        <NavLink to="/accounting/accounts" className="sub">Chart of Accounts</NavLink>
        <NavLink to="/accounting/journals" className="sub">Journals</NavLink>
        <NavLink to="/accounting/entries" className="sub">Journal Entries</NavLink>

        <div className="nav-label">Analytics</div>
        <NavLink to="/analytic">📈 Analytic Accounts</NavLink>
        <NavLink to="/budgets">🎯 Budgets</NavLink>

        <div className="nav-label">Reports</div>
        <NavLink to="/reports/balance-sheet" className="sub">Balance Sheet</NavLink>
        <NavLink to="/reports/profit-loss" className="sub">Profit &amp; Loss</NavLink>
        <NavLink to="/reports/budget" className="sub">Budget Report</NavLink>
      </nav>

      {/* User info + logout at bottom */}
      {user && (
        <div style={{
          borderTop: "1px solid #334155",
          padding: "12px 16px",
          marginTop: "auto",
        }}>
          <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {user.full_name}
          </div>
          <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
            {ROLE_LABELS[user.role] || user.role}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              background: "transparent",
              border: "1px solid #475569",
              color: "#94a3b8",
              borderRadius: 4,
              padding: "6px 10px",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            ↩ Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
