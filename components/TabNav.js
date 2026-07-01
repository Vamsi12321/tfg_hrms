"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * TabNav — renders a tab bar using Next.js Links.
 *
 * Props:
 *   tabs:      Array<{ label, href, icon?, badge? }>
 *   className: extra classes on the wrapper
 *   vertical:  boolean — render as vertical stack (for sidebar-style nav)
 *   amber:     boolean — use amber active colour (superadmin)
 */
export default function TabNav({ tabs, className = "", vertical = false, amber = false }) {
  const pathname = usePathname();

  if (vertical) {
    return (
      <div className={`flex flex-col gap-0.5 ${className}`}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                isActive
                  ? amber
                    ? "bg-amber-50 text-amber-700 border border-amber-100 shadow-sm"
                    : "bg-brand-50 text-brand-700 border border-brand-100 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (amber ? "text-amber-600" : "text-brand-600") : "text-slate-400"}`} />}
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span className="ml-auto w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center flex-shrink-0">
                  {t.badge > 9 ? "9+" : t.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm overflow-x-auto hide-scrollbar ${className}`}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? amber
                  ? "bg-amber-500 text-white shadow-md"
                  : "bg-brand-600 text-white shadow-md"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
            {t.label}
            {t.badge > 0 && (
              <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center flex-shrink-0">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
