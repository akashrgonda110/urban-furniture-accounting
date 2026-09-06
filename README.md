# Urban Furniture Accounting System

> **Odoo Hackathon 2026 — Finale Project**

A full-stack web-based accounting application built for an urban furniture business. It covers the complete business flow from master data management through to financial reporting, with double-entry accounting enforced at the database level.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Key Features](#3-key-features)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Project Structure](#6-project-structure)
7. [Database Architecture](#7-database-architecture)
8. [Authentication & Role-Based Access](#8-authentication--role-based-access)
9. [Business Workflows](#9-business-workflows)
10. [Double-Entry Accounting](#10-double-entry-accounting)
11. [Financial Reports](#11-financial-reports)
12. [API Reference](#12-api-reference)
13. [Environment Variables](#13-environment-variables)
14. [Setup & Installation](#14-setup--installation)
15. [Running the Application](#15-running-the-application)
16. [Seed / Demo Data](#16-seed--demo-data)
17. [Example End-to-End Flow](#17-example-end-to-end-flow)
18. [Validation & Security](#18-validation--security)
19. [Out of Scope / Future Work](#19-out-of-scope--future-work)

---

## 1. Project Overview

The Urban Furniture Accounting System is a purpose-built accounting platform that manages the financial operations of a furniture retail/manufacturing business. It handles contacts, products, sales orders, purchase orders, invoices, vendor bills, payments, journal entries, and financial reporting — all wired to a genuine double-entry accounting engine backed by PostgreSQL.

---

## 2. Problem Statement

Small and mid-sized furniture businesses typically lack affordable accounting software that integrates their sales/purchasing workflow with proper accounting books. This system addresses that by providing:

- A single interface to manage customers, vendors, and products
- A guided sales and purchase workflow (order → invoice/bill → payment)
- Automatic double-entry journal entries on payment
- Financial reports (Balance Sheet, Profit & Loss, Budget Report) derived from posted journal data
- Role-based access so different staff see only what they need

---

## 3. Key Features

| Module | What is implemented |
|--------|-------------------|
| **Authentication** | JWT login/signup, bcrypt password hashing, 3 roles, protected routes |
| **Role-Based Access** | Admin (full), Accountant (master data + transactions + reports), Contact User (own invoices/bills portal) |
| **User Management** | Admin can link Contact Users to contact records |
| **Contacts** | Full CRUD — customer/vendor/both; city/state/type filters; file upload for profile image |
| **Products** | Full CRUD — goods/service/combo; type filter; price validation |
| **Chart of Accounts** | Full CRUD — 5 types; active/inactive toggle; grouped by type |
| **Journals** | Full CRUD — 4 types (sales/purchase/bank/cash); 13 pre-seeded journals |
| **Sales Orders** | Create with line items (auto-fill price), confirm, cancel, quick-create customer (+) |
| **Invoices** | Auto-generated from sales orders; pay, cancel, **Print PDF** |
| **Purchase Orders** | Create with line items, confirm, cancel, quick-create vendor (+) |
| **Bills** | Auto-generated from purchase orders; pay, cancel, **Print PDF** |
| **Payments** | Register against invoice or bill; cash/bank; cheque no. shown only for bank; all journals in dropdown |
| **Journal Entries** | Auto-created on payment; manual creation with debit=credit enforcement; date/journal filters |
| **Analytic Accounts** | Full CRUD — income/expense type; 33 pre-seeded |
| **Budgets** | Full CRUD — linked to analytic accounts; planned amount; 91 pre-seeded |
| **My Portal** | Contact Users see their own invoices/bills and can pay directly |
| **Dashboard** | Live summary stats + large icon Quick Actions grid |
| **Balance Sheet** | Aggregated from journal items — assets, liabilities, capital |
| **Profit & Loss** | Income vs expenses from journal items; net profit |
| **Budget Report** | Planned vs actual (payments in period) with variance % and progress bar |
| **Filters** | Search + status/type/city/state/date filters on every list page |
| **Pagination** | 25 records per page on all list pages |
| **Print PDF** | Invoice and Bill view modals include a Print PDF button (clean A4 layout) |
| **Success alerts** | Auto-dismiss after 3 seconds on all pages |

---

## 4. Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 19.x |
| Frontend build | Vite | 8.x |
| Frontend routing | React Router DOM | 7.x |
| Backend | Node.js + Express | Express 5.x |
| Database driver | pg (node-postgres) | 8.x |
| Authentication | jsonwebtoken | 9.x |
| Password hashing | bcryptjs | 3.x |
| Environment config | dotenv | 17.x |
| CORS | cors | 2.x |
| Body limit | express.json `limit: "10mb"` | — |
| Database | PostgreSQL | 18 |

---

## 5. System Architecture

```
Browser (React + Vite)
        │
        │  HTTP/JSON  (http://localhost:5173)
        ▼
Express REST API  (http://localhost:5000)
  ├── express.json({ limit: "10mb" })   ← supports base64 image uploads
  ├── /api/auth        ← JWT signup/login/me
  ├── /api/contacts    ← CRUD + file upload
  ├── /api/products    ← CRUD
  ├── /api/accounts    ← Chart of Accounts CRUD
  ├── /api/journals    ← Journals CRUD
  ├── /api/sales       ← Sales Orders + Invoices
  ├── /api/purchases   ← Purchase Orders + Bills
  ├── /api/payments    ← Payment registration
  ├── /api/accounting  ← Manual Journal Entries
  ├── /api/analytic    ← Analytic Accounts CRUD
  ├── /api/budgets     ← Budgets CRUD
  ├── /api/users       ← User Management (admin)
  └── /api/reports     ← Dashboard + Balance Sheet + P&L + Budget
        │
        │  pg Pool (parameterized queries, transactions)
        ▼
PostgreSQL 18  (urban_furniture_accounting)
```

---

## 6. Project Structure

```
urban-furniture-accounting/
├── backend/
│   ├── server.js              # Express entry point
│   ├── db.js                  # PostgreSQL connection pool
│   ├── .env                   # Environment variables (not committed)
│   ├── migrate-users.js       # One-time users table migration
│   ├── seed.js                # Large demo dataset seed script
│   ├── package.json
│   └── routes/
│       ├── auth.js            # Signup, login, /me
│       ├── contacts.js        # Contact CRUD
│       ├── products.js        # Product CRUD
│       ├── accounts.js        # Chart of accounts CRUD + toggle
│       ├── journals.js        # Journal CRUD
│       ├── sales.js           # Sales orders + invoices
│       ├── purchases.js       # Purchase orders + bills
│       ├── payments.js        # Payment registration
│       ├── accounting.js      # Manual journal entries
│       ├── analytic.js        # Analytic accounts CRUD
│       ├── budgets.js         # Budget CRUD
│       ├── users.js           # User management (admin)
│       └── reports.js         # Dashboard + 3 financial reports
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx            # Router, route guards, all routes
│       ├── index.css          # Global styles
│       ├── api/index.js       # All API call functions
│       ├── context/
│       │   ├── AuthContext.jsx    # JWT auth state
│       │   └── permissions.js    # RBAC constants & helpers
│       ├── components/
│       │   ├── AppLogo.jsx        # Inline SVG brand logo
│       │   ├── Layout.jsx         # Shell: sidebar + topbar
│       │   ├── Sidebar.jsx        # Navigation + user info + sign out
│       │   ├── Pagination.jsx     # Reusable pagination bar
│       │   └── SuccessAlert.jsx   # Auto-dismiss success alert (3s)
│       ├── utils/
│       │   └── printDocument.js   # Invoice/Bill PDF print utility
│       └── pages/
│           ├── Login.jsx
│           ├── Signup.jsx         # Public — creates contact_user only
│           ├── Dashboard.jsx
│           ├── Contacts.jsx
│           ├── Products.jsx
│           ├── Payments.jsx
│           ├── AnalyticAccounts.jsx
│           ├── Budgets.jsx
│           ├── MyPortal.jsx       # Contact User portal
│           ├── UserManagement.jsx # Admin: link users to contacts
│           ├── sales/
│           │   ├── SalesOrders.jsx    # Includes quick-create customer
│           │   └── Invoices.jsx       # Includes Print PDF
│           ├── purchases/
│           │   ├── PurchaseOrders.jsx # Includes quick-create vendor
│           │   └── Bills.jsx          # Includes Print PDF
│           ├── accounting/
│           │   ├── ChartOfAccounts.jsx
│           │   ├── Journals.jsx
│           │   └── JournalEntries.jsx
│           └── reports/
│               ├── BalanceSheet.jsx
│               ├── ProfitLoss.jsx
│               └── BudgetReport.jsx
│
└── database/
    └── schema.sql             # Full PostgreSQL schema (16 tables)
```

---

## 7. Database Architecture

### Tables (16 total)

| Table | Purpose |
|-------|---------|
| `users` | Application accounts — hashed passwords, roles, optional contact link |
| `contacts` | Customers, vendors, or both — stores base64 profile image |
| `products` | Product/service catalog with sales and purchase prices |
| `chart_of_accounts` | General ledger accounts — 5 types, activate/deactivate |
| `journals` | Named journals (Sales/Purchase/Bank/Cash) — 13 in DB |
| `sales_orders` | Customer orders with status lifecycle |
| `sales_order_items` | Line items with per-line tax calculation |
| `invoices` | Customer invoices — one per sales order |
| `purchase_orders` | Vendor orders with status lifecycle |
| `purchase_order_items` | Line items with per-line tax calculation |
| `bills` | Vendor bills — one per purchase order |
| `payments` | Payments linked to invoice OR bill (never both) |
| `journal_entries` | Header record for each accounting entry |
| `journal_items` | Debit/credit lines — each line carries only debit OR credit |
| `analytic_accounts` | Cost/profit centres — income or expense type |
| `budgets` | Budget plans linked to analytic accounts |

### Key Constraints

- `journal_items`: `(debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)` — enforced by DB
- `payments`: exactly one of `invoice_id` or `bill_id` per row — enforced by DB CHECK
- `invoices`: UNIQUE on `sales_order_id` — one invoice per order
- `bills`: UNIQUE on `purchase_order_id` — one bill per order
- `budgets`: `end_date >= start_date`
- All monetary fields: `NUMERIC(12,2)` with `>= 0` guards

### Account Types

| Type | Normal Balance | Report |
|------|---------------|--------|
| `asset` | Debit | Balance Sheet |
| `liability` | Credit | Balance Sheet |
| `capital` | Credit | Balance Sheet |
| `income` | Credit | Profit & Loss |
| `expense` | Debit | Profit & Loss |

---

## 8. Authentication & Role-Based Access

### Auth Flow

```
POST /api/auth/signup  → always creates contact_user role (no role choice on public signup)
POST /api/auth/login   → returns JWT token (7-day expiry)
GET  /api/auth/me      → validates token, returns current user
```

### Roles

| Role | Internal value | Access |
|------|---------------|--------|
| Admin / Business Owner | `admin` | Full access to all modules |
| Accountant | `accountant` | Dashboard, contacts, products, sales, purchases, invoices, bills, payments, accounting, analytics, budgets, reports |
| Contact User | `contact_user` | My Portal only — sees own invoices/bills and can pay them |

### Security

- Passwords hashed with bcrypt (cost factor 10)
- `password_hash` never returned in any API response
- Public signup **hardcodes** `contact_user` role — even direct API calls cannot create admin/accountant
- Admin and Accountant accounts are created via User Management by an existing Admin
- JWT stored in `localStorage` (adequate for MVP scope)
- All route guards implemented in `App.jsx` via `PrivateRoute`, `PublicRoute`, and `RoleRoute`

### User Management (Admin only)

Admin navigates to **Admin → User Management** to:
- View all users with their linked contact
- Link a Contact User to a contact record (so their portal shows the correct invoices/bills)

---

## 9. Business Workflows

### Sales Cycle

```
Create Sales Order (draft)
        ↓
   Confirm Order (confirmed)
        ↓
   Create Invoice (invoiced → unpaid)
        ↓
   Register Payment
        ↓
   Invoice status: partially_paid → paid
        ↓
   Auto journal entry created (Debit Cash, Credit Receivable)
```

### Purchase Cycle

```
Create Purchase Order (draft)
        ↓
   Confirm Order (confirmed)
        ↓
   Create Bill (billed → unpaid)
        ↓
   Register Payment
        ↓
   Bill status: partially_paid → paid
        ↓
   Auto journal entry created (Debit Payable, Credit Cash)
```

### Tax Calculation (per line item)

```
subtotal   = quantity × unit_price
tax_amount = subtotal × tax_rate / 100
total      = subtotal + tax_amount
```

### Payment Modal Behaviour

- All journals shown (not limited to cash/bank type)
- **Reference / Cheque No.** field is hidden when payment method = `cash`, visible when = `bank`
- Partial payments supported — invoice/bill status becomes `partially_paid` until fully settled

### Quick-Create Shortcuts

- **Sales Orders** — `+` button next to Customer dropdown creates a new customer instantly
- **Purchase Orders** — `+` button next to Vendor dropdown creates a new vendor instantly

---

## 10. Double-Entry Accounting

### Rule

Every journal entry must satisfy: **Total Debit = Total Credit**

Enforced at two levels:

1. **API** (`routes/accounting.js`) — rejects unbalanced entries with HTTP 400
2. **Database** — CHECK constraint on `journal_items`

### Auto-Generated Entries on Payment

| Transaction | Debit | Credit |
|-------------|-------|--------|
| Customer payment received | Cash/Bank (asset) | Accounts Receivable (asset) |
| Vendor payment made | Accounts Payable (liability) | Cash/Bank (asset) |

Auto-generation requires accounts named with "receivable" / "payable" in the Chart of Accounts.

### Manual Journal Entries

Created from the Journal Entries screen. The UI shows a real-time debit=credit balance indicator and blocks submission if unbalanced.

---

## 11. Financial Reports

All three reports computed live from journal items — no pre-aggregated report tables.

### Balance Sheet
Assets (debit balance) vs Liabilities + Capital (credit balance).
Shows accounting equation check: Assets = Liabilities + Capital.

### Profit & Loss
Income (credit balance accounts) minus Expenses (debit balance accounts) = Net Profit/Loss.

### Budget Report
Planned amount vs Actual (payments made/received within the budget period).
Shows variance, % used with colour-coded progress bar.

---

## 12. API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create contact_user account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Get current user (Bearer token required) |

### Contacts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List all |
| GET | `/api/contacts/:id` | Get one |
| POST | `/api/contacts` | Create (supports base64 profile_image up to 10MB) |
| PUT | `/api/contacts/:id` | Update |
| DELETE | `/api/contacts/:id` | Delete |

### Products
| GET/POST/PUT/DELETE | `/api/products[/:id]` | Full CRUD |

### Chart of Accounts
| GET/POST/PUT | `/api/accounts[/:id]` | CRUD |
| PATCH | `/api/accounts/:id/toggle` | Toggle active/inactive |

### Journals
| GET/POST/PUT | `/api/journals[/:id]` | CRUD |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/sales/orders` | List / Create |
| GET | `/api/sales/orders/:id` | Get with line items |
| PATCH | `/api/sales/orders/:id/confirm` | Confirm |
| PATCH | `/api/sales/orders/:id/cancel` | Cancel |
| GET/POST | `/api/sales/invoices` | List / Create from order |
| GET | `/api/sales/invoices/:id` | Get with line items |
| PATCH | `/api/sales/invoices/:id/cancel` | Cancel |

### Purchases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/purchases/orders` | List / Create |
| GET | `/api/purchases/orders/:id` | Get with line items |
| PATCH | `/api/purchases/orders/:id/confirm` | Confirm |
| PATCH | `/api/purchases/orders/:id/cancel` | Cancel |
| GET/POST | `/api/purchases/bills` | List / Create from order |
| GET | `/api/purchases/bills/:id` | Get with line items |
| PATCH | `/api/purchases/bills/:id/cancel` | Cancel |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List all |
| GET | `/api/payments/:id` | Get one |
| POST | `/api/payments/invoice/:invoiceId` | Register invoice payment |
| POST | `/api/payments/bill/:billId` | Register bill payment |

### Accounting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounting/entries` | List with debit/credit totals |
| GET | `/api/accounting/entries/:id` | Get with line items |
| POST | `/api/accounting/entries` | Create manual entry (validates balance) |

### Analytic Accounts
| GET/POST/PUT/DELETE | `/api/analytic[/:id]` | Full CRUD |

### Budgets
| GET/POST/PUT/DELETE | `/api/budgets[/:id]` | Full CRUD |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users (admin) |
| PATCH | `/api/users/:id/link-contact` | Link/unlink contact |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | 7 summary metrics |
| GET | `/api/reports/balance-sheet` | Assets, liabilities, capital |
| GET | `/api/reports/profit-loss` | Income, expenses, net profit |
| GET | `/api/reports/budget` | Planned vs actual per budget |

---

## 13. Environment Variables

Create `backend/.env`:

```env
# PostgreSQL connection
DB_USER=postgres
DB_HOST=localhost
DB_NAME=urban_furniture_accounting
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

> `.env` is in `.gitignore` and must never be committed.

---

## 14. Setup & Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 18
- npm

### Database Setup

```sql
-- In psql as superuser
CREATE DATABASE urban_furniture_accounting;
```

Apply the schema:
```bash
psql -U postgres -d urban_furniture_accounting -f database/schema.sql
```

Create the users table:
```bash
cd backend
node migrate-users.js
```

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

---

## 15. Running the Application

### Backend
```bash
cd backend
node server.js
# Server starts at http://localhost:5000
```

Verify: `GET http://localhost:5000/api/db-test` → `{ "message": "Database connected successfully!" }`

### Frontend
```bash
cd frontend
npm run dev
# Frontend starts at http://localhost:5173
```

Open **http://localhost:5173** — unauthenticated users are redirected to `/login`.

---

## 16. Seed / Demo Data

Run after setup to populate a realistic demo dataset:

```bash
cd backend
node seed.js
```

This creates:

| Table | Seeded count |
|-------|-------------|
| contacts | 90 (30 customer + 30 vendor + 30 both) |
| products | 40 (15 goods + 15 service + 10 combo) |
| sales_orders | 400 (draft/confirmed/invoiced/cancelled mix) |
| invoices | ~180 |
| purchase_orders | 400 |
| bills | ~180 |
| payments | ~285 |

Additional seed scripts (run individually if needed):

```bash
node migrate-users.js          # creates users table
```

Journals (12 covering all types), analytic accounts (30), and budgets (90) are seeded via the main seed or individually.

### Default accounts created by seed

You can log in after seeding via the Signup page (creates contact_user), or create admin/accountant accounts directly in PostgreSQL or via `migrate-users.js`.

---

## 17. Example End-to-End Flow

**Step 1 — Master data**
1. Log in as Admin
2. Add Contact: Sharma Interiors (Customer)
3. Add Contact: Teak Wood Suppliers (Vendor)
4. Add Product: Teak Dining Table — Sales ₹25,000 / Purchase ₹15,000

**Step 2 — Accounting setup**
5. Chart of Accounts → add: Cash in Hand (asset), Accounts Receivable (asset), Accounts Payable (liability), Sales Income (income), Purchase Expense (expense)
6. Journals → add: Cash Journal (cash, default: Cash in Hand)

**Step 3 — Sales cycle**
7. Sales Orders → New → select Sharma Interiors → add 2× Teak Dining Table @ 18% tax → Create → Confirm → Create Invoice
8. Invoices → Pay → select Cash Journal → ₹59,000 → Register Payment
9. Invoice status → **paid** · Auto journal entry → Debit Cash / Credit Receivable

**Step 4 — Purchase cycle**
10. Purchase Orders → New → select Teak Wood Suppliers → add 5× Teak Dining Table @ 12% → Create → Confirm → Create Bill
11. Bills → Pay → ₹84,000 → Register Payment → Bill status → **paid**

**Step 5 — Reports**
12. Balance Sheet — shows cash/receivable balances
13. Profit & Loss — shows income after posting a manual sales entry
14. Budget Report — shows variance against configured budgets

---

## 18. Validation & Security

### Frontend validation
- Name fields: letters/spaces/punctuation only
- Email: regex format check
- Mobile: 7–15 digits, optional `+` prefix
- City/State: letters only
- Pincode: 4–10 digits
- Profile image: JPG/PNG/PDF, max 2MB (converted to base64)
- Product name: must contain at least one letter
- Prices: ≥ 0 numeric
- Password (signup): min 8 chars, must include uppercase, lowercase, special character
- Order items: product required, qty > 0, price ≥ 0, tax 0–100
- Payment amount: > 0, cannot exceed invoice/bill total
- Journal entries: debit = credit enforced before submit

### Backend security
- Parameterized SQL everywhere — no string concatenation
- `password_hash` never in API responses
- Public signup hardcodes `contact_user` role — cannot escalate via API
- Body limit: `10mb` for base64 image uploads
- No user enumeration — both "user not found" and "wrong password" return the same 401 message
- Multi-step operations wrapped in database transactions

### Database constraints
- `journal_items` debit XOR credit per line (CHECK)
- `payments` exactly one of invoice_id/bill_id (CHECK)
- `invoices` unique per sales_order (UNIQUE)
- `bills` unique per purchase_order (UNIQUE)

---

## 19. Out of Scope / Future Work

| Feature | Status |
|---------|--------|
| Role-based API middleware | Frontend guards only; backend routes are open to authenticated sessions |
| Password reset / forgot password | Shows informational alert; no email service |
| Email verification | Not implemented |
| Multi-currency | Single currency (INR) |
| Inventory / stock tracking | Quantities in orders only |
| PDF generation library | Uses browser `window.print()` — no server-side PDF |
| Analytic account linkage on journal items | Budget actuals use payment dates as proxy |
| Admin UI to create Accountant/Admin users | Done via DB or direct API call |
| Audit log | Not implemented |
| Multi-company / multi-branch | Not implemented |

---

*Built for the Odoo Hackathon 2026 Finale.*
