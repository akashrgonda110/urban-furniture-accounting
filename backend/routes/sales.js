const express = require("express");
const router = express.Router();
const pool = require("../db");

// ─── SALES ORDERS ───────────────────────────────────────────────────────────

// GET all sales orders
router.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT so.*, c.name as customer_name
       FROM sales_orders so
       JOIN contacts c ON so.customer_id = c.id
       ORDER BY so.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sales orders" });
  }
});

// GET single sales order with items
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT so.*, c.name as customer_name
       FROM sales_orders so
       JOIN contacts c ON so.customer_id = c.id
       WHERE so.id = $1`,
      [req.params.id]
    );
    if (order.rows.length === 0)
      return res.status(404).json({ error: "Sales order not found" });

    const items = await pool.query(
      `SELECT soi.*, p.name as product_name
       FROM sales_order_items soi
       JOIN products p ON soi.product_id = p.id
       WHERE soi.sales_order_id = $1`,
      [req.params.id]
    );
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch sales order" });
  }
});

// POST create sales order
router.post("/orders", async (req, res) => {
  const { customer_id, order_date, items } = req.body;
  if (!customer_id || !items || items.length === 0)
    return res.status(400).json({ error: "Customer and items are required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let subtotal = 0;
    let tax_amount = 0;

    // Calculate totals
    for (const item of items) {
      const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const itemTax = itemSubtotal * parseFloat(item.tax_rate || 0) / 100;
      subtotal += itemSubtotal;
      tax_amount += itemTax;
    }
    const total_amount = subtotal + tax_amount;

    // Insert sales order
    const orderResult = await client.query(
      `INSERT INTO sales_orders (customer_id, order_date, status, subtotal, tax_amount, total_amount)
       VALUES ($1, $2, 'draft', $3, $4, $5) RETURNING *`,
      [customer_id, order_date || new Date().toISOString().split("T")[0], subtotal, tax_amount, total_amount]
    );
    const orderId = orderResult.rows[0].id;

    // Insert items
    for (const item of items) {
      const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const itemTax = itemSubtotal * parseFloat(item.tax_rate || 0) / 100;
      const itemTotal = itemSubtotal + itemTax;
      await client.query(
        `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, tax_rate, tax_amount, subtotal, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.tax_rate || 0, itemTax, itemSubtotal, itemTotal]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create sales order" });
  } finally {
    client.release();
  }
});

// PATCH confirm sales order
router.patch("/orders/:id/confirm", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE sales_orders SET status='confirmed', updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND status='draft' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Order not found or not in draft status" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to confirm sales order" });
  }
});

// PATCH cancel sales order
router.patch("/orders/:id/cancel", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE sales_orders SET status='cancelled', updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND status IN ('draft','confirmed') RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Order not found or cannot be cancelled" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel sales order" });
  }
});

// ─── INVOICES ───────────────────────────────────────────────────────────────

// GET all invoices
router.get("/invoices", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name, so.id as order_ref
       FROM invoices i
       JOIN contacts c ON i.customer_id = c.id
       JOIN sales_orders so ON i.sales_order_id = so.id
       ORDER BY i.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// GET single invoice
router.get("/invoices/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, c.name as customer_name
       FROM invoices i
       JOIN contacts c ON i.customer_id = c.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Invoice not found" });

    const items = await pool.query(
      `SELECT soi.*, p.name as product_name
       FROM sales_order_items soi
       JOIN products p ON soi.product_id = p.id
       WHERE soi.sales_order_id = $1`,
      [result.rows[0].sales_order_id]
    );
    res.json({ ...result.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

// POST create invoice from sales order
router.post("/invoices", async (req, res) => {
  const { sales_order_id, invoice_date, due_date } = req.body;
  if (!sales_order_id)
    return res.status(400).json({ error: "Sales order ID is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Get sales order
    const orderResult = await client.query(
      "SELECT * FROM sales_orders WHERE id=$1",
      [sales_order_id]
    );
    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Sales order not found" });
    }
    const order = orderResult.rows[0];
    if (order.status === "invoiced" || order.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Sales order already invoiced or cancelled" });
    }

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (sales_order_id, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid') RETURNING *`,
      [
        sales_order_id,
        order.customer_id,
        invoice_date || new Date().toISOString().split("T")[0],
        due_date || null,
        order.subtotal,
        order.tax_amount,
        order.total_amount,
      ]
    );

    // Update sales order status
    await client.query(
      "UPDATE sales_orders SET status='invoiced', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
      [sales_order_id]
    );

    await client.query("COMMIT");
    res.status(201).json(invoiceResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Invoice already exists for this sales order" });
    res.status(500).json({ error: "Failed to create invoice" });
  } finally {
    client.release();
  }
});

// PATCH cancel invoice
router.patch("/invoices/:id/cancel", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE invoices SET status='cancelled' WHERE id=$1 AND status='unpaid' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Invoice not found or cannot be cancelled" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel invoice" });
  }
});

module.exports = router;
