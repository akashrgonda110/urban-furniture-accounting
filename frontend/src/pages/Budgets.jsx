import { useEffect, useState } from "react";
import { api } from "../api";
import SuccessAlert from "../components/SuccessAlert";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

const EMPTY = {
  name: "",
  analytic_account_id: "",
  start_date: "",
  end_date: "",
  planned_amount: "",
  responsible_person: "",
};

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [analyticAccounts, setAnalyticAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getBudgets(), api.getAnalyticAccounts()])
      .then(([b, a]) => { setBudgets(b); setAnalyticAccounts(a); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (b) => {
    setEditing(b.id);
    setForm({
      name: b.name,
      analytic_account_id: String(b.analytic_account_id),
      start_date: b.start_date ? b.start_date.split("T")[0] : "",
      end_date: b.end_date ? b.end_date.split("T")[0] : "",
      planned_amount: String(b.planned_amount),
      responsible_person: b.responsible_person || "",
    });
    setError(""); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setError(""); };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const bname = form.name.trim();
    if (!bname) { setError("Budget name is required."); return; }
    if (bname.length < 2) { setError("Budget name must be at least 2 characters."); return; }
    if (!form.analytic_account_id) { setError("Analytic account is required."); return; }
    if (!form.start_date) { setError("Start date is required."); return; }
    if (!form.end_date) { setError("End date is required."); return; }
    if (form.end_date < form.start_date) { setError("End date must be on or after start date."); return; }
    if (form.planned_amount === "" || form.planned_amount === null) { setError("Planned amount is required."); return; }
    const amt = parseFloat(form.planned_amount);
    if (isNaN(amt) || amt < 0) { setError("Planned amount must be 0 or a positive number."); return; }
    if (form.responsible_person && form.responsible_person.trim() && !/^[a-zA-Z\s'.,-]+$/.test(form.responsible_person.trim()))
      { setError("Responsible person name should contain letters only."); return; }
    setSaving(true); setError("");
    try {
      if (editing) {
        await api.updateBudget(editing, form);
        setSuccess("Budget updated.");
      } else {
        await api.createBudget(form);
        setSuccess("Budget created.");
      }
      closeModal(); load();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteBudget(id);
      setSuccess("Budget deleted.");
      setDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
      setDeleteId(null);
    }
  };

  const totalPlanned = budgets.reduce((s, b) => s + parseFloat(b.planned_amount || 0), 0);

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-label">Total Budgets</div>
          <div className="stat-value">{budgets.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Planned</div>
          <div className="stat-value money">{fmt(totalPlanned)}</div>
        </div>
      </div>

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            {budgets.length} budget{budgets.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="toolbar-right">
          {analyticAccounts.length === 0 && (
            <span style={{ fontSize: 12, color: "var(--warning)", marginRight: 10 }}>
              Add Analytic Accounts first
            </span>
          )}
          <button className="btn btn-primary" onClick={openAdd} disabled={analyticAccounts.length === 0}>
            + Add Budget
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : budgets.length === 0 ? (
          <div className="empty">No budgets yet. Add analytic accounts first, then create budgets.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Budget Name</th>
                  <th>Analytic Account</th>
                  <th>Period</th>
                  <th>Planned Amount</th>
                  <th>Responsible</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b, i) => (
                  <tr key={b.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td><strong>{b.name}</strong></td>
                    <td>
                      <span className={`badge badge-${b.analytic_type || "income"}`}>
                        {b.analytic_account_name}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {b.start_date ? new Date(b.start_date).toLocaleDateString("en-IN") : "—"}
                      {" → "}
                      {b.end_date ? new Date(b.end_date).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td><strong>{fmt(b.planned_amount)}</strong></td>
                    <td>{b.responsible_person || "—"}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(b)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(b.id)}>Delete</button>
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
              <h3>{editing ? "Edit Budget" : "Add Budget"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid">
                  <div className="form-group span-2">
                    <label>Budget Name *</label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. FY 2026 Sales Budget"
                      required
                    />
                  </div>
                  <div className="form-group span-2">
                    <label>Analytic Account *</label>
                    <select name="analytic_account_id" value={form.analytic_account_id} onChange={handleChange} required>
                      <option value="">— Select analytic account —</option>
                      {analyticAccounts.map((a) => (
                        <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>End Date *</label>
                    <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label>Planned Amount (₹) *</label>
                    <input
                      type="number"
                      name="planned_amount"
                      min="0"
                      step="0.01"
                      value={form.planned_amount}
                      onChange={handleChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Responsible Person</label>
                    <input
                      name="responsible_person"
                      value={form.responsible_person}
                      onChange={handleChange}
                      placeholder="e.g. Akash Regonda"
                    />
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
              <h3>Delete Budget</h3>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14 }}>Delete this budget? This cannot be undone.</p>
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
