/**
 * AppLogo — Urban Furniture Accounting System
 *
 * Icon: a simple side-view chair combined with three bar-chart bars
 * underneath, communicating "furniture" + "accounting" in one flat mark.
 * Text block: "Urban Furniture" (bold) / "Accounting System" (light caps).
 *
 * Rendered as pure inline SVG — no external files needed.
 */
export default function AppLogo({ width = 220 }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      viewBox="0 0 220 72"
      fill="none"
      role="img"
      aria-label="Urban Furniture Accounting System"
    >
      {/* ── Chair icon (36×44 canvas, top-left origin 4,4) ───────────── */}

      {/* Back rest — vertical rectangle */}
      <rect x="4" y="4" width="7" height="28" rx="2" fill="#2c3e50" />

      {/* Seat — horizontal rectangle */}
      <rect x="4" y="28" width="28" height="7" rx="2" fill="#2c3e50" />

      {/* Front leg */}
      <rect x="26" y="35" width="6" height="16" rx="2" fill="#2c3e50" />

      {/* Back leg (short, behind seat) */}
      <rect x="4" y="32" width="5" height="19" rx="2" fill="#2c3e50" />

      {/* ── Bar chart bars (bottom, 3 bars) ──────────────────────────── */}
      {/* Bar 1 — short */}
      <rect x="5"  y="55" width="7" height="10" rx="1.5" fill="#1a56db" />
      {/* Bar 2 — tall */}
      <rect x="15" y="48" width="7" height="17" rx="1.5" fill="#1a56db" />
      {/* Bar 3 — medium */}
      <rect x="25" y="51" width="7" height="14" rx="1.5" fill="#1a56db" />

      {/* ── Divider line between icon and text ───────────────────────── */}
      <line x1="48" y1="6" x2="48" y2="66" stroke="#d1d5db" strokeWidth="1.5" />

      {/* ── Text block ───────────────────────────────────────────────── */}

      {/* "Urban Furniture" — bold, dark */}
      <text
        x="58"
        y="32"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="16"
        fontWeight="700"
        fill="#1e293b"
        letterSpacing="0.3"
      >
        Urban Furniture
      </text>

      {/* "Accounting System" — lighter, smaller caps */}
      <text
        x="59"
        y="50"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="10.5"
        fontWeight="400"
        fill="#64748b"
        letterSpacing="1.2"
      >
        ACCOUNTING SYSTEM
      </text>
    </svg>
  );
}
