"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit, Trash2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { getLeaveConfig, addLeaveType, updateLeaveType, deleteLeaveType } from "@/lib/api";

const blank = { name:"",code:"",days_per_year:"",is_paid:true,carry_forward:false,max_carry_forward_days:0,applicable_after_days:0,description:"",accrual_type:"yearly",days_per_month:0 };

export default function LeaveTypesPage() {
  const [types, setTypes]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(blank);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast]           = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const fetch = async () => {
    setLoading(true);
    const res = await getLeaveConfig();
    if (res.ok && res.data) setTypes(res.data.leave_types||[]);
    setLoading(false);
  };

  useEffect(()=>{ fetch(); },[]);

  const openAdd  = () => { setForm(blank); setEditItem(null); setShowAdd(true); };
  const openEdit = (lt) => { setForm({name:lt.name,code:lt.code,days_per_year:lt.days_per_year,is_paid:lt.is_paid!==false,carry_forward:!!lt.carry_forward,max_carry_forward_days:lt.max_carry_forward_days||0,applicable_after_days:lt.applicable_after_days||0,description:lt.description||"",accrual_type:lt.accrual_type||"yearly",days_per_month:lt.days_per_month||0}); setEditItem(lt); setShowAdd(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { name:form.name,code:form.code.toUpperCase(),days_per_year:parseInt(form.days_per_year)||0,is_paid:form.is_paid,carry_forward:form.carry_forward,max_carry_forward_days:parseInt(form.max_carry_forward_days)||0,applicable_after_days:parseInt(form.applicable_after_days)||0,description:form.description,accrual_type:form.accrual_type||"yearly",days_per_month:parseFloat(form.days_per_month)||0 };
    if (editItem) {
      if (form.name===editItem.name) delete payload.name;
      if (form.code.toUpperCase()===(editItem.code||"").toUpperCase()) delete payload.code;
    }
    const res = editItem ? await updateLeaveType(editItem.id||editItem._id||editItem.code, payload) : await addLeaveType(payload);
    if (res.ok) { showToast(editItem?"Updated":"Added"); setShowAdd(false); fetch(); }
    else { const m=typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed"; showToast(m,"error"); }
    setFormLoading(false);
  };

  const handleDelete = async (lt) => {
    if (!confirm(`Delete "${lt.name}"?`)) return;
    const res = await deleteLeaveType(lt.id||lt._id||lt.code);
    if (res.ok) { showToast(`"${lt.name}" deleted`); fetch(); }
    else showToast(res.data?.detail||"Cannot delete","error");
  };

  return (
    <div>
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="text-sm font-bold text-slate-900">Leave Types</h3><p className="text-[10px] text-slate-400 mt-0.5">Configure leave types for your organization</p></div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openAdd} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md"><Plus className="w-3.5 h-3.5"/> Add Leave Type</motion.button>
        </div>
        {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">{["Code","Name","Days/Year","Paid","Carry Forward","Accrual","Status","Actions"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {types.map((lt,i)=>(
                  <tr key={lt.id||i} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3"><span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{lt.code}</span></td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-800">{lt.name}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{lt.days_per_year===-1?"Unlimited":lt.days_per_year}</td>
                    <td className="px-4 py-3 text-xs">{lt.is_paid!==false?<span className="text-green-600">Yes</span>:<span className="text-slate-400">No</span>}</td>
                    <td className="px-4 py-3 text-xs">{lt.carry_forward?<span className="text-blue-600">Yes ({lt.max_carry_forward_days}d)</span>:<span className="text-slate-400">No</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 capitalize">{lt.accrual_type||"yearly"}</td>
                    <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${lt.is_active!==false?"bg-green-50 text-green-600 border-green-200":"bg-slate-50 text-slate-400 border-slate-200"}`}>{lt.is_active!==false?"Active":"Inactive"}</span></td>
                    <td className="px-4 py-3"><div className="flex gap-1.5"><button onClick={()=>openEdit(lt)} className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center"><Edit className="w-3.5 h-3.5 text-blue-600"/></button><button onClick={()=>handleDelete(lt)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showAdd&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAdd(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">{editItem?"Edit":"Add"} Leave Type</h3><button onClick={()=>setShowAdd(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name *</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Code *</label><input value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value.toUpperCase()}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 uppercase"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Days/Year</label><input type="number" value={form.days_per_year} onChange={e=>setForm(f=>({...f,days_per_year:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Applicable After (days)</label><input type="number" value={form.applicable_after_days} onChange={e=>setForm(f=>({...f,applicable_after_days:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Accrual Type</label><select value={form.accrual_type} onChange={e=>setForm(f=>({...f,accrual_type:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"><option value="yearly">Yearly</option><option value="monthly">Monthly</option></select></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Days/Month</label><input type="number" step="0.1" value={form.days_per_month} onChange={e=>setForm(f=>({...f,days_per_month:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div className="flex gap-6">
                  {[["Paid","is_paid"],["Carry Forward","carry_forward"]].map(([lbl,key])=>(
                    <label key={key} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"><input type="checkbox" checked={!!form[key]} onChange={e=>setForm(f=>({...f,[key]:e.target.checked}))} className="w-4 h-4 rounded border-slate-300 text-brand-600"/> {lbl}</label>
                  ))}
                </div>
                {form.carry_forward&&<div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Max Carry Forward Days</label><input type="number" value={form.max_carry_forward_days} onChange={e=>setForm(f=>({...f,max_carry_forward_days:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>}
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":editItem?"Update":"Add Leave Type"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
