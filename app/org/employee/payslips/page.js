"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, IndianRupee, Calendar, Download, Eye, X, CheckCircle2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import { getPayslipDetail } from "@/lib/api";
import { useMyPayslips } from "@/lib/queries";
import { downloadCSV, EXPORT_CONFIGS } from "@/lib/excel";

export default function MyPayslipsPage() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(0); // 0 means all months
  const [showDetail, setShowDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const { data: payslipData, isLoading } = useMyPayslips({ year: selectedYear });
  const payslips = payslipData?.payslips || [];
  
  const filteredPayslips = selectedMonth === 0 
    ? payslips 
    : payslips.filter(ps => ps.month === selectedMonth);

  const fmt = (v) => `₹${(v||0).toLocaleString("en-IN")}`;

  const viewDetail = async (payslipId) => {
    setDetailLoading(true);
    const res = await getPayslipDetail(payslipId);
    if (res.ok && res.data) setShowDetail(res.data);
    setDetailLoading(false);
  };

  if (isLoading) return <div className="min-h-screen bg-surface-100"><TopBar title="My Payslips" /><div className="p-6 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div></div>;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Payslips" />

      <div className="p-6 space-y-6">
        {/* Year selector */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Payslips — {selectedYear}</h2>
          <div className="flex items-center gap-2">
            {filteredPayslips.length > 0 && (
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                onClick={()=>downloadCSV(filteredPayslips, EXPORT_CONFIGS.my_payslips, `my_payslips_${selectedYear}.csv`)}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md">
                <Download className="w-3.5 h-3.5"/> Export
              </motion.button>
            )}
            <select value={selectedMonth} onChange={e=>setSelectedMonth(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none">
              <option value={0}>All Months</option>
              {Array.from({ length: 12 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2025, i).toLocaleDateString("en-US", { month: "short" })}
                </option>
              ))}
            </select>
            <select value={selectedYear} onChange={e=>setSelectedYear(parseInt(e.target.value))}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold outline-none">
              {[2024,2025,2026,2027].map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Payslip List */}
        {filteredPayslips.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Wallet className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-400">No payslips for {selectedMonth !== 0 ? new Date(2025, selectedMonth - 1).toLocaleDateString("en-US", {month:"long"}) + " " : ""}{selectedYear}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPayslips.map((ps, i) => (
              <motion.div key={ps.id||i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{new Date(2025,(ps.month||1)-1).toLocaleDateString("en-US",{month:"long"})} {ps.year}</h4>
                      <p className="text-xs text-slate-500">{ps.days_worked || "—"}/{ps.working_days || "—"} days worked</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-black text-green-600">{fmt(ps.net_pay)}</p>
                      <p className="text-[10px] text-slate-400">Net Pay</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${ps.status==="paid"?"bg-green-50 text-green-600 border border-green-200":"bg-amber-50 text-amber-600 border border-amber-200"}`}>
                      {ps.status === "paid" ? "✓ Paid" : ps.status}
                    </span>
                    <button onClick={()=>viewDetail(ps.id||ps._id)}
                      className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100">
                      <Eye className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Payslip Detail Modal */}
      <AnimatePresence>
        {showDetail && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }} onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Payslip — {new Date(2025,(showDetail.month||1)-1).toLocaleDateString("en-US",{month:"long"})} {showDetail.year}</h3>
                  <p className="text-xs text-slate-500">{showDetail.employee_name} • {showDetail.employee_code}</p>
                </div>
                <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-5 space-y-5">
                {/* Working days */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 text-center">
                    <p className="text-lg font-black text-slate-800">{showDetail.working_days}</p>
                    <p className="text-[10px] text-slate-500">Working Days</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50 text-center">
                    <p className="text-lg font-black text-green-600">{showDetail.days_worked}</p>
                    <p className="text-[10px] text-slate-500">Days Worked</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-50 text-center">
                    <p className="text-lg font-black text-red-500">{showDetail.lop_days || 0}</p>
                    <p className="text-[10px] text-slate-500">LOP Days</p>
                  </div>
                </div>

                {/* Earnings */}
                <div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                  <h4 className="text-xs font-bold text-green-700 mb-3 uppercase tracking-wide">Earnings</h4>
                  {showDetail.earnings && Object.entries(showDetail.earnings).filter(([,v])=>v!==0).map(([k,v])=>(
                    <div key={k} className="flex justify-between py-1.5">
                      <span className="text-xs text-slate-600 capitalize">{k.replace(/_/g," ")}</span>
                      <span className={`text-xs font-semibold ${k === "lop_deduction" ? "text-red-500" : "text-slate-800"}`}>{k === "lop_deduction" ? `-${fmt(v)}` : fmt(v)}</span>
                    </div>
                  ))}
                  {showDetail.earnings && Object.entries(showDetail.earnings).filter(([,v])=>v===0).length > 0 && (
                    <div className="pt-2 mt-2 border-t border-green-100">
                      {Object.entries(showDetail.earnings).filter(([,v])=>v===0).map(([k,v])=>(
                        <div key={k} className="flex justify-between py-1">
                          <span className="text-[10px] text-slate-400 capitalize">{k.replace(/_/g," ")}</span>
                          <span className="text-[10px] text-slate-400">{fmt(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Gross salary (API returns gross_salary; gross_pay is a fallback) */}
                  <div className="flex justify-between pt-3 border-t border-green-200 mt-3">
                    <span className="text-xs font-bold text-green-700">Gross Salary</span>
                    <span className="text-sm font-black text-green-700">{fmt(showDetail.gross_salary || showDetail.gross_pay)}</span>
                  </div>
                  {(showDetail.lop_deduction > 0 || showDetail.gross_after_lop) && (
                    <>
                      <div className="flex justify-between pt-1">
                        <span className="text-xs text-red-500">LOP Deduction</span>
                        <span className="text-xs font-semibold text-red-500">-{fmt(showDetail.lop_deduction)}</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-xs font-bold text-slate-700">Gross After LOP</span>
                        <span className="text-sm font-black text-slate-700">{fmt(showDetail.gross_after_lop)}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Deductions */}
                <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                  <h4 className="text-xs font-bold text-red-600 mb-3 uppercase tracking-wide">Deductions</h4>
                  {(() => {
                    const SKIP_KEYS = new Set(["total_deductions"]);
                    const LABELS = { pf_employee: "PF (Employee)", esi_employee: "ESI (Employee)", professional_tax: "Professional Tax", manual_deductions: "Manual Deductions" };
                    const rows = showDetail.deductions
                      ? Object.entries(showDetail.deductions).filter(([k]) => !SKIP_KEYS.has(k)).map(([k, v]) => [LABELS[k] || k.replace(/_/g, " "), v])
                      : [
                          showDetail.pf_employee != null && ["PF (Employee)", showDetail.pf_employee],
                          showDetail.esi_employee != null && ["ESI (Employee)", showDetail.esi_employee],
                          showDetail.professional_tax != null && ["Professional Tax", showDetail.professional_tax],
                        ].filter(Boolean);
                    return rows.map(([label, v]) => (
                      <div key={label} className="flex justify-between py-1.5">
                        <span className="text-xs text-slate-600 capitalize">{label}</span>
                        <span className={`text-xs font-semibold ${v > 0 ? "text-red-500" : "text-slate-400"}`}>{v > 0 ? `-${fmt(v)}` : fmt(v)}</span>
                      </div>
                    ));
                  })()}
                  <div className="flex justify-between pt-3 border-t border-red-200 mt-3">
                    <span className="text-xs font-bold text-red-600">Total Deductions</span>
                    <span className="text-sm font-black text-red-600">-{fmt(showDetail.total_deductions)}</span>
                  </div>
                </div>

                {/* Employer Contributions */}
                {(() => {
                  const ps = showDetail;
                  const SKIP_CONTRIB = new Set(["total_employer_cost"]);
                  const CONTRIB_LABELS = { pf_employer: "Employer PF", esi_employer: "Employer ESI" };
                  const hasFlat = ps.pf_employer != null || ps.esi_employer != null;
                  const hasNested = ps.employer_contributions && Object.keys(ps.employer_contributions).length > 0;
                  if (!hasFlat && !hasNested) return null;
                  const rows = hasFlat
                    ? [
                        ps.pf_employer != null && ["Employer PF", ps.pf_employer],
                        ps.esi_employer != null && ["Employer ESI", ps.esi_employer],
                      ].filter(Boolean)
                    : Object.entries(ps.employer_contributions)
                        .filter(([k]) => !SKIP_CONTRIB.has(k))
                        .map(([k, v]) => [CONTRIB_LABELS[k] || k.replace(/_/g, " "), v]);
                  const total = ps.total_employer_cost ?? ps.employer_contributions?.total_employer_cost ?? rows.reduce((s, [,v]) => s + (v || 0), 0);
                  return (
                    <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100">
                      <h4 className="text-xs font-bold text-blue-600 mb-3 uppercase tracking-wide">Employer Contributions</h4>
                      {rows.map(([label, value]) => (
                        <div key={label} className="flex justify-between py-1.5">
                          <span className="text-xs text-slate-600 capitalize">{label}</span>
                          <span className={`text-xs font-semibold ${value > 0 ? "text-blue-700" : "text-slate-400"}`}>{fmt(value)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2.5 mt-1 border-t border-blue-100">
                        <span className="text-xs font-bold text-blue-700">Total Employer Cost</span>
                        <span className="text-xs font-black text-blue-700">{fmt(total)}</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Net Pay */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 text-center">
                  <p className="text-xs text-slate-500">Net Pay (Take Home)</p>
                  <p className="text-3xl font-black text-brand-600 mt-1">{fmt(showDetail.net_pay)}</p>
                  {showDetail.paid_at && <p className="text-[10px] text-green-600 mt-2">Paid on {new Date(showDetail.paid_at).toLocaleDateString()}</p>}
                </div>

                {/* Status */}
                <div className="flex justify-between p-3 rounded-xl bg-slate-50">
                  <span className="text-xs text-slate-500">Status</span>
                  <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${showDetail.status==="paid"?"bg-green-50 text-green-600 border border-green-200":"bg-blue-50 text-blue-600 border border-blue-200"}`}>{showDetail.status}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
