import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API = "http://localhost:5000/api";

const ROLES = [
  { value: "admin", label: "Admin / Business Owner" },
  { value: "accountant", label: "Accountant / Invoicing User" },
  { value: "contact_user", label: "Contact User" },
];

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", confirm_password: "", role: "accountant",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required";
    if (!form.email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Invalid email address";
    if (!form.password) return "Password is required";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirm_password) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`${API}/auth/signup`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); return; }
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh",background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",padding:16 }}>
      <div style={{ background:"#fff",border:"1px solid var(--border)",borderRadius:8,padding:"32px 36px",width:"100%",maxWidth:440,boxShadow:"0 4px 24px rgba(0,0,0,0.07)" }}>
        <div style={{ textAlign:"center",marginBottom:24 }}>
          <div style={{ fontSize:36,marginBottom:6 }}>🪑</div>
          <h1 style={{ fontSize:20,fontWeight:700,margin:"0 0 4px" }}>Urban Furniture</h1>
          <p style={{ fontSize:12,color:"var(--text-muted)",textTransform:"uppercase",letterSpacing:"1px",margin:0 }}>Accounting System</p>
        </div>

        <h2 style={{ fontSize:16,fontWeight:600,marginBottom:18 }}>Create Account</h2>

        {error && <div className="alert alert-error" style={{ marginBottom:14 }}>{error}</div>}
        {success && <div className="alert alert-success" style={{ marginBottom:14 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom:12 }}>
            <label>Full Name *</label>
            <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Rajesh Kumar" required />
          </div>
          <div className="form-group" style={{ marginBottom:12 }}>
            <label>Email Address *</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
          </div>
          <div className="form-group" style={{ marginBottom:12 }}>
            <label>Role *</label>
            <select name="role" value={form.role} onChange={handleChange}>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom:12 }}>
            <label>Password * (min 6 characters)</label>
            <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Create a password" required />
          </div>
          <div className="form-group" style={{ marginBottom:20 }}>
            <label>Confirm Password *</label>
            <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="Repeat password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width:"100%",justifyContent:"center",padding:"10px" }} disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div style={{ borderTop:"1px solid var(--border)",margin:"20px 0" }} />
        <p style={{ textAlign:"center",fontSize:13,color:"var(--text-muted)",margin:0 }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color:"var(--primary)",textDecoration:"none",fontWeight:600 }}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}
