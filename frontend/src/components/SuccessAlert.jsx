import { useEffect } from "react";

/**
 * SuccessAlert — shows a success message that auto-dismisses after `duration` ms.
 * Props:
 *   message  {string}   — the text to show (falsy = nothing rendered)
 *   onClose  {function} — called when the timer fires or the ✕ is clicked
 *   duration {number}   — ms before auto-close, default 3000
 */
export default function SuccessAlert({ message, onClose, duration = 3000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;

  return (
    <div className="alert alert-success">
      {message}
      <button
        onClick={onClose}
        style={{ float: "right", background: "none", border: "none", cursor: "pointer", fontSize: 14 }}
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
