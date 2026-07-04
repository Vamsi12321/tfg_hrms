"use client";

import { todayIST } from "@/lib/date";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Plus, X, CheckCircle2, AlertCircle,
  AlertTriangle, Calendar
} from "lucide-react";
import { submitDailyUpdate } from "@/lib/api";
import { useMyDailyUpdates, useProjects, useInvalidate } from "@/lib/queries";

export default function EmpDailyUpdatesPage() {
  const invalidate = useInvalidate();
  const { data: updData, isLoading } = useMyDailyUpdates();
  const updates = updData?.updates || [];
  const { data: projData } = useProjects();
  const projects = projData?.projects || [];

  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ date: todayIST(), yesterday:"", today:"", blockers:"", project_id:"" });
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.today.trim()) { showToast("'Today' field is required","error"); return; }
    setFormLoading(true);
    const payload = { date:form.date, yesterday:form.yesterday||"", today:form.today, blockers:form.blockers||undefined, project_id:form.project_id||undefined };
    const res = await submitDailyUpdate(payload);
    if (res.ok) { showToast("Daily update submitted!"); setShowCreate(false); setForm({date:todayIST(),yesterday:"",today:"",blockers:"",project_id:""}); invalidate("my-daily-updates"); }
    else showToast(typeof res.data?.detail==="string"?res.data.detail:"Failed to submit","error");
    setFormLoading(false);
  };

  // Check if today already has an update
  const todayStr = todayIST();
  const todayDone = updates.some(u=>u.date===todayStr);

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Header + today's status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {todayDone ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-500"/>
              <span className="text-xs font-bold text-green-700">Today&apos;s update submitted</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-500"/>
              <span className="text-xs font-bold text-amber-700">Today&apos;s update pending</span>
            </div>
          )}
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <Plus className="w-3.5 h-3.5"/> Post Update
        </motion.button>
      </div>

      {/* Past updates */}
      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : updates.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No daily updates posted yet</p>
          <button onClick={()=>setShowCreate(true)} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Post your first update</button>
        </div>
      ) : (
        <div className="space-y-3">
          {updates.map((u,i)=>{
            const hasBlocker = u.blockers && u.blockers.trim().length > 0;
            return (
              <motion.div key={u.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                className={`bg-white rounded-2xl p-5 border shadow-sm ${hasBlocker?"border-amber-200":"border-slate-100"}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-brand-600"/>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{new Date(u.date+"T00:00:00").toLocaleDateString("en-IN",{weekday:"short",day:"numeric",month:"short"})}</p>
                    {u.project_name && <p className="text-[10px] text-brand-600 font-semibold">{u.project_name}</p>}
                  </div>
                </div>

                <div className="space-y-2.5 ml-12">
                  {u.yesterday && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-green-50 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckCircle2 className="w-3 h-3 text-green-500"/></div>
                      <div><p className="text-[9px] font-bold text-slate-400 uppercase">Yesterday</p><p className="text-xs text-slate-700 mt-0.5">{u.yesterday}</p></div>
                    </div>
                  )}
                  {u.today && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5"><Calendar className="w-3 h-3 text-blue-500"/></div>
                      <div><p className="text-[9px] font-bold text-slate-400 uppercase">Today</p><p className="text-xs text-slate-700 mt-0.5">{u.today}</p></div>
                    </div>
                  )}
                  {hasBlocker && (
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5"><AlertTriangle className="w-3 h-3 text-amber-500"/></div>
                      <div><p className="text-[9px] font-bold text-amber-600 uppercase">Blocker</p><p className="text-xs text-amber-700 font-medium mt-0.5">{u.blockers}</p></div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Daily Update Modal */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Daily Standup Update</h3><button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Project</label>
                    <select value={form.project_id} onChange={e=>setForm(f=>({...f,project_id:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white">
                      <option value="">General</option>{projects.map(p=><option key={p.id||p._id} value={p.id||p._id}>{p.name}</option>)}
                    </select></div>
                </div>

                {/* Yesterday */}
                <div className="border-l-3 border-green-400 pl-3">
                  <label className="text-[10px] font-bold text-green-600 mb-1 flex items-center gap-1 block"><CheckCircle2 className="w-3 h-3"/> Yesterday</label>
                  <textarea rows={2} value={form.yesterday} onChange={e=>setForm(f=>({...f,yesterday:e.target.value}))} placeholder="What did you complete?"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-green-300 resize-none"/>
                </div>

                {/* Today */}
                <div className="border-l-3 border-blue-400 pl-3">
                  <label className="text-[10px] font-bold text-blue-600 mb-1 flex items-center gap-1 block"><Calendar className="w-3 h-3"/> Today <span className="text-red-500">*</span></label>
                  <textarea rows={2} value={form.today} onChange={e=>setForm(f=>({...f,today:e.target.value}))} required placeholder="What are you working on?"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-blue-300 resize-none"/>
                </div>

                {/* Blockers */}
                <div className="border-l-3 border-amber-400 pl-3">
                  <label className="text-[10px] font-bold text-amber-600 mb-1 flex items-center gap-1 block"><AlertTriangle className="w-3 h-3"/> Blockers</label>
                  <textarea rows={2} value={form.blockers} onChange={e=>setForm(f=>({...f,blockers:e.target.value}))} placeholder="Any blockers? Leave empty if none"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-300 resize-none"/>
                </div>

                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Submitting...":"Post Update"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
