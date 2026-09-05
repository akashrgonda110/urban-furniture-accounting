import { useEffect, useState } from "react";
import { api } from "../../api";
import SuccessAlert from "../../components/SuccessAlert";

const EMPTY = { account_name: "", account_type: "asset", is_active: true };
const TYPES = ["asset", "liability", "expense", "income", "capital"];

export default function ChartOfAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterActive, setFilterActive] = useState("all");

  const load = () => {
    setLoading(true);
    api.getAccounts()
      .then((data) => { setAccounts(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (a) => { setEditing(a.id); setForm({ account_name: a.account_name, account_type: a.account_type, is_active: a.is_active }); setError(""); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(""); };
  const handleChange = (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [e.target.name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.account_name.trim();
    if (!name) { setError("Account name is required."); return; }
    if (name.length < 2) { setError("Account name must be at least 2 characters."); return; }
    if (!/^[a-zA-Z0-9\s'.,&()/-]+$/.test(name)) { setError("Account name can only contain letters, numbers, spaces, and basic punctuation."); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        await api.updateAccount(editing, form);
        setSuccess("Account updated.");
      } else {
        await api.createAccount(form);
        setSuccess("Account created.");
      }
      closeModal(); load();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      await api.toggleAccount(id);
      setSuccess("Account status updated.");
      load();
    } catch (err) { setError(err.message); }
  };

  const filtered = accounts.filter((a) => {
    const matchSearch = a.account_name.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || a.account_type === filterType;
    const matchActive =
      filterActive === "all" ||
      (filterActive === "active" && a.is_active) ||
      (filterActive === "inactive" && !a.is_active);
    return matchSearch && matchType && matchActive;
  });

  // Group by type for display
  const grouped = TYPES.reduce((acc, t) => {
    acc[t] = filtered.filter((a) => a.account_type === t);
    return acc;
  }, {});

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <input placeholder="Search accounts…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Types</option>
            {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} style={{ width: 130 }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Account</button>
        </div>
      </div>

      {loading ? <div className="loading">Loading…</div> : (
        filterType === "all" ? (
          TYPES.map((t) => grouped[t].length > 0 && (
            <div key={t} className="card" style={{ padding: 0, marginBottom: 16 }}>
              <div style={{ padding: "10px 16px", background: "var(--bg)", borderBottom: "1px solid var(--border)", fontWeight: 600, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                <span style={{ marginLeft: 8, fontWeight: 400 }}>({grouped[t].length})</span>
              </div>
              <AccountTable rows={grouped[t]} onEdit={openEdit} onToggle={handleToggle} />
            </div>
          ))
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {filtered.length === 0
              ? <div className="empty">No accounts found.</div>
              : <AccountTable rows={filtered} onEdit={openEdit} onToggle={handleToggle} />
            }
          </div>
        )
      )}

      {showModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Account" : "Add Account"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Account Name *</label>
                    <input name="account_name" value={form.account_name} onChange={handleChange} placeholder="e.g. Cash in Hand" required />
                  </div>
                  <div className="form-group">
                    <label>Account Type *</label>
                    <select name="account_type" value={form.account_type} onChange={handleChange}>
                      {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} id="is_active" style={{ width: "auto" }} />
                    <label htmlFor="is_active" style={{ margin: 0, cursor: "pointer" }}>Active</label>
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
    </div>
  );
}

function AccountTable({ rows, onEdit, onToggle }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Account Name</th>
            <th>Type</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td><strong>{a.account_name}</strong></td>
              <td><span className={`badge badge-${a.account_type}`}>{a.account_type}</span></td>
              <td>
                <span className={`badge badge-${a.is_active ? "active" : "inactive"}`}>
                  {a.is_active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <div className="actions">
                  <button className="btn btn-secondary btn-sm" onClick={() => onEdit(a)}>Edit</button>
                  <button className={`btn btn-sm ${a.is_active ? "btn-warning" : "btn-success"}`} onClick={() => onToggle(a.id)}>
                    {a.is_active ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
