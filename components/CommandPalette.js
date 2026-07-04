"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sidebarConfig } from "@/lib/auth";

// All navigable pages with search keywords
const ALL_PAGES = [
  // HR pages
  { label: "Dashboard",          href: "/org/hr/dashboard",           keywords: "home overview stats" },
  { label: "User Management",    href: "/org/hr/user-management",     keywords: "admin users roles" },
  { label: "Employees",          href: "/org/hr/employees",           keywords: "staff people team list" },
  { label: "Departments",        href: "/org/hr/departments",         keywords: "teams groups" },
  { label: "Attendance - Daily", href: "/org/hr/attendance/daily",    keywords: "checkin checkout present absent" },
  { label: "Attendance - Summary", href: "/org/hr/attendance/summary", keywords: "monthly report hours" },
  { label: "Attendance - Locations", href: "/org/hr/attendance/locations", keywords: "office gps geofence" },
  { label: "Attendance - Config", href: "/org/hr/attendance/config",  keywords: "policy shift grace" },
  { label: "Leave - Requests",   href: "/org/hr/leaves/requests",     keywords: "apply approve reject pending" },
  { label: "Leave - Types",      href: "/org/hr/leaves/leave-types",  keywords: "casual sick configuration" },
  { label: "Leave - Holidays",   href: "/org/hr/leaves/holidays",     keywords: "calendar festival" },
  { label: "Leave - Workflow",    href: "/org/hr/leaves/workflow",     keywords: "approval levels" },
  { label: "Payroll - Runs",     href: "/org/hr/payroll/runs",        keywords: "process salary month" },
  { label: "Payroll - Payslips", href: "/org/hr/payroll/payslips",    keywords: "salary slip net pay" },
  { label: "Payroll - Config",   href: "/org/hr/payroll/config",      keywords: "pf esi pt structure ctc" },
  { label: "Work - Projects",    href: "/org/hr/work/projects",       keywords: "project team kanban" },
  { label: "Work - Items",       href: "/org/hr/work/work-items",     keywords: "task bug ticket assign" },
  { label: "Work - Timesheets",  href: "/org/hr/work/timesheets",     keywords: "hours log approve" },
  { label: "Work - Daily Updates", href: "/org/hr/work/daily-updates", keywords: "standup blocker" },
  { label: "Documents",          href: "/org/hr/documents/company",   keywords: "policy handbook template" },
  { label: "Announcements",      href: "/org/hr/announcements",       keywords: "notice broadcast" },
  { label: "AI Insights",        href: "/org/hr/ai-insights",         keywords: "analytics predictions" },
  { label: "Talent Finder",      href: "/org/hr/talent",              keywords: "ai resume jd match" },
  { label: "Wellness & Mood",    href: "/org/hr/wellness",            keywords: "mood score wellbeing" },
  { label: "Org Settings",       href: "/org/hr/settings",            keywords: "organization config" },
  // Employee pages
  { label: "My Dashboard",       href: "/org/employee/dashboard",     keywords: "home overview" },
  { label: "Onboarding",         href: "/org/employee/onboarding",    keywords: "setup profile bank" },
  { label: "My Attendance",      href: "/org/employee/attendance",    keywords: "checkin checkout" },
  { label: "My Leaves",          href: "/org/employee/leaves/overview", keywords: "balance apply holiday" },
  { label: "My Payslips",        href: "/org/employee/payslips",      keywords: "salary slip download" },
  { label: "My Work - Tasks",    href: "/org/employee/work/my-tasks", keywords: "assigned todo kanban" },
  { label: "My Work - Timesheets", href: "/org/employee/work/timesheets", keywords: "log hours" },
  { label: "My Work - Updates",  href: "/org/employee/work/daily-updates", keywords: "standup blocker" },
  { label: "My Documents",       href: "/org/employee/documents/requests", keywords: "upload hr request" },
  { label: "My Profile",         href: "/org/employee/profile",       keywords: "personal bank edit" },
  { label: "Announcements",      href: "/org/employee/announcements", keywords: "notice" },
  // Superadmin
  { label: "Organizations",      href: "/superadmin/organizations",   keywords: "tenants companies" },
  { label: "Platform Settings",  href: "/superadmin/settings/platform", keywords: "config smtp security" },
  { label: "Audit Logs",         href: "/superadmin/logs",            keywords: "activity trail" },
  { label: "Billing",            href: "/superadmin/billing",         keywords: "payment plan" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  // Filter pages based on user role
  const role = user?.role || "employee";
  const availablePages = ALL_PAGES.filter(p => {
    if (role === "superadmin") return true;
    if (role === "orgadmin" || role === "hr") return p.href.startsWith("/org/hr") || p.href.startsWith("/org/employee");
    return p.href.startsWith("/org/employee");
  });

  // Search filter
  const filtered = query.trim()
    ? availablePages.filter(p => {
        const q = query.toLowerCase();
        return p.label.toLowerCase().includes(q) || p.keywords.includes(q) || p.href.includes(q);
      })
    : availablePages.slice(0, 8); // Show top 8 when no query

  // Keyboard shortcut ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 100); setQuery(""); setSelectedIdx(0); }
  }, [open]);

  // Arrow key navigation
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, filtered.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && filtered[selectedIdx]) { navigate(filtered[selectedIdx].href); }
  };

  const navigate = (href) => { router.push(href); setOpen(false); };

  // Reset index when query changes
  useEffect(() => { setSelectedIdx(0); }, [query]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 hover:border-brand-300 transition-colors cursor-pointer"
      >
        <Search className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-400 flex-1 text-left">Search...</span>
        <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">⌘K</kbd>
      </button>

      {/* Palette dropdown — anchored from top */}
      <AnimatePresence>
        {open && (
          <>
            {/* Invisible backdrop to close */}
            <div className="fixed inset-0 z-[299]" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.12 }}
              className="fixed top-14 left-1/2 -translate-x-1/2 z-[300] bg-white rounded-2xl shadow-2xl shadow-slate-200/60 w-full max-w-lg overflow-hidden border border-slate-200"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pages, features..."
                  className="flex-1 text-sm text-slate-800 placeholder:text-slate-400 outline-none"
                />
                {query && (
                  <button onClick={() => setQuery("")} className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                )}
                <kbd className="text-[9px] font-mono text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-[320px] overflow-y-auto py-1">
                {filtered.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-slate-400">No results for &ldquo;{query}&rdquo;</p>
                  </div>
                ) : (
                  filtered.map((page, i) => (
                    <button
                      key={page.href}
                      onClick={() => navigate(page.href)}
                      onMouseEnter={() => setSelectedIdx(i)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition-colors ${
                        i === selectedIdx ? "bg-brand-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        i === selectedIdx ? "bg-brand-100" : "bg-slate-100"
                      }`}>
                        <Search className={`w-3 h-3 ${i === selectedIdx ? "text-brand-600" : "text-slate-400"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${i === selectedIdx ? "text-brand-700" : "text-slate-700"}`}>
                          {page.label}
                        </p>
                      </div>
                      {i === selectedIdx && <ArrowRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />}
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-5 py-2 border-t border-slate-100 flex items-center gap-4">
                <span className="text-[9px] text-slate-400">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono mr-1">↑↓</kbd>navigate
                </span>
                <span className="text-[9px] text-slate-400">
                  <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono mr-1">↵</kbd>go
                </span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
