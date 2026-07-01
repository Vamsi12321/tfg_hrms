"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Plus, X, ChevronRight, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { createOKR, getOKRDetail, deleteOKR, listEmployees } from "@/lib/api";
import { useCycles, useOKRs, useInvalidate } from "@/lib/queries";

const statusCfg = {
  draft:     { cls:"bg-slate-50 text-slate-500 border-slate-200",    label:"Draft"     },
  active:    { cls:"bg-blue-50 text-blue-600 border-blue-200",       label:"Active"    },
  review:    { cls:"bg-amber-50 text-amber-600 border-amber-200",    label:"Review"    },
  completed: { cls:"bg-green-50 text-green-600 border-green-200",    label:"Completed" },
};

export default function OKRsPage() {
  const invalidate = useInvalidate();
  const { data: cycles = [] } = useCycles();
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [showCreateOKR, setShowCreateOKR] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [okrForm, setOkrForm] = useState({ employee_id:"", objectives:[] });

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  useEffect(() => {
    if (cycles.length > 0 && !selectedCycle)
      setSelectedCycle(cycles.find(c=>c.status==="active")||cycles[0]);
  }, [cycles]);

  useEffect(() => {
    listEmployees({limit:100}).then(r=>{ if(r.ok) setEmployees(r.data?.employees||[]); });
  }, []);

  const { data: okrData, isLoading } = useOKRs({ cycle_id: selectedCycle?.id, limit:50 });
  const okrs = okrData?.okrs || [];

  const handleViewDetail = async (okr) => {
    const res = await getOKRDetail(okr.id);
    if (res.ok && res.data) setShowDetail(res.data);
    else setShowDetail(okr);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this OKR?")) return;
    const res = await deleteOKR(id);
    if (res.ok) { showToast("OKR deleted"); invalidate("okrs"); }
    else showToast("Failed","error");
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {cycles.map(c=>(
            <button key={c.id} onClick={()=>setSelectedCycle(c)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${selectedCycle?.id===c.id?"bg-brand-600 text-white border-brand-600":"bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
              {c.name}
            </button>
          ))}
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowCreateOKR(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <Plus className="w-3.5 h-3.5"/> Assign OKR
        </motion.button>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : okrs.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Target className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No OKRs for {selectedCycle?.name||"this cycle"}</p>
          <button onClick={()=>setShowCreateOKR(true)} className="mt-3 text-xs font-bold text-brand-600 hover:underline">+ Assign OKR</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Team OKRs — {selectedCycle?.name}</h3>
            <span className="text-xs text-slate-400">{okrData?.total||0} total</span>
          </div>
          <div className="divide-y divide-slate-50">
            {okrs.map((okr,i)=>{
              const sc=statusCfg[okr.status]||statusCfg.draft;
              return (
                <motion.div key={okr.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.03}}
                  onClick={()=>handleViewDetail(okr)}
                  className="p-5 hover:bg-brand-50/30 transition-colors cursor-pointer flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {(okr.employee_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{okr.employee_name}</p>
                    <p className="text-xs text-slate-500">{okr.department} • {okr.objectives_count||0} objectives</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${(okr.overall_progress||0)>=80?"bg-green-500":(okr.overall_progress||0)>=50?"bg-blue-500":"bg-amber-500"}`} style={{width:`${okr.overall_progress||0}%`}}/>
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-8">{okr.overall_progress||0}%</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300"/>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* OKR Detail Modal */}
      <AnimatePresence>
        {showDetail&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowDetail(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">{showDetail.employee_name}&apos;s OKRs</h3><button onClick={()=>setShowDetail(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <div className="mb-4"><div className="flex items-center justify-between mb-2"><span className="text-xs font-bold text-slate-700">Overall Progress</span><span className="text-xs font-black text-brand-600">{showDetail.overall_progress||0}%</span></div><div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500" style={{width:`${showDetail.overall_progress||0}%`}}/></div></div>
              <div className="space-y-4">
                {(showDetail.objectives||[]).map((obj,i)=>(
                  <div key={i} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 mb-2">{obj.title}</p>
                    <div className="space-y-2">
                      {(obj.key_results||[]).map((kr,j)=>(
                        <div key={j}><div className="flex items-center justify-between text-[10px] text-slate-500 mb-1"><span>{kr.title}</span><span>{kr.current||0}/{kr.target||100} {kr.unit||""}</span></div><div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full rounded-full bg-brand-400" style={{width:`${kr.progress||0}%`}}/></div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create OKR Modal */}
      <AnimatePresence>
        {showCreateOKR&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreateOKR(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Assign OKR</h3><button onClick={()=>setShowCreateOKR(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <div className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee</label>
                  <select value={okrForm.employee_id} onChange={e=>setOkrForm(f=>({...f,employee_id:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select employee...</option>{employees.map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name}</option>)}
                  </select></div>
                <p className="text-xs text-slate-400">Full OKR assignment (objectives + key results) can be configured after selection.</p>
                <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} disabled={!okrForm.employee_id} onClick={()=>setShowCreateOKR(false)}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-40">Continue</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
