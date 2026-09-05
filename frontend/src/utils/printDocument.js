/**
 * printDocument — opens a new window with a clean A4 print layout and triggers print dialog.
 *
 * @param {object} doc  - invoice or bill data object
 * @param {'invoice'|'bill'} type
 */
export function printDocument(doc, type) {
  const isInvoice = type === "invoice";
  const docNo     = isInvoice
    ? `INV-${String(doc.id).padStart(4, "0")}`
    : `BILL-${String(doc.id).padStart(4, "0")}`;

  const partyLabel = isInvoice ? "Customer" : "Vendor";
  const partyName  = isInvoice ? doc.customer_name : doc.vendor_name;
  const dateLabel  = isInvoice ? "Invoice Date" : "Bill Date";
  const docDate    = isInvoice
    ? new Date(doc.invoice_date).toLocaleDateString("en-IN")
    : new Date(doc.bill_date).toLocaleDateString("en-IN");
  const dueDate    = doc.due_date
    ? new Date(doc.due_date).toLocaleDateString("en-IN")
    : "—";

  const statusColor = {
    unpaid: "#f59e0b", partially_paid: "#3b82f6", paid: "#16a34a", cancelled: "#dc2626"
  }[doc.status] || "#6b7280";

  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

  const itemRows = (doc.items || []).map((item) => `
    <tr>
      <td>${item.product_name || "—"}</td>
      <td class="num">${item.quantity}</td>
      <td class="num">${fmt(item.unit_price)}</td>
      <td class="num">${item.tax_rate}%</td>
      <td class="num">${fmt(item.tax_amount)}</td>
      <td class="num"><strong>${fmt(item.total)}</strong></td>
    </tr>
  `).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${docNo} — Urban Furniture</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; padding: 32px; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 2px solid #1e293b; padding-bottom: 16px; }
    .company h1 { font-size: 20px; font-weight: 800; color: #1e293b; }
    .company p  { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .doc-info   { text-align: right; }
    .doc-no     { font-size: 22px; font-weight: 700; color: #1a56db; }
    .doc-type   { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
    .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: capitalize; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}; margin-top: 4px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 24px; }
    .meta-item label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; display: block; margin-bottom: 3px; }
    .meta-item span  { font-size: 13px; font-weight: 600; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead th { background: #f1f5f9; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.4px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    thead th.num { text-align: right; }
    tbody td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
    tbody td.num { text-align: right; }
    .totals { width: 280px; margin-left: auto; margin-top: 8px; }
    .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
    .totals-final { display: flex; justify-content: space-between; padding: 10px 0; font-size: 15px; font-weight: 700; border-top: 2px solid #1e293b; margin-top: 4px; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print {
      body { padding: 16px; }
      @page { size: A4; margin: 15mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company">
      <h1>Urban Furniture</h1>
      <p>Accounting System</p>
    </div>
    <div class="doc-info">
      <div class="doc-type">${isInvoice ? "Tax Invoice" : "Vendor Bill"}</div>
      <div class="doc-no">${docNo}</div>
      <div class="status-badge">${(doc.status || "").replace("_", " ")}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item"><label>${partyLabel}</label><span>${partyName || "—"}</span></div>
    <div class="meta-item"><label>${dateLabel}</label><span>${docDate}</span></div>
    <div class="meta-item"><label>Due Date</label><span>${dueDate}</span></div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Product / Service</th>
        <th class="num">Qty</th>
        <th class="num">Unit Price</th>
        <th class="num">Tax %</th>
        <th class="num">Tax Amt</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || "<tr><td colspan='6' style='text-align:center;padding:16px;color:#94a3b8;'>No items</td></tr>"}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><span>Subtotal</span><span>${fmt(doc.subtotal)}</span></div>
    <div class="totals-row"><span>Tax</span><span>${fmt(doc.tax_amount)}</span></div>
    <div class="totals-final"><span>Total</span><span>${fmt(doc.total_amount)}</span></div>
  </div>

  <div class="footer">
    Urban Furniture Accounting System &nbsp;·&nbsp; Printed on ${new Date().toLocaleString("en-IN")}
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
