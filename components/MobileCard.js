"use client";

/**
 * MobileCard — renders a card layout on mobile, hidden on md+.
 * Use alongside a table that's hidden on mobile (hidden md:block).
 *
 * Usage:
 *   <div className="hidden md:block"><table>...</table></div>
 *   <div className="md:hidden space-y-3">
 *     {items.map(item => <MobileCard key={item.id} fields={[...]} onClick={...} />)}
 *   </div>
 *
 * Props:
 *   fields: Array<{ label: string, value: ReactNode, fullWidth?: boolean }>
 *   onClick?: () => void
 *   status?: { label: string, color: string } — renders a badge top-right
 *   avatar?: ReactNode — left side avatar/icon
 *   title?: string — bold header
 *   subtitle?: string — small text below title
 */
export default function MobileCard({ fields = [], onClick, status, avatar, title, subtitle }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-100 p-4 shadow-sm ${onClick ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
    >
      {/* Header row: avatar + title + status */}
      {(avatar || title || status) && (
        <div className="flex items-start gap-3 mb-3">
          {avatar && <div className="flex-shrink-0">{avatar}</div>}
          <div className="flex-1 min-w-0">
            {title && <p className="text-sm font-bold text-slate-900 truncate">{title}</p>}
            {subtitle && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{subtitle}</p>}
          </div>
          {status && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${status.color}`}>
              {status.label}
            </span>
          )}
        </div>
      )}

      {/* Fields grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {fields.map((f, i) => (
          <div key={i} className={f.fullWidth ? "col-span-2" : ""}>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{f.label}</p>
            <div className="text-xs font-medium text-slate-700 mt-0.5">{f.value || "—"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
