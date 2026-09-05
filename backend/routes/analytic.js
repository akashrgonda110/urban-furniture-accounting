const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all analytic accounts
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM analytic_accounts ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytic accounts" });
  }
});

// GET single analytic account
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM analytic_accounts WHERE id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Analytic account not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch analytic account" });
  }
});

// POST create analytic account
router.post("/", async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type)
    return res.status(400).json({ error: "Name and type are required" });
  try {
    const result = await pool.query(
      "INSERT INTO analytic_accounts (name, type) VALUES ($1, $2) RETURNING *",
      [name, type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Analytic account name already exists" });
    res.status(500).json({ error: "Failed to create analytic account" });
  }
});

// PUT update analytic account
router.put("/:id", async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type)
    return res.status(400).json({ error: "Name and type are required" });
  try {
    const result = await pool.query(
      "UPDATE analytic_accounts SET name=$1, type=$2 WHERE id=$3 RETURNING *",
      [name, type, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Analytic account not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Analytic account name already exists" });
    res.status(500).json({ error: "Failed to update analytic account" });
  }
});

// DELETE analytic account
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM analytic_accounts WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Analytic account not found" });
    res.json({ message: "Analytic account deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete analytic account" });
  }
});

module.exports = router;
