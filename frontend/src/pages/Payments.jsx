import { useEffect, useState } from "react";
import { api } from "../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | invoice | bill

  const load = () => {
    setLoading(true);
    api.getPayments()
      .then((data) => { setPayments(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const filtered = payments.filter((p) => {
    if (filterType === "invoice") return p.invoice_id !== null;
    if (filterType === "bill") return p.bill_id !== null;
    return true;
  });

  const totalIn = payments
    .filter((p) => p.invoice_id !== null)
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  const totalOut = payments
    .filter((p) => p.bill_id !== null)
    .reduce((s, p) => s + parseFloat(p.amount), 0);

  return (
    <div>
      {error && <div className="alert alert-error">{error}</div>}

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Received</div>
          <div className="stat-value money">{fmt(totalIn)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Paid Out</div>
          <div className="stat-value warn">{fmt(totalOut)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{payments.length}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Payments</option>
            <option value="invoice">Customer Receipts</option>
            <option value="bill">Vendor Payments</option>
          </select>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Payments are registered from Invoices or Bills
          </span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No payments found. Register payments from Invoices or Bills.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Payment #</th>
                  <th>Type</th>
                  <th>Contact</th>
                  <th>Reference</th>
                  <th>Journal</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td><strong>PMT-{String(p.id).padStart(4, "0")}</strong></td>
                    <td>
                      {p.invoice_id ? (
                        <span className="badge badge-income">Customer Receipt</span>
                      ) : (
                        <span className="badge badge-expense">Vendor Payment</span>
                      )}
                    </td>
                    <td>{p.contact_name}</td>
                    <td>
                      {p.invoice_id
                        ? <span style={{ color: "var(--text-muted)" }}>INV-{String(p.invoice_ref || p.invoice_id).padStart(4, "0")}</span>
                        : <span style={{ color: "var(--text-muted)" }}>BILL-{String(p.bill_ref || p.bill_id).padStart(4, "0")}</span>
                      }
                      {p.reference && <span style={{ marginLeft: 6, fontSize: 11, color: "var(--text-muted)" }}>· {p.reference}</span>}
                    </td>
                    <td>{p.journal_name}</td>
                    <td>
                      <span className="badge" style={{ background: "#f0f4ff", color: "#1a56db" }}>
                        {p.payment_method.charAt(0).toUpperCase() + p.payment_method.slice(1)}
                      </span>
                    </td>
                    <td>{new Date(p.payment_date).toLocaleDateString("en-IN")}</td>
                    <td><strong>{fmt(p.amount)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
