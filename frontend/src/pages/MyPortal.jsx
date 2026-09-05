import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

function today() { return new Date().toISOString().split("T")[0]; }

export default function MyPortal() {
  const { user } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [bills, setBills]       = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");

  // Payment modal state
  const [payTarget, setPayTarget] = useState(null); // { type: 'invoice'|'bill', record }
  const [payForm, setPayForm]     = useState({ journal_id: "", payment_date: today(), amount: "", payment_method: "cash", reference: "" });
  const [paying, setPaying]       = useState(false);
  const [payError, setPayError]   = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [allInvoices, allBills, allJournals] = await Promise.all([
        api.getInvoices(),
        api.getBills(),
        api.getJournals(),
      ]);

      // Filter by contact_id linked to this user
      const cid = user?.contact_id ? String(user.contact_id) : null;

      if (cid) {
        setInvoices(allInvoices.filter((i) => String(i.customer_id) === cid));
        setBills(allBills.filter((b) => String(b.vendor_id) === cid));
      } else {
        // No contact linked — show nothing but don't crash
        setInvoices([]);
        setBills([]);
      }

      setJournals(allJournals.filter((j) => j.journal_type === "bank" || j.journal_type === "cash"));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Auto-dismiss success
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(t);
  }, [success]);

  const openPay = (type, record) => {
    setPayTarget({ type, record });
    setPayForm({ journal_id: "", payment_date: today(), amount: String(record.total_amount), payment_method: "cash", reference: "" });
    setPayError("");
  };

  const closePay = () => { setPayTarget(null); setPayError(""); };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payForm.journal_id) { setPayError("Please select a payment journal."); return; }
    const amt = parseFloat(payForm.amount);
    if (!payForm.amount || isNaN(amt) || amt <= 0) { setPayError("Enter a valid amount."); return; }
    if (amt > parseFloat(payTarget.record.total_amount) + 0.01) {
      setPayError(`Amount cannot exceed ${fmt(payTarget.record.total_amount)}.`); return;
    }
    setPaying(true); setPayError("");
    try {
      if (payTarget.type === "invoice") {
        await api.payInvoice(payTarget.record.id, payForm);
        setSuccess(`Payment of ${fmt(amt)} registered for Invoice #${payTarget.record.id}.`);
      } else {
        await api.payBill(payTarget.record.id, payForm);
        setSuccess(`Payment of ${fmt(amt)} registered for Bill #${payTarget.record.id}.`);
      }
      closePay();
      load();
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const unpaidInvoices  = invoices.filter((i) => i.status === "unpaid" || i.status === "partially_paid");
  const paidInvoices    = invoices.filter((i) => i.status === "paid");
  const unpaidBills     = bills.filter((b) => b.status === "unpaid" || b.status === "partially_paid");
  const paidBills       = bills.filter((b) => b.status === "paid");

  const totalDue = [...unpaidInvoices, ...unpaidBills].reduce((s, r) => s + parseFloat(r.total_amount), 0);

  if (loading) return <div className="loading">Loading your portal…</div>;

  return (
    <div>
      {success && <div className="alert alert-success">{success}</div>}
      {error   && <div className="alert alert-error">{error}</div>}

      {!user?.contact_id && (
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          Your account is not linked to a contact record. Please ask your administrator to link your account to a contact so your invoices and bills appear here.
        </div>
      )}

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Outstanding Invoices</div>
          <div className="stat-value warn">{unpaidInvoices.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding Bills</div>
          <div className="stat-value warn">{unpaidBills.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Amount Due</div>
          <div className="stat-value money">{fmt(totalDue)}</div>
        </div>
      </div>

      {/* Invoices */}
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
        My Invoices
      </h3>
      <div className="card" style={{ padding: 0, marginBottom: 24 }}>
        {invoices.length === 0 ? (
          <div className="empty">No invoices found for your account.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>INV-{String(inv.id).padStart(4,"0")}</strong></td>
                    <td>{new Date(inv.invoice_date).toLocaleDateString("en-IN")}</td>
                    <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN") : "—"}</td>
                    <td>{fmt(inv.subtotal)}</td>
                    <td>{fmt(inv.tax_amount)}</td>
                    <td><strong>{fmt(inv.total_amount)}</strong></td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status.replace("_"," ")}</span></td>
                    <td>
                      {(inv.status === "unpaid" || inv.status === "partially_paid") ? (
                        <button className="btn btn-success btn-sm" onClick={() => openPay("invoice", inv)}>Pay Now</button>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>✓ Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bills */}
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
        My Bills
      </h3>
      <div className="card" style={{ padding: 0 }}>
        {bills.length === 0 ? (
          <div className="empty">No bills found for your account.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Bill Date</th>
                  <th>Due Date</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id}>
                    <td><strong>BILL-{String(bill.id).padStart(4,"0")}</strong></td>
                    <td>{new Date(bill.bill_date).toLocaleDateString("en-IN")}</td>
                    <td>{bill.due_date ? new Date(bill.due_date).toLocaleDateString("en-IN") : "—"}</td>
                    <td>{fmt(bill.subtotal)}</td>
                    <td>{fmt(bill.tax_amount)}</td>
                    <td><strong>{fmt(bill.total_amount)}</strong></td>
                    <td><span className={`badge badge-${bill.status}`}>{bill.status.replace("_"," ")}</span></td>
                    <td>
                      {(bill.status === "unpaid" || bill.status === "partially_paid") ? (
                        <button className="btn btn-success btn-sm" onClick={() => openPay("bill", bill)}>Pay Now</button>
                      ) : (
                        <span style={{ fontSize: 12, color: "var(--success)", fontWeight: 600 }}>✓ Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {payTarget && (
        <div className="modal-backdrop" onClick={closePay}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Pay {payTarget.type === "invoice"
                  ? `Invoice INV-${String(payTarget.record.id).padStart(4,"0")}`
                  : `Bill BILL-${String(payTarget.record.id).padStart(4,"0")}`}
              </h3>
              <button className="modal-close" onClick={closePay}>✕</button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                {payError && <div className="alert alert-error">{payError}</div>}
                <div className="alert alert-info" style={{ marginBottom: 14 }}>
                  Total: <strong>{fmt(payTarget.record.total_amount)}</strong>
                </div>
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Payment Journal *</label>
                    <select value={payForm.journal_id} onChange={(e) => setPayForm((f) => ({ ...f, journal_id: e.target.value }))} required>
                      <option value="">— Select journal —</option>
                      {journals.map((j) => <option key={j.id} value={j.id}>{j.journal_name} ({j.journal_type})</option>)}
                    </select>
                    {journals.length === 0 && <span className="form-hint" style={{ color: "var(--warning)" }}>No cash/bank journals available.</span>}
                  </div>
                  <div className="form-group">
                    <label>Payment Method *</label>
                    <select value={payForm.payment_method} onChange={(e) => setPayForm((f) => ({ ...f, payment_method: e.target.value }))}>
                      <option value="cash">Cash</option>
                      <option value="bank">Bank</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input type="date" value={payForm.payment_date} onChange={(e) => setPayForm((f) => ({ ...f, payment_date: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Amount (₹) *</label>
                    <input type="number" min="0.01" step="0.01" value={payForm.amount} onChange={(e) => setPayForm((f) => ({ ...f, amount: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label>Reference</label>
                    <input value={payForm.reference} onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closePay}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={paying}>{paying ? "Processing…" : "Confirm Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
