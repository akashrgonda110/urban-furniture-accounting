import { useEffect, useState } from "react";
import { api } from "../../api";
import SuccessAlert from "../../components/SuccessAlert";
import Pagination from "../../components/Pagination";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

const EMPTY_ITEM = { product_id: "", quantity: "1", unit_price: "", tax_rate: "0" };

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewOrder, setViewOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);

  // Quick-create vendor state
  const [showQuickVendor, setShowQuickVendor] = useState(false);
  const [quickName, setQuickName] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickMobile, setQuickMobile] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickError, setQuickError] = useState("");

  const [form, setForm] = useState({ vendor_id: "", order_date: today() });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  function today() {
    return new Date().toISOString().split("T")[0];
  }

  const load = () => {
    setLoading(true);
    Promise.all([api.getPurchaseOrders(), api.getContacts(), api.getProducts()])
      .then(([o, c, p]) => {
        setOrders(o);
        setVendors(c.filter((x) => x.type === "vendor" || x.type === "both"));
        setProducts(p);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ vendor_id: "", order_date: today() });
    setItems([{ ...EMPTY_ITEM }]);
    setError("");
    setShowCreate(true);
  };

  const closeCreate = () => { setShowCreate(false); setError(""); };

  const openView = (id) => {
    api.getPurchaseOrder(id).then(setViewOrder).catch((e) => setError(e.message));
  };

  const setItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === "product_id" && value) {
        const p = products.find((x) => String(x.id) === String(value));
        if (p) next[i].unit_price = String(p.purchase_price);
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
    const taxAmt = (sub * tax) / 100;
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
    if (!form.vendor_id) { setError("Please select a vendor."); return; }
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
      await api.createPurchaseOrder({ ...form, items });
      setSuccess("Purchase order created successfully.");
      closeCreate(); load();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleConfirm = async (id) => {
    try {
      await api.confirmPurchaseOrder(id);
      setSuccess("Order confirmed.");
      load();
      if (viewOrder?.id === id) setViewOrder(null);
    } catch (err) { setError(err.message); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this purchase order?")) return;
    try {
      await api.cancelPurchaseOrder(id);
      setSuccess("Order cancelled.");
      load();
      if (viewOrder?.id === id) setViewOrder(null);
    } catch (err) { setError(err.message); }
  };

  const handleCreateBill = async (orderId) => {
    try {
      await api.createBill({ purchase_order_id: orderId });
      setSuccess("Bill created successfully.");
      load();
      if (viewOrder?.id === orderId) setViewOrder(null);
    } catch (err) { setError(err.message); }
  };

  const handleQuickVendor = async (e) => {
    e.preventDefault();
    if (!quickName.trim()) { setQuickError("Name is required."); return; }
    if (!/^[a-zA-Z\s'.,-]+$/.test(quickName.trim())) { setQuickError("Name can only contain letters and spaces."); return; }
    if (quickEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(quickEmail)) { setQuickError("Invalid email address."); return; }
    if (quickMobile.trim() && !/^\+?[0-9]{7,15}$/.test(quickMobile.trim().replace(/\s/g, ""))) { setQuickError("Mobile must contain 7–15 digits."); return; }
    setQuickSaving(true); setQuickError("");
    try {
      const newContact = await api.createContact({
        name: quickName.trim(),
        type: "vendor",
        email: quickEmail.trim() || null,
        mobile: quickMobile.trim() || null,
      });
      setVendors((prev) => [...prev, newContact]);
      setForm((f) => ({ ...f, vendor_id: String(newContact.id) }));
      setShowQuickVendor(false);
      setQuickName(""); setQuickEmail(""); setQuickMobile("");
    } catch (err) {
      setQuickError(err.message);
    } finally { setQuickSaving(false); }
  };

  const filteredOrders = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (o.vendor_name || "").toLowerCase().includes(q) ||
      `po-${String(o.id).padStart(4, "0")}`.includes(q);
    const matchesStatus = filterStatus === "all" || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => { setPage(1); }, [search, filterStatus]);
  const paginated = filteredOrders.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showCreate && !viewOrder && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            placeholder="Search by vendor or PO-XXXX…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 260 }}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 150 }}>
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="confirmed">Confirmed</option>
            <option value="billed">Billed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}>+ New Purchase Order</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : filteredOrders.length === 0 ? (
          <div className="empty">No purchase orders found.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Vendor</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((o) => (
                  <tr key={o.id}>
                    <td><strong>PO-{String(o.id).padStart(4, "0")}</strong></td>
                    <td>{o.vendor_name}</td>
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
                          <button className="btn btn-success btn-sm" onClick={() => handleCreateBill(o.id)}>Bill</button>
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
        <Pagination total={filteredOrders.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={closeCreate}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Purchase Order</h3>
              <button className="modal-close" onClick={closeCreate}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid" style={{ marginBottom: 20 }}>
                  <div className="form-group">
                    <label>Vendor *</label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <select
                        value={form.vendor_id}
                        onChange={(e) => setForm((f) => ({ ...f, vendor_id: e.target.value }))}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">— Select vendor —</option>
                        {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                      </select>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: "7px 12px", fontSize: 16, lineHeight: 1, flexShrink: 0 }}
                        title="Quick-create a new vendor"
                        onClick={() => { setShowQuickVendor(true); setQuickError(""); }}
                      >
                        +
                      </button>
                    </div>
                    <span className="form-hint">Can't find the vendor? Click + to create one instantly.</span>
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

      {/* Quick Create Vendor mini-modal */}
      {showQuickVendor && (
        <div className="modal-backdrop" style={{ zIndex: 300 }} onClick={() => setShowQuickVendor(false)}>
          <div className="modal" style={{ maxWidth: 380, zIndex: 301 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quick Create Vendor</h3>
              <button className="modal-close" onClick={() => setShowQuickVendor(false)}>✕</button>
            </div>
            <form onSubmit={handleQuickVendor}>
              <div className="modal-body">
                {quickError && <div className="alert alert-error" style={{ marginBottom: 12 }}>{quickError}</div>}
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Name *</label>
                    <input value={quickName} onChange={(e) => setQuickName(e.target.value)} placeholder="e.g. Teak Wood Suppliers" autoFocus maxLength={150} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={quickEmail} onChange={(e) => setQuickEmail(e.target.value)} placeholder="vendor@example.com (optional)" maxLength={150} />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input value={quickMobile} onChange={(e) => setQuickMobile(e.target.value)} placeholder="+91 9876543210 (optional)" maxLength={16} />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  Saved as type <strong>Vendor</strong> and auto-selected.
                </p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowQuickVendor(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={quickSaving}>{quickSaving ? "Creating…" : "Create & Select"}</button>
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
              <h3>Purchase Order — PO-{String(viewOrder.id).padStart(4, "0")}</h3>
              <button className="modal-close" onClick={() => setViewOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-error">{error}</div>}
              <div className="detail-meta">
                <div className="detail-meta-item"><label>Vendor</label><span>{viewOrder.vendor_name}</span></div>
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
                <button className="btn btn-success" onClick={() => handleCreateBill(viewOrder.id)}>Create Bill</button>
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
