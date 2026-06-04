"use client";

import { Bell, Search, MessageSquare, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function TopBar({ title }) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 hover:border-brand-300 transition-colors focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"
          />
          <kbd className="hidden lg:inline text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>

        {/* Notifications */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <Bell className="w-4 h-4 text-slate-500" />
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">3</span>
        </motion.button>

        {/* Messages */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <MessageSquare className="w-4 h-4 text-slate-500" />
        </motion.button>

        {/* User */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200 cursor-pointer hover:bg-slate-50 rounded-xl px-3 py-1.5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
            {user.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="hidden md:block leading-tight">
            <p className="text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="text-[10px] text-slate-400">
              {user.role === "superadmin" ? "Super Admin" : user.role === "hr" ? "HR Manager" : user.role === "admin" ? "Admin" : "Employee"}
            </p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </header>
  );
}
