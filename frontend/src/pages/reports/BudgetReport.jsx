import { useEffect, useState } from "react";
import { api } from "../../api";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n ?? 0);

function VarianceBadge({ difference }) {
  const d = parseFloat(difference);
  if (d > 0) return <span style={{ color: "var(--success)", fontWeight: 600 }}>▼ {fmt(d)} under</span>;
  if (d < 0) return <span style={{ color: "var(--danger)", fontWeight: 600 }}>▲ {fmt(Math.abs(d))} over</span>;
  return <span style={{ color: "var(--text-muted)" }}>On budget</span>;
}

export default function BudgetReport() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBudgetReport()
      .then((d) => { setBudgets(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  if (loading) return <div className="loading">Generating Budget Report…</div>;
  if (error) return <div className="alert alert-error">{error}</div>;

  const totalPlanned = budgets.reduce((s, b) => s + parseFloat(b.planned_amount || 0), 0);
  const totalActual = budgets.reduce((s, b) => s + parseFloat(b.actual_amount || 0), 0);
  const totalDiff = totalPlanned - totalActual;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)" }}>
          As of {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Print</button>
      </div>

      {/* Summary */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Budgets</div>
          <div className="stat-value">{budgets.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Planned</div>
          <div className="stat-value money">{fmt(totalPlanned)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Actual</div>
          <div className="stat-value warn">{fmt(totalActual)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Variance</div>
          <div className="stat-value" style={{ color: totalDiff >= 0 ? "var(--success)" : "var(--danger)" }}>
            {fmt(Math.abs(totalDiff))}
            <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>
              {totalDiff >= 0 ? "under" : "over"}
            </span>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {budgets.length === 0 ? (
          <div className="empty">No budgets found. Create budgets from the Budgets page.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Budget Name</th>
                  <th>Analytic Account</th>
                  <th>Period</th>
                  <th>Responsible</th>
                  <th style={{ textAlign: "right" }}>Planned</th>
                  <th style={{ textAlign: "right" }}>Actual</th>
                  <th style={{ textAlign: "right" }}>Variance</th>
                  <th style={{ textAlign: "right" }}>% Used</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const planned = parseFloat(b.planned_amount || 0);
                  const actual = parseFloat(b.actual_amount || 0);
                  const pct = planned > 0 ? (actual / planned) * 100 : 0;
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.name}</strong></td>
                      <td>
                        <span className={`badge badge-${b.analytic_type || "income"}`}>
                          {b.analytic_account_name}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {b.start_date ? new Date(b.start_date).toLocaleDateString("en-IN") : "—"}
                        {" → "}
                        {b.end_date ? new Date(b.end_date).toLocaleDateString("en-IN") : "—"}
                      </td>
                      <td>{b.responsible_person || "—"}</td>
                      <td style={{ textAlign: "right" }}>{fmt(planned)}</td>
                      <td style={{ textAlign: "right" }}>{fmt(actual)}</td>
                      <td style={{ textAlign: "right" }}>
                        <VarianceBadge difference={b.difference} />
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                          <div style={{
                            width: 60, height: 6, background: "var(--border)", borderRadius: 3, overflow: "hidden"
                          }}>
                            <div style={{
                              width: `${Math.min(pct, 100)}%`,
                              height: "100%",
                              background: pct > 100 ? "var(--danger)" : pct > 75 ? "var(--warning)" : "var(--success)",
                              borderRadius: 3
                            }} />
                          </div>
                          <span style={{ fontSize: 12 }}>{pct.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)", background: "var(--bg)" }}>
                  <td colSpan={4}>Total</td>
                  <td style={{ textAlign: "right" }}>{fmt(totalPlanned)}</td>
                  <td style={{ textAlign: "right" }}>{fmt(totalActual)}</td>
                  <td style={{ textAlign: "right" }}>
                    <VarianceBadge difference={totalDiff} />
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {totalPlanned > 0 ? ((totalActual / totalPlanned) * 100).toFixed(1) : "0.0"}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>
          <strong>Actual Amount:</strong> For income budgets, actual = invoice payments received in the budget period.
          For expense budgets, actual = bill payments made in the budget period.
        </p>
      </div>
    </div>
  );
}
