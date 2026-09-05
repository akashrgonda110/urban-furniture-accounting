const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all journal entries
router.get("/entries", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT je.*, j.journal_name,
              (SELECT SUM(debit) FROM journal_items WHERE journal_entry_id = je.id) as total_debit,
              (SELECT SUM(credit) FROM journal_items WHERE journal_entry_id = je.id) as total_credit
       FROM journal_entries je
       JOIN journals j ON je.journal_id = j.id
       ORDER BY je.entry_date DESC, je.id DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

// GET single journal entry with items
router.get("/entries/:id", async (req, res) => {
  try {
    const entry = await pool.query(
      `SELECT je.*, j.journal_name
       FROM journal_entries je
       JOIN journals j ON je.journal_id = j.id
       WHERE je.id = $1`,
      [req.params.id]
    );
    if (entry.rows.length === 0)
      return res.status(404).json({ error: "Journal entry not found" });

    const items = await pool.query(
      `SELECT ji.*, c.account_name, c.account_type
       FROM journal_items ji
       JOIN chart_of_accounts c ON ji.account_id = c.id
       WHERE ji.journal_entry_id = $1`,
      [req.params.id]
    );
    res.json({ ...entry.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch journal entry" });
  }
});

// POST create manual journal entry
router.post("/entries", async (req, res) => {
  const { journal_id, entry_date, reference, description, items } = req.body;
  if (!journal_id || !items || items.length === 0)
    return res.status(400).json({ error: "Journal and items are required" });

  // Validate debit = credit
  const totalDebit = items.reduce((sum, i) => sum + parseFloat(i.debit || 0), 0);
  const totalCredit = items.reduce((sum, i) => sum + parseFloat(i.credit || 0), 0);

  if (Math.abs(totalDebit - totalCredit) > 0.01)
    return res.status(400).json({
      error: `Journal entry is unbalanced. Debit: ${totalDebit.toFixed(2)}, Credit: ${totalCredit.toFixed(2)}`,
    });

  if (totalDebit === 0)
    return res.status(400).json({ error: "Journal entry must have at least one debit and one credit" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const entryResult = await client.query(
      `INSERT INTO journal_entries (journal_id, entry_date, reference, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [journal_id, entry_date || new Date().toISOString().split("T")[0], reference, description]
    );
    const entryId = entryResult.rows[0].id;

    for (const item of items) {
      const debit = parseFloat(item.debit || 0);
      const credit = parseFloat(item.credit || 0);
      if (debit === 0 && credit === 0) continue;
      if (debit > 0 && credit > 0)
        throw new Error("Each line must have either debit or credit, not both");

      await client.query(
        `INSERT INTO journal_items (journal_entry_id, account_id, debit, credit)
         VALUES ($1, $2, $3, $4)`,
        [entryId, item.account_id, debit, credit]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(entryResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: err.message || "Failed to create journal entry" });
  } finally {
    client.release();
  }
});

module.exports = router;
