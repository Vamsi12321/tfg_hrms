"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, TrendingUp, Award, Star, Plus, X, Search,
  ChevronRight, Calendar, Users, BarChart3, CheckCircle2,
  AlertCircle, RefreshCw, Eye, Edit, Trash2, Clock
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  createCycle, updateCycle,
  createOKR, getOKRDetail, updateOKR, deleteOKR,
  submitReview, listEmployees
} from "@/lib/api";
import { useCycles, useOKRs, useReviews, useLeaderboard, usePerformanceAnalytics, useInvalidate } from "@/lib/queries";

export default function PerformancePage() {
  const [tab, setTab] = useState("okrs"); // okrs | cycles | reviews | leaderboard | analytics
  const invalidate = useInvalidate();

  // Cycles
  const { data: cycles = [] } = useCycles();
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [cycleForm, setCycleForm] = useState({ name:"", start_date:"", end_date:"" });

  // Auto-select cycle
  useEffect(() => {
    if (cycles.length > 0 && !selectedCycle) {
      setSelectedCycle(cycles.find(c => c.status === "active") || cycles[0]);
    }
  }, [cycles, selectedCycle]);

  // React Query hooks for data that depends on selectedCycle
  const { data: okrData, isLoading: okrsLoading } = useOKRs({ cycle_id: selectedCycle?.id, limit: 50 });
  const okrs = okrData?.okrs || [];
  const okrTotal = okrData?.total || 0;

  const { data: reviews = [], isLoading: reviewsLoading } = useReviews({ cycle_id: selectedCycle?.id });
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useLeaderboard({ cycle_id: selectedCycle?.id, limit: 10 });
  const { data: analytics, isLoading: analyticsLoading } = usePerformanceAnalytics({ cycle_id: selectedCycle?.id });

  // Determine loading based on active tab
  const loading = tab === "okrs" ? okrsLoading : tab === "reviews" ? reviewsLoading : tab === "leaderboard" ? leaderboardLoading : tab === "analytics" ? analyticsLoading : false;

  // OKRs
  const [showCreateOKR, setShowCreateOKR] = useState(false);
  const [showOKRDetail, setShowOKRDetail] = useState(null);

  // Reviews
  const [showManagerReview, setShowManagerReview] = useState(null);
  const [reviewForm, setReviewForm] = useState({ manager_rating:"", manager_comments:"" });

  // UI
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  // Handlers
  const handleCreateCycle = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await createCycle(cycleForm);
    if (res.ok) {
      showToast(`Cycle "${cycleForm.name}" created`);
      setShowCreateCycle(false);
      setCycleForm({ name:"", start_date:"", end_date:"" });
      invalidate("cycles");
    } else { showToast(res.data?.detail?.[0]?.msg || "Failed", "error"); }
    setFormLoading(false);
  };

  const handleUpdateCycleStatus = async (cycleId, status) => {
    const res = await updateCycle(cycleId, { status });
    if (res.ok) {
      showToast(`Cycle status → ${status}`);
      invalidate("cycles");
    } else { showToast("Failed to update", "error"); }
  };

  const handleManagerReview = async (e) => {
    e.preventDefault();
    if (!showManagerReview) return;
    setFormLoading(true);
    const res = await submitReview({
      cycle_id: selectedCycle.id,
      employee_id: showManagerReview.employee_id,
      manager_rating: parseFloat(reviewForm.manager_rating),
      manager_comments: reviewForm.manager_comments,
    });
    if (res.ok) {
      showToast("Manager review submitted");
      setShowManagerReview(null);
      setReviewForm({ manager_rating:"", manager_comments:"" });
      invalidate("reviews");
    } else { showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed", "error"); }
    setFormLoading(false);
  };

  // Change OKR status (draft → in_progress, in_progress → completed, etc.)
  const handleOKRStatusChange = async (okrId, newStatus) => {
    const res = await updateOKR(okrId, { status: newStatus });
    if (res.ok) {
      showToast(`OKR status → ${newStatus.replace("_", " ")}`);
      invalidate("okrs");
      if (showOKRDetail && showOKRDetail.id === okrId) {
        setShowOKRDetail({ ...showOKRDetail, status: newStatus });
      }
    } else { showToast(res.data?.detail?.[0]?.msg || "Failed to update OKR status", "error"); }
  };

  // Delete OKR (draft only)
  const handleDeleteOKR = async (okrId) => {
    const res = await deleteOKR(okrId);
    if (res.ok) {
      showToast("OKR deleted");
      setShowOKRDetail(null);
      invalidate("okrs");
    } else { showToast(res.data?.detail?.[0]?.msg || "Failed — only draft OKRs can be deleted", "error"); }
  };

  const statusCfg = {
    draft:     { cls:"bg-slate-50 text-slate-600 border-slate-200", label:"Draft" },
    active:    { cls:"bg-green-50 text-green-600 border-green-200", label:"Active" },
    review:    { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"In Review" },
    closed:    { cls:"bg-red-50 text-red-500 border-red-200",       label:"Closed" },
    in_progress:    { cls:"bg-blue-50 text-blue-600 border-blue-200", label:"In Progress" },
    self_reviewed:  { cls:"bg-purple-50 text-purple-600 border-purple-200", label:"Self Reviewed" },
    manager_reviewed:{ cls:"bg-green-50 text-green-600 border-green-200", label:"Manager Reviewed" },
    pending:   { cls:"bg-slate-50 text-slate-500 border-slate-200", label:"Pending" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Performance & OKRs" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Cycle Selector + Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select value={selectedCycle?.id || ""} onChange={e => setSelectedCycle(cycles.find(c=>c.id===e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-brand-400">
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name} ({c.status})</option>)}
              {cycles.length === 0 && <option value="">No cycles — create one</option>}
            </select>
            {selectedCycle && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${(statusCfg[selectedCycle.status] || statusCfg.draft).cls}`}>
                {(statusCfg[selectedCycle.status] || statusCfg.draft).label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowCreateCycle(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Calendar className="w-4 h-4" /> New Cycle
            </motion.button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowCreateOKR(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Plus className="w-4 h-4" /> Assign OKR
            </motion.button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 w-fit shadow-sm">
          {[
            { key:"okrs", label:"OKRs", icon:Target },
            { key:"cycles", label:"Cycles", icon:Calendar },
            { key:"reviews", label:"Reviews", icon:Star },
            { key:"leaderboard", label:"Leaderboard", icon:Award },
            { key:"analytics", label:"Analytics", icon:BarChart3 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  tab===t.key ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* OKRs Tab */}
        {tab === "okrs" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} className="space-y-4">
            {loading ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : okrs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <Target className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No OKRs for this cycle yet</p>
                <button onClick={() => setShowCreateOKR(true)} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Assign OKR to an employee</button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Team OKRs — {selectedCycle?.name}</h3>
                  <span className="text-xs text-slate-400">{okrTotal} total</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {okrs.map((okr, i) => {
                    const sc = statusCfg[okr.status] || statusCfg.draft;
                    return (
                      <motion.div key={okr.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                        className="p-5 hover:bg-brand-50/30 transition-colors cursor-pointer flex items-center gap-4"
                        onClick={async () => { const r = await getOKRDetail(okr.id); if (r.ok) setShowOKRDetail(r.data); }}>
                        <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {(okr.employee_name || "?").split(" ").map(n=>n[0]).join("").slice(0,2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{okr.employee_name}</p>
                          <p className="text-xs text-slate-500">{okr.department} • {okr.objectives_count || 0} objectives</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${(okr.overall_progress||0)>=80?"bg-green-500":(okr.overall_progress||0)>=50?"bg-blue-500":"bg-amber-500"}`}
                              style={{ width:`${okr.overall_progress||0}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-8">{okr.overall_progress||0}%</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Cycles Tab */}
        {tab === "cycles" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cycles.map((cycle, i) => {
                const sc = statusCfg[cycle.status] || statusCfg.draft;
                return (
                  <motion.div key={cycle.id} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-900">{cycle.name}</h4>
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">{cycle.start_date} → {cycle.end_date}</p>
                    <div className="flex gap-2 flex-wrap">
                      {cycle.status === "draft" && (
                        <button onClick={() => handleUpdateCycleStatus(cycle.id, "active")}
                          className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">Activate Cycle</button>
                      )}
                      {cycle.status === "active" && (
                        <button onClick={() => handleUpdateCycleStatus(cycle.id, "review")}
                          className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-100">Move to Review</button>
                      )}
                      {cycle.status === "review" && (
                        <button onClick={() => handleUpdateCycleStatus(cycle.id, "closed")}
                          className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100">Close Cycle</button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Reviews Tab */}
        {tab === "reviews" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {loading ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : reviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <Star className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No reviews submitted for this cycle</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-slate-50/80">
                    {["Employee","Self Rating","Manager Rating","Final","Status","Action"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {reviews.map((rev, i) => {
                      const sc = statusCfg[rev.status] || statusCfg.pending;
                      return (
                        <tr key={rev.id || i} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-5 py-3 text-sm font-semibold text-slate-800">{rev.employee_name}</td>
                          <td className="px-5 py-3 text-xs font-bold text-slate-700">{rev.self_rating || "—"}</td>
                          <td className="px-5 py-3 text-xs font-bold text-slate-700">{rev.manager_rating || "—"}</td>
                          <td className="px-5 py-3 text-sm font-black text-brand-600">{rev.final_rating?.toFixed(2) || "—"}</td>
                          <td className="px-5 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                          <td className="px-5 py-3">
                            {!rev.manager_rating && (
                              <button onClick={() => { setShowManagerReview(rev); setReviewForm({ manager_rating:"", manager_comments:"" }); }}
                                className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100">
                                Give Rating
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* Leaderboard Tab */}
        {tab === "leaderboard" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {loading ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : leaderboard.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <Award className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No leaderboard data yet — complete reviews first</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((emp, i) => (
                  <motion.div key={emp.employee_id || i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${i===0?"bg-amber-400 text-white":i===1?"bg-slate-300 text-white":i===2?"bg-orange-400 text-white":"bg-slate-100 text-slate-500"}`}>
                      {emp.rank || i+1}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {(emp.employee_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{emp.employee_name}</p>
                      <p className="text-xs text-slate-500">{emp.department}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-black text-brand-600">{emp.final_rating?.toFixed(1)}</p>
                      <p className="text-[10px] text-slate-400">OKR: {emp.okr_progress}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Analytics Tab */}
        {tab === "analytics" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {!analytics ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : (
              <div className="space-y-6">
                <div className="grid sm:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-brand-600">{analytics.avg_rating?.toFixed(1) || "—"}</p>
                    <p className="text-xs text-slate-500">Avg Rating</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-green-600">{analytics.distribution?.exceeds || 0}</p>
                    <p className="text-xs text-slate-500">Exceeds (≥4.5)</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-blue-600">{analytics.distribution?.meets || 0}</p>
                    <p className="text-xs text-slate-500">Meets (3-4.49)</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-red-500">{analytics.distribution?.below || 0}</p>
                    <p className="text-xs text-slate-500">Below (&lt;3)</p>
                  </div>
                </div>
                {analytics.department_avg && (
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Department Averages</h3>
                    <div className="space-y-3">
                      {Object.entries(analytics.department_avg).map(([dept, avg]) => (
                        <div key={dept} className="flex items-center gap-3">
                          <span className="text-xs text-slate-600 w-28">{dept}</span>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${avg>=4.5?"bg-green-500":avg>=3?"bg-blue-500":"bg-red-400"}`}
                              style={{ width:`${(avg/5)*100}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-700 w-8">{avg.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Create Cycle Modal ── */}
      <AnimatePresence>
        {showCreateCycle && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateCycle(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Create Review Cycle</h3>
                <button onClick={() => setShowCreateCycle(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleCreateCycle} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Cycle Name *</label>
                  <input value={cycleForm.name} onChange={e=>setCycleForm(f=>({...f,name:e.target.value}))} required placeholder="Q2 2025"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Start Date *</label>
                    <input type="date" value={cycleForm.start_date} onChange={e=>setCycleForm(f=>({...f,start_date:e.target.value}))} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">End Date *</label>
                    <input type="date" value={cycleForm.end_date} onChange={e=>setCycleForm(f=>({...f,end_date:e.target.value}))} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Creating..." : "Create Cycle"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Create OKR Modal ── */}
      <AnimatePresence>
        {showCreateOKR && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateOKR(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Assign OKR</h3>
                <button onClick={() => setShowCreateOKR(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Create objectives with measurable key results for an employee in the current cycle.</p>
              <OKRForm
                cycleId={selectedCycle?.id}
                onSuccess={() => { setShowCreateOKR(false); invalidate("okrs"); showToast("OKR assigned!"); }}
                onError={(msg) => showToast(msg, "error")}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── OKR Detail Modal ── */}
      <AnimatePresence>
        {showOKRDetail && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowOKRDetail(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{showOKRDetail.employee_name}</h3>
                  <p className="text-xs text-slate-500">{showOKRDetail.department} • Progress: {showOKRDetail.overall_progress}%</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${(statusCfg[showOKRDetail.status] || statusCfg.draft).cls}`}>
                    {(statusCfg[showOKRDetail.status] || statusCfg.draft).label}
                  </span>
                  <button onClick={() => setShowOKRDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* OKR Actions: Status management */}
              <div className="px-5 pt-4 flex flex-wrap gap-2">
                {showOKRDetail.status === "draft" && (
                  <>
                    <button onClick={() => handleOKRStatusChange(showOKRDetail.id, "in_progress")}
                      className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                      Activate (In Progress)
                    </button>
                    <button onClick={() => handleDeleteOKR(showOKRDetail.id)}
                      className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100">
                      Delete OKR
                    </button>
                  </>
                )}
                {showOKRDetail.status === "in_progress" && (
                  <button onClick={() => handleOKRStatusChange(showOKRDetail.id, "completed")}
                    className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">
                    Mark Completed
                  </button>
                )}
                <button onClick={() => { setShowManagerReview({ employee_id: showOKRDetail.employee_id, employee_name: showOKRDetail.employee_name }); setReviewForm({ manager_rating:"", manager_comments:"" }); }}
                  className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100">
                  Give Manager Rating
                </button>
              </div>

              <div className="p-5 space-y-4">
                {(showOKRDetail.objectives || []).map((obj, i) => (
                  <div key={obj.id || i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-slate-800">{obj.title}</h4>
                      <span className="text-xs font-bold text-slate-500">Weight: {obj.weight}%</span>
                    </div>
                    {obj.description && <p className="text-xs text-slate-500 mb-3">{obj.description}</p>}
                    <div className="space-y-2">
                      {(obj.key_results || []).map((kr, j) => (
                        <div key={kr.id || j} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs text-slate-700">{kr.title}</span>
                              <span className="text-[10px] font-bold text-slate-500">{kr.current || 0}/{kr.target} {kr.unit}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${(kr.progress||0)>=80?"bg-green-500":(kr.progress||0)>=50?"bg-blue-500":"bg-amber-500"}`}
                                style={{ width:`${kr.progress||0}%` }} />
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-8">{kr.progress||0}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Manager Review Modal ── */}
      <AnimatePresence>
        {showManagerReview && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowManagerReview(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Manager Review</h3>
                <button onClick={() => setShowManagerReview(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Rating <strong>{showManagerReview.employee_name}</strong></p>
              <form onSubmit={handleManagerReview} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Rating (1-5) *</label>
                  <input type="number" min="1" max="5" step="0.5" value={reviewForm.manager_rating}
                    onChange={e=>setReviewForm(f=>({...f,manager_rating:e.target.value}))} required placeholder="4.5"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Comments</label>
                  <textarea rows={3} value={reviewForm.manager_comments}
                    onChange={e=>setReviewForm(f=>({...f,manager_comments:e.target.value}))} placeholder="Strengths, areas for improvement..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Submitting..." : "Submit Rating"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// OKR Creation Form Component
function OKRForm({ cycleId, onSuccess, onError }) {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [objectives, setObjectives] = useState([
    { title:"", description:"", weight:100, key_results:[{ title:"", target:"", unit:"" }] }
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEmps, setLoadingEmps] = useState(true);

  // Fetch employees on mount
  useEffect(() => {
    async function fetchEmps() {
      const res = await listEmployees({ limit: 100 });
      if (res.ok && res.data) setEmployees(res.data.employees || []);
      setLoadingEmps(false);
    }
    fetchEmps();
  }, []);

  const addObjective = () => setObjectives([...objectives, { title:"", description:"", weight:0, key_results:[{ title:"", target:"", unit:"" }] }]);
  const addKR = (oi) => {
    const n = [...objectives]; n[oi].key_results.push({ title:"", target:"", unit:"" }); setObjectives(n);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      cycle_id: cycleId,
      employee_id: employeeId,
      objectives: objectives.map(o => ({
        title: o.title,
        description: o.description,
        weight: parseInt(o.weight) || 0,
        key_results: o.key_results.filter(kr=>kr.title).map(kr => ({
          title: kr.title,
          target: parseFloat(kr.target) || 0,
          unit: kr.unit,
        })),
      })),
    };
    const res = await createOKR(payload);
    if (res.ok) { onSuccess(); }
    else { onError(res.data?.detail?.[0]?.msg || "Failed to create OKR"); }
    setSubmitting(false);
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select Employee *</label>
        {loadingEmps ? (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-400">
            <div className="w-3 h-3 border border-brand-400 border-t-brand-600 rounded-full animate-spin" /> Loading employees...
          </div>
        ) : (
          <select value={employeeId} onChange={e=>setEmployeeId(e.target.value)} required className={inputCls}>
            <option value="">Choose employee...</option>
            {employees.map(emp => (
              <option key={emp.id || emp._id} value={emp.id || emp._id}>
                {emp.first_name} {emp.last_name} — {emp.department} ({emp.designation})
              </option>
            ))}
          </select>
        )}
      </div>

      {objectives.map((obj, oi) => (
        <div key={oi} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Objective {oi+1}</span>
            {oi > 0 && <button type="button" onClick={()=>setObjectives(objectives.filter((_,j)=>j!==oi))} className="text-[10px] text-red-500 hover:underline">Remove</button>}
          </div>
          <input placeholder="Objective title" value={obj.title} onChange={e=>{const n=[...objectives];n[oi].title=e.target.value;setObjectives(n);}} className={inputCls} required />
          <input placeholder="Description (optional)" value={obj.description} onChange={e=>{const n=[...objectives];n[oi].description=e.target.value;setObjectives(n);}} className={inputCls} />
          <input type="number" placeholder="Weight %" value={obj.weight} onChange={e=>{const n=[...objectives];n[oi].weight=e.target.value;setObjectives(n);}} className={inputCls} min="0" max="100" />

          <p className="text-[10px] font-bold text-slate-400 uppercase pt-2">Key Results</p>
          {obj.key_results.map((kr, ki) => (
            <div key={ki} className="grid grid-cols-3 gap-2">
              <input placeholder="KR title" value={kr.title} onChange={e=>{const n=[...objectives];n[oi].key_results[ki].title=e.target.value;setObjectives(n);}}
                className="col-span-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-400" />
              <input type="number" placeholder="Target" value={kr.target} onChange={e=>{const n=[...objectives];n[oi].key_results[ki].target=e.target.value;setObjectives(n);}}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-400" />
              <input placeholder="Unit" value={kr.unit} onChange={e=>{const n=[...objectives];n[oi].key_results[ki].unit=e.target.value;setObjectives(n);}}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-400" />
            </div>
          ))}
          <button type="button" onClick={()=>addKR(oi)} className="text-[10px] font-bold text-brand-600 hover:underline">+ Add Key Result</button>
        </div>
      ))}

      <button type="button" onClick={addObjective} className="text-xs font-bold text-brand-600 border border-brand-200 bg-brand-50 px-4 py-2 rounded-xl hover:bg-brand-100">+ Add Objective</button>

      <motion.button type="submit" disabled={submitting} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
        className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
        {submitting ? "Creating..." : "Assign OKR"}
      </motion.button>
    </form>
  );
}
