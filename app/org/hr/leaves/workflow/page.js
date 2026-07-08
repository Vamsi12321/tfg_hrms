"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Edit, Plus, Trash2, CheckCircle2, AlertCircle, X,
  Users, Shield, Settings2, Zap, ArrowRight, Workflow
} from "lucide-react";
import { getLeaveWorkflow, createLeaveWorkflow, updateLeaveWorkflow } from "@/lib/api";

const approverConfig = {
  reporting_manager: { label: "Reporting Manager", icon: Users, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200/50", pill: "bg-blue-100 text-blue-700" },
  hr_admin:          { label: "HR Admin",           icon: Shield, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200/50", pill: "bg-purple-100 text-purple-700" },
  org_admin:         { label: "Org Admin",          icon: Settings2, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200/50", pill: "bg-amber-100 text-amber-700" },
};

export default function WorkflowPage() {
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    name: "",
    levels: [{ level: 1, approver_type: "reporting_manager", can_skip: true }],
    auto_approval: { enabled: false, max_days: 0, leave_types: null }
  });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const fetchWorkflow = async () => {
    setLoading(true);
    const res = await getLeaveWorkflow();
    if (res.ok && res.data) setWorkflow(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchWorkflow(); }, []);

  const openEdit = () => {
    setForm(workflow
      ? { name: workflow.name || "", levels: workflow.levels || [{ level: 1, approver_type: "reporting_manager", can_skip: true }], auto_approval: workflow.auto_approval || { enabled: false, max_days: 0, leave_types: null } }
      : { name: "", levels: [{ level: 1, approver_type: "reporting_manager", can_skip: true }], auto_approval: { enabled: false, max_days: 0, leave_types: null } });
    setShowForm(true);
  };

  const addLevel = () => setForm(f => ({ ...f, levels: [...f.levels, { level: f.levels.length + 1, approver_type: "hr_admin", can_skip: false }] }));
  const removeLevel = (i) => setForm(f => ({ ...f, levels: f.levels.filter((_, idx) => idx !== i) }));
  const updateLevel = (i, key, val) => setForm(f => ({ ...f, levels: f.levels.map((l, idx) => idx === i ? { ...l, [key]: val } : l) }));

  const handleSave = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { ...form, levels: form.levels.map((l, i) => ({ ...l, level: i + 1 })) };
    const res = workflow?.id ? await updateLeaveWorkflow(workflow.id, payload) : await createLeaveWorkflow(payload);
    if (res.ok) { showToast(workflow?.id ? "Workflow updated" : "Workflow created"); setShowForm(false); fetchWorkflow(); }
    else showToast(res.data?.detail || "Failed", "error");
    setFormLoading(false);
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Approval Workflow</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Configure leave approval levels and auto-approval rules</p>
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openEdit}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-brand-500/25 transition-shadow">
          <Edit className="w-3.5 h-3.5" /> {workflow ? "Edit Workflow" : "Create Workflow"}
        </motion.button>
      </div>

      {loading ? (
        <div className="p-16 flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium">Loading workflow…</p>
        </div>
      ) : !workflow ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-4">
            <Workflow className="w-7 h-7 text-slate-300" />
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-1">No workflow configured yet</p>
          <p className="text-xs text-slate-400">Default: Employee → HR Admin</p>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={openEdit}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md">
            <Plus className="w-3.5 h-3.5" /> Create Workflow
          </motion.button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Workflow header card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                  <Workflow className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{workflow.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{(workflow.levels || []).length} approval level{workflow.levels?.length !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${workflow.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" : "bg-slate-100 text-slate-400 border-slate-200/50"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${workflow.is_active ? "bg-emerald-500" : "bg-slate-400"}`} />
                {workflow.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Visual flow */}
            <div className="px-6 py-6">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Employee bubble */}
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/50 flex items-center justify-center shadow-sm">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Employee</span>
                </div>

                {(workflow.levels || []).map((lvl, i) => {
                  const cfg = approverConfig[lvl.approver_type] || approverConfig.hr_admin;
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <ArrowRight className="w-5 h-5 text-slate-300" />
                        {lvl.can_skip && <span className="text-[8px] text-slate-400 -ml-1">skip?</span>}
                      </div>
                      <div className="flex flex-col items-center gap-1.5">
                        <div className={`w-12 h-12 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center shadow-sm`}>
                          <Icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${cfg.pill}`}>L{i + 1}</span>
                        <span className="text-[9px] text-slate-500 text-center max-w-[80px] leading-tight">{cfg.label}</span>
                      </div>
                    </div>
                  );
                })}

                {/* Approved bubble */}
                <div className="flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-slate-300" />
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/50 flex items-center justify-center shadow-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600">Approved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-approval banner */}
            {workflow.auto_approval?.enabled && (
              <div className="mx-6 mb-5 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/50 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200/50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-800">Auto-Approval Enabled</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    Leaves ≤ {workflow.auto_approval.max_days} day{workflow.auto_approval.max_days !== 1 ? "s" : ""} are auto-approved
                    {workflow.auto_approval.leave_types && ` • Types: ${workflow.auto_approval.leave_types.join(", ")}`}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
                    <Workflow className="w-4 h-4 text-brand-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{workflow ? "Edit" : "Create"} Workflow</h3>
                </div>
                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5">
                <form onSubmit={handleSave} className="space-y-5" id="workflow-form">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Workflow Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                      placeholder="Standard Leave Approval" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Approval Levels</p>
                      <button type="button" onClick={addLevel}
                        className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg transition-colors">
                        <Plus className="w-3 h-3" /> Add Level
                      </button>
                    </div>
                    <div className="space-y-2">
                      {form.levels.map((lvl, i) => {
                        const cfg = approverConfig[lvl.approver_type] || approverConfig.hr_admin;
                        return (
                          <div key={i} className={`flex items-center gap-3 p-3.5 rounded-xl border ${cfg.border} ${cfg.bg}/30 transition-all`}>
                            <div className={`w-7 h-7 rounded-lg ${cfg.bg} border ${cfg.border} flex items-center justify-center flex-shrink-0`}>
                              <span className={`text-[10px] font-black ${cfg.color}`}>L{i + 1}</span>
                            </div>
                            <select value={lvl.approver_type} onChange={e => updateLevel(i, "approver_type", e.target.value)}
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none focus:border-brand-400 bg-white cursor-pointer">
                              <option value="reporting_manager">Reporting Manager</option>
                              <option value="hr_admin">HR Admin</option>
                              <option value="org_admin">Org Admin</option>
                            </select>
                            <label className={`flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer px-2.5 py-2 rounded-xl border transition-all ${lvl.can_skip ? "bg-slate-100 border-slate-200 text-slate-600" : "bg-white border-slate-200 text-slate-400"}`}>
                              <input type="checkbox" checked={lvl.can_skip} onChange={e => updateLevel(i, "can_skip", e.target.checked)} className="w-3 h-3 rounded accent-brand-600" />
                              Skippable
                            </label>
                            {form.levels.length > 1 && (
                              <button type="button" onClick={() => removeLevel(i)}
                                className="w-7 h-7 rounded-lg hover:bg-red-50 hover:border-red-200 border border-transparent flex items-center justify-center transition-colors flex-shrink-0">
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Auto-approval */}
                  <div className={`rounded-2xl border transition-all overflow-hidden ${form.auto_approval.enabled ? "bg-emerald-50/60 border-emerald-200/50" : "bg-slate-50/60 border-slate-200/50"}`}>
                    <label className="flex items-center justify-between p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${form.auto_approval.enabled ? "bg-emerald-100 border border-emerald-200/50" : "bg-white border border-slate-200/50"}`}>
                          <Zap className={`w-4 h-4 ${form.auto_approval.enabled ? "text-emerald-600" : "text-slate-400"}`} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800">Enable Auto-Approval</p>
                          <p className="text-[10px] text-slate-400">Short leaves are auto-approved without manual review</p>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full relative transition-all ${form.auto_approval.enabled ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${form.auto_approval.enabled ? "left-4" : "left-0.5"}`} />
                        <input type="checkbox" checked={form.auto_approval.enabled} onChange={e => setForm(f => ({ ...f, auto_approval: { ...f.auto_approval, enabled: e.target.checked } }))} className="sr-only" />
                      </div>
                    </label>
                    <AnimatePresence>
                      {form.auto_approval.enabled && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-4 pb-4">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Max Days for Auto-Approval</label>
                            <input type="number" min="1" value={form.auto_approval.max_days}
                              onChange={e => setForm(f => ({ ...f, auto_approval: { ...f.auto_approval, max_days: parseInt(e.target.value) || 0 } }))}
                              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all" placeholder="1" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">Cancel</button>
                <motion.button type="submit" form="workflow-form" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                    : <><CheckCircle2 className="w-4 h-4" />{workflow ? "Update Workflow" : "Create Workflow"}</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
