"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * TabNav — clean underline-style tabs.
 *
 * Props:
 *   tabs:      Array<{ label, href, icon?, badge? }>
 *   className: extra classes on wrapper
 *   vertical:  render as vertical sidebar nav
 *   amber:     use amber palette (superadmin)
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
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-xs font-bold transition-all duration-150 ${
                isActive
                  ? amber
                    ? "bg-amber-50 text-amber-700 border border-amber-100"
                    : "bg-brand-50 text-brand-700 border border-brand-100"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-transparent"
              }`}
            >
              {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (amber ? "text-amber-600" : "text-brand-600") : "text-slate-400"}`} />}
              <span>{t.label}</span>
              {t.badge > 0 && (
                <span className="ml-auto w-5 h-5 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center flex-shrink-0">
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
    <div className={`flex items-center gap-0 border-b border-slate-200 overflow-x-auto hide-scrollbar ${className}`}>
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 border-b-2 -mb-px ${
              isActive
                ? amber
                  ? "text-amber-700 border-amber-500"
                  : "text-brand-700 border-brand-600"
                : "text-slate-500 border-transparent hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {Icon && (
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (amber ? "text-amber-600" : "text-brand-600") : "text-slate-400"}`} />
            )}
            <span>{t.label}</span>
            {t.badge > 0 && (
              <span className="w-5 h-5 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center flex-shrink-0">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
