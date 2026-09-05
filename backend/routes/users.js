const express = require("express");
const router  = express.Router();
const pool    = require("../db");

// GET all users (admin use — never returns password_hash)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.role, u.contact_id,
              c.name as contact_name, c.type as contact_type
       FROM users u
       LEFT JOIN contacts c ON u.contact_id = c.id
       ORDER BY u.id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// PATCH link a user to a contact (or unlink by passing contact_id: null)
router.patch("/:id/link-contact", async (req, res) => {
  const { contact_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users SET contact_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING id, full_name, email, role, contact_id`,
      [contact_id || null, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to link contact" });
  }
});

module.exports = router;
