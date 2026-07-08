"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, TrendingUp, TrendingDown, Users, AlertTriangle,
  Plus, X, CheckCircle2, AlertCircle, RefreshCw, Activity,
  Brain, Coffee, Sun
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { createWellnessProgram } from "@/lib/api";
import { useWellnessDashboard, useWellnessAnalytics, useWellnessPrograms, useMoodEntries, useDepartments, useInvalidate } from "@/lib/queries";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function WellnessPage() {
  const { data: dashboard, isLoading: dashLoading } = useWellnessDashboard();
  const { data: analytics } = useWellnessAnalytics();
  const { data: programs = [] } = useWellnessPrograms();
  const invalidate = useInvalidate();
  const loading = dashLoading;

  // Mood entries filters — fire immediately on change
  const [moodDept,  setMoodDept]  = useState("");
  const [moodScore, setMoodScore] = useState("");
  const [moodFrom,  setMoodFrom]  = useState("");
  const [moodTo,    setMoodTo]    = useState("");

  const moodFilters = {
    ...(moodDept  && { department: moodDept  }),
    ...(moodScore && { score:      moodScore }),
    ...(moodFrom  && { from_date:  moodFrom  }),
    ...(moodTo    && { to_date:    moodTo    }),
  };

  const { data: moodData, isLoading: moodLoading } = useMoodEntries(moodFilters);
  const moodEntries = moodData?.entries || [];
  const moodSummary = moodData?.summary || null;

  const { data: departments = [] } = useDepartments();

  const [toast, setToast] = useState(null);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [programForm, setProgramForm] = useState({ name:"", description:"", type:"ongoing" });
  const [formLoading, setFormLoading] = useState(false);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await createWellnessProgram(programForm);
    if (res.ok) { showToast("Program created"); setShowCreateProgram(false); setProgramForm({ name:"", description:"", type:"ongoing" }); invalidate("wellness-programs"); invalidate("wellness-dashboard"); }
    else showToast("Failed", "error");
    setFormLoading(false);
  };

  const moodEmojis = { great:"😊", good:"🙂", okay:"😐", low:"😔", terrible:"😫" };

  if (loading) return <div className="min-h-screen bg-surface-100"><TopBar title="Wellness & Mood" /><div className="p-6 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div></div>;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Wellness & Mood" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Wellness Score Banner */}
        {dashboard && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2"><Heart className="w-5 h-5" /><span className="text-sm font-medium text-emerald-100">Organization Wellness Score</span></div>
                <p className="text-4xl font-black">{dashboard.wellness_score}/100</p>
                <p className="text-sm text-emerald-100 mt-1">Participation: {dashboard.participation_rate}% • {dashboard.total_submissions_today} submissions today</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => { invalidate("wellness-dashboard"); invalidate("wellness-analytics"); invalidate("wellness-programs"); }} className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20"><RefreshCw className="w-4 h-4 text-white" /></button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowCreateProgram(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 border border-white/30 rounded-xl text-sm font-semibold text-white">
                  <Plus className="w-4 h-4" /> New Program
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Row */}
        {dashboard && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(dashboard.mood_distribution || {}).map(([mood, count]) => (
              <motion.div key={mood} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
                <span className="text-2xl">{moodEmojis[mood] || "❓"}</span>
                <p className="text-xl font-black text-slate-900 mt-1">{count}</p>
                <p className="text-[10px] text-slate-400 capitalize">{mood}</p>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly Trend Chart */}
          {dashboard?.weekly_trend && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Weekly Mood Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dashboard.weekly_trend}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94a3b8" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:"#94a3b8" }} domain={[0,5]} />
                  <Tooltip contentStyle={{ borderRadius:12, border:"1px solid #e2e8f0" }} />
                  <Bar dataKey="avg_score" fill="#14b8a6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Department Scores */}
          {dashboard?.department_scores && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Department Wellness</h3>
              <div className="space-y-3">
                {Object.entries(dashboard.department_scores).map(([dept, score]) => (
                  <div key={dept} className="flex items-center gap-3">
                    <span className="text-xs text-slate-600 w-24 truncate">{dept}</span>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${score>=4?"bg-green-500":score>=3?"bg-blue-500":"bg-red-400"}`} style={{ width:`${(score/5)*100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-700 w-8">{score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* At-Risk Employees */}
        {dashboard?.at_risk_employees?.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-sm font-bold text-slate-900">At-Risk Employees</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dashboard.at_risk_employees.map((emp, i) => (
                <div key={i} className="p-4 rounded-xl bg-red-50/50 border border-red-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-lg">😔</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{emp.employee_name}</p>
                    <p className="text-[10px] text-slate-500">{emp.department} • Avg: {emp.avg_score_7d}/5</p>
                    {emp.consecutive_low_days && <p className="text-[10px] text-red-500 font-semibold">{emp.consecutive_low_days} consecutive low days</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics Insights */}
        {analytics && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Mood Insights</h3>
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-xl font-black text-brand-600">{analytics.avg_score?.toFixed(1) || "—"}</p>
                <p className="text-[10px] text-slate-500">Avg Score</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-xl font-black text-green-600 capitalize">{analytics.trend || "—"}</p>
                <p className="text-[10px] text-slate-500">Trend</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-xl">😊</p>
                <p className="text-xs font-bold text-slate-700">{analytics.happiest_day || "—"}</p>
                <p className="text-[10px] text-slate-500">Happiest Day</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 text-center">
                <p className="text-xl">😔</p>
                <p className="text-xs font-bold text-slate-700">{analytics.lowest_day || "—"}</p>
                <p className="text-[10px] text-slate-500">Lowest Day</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Wellness Programs */}
        {programs.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Active Wellness Programs</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {programs.map((prog, i) => (
                <div key={prog.id||i} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                  <h4 className="text-sm font-bold text-slate-800">{prog.name}</h4>
                  {prog.description && <p className="text-xs text-slate-500 mt-0.5">{prog.description}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] text-brand-600 font-bold">{prog.total_participants || 0} enrolled</span>
                    <span className="text-[10px] text-slate-400">{prog.participation || 0}% participation</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Mood Entries Section */}
      <div className="px-6 pb-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

          {/* Header + Filters */}
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Employee Mood Entries</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Filter by department, score, or date range</p>
              </div>
              {(moodDept||moodScore||moodFrom||moodTo) && (
                <button onClick={()=>{setMoodDept("");setMoodScore("");setMoodFrom("");setMoodTo("");}}
                  className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">
                  Clear filters
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Department dropdown — fires immediately */}
              <select value={moodDept} onChange={e=>setMoodDept(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400 min-w-[140px]">
                <option value="">All Departments</option>
                {departments.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
              </select>

              {/* Score — fires immediately */}
              <select value={moodScore} onChange={e=>setMoodScore(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400">
                <option value="">All Moods</option>
                <option value="5">😊 Great</option>
                <option value="4">🙂 Good</option>
                <option value="3">😐 Okay</option>
                <option value="2">😔 Low</option>
                <option value="1">😫 Terrible</option>
              </select>

              {/* Date range — fires on change */}
              <div className="flex items-center gap-1.5">
                <input type="date" value={moodFrom} onChange={e=>setMoodFrom(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-400 bg-white"/>
                <span className="text-slate-300 text-xs">→</span>
                <input type="date" value={moodTo} onChange={e=>setMoodTo(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-400 bg-white"/>
              </div>
            </div>
          </div>

          {/* Summary cards */}
          {moodSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-slate-100 border-b border-slate-100">
              {[
                { label:"Avg Score",     value: moodSummary.avg_score?.toFixed(1)||"—", color:"text-brand-600",  bg:"bg-white" },
                { label:"Total",         value: moodSummary.total_entries||0,           color:"text-slate-800",  bg:"bg-white" },
                { label:"😊 Great",      value: moodSummary.score_distribution?.great||0,    color:"text-green-600",  bg:"bg-white" },
                { label:"🙂 Good",       value: moodSummary.score_distribution?.good||0,     color:"text-blue-600",   bg:"bg-white" },
                { label:"😐 Okay",       value: moodSummary.score_distribution?.okay||0,     color:"text-amber-600",  bg:"bg-white" },
                { label:"😔 Low",        value: moodSummary.score_distribution?.low||0,      color:"text-orange-500", bg:"bg-white" },
                { label:"😫 Terrible",   value: moodSummary.score_distribution?.terrible||0, color:"text-red-500",    bg:"bg-white" },
              ].map(s=>(
                <div key={s.label} className={`${s.bg} px-4 py-3 text-center`}>
                  <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Table / empty state */}
          {moodLoading ? (
            <div className="p-10 flex justify-center"><div className="w-7 h-7 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
          ) : moodEntries.length===0 ? (
            <div className="p-12 text-center">
              <p className="text-2xl mb-2">😶</p>
              <p className="text-sm font-semibold text-slate-400">
                {(moodDept||moodScore||moodFrom||moodTo) ? "No entries match these filters" : "No mood entries yet"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                  {["Employee","Department","Date","Mood","Note"].map(h=>
                    <th key={h} className="text-left text-[10px] font-bold text-white/70 uppercase px-5 py-3 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {moodEntries.map((e,i)=>{
                    const scoreMap = {
                      1:{ label:"😫 Terrible", cls:"text-red-600 bg-red-50 border-red-100"    },
                      2:{ label:"😔 Low",      cls:"text-orange-600 bg-orange-50 border-orange-100" },
                      3:{ label:"😐 Okay",     cls:"text-amber-600 bg-amber-50 border-amber-100"   },
                      4:{ label:"🙂 Good",     cls:"text-blue-600 bg-blue-50 border-blue-100"       },
                      5:{ label:"😊 Great",    cls:"text-green-600 bg-green-50 border-green-100"    },
                    };
                    const sm = scoreMap[e.score] || { label: e.score, cls:"text-slate-600 bg-slate-100 border-slate-200" };
                    const initials = (e.employee_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
                    return (
                      <motion.tr key={i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                        className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center text-[10px] font-bold text-teal-700 flex-shrink-0">{initials}</div>
                            <span className="text-xs font-semibold text-slate-800">{e.employee_name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">{e.department}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{new Date(e.date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sm.cls}`}>{sm.label}</span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 max-w-[220px] truncate" title={e.note||""}>{e.note||<span className="text-slate-300 italic">No note</span>}</td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Program Modal */}
      <AnimatePresence>
        {showCreateProgram && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateProgram(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">New Wellness Program</h3>
                <button onClick={() => setShowCreateProgram(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateProgram} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Program Name *</label>
                  <input value={programForm.name} onChange={e=>setProgramForm(f=>({...f,name:e.target.value}))} required placeholder="Mental Health Support"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={programForm.description} onChange={e=>setProgramForm(f=>({...f,description:e.target.value}))} placeholder="Free counseling sessions..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                  <select value={programForm.type} onChange={e=>setProgramForm(f=>({...f,type:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="ongoing">Ongoing</option><option value="challenge">Challenge</option><option value="event">Event</option>
                  </select></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-70">
                  {formLoading ? "Creating..." : "Create Program"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}