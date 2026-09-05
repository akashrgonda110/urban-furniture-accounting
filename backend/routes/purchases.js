const express = require("express");
const router = express.Router();
const pool = require("../db");

// ─── PURCHASE ORDERS ─────────────────────────────────────────────────────────

// GET all purchase orders
router.get("/orders", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT po.*, c.name as vendor_name
       FROM purchase_orders po
       JOIN contacts c ON po.vendor_id = c.id
       ORDER BY po.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch purchase orders" });
  }
});

// GET single purchase order with items
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await pool.query(
      `SELECT po.*, c.name as vendor_name
       FROM purchase_orders po
       JOIN contacts c ON po.vendor_id = c.id
       WHERE po.id = $1`,
      [req.params.id]
    );
    if (order.rows.length === 0)
      return res.status(404).json({ error: "Purchase order not found" });

    const items = await pool.query(
      `SELECT poi.*, p.name as product_name
       FROM purchase_order_items poi
       JOIN products p ON poi.product_id = p.id
       WHERE poi.purchase_order_id = $1`,
      [req.params.id]
    );
    res.json({ ...order.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch purchase order" });
  }
});

// POST create purchase order
router.post("/orders", async (req, res) => {
  const { vendor_id, order_date, items } = req.body;
  if (!vendor_id || !items || items.length === 0)
    return res.status(400).json({ error: "Vendor and items are required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let subtotal = 0;
    let tax_amount = 0;

    for (const item of items) {
      const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const itemTax = itemSubtotal * parseFloat(item.tax_rate || 0) / 100;
      subtotal += itemSubtotal;
      tax_amount += itemTax;
    }
    const total_amount = subtotal + tax_amount;

    const orderResult = await client.query(
      `INSERT INTO purchase_orders (vendor_id, order_date, status, subtotal, tax_amount, total_amount)
       VALUES ($1, $2, 'draft', $3, $4, $5) RETURNING *`,
      [vendor_id, order_date || new Date().toISOString().split("T")[0], subtotal, tax_amount, total_amount]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      const itemSubtotal = parseFloat(item.quantity) * parseFloat(item.unit_price);
      const itemTax = itemSubtotal * parseFloat(item.tax_rate || 0) / 100;
      const itemTotal = itemSubtotal + itemTax;
      await client.query(
        `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, tax_rate, tax_amount, subtotal, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, item.product_id, item.quantity, item.unit_price, item.tax_rate || 0, itemTax, itemSubtotal, itemTotal]
      );
    }

    await client.query("COMMIT");
    res.status(201).json(orderResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to create purchase order" });
  } finally {
    client.release();
  }
});

// PATCH confirm purchase order
router.patch("/orders/:id/confirm", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE purchase_orders SET status='confirmed', updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND status='draft' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Order not found or not in draft status" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to confirm purchase order" });
  }
});

// PATCH cancel purchase order
router.patch("/orders/:id/cancel", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE purchase_orders SET status='cancelled', updated_at=CURRENT_TIMESTAMP
       WHERE id=$1 AND status IN ('draft','confirmed') RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Order not found or cannot be cancelled" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel purchase order" });
  }
});

// ─── BILLS ───────────────────────────────────────────────────────────────────

// GET all bills
router.get("/bills", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name as vendor_name, po.id as order_ref
       FROM bills b
       JOIN contacts c ON b.vendor_id = c.id
       JOIN purchase_orders po ON b.purchase_order_id = po.id
       ORDER BY b.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bills" });
  }
});

// GET single bill
router.get("/bills/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, c.name as vendor_name
       FROM bills b
       JOIN contacts c ON b.vendor_id = c.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Bill not found" });

    const items = await pool.query(
      `SELECT poi.*, p.name as product_name
       FROM purchase_order_items poi
       JOIN products p ON poi.product_id = p.id
       WHERE poi.purchase_order_id = $1`,
      [result.rows[0].purchase_order_id]
    );
    res.json({ ...result.rows[0], items: items.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch bill" });
  }
});

// POST create bill from purchase order
router.post("/bills", async (req, res) => {
  const { purchase_order_id, bill_date, due_date } = req.body;
  if (!purchase_order_id)
    return res.status(400).json({ error: "Purchase order ID is required" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query(
      "SELECT * FROM purchase_orders WHERE id=$1",
      [purchase_order_id]
    );
    if (orderResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Purchase order not found" });
    }
    const order = orderResult.rows[0];
    if (order.status === "billed" || order.status === "cancelled") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Purchase order already billed or cancelled" });
    }

    const billResult = await client.query(
      `INSERT INTO bills (purchase_order_id, vendor_id, bill_date, due_date, subtotal, tax_amount, total_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid') RETURNING *`,
      [
        purchase_order_id,
        order.vendor_id,
        bill_date || new Date().toISOString().split("T")[0],
        due_date || null,
        order.subtotal,
        order.tax_amount,
        order.total_amount,
      ]
    );

    await client.query(
      "UPDATE purchase_orders SET status='billed', updated_at=CURRENT_TIMESTAMP WHERE id=$1",
      [purchase_order_id]
    );

    await client.query("COMMIT");
    res.status(201).json(billResult.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    if (err.code === "23505")
      return res.status(400).json({ error: "Bill already exists for this purchase order" });
    res.status(500).json({ error: "Failed to create bill" });
  } finally {
    client.release();
  }
});

// PATCH cancel bill
router.patch("/bills/:id/cancel", async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE bills SET status='cancelled' WHERE id=$1 AND status='unpaid' RETURNING *`,
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Bill not found or cannot be cancelled" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to cancel bill" });
  }
});

module.exports = router;
