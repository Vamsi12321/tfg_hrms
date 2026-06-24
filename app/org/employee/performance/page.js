"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, TrendingUp, Star, CheckCircle2, AlertCircle,
  ChevronRight, X, Save, Award
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { listCycles, listOKRs, getOKRDetail, updateOKR, submitReview, listReviews } from "@/lib/api";

export default function MyPerformancePage() {
  const [cycles, setCycles] = useState([]);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [myOKR, setMyOKR] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showSelfReview, setShowSelfReview] = useState(false);
  const [selfForm, setSelfForm] = useState({
    self_rating: "", self_comments: "",
    competencies: { communication:3, leadership:3, problem_solving:3, teamwork:3, technical:3 }
  });
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  // Load cycles
  useEffect(() => {
    async function fetch() {
      const res = await listCycles();
      if (res.ok && res.data) {
        const list = res.data.cycles || [];
        setCycles(list);
        const active = list.find(c=>c.status==="active" || c.status==="review") || list[0];
        if (active) setSelectedCycle(active);
      }
      setLoading(false);
    }
    fetch();
  }, []);

  // Load my OKR + review when cycle changes
  useEffect(() => {
    if (!selectedCycle) return;
    async function fetch() {
      setLoading(true);
      // Get my OKRs
      const okrRes = await listOKRs({ cycle_id: selectedCycle.id, limit: 1 });
      if (okrRes.ok && okrRes.data?.okrs?.length > 0) {
        const detail = await getOKRDetail(okrRes.data.okrs[0].id);
        if (detail.ok) setMyOKR(detail.data);
      } else { setMyOKR(null); }
      // Get my review
      const revRes = await listReviews({ cycle_id: selectedCycle.id });
      if (revRes.ok && revRes.data?.reviews?.length > 0) setMyReview(revRes.data.reviews[0]);
      else setMyReview(null);
      setLoading(false);
    }
    fetch();
  }, [selectedCycle]);

  // Update KR progress
  const handleUpdateProgress = async (objId, krId, newCurrent) => {
    if (!myOKR) return;
    const payload = {
      objectives: myOKR.objectives.map(o => o.id === objId ? {
        ...o, key_results: o.key_results.map(kr => kr.id === krId ? { ...kr, current: parseFloat(newCurrent) } : kr)
      } : o)
    };
    const res = await updateOKR(myOKR.id, payload);
    if (res.ok && res.data) { setMyOKR(res.data); showToast("Progress updated"); }
    else showToast("Update failed", "error");
  };

  // Submit self-review
  const handleSelfReview = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await submitReview({
      cycle_id: selectedCycle.id,
      self_rating: parseFloat(selfForm.self_rating),
      self_comments: selfForm.self_comments,
      competencies: selfForm.competencies,
    });
    if (res.ok) {
      showToast("Self-review submitted!");
      setShowSelfReview(false);
      setMyReview(res.data);
    } else { showToast(res.data?.detail?.[0]?.msg || "Failed", "error"); }
    setSaving(false);
  };

  if (loading && cycles.length === 0) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Performance" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Cycle selector */}
        <div className="flex items-center justify-between">
          <select value={selectedCycle?.id || ""} onChange={e => setSelectedCycle(cycles.find(c=>c.id===e.target.value))}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-brand-400">
            {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {selectedCycle?.status === "review" && !myReview && (
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowSelfReview(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Star className="w-4 h-4" /> Submit Self-Review
            </motion.button>
          )}
        </div>

        {/* Review Status */}
        {myReview && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-200">Your Performance Rating — {selectedCycle?.name}</p>
                <p className="text-3xl font-black mt-1">{myReview.final_rating?.toFixed(2) || myReview.self_rating || "Pending"}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-blue-200">
                  {myReview.self_rating && <span>Self: {myReview.self_rating}/5</span>}
                  {myReview.manager_rating && <span>Manager: {myReview.manager_rating}/5</span>}
                </div>
              </div>
              <Award className="w-12 h-12 text-white/20" />
            </div>
          </motion.div>
        )}

        {/* My OKRs */}
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
        ) : !myOKR ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Target className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No OKRs assigned for this cycle</p>
            <p className="text-xs text-slate-400 mt-1">Your manager will assign objectives soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress header */}
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-900">Overall OKR Progress</h3>
                <span className={`text-lg font-black ${(myOKR.overall_progress||0)>=80?"text-green-600":(myOKR.overall_progress||0)>=50?"text-brand-600":"text-amber-600"}`}>
                  {myOKR.overall_progress || 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <motion.div animate={{ width:`${myOKR.overall_progress||0}%` }} transition={{ duration:0.8 }}
                  className={`h-full rounded-full ${(myOKR.overall_progress||0)>=80?"bg-green-500":(myOKR.overall_progress||0)>=50?"bg-brand-500":"bg-amber-500"}`} />
              </div>
            </div>

            {/* Objectives */}
            {(myOKR.objectives || []).map((obj, i) => (
              <motion.div key={obj.id || i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.08 }}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{obj.title}</h4>
                    {obj.description && <p className="text-xs text-slate-500 mt-0.5">{obj.description}</p>}
                  </div>
                  <span className="text-xs font-bold text-slate-400">Weight: {obj.weight}%</span>
                </div>
                <div className="space-y-4">
                  {(obj.key_results || []).map((kr, j) => (
                    <div key={kr.id || j} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-700">{kr.title}</span>
                        <span className="text-[10px] text-slate-400">{kr.current || 0} / {kr.target} {kr.unit}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${(kr.progress||0)>=80?"bg-green-500":(kr.progress||0)>=50?"bg-blue-500":"bg-amber-500"}`}
                            style={{ width:`${kr.progress||0}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-600 w-8">{kr.progress||0}%</span>
                      </div>
                      {/* Update input */}
                      {selectedCycle?.status === "active" && (
                        <div className="flex items-center gap-2">
                          <input type="number" defaultValue={kr.current || 0} placeholder="Current"
                            onBlur={e => { if (e.target.value !== String(kr.current||0)) handleUpdateProgress(obj.id, kr.id, e.target.value); }}
                            className="w-24 px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none focus:border-brand-400" />
                          <span className="text-[10px] text-slate-400">Update progress</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Self-Review Modal */}
      <AnimatePresence>
        {showSelfReview && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSelfReview(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Self-Review</h3>
                <button onClick={() => setShowSelfReview(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSelfReview} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Self Rating (1-5) *</label>
                  <input type="number" min="1" max="5" step="0.5" value={selfForm.self_rating}
                    onChange={e=>setSelfForm(f=>({...f,self_rating:e.target.value}))} required placeholder="4.0"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Comments</label>
                  <textarea rows={3} value={selfForm.self_comments}
                    onChange={e=>setSelfForm(f=>({...f,self_comments:e.target.value}))} placeholder="Reflect on your performance this cycle..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-3">Competency Self-Assessment (1-5)</p>
                  <div className="space-y-3">
                    {[
                      { key:"communication", label:"Communication" },
                      { key:"leadership", label:"Leadership" },
                      { key:"problem_solving", label:"Problem Solving" },
                      { key:"teamwork", label:"Teamwork" },
                      { key:"technical", label:"Technical Skills" },
                    ].map(comp => (
                      <div key={comp.key} className="flex items-center justify-between">
                        <span className="text-xs text-slate-700">{comp.label}</span>
                        <input type="number" min="1" max="5" value={selfForm.competencies[comp.key]}
                          onChange={e=>setSelfForm(f=>({...f,competencies:{...f.competencies,[comp.key]:parseInt(e.target.value)||3}}))}
                          className="w-16 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-center outline-none focus:border-brand-400" />
                      </div>
                    ))}
                  </div>
                </div>
                <motion.button type="submit" disabled={saving} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {saving ? "Submitting..." : "Submit Self-Review"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
