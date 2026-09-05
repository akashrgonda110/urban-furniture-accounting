import { useEffect, useState } from "react";
import { api } from "../../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

export default function ProfitLoss() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getProfitLoss()
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Generating Profit & Loss…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const isProfit = data.netProfit >= 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          As of {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Print</button>
      </div>

      {/* Summary stats */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Income</div>
          <div className="stat-value money">{fmt(data.totalIncome)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value warn">{fmt(data.totalExpenses)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{isProfit ? "Net Profit" : "Net Loss"}</div>
          <div className="stat-value" style={{ color: isProfit ? "var(--success)" : "var(--danger)" }}>
            {fmt(Math.abs(data.netProfit))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Income */}
        <div className="card">
          <div className="report-section">
            <h3>Income</h3>
            {data.income.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>
                No income accounts with journal entries yet.
              </div>
            ) : (
              data.income.map((a) => (
                <div className="report-row" key={a.account_name}>
                  <span>{a.account_name}</span>
                  <span>{fmt(a.balance)}</span>
                </div>
              ))
            )}
            <div className="report-total">
              <span>Total Income</span>
              <span>{fmt(data.totalIncome)}</span>
            </div>
          </div>
        </div>

        {/* Expenses */}
        <div className="card">
          <div className="report-section">
            <h3>Expenses</h3>
            {data.expenses.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>
                No expense accounts with journal entries yet.
              </div>
            ) : (
              data.expenses.map((a) => (
                <div className="report-row" key={a.account_name}>
                  <span>{a.account_name}</span>
                  <span>{fmt(a.balance)}</span>
                </div>
              ))
            )}
            <div className="report-total">
              <span>Total Expenses</span>
              <span>{fmt(data.totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Profit/Loss banner */}
      <div className={`report-net${isProfit ? "" : " loss"}`} style={{ marginTop: 24 }}>
        <span>{isProfit ? "Net Profit" : "Net Loss"}</span>
        <span>{fmt(Math.abs(data.netProfit))}</span>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <strong>Formula:</strong> Net Profit = Total Income − Total Expenses&nbsp;
          ({fmt(data.totalIncome)} − {fmt(data.totalExpenses)} = <strong>{fmt(data.netProfit)}</strong>)
        </p>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
          This report reflects balances from posted journal entries in the Chart of Accounts.
        </p>
      </div>
    </div>
  );
}
