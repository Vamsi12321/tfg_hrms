"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarCheck, Clock, Wallet,
  Target, Brain, FileText, Megaphone, Settings,
  ChevronLeft, ChevronRight, ShieldCheck, Heart,
  BarChart3, LogOut, User, Sparkles, Building2,
  ScrollText, CreditCard, CheckCircle2, X, ClipboardList
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sidebarConfig } from "@/lib/auth";
import { useSidebar } from "@/context/SidebarContext";
import { useMyOrganization } from "@/lib/queries";

const iconMap = {
  LayoutDashboard, Users, CalendarCheck, Clock, Wallet,
  Target, Brain, FileText, Megaphone, Settings,
  Heart, BarChart3, User, Sparkles, ShieldCheck,
  Building2, ScrollText, CreditCard, CheckCircle2, ClipboardList,
};

export default memo(function Sidebar() {
  const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const activeUser = user || { role: "employee", name: "Demo User", designation: "Employee", organization_name: null, is_team_lead: false };

  const sidebarRole = pathname.startsWith("/org/employee")
    ? "employee"
    : pathname.startsWith("/superadmin")
      ? "superadmin"
      : activeUser.role;

  const isSuperAdmin = activeUser.role === "superadmin";

  // Fetch org data for profile_image (non-superadmin only)
  const { data: orgData } = useMyOrganization(!isSuperAdmin);
  const orgProfileImage = orgData?.profile_image || null;

  const navItems = useMemo(() => sidebarConfig[sidebarRole] || [], [sidebarRole]);

  const badge = useMemo(() => {
    switch (activeUser.role) {
      case "superadmin": return { label: "Super Admin", bg: "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200", text: "text-amber-700" };
      case "orgadmin":   return { label: "Org Admin",   bg: "bg-indigo-50 border border-indigo-100",  text: "text-indigo-600" };
      case "hr":         return { label: "HR Manager",  bg: "bg-blue-50 border border-blue-100",      text: "text-blue-600" };
      case "employee":   return { label: "Employee",    bg: "bg-green-50 border border-green-100",    text: "text-green-600" };
      default:           return { label: activeUser.role, bg: "bg-slate-50 border border-slate-100",  text: "text-slate-600" };
    }
  }, [activeUser.role]);

  // Close drawer and follow link on mobile
  const handleNavClick = () => { if (mobileOpen) setMobileOpen(false); };

  // ─── Shared sidebar panel ──────────────────────────────────────────────
  const SidebarPanel = ({ showCollapsed }) => (
    <div className="h-full flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100 gap-3">
        {isSuperAdmin ? (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 bg-gradient-to-br from-amber-500 to-orange-600 shadow-amber-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
        ) : orgProfileImage ? (
          <img src={orgProfileImage} alt="Org" className="w-9 h-9 rounded-xl object-cover shadow-md flex-shrink-0 border border-slate-100" />
        ) : (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 bg-gradient-to-br from-brand-600 to-indigo-600 shadow-brand-500/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
        )}
        <AnimatePresence>
          {!showCollapsed && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="leading-tight flex-1 min-w-0">
              {isSuperAdmin ? (
                <>
                  <span className="text-sm font-black text-slate-900">TFG <span className="text-amber-600">HRMS</span></span>
                  <p className="text-[9px] text-slate-400 font-medium">Platform Admin</p>
                </>
              ) : (
                <>
                  <span className="text-sm font-black text-slate-900 truncate block">{activeUser.organization_name || "HRMS"}</span>
                  <p className="text-[9px] text-slate-400 font-medium capitalize">{activeUser.role === "orgadmin" ? "Org Admin" : activeUser.role === "hr" ? "HR Panel" : "Employee Panel"}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden ml-auto w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center flex-shrink-0"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Role badge */}
      {!showCollapsed && (
        <div className="px-4 py-3 border-b border-slate-50">
          <div className={`px-3 py-2 rounded-xl text-center ${badge.bg}`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${badge.text}`}>{badge.label}</p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 hide-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <Link key={item.href} href={item.href} onClick={handleNavClick}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? isSuperAdmin
                        ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-100"
                        : "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? isSuperAdmin ? "bg-amber-100" : "bg-brand-100"
                      : "bg-transparent group-hover:bg-slate-100"
                  }`}>
                    <Icon className={`w-[18px] h-[18px] ${
                      isActive
                        ? isSuperAdmin ? "text-amber-600" : "text-brand-600"
                        : "text-slate-400 group-hover:text-slate-600"
                    }`} />
                  </div>
                  <AnimatePresence>
                    {!showCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className={`text-sm font-semibold whitespace-nowrap ${isActive ? (isSuperAdmin ? "text-amber-700" : "text-brand-700") : ""}`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !showCollapsed && (
                    <motion.div layoutId="activeIndicator" className={`ml-auto w-1.5 h-1.5 rounded-full ${isSuperAdmin ? "bg-amber-500" : "bg-brand-500"}`} />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {!showCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${isSuperAdmin ? "bg-amber-600" : "bg-brand-600"}`}>
              {activeUser.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{activeUser.name}</p>
              <p className="text-[9px] text-slate-400 truncate">
                {activeUser.designation || (activeUser.role === "orgadmin" ? "Org Admin" : activeUser.role === "hr" ? "HR Manager" : activeUser.role === "superadmin" ? "Super Admin" : "Employee")}
                {activeUser.organization_name ? ` · ${activeUser.organization_name}` : ""}
              </p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex flex-1 items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {showCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!showCollapsed && <span className="text-xs font-medium">Collapse</span>}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── DESKTOP sidebar (md and above) ─────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-slate-100 z-40 flex-col shadow-xl shadow-slate-200/50 overflow-hidden"
      >
        <SidebarPanel showCollapsed={collapsed} />
      </motion.aside>

      {/* ── MOBILE drawer (below md) ────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMobileOpen(false)}
            />
            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="md:hidden fixed left-0 top-0 h-screen w-72 bg-white border-r border-slate-100 z-50 flex flex-col shadow-2xl overflow-hidden"
            >
              <SidebarPanel showCollapsed={false} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
});
