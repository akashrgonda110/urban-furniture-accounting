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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Quick Actions</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Link to="/contacts" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>👥 Manage Contacts</Link>
            <Link to="/sales/orders" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>🛒 New Sales Order</Link>
            <Link to="/purchases/orders" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>📋 New Purchase Order</Link>
            <Link to="/payments" className="btn btn-secondary" style={{ justifyContent: "flex-start" }}>💳 Register Payment</Link>
          </div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Business Flow</h3>
          <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 2 }}>
            <div>1. Add Contacts &amp; Products</div>
            <div>2. Create Sales / Purchase Orders</div>
            <div>3. Generate Invoices / Bills</div>
            <div>4. Register Payments</div>
            <div>5. View Journal Entries</div>
            <div>6. Review Financial Reports</div>
          </div>
        </div>
      </div>
    </div>
  );
}
