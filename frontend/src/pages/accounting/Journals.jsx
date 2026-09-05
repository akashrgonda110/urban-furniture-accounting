import { useEffect, useState } from "react";
import { api } from "../../api";
import SuccessAlert from "../../components/SuccessAlert";

const EMPTY = { journal_name: "", journal_type: "sales", default_account_id: "" };
const JOURNAL_TYPES = ["sales", "purchase", "bank", "cash"];

export default function Journals() {
  const [journals, setJournals] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.getJournals(), api.getAccounts()])
      .then(([j, a]) => { setJournals(j); setAccounts(a.filter((acc) => acc.is_active)); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setError(""); setShowModal(true); };
  const openEdit = (j) => {
    setEditing(j.id);
    setForm({ journal_name: j.journal_name, journal_type: j.journal_type, default_account_id: j.default_account_id || "" });
    setError(""); setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setError(""); };
  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jname = form.journal_name.trim();
    if (!jname) { setError("Journal name is required."); return; }
    if (jname.length < 2) { setError("Journal name must be at least 2 characters."); return; }
    if (!/^[a-zA-Z0-9\s'.,&()/-]+$/.test(jname)) { setError("Journal name can only contain letters, numbers, spaces, and basic punctuation."); return; }
    setSaving(true); setError("");
    try {
      const payload = { ...form, default_account_id: form.default_account_id || null };
      if (editing) {
        await api.updateJournal(editing, payload);
        setSuccess("Journal updated.");
      } else {
        await api.createJournal(payload);
        setSuccess("Journal created.");
      }
      closeModal(); load();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  // Filter accounts by type relevant to the journal type
  const relevantAccounts = () => {
    if (form.journal_type === "sales") return accounts.filter((a) => a.account_type === "asset" || a.account_type === "income");
    if (form.journal_type === "purchase") return accounts.filter((a) => a.account_type === "liability" || a.account_type === "expense");
    if (form.journal_type === "bank") return accounts.filter((a) => a.account_type === "asset");
    if (form.journal_type === "cash") return accounts.filter((a) => a.account_type === "asset");
    return accounts;
  };

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />      {error && !showModal && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{journals.length} journal{journals.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openAdd}>+ Add Journal</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="loading">Loading…</div> : journals.length === 0 ? (
          <div className="empty">No journals found. Add your first journal.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Journal Name</th>
                  <th>Type</th>
                  <th>Default Account</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {journals.map((j, i) => (
                  <tr key={j.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td><strong>{j.journal_name}</strong></td>
                    <td>
                      <span className="badge" style={{ background: "#f0f4ff", color: "#1a56db" }}>
                        {j.journal_type.charAt(0).toUpperCase() + j.journal_type.slice(1)}
                      </span>
                    </td>
                    <td>{j.default_account_name || <span style={{ color: "var(--text-muted)" }}>—</span>}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(j)}>Edit</button>
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
              <h3>{editing ? "Edit Journal" : "Add Journal"}</h3>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid cols-1">
                  <div className="form-group">
                    <label>Journal Name *</label>
                    <input name="journal_name" value={form.journal_name} onChange={handleChange} placeholder="e.g. Customer Invoices" required />
                  </div>
                  <div className="form-group">
                    <label>Journal Type *</label>
                    <select name="journal_type" value={form.journal_type} onChange={handleChange}>
                      {JOURNAL_TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Default Account</label>
                    <select name="default_account_id" value={form.default_account_id} onChange={handleChange}>
                      <option value="">— Select account —</option>
                      {relevantAccounts().map((a) => (
                        <option key={a.id} value={a.id}>{a.account_name} ({a.account_type})</option>
                      ))}
                    </select>
                    <span className="form-hint">Used for auto-generating journal entries on payments.</span>
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
