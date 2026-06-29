"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet, Settings, Play, CheckCircle2, AlertCircle, X,
  IndianRupee, Calendar, Users, TrendingUp, Download,
  ChevronRight, RefreshCw, Plus, Edit, Eye
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  updatePayrollConfig, runPayroll, getPayrollRunDetail,
  approvePayrollRun, markPayrollPaid, editPayslip,
  addPayrollAdjustment, getAnnualStatement
} from "@/lib/api";
import { usePayrollConfig, usePayrollRuns, usePayslips, usePayrollSummary, usePayrollAdjustments, useInvalidate, useEmployees, useDepartments } from "@/lib/queries";

export default function HRPayrollPage() {
  const [tab, setTab] = useState("runs");
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Modals
  const [showRunModal, setShowRunModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showRunDetail, setShowRunDetail] = useState(null);
  const [showEditPayslip, setShowEditPayslip] = useState(null);
  const [showPayslipDetail, setShowPayslipDetail] = useState(null);

  // Forms
  const [configForm, setConfigForm] = useState({ pf_percentage:12, esi_employee_percentage:0.75, esi_employer_percentage:3.25, esi_limit:21000, professional_tax:200, pay_day:28, lop_calculation:"calendar_days", basic_percentage:40, hra_percentage:20, special_allowance_percentage:15, lop_deduction_basis:"gross" });
  const [adjForm, setAdjForm] = useState({ employee_id:"", type:"bonus", amount:"", description:"", month: selectedMonth, year: selectedYear });
  const [editForm, setEditForm] = useState({ bonus:0, reimbursements:0, tds:0, other_deductions:0 });

  const invalidate = useInvalidate();
  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  // Data
  const { data: config } = usePayrollConfig();
  const { data: runsData, isLoading: runsLoading } = usePayrollRuns({ year: selectedYear });
  const runs = runsData?.runs || [];
  const { data: payslipsData, isLoading: payslipsLoading } = usePayslips({ month: selectedMonth, year: selectedYear });
  const payslips = payslipsData?.payslips || [];
  const { data: summary } = usePayrollSummary({ month: selectedMonth, year: selectedYear });
  const { data: adjustmentsData } = usePayrollAdjustments({ month: selectedMonth, year: selectedYear });
  const adjustments = adjustmentsData?.adjustments || [];
  const { data: employeeData } = useEmployees({ limit: 100 });
  const employees = employeeData?.employees || [];
  const { data: deptList = [] } = useDepartments();

  const fmt = (v) => `₹${(v||0).toLocaleString("en-IN")}`;

  // Handlers
  const handleRunPayroll = async () => {
    setFormLoading(true);
    const res = await runPayroll({ month: selectedMonth, year: selectedYear });
    if (res.ok) { showToast(`Payroll processed for ${selectedMonth}/${selectedYear}`); setShowRunModal(false); invalidate("payroll-runs"); invalidate("payslips"); }
    else { const msg = typeof res.data?.detail === "string" ? res.data.detail : Array.isArray(res.data?.detail) ? res.data.detail.map(e=>e.msg).join(", ") : "Failed"; showToast(msg, "error"); }
    setFormLoading(false);
  };

  const handleApprove = async (runId) => {
    const res = await approvePayrollRun(runId);
    if (res.ok) { showToast("Payroll approved"); invalidate("payroll-runs"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed", "error");
  };

  const handleMarkPaid = async (runId) => {
    const res = await markPayrollPaid(runId);
    if (res.ok) { showToast("Marked as paid"); invalidate("payroll-runs"); invalidate("payslips"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed", "error");
  };

  const handleSaveConfig = async () => {
    setFormLoading(true);
    const res = await updatePayrollConfig(configForm);
    if (res.ok) { showToast("Config updated"); setShowConfigModal(false); invalidate("payroll-config"); }
    else showToast("Failed", "error");
    setFormLoading(false);
  };

  const handleAddAdjustment = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await addPayrollAdjustment({ ...adjForm, amount: parseFloat(adjForm.amount) });
    if (res.ok) { showToast("Adjustment added"); setShowAdjustmentModal(false); setAdjForm({ employee_id:"", type:"bonus", amount:"", description:"", month:selectedMonth, year:selectedYear }); invalidate("payroll-adjustments"); }
    else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed", "error");
    setFormLoading(false);
  };

  const handleEditPayslip = async (e) => {
    e.preventDefault();
    if (!showEditPayslip) return;
    setFormLoading(true);
    const res = await editPayslip(showEditPayslip.id || showEditPayslip._id, { bonus: parseFloat(editForm.bonus)||0, reimbursements: parseFloat(editForm.reimbursements)||0, tds: parseFloat(editForm.tds)||0, other_deductions: parseFloat(editForm.other_deductions)||0 });
    if (res.ok) { showToast("Payslip updated"); setShowEditPayslip(null); invalidate("payslips"); }
    else showToast("Failed", "error");
    setFormLoading(false);
  };

  const statusCfg = {
    draft: { cls:"bg-slate-50 text-slate-600 border-slate-200", label:"Draft" },
    processed: { cls:"bg-blue-50 text-blue-600 border-blue-200", label:"Processed" },
    approved: { cls:"bg-green-50 text-green-600 border-green-200", label:"Approved" },
    paid: { cls:"bg-emerald-50 text-emerald-600 border-emerald-200", label:"Paid" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Payroll" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} className="bg-gradient-to-br from-brand-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
              <p className="text-xs text-blue-200">Total Gross</p>
              <p className="text-2xl font-black mt-1">{fmt(summary.total_gross)}</p>
            </motion.div>
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500">Total Net</p>
              <p className="text-2xl font-black text-green-600 mt-1">{fmt(summary.total_net)}</p>
            </motion.div>
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500">Deductions</p>
              <p className="text-2xl font-black text-red-500 mt-1">{fmt(summary.total_deductions)}</p>
            </motion.div>
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-500">Employees</p>
              <p className="text-2xl font-black text-slate-700 mt-1">{summary.employee_count || 0}</p>
            </motion.div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none">
              {Array.from({length:12},(_,i)=><option key={i} value={i+1}>{new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}</option>)}
            </select>
            <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none">
              {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
            <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {[{key:"runs",label:"Runs"},{key:"payslips",label:"Payslips"},{key:"adjustments",label:"Adjustments"},{key:"config",label:"Config"}].map(t => (
                <button key={t.key} onClick={()=>setTab(t.key)} className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab===t.key?"bg-brand-600 text-white shadow-md":"text-slate-500 hover:bg-slate-50"}`}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setShowConfigModal(true)} className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"><Settings className="w-3.5 h-3.5" /> Config</button>
            <button onClick={()=>setShowAdjustmentModal(true)} className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50"><Plus className="w-3.5 h-3.5" /> Adjustment</button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={()=>setShowRunModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Play className="w-4 h-4" /> Run Payroll
            </motion.button>
          </div>
        </div>

        {/* RUNS TAB */}
        {tab === "runs" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {runsLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : runs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No payroll runs for {selectedYear}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {runs.map((run, i) => {
                  const sc = statusCfg[run.status] || statusCfg.draft;
                  return (
                    <motion.div key={run.id||i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-brand-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">{new Date(2025, (run.month||1)-1).toLocaleDateString("en-US",{month:"long"})} {run.year}</h4>
                            <p className="text-xs text-slate-500">{run.employee_count || 0} employees • {fmt(run.total_net || 0)} net</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                          {run.status === "processed" && (
                            <button onClick={()=>handleApprove(run.id||run._id)} className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">Approve</button>
                          )}
                          {run.status === "approved" && (
                            <button onClick={()=>handleMarkPaid(run.id||run._id)} className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Mark Paid</button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* PAYSLIPS TAB */}
        {tab === "payslips" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {payslipsLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : payslips.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <IndianRupee className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No payslips for this month</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-slate-50/80">
                    {["Employee","Department","Days","LOP","Gross","Deductions","Net Pay","Status","Actions"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-3 py-3">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {payslips.map((ps, i) => {
                      const sc = statusCfg[ps.status] || statusCfg.draft;
                      return (
                        <tr key={ps.id||i} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-3 py-3">
                            <p className="text-xs font-semibold text-slate-800">{ps.employee_name}</p>
                            <p className="text-[10px] text-slate-400">{ps.employee_code}</p>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-600">{ps.department}</td>
                          <td className="px-3 py-3 text-xs text-slate-700 font-medium">{ps.days_worked}/{ps.working_days}</td>
                          <td className="px-3 py-3 text-xs font-bold text-red-500">{ps.lop_days || 0}</td>
                          <td className="px-3 py-3 text-xs font-bold text-slate-700">{fmt(ps.gross_pay)}</td>
                          <td className="px-3 py-3 text-xs text-red-500">{fmt(ps.total_deductions)}</td>
                          <td className="px-3 py-3 text-sm font-black text-green-600">{fmt(ps.net_pay)}</td>
                          <td className="px-3 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={()=>setShowPayslipDetail(ps)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center" title="View Details">
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                              </button>
                              {(ps.status === "processed" || ps.status === "draft") && (
                                <button onClick={()=>{setShowEditPayslip(ps);setEditForm({bonus:ps.earnings?.bonus||0,reimbursements:ps.earnings?.reimbursements||0,tds:ps.deductions?.tds||0,other_deductions:ps.deductions?.other_deductions||0});}}
                                  className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center" title="Edit">
                                  <Edit className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                              )}
                            </div>
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

        {/* ADJUSTMENTS TAB */}
        {tab === "adjustments" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {adjustments.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <Plus className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No adjustments for this month</p>
                <button onClick={()=>setShowAdjustmentModal(true)} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Add Adjustment</button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-slate-50/80">
                    {["Employee","Type","Amount","Description"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {adjustments.map((adj, i) => (
                      <tr key={adj.id||i} className="border-t border-slate-50">
                        <td className="px-4 py-3 text-xs font-semibold text-slate-800">{adj.employee_name || adj.employee_id}</td>
                        <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${adj.type==="bonus"?"bg-green-50 text-green-600":adj.type==="deduction"?"bg-red-50 text-red-500":"bg-blue-50 text-blue-600"}`}>{adj.type}</span></td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{fmt(adj.amount)}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{adj.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* CONFIG TAB */}
        {tab === "config" && config && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Payroll Configuration</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                ["PF %", "pf_percentage", config.pf_percentage],
                ["ESI Employee %", "esi_employee_percentage", config.esi_employee_percentage],
                ["ESI Employer %", "esi_employer_percentage", config.esi_employer_percentage],
                ["ESI Limit (₹)", "esi_limit", config.esi_limit],
                ["Professional Tax (₹)", "professional_tax", config.professional_tax],
                ["Pay Day", "pay_day", config.pay_day],
                ["Basic % of CTC", "basic_percentage", config.basic_percentage],
                ["HRA % of CTC", "hra_percentage", config.hra_percentage],
                ["Special Allowance % of CTC", "special_allowance_percentage", config.special_allowance_percentage],
              ].map(([label, key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-xs text-slate-600">{label}</span>
                  <span className="text-xs font-bold text-slate-800">{val ?? "—"}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-3">LOP Calculation: {config.lop_calculation || "calendar_days"} · LOP Deduction Basis: {config.lop_deduction_basis === "basic" ? "Basic Salary" : "Gross Salary"}</p>
            <button onClick={()=>{setConfigForm({...config}); setShowConfigModal(true);}} className="mt-4 text-xs font-bold text-brand-600 hover:underline">Edit Configuration</button>
          </motion.div>
        )}
      </div>

      {/* Run Payroll Modal */}
      <AnimatePresence>
        {showRunModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowRunModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Run Payroll</h3>
              <p className="text-xs text-slate-500 mb-5">Process payroll for <strong>{new Date(2025, selectedMonth-1).toLocaleDateString("en-US",{month:"long"})} {selectedYear}</strong>. This will auto-calculate payslips for all active employees.</p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 mb-4">
                <p className="text-[10px] text-amber-700">⚠️ This action reads attendance & leave data. Ensure all attendance is finalized for this month.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={()=>setShowRunModal(false)} className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
                <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }} onClick={handleRunPayroll} disabled={formLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70 flex items-center justify-center gap-2">
                  <Play className="w-4 h-4" /> {formLoading ? "Processing..." : "Run Now"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowConfigModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Payroll Config</h3>
                <button onClick={()=>setShowConfigModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                {[
                  ["PF Employee %", "pf_percentage"],
                  ["ESI Employee %", "esi_employee_percentage"],
                  ["ESI Employer %", "esi_employer_percentage"],
                  ["ESI Limit (₹)", "esi_limit"],
                  ["Professional Tax (₹)", "professional_tax"],
                  ["Pay Day (1-31)", "pay_day"],
                  ["Basic % of CTC", "basic_percentage"],
                  ["HRA % of CTC", "hra_percentage"],
                  ["Special Allowance % of CTC", "special_allowance_percentage"],
                ].map(([label, key]) => (
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-xs text-slate-600 w-40">{label}</label>
                    <input type="number" step="0.01" value={configForm[key]||""} onChange={e=>setConfigForm(f=>({...f,[key]:parseFloat(e.target.value)||0}))}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                ))}
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 w-40">LOP Calculation</label>
                  <select value={configForm.lop_calculation||"calendar_days"} onChange={e=>setConfigForm(f=>({...f,lop_calculation:e.target.value}))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none">
                    <option value="calendar_days">Calendar Days</option>
                    <option value="working_days">Working Days</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-600 w-40">LOP Deduction Basis</label>
                  <select value={configForm.lop_deduction_basis||"gross"} onChange={e=>setConfigForm(f=>({...f,lop_deduction_basis:e.target.value}))}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none">
                    <option value="gross">Gross (Monthly Gross / Working Days)</option>
                    <option value="basic">Basic (Basic / Working Days)</option>
                  </select>
                </div>
              </div>
              <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }} onClick={handleSaveConfig} disabled={formLoading}
                className="w-full mt-5 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                {formLoading ? "Saving..." : "Save Config"}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Adjustment Modal */}
      <AnimatePresence>
        {showAdjustmentModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAdjustmentModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add Adjustment</h3>
                <button onClick={()=>setShowAdjustmentModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleAddAdjustment} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={adjForm.employee_id} onChange={e=>setAdjForm(f=>({...f,employee_id:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select...</option>
                    {employees.map(emp=><option key={emp.id||emp._id} value={emp.id||emp._id}>{emp.first_name} {emp.last_name}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type *</label>
                  <select value={adjForm.type} onChange={e=>setAdjForm(f=>({...f,type:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="bonus">Bonus</option><option value="deduction">Deduction</option><option value="reimbursement">Reimbursement</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Amount (₹) *</label>
                  <input type="number" value={adjForm.amount} onChange={e=>setAdjForm(f=>({...f,amount:e.target.value}))} required placeholder="5000" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <input value={adjForm.description} onChange={e=>setAdjForm(f=>({...f,description:e.target.value}))} placeholder="Performance bonus Q2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Adding..." : "Add Adjustment"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Payslip Modal */}
      <AnimatePresence>
        {showEditPayslip && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowEditPayslip(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Edit Payslip</h3>
                <button onClick={()=>setShowEditPayslip(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <p className="text-xs text-slate-500 mb-4">{showEditPayslip.employee_name} — {new Date(2025,(showEditPayslip.month||1)-1).toLocaleDateString("en-US",{month:"long"})} {showEditPayslip.year}</p>
              <form onSubmit={handleEditPayslip} className="space-y-3">
                {[["Bonus","bonus"],["Reimbursements","reimbursements"],["TDS","tds"],["Other Deductions","other_deductions"]].map(([label,key])=>(
                  <div key={key} className="flex items-center gap-3">
                    <label className="text-xs text-slate-600 w-36">{label} (₹)</label>
                    <input type="number" value={editForm[key]} onChange={e=>setEditForm(f=>({...f,[key]:e.target.value}))}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                ))}
                <p className="text-[10px] text-slate-400">Net pay will be recalculated by the system.</p>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Saving..." : "Update Payslip"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payslip Detail Modal */}
      <AnimatePresence>
        {showPayslipDetail && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowPayslipDetail(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }} onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payslip — {new Date(2025,(showPayslipDetail.month||1)-1).toLocaleDateString("en-US",{month:"long"})} {showPayslipDetail.year}</h3>
                  <p className="text-xs text-slate-500">{showPayslipDetail.employee_name} • {showPayslipDetail.employee_code} • {showPayslipDetail.department}</p>
                </div>
                <button onClick={()=>setShowPayslipDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-5 space-y-5">
                {/* Attendance Summary */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 text-center">
                    <p className="text-lg font-black text-slate-800">{showPayslipDetail.working_days}</p>
                    <p className="text-[10px] text-slate-500">Working Days</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 text-center">
                    <p className="text-lg font-black text-green-600">{showPayslipDetail.days_worked}</p>
                    <p className="text-[10px] text-slate-500">Days Worked</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 text-center">
                    <p className="text-lg font-black text-red-500">{showPayslipDetail.lop_days || 0}</p>
                    <p className="text-[10px] text-slate-500">LOP Days</p>
                  </div>
                </div>

                {/* Earnings */}
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                  <h4 className="text-xs font-bold text-green-700 mb-3 uppercase tracking-wide">Earnings</h4>
                  {showPayslipDetail.earnings && Object.entries(showPayslipDetail.earnings).filter(([,v])=>v!==0).map(([k,v])=>(
                    <div key={k} className="flex justify-between py-1.5">
                      <span className="text-xs text-slate-600 capitalize">{k.replace(/_/g," ")}</span>
                      <span className={`text-xs font-semibold ${k === "lop_deduction" ? "text-red-500" : "text-slate-800"}`}>{k === "lop_deduction" ? `-${fmt(v)}` : fmt(v)}</span>
                    </div>
                  ))}
                  {showPayslipDetail.earnings && Object.entries(showPayslipDetail.earnings).filter(([,v])=>v===0).length > 0 && (
                    <div className="pt-2 mt-2 border-t border-green-100">
                      {Object.entries(showPayslipDetail.earnings).filter(([,v])=>v===0).map(([k,v])=>(
                        <div key={k} className="flex justify-between py-1">
                          <span className="text-[10px] text-slate-400 capitalize">{k.replace(/_/g," ")}</span>
                          <span className="text-[10px] text-slate-400">{fmt(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t border-green-200 mt-3">
                    <span className="text-xs font-bold text-green-700">Gross Pay</span>
                    <span className="text-sm font-black text-green-700">{fmt(showPayslipDetail.gross_pay)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                  <h4 className="text-xs font-bold text-red-600 mb-3 uppercase tracking-wide">Deductions</h4>
                  {showPayslipDetail.deductions && Object.entries(showPayslipDetail.deductions).map(([k,v])=>(
                    <div key={k} className="flex justify-between py-1.5">
                      <span className="text-xs text-slate-600 capitalize">{k.replace(/_/g," ")}</span>
                      <span className={`text-xs font-semibold ${v > 0 ? "text-red-500" : "text-slate-400"}`}>{v > 0 ? `-${fmt(v)}` : fmt(v)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-3 border-t border-red-200 mt-3">
                    <span className="text-xs font-bold text-red-600">Total Deductions</span>
                    <span className="text-sm font-black text-red-600">-{fmt(showPayslipDetail.total_deductions)}</span>
                  </div>
                </div>

                {/* Employer Contributions */}
                {showPayslipDetail.employer_contributions && (
                  <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                    <h4 className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wide">Employer Contributions</h4>
                    {Object.entries(showPayslipDetail.employer_contributions).map(([k,v])=>(
                      <div key={k} className="flex justify-between py-1.5">
                        <span className="text-xs text-slate-600 capitalize">{k.replace(/_/g," ")}</span>
                        <span className="text-xs font-semibold text-blue-700">{fmt(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Net Pay */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 text-center">
                  <p className="text-xs text-slate-500">Net Pay (Take Home)</p>
                  <p className="text-3xl font-black text-brand-600 mt-1">{fmt(showPayslipDetail.net_pay)}</p>
                </div>

                {/* Status & Dates */}
                <div className="space-y-2">
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-xs text-slate-500">Status</span>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${(statusCfg[showPayslipDetail.status]||statusCfg.draft).cls}`}>{(statusCfg[showPayslipDetail.status]||statusCfg.draft).label}</span>
                  </div>
                  {showPayslipDetail.paid_at && (
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                      <span className="text-xs text-slate-500">Paid At</span>
                      <span className="text-xs font-semibold text-green-600">{new Date(showPayslipDetail.paid_at).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                    <span className="text-xs text-slate-500">Generated</span>
                    <span className="text-xs font-medium text-slate-600">{new Date(showPayslipDetail.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
