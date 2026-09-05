const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all payments
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as contact_name, j.journal_name,
              i.id as invoice_ref, b.id as bill_ref
       FROM payments p
       JOIN contacts c ON p.contact_id = c.id
       JOIN journals j ON p.journal_id = j.id
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN bills b ON p.bill_id = b.id
       ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payments" });
  }
});

// GET single payment
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as contact_name, j.journal_name
       FROM payments p
       JOIN contacts c ON p.contact_id = c.id
       JOIN journals j ON p.journal_id = j.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Payment not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch payment" });
  }
});

// POST register payment for invoice
router.post("/invoice/:invoiceId", async (req, res) => {
  const { journal_id, payment_date, amount, payment_method, reference } = req.body;
  if (!journal_id || !amount || !payment_method)
    return res.status(400).json({ error: "Journal, amount, and payment method are required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const invoiceResult = await client.query(
      "SELECT * FROM invoices WHERE id=$1",
      [req.params.invoiceId]
    );
    if (invoiceResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Invoice not found" });
    }
    const invoice = invoiceResult.rows[0];
    if (invoice.status === "paid" || invoice.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invoice is already paid or cancelled" });
    }

    // Record payment
    const paymentResult = await client.query(
      `INSERT INTO payments (contact_id, invoice_id, journal_id, payment_date, amount, payment_method, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [invoice.customer_id, invoice.id, journal_id, payment_date || new Date().toISOString().split("T")[0], amount, payment_method, reference]
    );

    // Calculate total paid so far
    const paidResult = await client.query(
      "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE invoice_id=$1",
      [invoice.id]
    );
    const totalPaid = parseFloat(paidResult.rows[0].total_paid);
    const invoiceTotal = parseFloat(invoice.total_amount);

    let newStatus = "partially_paid";
    if (totalPaid >= invoiceTotal) newStatus = "paid";

    await client.query(
      "UPDATE invoices SET status=$1 WHERE id=$2",
      [newStatus, invoice.id]
    );

    // Auto-create journal entry for double-entry accounting
    // Debit: Cash/Bank Account (asset)  Credit: Accounts Receivable (asset)
    const journalData = await client.query(
      "SELECT * FROM journals WHERE id=$1",
      [journal_id]
    );
    if (journalData.rows.length > 0 && journalData.rows[0].default_account_id) {
      // Get or find receivable account
      const receivableAcc = await client.query(
        "SELECT id FROM chart_of_accounts WHERE account_type='asset' AND account_name ILIKE '%receivable%' LIMIT 1"
      );
      const cashBankAcc = journalData.rows[0].default_account_id;

      if (receivableAcc.rows.length > 0) {
        const jeResult = await client.query(
          `INSERT INTO journal_entries (journal_id, entry_date, reference, description)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [journal_id, payment_date || new Date().toISOString().split("T")[0],
           reference || `PMT-INV-${invoice.id}`, `Payment for Invoice #${invoice.id}`]
        );
        const jeId = jeResult.rows[0].id;
        // Debit cash/bank
        await client.query(
          "INSERT INTO journal_items (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,$3,0)",
          [jeId, cashBankAcc, amount]
        );
        // Credit receivable
        await client.query(
          "INSERT INTO journal_items (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,0,$3)",
          [jeId, receivableAcc.rows[0].id, amount]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to register payment" });
  } finally {
    client.release();
  }
});

// POST register payment for bill
router.post("/bill/:billId", async (req, res) => {
  const { journal_id, payment_date, amount, payment_method, reference } = req.body;
  if (!journal_id || !amount || !payment_method)
    return res.status(400).json({ error: "Journal, amount, and payment method are required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const billResult = await client.query(
      "SELECT * FROM bills WHERE id=$1",
      [req.params.billId]
    );
    if (billResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Bill not found" });
    }
    const bill = billResult.rows[0];
    if (bill.status === "paid" || bill.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Bill is already paid or cancelled" });
    }

    const paymentResult = await client.query(
      `INSERT INTO payments (contact_id, bill_id, journal_id, payment_date, amount, payment_method, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [bill.vendor_id, bill.id, journal_id, payment_date || new Date().toISOString().split("T")[0], amount, payment_method, reference]
    );

    const paidResult = await client.query(
      "SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE bill_id=$1",
      [bill.id]
    );
    const totalPaid = parseFloat(paidResult.rows[0].total_paid);
    const billTotal = parseFloat(bill.total_amount);

    let newStatus = "partially_paid";
    if (totalPaid >= billTotal) newStatus = "paid";

    await client.query(
      "UPDATE bills SET status=$1 WHERE id=$2",
      [newStatus, bill.id]
    );

    // Auto-create journal entry
    // Debit: Accounts Payable  Credit: Cash/Bank
    const journalData = await client.query(
      "SELECT * FROM journals WHERE id=$1",
      [journal_id]
    );
    if (journalData.rows.length > 0 && journalData.rows[0].default_account_id) {
      const payableAcc = await client.query(
        "SELECT id FROM chart_of_accounts WHERE account_type='liability' AND account_name ILIKE '%payable%' LIMIT 1"
      );
      const cashBankAcc = journalData.rows[0].default_account_id;

      if (payableAcc.rows.length > 0) {
        const jeResult = await client.query(
          `INSERT INTO journal_entries (journal_id, entry_date, reference, description)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [journal_id, payment_date || new Date().toISOString().split("T")[0],
           reference || `PMT-BILL-${bill.id}`, `Payment for Bill #${bill.id}`]
        );
        const jeId = jeResult.rows[0].id;
        // Debit payable
        await client.query(
          "INSERT INTO journal_items (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,$3,0)",
          [jeId, payableAcc.rows[0].id, amount]
        );
        // Credit cash/bank
        await client.query(
          "INSERT INTO journal_items (journal_entry_id, account_id, debit, credit) VALUES ($1,$2,0,$3)",
          [jeId, cashBankAcc, amount]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json(paymentResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to register payment" });
  } finally {
    client.release();
  }
});

module.exports = router;
