const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET Dashboard summary
router.get("/dashboard", async (req, res) => {
  try {
    const [
      customersResult,
      vendorsResult,
      productsResult,
      salesResult,
      purchasesResult,
      invoicesResult,
      billsResult,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM contacts WHERE type IN ('customer','both')"),
      pool.query("SELECT COUNT(*) FROM contacts WHERE type IN ('vendor','both')"),
      pool.query("SELECT COUNT(*) FROM products"),
      pool.query("SELECT COALESCE(SUM(total_amount),0) as total FROM sales_orders WHERE status != 'cancelled'"),
      pool.query("SELECT COALESCE(SUM(total_amount),0) as total FROM purchase_orders WHERE status != 'cancelled'"),
      pool.query("SELECT COALESCE(SUM(total_amount),0) as total FROM invoices WHERE status IN ('unpaid','partially_paid')"),
      pool.query("SELECT COALESCE(SUM(total_amount),0) as total FROM bills WHERE status IN ('unpaid','partially_paid')"),
    ]);

    res.json({
      total_customers: parseInt(customersResult.rows[0].count),
      total_vendors: parseInt(vendorsResult.rows[0].count),
      total_products: parseInt(productsResult.rows[0].count),
      total_sales: parseFloat(salesResult.rows[0].total),
      total_purchases: parseFloat(purchasesResult.rows[0].total),
      outstanding_invoices: parseFloat(invoicesResult.rows[0].total),
      outstanding_bills: parseFloat(billsResult.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// GET Balance Sheet
// Assets = asset accounts (debit-normal)
// Liabilities = liability accounts (credit-normal)
// Capital = capital accounts (credit-normal)
router.get("/balance-sheet", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.account_name,
         c.account_type,
         COALESCE(SUM(ji.debit), 0) as total_debit,
         COALESCE(SUM(ji.credit), 0) as total_credit
       FROM chart_of_accounts c
       LEFT JOIN journal_items ji ON ji.account_id = c.id
       WHERE c.account_type IN ('asset', 'liability', 'capital')
       GROUP BY c.id, c.account_name, c.account_type
       ORDER BY c.account_type, c.account_name`
    );

    const assets = [];
    const liabilities = [];
    const capital = [];

    for (const row of result.rows) {
      const balance = parseFloat(row.total_debit) - parseFloat(row.total_credit);
      const entry = { account_name: row.account_name, balance };
      if (row.account_type === "asset") assets.push(entry);
      else if (row.account_type === "liability") liabilities.push(entry);
      else if (row.account_type === "capital") capital.push(entry);
    }

    const totalAssets = assets.reduce((s, r) => s + r.balance, 0);
    const totalLiabilities = liabilities.reduce((s, r) => s + Math.abs(r.balance), 0);
    const totalCapital = capital.reduce((s, r) => s + Math.abs(r.balance), 0);

    res.json({ assets, liabilities, capital, totalAssets, totalLiabilities, totalCapital });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate balance sheet" });
  }
});

// GET Profit & Loss
router.get("/profit-loss", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.account_name,
         c.account_type,
         COALESCE(SUM(ji.debit), 0) as total_debit,
         COALESCE(SUM(ji.credit), 0) as total_credit
       FROM chart_of_accounts c
       LEFT JOIN journal_items ji ON ji.account_id = c.id
       WHERE c.account_type IN ('income', 'expense')
       GROUP BY c.id, c.account_name, c.account_type
       ORDER BY c.account_type, c.account_name`
    );

    const income = [];
    const expenses = [];

    for (const row of result.rows) {
      // Income: credit-normal (credit - debit)
      // Expense: debit-normal (debit - credit)
      if (row.account_type === "income") {
        const balance = parseFloat(row.total_credit) - parseFloat(row.total_debit);
        income.push({ account_name: row.account_name, balance });
      } else if (row.account_type === "expense") {
        const balance = parseFloat(row.total_debit) - parseFloat(row.total_credit);
        expenses.push({ account_name: row.account_name, balance });
      }
    }

    const totalIncome = income.reduce((s, r) => s + r.balance, 0);
    const totalExpenses = expenses.reduce((s, r) => s + r.balance, 0);
    const netProfit = totalIncome - totalExpenses;

    res.json({ income, expenses, totalIncome, totalExpenses, netProfit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate profit & loss report" });
  }
});

// GET Budget Report
router.get("/budget", async (req, res) => {
  try {
    // Budget vs Actual: actual is approximated from journal entries in the budget period
    // Since journal items don't have analytic account links in this schema,
    // we show planned vs total payments as a proxy for actual
    const result = await pool.query(
      `SELECT
         b.id,
         b.name,
         b.start_date,
         b.end_date,
         b.planned_amount,
         b.responsible_person,
         a.name as analytic_account_name,
         a.type as analytic_type
       FROM budgets b
       JOIN analytic_accounts a ON b.analytic_account_id = a.id
       ORDER BY b.start_date DESC`
    );

    // For actual: sum payments made in budget period
    const budgets = await Promise.all(
      result.rows.map(async (budget) => {
        let actualResult;
        if (budget.analytic_type === "expense") {
          // Expense budget: actual = bills paid in period
          actualResult = await pool.query(
            `SELECT COALESCE(SUM(p.amount), 0) as actual
             FROM payments p
             JOIN bills b ON p.bill_id = b.id
             WHERE p.payment_date BETWEEN $1 AND $2`,
            [budget.start_date, budget.end_date]
          );
        } else {
          // Income budget: actual = invoices received in period
          actualResult = await pool.query(
            `SELECT COALESCE(SUM(p.amount), 0) as actual
             FROM payments p
             JOIN invoices i ON p.invoice_id = i.id
             WHERE p.payment_date BETWEEN $1 AND $2`,
            [budget.start_date, budget.end_date]
          );
        }
        const actual = parseFloat(actualResult.rows[0].actual);
        return {
          ...budget,
          actual_amount: actual,
          difference: parseFloat(budget.planned_amount) - actual,
        };
      })
    );

    res.json(budgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate budget report" });
  }
});

module.exports = router;
