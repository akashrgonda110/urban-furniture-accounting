import { useEffect, useState } from "react";
import { api } from "../api";
import SuccessAlert from "../components/SuccessAlert";

const ROLE_LABELS = {
  admin:        "Admin",
  accountant:   "Accountant",
  contact_user: "Contact User",
};

export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState("");
  const [linkModal, setLinkModal] = useState(null); // user object being edited
  const [selectedContact, setSelectedContact] = useState("");
  const [saving, setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([api.getUsers(), api.getContacts()])
      .then(([u, c]) => { setUsers(u); setContacts(c); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const openLink = (user) => {
    setLinkModal(user);
    setSelectedContact(user.contact_id ? String(user.contact_id) : "");
    setError("");
  };

  const closeLink = () => { setLinkModal(null); setError(""); };

  const handleLink = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.linkContact(linkModal.id, selectedContact || null);
      const contactName = selectedContact
        ? contacts.find((c) => String(c.id) === selectedContact)?.name || "contact"
        : null;
      setSuccess(
        contactName
          ? `${linkModal.full_name} linked to contact "${contactName}".`
          : `${linkModal.full_name} unlinked from contact.`
      );
      closeLink();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <SuccessAlert message={success} onClose={() => setSuccess("")} />
      {error && !linkModal && <div className="alert alert-error">{error}</div>}

      <div className="alert alert-info" style={{ marginBottom: 16 }}>
        <strong>Contact User role:</strong> Users with the "Contact User" role can only see their own invoices and bills.
        Link each Contact User to a contact record so their portal shows the correct data.
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div className="loading">Loading…</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Linked Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                    <td><strong>{u.full_name}</strong></td>
                    <td style={{ fontSize: 12 }}>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.role === "admin" ? "capital" : u.role === "accountant" ? "income" : "expense"}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td>
                      {u.contact_name ? (
                        <span>
                          <strong>{u.contact_name}</strong>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 6 }}>
                            ({u.contact_type})
                          </span>
                        </span>
                      ) : (
                        <span style={{ color: "var(--warning)", fontSize: 12 }}>
                          {u.role === "contact_user" ? "⚠ Not linked" : "—"}
                        </span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => openLink(u)}>
                        {u.contact_id ? "Change Link" : "Link Contact"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link Modal */}
      {linkModal && (
        <div className="modal-backdrop" onClick={closeLink}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Link Contact — {linkModal.full_name}</h3>
              <button className="modal-close" onClick={closeLink}>✕</button>
            </div>
            <form onSubmit={handleLink}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="alert alert-info" style={{ marginBottom: 14 }}>
                  User: <strong>{linkModal.email}</strong> · Role: <strong>{ROLE_LABELS[linkModal.role]}</strong>
                </div>
                <div className="form-group">
                  <label>Contact Record</label>
                  <select value={selectedContact} onChange={(e) => setSelectedContact(e.target.value)}>
                    <option value="">— No link / Remove link —</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type}){c.email ? ` — ${c.email}` : ""}
                      </option>
                    ))}
                  </select>
                  <span className="form-hint">
                    Contact Users linked here will see invoices/bills belonging to this contact in their portal.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeLink}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving…" : "Save Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
