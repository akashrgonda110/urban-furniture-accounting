import { useEffect, useState } from "react";
import { api } from "../../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewInvoice, setViewInvoice] = useState(null);
  const [showPayModal, setShowPayModal] = useState(null); // invoice object
  const [journals, setJournals] = useState([]);
  const [payForm, setPayForm] = useState({ journal_id: "", payment_date: today(), amount: "", payment_method: "cash", reference: "" });
  const [paying, setPaying] = useState(false);

  function today() { return new Date().toISOString().split("T")[0]; }

  const load = () => {
    setLoading(true);
    Promise.all([api.getInvoices(), api.getJournals()])
      .then(([inv, j]) => {
        setInvoices(inv);
        setJournals(j.filter((x) => x.journal_type === "bank" || x.journal_type === "cash"));
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openView = (id) => {
    api.getInvoice(id).then(setViewInvoice).catch((e) => setError(e.message));
  };

  const openPay = (inv) => {
    setShowPayModal(inv);
    setPayForm({ journal_id: "", payment_date: today(), amount: String(inv.total_amount), payment_method: "cash", reference: "" });
    setError("");
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payForm.journal_id) { setError("Select a journal"); return; }
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) { setError("Enter a valid amount"); return; }
    setPaying(true); setError("");
    try {
      await api.payInvoice(showPayModal.id, payForm);
      setSuccess(`Payment of ${fmt(payForm.amount)} registered for Invoice #${showPayModal.id}.`);
      setShowPayModal(null);
      setViewInvoice(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally { setPaying(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this invoice?")) return;
    try {
      await api.cancelInvoice(id);
      setSuccess("Invoice cancelled.");
      setViewInvoice(null);
      load();
    } catch (err) { setError(err.message); }
  };

  const statusOrder = { unpaid: 0, partially_paid: 1, paid: 2, cancelled: 3 };
  const sorted = [...invoices].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  return (
    <div>
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {error && !showPayModal && !viewInvoice && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Invoices are created from Sales Orders</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : invoices.length === 0 ? (
          <div className="empty">No invoices yet. Create a Sales Order and generate an invoice from it.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Invoice Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((inv) => (
                  <tr key={inv.id}>
                    <td><strong>INV-{String(inv.id).padStart(4, "0")}</strong></td>
                    <td>{inv.customer_name}</td>
                    <td>{new Date(inv.invoice_date).toLocaleDateString("en-IN")}</td>
                    <td>{inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN") : "—"}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status.replace("_", " ")}</span></td>
                    <td>{fmt(inv.subtotal)}</td>
                    <td>{fmt(inv.tax_amount)}</td>
                    <td><strong>{fmt(inv.total_amount)}</strong></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(inv.id)}>View</button>
                        {(inv.status === "unpaid" || inv.status === "partially_paid") && (
                          <button className="btn btn-success btn-sm" onClick={() => openPay(inv)}>Pay</button>
                        )}
                        {inv.status === "unpaid" && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(inv.id)}>Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Invoice Modal */}
      {viewInvoice && (
        <div className="modal-backdrop" onClick={() => setViewInvoice(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invoice — INV-{String(viewInvoice.id).padStart(4, "0")}</h3>
              <button className="modal-close" onClick={() => setViewInvoice(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="detail-meta">
                <div className="detail-meta-item"><label>Customer</label><span>{viewInvoice.customer_name}</span></div>
                <div className="detail-meta-item"><label>Invoice Date</label><span>{new Date(viewInvoice.invoice_date).toLocaleDateString("en-IN")}</span></div>
                <div className="detail-meta-item"><label>Due Date</label><span>{viewInvoice.due_date ? new Date(viewInvoice.due_date).toLocaleDateString("en-IN") : "—"}</span></div>
                <div className="detail-meta-item"><label>Status</label><span><span className={`badge badge-${viewInvoice.status}`}>{viewInvoice.status.replace("_"," ")}</span></span></div>
              </div>
              <table className="items-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Tax %</th><th>Tax Amt</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {(viewInvoice.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>{fmt(item.unit_price)}</td>
                      <td>{item.tax_rate}%</td>
                      <td>{fmt(item.tax_amount)}</td>
                      <td><strong>{fmt(item.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="items-summary" style={{ marginTop: 12 }}>
                <div className="report-row"><span>Subtotal</span><span>{fmt(viewInvoice.subtotal)}</span></div>
                <div className="report-row"><span>Tax</span><span>{fmt(viewInvoice.tax_amount)}</span></div>
                <div className="report-total"><span>Total</span><span>{fmt(viewInvoice.total_amount)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              {(viewInvoice.status === "unpaid" || viewInvoice.status === "partially_paid") && (
                <button className="btn btn-success" onClick={() => { setViewInvoice(null); openPay(viewInvoice); }}>Register Payment</button>
              )}
              {viewInvoice.status === "unpaid" && (
                <button className="btn btn-danger" onClick={() => handleCancel(viewInvoice.id)}>Cancel Invoice</button>
              )}
              <button className="btn btn-secondary" onClick={() => setViewInvoice(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-backdrop" onClick={() => { setShowPayModal(null); setError(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register Payment — INV-{String(showPayModal.id).padStart(4, "0")}</h3>
              <button className="modal-close" onClick={() => { setShowPayModal(null); setError(""); }}>✕</button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="alert alert-info" style={{ marginBottom: 14 }}>
                  Customer: <strong>{showPayModal.customer_name}</strong> · Invoice Total: <strong>{fmt(showPayModal.total_amount)}</strong>
                </div>
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Payment Journal *</label>
                    <select value={payForm.journal_id} onChange={(e) => setPayForm((f) => ({ ...f, journal_id: e.target.value }))} required>
                      <option value="">— Select journal —</option>
                      {journals.map((j) => <option key={j.id} value={j.id}>{j.journal_name} ({j.journal_type})</option>)}
                    </select>
                    {journals.length === 0 && <span className="form-hint" style={{ color: "var(--warning)" }}>No cash/bank journals found. Add one first.</span>}
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
                    <label>Reference / Cheque No.</label>
                    <input value={payForm.reference} onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))} placeholder="Optional reference" />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowPayModal(null); setError(""); }}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={paying}>{paying ? "Processing…" : "Register Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
