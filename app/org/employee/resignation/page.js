"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserMinus, Clock, CheckCircle2, XCircle, AlertCircle,
  Calendar, Shield, Send, X, FileText, AlertTriangle
} from "lucide-react";
import { submitResignation, getMyExitStatus } from "@/lib/api";
import TopBar from "@/components/TopBar";

const statusCfg = {
  submitted:          { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Submitted", icon: Clock, desc: "Your resignation has been submitted and is pending review." },
  approved:           { cls: "bg-blue-50 text-blue-600 border-blue-200", label: "Approved", icon: CheckCircle2, desc: "Your resignation has been approved. Clearance process will begin." },
  clearance_pending:  { cls: "bg-purple-50 text-purple-600 border-purple-200", label: "Clearance In Progress", icon: Shield, desc: "Department clearances are being processed." },
  clearance_complete: { cls: "bg-indigo-50 text-indigo-600 border-indigo-200", label: "Clearance Done", icon: CheckCircle2, desc: "All departments have cleared you." },
  settled:            { cls: "bg-cyan-50 text-cyan-600 border-cyan-200", label: "Settled", icon: CheckCircle2, desc: "Your final settlement has been processed." },
  completed:          { cls: "bg-green-50 text-green-600 border-green-200", label: "Completed", icon: CheckCircle2, desc: "Your exit process is complete." },
  rejected:           { cls: "bg-red-50 text-red-500 border-red-200", label: "Rejected", icon: XCircle, desc: "Your resignation request was not approved." },
};

const CLEARANCE_DEPTS = ["hr", "finance", "it", "admin", "reporting_manager"];

export default function ResignationPage() {
  const [exitStatus, setExitStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ reason: "", resignation_date: "" });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchStatus = async () => {
    setLoading(true);
    const res = await getMyExitStatus();
    if (res.ok && res.data) {
      // Handle both formats: { exit: {...} } or direct exit object with status field
      if (res.data.exit) setExitStatus(res.data.exit);
      else if (res.data.status && res.data.status !== "no_request") setExitStatus(res.data);
      else setExitStatus(null);
    } else {
      setExitStatus(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reason.trim()) { showToast("Please provide a reason", "error"); return; }
    setSubmitting(true);
    const payload = { reason: form.reason };
    if (form.resignation_date) payload.resignation_date = form.resignation_date;
    const res = await submitResignation(payload);
    if (res.ok) {
      showToast("Resignation submitted successfully");
      setShowForm(false);
      setForm({ reason: "", resignation_date: "" });
      // Set status immediately from response, then refresh from API
      if (res.data && res.data.status) setExitStatus(res.data);
      else if (res.data?.exit) setExitStatus(res.data.exit);
      // Also re-fetch to get full data
      setTimeout(() => fetchStatus(), 500);
    } else {
      showToast(res.data?.detail || "Failed to submit resignation", "error");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Resignation" />
        <div className="p-6 flex justify-center pt-20">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Resignation" />
      <div className="p-4 md:p-6 max-w-3xl space-y-6">
        <AnimatePresence>
          {toast && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
              {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* If exit already exists, show status */}
        {exitStatus ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Status Banner with image */}
            <div className={`relative overflow-hidden rounded-2xl p-6 border ${(statusCfg[exitStatus.status] || statusCfg.submitted).cls}`}>
              <img src="/resignation.png" alt="" className="absolute right-4 top-1/2 -translate-y-1/2 h-[85%] object-contain pointer-events-none opacity-70 hidden md:block mix-blend-multiply" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                  {(() => { const Icon = (statusCfg[exitStatus.status] || statusCfg.submitted).icon; return <Icon className="w-6 h-6" />; })()}
                  <div>
                    <h2 className="text-lg font-bold">{(statusCfg[exitStatus.status] || statusCfg.submitted).label}</h2>
                    <p className="text-xs opacity-80 mt-0.5">{(statusCfg[exitStatus.status] || statusCfg.submitted).desc}</p>
                  </div>
                </div>
                {/* Overall progress bar */}
                {exitStatus.clearance && (() => {
                  const clearedCount = CLEARANCE_DEPTS.filter(d => exitStatus.clearance[d]?.status === "cleared" || exitStatus.clearance[d]?.status === "waived").length;
                  const pct = Math.round((clearedCount / CLEARANCE_DEPTS.length) * 100);
                  return (
                    <div className="flex items-center gap-3 mt-3 max-w-sm">
                      <span className="text-[10px] font-bold">Overall Progress</span>
                      <div className="flex-1 h-2.5 bg-white/40 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-bold">{pct}%</span>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" /> Resignation Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { icon: "📝", label: "Reason", value: exitStatus.reason || "—" },
                  { icon: "📅", label: "Resignation Date", value: exitStatus.resignation_date || "—" },
                  { icon: "📆", label: "Last Working Day", value: exitStatus.last_working_day || "Pending approval" },
                  { icon: "⏱️", label: "Notice Period", value: exitStatus.notice_period_days ? `${exitStatus.notice_period_days} Days` : "Pending" },
                  { icon: "📋", label: "Type", value: exitStatus.type || "Resignation" },
                  { icon: "🔄", label: "Status", value: (statusCfg[exitStatus.status] || statusCfg.submitted).label },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-lg flex-shrink-0">{item.icon}</span>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800 capitalize mt-0.5">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rejection reason */}
              {exitStatus.status === "rejected" && exitStatus.rejection_reason && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Rejection Reason</p>
                  <p className="text-xs text-red-700">{exitStatus.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Clearance Progress — Horizontal Stepper */}
            {exitStatus.clearance && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" /> Clearance Progress
                  </h3>
                  <span className="text-[10px] font-bold text-brand-600">View All Clearances &gt;</span>
                </div>
                {/* Horizontal stepper */}
                <div className="flex items-start justify-between">
                  {CLEARANCE_DEPTS.map((dept, i) => {
                    const c = exitStatus.clearance[dept];
                    const cleared = c?.status === "cleared" || c?.status === "waived";
                    const inProgress = c?.status === "in_progress";
                    const deptLabels = { hr: "HR Department", finance: "Finance Department", it: "IT Department", admin: "Admin Department", reporting_manager: "Asset Clearance" };
                    return (
                      <div key={dept} className="flex flex-col items-center text-center flex-1">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 border-2 ${
                          cleared ? "bg-green-100 border-green-400" : inProgress ? "bg-brand-100 border-brand-400" : "bg-slate-50 border-slate-200"
                        }`}>
                          {cleared ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                           inProgress ? <Clock className="w-5 h-5 text-brand-600" /> :
                           <Clock className="w-5 h-5 text-slate-300" />}
                        </div>
                        <p className="text-[9px] font-bold text-slate-700 leading-tight">{deptLabels[dept] || dept}</p>
                        <p className={`text-[8px] font-bold mt-0.5 capitalize ${cleared ? "text-green-600" : inProgress ? "text-brand-600" : "text-slate-400"}`}>
                          {c?.status || "Pending"}
                        </p>
                        {c?.cleared_at && <p className="text-[7px] text-slate-400 mt-0.5">{new Date(c.cleared_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>}
                        {!cleared && !inProgress && <p className="text-[7px] text-slate-300">Yet to Start</p>}
                      </div>
                    );
                  })}
                </div>
                {/* Info note */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <p className="text-[10px] text-slate-500">Once all clearances are completed, your final settlement will be initiated.</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center"><Send className="w-3.5 h-3.5 text-amber-600" /></div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">Resignation Submitted</p>
                    <p className="text-[10px] text-slate-400">{exitStatus.resignation_date || exitStatus.created_at || "—"}</p>
                  </div>
                </div>
                {exitStatus.status !== "submitted" && exitStatus.status !== "rejected" && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Approved{exitStatus.approved_by_name ? ` by ${exitStatus.approved_by_name}` : " by HR"}</p>
                      <p className="text-[10px] text-slate-400">Last Working Day: {exitStatus.last_working_day || "—"}{exitStatus.approved_at ? ` • ${new Date(exitStatus.approved_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}</p>
                    </div>
                  </div>
                )}
                {exitStatus.status === "completed" && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-800">Exit Completed</p>
                      <p className="text-[10px] text-slate-400">Account will be deactivated</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (

          /* No exit request — show submit form or CTA */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {!showForm ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
                  <UserMinus className="w-8 h-8 text-slate-300" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">No Active Resignation</h2>
                <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
                  You don&apos;t have an active resignation request. If you wish to resign, you can submit your resignation below.
                </p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                  Submit Resignation
                </motion.button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Warning banner */}
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800">Please consider carefully</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">Once submitted, your resignation will be reviewed by HR. This action cannot be undone from your side.</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  <h3 className="text-lg font-bold text-slate-900">Submit Resignation</h3>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason for Resignation *</label>
                    <textarea rows={4} value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                      placeholder="Please share your reason for resigning. This will be shared with your manager and HR."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all" />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Resignation Date (optional)</label>
                    <p className="text-[10px] text-slate-400 mb-1.5">If not provided, today&apos;s date will be used.</p>
                    <input type="date" value={form.resignation_date} onChange={e => setForm(f => ({ ...f, resignation_date: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all" />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForm(false)}
                      className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                      Cancel
                    </button>
                    <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="flex-[2] py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
                      {submitting ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {submitting ? "Submitting..." : "Submit Resignation"}
                    </motion.button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
