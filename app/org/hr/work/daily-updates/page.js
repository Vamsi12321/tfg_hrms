"use client";

import { todayIST } from "@/lib/date";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, AlertCircle, CheckCircle2, Calendar, AlertTriangle, RefreshCw, Users } from "lucide-react";
import { useTeamDailyUpdates } from "@/lib/queries";

export default function TeamDailyUpdatesPage() {
  const [date, setDate] = useState(todayIST());
  const { data: updData, isLoading, refetch } = useTeamDailyUpdates({ date });
  const updates = updData?.updates || [];

  const blockerCount = updates.filter(u => u.blockers && u.blockers.trim().length > 0).length;

  const getInitials = (name = "?") => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const avatarGradients = [
    "from-brand-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-purple-500 to-violet-600",
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Daily Standups</h3>
          <p className="text-sm text-slate-500">{updates.length} update{updates.length !== 1 ? "s" : ""} for {new Date(date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none" />
          </div>
          <button onClick={() => refetch?.()} title="Refresh"
            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors shadow-sm">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Updates Submitted", value: updates.length, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-100/40", dot: "bg-indigo-500" },
          { label: "With Blockers", value: blockerCount, color: "text-rose-700", bg: "bg-rose-50/60", border: "border-rose-100/40", dot: "bg-rose-500" },
          { label: "Clear Updates", value: updates.length - blockerCount, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-100/40", dot: "bg-emerald-500" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
            <div>
              <p className={`text-[10px] font-bold ${k.color.replace('700', '500')} uppercase tracking-wider`}>{k.label}</p>
              <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
            </div>
            <span className={`w-3 h-3 rounded-full ${k.dot}`} />
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : updates.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-600">No updates for this date</p>
          <p className="text-xs text-slate-400 mt-1">Team members haven&apos;t posted their standup yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {updates.map((u, i) => {
            const hasBlocker = u.blockers && u.blockers.trim().length > 0;
            const gradient = avatarGradients[i % avatarGradients.length];
            return (
              <motion.div key={u.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all flex flex-col ${hasBlocker ? "border-amber-200 bg-amber-50/5" : "border-slate-100"}`}>

                {/* Card Header */}
                <div className="flex items-center gap-4 p-5 pb-4 border-b border-slate-50">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-sm`}>
                    {getInitials(u.employee_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{u.employee_name}</h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {u.department && <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{u.department}</span>}
                      {u.project_name && <span className="text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200/50">{u.project_name}</span>}
                      {hasBlocker && <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />Blocker</span>}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4 flex-1">
                  {u.yesterday && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Yesterday</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{u.yesterday}</p>
                      </div>
                    </div>
                  )}
                  {u.today && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider mb-1">Today&apos;s Plan</p>
                        <p className="text-xs text-slate-700 leading-relaxed">{u.today}</p>
                      </div>
                    </div>
                  )}
                  {hasBlocker && (
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Blocker 🚧</p>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">{u.blockers}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
