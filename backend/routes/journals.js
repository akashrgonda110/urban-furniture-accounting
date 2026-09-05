const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all journals
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, c.account_name as default_account_name
       FROM journals j
       LEFT JOIN chart_of_accounts c ON j.default_account_id = c.id
       ORDER BY j.journal_name`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch journals" });
  }
});

// GET single journal
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT j.*, c.account_name as default_account_name
       FROM journals j
       LEFT JOIN chart_of_accounts c ON j.default_account_id = c.id
       WHERE j.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Journal not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch journal" });
  }
});

// POST create journal
router.post("/", async (req, res) => {
  const { journal_name, journal_type, default_account_id } = req.body;
  if (!journal_name || !journal_type)
    return res.status(400).json({ error: "Journal name and type are required" });
  try {
    const result = await pool.query(
      `INSERT INTO journals (journal_name, journal_type, default_account_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [journal_name, journal_type, default_account_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Journal name already exists" });
    res.status(500).json({ error: "Failed to create journal" });
  }
});

// PUT update journal
router.put("/:id", async (req, res) => {
  const { journal_name, journal_type, default_account_id } = req.body;
  if (!journal_name || !journal_type)
    return res.status(400).json({ error: "Journal name and type are required" });
  try {
    const result = await pool.query(
      `UPDATE journals SET journal_name=$1, journal_type=$2, default_account_id=$3
       WHERE id=$4 RETURNING *`,
      [journal_name, journal_type, default_account_id || null, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Journal not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Journal name already exists" });
    res.status(500).json({ error: "Failed to update journal" });
  }
});

module.exports = router;
