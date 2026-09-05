import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLogo from "../components/AppLogo";

const API = "http://localhost:5000/api";
const ROLE_MAP = { user: "contact_user", accountant: "accountant", admin: "admin" };

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
    uiRole: "accountant",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.full_name.trim()) return "Name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email address.";
    if (!form.password) return "Password is required.";
    if (form.password.length < 6) return "Password must be at least 6 characters.";
    if (form.password !== form.confirm_password) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(""); setSuccess("");
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      confirm_password: form.confirm_password,
      role: ROLE_MAP[form.uiRole] || "accountant",
    };
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed."); return; }
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally { setLoading(false); }
  };

  const handleCancel = () => navigate("/login");

  return (
    <div style={S.page}>
      <p style={S.pageTitle}>Sign Up Page</p>
      <div style={S.card}>
        <div style={S.logoBox}><AppLogo width={210} /></div>
        {error   && <p style={S.errorMsg}>{error}</p>}
        {success && <p style={S.successMsg}>{success}</p>}
        <form onSubmit={handleSubmit} style={S.form}>

          <div style={S.fieldRow}>
            <label style={S.label}>Name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Full name" required style={S.input} />
          </div>

          <div style={S.fieldRow}>
            <label style={S.label}>E-mail Id <span style={{ fontSize:11, color:"#888", fontWeight:400 }}>(used as Login Id)</span></label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required style={S.input} />
          </div>

          <div style={S.fieldRow}>
            <label style={S.label}>Role</label>
            <div style={S.radioGroup}>
              <label style={S.radioLabel}>
                <input type="radio" name="uiRole" value="user" checked={form.uiRole === "user"} onChange={handleChange} style={{ marginRight:6 }} />
                User
              </label>
              <label style={{ ...S.radioLabel, marginLeft:20 }}>
                <input type="radio" name="uiRole" value="accountant" checked={form.uiRole === "accountant"} onChange={handleChange} style={{ marginRight:6 }} />
                Accountant
              </label>
              <label style={{ ...S.radioLabel, marginLeft:20 }}>
                <input type="radio" name="uiRole" value="admin" checked={form.uiRole === "admin"} onChange={handleChange} style={{ marginRight:6 }} />
                Admin
              </label>
            </div>
          </div>

          <div style={S.fieldRow}>
            <label style={S.label}>Password</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 6 characters" required style={S.input} />
          </div>

          <div style={S.fieldRow}>
            <label style={S.label}>Re-Enter Password</label>
            <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="Repeat password" required style={S.input} />
          </div>

          <div style={S.btnRow}>
            <button type="submit" style={S.createBtn} disabled={loading}>{loading ? "CREATING..." : "SIGN UP"}</button>
            <button type="button" style={S.cancelBtn} onClick={handleCancel} disabled={loading}>Cancel</button>
          </div>
        </form>
        <div style={S.footer}>
          <Link to="/login" style={S.footerLink}>Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: { minHeight:"100vh", background:"#f5f5f5", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px 16px", fontFamily:"Arial, sans-serif" },
  pageTitle: { fontSize:15, fontWeight:600, color:"#333", marginBottom:14, letterSpacing:"0.3px" },
  card: { background:"#fff", border:"2px solid #888", borderRadius:18, padding:"28px 40px 24px", width:"100%", maxWidth:420, boxSizing:"border-box" },
  logoBox: { border:"2px solid #888", borderRadius:10, textAlign:"center", padding:"12px 16px", marginBottom:22, display:"flex", justifyContent:"center", alignItems:"center" },
  errorMsg: { background:"#fff3f3", border:"1px solid #e0a0a0", borderRadius:6, padding:"7px 12px", fontSize:13, color:"#c0392b", marginBottom:14, textAlign:"center" },
  successMsg: { background:"#f0fff4", border:"1px solid #a0d0a0", borderRadius:6, padding:"7px 12px", fontSize:13, color:"#1a6e2e", marginBottom:14, textAlign:"center" },
  form: { display:"flex", flexDirection:"column" },
  fieldRow: { display:"flex", flexDirection:"column", marginBottom:13 },
  label: { fontSize:13, fontWeight:600, color:"#333", marginBottom:4 },
  input: { border:"1.5px solid #888", borderRadius:6, padding:"8px 11px", fontSize:13, color:"#222", background:"#fff", outline:"none", width:"100%", boxSizing:"border-box" },
  radioGroup: { display:"flex", alignItems:"center", paddingTop:4, flexWrap:"wrap", gap:4 },
  radioLabel: { fontSize:13, color:"#333", display:"flex", alignItems:"center", cursor:"pointer", fontWeight:500 },
  btnRow: { display:"flex", justifyContent:"center", gap:14, marginTop:10, marginBottom:4 },
  createBtn: { background:"#fff", border:"2px solid #555", borderRadius:8, padding:"9px 36px", fontSize:13, fontWeight:700, color:"#222", cursor:"pointer", letterSpacing:"1px" },
  cancelBtn: { background:"#fff", border:"2px solid #aaa", borderRadius:8, padding:"9px 24px", fontSize:13, fontWeight:500, color:"#555", cursor:"pointer" },
  footer: { marginTop:18, textAlign:"center", fontSize:13, color:"#555" },
  footerLink: { cursor:"pointer", color:"#333", textDecoration:"none", fontWeight:500 },
};
