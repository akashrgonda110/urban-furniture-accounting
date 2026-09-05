const BASE = "http://localhost:5000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  // Contacts
  getContacts: () => request("/contacts"),
  getContact: (id) => request(`/contacts/${id}`),
  createContact: (body) => request("/contacts", { method: "POST", body: JSON.stringify(body) }),
  updateContact: (id, body) => request(`/contacts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteContact: (id) => request(`/contacts/${id}`, { method: "DELETE" }),

  // Products
  getProducts: () => request("/products"),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (body) => request("/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id, body) => request(`/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: "DELETE" }),

  // Chart of Accounts
  getAccounts: () => request("/accounts"),
  createAccount: (body) => request("/accounts", { method: "POST", body: JSON.stringify(body) }),
  updateAccount: (id, body) => request(`/accounts/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  toggleAccount: (id) => request(`/accounts/${id}/toggle`, { method: "PATCH" }),

  // Journals
  getJournals: () => request("/journals"),
  createJournal: (body) => request("/journals", { method: "POST", body: JSON.stringify(body) }),
  updateJournal: (id, body) => request(`/journals/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  // Sales Orders
  getSalesOrders: () => request("/sales/orders"),
  getSalesOrder: (id) => request(`/sales/orders/${id}`),
  createSalesOrder: (body) => request("/sales/orders", { method: "POST", body: JSON.stringify(body) }),
  confirmSalesOrder: (id) => request(`/sales/orders/${id}/confirm`, { method: "PATCH" }),
  cancelSalesOrder: (id) => request(`/sales/orders/${id}/cancel`, { method: "PATCH" }),

  // Invoices
  getInvoices: () => request("/sales/invoices"),
  getInvoice: (id) => request(`/sales/invoices/${id}`),
  createInvoice: (body) => request("/sales/invoices", { method: "POST", body: JSON.stringify(body) }),
  cancelInvoice: (id) => request(`/sales/invoices/${id}/cancel`, { method: "PATCH" }),

  // Purchase Orders
  getPurchaseOrders: () => request("/purchases/orders"),
  getPurchaseOrder: (id) => request(`/purchases/orders/${id}`),
  createPurchaseOrder: (body) => request("/purchases/orders", { method: "POST", body: JSON.stringify(body) }),
  confirmPurchaseOrder: (id) => request(`/purchases/orders/${id}/confirm`, { method: "PATCH" }),
  cancelPurchaseOrder: (id) => request(`/purchases/orders/${id}/cancel`, { method: "PATCH" }),

  // Bills
  getBills: () => request("/purchases/bills"),
  getBill: (id) => request(`/purchases/bills/${id}`),
  createBill: (body) => request("/purchases/bills", { method: "POST", body: JSON.stringify(body) }),
  cancelBill: (id) => request(`/purchases/bills/${id}/cancel`, { method: "PATCH" }),

  // Payments
  getPayments: () => request("/payments"),
  payInvoice: (id, body) => request(`/payments/invoice/${id}`, { method: "POST", body: JSON.stringify(body) }),
  payBill: (id, body) => request(`/payments/bill/${id}`, { method: "POST", body: JSON.stringify(body) }),

  // Journal Entries
  getJournalEntries: () => request("/accounting/entries"),
  getJournalEntry: (id) => request(`/accounting/entries/${id}`),
  createJournalEntry: (body) => request("/accounting/entries", { method: "POST", body: JSON.stringify(body) }),

  // Analytic Accounts
  getAnalyticAccounts: () => request("/analytic"),
  createAnalyticAccount: (body) => request("/analytic", { method: "POST", body: JSON.stringify(body) }),
  updateAnalyticAccount: (id, body) => request(`/analytic/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteAnalyticAccount: (id) => request(`/analytic/${id}`, { method: "DELETE" }),

  // Budgets
  getBudgets: () => request("/budgets"),
  createBudget: (body) => request("/budgets", { method: "POST", body: JSON.stringify(body) }),
  updateBudget: (id, body) => request(`/budgets/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: "DELETE" }),

  // Reports
  getDashboard: () => request("/reports/dashboard"),
  getBalanceSheet: () => request("/reports/balance-sheet"),
  getProfitLoss: () => request("/reports/profit-loss"),
  getBudgetReport: () => request("/reports/budget"),
};
