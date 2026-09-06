const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const JWT_SECRET = process.env.JWT_SECRET || "urban_furniture_jwt_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// Helper: sign a token for a user row
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Helper: safe user object (no password_hash)
function safeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  const { full_name, email, password, confirm_password, role, contact_id } = req.body;

  // Validate required
  if (!full_name || !full_name.trim())
    return res.status(400).json({ error: "Full name is required" });
  if (!email || !email.trim())
    return res.status(400).json({ error: "Email is required" });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return res.status(400).json({ error: "Invalid email address" });
  if (!password)
    return res.status(400).json({ error: "Password is required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (password !== confirm_password)
    return res.status(400).json({ error: "Passwords do not match" });

  // Public signup ALWAYS creates contact_user — admin/accountant are created by admin via User Management
  const userRole = "contact_user";

  try {
    // Check email uniqueness
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: "An account with this email already exists" });

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, contact_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [full_name.trim(), email.toLowerCase().trim(), password_hash, userRole, contact_id || null]
    );

    res.status(201).json({
      message: "Account created successfully. Please log in.",
      user: safeUser(result.rows[0]),
    });
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "An account with this email already exists" });
    res.status(500).json({ error: "Failed to create account" });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ error: "Invalid email or password" });

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = signToken(user);

    res.json({
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Requires Authorization: Bearer <token>
router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer "))
    return res.status(401).json({ error: "Not authenticated" });

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [decoded.id]);
    if (result.rows.length === 0)
      return res.status(401).json({ error: "User not found" });
    res.json({ user: safeUser(result.rows[0]) });
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

module.exports = router;
