import Sidebar from "./Sidebar";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PAGE_TITLES = {
  "/": "Dashboard",
  "/contacts": "Contacts",
  "/products": "Products",
  "/sales/orders": "Sales Orders",
  "/sales/invoices": "Invoices",
  "/purchases/orders": "Purchase Orders",
  "/purchases/bills": "Bills",
  "/payments": "Payments",
  "/accounting/accounts": "Chart of Accounts",
  "/accounting/journals": "Journals",
  "/accounting/entries": "Journal Entries",
  "/analytic": "Analytic Accounts",
  "/budgets": "Budgets",
  "/reports/balance-sheet": "Balance Sheet",
  "/reports/profit-loss": "Profit & Loss",
  "/reports/budget": "Budget Report",
};

const ROLE_LABELS = {
  admin: "Admin",
  accountant: "Accountant",
  contact_user: "Contact User",
};

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const title = PAGE_TITLES[pathname] || "Urban Furniture Accounting";

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <h2>{title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {user && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>
                  {user.full_name}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                  {ROLE_LABELS[user.role] || user.role}
                </div>
              </div>
            )}
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--primary)", color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>
              {user ? user.full_name.charAt(0).toUpperCase() : "?"}
            </div>
          </div>
        </div>
        <div className="page">{children}</div>
      </div>
    </div>
  );
}
