/**
 * Pagination — simple prev/next + page-number bar.
 *
 * Props:
 *   total      {number}  total item count (after filtering)
 *   page       {number}  current page (1-based)
 *   pageSize   {number}  items per page
 *   onChange   {fn}      called with new page number
 */
export default function Pagination({ total, page, pageSize, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  // Build page number windows: always show first, last, and ±2 around current
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i);
    }
  }
  // Insert ellipsis markers
  const withGaps = [];
  for (let i = 0; i < pages.length; i++) {
    if (i > 0 && pages[i] - pages[i - 1] > 1) withGaps.push("...");
    withGaps.push(pages[i]);
  }

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "12px 16px", borderTop: "1px solid var(--border)",
      background: "var(--bg)", fontSize: 13,
    }}>
      {/* Record count */}
      <span style={{ color: "var(--text-muted)" }}>
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> records
      </span>

      {/* Page buttons */}
      <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          style={{ padding: "4px 10px" }}
        >
          ‹ Prev
        </button>

        {withGaps.map((p, i) =>
          p === "..." ? (
            <span key={`gap-${i}`} style={{ padding: "0 4px", color: "var(--text-muted)" }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p)}
              style={{
                padding: "4px 9px",
                borderRadius: "var(--radius)",
                border: "1px solid",
                borderColor: p === page ? "var(--primary)" : "var(--border)",
                background: p === page ? "var(--primary)" : "#fff",
                color: p === page ? "#fff" : "var(--text)",
                fontWeight: p === page ? 700 : 400,
                cursor: "pointer",
                fontSize: 13,
                minWidth: 32,
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          style={{ padding: "4px 10px" }}
        >
          Next ›
        </button>
      </div>

      {/* Page size info */}
      <span style={{ color: "var(--text-muted)" }}>
        Page {page} / {totalPages}
      </span>
    </div>
  );
}
