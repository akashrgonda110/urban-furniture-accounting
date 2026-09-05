import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
      setError("Email and password are required");
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
        setError(data.error || "Login failed");
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
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🪑</div>
          <h1 style={styles.title}>Urban Furniture</h1>
          <p style={styles.subtitle}>Accounting System</p>
        </div>

        <h2 style={styles.formTitle}>Sign In</h2>

        {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: 14 }}>
            <label>Email Address</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label>Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "10px" }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div style={styles.divider} />

        <p style={styles.switchText}>
          Don't have an account?{" "}
          <Link to="/signup" style={styles.link}>Create Account</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "var(--bg)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    background: "#fff",
    border: "1px solid var(--border)",
    borderRadius: 8,
    padding: "32px 36px",
    width: "100%",
    maxWidth: 400,
    boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
  },
  header: {
    textAlign: "center",
    marginBottom: 28,
  },
  logo: {
    fontSize: 40,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: "var(--text)",
    margin: "0 0 4px",
  },
  subtitle: {
    fontSize: 12,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: 0,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 18,
    color: "var(--text)",
  },
  divider: {
    borderTop: "1px solid var(--border)",
    margin: "20px 0",
  },
  switchText: {
    textAlign: "center",
    fontSize: 13,
    color: "var(--text-muted)",
    margin: 0,
  },
  link: {
    color: "var(--primary)",
    textDecoration: "none",
    fontWeight: 600,
  },
};
