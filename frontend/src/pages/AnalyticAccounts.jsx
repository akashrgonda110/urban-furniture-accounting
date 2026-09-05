import { useEffect, useState } from "react";
import { api } from "../api";
import SuccessAlert from "../components/SuccessAlert";

const EMPTY = { name: "", type: "income" };

export default function AnalyticAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const load = () => {
    setLoading(true);
    api.getAnalyticAccounts()
      .then((data) => { setAccounts(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (a) => { setEditing(a.id); setForm({ name: a.name, type: a.type }); setError(""); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setError(""); };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const aname = form.name.trim();
    if (!aname) { setError("Name is required."); return; }
    if (aname.length < 2) { setError("Name must be at least 2 characters."); return; }
    if (!/^[a-zA-Z0-9\s'.,&()/-]+$/.test(aname)) { setError("Name can only contain letters, numbers, spaces, and basic punctuation."); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        await api.updateAnalyticAccount(editing, form);
        setSuccess("Analytic account updated.");
      } else {
        await api.createAnalyticAccount(form);
        setSuccess("Analytic account created.");
      }
      closeModal(); load();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteAnalyticAccount(id);
      setSuccess("Analytic account deleted.");
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
  };

  const filtered = accounts.filter((a) => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || a.type === filterType;
    return matchesSearch && matchesType;
  });

  const incomeCount = accounts.filter((a) => a.type === "income").length;
  const expenseCount = accounts.filter((a) => a.type === "expense").length;

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Accounts</div>
          <div className="stat-value">{accounts.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Income Accounts</div>
          <div className="stat-value money">{incomeCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Expense Accounts</div>
          <div className="stat-value warn">{expenseCount}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <input
            placeholder="Search analytic accounts…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 240 }}
          />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{ width: 140 }}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Analytic Account</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty">No analytic accounts found. Add your first account.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td><strong>{a.name}</strong></td>
                    <td>
                      <span className={`badge badge-${a.type}`}>{a.type.charAt(0).toUpperCase() + a.type.slice(1)}</span>
                    </td>
                    <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {new Date(a.created_at).toLocaleDateString("en-IN")}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(a)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(a.id)}>Delete</button>
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
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? "Edit Analytic Account" : "Add Analytic Account"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Sales Operations"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Type *</label>
                    <select name="type" value={form.type} onChange={handleChange}>
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : (editing ? "Update" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Analytic Account</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14 }}>
                Delete this analytic account? Any budgets linked to it will also be affected.
              </p>
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
