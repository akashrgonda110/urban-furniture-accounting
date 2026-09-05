import { useEffect, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="loading">Loading dashboard…</div>;

  return (
    <div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{data.total_customers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Vendors</div>
          <div className="stat-value">{data.total_vendors}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{data.total_products}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Sales</div>
          <div className="stat-value money">{fmt(data.total_sales)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Purchases</div>
          <div className="stat-value money">{fmt(data.total_purchases)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding Invoices</div>
          <div className="stat-value warn">{fmt(data.outstanding_invoices)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding Bills</div>
          <div className="stat-value warn">{fmt(data.outstanding_bills)}</div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
          {[
            { to: "/contacts",            icon: "👥", label: "Manage Contacts",  sub: "Add or edit contacts" },
            { to: "/sales/orders",        icon: "🛒", label: "New Sales Order",  sub: "Create a customer order" },
            { to: "/purchases/orders",    icon: "📦", label: "Purchase Order",   sub: "Order from a vendor" },
            { to: "/sales/invoices",      icon: "🧾", label: "View Invoices",    sub: "Customer invoices" },
            { to: "/purchases/bills",     icon: "📄", label: "View Bills",       sub: "Vendor bills" },
            { to: "/payments",            icon: "💳", label: "Payments",         sub: "Register a payment" },
            { to: "/accounting/entries",  icon: "📒", label: "Journal Entries",  sub: "View accounting entries" },
            { to: "/reports/profit-loss", icon: "📊", label: "Profit & Loss",    sub: "Financial report" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "36px 16px 30px",
                textDecoration: "none",
                color: "var(--text)",
                transition: "box-shadow 0.15s, border-color 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,86,219,0.13)";
                e.currentTarget.style.borderColor = "var(--primary)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <span style={{ fontSize: 58, lineHeight: 1 }}>{item.icon}</span>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
