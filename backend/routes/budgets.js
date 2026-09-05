const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all budgets
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, a.name as analytic_account_name
       FROM budgets b
       JOIN analytic_accounts a ON b.analytic_account_id = a.id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch budgets" });
  }
});

// GET single budget
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, a.name as analytic_account_name
       FROM budgets b
       JOIN analytic_accounts a ON b.analytic_account_id = a.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Budget not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch budget" });
  }
});

// POST create budget
router.post("/", async (req, res) => {
  const { name, analytic_account_id, start_date, end_date, planned_amount, responsible_person } = req.body;
  if (!name || !analytic_account_id || !start_date || !end_date || planned_amount === undefined)
    return res.status(400).json({ error: "Name, analytic account, start date, end date, and planned amount are required" });
  try {
    const result = await pool.query(
      `INSERT INTO budgets (name, analytic_account_id, start_date, end_date, planned_amount, responsible_person)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, analytic_account_id, start_date, end_date, planned_amount, responsible_person]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create budget" });
  }
});

// PUT update budget
router.put("/:id", async (req, res) => {
  const { name, analytic_account_id, start_date, end_date, planned_amount, responsible_person } = req.body;
  if (!name || !analytic_account_id || !start_date || !end_date || planned_amount === undefined)
    return res.status(400).json({ error: "All fields are required" });
  try {
    const result = await pool.query(
      `UPDATE budgets SET name=$1, analytic_account_id=$2, start_date=$3, end_date=$4,
       planned_amount=$5, responsible_person=$6 WHERE id=$7 RETURNING *`,
      [name, analytic_account_id, start_date, end_date, planned_amount, responsible_person, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Budget not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update budget" });
  }
});

// DELETE budget
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM budgets WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Budget not found" });
    res.json({ message: "Budget deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete budget" });
  }
});

module.exports = router;
