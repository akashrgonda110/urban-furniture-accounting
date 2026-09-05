# Urban Furniture Accounting System

> **Odoo Hackathon 2026 — Finale Project**

A full-stack web-based accounting application built specifically for an urban furniture business. It covers the complete business flow from master data management through to financial reporting, with double-entry accounting enforced at the database level.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Key Features](#3-key-features)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Project Structure](#6-project-structure)
7. [Database Architecture](#7-database-architecture)
8. [Authentication](#8-authentication)
9. [Business Workflows](#9-business-workflows)
10. [Double-Entry Accounting](#10-double-entry-accounting)
11. [Financial Reports](#11-financial-reports)
12. [API Reference](#12-api-reference)
13. [Environment Variables](#13-environment-variables)
14. [Setup & Installation](#14-setup--installation)
15. [Running the Application](#15-running-the-application)
16. [Example End-to-End Flow](#16-example-end-to-end-flow)
17. [Validation & Security](#17-validation--security)
18. [Out of Scope / Future Work](#18-out-of-scope--future-work)

---

## 1. Project Overview

The Urban Furniture Accounting System is a purpose-built accounting platform that manages the financial operations of a furniture retail/manufacturing business. It handles contacts, products, sales orders, purchase orders, invoices, vendor bills, payments, journal entries, and financial reporting — all wired to a genuine double-entry accounting engine backed by PostgreSQL.

The application was built as an MVP for the Odoo Hackathon 2026 Finale. Every feature present in the codebase is fully functional with real database reads and writes.

---

## 2. Problem Statement

Small and mid-sized furniture businesses typically lack affordable accounting software that integrates both their sales/purchasing workflow and their accounting books. This system addresses that gap by providing:

- A single interface to manage customers, vendors, and products
- A guided sales and purchase workflow (order → invoice/bill → payment)
- Automatic double-entry journal entries generated on payment
- Financial reports (Balance Sheet, Profit & Loss, Budget Report) derived directly from posted journal data

---

## 3. Key Features

| Module | What is implemented |
|--------|-------------------|
| **Authentication** | JWT login/signup, bcrypt password hashing, role-based user accounts, protected routes |
| **Contacts** | Full CRUD — customers, vendors, or both; email, mobile, city/state/pincode |
| **Products** | Full CRUD — goods, service, or combo; sales price, purchase price, category |
| **Chart of Accounts** | Full CRUD — five account types (asset, liability, income, expense, capital); activate/deactivate |
| **Journals** | Full CRUD — four journal types (sales, purchase, bank, cash); default account linkage |
| **Sales Orders** | Create with line items, tax calculation, confirm, cancel, generate invoice |
| **Invoices** | Auto-generated from sales orders; unpaid → partially paid → paid status tracking |
| **Purchase Orders** | Create with line items, tax calculation, confirm, cancel, generate bill |
| **Bills** | Auto-generated from purchase orders; same payment status lifecycle as invoices |
| **Payments** | Register against invoice or bill; cash or bank method; partial payments supported |
| **Journal Entries** | Auto-created on payment registration; manual creation with debit=credit enforcement |
| **Analytic Accounts** | Full CRUD — income or expense type |
| **Budgets** | Full CRUD — linked to analytic accounts; planned amount, period, responsible person |
| **Dashboard** | Live summary: customer/vendor/product counts, total sales/purchases, outstanding amounts |
| **Balance Sheet** | Aggregated from journal items — assets, liabilities, capital |
| **Profit & Loss** | Income vs expenses from journal items; net profit calculation |
| **Budget Report** | Planned vs actual (payments in period) with variance and % used |

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
| Database | PostgreSQL | 18 |

---

## 5. System Architecture

```
Browser (React + Vite)
        │
        │  HTTP/JSON  (http://localhost:5173)
        ▼
Express REST API  (http://localhost:5000)
        │
        │  pg Pool (parameterized queries)
        ▼
PostgreSQL 18  (urban_furniture_accounting)
```

The frontend never connects directly to PostgreSQL. All data access goes through the Express API. JWT tokens are stored in `localStorage` on the client and sent as `Authorization: Bearer <token>` on all authenticated requests (the current backend routes do not require auth headers on accounting endpoints — they are openly accessible once the server is running, consistent with the MVP scope).

---

## 6. Project Structure

```
urban-furniture-accounting/
├── backend/
│   ├── server.js              # Express entry point, route registration
│   ├── db.js                  # PostgreSQL connection pool
│   ├── .env                   # Environment variables (not committed)
│   ├── migrate-users.js       # One-time users table migration script
│   ├── package.json
│   └── routes/
│       ├── auth.js            # Signup, login, /me
│       ├── contacts.js        # Contact CRUD
│       ├── products.js        # Product CRUD
│       ├── accounts.js        # Chart of accounts CRUD + toggle
│       ├── journals.js        # Journal CRUD
│       ├── sales.js           # Sales orders + invoices
│       ├── purchases.js       # Purchase orders + bills
│       ├── payments.js        # Payment registration (invoice + bill)
│       ├── accounting.js      # Manual journal entries
│       ├── analytic.js        # Analytic accounts CRUD
│       ├── budgets.js         # Budget CRUD
│       └── reports.js         # Dashboard + 3 financial reports
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx           # React entry point
│       ├── App.jsx            # Router, route guards, all routes
│       ├── index.css          # Global styles
│       ├── api/
│       │   └── index.js       # All API call functions (single source)
│       ├── context/
│       │   └── AuthContext.jsx  # JWT auth state, login(), logout()
│       ├── components/
│       │   ├── AppLogo.jsx    # Inline SVG brand logo
│       │   ├── Layout.jsx     # Shell: sidebar + topbar + page area
│       │   └── Sidebar.jsx    # Navigation + user info + sign out
│       └── pages/
│           ├── Login.jsx
│           ├── Signup.jsx
│           ├── Dashboard.jsx
│           ├── Contacts.jsx
│           ├── Products.jsx
│           ├── Payments.jsx
│           ├── AnalyticAccounts.jsx
│           ├── Budgets.jsx
│           ├── sales/
│           │   ├── SalesOrders.jsx
│           │   └── Invoices.jsx
│           ├── purchases/
│           │   ├── PurchaseOrders.jsx
│           │   └── Bills.jsx
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
    └── schema.sql             # Full PostgreSQL schema (15 + 1 tables)
```

---

## 7. Database Architecture

### Tables (16 total)

| Table | Purpose |
|-------|---------|
| `users` | Application user accounts with hashed passwords and roles |
| `contacts` | Customers, vendors, or contacts serving both roles |
| `products` | Product/service catalog with sales and purchase prices |
| `chart_of_accounts` | General ledger accounts grouped by type |
| `journals` | Named journals (Sales, Purchase, Bank, Cash) linked to a default account |
| `sales_orders` | Customer orders with status lifecycle |
| `sales_order_items` | Line items for each sales order with per-line tax |
| `invoices` | Customer invoices derived from sales orders; one invoice per order |
| `purchase_orders` | Vendor orders with status lifecycle |
| `purchase_order_items` | Line items for each purchase order with per-line tax |
| `bills` | Vendor bills derived from purchase orders; one bill per order |
| `payments` | Payment records linked to either an invoice or a bill (never both) |
| `journal_entries` | Header record for each accounting entry |
| `journal_items` | Individual debit/credit lines; each line carries only debit OR credit |
| `analytic_accounts` | Cost/profit centres of type income or expense |
| `budgets` | Budget plans linked to an analytic account with a date range and planned amount |

### Key Relationships

```
contacts ──────────────┬──► sales_orders ──► sales_order_items
                       │         │                  │ (product_id)
                       │         └──► invoices ──► payments
                       │
                       ├──► purchase_orders ──► purchase_order_items
                       │         │                    │ (product_id)
                       │         └──► bills ──────► payments
                       │
products ──────────────┘

payments ──────────────────► journal_entries ──► journal_items
                                    │
journals ──────────────────────────┘
journal_items ─────────────────────────────────► chart_of_accounts

analytic_accounts ─────────────────────────────► budgets
```

### Account Types and Normal Balances

| Type | Normal Balance | Used in |
|------|---------------|---------|
| `asset` | Debit | Balance Sheet |
| `liability` | Credit | Balance Sheet |
| `capital` | Credit | Balance Sheet |
| `income` | Credit | Profit & Loss |
| `expense` | Debit | Profit & Loss |

### Important Constraints (enforced by database)

- `journal_items`: each line must have `(debit > 0 AND credit = 0)` OR `(credit > 0 AND debit = 0)` — a line cannot carry both
- `payments`: exactly one of `invoice_id` or `bill_id` must be non-null per row
- `invoices`: unique per `sales_order_id` — one invoice per sales order
- `bills`: unique per `purchase_order_id` — one bill per purchase order
- `budgets`: `end_date >= start_date`
- All monetary fields use `NUMERIC(12,2)`
- Prices and quantities have `CHECK (value >= 0)` or `CHECK (value > 0)` guards

---

## 8. Authentication

### Approach

JWT (JSON Web Token) authentication with bcryptjs password hashing.

### Users Table

```sql
users (
  id            BIGSERIAL PRIMARY KEY,
  full_name     VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- bcrypt, cost factor 10
  role          VARCHAR(50) NOT NULL     -- 'admin' | 'accountant' | 'contact_user'
                  DEFAULT 'accountant',
  contact_id    BIGINT REFERENCES contacts(id),  -- nullable
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Auth Flow

```
POST /api/auth/signup
  → validate fields (name, email format, password ≥6 chars, passwords match)
  → check email uniqueness
  → bcrypt.hash(password, 10)
  → INSERT user
  → return 201 + safe user object (no password_hash)

POST /api/auth/login
  → find user by email (case-insensitive)
  → bcrypt.compare(supplied, stored hash)
  → sign JWT { id, email, role, full_name }, expires in 7d
  → return token + safe user object

GET /api/auth/me
  → verify Bearer token
  → fetch fresh user from DB
  → return safe user object
```

### Frontend Session

- Token and user object stored in `localStorage` under keys `uf_token` / `uf_user`
- `AuthContext` restores session on page load
- `PrivateRoute` redirects unauthenticated users to `/login`
- `PublicRoute` redirects already-logged-in users away from `/login` and `/signup`
- `logout()` clears both localStorage keys and redirects to `/login`

### Roles

| Role | Internal value | Description |
|------|---------------|-------------|
| Admin / Business Owner | `admin` | Full access |
| Accountant | `accountant` | Default role |
| Contact User | `contact_user` | Limited user |

Role is stored and displayed but route-level permission enforcement is not yet implemented (all authenticated users can access all modules in this MVP).

---

## 9. Business Workflows

### Sales Workflow

```
1. Create Sales Order
   - Select customer (type: customer or both)
   - Add line items: product, quantity, unit price, tax rate (%)
   - System calculates: subtotal = qty × price
                        tax = subtotal × tax_rate / 100
                        total = subtotal + tax
   - Status: draft

2. Confirm Sales Order
   - Status: draft → confirmed

3. Create Invoice
   - Triggered from a confirmed sales order
   - Copies amounts from the sales order
   - Sales order status: confirmed → invoiced
   - Invoice status: unpaid
   - One invoice per sales order (enforced by UNIQUE constraint)

4. Register Payment (against invoice)
   - See Payment Workflow below

5. Cancel
   - Sales order: cancellable from draft or confirmed
   - Invoice: cancellable only when unpaid
```

### Purchase Workflow

```
1. Create Purchase Order
   - Select vendor (type: vendor or both)
   - Add line items with the same tax calculation as sales

2. Confirm Purchase Order
   - Status: draft → confirmed

3. Create Bill
   - Triggered from a confirmed purchase order
   - Purchase order status: confirmed → billed
   - Bill status: unpaid

4. Register Payment (against bill)
   - See Payment Workflow below

5. Cancel
   - Purchase order: cancellable from draft or confirmed
   - Bill: cancellable only when unpaid
```

### Payment Workflow

```
Register Payment for Invoice or Bill:
  - Select journal (bank or cash)
  - Select payment method (cash / bank)
  - Enter amount (can be less than total for partial payment)
  - Enter payment date and optional reference

System actions (in a single database transaction):
  1. Insert payment record
  2. Sum all payments so far for that invoice/bill
  3. Update invoice/bill status:
       total_paid < total_amount  → partially_paid
       total_paid >= total_amount → paid
  4. Auto-create journal entry (if journal has a default account):
       Invoice payment:  Debit Cash/Bank  |  Credit Accounts Receivable
       Bill payment:     Debit Accounts Payable  |  Credit Cash/Bank
```

---

## 10. Double-Entry Accounting

### Rule

Every journal entry must satisfy: **Total Debit = Total Credit**

This is enforced in two places:

1. **API level** (`routes/accounting.js`) — the POST /api/accounting/entries endpoint calculates total debit and credit before insert, and returns HTTP 400 if `|debit - credit| > 0.01`. Each journal item line is also validated to carry only debit OR credit, never both.

2. **Database level** (`journal_items` table) — the CHECK constraint `(debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)` is enforced by PostgreSQL itself.

### Auto-Generated Entries on Payment

When a payment is registered and the selected journal has a `default_account_id`, the system automatically creates a balanced journal entry:

| Transaction | Debit | Credit |
|-------------|-------|--------|
| Customer payment received | Cash/Bank (asset) | Accounts Receivable (asset) |
| Vendor payment made | Accounts Payable (liability) | Cash/Bank (asset) |

Auto-generation requires an account named with "receivable" (for invoices) or "payable" (for bills) to exist in the Chart of Accounts.

### Manual Journal Entries

Users can also create manual journal entries from the Journal Entries screen. The UI shows a real-time balance indicator and disables the submit button until `total debit = total credit`.

---

## 11. Financial Reports

All three reports are computed live from the `journal_items` and related tables — no pre-aggregated report tables exist.

### Balance Sheet

Aggregates journal items by account type:

- **Assets** — debit balance accounts (`total_debit - total_credit`)
- **Liabilities** — credit balance accounts (shown as absolute values)
- **Capital** — credit balance accounts (shown as absolute values)

### Profit & Loss

Aggregates income and expense accounts:

- **Income** — `total_credit - total_debit` per account
- **Expenses** — `total_debit - total_credit` per account
- **Net Profit** = Total Income − Total Expenses

### Budget Report

For each budget:
- **Planned Amount** — from the `budgets` table
- **Actual Amount** — sum of payments in the budget's date range:
  - Income budget → sum of invoice payments in the period
  - Expense budget → sum of bill payments in the period
- **Variance** = Planned − Actual
- **% Used** = (Actual / Planned) × 100

### Dashboard

Live counts and sums pulled in parallel:
- Total customers, total vendors, total products
- Total sales (non-cancelled orders)
- Total purchases (non-cancelled orders)
- Outstanding invoice amount (unpaid + partially_paid)
- Outstanding bill amount (unpaid + partially_paid)

---

## 12. API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Get current user (requires Bearer token) |

### Contacts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/contacts` | List all contacts |
| GET | `/api/contacts/:id` | Get single contact |
| POST | `/api/contacts` | Create contact |
| PUT | `/api/contacts/:id` | Update contact |
| DELETE | `/api/contacts/:id` | Delete contact |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Chart of Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounts` | List all accounts |
| GET | `/api/accounts/:id` | Get single account |
| POST | `/api/accounts` | Create account |
| PUT | `/api/accounts/:id` | Update account |
| PATCH | `/api/accounts/:id/toggle` | Toggle active/inactive |

### Journals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/journals` | List all journals |
| GET | `/api/journals/:id` | Get single journal |
| POST | `/api/journals` | Create journal |
| PUT | `/api/journals/:id` | Update journal |

### Sales

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales/orders` | List sales orders |
| GET | `/api/sales/orders/:id` | Get order with line items |
| POST | `/api/sales/orders` | Create sales order |
| PATCH | `/api/sales/orders/:id/confirm` | Confirm order |
| PATCH | `/api/sales/orders/:id/cancel` | Cancel order |
| GET | `/api/sales/invoices` | List invoices |
| GET | `/api/sales/invoices/:id` | Get invoice with items |
| POST | `/api/sales/invoices` | Create invoice from sales order |
| PATCH | `/api/sales/invoices/:id/cancel` | Cancel invoice |

### Purchases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchases/orders` | List purchase orders |
| GET | `/api/purchases/orders/:id` | Get order with line items |
| POST | `/api/purchases/orders` | Create purchase order |
| PATCH | `/api/purchases/orders/:id/confirm` | Confirm order |
| PATCH | `/api/purchases/orders/:id/cancel` | Cancel order |
| GET | `/api/purchases/bills` | List bills |
| GET | `/api/purchases/bills/:id` | Get bill with items |
| POST | `/api/purchases/bills` | Create bill from purchase order |
| PATCH | `/api/purchases/bills/:id/cancel` | Cancel bill |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List all payments |
| GET | `/api/payments/:id` | Get single payment |
| POST | `/api/payments/invoice/:invoiceId` | Register payment for invoice |
| POST | `/api/payments/bill/:billId` | Register payment for bill |

### Accounting (Journal Entries)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/accounting/entries` | List all journal entries with totals |
| GET | `/api/accounting/entries/:id` | Get entry with debit/credit lines |
| POST | `/api/accounting/entries` | Create manual journal entry |

### Analytic Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytic` | List all analytic accounts |
| GET | `/api/analytic/:id` | Get single account |
| POST | `/api/analytic` | Create analytic account |
| PUT | `/api/analytic/:id` | Update analytic account |
| DELETE | `/api/analytic/:id` | Delete analytic account |

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/budgets` | List all budgets |
| GET | `/api/budgets/:id` | Get single budget |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Dashboard summary metrics |
| GET | `/api/reports/balance-sheet` | Balance sheet by account |
| GET | `/api/reports/profit-loss` | Income, expenses, net profit |
| GET | `/api/reports/budget` | Budget vs actual by period |

---

## 13. Environment Variables

Create `backend/.env` with the following values:

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

> `.env` is listed in `.gitignore` and must never be committed to version control.

---

## 14. Setup & Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 18 (server running locally)
- npm

### PostgreSQL Database Setup

```sql
-- Run in psql as superuser
CREATE DATABASE urban_furniture_accounting;
```

Then apply the schema:

```bash
psql -U postgres -d urban_furniture_accounting -f database/schema.sql
```

Then create the users table:

```bash
cd backend
node migrate-users.js
```

Expected output: `users table created successfully.`

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

---

## 15. Running the Application

### Start the backend

```bash
cd backend
node server.js
```

Server starts at **http://localhost:5000**

Verify: `GET http://localhost:5000/api/db-test` should return `{ "message": "Database connected successfully!" }`

### Start the frontend

```bash
cd frontend
npm run dev
```

Frontend starts at **http://localhost:5173**

Open **http://localhost:5173** in a browser. Unauthenticated users are redirected to `/login`.

---

## 16. Example End-to-End Flow

This walkthrough demonstrates the core business cycle.

**Step 1 — Setup master data**
1. Sign up for an account at `/signup`, then log in
2. Add a Contact: type = Customer (e.g. "Sharma Interiors")
3. Add a Contact: type = Vendor (e.g. "Teak Wood Suppliers")
4. Add a Product: "Teak Dining Table", sales price ₹25,000, purchase price ₹15,000, type = Goods

**Step 2 — Setup accounting**
5. Add accounts in Chart of Accounts:
   - "Cash in Hand" (asset)
   - "Accounts Receivable" (asset)
   - "Accounts Payable" (liability)
   - "Sales Income" (income)
   - "Purchase Expense" (expense)
6. Add a Journal: "Cash Journal", type = Cash, default account = Cash in Hand

**Step 3 — Sales cycle**
7. Create a Sales Order for Sharma Interiors — 2 × Teak Dining Table @ ₹25,000, 18% tax
   - Subtotal: ₹50,000 | Tax: ₹9,000 | Total: ₹59,000
8. Confirm the Sales Order
9. Create Invoice from the confirmed order
10. Register Payment of ₹59,000 against the invoice using Cash Journal
    - Invoice status becomes: **paid**
    - Journal entry auto-created: Debit Cash ₹59,000 / Credit Accounts Receivable ₹59,000

**Step 4 — Purchase cycle**
11. Create a Purchase Order for Teak Wood Suppliers — 5 × Teak Dining Table @ ₹15,000, 12% tax
    - Total: ₹84,000
12. Confirm → Create Bill
13. Register partial payment of ₹40,000
    - Bill status: **partially_paid**
14. Register remaining ₹44,000
    - Bill status: **paid**

**Step 5 — Manual journal entry for sales income**
15. In Journal Entries, create:
    - Debit: Accounts Receivable ₹59,000
    - Credit: Sales Income ₹59,000

**Step 6 — View reports**
16. Balance Sheet — shows Cash and Accounts Receivable balances
17. Profit & Loss — shows Sales Income ₹59,000 as income
18. Budget Report — shows actuals vs planned for any budgets configured

---

## 17. Validation & Security

### Backend validation
- All required fields validated before database operations
- Email format validated with regex on signup
- Password minimum length: 6 characters
- Passwords compared before hashing (confirm_password check)
- All SQL queries use parameterized placeholders (`$1, $2, ...`) — no string concatenation
- `password_hash` is never included in any API response (`safeUser()` helper strips it)
- Duplicate email returns 400 (unique constraint + pre-check)
- Invalid credentials return 401 with identical message for both "user not found" and "wrong password" cases (no user enumeration)

### Database-level constraints
- `journal_items`: each line is either debit-only or credit-only (CHECK constraint)
- `payments`: exactly one of invoice_id or bill_id per row (CHECK constraint)
- `invoices`: one per sales_order_id (UNIQUE constraint)
- `bills`: one per purchase_order_id (UNIQUE constraint)
- Monetary amounts: `CHECK (amount >= 0)` or `CHECK (amount > 0)` as appropriate

### Transactions
Multi-step operations use explicit `BEGIN / COMMIT / ROLLBACK`:
- Creating a sales order with line items
- Creating a purchase order with line items
- Creating an invoice and updating the sales order status
- Creating a bill and updating the purchase order status
- Registering a payment, updating invoice/bill status, and auto-creating a journal entry

### Frontend
- `PrivateRoute` guards all accounting pages — unauthenticated access redirects to `/login`
- `PublicRoute` prevents already-logged-in users from accessing `/login` and `/signup`
- JWT token stored in `localStorage` (adequate for this MVP scope)

---

## 18. Out of Scope / Future Work

The following features were deliberately not implemented in this MVP:

| Feature | Reason |
|---------|--------|
| Role-based permissions | All authenticated users have full access; role stored for future use |
| Password reset / forgot password | No email service configured |
| Email verification on signup | No email service configured |
| OAuth / social login | Out of scope for MVP |
| Multi-currency support | Single currency (INR) assumed |
| Tax configuration module | Tax rate entered per order line |
| Inventory / stock management | Quantities not tracked beyond order lines |
| Product images | Not implemented |
| PDF invoice / bill generation | Not implemented |
| Audit log | Not implemented |
| Multi-company / multi-branch | Not implemented |
| Analytic account linkage on journal items | Schema does not include analytic_account_id on journal_items; budget actuals use payment dates as proxy |
| API authentication middleware | Backend routes are accessible without a token (JWT only gates the frontend UI in this MVP) |

---

*Built for the Odoo Hackathon 2026 Finale.*
