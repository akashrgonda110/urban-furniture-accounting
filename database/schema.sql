-- ============================================
-- URBAN FURNITURE ACCOUNTING SYSTEM
-- Database Schema
-- ============================================

-- ============================================
-- 1. CONTACTS
-- ============================================

CREATE TABLE contacts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('customer', 'vendor', 'both')),
    email VARCHAR(150),
    mobile VARCHAR(20),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    profile_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PRODUCTS
-- ============================================

CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('goods', 'service', 'combo')),
    sales_price NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (sales_price >= 0),
    purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (purchase_price >= 0),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 3. CHART OF ACCOUNTS
-- ============================================

CREATE TABLE chart_of_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_name VARCHAR(150) NOT NULL UNIQUE,
    account_type VARCHAR(20) NOT NULL
        CHECK (account_type IN (
            'asset',
            'liability',
            'expense',
            'income',
            'capital'
        )),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. JOURNALS
-- ============================================

CREATE TABLE journals (
    id BIGSERIAL PRIMARY KEY,
    journal_name VARCHAR(100) NOT NULL UNIQUE,
    journal_type VARCHAR(20) NOT NULL
        CHECK (journal_type IN (
            'sales',
            'purchase',
            'bank',
            'cash'
        )),
    default_account_id BIGINT
        REFERENCES chart_of_accounts(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. SALES ORDERS
-- ============================================

CREATE TABLE sales_orders (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL
        REFERENCES contacts(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft',
            'confirmed',
            'invoiced',
            'cancelled'
        )),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. SALES ORDER ITEMS
-- ============================================

CREATE TABLE sales_order_items (
    id BIGSERIAL PRIMARY KEY,
    sales_order_id BIGINT NOT NULL
        REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    quantity NUMERIC(12,2) NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0),
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ============================================
-- 7. INVOICES
-- ============================================

CREATE TABLE invoices (
    id BIGSERIAL PRIMARY KEY,
    sales_order_id BIGINT NOT NULL UNIQUE
        REFERENCES sales_orders(id),
    customer_id BIGINT NOT NULL
        REFERENCES contacts(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (status IN (
            'unpaid',
            'partially_paid',
            'paid',
            'cancelled'
        )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. PURCHASE ORDERS
-- ============================================

CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    vendor_id BIGINT NOT NULL
        REFERENCES contacts(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN (
            'draft',
            'confirmed',
            'billed',
            'cancelled'
        )),
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 9. PURCHASE ORDER ITEMS
-- ============================================

CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL
        REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL
        REFERENCES products(id),
    quantity NUMERIC(12,2) NOT NULL
        CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL
        CHECK (unit_price >= 0),
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (tax_rate >= 0),
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    total NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ============================================
-- 10. BILLS
-- ============================================

CREATE TABLE bills (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL UNIQUE
        REFERENCES purchase_orders(id),
    vendor_id BIGINT NOT NULL
        REFERENCES contacts(id),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid'
        CHECK (status IN (
            'unpaid',
            'partially_paid',
            'paid',
            'cancelled'
        )),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. PAYMENTS
-- ============================================

CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT NOT NULL
        REFERENCES contacts(id),
    invoice_id BIGINT
        REFERENCES invoices(id),
    bill_id BIGINT
        REFERENCES bills(id),
    journal_id BIGINT NOT NULL
        REFERENCES journals(id),
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount NUMERIC(12,2) NOT NULL
        CHECK (amount > 0),
    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('cash', 'bank')),
    reference VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (
        (invoice_id IS NOT NULL AND bill_id IS NULL)
        OR
        (invoice_id IS NULL AND bill_id IS NOT NULL)
    )
);

-- ============================================
-- 12. JOURNAL ENTRIES
-- ============================================

CREATE TABLE journal_entries (
    id BIGSERIAL PRIMARY KEY,
    journal_id BIGINT NOT NULL
        REFERENCES journals(id),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 13. JOURNAL ITEMS
-- ============================================

CREATE TABLE journal_items (
    id BIGSERIAL PRIMARY KEY,
    journal_entry_id BIGINT NOT NULL
        REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL
        REFERENCES chart_of_accounts(id),
    debit NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (debit >= 0),
    credit NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (credit >= 0),

    CHECK (
        (debit > 0 AND credit = 0)
        OR
        (credit > 0 AND debit = 0)
    )
);

-- ============================================
-- 14. ANALYTIC ACCOUNTS
-- ============================================

CREATE TABLE analytic_accounts (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    type VARCHAR(20) NOT NULL
        CHECK (type IN ('income', 'expense')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 15. BUDGETS
-- ============================================

CREATE TABLE budgets (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    analytic_account_id BIGINT NOT NULL
        REFERENCES analytic_accounts(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    planned_amount NUMERIC(12,2) NOT NULL
        CHECK (planned_amount >= 0),
    responsible_person VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CHECK (end_date >= start_date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_sales_orders_customer
ON sales_orders(customer_id);

CREATE INDEX idx_purchase_orders_vendor
ON purchase_orders(vendor_id);

CREATE INDEX idx_invoices_customer
ON invoices(customer_id);

CREATE INDEX idx_bills_vendor
ON bills(vendor_id);

CREATE INDEX idx_payments_contact
ON payments(contact_id);

CREATE INDEX idx_journal_entries_date
ON journal_entries(entry_date);

CREATE INDEX idx_journal_items_account
ON journal_items(account_id);

-- ============================================
-- SCHEMA COMPLETE
-- ============================================