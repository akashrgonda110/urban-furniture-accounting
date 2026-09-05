/**
 * seed.js — populate large demo dataset
 * Run: node seed.js
 *
 * Creates:
 *   90  contacts  (30 customer, 30 vendor, 30 both)
 *   30  products  (10 goods, 10 service, 10 combo)
 *   5   chart-of-accounts entries (if not present)
 *   3   journals (if not present)
 *   400 sales orders  (draft/confirmed/invoiced/cancelled)
 *   ~320 invoices from invoiced sales orders
 *   400 purchase orders (draft/confirmed/billed/cancelled)
 *   ~320 bills from billed purchase orders
 *   payments for all paid invoices and bills
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST,
  database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: process.env.DB_PORT,
});

// ── helpers ──────────────────────────────────────────────────────────────────

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const rndPrice = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));

const FIRST_NAMES = [
  'Aditya','Akash','Amit','Anjali','Arjun','Ashok','Chetan','Deepa','Divya','Farhan',
  'Gaurav','Geeta','Harsha','Ishaan','Jaya','Karan','Kavitha','Laxmi','Mahesh','Meera',
  'Mohan','Nandita','Nikhil','Priya','Rahul','Rajesh','Ramesh','Riya','Rohit','Sachin',
  'Sandeep','Sanjay','Shalini','Shivam','Shreya','Sneha','Suresh','Swati','Tanvi','Vijay',
  'Vikas','Vinay','Yash','Zara','Aryan','Bhavana','Chirag','Dhruv','Ekta','Fatima',
  'Gopal','Heena','Imran','Jyoti','Kishore','Latha','Manish','Nisha','Omkar','Pooja',
  'Qasim','Rekha','Sumit','Tara','Uday','Vandana','Wasim','Xenia','Yogesh','Zubair',
  'Aarav','Bhaskar','Chhaya','Dileep','Ela','Firoz','Girish','Hema','Indira','Jagdish',
  'Kamla','Lokesh','Madhu','Nalini','Pankaj','Qadir','Rupesh','Savita','Tarun','Uma',
];

const LAST_NAMES = [
  'Sharma','Verma','Gupta','Singh','Patel','Mehta','Kumar','Joshi','Shah','Nair',
  'Reddy','Rao','Iyer','Pillai','Menon','Krishnan','Agarwal','Bansal','Chopra','Desai',
  'Fernandez','Garg','Hora','Iqbal','Jain','Kapoor','Lal','Mishra','Naidu','Oberoi',
];

const CITIES = [
  'Mumbai','Delhi','Bangalore','Chennai','Hyderabad','Pune','Kolkata',
  'Ahmedabad','Surat','Jaipur','Lucknow','Kanpur','Nagpur','Indore','Bhopal',
  'Patna','Vadodara','Coimbatore','Ludhiana','Agra',
];

const STATES = [
  'Maharashtra','Delhi','Karnataka','Tamil Nadu','Telangana',
  'Gujarat','West Bengal','Rajasthan','Uttar Pradesh','Madhya Pradesh',
  'Punjab','Bihar','Andhra Pradesh','Kerala','Haryana',
];

const PRODUCT_NAMES = {
  goods: [
    'Teak Dining Table','Oak Coffee Table','Mahogany Bookshelf','Pine Wardrobe',
    'Bamboo Chair Set','Rosewood Sofa','Walnut Study Desk','Cedar Bed Frame',
    'Engineered Wood Cabinet','Plywood TV Unit','Metal Shelving Unit','Glass Display Cabinet',
    'Reclaimed Wood Bench','Acacia Wood Stool','Rubberwood Side Table',
  ],
  service: [
    'Interior Design Consultation','Furniture Assembly Service','Home Delivery & Setup',
    'Custom Upholstery Service','Wood Polishing & Restoration','Annual Maintenance Contract',
    'Room Layout Planning','Curtain & Blind Installation','Lighting Setup Service',
    'After-Sales Repair Service','Warranty Extension Plan','On-site Varnishing',
    'Disassembly & Packing','Climate Control Advisory','Office Space Planning',
  ],
  combo: [
    'Bedroom Furniture Set','Living Room Combo Pack','Office Workstation Bundle',
    'Dining Room Complete Set','Kids Room Package','Home Office Bundle',
    'Guest Room Setup','Master Suite Package','Storage Solutions Bundle','Modular Kitchen Set',
  ],
};

const CATEGORIES = ['Furniture','Seating','Storage','Tables','Services','Packages','Bedroom','Living Room','Office'];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🌱 Starting seed...\n');

    // ── 1. Contacts ──────────────────────────────────────────────────────────
    console.log('Creating contacts...');
    const contactIds = { customer: [], vendor: [], both: [] };
    const types = [...Array(30).fill('customer'), ...Array(30).fill('vendor'), ...Array(30).fill('both')];

    for (let i = 0; i < 90; i++) {
      const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
      const lastName  = LAST_NAMES[i % LAST_NAMES.length];
      const name      = `${firstName} ${lastName}`;
      const type      = types[i];
      const email     = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
      const mobile    = `+91${rndInt(7000000000, 9999999999)}`;
      const city      = CITIES[i % CITIES.length];
      const state     = STATES[i % STATES.length];
      const pincode   = String(rndInt(100000, 999999));

      const r = await client.query(
        `INSERT INTO contacts (name, type, email, mobile, city, state, pincode)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [name, type, email, mobile, city, state, pincode]
      );
      contactIds[type].push(r.rows[0].id);
    }
    const allCustomers = [...contactIds.customer, ...contactIds.both];
    const allVendors   = [...contactIds.vendor,   ...contactIds.both];
    console.log(`  ✓ ${90} contacts created`);

    // ── 2. Products ──────────────────────────────────────────────────────────
    console.log('Creating products...');
    const productIds = [];
    for (const [ptype, names] of Object.entries(PRODUCT_NAMES)) {
      for (const name of names) {
        const salesPrice = ptype === 'service' ? rndPrice(500, 8000) : rndPrice(2000, 80000);
        const purchasePrice = parseFloat((salesPrice * rndPrice(0.5, 0.75)).toFixed(2));
        const category = rnd(CATEGORIES);
        const r = await client.query(
          `INSERT INTO products (name, type, sales_price, purchase_price, category)
           VALUES ($1,$2,$3,$4,$5) RETURNING id`,
          [name, ptype, salesPrice, purchasePrice, category]
        );
        productIds.push({ id: r.rows[0].id, sales_price: salesPrice, purchase_price: purchasePrice });
      }
    }
    console.log(`  ✓ ${productIds.length} products created`);

    // ── 3. Ensure chart of accounts & journals exist ─────────────────────────
    console.log('Checking accounts & journals...');
    let cashAccId, receivableAccId, payableAccId, salesAccId, purchaseAccId;

    const ensureAccount = async (name, type) => {
      const ex = await client.query('SELECT id FROM chart_of_accounts WHERE account_name=$1', [name]);
      if (ex.rows.length > 0) return ex.rows[0].id;
      const r = await client.query(
        `INSERT INTO chart_of_accounts (account_name, account_type) VALUES ($1,$2) RETURNING id`, [name, type]
      );
      return r.rows[0].id;
    };

    cashAccId       = await ensureAccount('Cash in Hand', 'asset');
    receivableAccId = await ensureAccount('Accounts Receivable', 'asset');
    payableAccId    = await ensureAccount('Accounts Payable', 'liability');
    salesAccId      = await ensureAccount('Sales Income', 'income');
    purchaseAccId   = await ensureAccount('Purchase Expense', 'expense');

    let cashJournalId;
    const jEx = await client.query("SELECT id FROM journals WHERE journal_type='cash' LIMIT 1");
    if (jEx.rows.length > 0) {
      cashJournalId = jEx.rows[0].id;
    } else {
      const r = await client.query(
        `INSERT INTO journals (journal_name, journal_type, default_account_id) VALUES ($1,'cash',$2) RETURNING id`,
        ['Cash Journal', cashAccId]
      );
      cashJournalId = r.rows[0].id;
    }
    console.log('  ✓ Accounts & journals ready');

    // ── 4. Sales Orders ──────────────────────────────────────────────────────
    console.log('Creating 400 sales orders...');
    const soStatuses = ['draft','confirmed','invoiced','cancelled'];
    // Weight: 50 invoiced, 20 cancelled, rest split draft/confirmed
    const soStatusDist = [
      ...Array(100).fill('draft'),
      ...Array(80).fill('confirmed'),
      ...Array(180).fill('invoiced'),
      ...Array(40).fill('cancelled'),
    ];

    const invoiceIds = [];

    for (let i = 0; i < 400; i++) {
      const customerId = allCustomers[i % allCustomers.length];
      const status     = soStatusDist[i % soStatusDist.length];
      const daysAgo    = rndInt(1, 365);
      const orderDate  = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];

      // 1–3 items per order
      const numItems = rndInt(1, 3);
      let subtotal = 0, taxAmount = 0;
      const itemsData = [];
      for (let j = 0; j < numItems; j++) {
        const prod = productIds[rndInt(0, productIds.length - 1)];
        const qty  = rndInt(1, 5);
        const price = prod.sales_price;
        const taxRate = rnd([0, 5, 12, 18]);
        const itemSub = parseFloat((qty * price).toFixed(2));
        const itemTax = parseFloat((itemSub * taxRate / 100).toFixed(2));
        subtotal  += itemSub;
        taxAmount += itemTax;
        itemsData.push({ product_id: prod.id, qty, price, taxRate, itemSub, itemTax });
      }
      subtotal  = parseFloat(subtotal.toFixed(2));
      taxAmount = parseFloat(taxAmount.toFixed(2));
      const total = parseFloat((subtotal + taxAmount).toFixed(2));

      const soR = await client.query(
        `INSERT INTO sales_orders (customer_id, order_date, status, subtotal, tax_amount, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [customerId, orderDate, status, subtotal, taxAmount, total]
      );
      const soId = soR.rows[0].id;

      for (const it of itemsData) {
        await client.query(
          `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, tax_rate, tax_amount, subtotal, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [soId, it.product_id, it.qty, it.price, it.taxRate, it.itemTax, it.itemSub, parseFloat((it.itemSub + it.itemTax).toFixed(2))]
        );
      }

      // Create invoice for invoiced orders
      if (status === 'invoiced') {
        const invDaysAgo = rndInt(1, daysAgo);
        const invDate    = new Date(Date.now() - invDaysAgo * 86400000).toISOString().split('T')[0];
        const dueDate    = new Date(Date.now() - (invDaysAgo - rndInt(15, 30)) * 86400000).toISOString().split('T')[0];
        const invStatus  = rnd(['unpaid','partially_paid','paid','paid','paid']);
        const invR = await client.query(
          `INSERT INTO invoices (sales_order_id, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [soId, customerId, invDate, dueDate, subtotal, taxAmount, total, invStatus]
        );
        invoiceIds.push({ id: invR.rows[0].id, customer_id: customerId, total, status: invStatus });
      }
    }
    console.log(`  ✓ 400 sales orders + ${invoiceIds.length} invoices created`);

    // ── 5. Purchase Orders ───────────────────────────────────────────────────
    console.log('Creating 400 purchase orders...');
    const poStatusDist = [
      ...Array(100).fill('draft'),
      ...Array(80).fill('confirmed'),
      ...Array(180).fill('billed'),
      ...Array(40).fill('cancelled'),
    ];

    const billIds = [];

    for (let i = 0; i < 400; i++) {
      const vendorId = allVendors[i % allVendors.length];
      const status   = poStatusDist[i % poStatusDist.length];
      const daysAgo  = rndInt(1, 365);
      const orderDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];

      const numItems = rndInt(1, 3);
      let subtotal = 0, taxAmount = 0;
      const itemsData = [];
      for (let j = 0; j < numItems; j++) {
        const prod    = productIds[rndInt(0, productIds.length - 1)];
        const qty     = rndInt(1, 10);
        const price   = prod.purchase_price;
        const taxRate = rnd([0, 5, 12, 18]);
        const itemSub = parseFloat((qty * price).toFixed(2));
        const itemTax = parseFloat((itemSub * taxRate / 100).toFixed(2));
        subtotal  += itemSub;
        taxAmount += itemTax;
        itemsData.push({ product_id: prod.id, qty, price, taxRate, itemSub, itemTax });
      }
      subtotal  = parseFloat(subtotal.toFixed(2));
      taxAmount = parseFloat(taxAmount.toFixed(2));
      const total = parseFloat((subtotal + taxAmount).toFixed(2));

      const poR = await client.query(
        `INSERT INTO purchase_orders (vendor_id, order_date, status, subtotal, tax_amount, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
        [vendorId, orderDate, status, subtotal, taxAmount, total]
      );
      const poId = poR.rows[0].id;

      for (const it of itemsData) {
        await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price, tax_rate, tax_amount, subtotal, total)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [poId, it.product_id, it.qty, it.price, it.taxRate, it.itemTax, it.itemSub, parseFloat((it.itemSub + it.itemTax).toFixed(2))]
        );
      }

      if (status === 'billed') {
        const billDaysAgo = rndInt(1, daysAgo);
        const billDate    = new Date(Date.now() - billDaysAgo * 86400000).toISOString().split('T')[0];
        const dueDate     = new Date(Date.now() - (billDaysAgo - rndInt(15, 30)) * 86400000).toISOString().split('T')[0];
        const billStatus  = rnd(['unpaid','partially_paid','paid','paid','paid']);
        const bR = await client.query(
          `INSERT INTO bills (purchase_order_id, vendor_id, bill_date, due_date, subtotal, tax_amount, total_amount, status)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [poId, vendorId, billDate, dueDate, subtotal, taxAmount, total, billStatus]
        );
        billIds.push({ id: bR.rows[0].id, vendor_id: vendorId, total, status: billStatus });
      }
    }
    console.log(`  ✓ 400 purchase orders + ${billIds.length} bills created`);

    // ── 6. Payments ──────────────────────────────────────────────────────────
    console.log('Creating payments...');
    let payCount = 0;

    for (const inv of invoiceIds.filter(i => i.status === 'paid' || i.status === 'partially_paid')) {
      const amount = inv.status === 'paid'
        ? inv.total
        : parseFloat((inv.total * rndPrice(0.3, 0.7)).toFixed(2));
      const payDate = new Date(Date.now() - rndInt(1, 180) * 86400000).toISOString().split('T')[0];
      await client.query(
        `INSERT INTO payments (contact_id, invoice_id, journal_id, payment_date, amount, payment_method, reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [inv.customer_id, inv.id, cashJournalId, payDate, amount,
         rnd(['cash','bank']), `PMT-INV-${inv.id}`]
      );
      payCount++;
    }

    for (const bill of billIds.filter(b => b.status === 'paid' || b.status === 'partially_paid')) {
      const amount = bill.status === 'paid'
        ? bill.total
        : parseFloat((bill.total * rndPrice(0.3, 0.7)).toFixed(2));
      const payDate = new Date(Date.now() - rndInt(1, 180) * 86400000).toISOString().split('T')[0];
      await client.query(
        `INSERT INTO payments (contact_id, bill_id, journal_id, payment_date, amount, payment_method, reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [bill.vendor_id, bill.id, cashJournalId, payDate, amount,
         rnd(['cash','bank']), `PMT-BILL-${bill.id}`]
      );
      payCount++;
    }
    console.log(`  ✓ ${payCount} payments created`);

    await client.query('COMMIT');
    console.log('\n✅ Seed complete!');

    // Summary
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) FROM contacts'),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query('SELECT COUNT(*) FROM sales_orders'),
      pool.query('SELECT COUNT(*) FROM invoices'),
      pool.query('SELECT COUNT(*) FROM purchase_orders'),
      pool.query('SELECT COUNT(*) FROM bills'),
      pool.query('SELECT COUNT(*) FROM payments'),
    ]);
    const labels = ['contacts','products','sales_orders','invoices','purchase_orders','bills','payments'];
    labels.forEach((l, i) => console.log(`  ${l}: ${counts[i].rows[0].count}`));

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

run();
