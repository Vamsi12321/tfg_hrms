"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, MessageSquare, ChevronDown, LogOut, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";

export default function TopBar({ title }) {
  const { user, logout, openChangePassword } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  // Fallback demo user for unauthenticated employee demo access
  const activeUser = user || {
    role: "employee",
    name: "Demo User",
    email: "demo@example.com",
    designation: "Employee",
  };

  // Determine active role based on current route section
  const displayRole = pathname.startsWith("/org/employee")
    ? "employee"
    : pathname.startsWith("/superadmin")
      ? "superadmin"
      : activeUser.role;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
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

        {/* User Dropdown Trigger */}
        <div 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 pl-3 border-l border-slate-200 cursor-pointer hover:bg-slate-50 rounded-xl px-3 py-1.5 transition-colors relative"
        >
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold">
            {activeUser.name.split(" ").map(n => n[0]).join("")}
          </div>
          <div className="hidden md:block leading-tight select-none">
            <p className="text-sm font-semibold text-slate-800">{activeUser.name}</p>
            <p className="text-[10px] text-slate-400">
              {displayRole === "superadmin" ? "Super Admin" : displayRole === "hr" ? "HR Manager" : displayRole === "orgadmin" ? "Org Admin" : "Employee"}
            </p>
          </div>
          <motion.div animate={{ rotate: isDropdownOpen ? 180 : 0 }}>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </motion.div>
        </div>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-[110%] w-48 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden z-50 py-1"
            >
              <div className="px-4 py-3 border-b border-slate-50 mb-1">
                <p className="text-xs font-bold text-slate-800">{activeUser.name}</p>
                <p className="text-[10px] text-slate-500">{activeUser.email}</p>
              </div>
              
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  openChangePassword();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors"
              >
                <Key className="w-3.5 h-3.5" /> Change Password
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
