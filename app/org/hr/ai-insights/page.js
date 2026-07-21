"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, AlertTriangle, AlertCircle, Info, Sparkles,
  RefreshCw, Users, Clock, ListTodo, Heart,
  Briefcase, Wallet, Lightbulb, Search, X
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getAIInsights } from "@/lib/api";

const severityCfg = {
  critical: { color: "border-l-red-500", bg: "bg-red-50", badge: "bg-red-100 text-red-700 border-red-200", icon: AlertTriangle, iconColor: "text-red-500", dot: "bg-red-500", label: "Critical" },
  warning:  { color: "border-l-amber-500", bg: "bg-amber-50", badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle, iconColor: "text-amber-500", dot: "bg-amber-500", label: "Warning" },
  info:     { color: "border-l-blue-500", bg: "bg-blue-50", badge: "bg-blue-100 text-blue-700 border-blue-200", icon: Info, iconColor: "text-blue-500", dot: "bg-blue-500", label: "Info" },
  positive: { color: "border-l-emerald-500", bg: "bg-emerald-50", badge: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: Sparkles, iconColor: "text-emerald-500", dot: "bg-emerald-500", label: "Positive" },
};

const categoryCfg = {
  attendance: { icon: Clock, label: "Attendance", color: "bg-green-50 text-green-600 border-green-200" },
  leave:      { icon: Clock, label: "Leave", color: "bg-amber-50 text-amber-600 border-amber-200" },
  work:       { icon: ListTodo, label: "Work", color: "bg-blue-50 text-blue-600 border-blue-200" },
  wellness:   { icon: Heart, label: "Wellness", color: "bg-pink-50 text-pink-600 border-pink-200" },
  onboarding: { icon: Briefcase, label: "Onboarding", color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  payroll:    { icon: Wallet, label: "Payroll", color: "bg-purple-50 text-purple-600 border-purple-200" },
  team:       { icon: Users, label: "Team", color: "bg-teal-50 text-teal-600 border-teal-200" },
};

const CATEGORIES = ["attendance", "leave", "work", "wellness", "onboarding", "payroll", "team"];

export default function AIInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("");
  const [sevFilter, setSevFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchInsights = async () => {
    setLoading(true);
    const params = {};
    if (catFilter) params.category = catFilter;
    if (sevFilter) params.severity = sevFilter;
    const res = await getAIInsights(params);
    if (res.ok && res.data) {
      setInsights(res.data.insights || []);
      setSummary(res.data.summary || null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, [catFilter, sevFilter]);

  // Client-side search filter
  const filtered = useMemo(() => {
    if (!search.trim()) return insights;
    const q = search.toLowerCase();
    return insights.filter(i =>
      (i.title || "").toLowerCase().includes(q) ||
      (i.message || "").toLowerCase().includes(q) ||
      (i.category || "").toLowerCase().includes(q) ||
      (i.suggestion || "").toLowerCase().includes(q)
    );
  }, [insights, search]);

  const totalCount = summary ? (summary.critical + summary.warning + summary.info + summary.positive) : insights.length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="AI Insights" />

      <div className="p-4 md:p-6 space-y-5">
        {/* ─── Hero Banner ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 p-5 md:p-6 text-white shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Brain className="w-8 h-8 text-purple-200" />
              </motion.div>
              <div>
                <h2 className="text-lg md:text-xl font-bold">AI Insights</h2>
                <p className="text-purple-200 text-[11px] mt-0.5">Rules-based intelligence across all modules — {totalCount} insights generated</p>
              </div>
            </div>
            <button onClick={fetchInsights}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* ─── Summary Cards ───────────────────────────────────────── */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: "critical", value: summary.critical, dot: "bg-red-500", color: "text-red-600", bg: "bg-red-50", border: "border-red-100" },
              { key: "warning", value: summary.warning, dot: "bg-amber-500", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
              { key: "info", value: summary.info, dot: "bg-blue-500", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
              { key: "positive", value: summary.positive, dot: "bg-emerald-500", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
            ].map((s, i) => (
              <motion.button key={s.key} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                onClick={() => setSevFilter(sevFilter === s.key ? "" : s.key)}
                className={`p-4 rounded-2xl border text-center transition-all hover:shadow-md ${sevFilter === s.key ? "ring-2 ring-brand-400 shadow-lg scale-[1.02]" : ""} ${s.bg} ${s.border}`}>
                <div className={`w-3 h-3 rounded-full ${s.dot} mx-auto mb-2`} />
                <p className={`text-2xl font-black ${s.color}`}>{s.value || 0}</p>
                <p className="text-[10px] text-slate-500 capitalize font-semibold mt-0.5">{s.key}</p>
              </motion.button>
            ))}
          </div>
        )}

        {/* ─── Search + Category Filters ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search insights by title, message, or category..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200">
                <X className="w-3 h-3 text-slate-500" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => setCatFilter("")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${!catFilter ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              All
            </button>
            {CATEGORIES.map(cat => {
              const cfg = categoryCfg[cat];
              const Icon = cfg?.icon || Brain;
              return (
                <button key={cat} onClick={() => setCatFilter(catFilter === cat ? "" : cat)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border capitalize ${catFilter === cat ? "bg-brand-600 text-white border-brand-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                  <Icon className="w-3 h-3" /> {cfg?.label || cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Results count ───────────────────────────────────────── */}
        {!loading && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{filtered.length}</span> insight{filtered.length !== 1 ? "s" : ""}
              {search && <span className="text-slate-400"> matching "{search}"</span>}
            </p>
            {(catFilter || sevFilter || search) && (
              <button onClick={() => { setCatFilter(""); setSevFilter(""); setSearch(""); }}
                className="text-[10px] font-bold text-brand-600 hover:underline">Clear all filters</button>
            )}
          </div>
        )}

        {/* ─── Insights List ───────────────────────────────────────── */}
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Brain className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">No insights found</p>
            <p className="text-xs text-slate-400 mt-1">Try a different filter or search term</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filtered.map((insight, i) => {
              const sev = severityCfg[insight.severity] || severityCfg.info;
              const cat = categoryCfg[insight.category];
              const SevIcon = sev.icon;

              return (
                <motion.div key={insight.id || i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-l-4 ${sev.color} hover:shadow-md transition-shadow`}>
                  <div className="p-5 md:p-6">
                    {/* Title row */}
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sev.bg}`}>
                        <SevIcon className={`w-5 h-5 ${sev.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {/* Title + badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <h4 className="text-sm md:text-base font-bold text-slate-900">{insight.title}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sev.badge}`}>{sev.label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${cat?.color || "bg-slate-50 text-slate-500 border-slate-200"}`}>
                            {insight.category}
                          </span>
                        </div>

                        {/* Message */}
                        <p className="text-xs md:text-sm text-slate-600 leading-relaxed">{insight.message}</p>

                        {/* Suggestion box */}
                        {insight.suggestion && (
                          <div className="mt-4 flex items-start gap-2.5 px-4 py-3 rounded-xl bg-brand-50/60 border border-brand-100">
                            <Lightbulb className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                            <p className="text-[11px] md:text-xs text-brand-800 leading-relaxed">{insight.suggestion}</p>
                          </div>
                        )}

                        {/* Meta row */}
                        <div className="flex items-center gap-3 mt-4 flex-wrap">
                          {insight.affected_employees && insight.affected_employees.length > 0 && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg">
                              <Users className="w-3 h-3" /> {insight.affected_employees.length} employee{insight.affected_employees.length > 1 ? "s" : ""} affected
                            </span>
                          )}
                          {insight.created_at && (
                            <span className="text-[10px] text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                              {new Date(insight.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {insight.priority && (
                            <span className={`text-[9px] font-bold px-2 py-1 rounded-lg ${
                              insight.priority === "high" ? "bg-red-50 text-red-600 border border-red-200" :
                              insight.priority === "medium" ? "bg-amber-50 text-amber-600 border border-amber-200" :
                              "bg-slate-50 text-slate-500 border border-slate-200"
                            }`}>
                              {insight.priority} priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
