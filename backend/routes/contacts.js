const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all contacts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM contacts ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
});

// GET single contact
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contacts WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Contact not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contact" });
  }
});

// POST create contact
router.post("/", async (req, res) => {
  const { name, type, email, mobile, city, state, pincode, profile_image } =
    req.body;
  if (!name || !type)
    return res.status(400).json({ error: "Name and type are required" });
  try {
    const result = await pool.query(
      `INSERT INTO contacts (name, type, email, mobile, city, state, pincode, profile_image)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, type, email, mobile, city, state, pincode, profile_image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create contact" });
  }
});

// PUT update contact
router.put("/:id", async (req, res) => {
  const { name, type, email, mobile, city, state, pincode, profile_image } =
    req.body;
  if (!name || !type)
    return res.status(400).json({ error: "Name and type are required" });
  try {
    const result = await pool.query(
      `UPDATE contacts SET name=$1, type=$2, email=$3, mobile=$4, city=$5, state=$6,
       pincode=$7, profile_image=$8, updated_at=CURRENT_TIMESTAMP
       WHERE id=$9 RETURNING *`,
      [name, type, email, mobile, city, state, pincode, profile_image, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Contact not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update contact" });
  }
});

// DELETE contact
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM contacts WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Contact not found" });
    res.json({ message: "Contact deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete contact" });
  }
});

module.exports = router;
