// ── Date utilities ────────────────────────────────────────────────────────
// Backend sends all timestamps in IST. Display as-is, no conversion needed.

/**
 * Get today's date in YYYY-MM-DD format (local/IST)
 */
export function todayIST() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Format a date string to readable format
 * Input: "2026-07-05" or "2026-07-05T09:30:00"
 * Output: "5 Jul 2026"
 */
export function formatDate(dateStr, options = { day: "numeric", month: "short", year: "numeric" }) {
  if (!dateStr) return "—";
  // Parse without timezone shift — treat as local time
  const d = new Date(dateStr.includes("T") ? dateStr : dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", options);
}

/**
 * Format a datetime string to readable format with time
 * Input: "2026-07-05T09:30:00" (already IST from backend)
 * Output: "5 Jul 2026, 9:30 AM"
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

/**
 * Format time only
 * Input: "2026-07-05T09:30:00"
 * Output: "9:30 AM"
 */
export function formatTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

/**
 * Get current month (1-12)
 */
export function currentMonth() {
  return new Date().getMonth() + 1;
}

/**
 * Get current year
 */
export function currentYear() {
  return new Date().getFullYear();
}

/**
 * Time ago (relative)
 * Input: "2026-07-05T09:30:00"
 * Output: "2h ago", "3d ago", "just now"
 */
export function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateStr);
}
