import { useEffect, useState } from "react";
import { api } from "../api";

const EMPTY = { name: "", type: "customer", email: "", mobile: "", city: "", state: "", pincode: "", profile_image: "" };

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
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    api.getContacts()
      .then((data) => { setContacts(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (c) => { setEditing(c.id); setForm({ ...c, profile_image: c.profile_image || "" }); setError(""); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(""); };

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await api.updateContact(editing, form);
        setSuccess("Contact updated.");
      } else {
        await api.createContact(form);
        setSuccess("Contact created.");
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

  const filtered = contacts.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || c.type === filterType;
    return matchSearch && matchType;
  });

  return (
    <div>
      {success && <div className="alert alert-success">{success} <button onClick={() => setSuccess("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer" }}>✕</button></div>}
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
                {filtered.map((c, i) => (
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
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Contact" : "Add Contact"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error" style={{ marginBottom: 12 }}>{error}</div>}
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="Full name" required />
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
                    <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
                  </div>
                  <div className="form-group">
                    <label>Mobile</label>
                    <input name="mobile" value={form.mobile} onChange={handleChange} placeholder="+91 98765 43210" />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input name="city" value={form.city} onChange={handleChange} placeholder="Mumbai" />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input name="state" value={form.state} onChange={handleChange} placeholder="Maharashtra" />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input name="pincode" value={form.pincode} onChange={handleChange} placeholder="400001" />
                  </div>
                  <div className="form-group span-2">
                    <label>Profile Image URL</label>
                    <input name="profile_image" value={form.profile_image} onChange={handleChange} placeholder="https://…" />
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
