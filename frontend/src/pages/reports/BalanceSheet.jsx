import { useEffect, useState } from "react";
import { api } from "../../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

export default function BalanceSheet() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBalanceSheet()
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Generating Balance Sheet…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const equityCheck = data.totalAssets - data.totalLiabilities;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
            As of {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Print</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Assets */}
        <div className="card">
          <div className="report-section">
            <h3>Assets</h3>
            {data.assets.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No asset accounts with entries.</div>
            ) : (
              data.assets.map((a) => (
                <div className="report-row" key={a.account_name}>
                  <span>{a.account_name}</span>
                  <span>{fmt(a.balance)}</span>
                </div>
              ))
            )}
            <div className="report-total">
              <span>Total Assets</span>
              <span>{fmt(data.totalAssets)}</span>
            </div>
          </div>
        </div>

        {/* Liabilities + Capital */}
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="report-section">
              <h3>Liabilities</h3>
              {data.liabilities.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No liability accounts with entries.</div>
              ) : (
                data.liabilities.map((a) => (
                  <div className="report-row" key={a.account_name}>
                    <span>{a.account_name}</span>
                    <span>{fmt(Math.abs(a.balance))}</span>
                  </div>
                ))
              )}
              <div className="report-total">
                <span>Total Liabilities</span>
                <span>{fmt(data.totalLiabilities)}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="report-section">
              <h3>Capital</h3>
              {data.capital.length === 0 ? (
                <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "8px 0" }}>No capital accounts with entries.</div>
              ) : (
                data.capital.map((a) => (
                  <div className="report-row" key={a.account_name}>
                    <span>{a.account_name}</span>
                    <span>{fmt(Math.abs(a.balance))}</span>
                  </div>
                ))
              )}
              <div className="report-total">
                <span>Total Capital</span>
                <span>{fmt(data.totalCapital)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Balance check */}
      <div className="card" style={{ marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 13 }}>
            <strong>Accounting Equation:</strong> Assets = Liabilities + Capital
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13 }}>
            <span>Total Assets: <strong>{fmt(data.totalAssets)}</strong></span>
            <span>Liabilities + Capital: <strong>{fmt(data.totalLiabilities + data.totalCapital)}</strong></span>
            <span style={{ color: Math.abs(equityCheck - (data.totalLiabilities + data.totalCapital - data.totalLiabilities)) < 0.01 ? "var(--success)" : "var(--warning)", fontWeight: 600 }}>
              Equity Check: {fmt(equityCheck)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
