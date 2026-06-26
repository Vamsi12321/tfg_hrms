"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Bell, Search, MessageSquare, ChevronDown, LogOut, Key, CheckCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { getUnreadCount, listNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api";

export default function TopBar({ title }) {
  const { user, logout, openChangePassword } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotiOpen, setIsNotiOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notiLoading, setNotiLoading] = useState(false);
  const dropdownRef = useRef(null);
  const notiRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();

  const activeUser = user || { role: "employee", name: "Demo User", email: "demo@example.com", designation: "Employee" };

  const displayRole = pathname.startsWith("/org/employee")
    ? "employee"
    : pathname.startsWith("/superadmin")
      ? "superadmin"
      : activeUser.role;

  // Fetch unread count on mount and every 30s
  const fetchUnread = useCallback(async () => {
    try {
      const res = await getUnreadCount();
      if (res.ok && res.data) {
        setUnreadCount(typeof res.data === "number" ? res.data : res.data.unread_count || 0);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  // Fetch notifications when panel opens
  const openNotifications = async () => {
    setIsNotiOpen(true);
    setIsDropdownOpen(false);
    setNotiLoading(true);
    const res = await listNotifications({ limit: 15 });
    if (res.ok && res.data) {
      setNotifications(res.data.notifications || []);
    }
    setNotiLoading(false);
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notiRef.current && !notiRef.current.contains(event.target)) setIsNotiOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => { await logout(); router.push("/login"); };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "edit_request": return "📝";
      case "leave": return "🌴";
      case "onboarding": return "📋";
      case "performance": return "🎯";
      default: return "🔔";
    }
  };

  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 hover:border-brand-300 transition-colors focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
          <Search className="w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search..."
            className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          <kbd className="hidden lg:inline text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5">⌘K</kbd>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notiRef}>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={openNotifications}
            className="relative w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
            <Bell className="w-4 h-4 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </motion.button>

          {/* Notification Panel */}
          <AnimatePresence>
            {isNotiOpen && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                className="absolute right-0 top-[110%] w-80 bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1">
                        <CheckCheck className="w-3 h-3" /> Mark all read
                      </button>
                    )}
                    <button onClick={() => setIsNotiOpen(false)} className="w-6 h-6 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notiLoading ? (
                    <div className="p-6 flex justify-center">
                      <div className="w-5 h-5 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="p-8 text-center">
                      <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs text-slate-400">No notifications</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {notifications.map((n) => (
                        <div key={n.id}
                          onClick={() => { if (!n.is_read) handleMarkRead(n.id); }}
                          className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors ${!n.is_read ? "bg-brand-50/40 hover:bg-brand-50" : "hover:bg-slate-50"}`}>
                          <span className="text-base flex-shrink-0 mt-0.5">{getCategoryIcon(n.category)}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${!n.is_read ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{n.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                            <p className="text-[9px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                          {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0 mt-1.5" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages */}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors">
          <MessageSquare className="w-4 h-4 text-slate-500" />
        </motion.button>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotiOpen(false); }}
            className="flex items-center gap-2 pl-3 border-l border-slate-200 cursor-pointer hover:bg-slate-50 rounded-xl px-3 py-1.5 transition-colors">
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

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.15 }}
                className="absolute right-0 top-[110%] w-48 bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden z-50 py-1">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-xs font-bold text-slate-800">{activeUser.name}</p>
                  <p className="text-[10px] text-slate-500">{activeUser.email}</p>
                </div>
                <button onClick={() => { setIsDropdownOpen(false); openChangePassword(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-600 hover:text-brand-600 hover:bg-brand-50 transition-colors">
                  <Key className="w-3.5 h-3.5" /> Change Password
                </button>
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
