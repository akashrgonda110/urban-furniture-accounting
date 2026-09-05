const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all products
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

// GET single product
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch product" });
  }
});

// POST create product
router.post("/", async (req, res) => {
  const { name, type, sales_price, purchase_price, category } = req.body;
  if (!name || !type)
    return res.status(400).json({ error: "Name and type are required" });
  try {
    const result = await pool.query(
      `INSERT INTO products (name, type, sales_price, purchase_price, category)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, type, sales_price || 0, purchase_price || 0, category]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create product" });
  }
});

// PUT update product
router.put("/:id", async (req, res) => {
  const { name, type, sales_price, purchase_price, category } = req.body;
  if (!name || !type)
    return res.status(400).json({ error: "Name and type are required" });
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, type=$2, sales_price=$3, purchase_price=$4,
       category=$5, updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *`,
      [name, type, sales_price || 0, purchase_price || 0, category, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update product" });
  }
});

// DELETE product
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM products WHERE id=$1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
