"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IndianRupee, Eye, Edit, CheckCircle2, AlertCircle, X, Send, MessageSquare } from "lucide-react";
import { editPayslip } from "@/lib/api";
import { usePayslips, usePayrollSummary, useInvalidate } from "@/lib/queries";

const statusCfg = {
  draft:     { cls:"bg-slate-50 text-slate-500 border-slate-200",   label:"Draft"     },
  processed: { cls:"bg-blue-50 text-blue-600 border-blue-200",      label:"Processed" },
  approved:  { cls:"bg-purple-50 text-purple-600 border-purple-200",label:"Approved"  },
  paid:      { cls:"bg-green-50 text-green-600 border-green-200",   label:"Paid"      },
};
const MONTHS = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}));
const YEARS  = [2024,2025,2026,2027];
const fmt = (v) => `₹${(v||0).toLocaleString("en-IN")}`;
const SKIP_KEYS = new Set(["total_deductions"]);
const DEDUCTION_LABELS = { pf_employee:"PF (Employee)", esi_employee:"ESI (Employee)", professional_tax:"Professional Tax", manual_deductions:"Manual Deductions" };
const SKIP_CONTRIB = new Set(["total_employer_cost"]);
const CONTRIB_LABELS = { pf_employer:"Employer PF", esi_employer:"Employer ESI" };

export default function PayslipsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());

  const [showDetail,   setShowDetail]   = useState(null);
  const [showEdit,     setShowEdit]     = useState(null);
  const [editForm,     setEditForm]     = useState({bonus:0,reimbursements:0,tds:0,other_deductions:0});
  const [toast,        setToast]        = useState(null);
  const [formLoading,  setFormLoading]  = useState(false);

  const invalidate = useInvalidate();
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const { data: payslipsData, isLoading } = usePayslips({ month, year });
  const payslips = payslipsData?.payslips || [];
  const { data: summary } = usePayrollSummary({ month, year });

  const handleEditPayslip = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await editPayslip(showEdit.id, { ...editForm, bonus:parseFloat(editForm.bonus)||0, reimbursements:parseFloat(editForm.reimbursements)||0, tds:parseFloat(editForm.tds)||0, other_deductions:parseFloat(editForm.other_deductions)||0 });
    if (res.ok) { showToast("Payslip updated"); setShowEdit(null); invalidate("payslips"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
    setFormLoading(false);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={month} onChange={e=>setMonth(parseInt(e.target.value))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none font-semibold">
          {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
        <select value={year} onChange={e=>setYear(parseInt(e.target.value))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none font-semibold">
          {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Summary row */}
      {summary&&(
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[["Total Employees",summary.total_employees||summary.employee_count||payslips.length,"text-slate-800"],["Gross Payroll",fmt(summary.total_gross||summary.gross),"text-slate-800"],["Total Deductions",fmt(summary.total_deductions||summary.deductions),"text-red-500"],["Net Payroll",fmt(summary.total_net||summary.net),"text-green-600"]].map(([l,v,c])=>(
            <div key={l} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className={`text-xl font-black ${c}`}>{v}</p>
              <p className="text-xs text-slate-500 mt-1">{l}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : payslips.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <IndianRupee className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No payslips for {MONTHS.find(m=>m.value===month)?.label} {year}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">
                {["Employee","Department","Days","LOP","Gross","Deductions","Net Pay","Status","Actions"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-3 py-3 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {payslips.map((ps,i)=>{
                  const sc=statusCfg[ps.status]||statusCfg.draft;
                  return (
                    <motion.tr key={ps.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-3 py-3"><p className="text-xs font-semibold text-slate-800">{ps.employee_name}</p><p className="text-[10px] text-slate-400">{ps.employee_code}</p></td>
                      <td className="px-3 py-3 text-xs text-slate-600">{ps.department}</td>
                      <td className="px-3 py-3 text-xs text-slate-700">{ps.days_worked}/{ps.working_days}</td>
                      <td className="px-3 py-3 text-xs font-bold text-red-500">{ps.lop_days||0}</td>
                      <td className="px-3 py-3 text-xs font-bold text-slate-700">{fmt(ps.gross_salary||ps.gross_pay)}</td>
                      <td className="px-3 py-3 text-xs text-red-500">{fmt(ps.total_deductions)}</td>
                      <td className="px-3 py-3 text-sm font-black text-green-600">{fmt(ps.net_pay)}</td>
                      <td className="px-3 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={()=>setShowDetail(ps)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center" title="View"><Eye className="w-3.5 h-3.5 text-slate-500"/></button>
                          {(ps.status==="processed"||ps.status==="draft")&&<button onClick={()=>{setShowEdit(ps);setEditForm({bonus:ps.earnings?.bonus||0,reimbursements:ps.earnings?.reimbursements||0,tds:ps.deductions?.tds||0,other_deductions:ps.deductions?.other_deductions||0});}} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center" title="Edit"><Edit className="w-3.5 h-3.5 text-blue-600"/></button>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payslip Detail Modal */}
      <AnimatePresence>
        {showDetail&&(()=>{
          const ps=showDetail;
          return (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowDetail(null)}>
              <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10 rounded-t-2xl">
                  <div><h3 className="text-lg font-bold text-slate-900">Payslip — {MONTHS.find(m=>m.value===ps.month)?.label} {ps.year}</h3><p className="text-xs text-slate-500">{ps.employee_name} • {ps.employee_code} • {ps.department}</p></div>
                  <button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    {[["Working Days",ps.working_days,"text-slate-800","bg-slate-50"],["Days Worked",ps.days_worked,"text-green-600","bg-green-50"],["LOP Days",ps.lop_days||0,"text-red-500","bg-red-50"]].map(([l,v,c,bg])=>(
                      <div key={l} className={`p-3 rounded-xl ${bg} text-center`}><p className={`text-lg font-black ${c}`}>{v}</p><p className="text-[10px] text-slate-500 mt-0.5">{l}</p></div>
                    ))}
                  </div>
                  {ps.earnings&&<div className="p-4 rounded-xl bg-green-50/50 border border-green-100">
                    <h4 className="text-xs font-bold text-green-700 mb-3 uppercase">Earnings</h4>
                    {Object.entries(ps.earnings).filter(([,v])=>v!==0).map(([k,v])=>(
                      <div key={k} className="flex justify-between py-1.5"><span className="text-xs text-slate-600 capitalize">{k.replace(/_/g," ")}</span><span className="text-xs font-semibold text-slate-800">{fmt(v)}</span></div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-green-200 mt-2"><span className="text-xs font-bold text-green-700">Gross Salary</span><span className="text-sm font-black text-green-700">{fmt(ps.gross_salary||ps.gross_pay)}</span></div>
                    {(ps.lop_deduction>0||ps.gross_after_lop)&&<><div className="flex justify-between pt-1"><span className="text-xs text-red-500">LOP Deduction</span><span className="text-xs font-semibold text-red-500">-{fmt(ps.lop_deduction)}</span></div><div className="flex justify-between pt-1"><span className="text-xs font-bold text-slate-700">Gross After LOP</span><span className="text-sm font-black text-slate-700">{fmt(ps.gross_after_lop)}</span></div></>}
                  </div>}
                  <div className="p-4 rounded-xl bg-red-50/50 border border-red-100">
                    <h4 className="text-xs font-bold text-red-600 mb-3 uppercase">Deductions</h4>
                    {(()=>{const rows=ps.deductions?Object.entries(ps.deductions).filter(([k])=>!SKIP_KEYS.has(k)).map(([k,v])=>[DEDUCTION_LABELS[k]||k.replace(/_/g," "),v]):[["PF (Employee)",ps.pf_employee],["ESI (Employee)",ps.esi_employee],["Professional Tax",ps.professional_tax]].filter(([,v])=>v!=null);return rows.map(([l,v])=>(<div key={l} className="flex justify-between py-1.5"><span className="text-xs text-slate-600 capitalize">{l}</span><span className={`text-xs font-semibold ${v>0?"text-red-500":"text-slate-400"}`}>{v>0?`-${fmt(v)}`:fmt(v)}</span></div>));})()}
                    <div className="flex justify-between pt-3 border-t border-red-200 mt-2"><span className="text-xs font-bold text-red-600">Total Deductions</span><span className="text-sm font-black text-red-600">-{fmt(ps.total_deductions)}</span></div>
                  </div>
                  {(()=>{const hasFlat=ps.pf_employer!=null||ps.esi_employer!=null;const hasNested=ps.employer_contributions&&Object.keys(ps.employer_contributions).length>0;if(!hasFlat&&!hasNested)return null;const rows=hasFlat?[["Employer PF",ps.pf_employer],["Employer ESI",ps.esi_employer]].filter(([,v])=>v!=null):Object.entries(ps.employer_contributions).filter(([k])=>!SKIP_CONTRIB.has(k)).map(([k,v])=>[CONTRIB_LABELS[k]||k.replace(/_/g," "),v]);const total=ps.total_employer_cost??ps.employer_contributions?.total_employer_cost??rows.reduce((s,[,v])=>s+(v||0),0);return(<div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100"><h4 className="text-xs font-bold text-blue-600 mb-3 uppercase">Employer Contributions</h4>{rows.map(([l,v])=>(<div key={l} className="flex justify-between py-1.5"><span className="text-xs text-slate-600 capitalize">{l}</span><span className={`text-xs font-semibold ${v>0?"text-blue-700":"text-slate-400"}`}>{fmt(v)}</span></div>))}<div className="flex justify-between pt-2.5 mt-1 border-t border-blue-100"><span className="text-xs font-bold text-blue-700">Total Employer Cost</span><span className="text-xs font-black text-blue-700">{fmt(total)}</span></div></div>);})()}
                  <div className="p-5 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50 border border-brand-100 text-center"><p className="text-xs text-slate-500">Net Pay (Take Home)</p><p className="text-3xl font-black text-brand-600 mt-1">{fmt(ps.net_pay)}</p>{ps.paid_at&&<p className="text-xs text-green-600 mt-1">Paid on {new Date(ps.paid_at).toLocaleDateString()}</p>}</div>
                  <div className="space-y-2">
                    {ps.monthly_ctc&&<div className="flex justify-between p-3 rounded-xl bg-slate-50"><span className="text-xs text-slate-500">Monthly CTC</span><span className="text-xs font-semibold">{fmt(ps.monthly_ctc)}</span></div>}
                    {ps.generated_by_name&&<div className="flex justify-between p-3 rounded-xl bg-slate-50"><span className="text-xs text-slate-500">Generated By</span><span className="text-xs font-semibold">{ps.generated_by_name}</span></div>}
                    <div className="flex justify-between p-3 rounded-xl bg-slate-50"><span className="text-xs text-slate-500">Generated At</span><span className="text-xs font-medium">{new Date(ps.generated_at||ps.created_at).toLocaleString()}</span></div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Edit Payslip Modal */}
      <AnimatePresence>
        {showEdit&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowEdit(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Edit Payslip</h3><button onClick={()=>setShowEdit(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <p className="text-xs text-slate-500 mb-4">{showEdit.employee_name} — {MONTHS.find(m=>m.value===showEdit.month)?.label} {showEdit.year}</p>
              <form onSubmit={handleEditPayslip} className="space-y-3">
                {[["Bonus","bonus"],["Reimbursements","reimbursements"],["TDS","tds"],["Other Deductions","other_deductions"]].map(([l,k])=>(
                  <div key={k} className="flex items-center gap-3"><label className="text-xs text-slate-600 w-36">{l} (₹)</label><input type="number" value={editForm[k]} onChange={e=>setEditForm(f=>({...f,[k]:e.target.value}))} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                ))}
                <p className="text-[10px] text-slate-400">Net pay will be recalculated by the system.</p>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":"Update Payslip"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
