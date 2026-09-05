import { useEffect, useState } from "react";
import { api } from "../api";
import SuccessAlert from "../components/SuccessAlert";

const EMPTY = { name: "", type: "goods", sales_price: "", purchase_price: "", category: "" };

function fmt(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);
}

function validateProduct(form) {
  const name = form.name.trim();
  if (!name) return "Product name is required.";
  if (name.length < 2) return "Product name must be at least 2 characters.";
  if (!/[a-zA-Z]/.test(name))
    return "Product name must contain at least one letter.";
  if (!/^[a-zA-Z0-9\s'.,&()-]+$/.test(name))
    return "Product name can only contain letters, numbers, spaces, and basic punctuation.";

  const sp = form.sales_price === "" ? null : parseFloat(form.sales_price);
  const pp = form.purchase_price === "" ? null : parseFloat(form.purchase_price);

  if (sp !== null && (isNaN(sp) || sp < 0))
    return "Sales price must be 0 or a positive number.";
  if (pp !== null && (isNaN(pp) || pp < 0))
    return "Purchase price must be 0 or a positive number.";

  if (form.category && form.category.trim() && !/^[a-zA-Z\s&/-]+$/.test(form.category.trim()))
    return "Category should contain letters only.";

  return null;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    api.getProducts()
      .then((data) => { setProducts(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({ ...p, sales_price: String(p.sales_price), purchase_price: String(p.purchase_price) }); setError(""); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(""); };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateProduct(form);
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.updateProduct(editing, form);
        setSuccess("Product updated successfully.");
      } else {
        await api.createProduct(form);
        setSuccess("Product created successfully.");
      }
      closeModal();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteProduct(id);
      setSuccess("Product deleted.");
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || "").toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Types</option>
            <option value="goods">Goods</option>
            <option value="service">Service</option>
            <option value="combo">Combo</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No products found. Add your first product.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Sales Price</th>
                  <th>Purchase Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td><strong>{p.name}</strong></td>
                    <td><span className={`badge badge-${p.type}`}>{p.type}</span></td>
                    <td>{p.category || "—"}</td>
                    <td>{fmt(p.sales_price)}</td>
                    <td>{fmt(p.purchase_price)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Product" : "Add Product"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Product Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Teak Dining Table"
                      maxLength={150}
                    />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="type" value={form.type} onChange={handleChange}>
                      <option value="goods">Goods</option>
                      <option value="service">Service</option>
                      <option value="combo">Combo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      placeholder="e.g. Furniture"
                      maxLength={100}
                    />
                    <span className="form-hint">Letters only, no numbers.</span>
                  </div>
                  <div className="form-group">
                    <label>Sales Price (₹)</label>
                    <input
                      name="sales_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.sales_price}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="form-group">
                    <label>Purchase Price (₹)</label>
                    <input
                      name="purchase_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.purchase_price}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Saving…" : (editing ? "Update" : "Create")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Delete Product</h3><button className="modal-close" onClick={() => setDeleteId(null)}>✕</button></div>
            <div className="modal-body"><p style={{ fontSize: 14 }}>Delete this product? This cannot be undone.</p></div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
