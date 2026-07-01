"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Edit, Plus, Trash2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { getLeaveWorkflow, createLeaveWorkflow, updateLeaveWorkflow } from "@/lib/api";

export default function WorkflowPage() {
  const [workflow,    setWorkflow]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [toast,       setToast]       = useState(null);
  const [form, setForm] = useState({ name:"", levels:[{ level:1, approver_type:"reporting_manager", can_skip:true }], auto_approval:{ enabled:false, max_days:0, leave_types:null } });

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const fetch = async () => {
    setLoading(true);
    const res = await getLeaveWorkflow();
    if (res.ok && res.data) setWorkflow(res.data);
    setLoading(false);
  };

  useEffect(()=>{ fetch(); },[]);

  const openEdit = () => {
    setForm(workflow ? { name:workflow.name||"", levels:workflow.levels||[{level:1,approver_type:"reporting_manager",can_skip:true}], auto_approval:workflow.auto_approval||{enabled:false,max_days:0,leave_types:null} } : { name:"", levels:[{level:1,approver_type:"reporting_manager",can_skip:true}], auto_approval:{enabled:false,max_days:0,leave_types:null} });
    setShowForm(true);
  };

  const addLevel = () => setForm(f=>({...f,levels:[...f.levels,{level:f.levels.length+1,approver_type:"hr_admin",can_skip:false}]}));
  const removeLevel = (i) => setForm(f=>({...f,levels:f.levels.filter((_,idx)=>idx!==i)}));
  const updateLevel = (i,key,val) => setForm(f=>({...f,levels:f.levels.map((l,idx)=>idx===i?{...l,[key]:val}:l)}));

  const handleSave = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { ...form, levels:form.levels.map((l,i)=>({...l,level:i+1})) };
    const res = workflow?.id ? await updateLeaveWorkflow(workflow.id,payload) : await createLeaveWorkflow(payload);
    if (res.ok) { showToast(workflow?.id?"Workflow updated":"Workflow created"); setShowForm(false); fetch(); }
    else showToast(res.data?.detail||"Failed","error");
    setFormLoading(false);
  };

  return (
    <div>
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div><h3 className="text-sm font-bold text-slate-900">Approval Workflow</h3><p className="text-[10px] text-slate-400 mt-0.5">Configure leave approval levels</p></div>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={openEdit} className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
            <Edit className="w-3.5 h-3.5"/> {workflow?"Edit Workflow":"Create Workflow"}
          </motion.button>
        </div>
        <div className="p-6">
          {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
          : !workflow ? (
            <div className="text-center py-8">
              <ArrowRight className="w-8 h-8 text-slate-200 mx-auto mb-2"/>
              <p className="text-xs text-slate-400">No workflow configured yet. Using default: Employee → HR Admin.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-800">{workflow.name}</span><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${workflow.is_active?"bg-green-50 text-green-600 border-green-200":"bg-slate-50 text-slate-400 border-slate-200"}`}>{workflow.is_active?"Active":"Inactive"}</span></div>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">Employee</div>
                {(workflow.levels||[]).map((lvl,i)=>(
                  <div key={i} className="flex items-center gap-3">
                    <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0"/>
                    <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                      L{lvl.level}: <span className="font-bold capitalize">{lvl.approver_type?.replace(/_/g," ")}</span>
                      {lvl.can_skip&&<span className="text-[9px] text-slate-400 ml-1">(skippable)</span>}
                    </div>
                  </div>
                ))}
              </div>
              {workflow.auto_approval?.enabled&&(
                <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700">
                  Auto-approve leaves ≤ {workflow.auto_approval.max_days} day(s)
                  {workflow.auto_approval.leave_types&&<span> • Types: {workflow.auto_approval.leave_types.join(", ")}</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showForm&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowForm(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">{workflow?"Edit":"Create"} Workflow</h3><button onClick={()=>setShowForm(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleSave} className="space-y-5">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Workflow Name</label><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div>
                  <div className="flex items-center justify-between mb-3"><p className="text-xs font-bold text-slate-700">Approval Levels</p><button type="button" onClick={addLevel} className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline"><Plus className="w-3 h-3"/> Add Level</button></div>
                  <div className="space-y-3">
                    {form.levels.map((lvl,i)=>(
                      <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-500 w-8 flex-shrink-0">L{i+1}</span>
                        <select value={lvl.approver_type} onChange={e=>updateLevel(i,"approver_type",e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none">
                          <option value="reporting_manager">Reporting Manager</option>
                          <option value="hr_admin">HR Admin</option>
                          <option value="org_admin">Org Admin</option>
                        </select>
                        <label className="flex items-center gap-1 text-[10px] text-slate-600 cursor-pointer flex-shrink-0"><input type="checkbox" checked={lvl.can_skip} onChange={e=>updateLevel(i,"can_skip",e.target.checked)} className="w-3 h-3 rounded"/> Skip</label>
                        {form.levels.length>1&&<button type="button" onClick={()=>removeLevel(i)} className="w-6 h-6 rounded-lg hover:bg-red-100 flex items-center justify-center flex-shrink-0"><Trash2 className="w-3 h-3 text-red-400"/></button>}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"><input type="checkbox" checked={form.auto_approval.enabled} onChange={e=>setForm(f=>({...f,auto_approval:{...f.auto_approval,enabled:e.target.checked}}))} className="w-4 h-4 rounded border-slate-300"/> Enable Auto-Approval</label>
                  {form.auto_approval.enabled&&<div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Max Days for Auto-Approval</label><input type="number" min="1" value={form.auto_approval.max_days} onChange={e=>setForm(f=>({...f,auto_approval:{...f.auto_approval,max_days:parseInt(e.target.value)||0}}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>}
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":workflow?"Update Workflow":"Create Workflow"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
