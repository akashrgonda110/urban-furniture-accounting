const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/contacts", require("./routes/contacts"));
app.use("/api/products", require("./routes/products"));
app.use("/api/accounts", require("./routes/accounts"));
app.use("/api/journals", require("./routes/journals"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/purchases", require("./routes/purchases"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/accounting", require("./routes/accounting"));
app.use("/api/analytic", require("./routes/analytic"));
app.use("/api/budgets", require("./routes/budgets"));
app.use("/api/users", require("./routes/users"));
app.use("/api/reports", require("./routes/reports"));

app.get("/", (req, res) => {
  res.json({ message: "Urban Furniture Accounting API is running!" });
});

app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ message: "Database connected successfully!", time: result.rows[0].now });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database connection failed" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


