/**
 * RBAC — Role-Based Access Control
 *
 * Roles:
 *   admin        — full access to everything
 *   accountant   — master data, transactions, reports (no user management)
 *   contact_user — only their own invoices/bills + pay
 */

// List of every protected route in the app
export const ROUTES = {
  DASHBOARD:       "/",
  CONTACTS:        "/contacts",
  PRODUCTS:        "/products",
  SALES_ORDERS:    "/sales/orders",
  INVOICES:        "/sales/invoices",
  PO:              "/purchases/orders",
  BILLS:           "/purchases/bills",
  PAYMENTS:        "/payments",
  COA:             "/accounting/accounts",
  JOURNALS:        "/accounting/journals",
  JE:              "/accounting/entries",
  ANALYTIC:        "/analytic",
  BUDGETS:         "/budgets",
  BALANCE_SHEET:   "/reports/balance-sheet",
  PROFIT_LOSS:     "/reports/profit-loss",
  BUDGET_REPORT:   "/reports/budget",
  MY_PORTAL:       "/my-portal",   // contact_user only
  USERS:           "/admin/users",  // admin only
};

// What each role is allowed to visit
const ROLE_ROUTES = {
  admin: Object.values(ROUTES),   // all
  // (USERS route added to ROUTES above, admin gets it via Object.values)

  accountant: [
    ROUTES.DASHBOARD,
    ROUTES.CONTACTS,
    ROUTES.PRODUCTS,
    ROUTES.SALES_ORDERS,
    ROUTES.INVOICES,
    ROUTES.PO,
    ROUTES.BILLS,
    ROUTES.PAYMENTS,
    ROUTES.COA,
    ROUTES.JOURNALS,
    ROUTES.JE,
    ROUTES.ANALYTIC,
    ROUTES.BUDGETS,
    ROUTES.BALANCE_SHEET,
    ROUTES.PROFIT_LOSS,
    ROUTES.BUDGET_REPORT,
  ],

  contact_user: [
    ROUTES.MY_PORTAL,
  ],
};

/**
 * Returns true if the given role can access the given path.
 * Admin always returns true.
 */
export function canAccess(role, path) {
  if (!role) return false;
  const allowed = ROLE_ROUTES[role] || [];
  return allowed.includes(path);
}

/**
 * Returns the default landing page for a role after login.
 */
export function defaultRoute(role) {
  if (role === "contact_user") return ROUTES.MY_PORTAL;
  return ROUTES.DASHBOARD;
}

/**
 * Returns true if the role is allowed to view the sidebar section.
 */
export const SIDEBAR_ACCESS = {
  admin: {
    dashboard: true, masterData: true, sales: true, purchases: true,
    finance: true, accounting: true, analytics: true, reports: true, adminPanel: true,
  },
  accountant: {
    dashboard: true, masterData: true, sales: true, purchases: true,
    finance: true, accounting: true, analytics: true, reports: true, adminPanel: false,
  },
  contact_user: {
    dashboard: false, masterData: false, sales: false, purchases: false,
    finance: false, accounting: false, analytics: false, reports: false, adminPanel: false,
  },
};


