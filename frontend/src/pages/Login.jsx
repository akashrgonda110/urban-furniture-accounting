import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AppLogo from "../components/AppLogo";

const API = "http://localhost:5000/api";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Login Id and Password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please try again.");
        return;
      }
      login(data.token, data.user);
      navigate("/", { replace: true });
    } catch {
      setError("Cannot connect to server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Page title above card */}
      <p style={S.pageTitle}>Login Page</p>

      <div style={S.card}>
        {/* Logo area */}
        <div style={S.logoBox}>
          <AppLogo width={210} />
        </div>

        {/* Error message */}
        {error && (
          <p style={S.errorMsg}>{error}</p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={S.form}>
          <div style={S.fieldRow}>
            <label style={S.label}>Login Id</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              required
              style={S.input}
            />
          </div>

          <div style={S.fieldRow}>
            <label style={S.label}>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
              style={S.input}
            />
          </div>

          <div style={S.btnRow}>
            <button type="submit" style={S.signInBtn} disabled={loading}>
              {loading ? "SIGNING IN..." : "SIGN IN"}
            </button>
          </div>
        </form>

        {/* Footer links */}
        <div style={S.footer}>
          <span style={S.footerLink}>Forgot Password</span>
          <span style={S.separator}>|</span>
          <Link to="/signup" style={S.footerLink}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px 16px",
    fontFamily: "Arial, sans-serif",
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: "#333",
    marginBottom: 14,
    letterSpacing: "0.3px",
  },
  card: {
    background: "#fff",
    border: "2px solid #888",
    borderRadius: 18,
    padding: "32px 40px 28px",
    width: "100%",
    maxWidth: 400,
    boxSizing: "border-box",
  },
  logoBox: {
    border: "2px solid #888",
    borderRadius: 10,
    textAlign: "center",
    padding: "12px 16px",
    marginBottom: 28,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  errorMsg: {
    background: "#fff3f3",
    border: "1px solid #e0a0a0",
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 13,
    color: "#c0392b",
    marginBottom: 16,
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  fieldRow: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#333",
    marginBottom: 5,
  },
  input: {
    border: "1.5px solid #888",
    borderRadius: 6,
    padding: "9px 12px",
    fontSize: 13,
    color: "#222",
    background: "#fff",
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  },
  btnRow: {
    textAlign: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  signInBtn: {
    background: "#fff",
    border: "2px solid #555",
    borderRadius: 8,
    padding: "10px 48px",
    fontSize: 14,
    fontWeight: 700,
    color: "#222",
    cursor: "pointer",
    letterSpacing: "1px",
  },
  footer: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 13,
    color: "#555",
  },
  footerLink: {
    cursor: "pointer",
    color: "#333",
    textDecoration: "none",
    fontWeight: 500,
  },
  separator: {
    margin: "0 10px",
    color: "#999",
  },
};
