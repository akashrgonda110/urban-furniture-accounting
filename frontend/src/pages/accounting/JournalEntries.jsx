import { useEffect, useState } from "react";
import { api } from "../../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

const EMPTY_LINE = { account_id: "", debit: "", credit: "" };

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewEntry, setViewEntry] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ journal_id: "", entry_date: today(), reference: "", description: "" });
  const [lines, setLines] = useState([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);

  function today() { return new Date().toISOString().split("T")[0]; }

  const load = () => {
    setLoading(true);
    Promise.all([api.getJournalEntries(), api.getAccounts(), api.getJournals()])
      .then(([e, a, j]) => {
        setEntries(e);
        setAccounts(a.filter((x) => x.is_active));
        setJournals(j);
        setLoading(false);
      })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setForm({ journal_id: "", entry_date: today(), reference: "", description: "" });
    setLines([{ ...EMPTY_LINE }, { ...EMPTY_LINE }]);
    setError("");
    setShowCreate(true);
  };

  const closeCreate = () => { setShowCreate(false); setError(""); };

  const openView = (id) => {
    api.getJournalEntry(id).then(setViewEntry).catch((e) => setError(e.message));
  };

  const setLine = (i, field, value) => {
    setLines((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      // When debit is set, clear credit and vice versa
      if (field === "debit" && value) next[i].credit = "";
      if (field === "credit" && value) next[i].debit = "";
      return next;
    });
  };

  const addLine = () => setLines((p) => [...p, { ...EMPTY_LINE }]);
  const removeLine = (i) => setLines((p) => p.filter((_, idx) => idx !== i));

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.journal_id) { setError("Select a journal"); return; }
    const validLines = lines.filter((l) => l.account_id && (parseFloat(l.debit) > 0 || parseFloat(l.credit) > 0));
    if (validLines.length < 2) { setError("At least two journal lines are required"); return; }
    if (!isBalanced) { setError(`Entry is unbalanced. Debit: ${fmt(totalDebit)}, Credit: ${fmt(totalCredit)}`); return; }

    setSaving(true); setError("");
    try {
      await api.createJournalEntry({ ...form, items: validLines });
      setSuccess("Journal entry created.");
      closeCreate(); load();
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div>
      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess("")} style={{ float: "right", background: "none", border: "none", cursor: "pointer" }}>✕</button>
        </div>
      )}
      {error && !showCreate && !viewEntry && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-left">
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{entries.length} entr{entries.length !== 1 ? "ies" : "y"}</span>
        </div>
        <div className="toolbar-right">
          <button className="btn btn-primary" onClick={openCreate}>+ New Journal Entry</button>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <strong>Double-Entry Rule:</strong> Every journal entry must have Total Debit = Total Credit. Entries from payments are created automatically.
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="empty">No journal entries yet. Register payments to auto-generate entries, or create manual entries.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Entry #</th>
                  <th>Journal</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Reference</th>
                  <th>Total Debit</th>
                  <th>Total Credit</th>
                  <th>Balanced</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => {
                  const balanced = Math.abs(parseFloat(e.total_debit) - parseFloat(e.total_credit)) < 0.01;
                  return (
                    <tr key={e.id}>
                      <td><strong>JE-{String(e.id).padStart(4, "0")}</strong></td>
                      <td>{e.journal_name}</td>
                      <td>{new Date(e.entry_date).toLocaleDateString("en-IN")}</td>
                      <td>{e.description || "—"}</td>
                      <td>{e.reference || "—"}</td>
                      <td>{fmt(e.total_debit)}</td>
                      <td>{fmt(e.total_credit)}</td>
                      <td>
                        <span className={`badge badge-${balanced ? "active" : "inactive"}`}>
                          {balanced ? "✓ Balanced" : "✗ Unbalanced"}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary btn-sm" onClick={() => openView(e.id)}>View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Journal Entry Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={closeCreate}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Journal Entry</h3>
              <button className="modal-close" onClick={closeCreate}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-grid" style={{ marginBottom: 20 }}>
                  <div className="form-group">
                    <label>Journal *</label>
                    <select value={form.journal_id} onChange={(e) => setForm((f) => ({ ...f, journal_id: e.target.value }))} required>
                      <option value="">— Select journal —</option>
                      {journals.map((j) => <option key={j.id} value={j.id}>{j.journal_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Entry Date</label>
                    <input type="date" value={form.entry_date} onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Reference</label>
                    <input value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} placeholder="e.g. INV-001" />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Brief description" />
                  </div>
                </div>

                <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 13 }}>Journal Lines</div>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th style={{ width: "45%" }}>Account</th>
                      <th style={{ width: "22%" }}>Debit (₹)</th>
                      <th style={{ width: "22%" }}>Credit (₹)</th>
                      <th style={{ width: "11%" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, i) => (
                      <tr key={i}>
                        <td>
                          <select value={line.account_id} onChange={(e) => setLine(i, "account_id", e.target.value)}>
                            <option value="">— Account —</option>
                            {accounts.map((a) => (
                              <option key={a.id} value={a.id}>{a.account_name} ({a.account_type})</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number" min="0" step="0.01" placeholder="0.00"
                            value={line.debit}
                            onChange={(e) => setLine(i, "debit", e.target.value)}
                            disabled={!!line.credit}
                          />
                        </td>
                        <td>
                          <input
                            type="number" min="0" step="0.01" placeholder="0.00"
                            value={line.credit}
                            onChange={(e) => setLine(i, "credit", e.target.value)}
                            disabled={!!line.debit}
                          />
                        </td>
                        <td>
                          {lines.length > 2 && (
                            <button type="button" onClick={() => removeLine(i)} style={{ background: "none", border: "none", color: "var(--danger)", cursor: "pointer", fontSize: 16 }}>✕</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>+ Add Line</button>

                {/* Balance indicator */}
                <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 6, background: isBalanced ? "#dcfce7" : "#fef3c7", border: `1px solid ${isBalanced ? "#86efac" : "#fcd34d"}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                    <span>Total Debit: <strong>{fmt(totalDebit)}</strong></span>
                    <span>Total Credit: <strong>{fmt(totalCredit)}</strong></span>
                    <span>
                      {isBalanced
                        ? <span style={{ color: "var(--success)", fontWeight: 600 }}>✓ Balanced</span>
                        : <span style={{ color: "var(--warning)", fontWeight: 600 }}>Difference: {fmt(Math.abs(totalDebit - totalCredit))}</span>
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCreate}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving || !isBalanced}>
                  {saving ? "Saving…" : "Post Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Entry Modal */}
      {viewEntry && (
        <div className="modal-backdrop" onClick={() => setViewEntry(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Journal Entry — JE-{String(viewEntry.id).padStart(4, "0")}</h3>
              <button className="modal-close" onClick={() => setViewEntry(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-meta">
                <div className="detail-meta-item"><label>Journal</label><span>{viewEntry.journal_name}</span></div>
                <div className="detail-meta-item"><label>Date</label><span>{new Date(viewEntry.entry_date).toLocaleDateString("en-IN")}</span></div>
                <div className="detail-meta-item"><label>Reference</label><span>{viewEntry.reference || "—"}</span></div>
                {viewEntry.description && (
                  <div className="detail-meta-item" style={{ gridColumn: "span 3" }}>
                    <label>Description</label><span>{viewEntry.description}</span>
                  </div>
                )}
              </div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Type</th>
                    <th style={{ textAlign: "right" }}>Debit</th>
                    <th style={{ textAlign: "right" }}>Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {(viewEntry.items || []).map((item) => (
                    <tr key={item.id}>
                      <td>{item.account_name}</td>
                      <td><span className={`badge badge-${item.account_type}`}>{item.account_type}</span></td>
                      <td style={{ textAlign: "right" }}>{parseFloat(item.debit) > 0 ? fmt(item.debit) : "—"}</td>
                      <td style={{ textAlign: "right" }}>{parseFloat(item.credit) > 0 ? fmt(item.credit) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                    <td colSpan={2}>Total</td>
                    <td style={{ textAlign: "right" }}>
                      {fmt((viewEntry.items || []).reduce((s, i) => s + parseFloat(i.debit), 0))}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {fmt((viewEntry.items || []).reduce((s, i) => s + parseFloat(i.credit), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setViewEntry(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
