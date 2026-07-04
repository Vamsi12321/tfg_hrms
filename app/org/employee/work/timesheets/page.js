"use client";

import { todayIST } from "@/lib/date";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Plus, X, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { createTimesheet } from "@/lib/api";
import { useMyTimesheets, useProjects, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"Pending"  },
  approved: { cls:"bg-green-50 text-green-600 border-green-200", label:"Approved" },
  rejected: { cls:"bg-red-50 text-red-500 border-red-200",       label:"Rejected" },
};

export default function EmpTimesheetsPage() {
  const invalidate = useInvalidate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const { data: tsData, isLoading } = useMyTimesheets({ date_from:dateFrom||undefined, date_to:dateTo||undefined });
  const timesheets = tsData?.timesheets || [];
  const { data: projData } = useProjects();
  const projects = projData?.projects || [];

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ date: todayIST(), entries: [{ project_id:"", project_name:"", work_item_id:"", hours:"", description:"" }], remarks:"" });
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const addEntry = () => setForm(f=>({...f, entries:[...f.entries, {project_id:"",project_name:"",work_item_id:"",hours:"",description:""}]}));
  const removeEntry = (idx) => setForm(f=>({...f, entries:f.entries.filter((_,i)=>i!==idx)}));
  const updateEntry = (idx, key, val) => setForm(f=>({...f, entries:f.entries.map((e,i)=>i===idx?{...e,[key]:val}:e)}));

  const handleProjectChange = (idx, projectId) => {
    const proj = projects.find(p=>(p.id||p._id)===projectId);
    updateEntry(idx, "project_id", projectId);
    updateEntry(idx, "project_name", proj?.name||"");
  };

  const totalHours = form.entries.reduce((s,e)=>s+(parseFloat(e.hours)||0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (totalHours===0) { showToast("Log at least some hours","error"); return; }
    setFormLoading(true);
    const payload = {
      date: form.date,
      entries: form.entries.filter(en=>en.hours).map(en=>({
        project_id: en.project_id||null,
        project_name: en.project_name||"General",
        work_item_id: en.work_item_id||null,
        hours: parseFloat(en.hours),
        description: en.description,
      })),
      remarks: form.remarks||undefined,
    };
    const res = await createTimesheet(payload);
    if (res.ok) { showToast("Timesheet submitted!"); setShowCreate(false); setForm({date:todayIST(),entries:[{project_id:"",project_name:"",work_item_id:"",hours:"",description:""}],remarks:""}); invalidate("my-timesheets"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed to submit","error");
    setFormLoading(false);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} placeholder="From" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400"/>
          <span className="text-slate-300 text-xs">→</span>
          <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} placeholder="To" className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400"/>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <Plus className="w-3.5 h-3.5"/> Log Today
        </motion.button>
      </div>

      {/* Past timesheets */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : timesheets.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No timesheets logged yet</p>
          <button onClick={()=>setShowCreate(true)} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Log your first timesheet</button>
        </div>
      ) : (
        <div className="space-y-3">
          {timesheets.map((ts,i)=>{
            const sc = statusCfg[ts.status]||statusCfg.pending;
            return (
              <motion.div key={ts.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-brand-600"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{new Date(ts.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</p>
                      <p className="text-[10px] text-slate-500">{(ts.entries||[]).length} entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-brand-600">{ts.total_hours}h</span>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                  </div>
                </div>
                {/* Entries */}
                <div className="space-y-1.5">
                  {(ts.entries||[]).map((entry,j)=>(
                    <div key={j} className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full flex-shrink-0">{entry.project_name||"General"}</span>
                        <span className="text-xs text-slate-600 truncate">{entry.description||"—"}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-700 flex-shrink-0 ml-3">{entry.hours}h</span>
                    </div>
                  ))}
                </div>
                {ts.remarks && <p className="text-[10px] text-slate-400 italic mt-2 pt-2 border-t border-slate-50">Remarks: {ts.remarks}</p>}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Timesheet Modal */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
                <div><h3 className="text-lg font-bold text-slate-900">Log Timesheet</h3><p className="text-xs text-slate-500">Total: <span className="font-bold text-brand-600">{totalHours}h</span></p></div>
                <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date *</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>

                {/* Entries */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-700">Time Entries</label>
                    <button type="button" onClick={addEntry} className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline"><Plus className="w-3 h-3"/> Add Row</button>
                  </div>
                  <div className="space-y-3">
                    {form.entries.map((entry,idx)=>(
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <select value={entry.project_id} onChange={e=>handleProjectChange(idx,e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none bg-white">
                            <option value="">Project (optional)</option>
                            {projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
                          </select>
                          <input type="number" step="0.5" min="0" max="24" value={entry.hours} onChange={e=>updateEntry(idx,"hours",e.target.value)} placeholder="Hrs" className="w-16 px-2 py-2 rounded-lg border border-slate-200 text-xs outline-none text-center font-bold"/>
                          {form.entries.length>1 && <button type="button" onClick={()=>removeEntry(idx)} className="w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3 h-3 text-red-400"/></button>}
                        </div>
                        <input value={entry.description} onChange={e=>updateEntry(idx,"description",e.target.value)} placeholder="What did you work on?" className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-brand-400"/>
                      </div>
                    ))}
                  </div>
                </div>

                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Remarks <span className="text-slate-400 font-normal">(optional)</span></label><input value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))} placeholder="Any notes for the day..." className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>

                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Submitting...":"Submit Timesheet"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
