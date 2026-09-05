import { useEffect, useState } from "react";
import { api } from "../api";
import SuccessAlert from "../components/SuccessAlert";
import Pagination from "../components/Pagination";

const EMPTY = { name: "", type: "customer", email: "", mobile: "", city: "", state: "", pincode: "", profile_image: "" };

// ── Validation helpers ────────────────────────────────────────────────────────
function validateContact(form) {
  const name = form.name.trim();
  if (!name) return "Name is required.";
  if (name.length < 2) return "Name must be at least 2 characters.";
  if (!/^[a-zA-Z\s'.,-]+$/.test(name)) return "Name can only contain letters, spaces, and basic punctuation.";

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    return "Enter a valid email address.";

  if (form.mobile) {
    const mobile = form.mobile.replace(/\s/g, "");
    if (!/^\+?[0-9]{7,15}$/.test(mobile))
      return "Mobile must contain 7–15 digits (optionally starting with +).";
  }

  if (form.city && !/^[a-zA-Z\s'-]+$/.test(form.city))
    return "City should contain letters only.";

  if (form.state && !/^[a-zA-Z\s'-]+$/.test(form.state))
    return "State should contain letters only.";

  if (form.pincode && !/^\d{4,10}$/.test(form.pincode.trim()))
    return "Pincode must be 4–10 digits.";

  return null;
}

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCity, setFilterCity] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [deleteId, setDeleteId] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const PAGE_SIZE = 25;
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    api.getContacts()
      .then((data) => { setContacts(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setFieldErrors({}); setShowModal(true); };
  const openEdit = (c) => { setEditing(c.id); setForm({ ...c, profile_image: c.profile_image || "" }); setError(""); setFieldErrors({}); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(""); setFieldErrors({}); };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) setFieldErrors((fe) => ({ ...fe, [name]: "" }));
  };

  // Convert uploaded file to base64 and store in profile_image
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (!allowed.includes(file.type)) {
      setError("Only JPG, PNG, or PDF files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("File size must be under 2 MB.");
      e.target.value = "";
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setForm((f) => ({ ...f, profile_image: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateContact(form);
    if (err) { setError(err); return; }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.updateContact(editing, form);
        setSuccess("Contact updated successfully.");
      } else {
        await api.createContact(form);
        setSuccess("Contact created successfully.");
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
      await api.deleteContact(id);
      setSuccess("Contact deleted.");
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
  };

  // Unique city and state lists for dropdowns (sorted, non-empty)
  const cities  = [...new Set(contacts.map((c) => c.city).filter(Boolean))].sort();
  const states  = [...new Set(contacts.map((c) => c.state).filter(Boolean))].sort();

  const filtered = contacts.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchType  = filterType  === "all" || c.type === filterType;
    const matchCity  = filterCity  === "all" || (c.city  || "").toLowerCase() === filterCity.toLowerCase();
    const matchState = filterState === "all" || (c.state || "").toLowerCase() === filterState.toLowerCase();
    return matchSearch && matchType && matchCity && matchState;
  });

  useEffect(() => { setPage(1); }, [search, filterType, filterCity, filterState]);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <input placeholder="Search contacts…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Types</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="both">Both</option>
          </select>
          <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)} style={{ width: 140 }}>
            <option value="all">All States</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Contact</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No contacts found. Add your first contact.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td><strong>{c.name}</strong></td>
                    <td><span className={`badge badge-${c.type}`}>{c.type}</span></td>
                    <td>{c.email || "—"}</td>
                    <td>{c.mobile || "—"}</td>
                    <td>{c.city || "—"}</td>
                    <td>{c.state || "—"}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onChange={setPage} />
      </div>
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Contact" : "Add Contact"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} noValidate>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Kumar"
                      maxLength={150}
                    />
                    <span className="form-hint">Letters, spaces, and basic punctuation only.</span>
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="type" value={form.type} onChange={handleChange}>
                      <option value="customer">Customer</option>
                      <option value="vendor">Vendor</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                      maxLength={150}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input
                      name="mobile"
                      value={form.mobile}
                      onChange={handleChange}
                      placeholder="+91 9876543210"
                      maxLength={16}
                    />
                    <span className="form-hint">Digits only, 7–15 characters. Optional +country code.</span>
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      name="city"
                      value={form.city}
                      onChange={handleChange}
                      placeholder="Mumbai"
                      maxLength={100}
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      name="state"
                      value={form.state}
                      onChange={handleChange}
                      placeholder="Maharashtra"
                      maxLength={100}
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      name="pincode"
                      value={form.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                      maxLength={10}
                    />
                    <span className="form-hint">4–10 digits only.</span>
                  </div>
                  <div className="form-group span-2">
                    <label>Profile Image</label>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileChange}
                      style={{ padding: "6px 0" }}
                    />
                    <span className="form-hint">Accepted: JPG, PNG, PDF · Max 2 MB</span>
                    {form.profile_image && form.profile_image.startsWith("data:image") && (
                      <div style={{ marginTop: 8 }}>
                        <img
                          src={form.profile_image}
                          alt="Preview"
                          style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 6, border: "1px solid var(--border)" }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, profile_image: "" }))}
                          style={{ marginLeft: 10, background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}
                    {form.profile_image && form.profile_image.startsWith("data:application/pdf") && (
                      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
                        📄 PDF uploaded
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, profile_image: "" }))}
                          style={{ marginLeft: 10, background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 12 }}
                        >
                          ✕ Remove
                        </button>
                      </div>
                    )}
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

      {/* Delete confirmation */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3>Delete Contact</h3><button className="modal-close" onClick={() => setDeleteId(null)}>✕</button></div>
            <div className="modal-body">
              <p style={{ fontSize: 14 }}>Are you sure you want to delete this contact? This cannot be undone.</p>
            </div>
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
