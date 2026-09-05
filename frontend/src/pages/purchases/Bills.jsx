import { useEffect, useState } from "react";
import { api } from "../../api";
import SuccessAlert from "../../components/SuccessAlert";
import { printDocument } from "../../utils/printDocument";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [viewBill, setViewBill] = useState(null);
  const [showPayModal, setShowPayModal] = useState(null);
  const [journals, setJournals] = useState([]);
  const [payForm, setPayForm] = useState({ journal_id: "", payment_date: today(), amount: "", payment_method: "bank", reference: "" });
  const [paying, setPaying] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  function today() { return new Date().toISOString().split("T")[0]; }

  const load = () => {
    setLoading(true);
    Promise.all([api.getBills(), api.getJournals()])
      .then(([b, j]) => {
        setBills(b);
        setJournals(j.filter((x) => x.journal_type === "bank" || x.journal_type === "cash"));
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openView = (id) => {
    api.getBill(id).then(setViewBill).catch((e) => setError(e.message));
  };

  const openPay = (bill) => {
    setShowPayModal(bill);
    setPayForm({ journal_id: "", payment_date: today(), amount: String(bill.total_amount), payment_method: "bank", reference: "" });
    setError("");
  };

  const handlePay = async (e) => {
    e.preventDefault();
    if (!payForm.journal_id) { setError("Please select a payment journal."); return; }
    const amt = parseFloat(payForm.amount);
    if (!payForm.amount || isNaN(amt) || amt <= 0) { setError("Payment amount must be greater than 0."); return; }
    if (amt > parseFloat(showPayModal.total_amount) + 0.01) { setError(`Amount cannot exceed the bill total of ₹${showPayModal.total_amount}.`); return; }
    if (!payForm.payment_date) { setError("Payment date is required."); return; }
    setPaying(true); setError("");
    try {
      await api.payBill(showPayModal.id, payForm);
      setSuccess(`Payment of ${fmt(payForm.amount)} registered for Bill #${showPayModal.id}.`);
      setShowPayModal(null);
      setViewBill(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally { setPaying(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this bill?")) return;
    try {
      await api.cancelBill(id);
      setSuccess("Bill cancelled.");
      setViewBill(null);
      load();
    } catch (err) { setError(err.message); }
  };

  const statusOrder = { unpaid: 0, partially_paid: 1, paid: 2, cancelled: 3 };
  const sorted = [...bills].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  const filteredBills = sorted.filter((bill) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (bill.vendor_name || "").toLowerCase().includes(q) ||
      `bill-${String(bill.id).padStart(4, "0")}`.includes(q);
    const matchesStatus = filterStatus === "all" || bill.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showPayModal && !viewBill && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            placeholder="Search by vendor or BILL-XXXX…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 160 }}>
            <option value="all">All Status</option>
            <option value="unpaid">Unpaid</option>
            <option value="partially_paid">Partially Paid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-right">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Bills are created from Purchase Orders</span>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : bills.length === 0 ? (
          <div className="empty">No bills yet. Create a Purchase Order and generate a bill from it.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Bill #</th>
                  <th>Vendor</th>
                  <th>Bill Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((bill) => (
                  <tr key={bill.id}>
                    <td><strong>BILL-{String(bill.id).padStart(4, "0")}</strong></td>
                    <td>{bill.vendor_name}</td>
                    <td>{new Date(bill.bill_date).toLocaleDateString("en-IN")}</td>
                    <td>{bill.due_date ? new Date(bill.due_date).toLocaleDateString("en-IN") : "—"}</td>
                    <td><span className={`badge badge-${bill.status}`}>{bill.status.replace("_", " ")}</span></td>
                    <td>{fmt(bill.subtotal)}</td>
                    <td>{fmt(bill.tax_amount)}</td>
                    <td><strong>{fmt(bill.total_amount)}</strong></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(bill.id)}>View</button>
                        <button className="btn btn-secondary btn-sm" onClick={async () => { const d = await api.getBill(bill.id); printDocument(d, "bill"); }}>🖨</button>
                        {(bill.status === "unpaid" || bill.status === "partially_paid") && (
                          <button className="btn btn-success btn-sm" onClick={() => openPay(bill)}>Pay</button>
                        )}
                        {bill.status === "unpaid" && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(bill.id)}>Cancel</button>
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

      {/* View Bill Modal */}
      {viewBill && (
        <div className="modal-backdrop" onClick={() => setViewBill(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bill — BILL-{String(viewBill.id).padStart(4, "0")}</h3>
              <button className="modal-close" onClick={() => setViewBill(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="detail-meta">
                <div className="detail-meta-item"><label>Vendor</label><span>{viewBill.vendor_name}</span></div>
                <div className="detail-meta-item"><label>Bill Date</label><span>{new Date(viewBill.bill_date).toLocaleDateString("en-IN")}</span></div>
                <div className="detail-meta-item"><label>Due Date</label><span>{viewBill.due_date ? new Date(viewBill.due_date).toLocaleDateString("en-IN") : "—"}</span></div>
                <div className="detail-meta-item"><label>Status</label><span><span className={`badge badge-${viewBill.status}`}>{viewBill.status.replace("_"," ")}</span></span></div>
              </div>
              <table className="items-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Tax %</th><th>Tax Amt</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {(viewBill.items || []).map((item) => (
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
                <div className="report-row"><span>Subtotal</span><span>{fmt(viewBill.subtotal)}</span></div>
                <div className="report-row"><span>Tax</span><span>{fmt(viewBill.tax_amount)}</span></div>
                <div className="report-total"><span>Total</span><span>{fmt(viewBill.total_amount)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              {(viewBill.status === "unpaid" || viewBill.status === "partially_paid") && (
                <button className="btn btn-success" onClick={() => { setViewBill(null); openPay(viewBill); }}>Register Payment</button>
              )}
              {viewBill.status === "unpaid" && (
                <button className="btn btn-danger" onClick={() => handleCancel(viewBill.id)}>Cancel Bill</button>
              )}
              <button className="btn btn-secondary" onClick={() => printDocument(viewBill, "bill")}>🖨 Print PDF</button>
              <button className="btn btn-secondary" onClick={() => setViewBill(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal-backdrop" onClick={() => { setShowPayModal(null); setError(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register Payment — BILL-{String(showPayModal.id).padStart(4, "0")}</h3>
              <button className="modal-close" onClick={() => { setShowPayModal(null); setError(""); }}>✕</button>
            </div>
            <form onSubmit={handlePay}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="alert alert-info" style={{ marginBottom: 14 }}>
                  Vendor: <strong>{showPayModal.vendor_name}</strong> · Bill Total: <strong>{fmt(showPayModal.total_amount)}</strong>
                </div>
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Payment Journal *</label>
                    <select value={payForm.journal_id} onChange={(e) => setPayForm((f) => ({ ...f, journal_id: e.target.value }))} required>
                      <option value="">— Select journal —</option>
                      {journals.map((j) => <option key={j.id} value={j.id}>{j.journal_name} ({j.journal_type})</option>)}
                    </select>
                    {journals.length === 0 && <span className="form-hint" style={{ color: "var(--warning)" }}>No cash/bank journals found. Add one in Journals first.</span>}
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
