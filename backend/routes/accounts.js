const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all accounts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM chart_of_accounts ORDER BY account_type, account_name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

// GET single account
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM chart_of_accounts WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Account not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

// POST create account
router.post("/", async (req, res) => {
  const { account_name, account_type, is_active } = req.body;
  if (!account_name || !account_type)
    return res.status(400).json({ error: "Account name and type are required" });
  try {
    const result = await pool.query(
      `INSERT INTO chart_of_accounts (account_name, account_type, is_active)
       VALUES ($1, $2, $3) RETURNING *`,
      [account_name, account_type, is_active !== false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Account name already exists" });
    res.status(500).json({ error: "Failed to create account" });
  }
});

// PUT update account
router.put("/:id", async (req, res) => {
  const { account_name, account_type, is_active } = req.body;
  if (!account_name || !account_type)
    return res.status(400).json({ error: "Account name and type are required" });
  try {
    const result = await pool.query(
      `UPDATE chart_of_accounts SET account_name=$1, account_type=$2, is_active=$3
       WHERE id=$4 RETURNING *`,
      [account_name, account_type, is_active !== false, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Account not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Account name already exists" });
    res.status(500).json({ error: "Failed to update account" });
  }
});

// PATCH toggle active status
router.patch("/:id/toggle", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE chart_of_accounts SET is_active = NOT is_active
       WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Account not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle account status" });
  }
});

module.exports = router;
