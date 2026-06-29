"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Calendar, CheckCircle2, X, AlertCircle, Ban,
  CalendarDays, ChevronLeft, ChevronRight, Clock, Palmtree
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { applyLeave, cancelLeave } from "@/lib/api";
import { useLeaveBalance, useLeaveConfig, useLeaves, useHolidays, useInvalidate } from "@/lib/queries";

export default function MyLeavesPage() {
  const invalidate = useInvalidate();
  const { data: balances = [], isLoading: balLoading } = useLeaveBalance();
  const { data: leaveTypes = [] } = useLeaveConfig();
  const { data: leaves = [] } = useLeaves({ limit: 50 });
  const { data: holidays = [] } = useHolidays({ year: new Date().getFullYear(), limit: 100 });
  const loading = balLoading;

  const [tab, setTab] = useState("overview"); // overview | calendar
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [applyForm, setApplyForm] = useState({
    leave_type_code: "", start_date: "", end_date: "",
    reason: "", is_half_day: false, half_day_type: "first_half"
  });
  const [applyError, setApplyError] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), type === "error" ? 6000 : 4000);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      leave_type_code: applyForm.leave_type_code,
      start_date: applyForm.start_date,
      end_date: applyForm.end_date,
      reason: applyForm.reason,
      is_half_day: applyForm.is_half_day,
    };
    if (applyForm.is_half_day) payload.half_day_type = applyForm.half_day_type;
    const res = await applyLeave(payload);
    if (res.ok) {
      setApplyError("");
      showToast("Leave request submitted!");
      setShowApplyModal(false);
      setApplyForm({ leave_type_code: "", start_date: "", end_date: "", reason: "", is_half_day: false, half_day_type: "first_half" });
      invalidate("leaves"); invalidate("leave-balance");
    } else {
      const errMsg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") :
        "Failed to apply leave";
      setApplyError(errMsg);
    }
    setFormLoading(false);
  };

  const handleCancel = async (leaveId) => {
    const res = await cancelLeave(leaveId);
    if (res.ok) { showToast("Leave cancelled"); invalidate("leaves"); invalidate("leave-balance"); }
    else { showToast(res.data?.detail || "Cannot cancel this leave", "error"); }
  };

  // Helpers
  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingHolidays = holidays.filter(h => h.date >= todayStr).slice(0, 5);
  const pendingCount = leaves.filter(l => l.status === "pending").length;
  const approvedCount = leaves.filter(l => l.status === "approved").length;
  const holidayDates = {};
  holidays.forEach(h => { holidayDates[h.date] = h; });

  if (loading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Leaves" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-start gap-2 max-w-md ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-brand-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-brand-500/20">
            <p className="text-xs text-white/70 font-medium">Total Balance</p>
            <p className="text-3xl font-black mt-1">{balances.reduce((sum, b) => sum + (b.total === -1 ? 0 : b.balance), 0)}</p>
            <p className="text-[10px] text-white/60 mt-1">days available</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Pending</p>
            <p className="text-3xl font-black text-amber-600 mt-1">{pendingCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">awaiting approval</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Approved</p>
            <p className="text-3xl font-black text-green-600 mt-1">{approvedCount}</p>
            <p className="text-[10px] text-slate-400 mt-1">this year</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-xs text-slate-500 font-medium">Holidays</p>
            <p className="text-3xl font-black text-brand-600 mt-1">{holidays.length}</p>
            <p className="text-[10px] text-slate-400 mt-1">this year</p>
          </motion.div>
        </div>

        {/* Tabs + Apply Button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {[
              { key: "overview", label: "Balance & Leaves", icon: Clock },
              { key: "calendar", label: "Holiday Calendar", icon: CalendarDays },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.key ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setShowApplyModal(true); setApplyError(""); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
            <Plus className="w-4 h-4" /> Apply Leave
          </motion.button>
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Two-column: Balance Table + Upcoming Holidays */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Balance — Progress Bar Style */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-5">Leave Balance — {new Date().getFullYear()}</h3>
                <div className="space-y-4">
                  {balances.filter(bal => !bal.not_applicable).map((bal, i) => {
                    const total = bal.total === -1 ? 999 : bal.total;
                    const used = bal.used || 0;
                    const available = bal.total === -1 ? "∞" : bal.balance;
                    const usedPercent = total > 0 ? Math.min((used / total) * 100, 100) : 0;
                    return (
                      <motion.div key={bal.leave_type_code || i} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">{bal.leave_type_code}</span>
                            <span className="text-xs font-semibold text-slate-800">{bal.leave_type_name}</span>
                            {bal.gender_specific && <span className="text-[8px] text-slate-400 italic">({bal.gender_specific} only)</span>}
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400">{used} used</span>
                            <span className="font-black text-green-600">{available}</span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width:0 }}
                            animate={{ width:`${usedPercent}%` }}
                            transition={{ delay:0.3+i*0.05, duration:0.6 }}
                            className={`h-full rounded-full ${usedPercent >= 80 ? "bg-red-400" : usedPercent >= 50 ? "bg-amber-400" : "bg-green-500"}`}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Holidays Sidebar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Upcoming Holidays</h3>
                  <button onClick={() => setTab("calendar")} className="text-[10px] font-bold text-brand-600 hover:underline">View All</button>
                </div>
                <div className="p-3 space-y-2">
                  {upcomingHolidays.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No upcoming holidays</p>
                  ) : upcomingHolidays.map((h, i) => (
                    <motion.div key={h.id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-xl ${h.type === "mandatory" ? "bg-red-50/70" : "bg-blue-50/70"}`}>
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${h.type === "mandatory" ? "bg-red-100" : "bg-blue-100"}`}>
                        <span className={`text-[8px] font-bold leading-none ${h.type === "mandatory" ? "text-red-500" : "text-blue-500"}`}>
                          {new Date(h.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                        </span>
                        <span className={`text-sm font-black leading-tight ${h.type === "mandatory" ? "text-red-700" : "text-blue-700"}`}>
                          {new Date(h.date + "T00:00:00").getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{h.name}</p>
                        <p className="text-[10px] text-slate-500">{new Date(h.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}{h.state ? ` • ${h.state}` : ""}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leave History */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Recent Leave Requests</h3>
              </div>
              {leaves.length === 0 ? (
                <div className="p-10 text-center">
                  <Palmtree className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No leave requests yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {leaves.slice(0, 10).map((leave, i) => {
                    const sc = {
                      approved: { dot: "bg-green-500", text: "text-green-600", bg: "bg-green-50", label: "Approved" },
                      pending: { dot: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50", label: "Pending" },
                      cancelled: { dot: "bg-slate-400", text: "text-slate-500", bg: "bg-slate-50", label: "Cancelled" },
                      rejected: { dot: "bg-red-500", text: "text-red-600", bg: "bg-red-50", label: "Rejected" },
                    }[leave.status] || { dot: "bg-slate-400", text: "text-slate-500", bg: "bg-slate-50", label: leave.status };
                    return (
                      <div key={leave.id || i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-slate-800">{leave.leave_type_name || leave.leave_type_code}</p>
                            {leave.is_half_day && <span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">½ Day</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{leave.start_date} → {leave.end_date} • {leave.days}d{leave.reason ? ` • "${leave.reason}"` : ""}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                        {leave.status === "pending" && (
                          <button onClick={() => handleCancel(leave.id)} title="Cancel"
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0">
                            <Ban className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* CALENDAR TAB */}
        {tab === "calendar" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-5 items-start">
            {/* LEFT — Holiday List (scrollable) */}
            <div className="flex-1 min-w-0">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    Holidays — {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </h3>
                  <span className="text-[10px] text-slate-400">{holidays.filter(h => { const d = new Date(h.date + "T00:00:00"); return d.getMonth() === calMonth && d.getFullYear() === calYear; }).length} holidays</span>
                </div>
                <div className="p-3 space-y-2 max-h-[calc(100vh-260px)] overflow-y-auto">
                  {(() => {
                    const monthHols = holidays.filter(h => {
                      const d = new Date(h.date + "T00:00:00");
                      return d.getMonth() === calMonth && d.getFullYear() === calYear;
                    });
                    if (monthHols.length === 0) return (
                      <div className="py-10 text-center">
                        <CalendarDays className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-xs text-slate-400">No holidays this month</p>
                      </div>
                    );
                    return monthHols.map((h, i) => (
                      <motion.div key={h.id || i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${h.type === "mandatory" ? "bg-red-50/50 border-red-100" : "bg-blue-50/50 border-blue-100"}`}>
                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${h.type === "mandatory" ? "bg-red-100" : "bg-blue-100"}`}>
                          <span className={`text-[8px] font-bold leading-none ${h.type === "mandatory" ? "text-red-500" : "text-blue-500"}`}>
                            {new Date(h.date + "T00:00:00").toLocaleDateString("en-US", { month: "short" }).toUpperCase()}
                          </span>
                          <span className={`text-sm font-black leading-tight ${h.type === "mandatory" ? "text-red-700" : "text-blue-700"}`}>
                            {new Date(h.date + "T00:00:00").getDate()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800">{h.name}</p>
                          <p className="text-[10px] text-slate-500">{new Date(h.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}{h.state ? ` • ${h.state}` : ""}</p>
                        </div>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${h.type === "mandatory" ? "bg-red-200/70 text-red-700" : "bg-blue-200/70 text-blue-700"}`}>
                          {h.type === "mandatory" ? "MAN" : "OPT"}
                        </span>
                      </motion.div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* RIGHT — Compact Calendar (sticky) */}
            <div className="w-64 flex-shrink-0 sticky top-20">
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                    className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center">
                    <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  <span className="text-xs font-bold text-slate-800">
                    {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                    className="w-6 h-6 rounded hover:bg-slate-100 flex items-center justify-center">
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
                <div className="p-2.5">
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="text-center text-[8px] font-bold text-slate-400 py-0.5">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const holiday = holidayDates[dateStr];
                      const isToday = new Date().getFullYear() === calYear && new Date().getMonth() === calMonth && new Date().getDate() === day;
                      const isSunday = new Date(calYear, calMonth, day).getDay() === 0;
                      return (
                        <div key={day} title={holiday?.name || ""}
                          className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-medium
                            ${holiday?.type === "mandatory" ? "bg-red-100 text-red-700 font-bold" : ""}
                            ${holiday?.type === "optional" ? "bg-blue-100 text-blue-700 font-bold" : ""}
                            ${!holiday && isSunday ? "text-slate-400" : ""}
                            ${!holiday && !isSunday ? "text-slate-600" : ""}
                            ${isToday ? "ring-1 ring-brand-500" : ""}
                          `}>
                          {day}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-red-100" />Mandatory</span>
                    <span className="flex items-center gap-1 text-[8px] text-slate-500"><span className="w-2 h-2 rounded-sm bg-blue-100" />Optional</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* Apply Leave Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowApplyModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3>
                <button onClick={() => setShowApplyModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleApply} className="space-y-4">
                {applyError && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-700">{applyError}</p>
                    </div>
                    <button type="button" onClick={() => setApplyError("")} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type *</label>
                  <select value={applyForm.leave_type_code} onChange={e => setApplyForm(f => ({ ...f, leave_type_code: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                    <option value="">Select leave type...</option>
                    {leaveTypes.filter(lt => lt.is_active !== false).map(lt => {
                      const bal = balances.find(b => b.leave_type_code === lt.code);
                      const available = bal ? (bal.total === -1 ? "∞" : bal.balance) : "—";
                      return <option key={lt.code} value={lt.code}>{lt.name} ({lt.code}) — {available} left</option>;
                    })}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From *</label>
                    <input type="date" value={applyForm.start_date} onChange={e => setApplyForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To *</label>
                    <input type="date" value={applyForm.end_date} onChange={e => setApplyForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={applyForm.is_half_day}
                      onChange={e => setApplyForm(f => ({ ...f, is_half_day: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    <span className="text-xs font-medium text-slate-700">Half Day</span>
                  </label>
                  {applyForm.is_half_day && (
                    <select value={applyForm.half_day_type} onChange={e => setApplyForm(f => ({ ...f, half_day_type: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none">
                      <option value="first_half">First Half</option>
                      <option value="second_half">Second Half</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label>
                  <textarea rows={3} value={applyForm.reason} onChange={e => setApplyForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                    placeholder="Enter reason for leave..." required />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Submitting..." : "Submit Request"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
