import { useEffect, useState } from "react";
import { api } from "../../api";
import SuccessAlert from "../../components/SuccessAlert";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

const EMPTY_ITEM = { product_id: "", quantity: "1", unit_price: "", tax_rate: "0" };

export default function SalesOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({ customer_id: "", order_date: today() });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  function today() {
    return new Date().toISOString().split("T")[0];
  }

  const load = () => {
    setLoading(true);
    Promise.all([api.getSalesOrders(), api.getContacts(), api.getProducts()])
      .then(([o, c, p]) => {
        setOrders(o);
        setCustomers(c.filter((x) => x.type === "customer" || x.type === "both"));
        setProducts(p);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ customer_id: "", order_date: today() });
    setItems([{ ...EMPTY_ITEM }]);
    setError("");
    setShowCreate(true);
  };

  const closeCreate = () => { setShowCreate(false); setError(""); };

  const openView = (id) => {
    api.getSalesOrder(id).then(setViewOrder).catch((e) => setError(e.message));
  };

  // Item line helpers
  const setItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      // Auto-fill unit price from product
      if (field === "product_id" && value) {
        const p = products.find((x) => String(x.id) === String(value));
        if (p) next[i].unit_price = String(p.sales_price);
      }
      return next;
    });
  };

  const addItem = () => setItems((p) => [...p, { ...EMPTY_ITEM }]);
  const removeItem = (i) => setItems((p) => p.filter((_, idx) => idx !== i));

  const calcItem = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unit_price) || 0;
    const tax = parseFloat(item.tax_rate) || 0;
    const sub = qty * price;
    const taxAmt = sub * tax / 100;
    return { sub, taxAmt, total: sub + taxAmt };
  };

  const totals = items.reduce(
    (acc, item) => {
      const c = calcItem(item);
      return { sub: acc.sub + c.sub, tax: acc.tax + c.taxAmt, total: acc.total + c.total };
    },
    { sub: 0, tax: 0, total: 0 }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer_id) { setError("Please select a customer."); return; }
    if (items.length === 0) { setError("Add at least one item."); return; }
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.product_id) { setError(`Item ${i + 1}: Please select a product.`); return; }
      const qty = parseFloat(it.quantity);
      if (!it.quantity || isNaN(qty) || qty <= 0) { setError(`Item ${i + 1}: Quantity must be greater than 0.`); return; }
      const price = parseFloat(it.unit_price);
      if (it.unit_price === "" || isNaN(price) || price < 0) { setError(`Item ${i + 1}: Unit price must be 0 or a positive number.`); return; }
      const tax = parseFloat(it.tax_rate);
      if (it.tax_rate !== "" && (isNaN(tax) || tax < 0 || tax > 100)) { setError(`Item ${i + 1}: Tax rate must be between 0 and 100.`); return; }
    }
    setSaving(true); setError("");
    try {
      await api.createSalesOrder({ ...form, items });
      setSuccess("Sales order created successfully.");
      closeCreate(); load();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleConfirm = async (id) => {
    try {
      await api.confirmSalesOrder(id);
      setSuccess("Order confirmed.");
      load();
      if (viewOrder?.id === id) setViewOrder(null);
    } catch (err) { setError(err.message); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await api.cancelSalesOrder(id);
      setSuccess("Order cancelled.");
      load();
      if (viewOrder?.id === id) setViewOrder(null);
    } catch (err) { setError(err.message); }
  };

  const handleCreateInvoice = async (orderId) => {
    try {
      await api.createInvoice({ sales_order_id: orderId });
      setSuccess("Invoice created successfully.");
      load();
      if (viewOrder?.id === orderId) setViewOrder(null);
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showCreate && !viewOrder && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}>+ New Sales Order</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="empty">No sales orders yet. Create your first order.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>SO-{String(o.id).padStart(4, "0")}</strong></td>
                    <td>{o.customer_name}</td>
                    <td>{new Date(o.order_date).toLocaleDateString("en-IN")}</td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                    <td>{fmt(o.subtotal)}</td>
                    <td>{fmt(o.tax_amount)}</td>
                    <td><strong>{fmt(o.total_amount)}</strong></td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(o.id)}>View</button>
                        {o.status === "draft" && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleConfirm(o.id)}>Confirm</button>
                        )}
                        {o.status === "confirmed" && (
                          <button className="btn btn-success btn-sm" onClick={() => handleCreateInvoice(o.id)}>Invoice</button>
                        )}
                        {(o.status === "draft" || o.status === "confirmed") && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleCancel(o.id)}>Cancel</button>
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

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={closeCreate}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Sales Order</h3>
              <button className="modal-close" onClick={closeCreate}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid" style={{ marginBottom: 20 }}>
                  <div className="form-group">
                    <label>Customer *</label>
                    <select value={form.customer_id} onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))} required>
                      <option value="">— Select customer —</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Order Date</label>
                    <input type="date" value={form.order_date} onChange={(e) => setForm((f) => ({ ...f, order_date: e.target.value }))} />
                  </div>
                </div>

                <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Order Items</div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: "35%" }}>Product</th>
                      <th style={{ width: "12%" }}>Qty</th>
                      <th style={{ width: "18%" }}>Unit Price</th>
                      <th style={{ width: "12%" }}>Tax %</th>
                      <th style={{ width: "16%" }}>Total</th>
                      <th style={{ width: "7%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, i) => {
                      const c = calcItem(item);
                      return (
                        <tr key={i}>
                          <td>
                            <select value={item.product_id} onChange={(e) => setItem(i, "product_id", e.target.value)}>
                              <option value="">— Product —</option>
                              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                          </td>
                          <td><input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => setItem(i, "quantity", e.target.value)} /></td>
                          <td><input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => setItem(i, "unit_price", e.target.value)} placeholder="0.00" /></td>
                          <td><input type="number" min="0" max="100" step="0.01" value={item.tax_rate} onChange={(e) => setItem(i, "tax_rate", e.target.value)} /></td>
                          <td style={{ fontWeight: 500 }}>{fmt(c.total)}</td>
                          <td>
                            {items.length > 1 && (
                              <button type="button" onClick={() => removeItem(i)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 16 }}>✕</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}>+ Add Line</button>

                <div className="items-summary" style={{ marginTop: 16 }}>
                  <div className="report-row"><span>Subtotal</span><span>{fmt(totals.sub)}</span></div>
                  <div className="report-row"><span>Tax</span><span>{fmt(totals.tax)}</span></div>
                  <div className="report-total"><span>Total</span><span>{fmt(totals.total)}</span></div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCreate}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : "Create Order"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewOrder && (
        <div className="modal-backdrop" onClick={() => setViewOrder(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sales Order — SO-{String(viewOrder.id).padStart(4, "0")}</h3>
              <button className="modal-close" onClick={() => setViewOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="detail-meta">
                <div className="detail-meta-item"><label>Customer</label><span>{viewOrder.customer_name}</span></div>
                <div className="detail-meta-item"><label>Date</label><span>{new Date(viewOrder.order_date).toLocaleDateString("en-IN")}</span></div>
                <div className="detail-meta-item"><label>Status</label><span><span className={`badge badge-${viewOrder.status}`}>{viewOrder.status}</span></span></div>
              </div>
              <table className="items-table">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Tax %</th><th>Tax Amt</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {(viewOrder.items || []).map((item) => (
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
                <div className="report-row"><span>Subtotal</span><span>{fmt(viewOrder.subtotal)}</span></div>
                <div className="report-row"><span>Tax</span><span>{fmt(viewOrder.tax_amount)}</span></div>
                <div className="report-total"><span>Total</span><span>{fmt(viewOrder.total_amount)}</span></div>
              </div>
            </div>
            <div className="modal-footer">
              {viewOrder.status === "draft" && (
                <button className="btn btn-primary" onClick={() => handleConfirm(viewOrder.id)}>Confirm Order</button>
              )}
              {viewOrder.status === "confirmed" && (
                <button className="btn btn-success" onClick={() => handleCreateInvoice(viewOrder.id)}>Create Invoice</button>
              )}
              {(viewOrder.status === "draft" || viewOrder.status === "confirmed") && (
                <button className="btn btn-danger" onClick={() => handleCancel(viewOrder.id)}>Cancel</button>
              )}
              <button className="btn btn-secondary" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
