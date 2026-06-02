"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarCheck, Clock, Wallet,
  Target, Brain, FileText, Megaphone, Settings,
  ChevronLeft, ChevronRight, ShieldCheck, Heart,
  BarChart3, LogOut, User, Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { sidebarConfig } from "@/lib/auth";

const iconMap = {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Clock,
  Wallet,
  Target,
  Brain,
  FileText,
  Megaphone,
  Settings,
  Heart,
  BarChart3,
  User,
  Sparkles,
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const navItems = sidebarConfig[user.role] || [];

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 h-screen bg-white border-r border-slate-100 z-40 flex flex-col shadow-xl shadow-slate-200/50"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="leading-tight"
            >
              <span className="text-sm font-black text-slate-900">TFG <span className="text-brand-600">HRMS</span></span>
              <p className="text-[9px] text-slate-400 font-medium capitalize">{user.role} Panel</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-50">
          <div className={`px-3 py-2 rounded-xl text-center ${
            user.role === "admin" ? "bg-purple-50 border border-purple-100" :
            user.role === "hr" ? "bg-blue-50 border border-blue-100" :
            "bg-green-50 border border-green-100"
          }`}>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${
              user.role === "admin" ? "text-purple-600" :
              user.role === "hr" ? "text-blue-600" :
              "text-green-600"
            }`}>{user.role === "hr" ? "HR Manager" : user.role === "admin" ? "Super Admin" : "Employee"}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 hide-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = iconMap[item.icon] || LayoutDashboard;
            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isActive ? "bg-brand-100" : "bg-transparent group-hover:bg-slate-100"
                  }`}>
                    <Icon className={`w-[18px] h-[18px] ${isActive ? "text-brand-600" : "text-slate-400 group-hover:text-slate-600"}`} />
                  </div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`text-sm font-semibold whitespace-nowrap ${isActive ? "text-brand-700" : ""}`}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && !collapsed && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500"
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5">
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              {user.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
              <p className="text-[9px] text-slate-400 truncate">{user.designation}</p>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs font-medium">Collapse</span>}
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-xs font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
