"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, AlertCircle, X } from "lucide-react";
import { addPayrollAdjustment } from "@/lib/api";
import { usePayrollAdjustments, useEmployees, useInvalidate } from "@/lib/queries";

const MONTHS = Array.from({length:12},(_,i)=>({value:i+1,label:new Date(2025,i).toLocaleDateString("en-US",{month:"long"})}));
const YEARS  = [2024,2025,2026,2027];
const fmt = (v) => `₹${(v||0).toLocaleString("en-IN")}`;

const typeCfg = {
  bonus:         { cls:"bg-green-50 text-green-600 border-green-200",   label:"Bonus"         },
  deduction:     { cls:"bg-red-50 text-red-600 border-red-200",         label:"Deduction"     },
  reimbursement: { cls:"bg-blue-50 text-blue-600 border-blue-200",      label:"Reimbursement" },
};

export default function AdjustmentsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()+1);
  const [year,  setYear]  = useState(now.getFullYear());
  const [showModal,    setShowModal]    = useState(false);
  const [form,         setForm]         = useState({employee_id:"",type:"bonus",amount:"",description:""});
  const [toast,        setToast]        = useState(null);
  const [formLoading,  setFormLoading]  = useState(false);

  const invalidate = useInvalidate();
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const { data: adjData } = usePayrollAdjustments({ month, year });
  const adjustments = adjData?.adjustments || [];
  const { data: empData } = useEmployees({ limit:100 });
  const employees = empData?.employees || [];

  const handleAdd = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await addPayrollAdjustment({ ...form, amount:parseFloat(form.amount), month, year });
    if (res.ok) { showToast("Adjustment added"); setShowModal(false); setForm({employee_id:"",type:"bonus",amount:"",description:""}); invalidate("payroll-adjustments"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed","error");
    setFormLoading(false);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Payroll Adjustments</h2>
          <p className="text-sm text-slate-500">Manage bonuses, deductions, and reimbursements</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <select value={month} onChange={e=>setMonth(parseInt(e.target.value))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none font-semibold">
              {MONTHS.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(parseInt(e.target.value))} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none font-semibold">
              {YEARS.map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20 rounded-xl text-xs font-semibold hover:opacity-90">
            <Plus className="w-3.5 h-3.5"/> Add Adjustment
          </motion.button>
        </div>
      </div>

      {adjustments.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Plus className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No adjustments for {MONTHS.find(m=>m.value===month)?.label} {year}</p>
          <button onClick={()=>setShowModal(true)} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Add Adjustment</button>
        </div>
      ) : (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
              {["Employee","Type","Amount","Description"].map(h=><th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-5 py-4">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-slate-50">
              {adjustments.map((a,i)=>{
                const tc=typeCfg[a.type]||typeCfg.bonus;
                return (
                  <motion.tr initial={{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}} key={a.id||i} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-xs font-bold text-slate-800">{a.employee_name||a.employee_id}</p>
                    </td>
                    <td className="px-5 py-4"><span className={`text-[9px] font-bold px-2.5 py-1.5 rounded-full border capitalize ${tc.cls}`}>{tc.label}</span></td>
                    <td className="px-5 py-4 text-sm font-black text-slate-700">{fmt(a.amount)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">{a.description||"—"}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowModal(false)}>
          <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Add Adjustment</h3>
                  <p className="text-sm text-white/70 mt-0.5">Bonus, deduction or reimbursement</p>
                </div>
                <button onClick={()=>setShowModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"><X className="w-4 h-4 text-white"/></button>
              </div>
              <div className="p-6">
                <form onSubmit={handleAdd} className="space-y-4">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                    <select value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100">
                      <option value="">Select employee...</option>{employees.map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name}</option>)}
                    </select></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[{v:"bonus",l:"Bonus",c:"border-green-300 bg-green-50 text-green-700"},{v:"deduction",l:"Deduction",c:"border-red-300 bg-red-50 text-red-700"},{v:"reimbursement",l:"Reimburse",c:"border-blue-300 bg-blue-50 text-blue-700"}].map(t=>(
                        <button key={t.v} type="button" onClick={()=>setForm(f=>({...f,type:t.v}))}
                          className={`py-2 rounded-xl border text-xs font-bold transition-all ${form.type===t.v ? t.c+" shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>{t.l}</button>
                      ))}
                    </div></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Amount (₹) *</label>
                    <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} required placeholder="5000" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                    <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Performance bonus Q2" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"/></div>
                  <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-70">{formLoading?"Adding...":"Add Adjustment"}</motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}