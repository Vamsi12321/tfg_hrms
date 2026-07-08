"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertCircle, Settings2, Shield, HeartPulse,
  Receipt, Calendar, Lock, RotateCcw, Pencil, IndianRupee,
  ChevronRight, X, Landmark, BarChart2
} from "lucide-react";
import { updatePayrollConfig } from "@/lib/api";
import { usePayrollConfig, useInvalidate } from "@/lib/queries";

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.07 } } };

function StatusBadge({ enabled }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
      enabled !== false
        ? "bg-emerald-50 text-emerald-700 border-emerald-200/50"
        : "bg-slate-100 text-slate-400 border-slate-200/50"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${enabled !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
      {enabled !== false ? "Enabled" : "Disabled"}
    </span>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-bold ${highlight ? "text-amber-600" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

export default function PayrollConfigPage() {
  const { data: config, isLoading } = usePayrollConfig();
  const invalidate = useInvalidate();
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    salary_structure: { basic_percentage: 40, hra_percentage: 25, special_allowance_percentage: 25, other_percentage: 10 },
    pf: { enabled: true, employee_percentage: 12, employer_percentage: 12, pf_applicable_on: "full_basic", pf_wage_ceiling: 15000, employer_pf_included_in_ctc: true },
    esi: { enabled: true, employee_percentage: 0.75, employer_percentage: 3.25, salary_limit: 21000, employer_esi_included_in_ctc: true },
    professional_tax: { enabled: true, state: "Telangana", amount: 200 },
    lop: { calculation: "working_days", deduction_basis: "gross" },
    payroll_schedule: { pay_day: 28, lock_after_processing: true, allow_reprocessing: false },
  });

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };
  const fmt = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;

  useEffect(() => {
    if (config) {
      setConfigForm({
        salary_structure: { basic_percentage: config.salary_structure?.basic_percentage ?? 40, hra_percentage: config.salary_structure?.hra_percentage ?? 25, special_allowance_percentage: config.salary_structure?.special_allowance_percentage ?? 25, other_percentage: config.salary_structure?.other_percentage ?? 10 },
        pf: { ...config.pf },
        esi: { ...config.esi },
        professional_tax: { ...config.professional_tax },
        lop: { ...config.lop },
        payroll_schedule: { ...config.payroll_schedule },
      });
    }
  }, [config]);

  const handleSave = async () => {
    const ss = configForm.salary_structure;
    const sum = (ss.basic_percentage || 0) + (ss.hra_percentage || 0) + (ss.special_allowance_percentage || 0) + (ss.other_percentage || 0);
    if (Math.abs(sum - 100) > 0.01) { showToast(`Salary structure must total 100%. Current: ${sum.toFixed(1)}%`, "error"); return; }
    setFormLoading(true);
    const res = await updatePayrollConfig(configForm);
    if (res.ok) { showToast("Config updated successfully"); setShowEditModal(false); invalidate("payroll-config"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed to save", "error");
    setFormLoading(false);
  };

  if (isLoading) return (
    <div className="p-16 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      <p className="text-xs text-slate-400 font-medium">Loading configuration…</p>
    </div>
  );

  const ss = config?.salary_structure ?? {};
  const pf = config?.pf ?? {};
  const esi = config?.esi ?? {};
  const pt = config?.professional_tax ?? {};
  const lop = config?.lop ?? {};
  const sched = config?.payroll_schedule ?? {};

  // Bar widths for salary structure visual
  const bars = [
    { label: "Basic", value: ss.basic_percentage ?? 0, color: "bg-brand-500" },
    { label: "HRA", value: ss.hra_percentage ?? 0, color: "bg-indigo-400" },
    { label: "Special", value: ss.special_allowance_percentage ?? 0, color: "bg-violet-400" },
    { label: "Other", value: ss.other_percentage ?? 0, color: "bg-slate-300" },
  ];

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

      {/* Page header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payroll Configuration</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage statutory deductions, salary structure and schedules</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition-shadow"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit Configuration
        </motion.button>
      </div>

      {/* Main grid */}
      <motion.div initial="hidden" animate="visible" variants={stagger} className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* === Salary Structure — full width on mobile, 3 cols on lg === */}
        <motion.div variants={fadeUp} className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                <BarChart2 className="w-4.5 h-4.5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Salary Structure</p>
                <p className="text-[10px] text-slate-400 mt-0.5">CTC breakdown percentages</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            {/* Visual bar */}
            <div className="flex h-1.5 rounded-full overflow-hidden mb-5 gap-0.5">
              {bars.map(b => (
                <div key={b.label} style={{ width: `${b.value}%` }} className={`${b.color} transition-all`} title={`${b.label}: ${b.value}%`} />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {bars.map((b, i) => (
                <div key={b.label} className="group">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${b.color}`} />
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{b.label}</span>
                  </div>
                  <p className="text-xl font-black text-slate-900">{b.value}<span className="text-sm text-slate-400 font-bold ml-0.5">%</span></p>
                  <p className="text-[10px] text-slate-400 mt-0.5">of CTC</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* === PF === */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100/50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Provident Fund</p>
                <p className="text-[10px] text-slate-400 mt-0.5">EPF contributions</p>
              </div>
            </div>
            <StatusBadge enabled={pf.enabled} />
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-blue-50/60 rounded-xl p-3 border border-blue-100/40">
                <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider mb-1">Employee</p>
                <p className="text-2xl font-black text-blue-700">{pf.employee_percentage ?? 0}<span className="text-sm font-bold">%</span></p>
              </div>
              <div className="bg-indigo-50/60 rounded-xl p-3 border border-indigo-100/40">
                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider mb-1">Employer</p>
                <p className="text-2xl font-black text-indigo-700">{pf.employer_percentage ?? 0}<span className="text-sm font-bold">%</span></p>
              </div>
            </div>
            <InfoRow label="Applicable On" value={(pf.pf_applicable_on || "—").replace(/_/g, " ")} />
            <InfoRow label="Wage Ceiling" value={fmt(pf.pf_wage_ceiling)} />
            <InfoRow label="Employer PF in CTC" value={pf.employer_pf_included_in_ctc ? "Deducted from gross" : "Paid on top"} highlight={pf.employer_pf_included_in_ctc} />
          </div>
        </motion.div>

        {/* === ESI === */}
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-100/50 flex items-center justify-center">
                <HeartPulse className="w-4 h-4 text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">ESI</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Employee state insurance</p>
              </div>
            </div>
            <StatusBadge enabled={esi.enabled} />
          </div>
          <div className="px-5 py-4">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-rose-50/60 rounded-xl p-3 border border-rose-100/40">
                <p className="text-[9px] font-bold text-rose-500 uppercase tracking-wider mb-1">Employee</p>
                <p className="text-2xl font-black text-rose-700">{esi.employee_percentage ?? 0}<span className="text-sm font-bold">%</span></p>
              </div>
              <div className="bg-pink-50/60 rounded-xl p-3 border border-pink-100/40">
                <p className="text-[9px] font-bold text-pink-500 uppercase tracking-wider mb-1">Employer</p>
                <p className="text-2xl font-black text-pink-700">{esi.employer_percentage ?? 0}<span className="text-sm font-bold">%</span></p>
              </div>
            </div>
            <InfoRow label="Salary Limit" value={fmt(esi.salary_limit)} />
            <InfoRow label="Employer ESI in CTC" value={esi.employer_esi_included_in_ctc ? "Deducted from gross" : "Paid on top"} highlight={esi.employer_esi_included_in_ctc} />
          </div>
        </motion.div>

        {/* === PT + LOP + Schedule (stacked) === */}
        <motion.div variants={fadeUp} className="space-y-5">
          {/* Professional Tax */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100/50 flex items-center justify-center">
                  <Landmark className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Professional Tax</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{pt.state || "—"}</p>
                </div>
              </div>
              <StatusBadge enabled={pt.enabled} />
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-amber-50/60 rounded-xl p-3 border border-amber-100/40 text-center">
                  <p className="text-[9px] font-bold text-amber-500 uppercase tracking-wider mb-0.5">PT Amount</p>
                  <p className="text-xl font-black text-amber-700">{fmt(pt.amount)}</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  <InfoRow label="LOP Basis" value={(lop.calculation || "—").replace(/_/g, " ")} />
                  <InfoRow label="Deduction On" value={lop.deduction_basis || "—"} />
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Schedule */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-slate-50">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Payroll Schedule</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Processing rules</p>
              </div>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between bg-emerald-50/60 rounded-xl px-4 py-3 border border-emerald-100/40">
                <div>
                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">Pay Day</p>
                  <p className="text-xl font-black text-emerald-700 mt-0.5">{sched.pay_day || "—"}<span className="text-xs font-semibold text-emerald-500"> of month</span></p>
                </div>
                <Calendar className="w-6 h-6 text-emerald-300" />
              </div>
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${sched.lock_after_processing ? "bg-amber-50/60 border-amber-200/40" : "bg-slate-50 border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  <Lock className={`w-3.5 h-3.5 ${sched.lock_after_processing ? "text-amber-600" : "text-slate-400"}`} />
                  <span className="text-xs font-semibold text-slate-700">Lock after processing</span>
                </div>
                <span className={`text-[10px] font-bold ${sched.lock_after_processing ? "text-amber-700" : "text-slate-400"}`}>{sched.lock_after_processing ? "Yes" : "No"}</span>
              </div>
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border ${sched.allow_reprocessing ? "bg-brand-50/60 border-brand-200/40" : "bg-slate-50 border-slate-100"}`}>
                <div className="flex items-center gap-2">
                  <RotateCcw className={`w-3.5 h-3.5 ${sched.allow_reprocessing ? "text-brand-600" : "text-slate-400"}`} />
                  <span className="text-xs font-semibold text-slate-700">Allow reprocessing</span>
                </div>
                <span className={`text-[10px] font-bold ${sched.allow_reprocessing ? "text-brand-700" : "text-slate-400"}`}>{sched.allow_reprocessing ? "Yes" : "No"}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Edit Config Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">

              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                    <Settings2 className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit Payroll Configuration</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Manage structure and statutory rules</p>
                  </div>
                </div>
                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                {/* Salary Structure */}
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Salary Structure</p>
                  {(() => {
                    const ss = configForm.salary_structure;
                    const sum = (ss.basic_percentage || 0) + (ss.hra_percentage || 0) + (ss.special_allowance_percentage || 0) + (ss.other_percentage || 0);
                    const ok = Math.abs(sum - 100) < 0.01;
                    return (
                      <div className={`text-[10px] font-semibold mb-3 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 ${ok ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-amber-50 text-amber-700 border border-amber-200/50"}`}>
                        {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        Total: {sum.toFixed(1)}% {ok ? "(Valid)" : "— Must equal 100%"}
                      </div>
                    );
                  })()}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[["Basic %", "basic_percentage"], ["HRA %", "hra_percentage"], ["Special %", "special_allowance_percentage"], ["Other %", "other_percentage"]].map(([l, k]) => (
                      <div key={k}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{l}</label>
                        <input type="number" step="0.1" value={configForm.salary_structure[k] || ""}
                          onChange={e => setConfigForm(f => ({ ...f, salary_structure: { ...f.salary_structure, [k]: parseFloat(e.target.value) || 0 } }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-slate-50 focus:bg-white" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* PF */}
                <div>
                  <div className="flex items-center justify-between mb-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Provident Fund</p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${configForm.pf.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>{configForm.pf.enabled ? "Enabled" : "Disabled"}</span>
                      <div className={`w-11 h-6 rounded-full p-1 transition-colors ${configForm.pf.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${configForm.pf.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={configForm.pf.enabled} onChange={e => setConfigForm(f => ({ ...f, pf: { ...f.pf, enabled: e.target.checked } }))} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[["Employee %", "employee_percentage"], ["Employer %", "employer_percentage"], ["Wage Ceiling (₹)", "pf_wage_ceiling"]].map(([l, k]) => (
                      <div key={k}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{l}</label>
                        <input type="number" step="0.01" value={configForm.pf[k] || ""} disabled={!configForm.pf.enabled}
                          onChange={e => setConfigForm(f => ({ ...f, pf: { ...f.pf, [k]: parseFloat(e.target.value) || 0 } }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all bg-white" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">PF Applicable On</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {[["full_basic", "Full Basic"], ["pf_wage_ceiling", "Wage Ceiling (₹15k)"]].map(([v, l]) => (
                        <label key={v} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${configForm.pf.pf_applicable_on === v ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"} ${!configForm.pf.enabled ? "opacity-50 pointer-events-none" : ""}`}>
                          <input type="radio" className="hidden" name="pf_on" value={v} checked={configForm.pf.pf_applicable_on === v} disabled={!configForm.pf.enabled} onChange={() => setConfigForm(f => ({ ...f, pf: { ...f.pf, pf_applicable_on: v } }))} />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Employer PF included in CTC?</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {[[true, "Yes (Deducted from gross)"], [false, "No (Paid on top)"]].map(([v, l]) => (
                        <label key={String(v)} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${configForm.pf.employer_pf_included_in_ctc === v ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"} ${!configForm.pf.enabled ? "opacity-50 pointer-events-none" : ""}`}>
                          <input type="radio" className="hidden" name="pf_ctc" value={String(v)} checked={configForm.pf.employer_pf_included_in_ctc === v} disabled={!configForm.pf.enabled} onChange={() => setConfigForm(f => ({ ...f, pf: { ...f.pf, employer_pf_included_in_ctc: v } }))} />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ESI */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Employee State Insurance (ESI)</p>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${configForm.esi.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>{configForm.esi.enabled ? "Enabled" : "Disabled"}</span>
                      <div className={`w-11 h-6 rounded-full p-1 transition-colors ${configForm.esi.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${configForm.esi.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      <input type="checkbox" className="hidden" checked={configForm.esi.enabled} onChange={e => setConfigForm(f => ({ ...f, esi: { ...f.esi, enabled: e.target.checked } }))} />
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[["Employee %", "employee_percentage"], ["Employer %", "employer_percentage"], ["Salary Limit (₹)", "salary_limit"]].map(([l, k]) => (
                      <div key={k}>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">{l}</label>
                        <input type="number" step="0.01" value={configForm.esi[k] || ""} disabled={!configForm.esi.enabled}
                          onChange={e => setConfigForm(f => ({ ...f, esi: { ...f.esi, [k]: parseFloat(e.target.value) || 0 } }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed transition-all bg-white" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Employer ESI included in CTC?</label>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      {[[true, "Yes (Deducted from gross)"], [false, "No (Paid on top)"]].map(([v, l]) => (
                        <label key={String(v)} className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${configForm.esi.employer_esi_included_in_ctc === v ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"} ${!configForm.esi.enabled ? "opacity-50 pointer-events-none" : ""}`}>
                          <input type="radio" className="hidden" name="esi_ctc" value={String(v)} checked={configForm.esi.employer_esi_included_in_ctc === v} disabled={!configForm.esi.enabled} onChange={() => setConfigForm(f => ({ ...f, esi: { ...f.esi, employer_esi_included_in_ctc: v } }))} />
                          {l}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* PT + LOP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Professional Tax</p>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-9 h-5 rounded-full p-1 transition-colors ${configForm.professional_tax.enabled ? 'bg-amber-500' : 'bg-slate-300'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${configForm.professional_tax.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={!!configForm.professional_tax.enabled} onChange={e => setConfigForm(f => ({ ...f, professional_tax: { ...f.professional_tax, enabled: e.target.checked } }))} />
                      </label>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Amount (₹)</label>
                        <input type="number" value={configForm.professional_tax.amount || ""} disabled={!configForm.professional_tax.enabled}
                          onChange={e => setConfigForm(f => ({ ...f, professional_tax: { ...f.professional_tax, amount: parseFloat(e.target.value) || 0 } }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-400 transition-all bg-white" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">State</label>
                        <input value={configForm.professional_tax.state || ""} disabled={!configForm.professional_tax.enabled}
                          onChange={e => setConfigForm(f => ({ ...f, professional_tax: { ...f.professional_tax, state: e.target.value } }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 disabled:bg-slate-100 disabled:text-slate-400 transition-all bg-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Loss of Pay (LOP)</p>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Calculation</label>
                        <select value={configForm.lop.calculation || "working_days"} onChange={e => setConfigForm(f => ({ ...f, lop: { ...f.lop, calculation: e.target.value } }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 transition-all bg-white cursor-pointer">
                          <option value="calendar_days">Calendar Days</option>
                          <option value="working_days">Working Days</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Deduction On</label>
                        <select value={configForm.lop.deduction_basis || "gross"} onChange={e => setConfigForm(f => ({ ...f, lop: { ...f.lop, deduction_basis: e.target.value } }))}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 transition-all bg-white cursor-pointer">
                          <option value="gross">Gross</option>
                          <option value="basic">Basic</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payroll Schedule */}
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Payroll Schedule</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Pay Day (1–31)</label>
                      <input type="number" min="1" max="31" value={configForm.payroll_schedule.pay_day || 28}
                        onChange={e => setConfigForm(f => ({ ...f, payroll_schedule: { ...f.payroll_schedule, pay_day: parseInt(e.target.value) || 28 } }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-emerald-50/30" />
                    </div>
                    <div className="space-y-3 pt-6">
                      <label className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${configForm.payroll_schedule.lock_after_processing ? "border-amber-400 bg-amber-50" : "border-slate-200 hover:bg-slate-50"}`}>
                        <div>
                          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Lock after processing</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Once run, can&apos;t re-run</p>
                        </div>
                        <div className={`w-9 h-5 rounded-full p-1 transition-colors ${configForm.payroll_schedule.lock_after_processing ? 'bg-amber-500' : 'bg-slate-300'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${configForm.payroll_schedule.lock_after_processing ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={!!configForm.payroll_schedule.lock_after_processing}
                          onChange={e => setConfigForm(f => ({ ...f, payroll_schedule: { ...f.payroll_schedule, lock_after_processing: e.target.checked, allow_reprocessing: e.target.checked ? false : f.payroll_schedule.allow_reprocessing } }))} />
                      </label>
                      
                      <label className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer transition-all ${configForm.payroll_schedule.allow_reprocessing ? "border-brand-400 bg-brand-50" : "border-slate-200"} ${configForm.payroll_schedule.lock_after_processing ? "opacity-50 pointer-events-none" : "hover:bg-slate-50"}`}>
                        <div>
                          <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Allow reprocessing</p>
                          <p className="text-[9px] text-slate-500 mt-0.5">Re-run for same month</p>
                        </div>
                        <div className={`w-9 h-5 rounded-full p-1 transition-colors ${configForm.payroll_schedule.allow_reprocessing ? 'bg-brand-500' : 'bg-slate-300'}`}>
                          <div className={`w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${configForm.payroll_schedule.allow_reprocessing ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={!!configForm.payroll_schedule.allow_reprocessing}
                          disabled={configForm.payroll_schedule.lock_after_processing}
                          onChange={e => setConfigForm(f => ({ ...f, payroll_schedule: { ...f.payroll_schedule, allow_reprocessing: e.target.checked } }))} />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3">
                <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleSave} disabled={formLoading}
                  className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</> : <><CheckCircle2 className="w-4 h-4" /> Save Configuration</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
