"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

/**
 * TabNav — Premium navigation tabs.
 *
 * Props:
 *   tabs:      Array<{ label, href, icon?, badge? }>
 *   className: extra classes on wrapper
 *   vertical:  render as vertical sidebar nav
 *   amber:     use amber palette (superadmin)
 *   variant:   "underline" (default) | "pill" | "vertical"
 */
export default function TabNav({ tabs, className = "", vertical = false, amber = false, variant = "underline" }) {
  const pathname = usePathname();

  // Vertical sidebar style
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
              className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-sm font-semibold transition-all duration-200 group ${
                isActive
                  ? amber ? "text-amber-800" : "text-brand-800"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabVertical"
                  className={`absolute inset-0 rounded-xl ${amber ? "bg-amber-100/60 border border-amber-200/60" : "bg-brand-100/60 border border-brand-200/60"}`}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-3 w-full">
                {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? (amber ? "text-amber-600" : "text-brand-600") : "text-slate-400 group-hover:text-slate-600 transition-colors"}`} />}
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className={`ml-auto min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${isActive ? "bg-red-500 text-white" : "bg-slate-200 text-slate-600"}`}>
                    {t.badge > 9 ? "9+" : t.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  // Pill / segmented control style
  if (variant === "pill") {
    return (
      <div className={`inline-flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-inner ${className}`}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`relative flex items-center gap-2 px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors duration-200 rounded-lg group ${
                isActive ? (amber ? "text-amber-800" : "text-brand-800") : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabPill"
                  className={`absolute inset-0 bg-white rounded-lg shadow-sm border ${amber ? "border-amber-200/40" : "border-slate-200/60"}`}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-1.5">
                {Icon && <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? (amber ? "text-amber-600" : "text-brand-600") : "text-slate-400"}`} />}
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className={`min-w-[16px] h-4 px-1 rounded-full text-[8px] font-bold flex items-center justify-center ${isActive ? "bg-red-500 text-white" : "bg-slate-300 text-slate-600"}`}>
                    {t.badge > 9 ? "9+" : t.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    );
  }

  // === UNDERLINE style (default) — fills full width ===
  return (
    <div className={`flex items-center w-full overflow-x-auto hide-scrollbar ${className}`}>
      <div className="flex items-center gap-0 w-full min-w-max">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = pathname === t.href || pathname.startsWith(t.href + "/");
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`relative flex items-center gap-1.5 px-3 md:px-5 py-3 text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-200 group border-b-2 ${
                isActive
                  ? amber
                    ? "text-amber-700 border-amber-500"
                    : "text-brand-700 border-brand-500"
                  : "text-slate-500 hover:text-slate-800 border-transparent hover:border-slate-200"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabUnderline"
                  className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                  style={{
                    background: amber
                      ? "linear-gradient(90deg, #f59e0b, #d97706)"
                      : "linear-gradient(90deg, #2563eb, #6366f1)"
                  }}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                />
              )}
              {isActive && (
                <motion.div
                  layoutId="activeTabBg"
                  className={`absolute inset-0 ${amber ? "bg-amber-50/60" : "bg-brand-50/60"} rounded-t-lg`}
                  transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
                />
              )}
              <div className="relative z-10 flex items-center gap-2">
                {Icon && (
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${
                    isActive
                      ? amber ? "text-amber-600" : "text-brand-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`} />
                )}
                <span>{t.label}</span>
                {t.badge > 0 && (
                  <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center flex-shrink-0 ${
                    isActive ? "bg-red-500 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {t.badge > 9 ? "9+" : t.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
