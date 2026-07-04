"use client";

import { todayIST } from "@/lib/date";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, X, AlertCircle, Ban, CalendarDays, Palmtree, Clock } from "lucide-react";
import { applyLeave, cancelLeave } from "@/lib/api";
import { useLeaveBalance, useLeaveConfig, useLeaves, useHolidays, useInvalidate } from "@/lib/queries";

const statusStyle = {
  approved:  { dot:"bg-green-500", text:"text-green-600", bg:"bg-green-50", label:"Approved"  },
  pending:   { dot:"bg-amber-500", text:"text-amber-600", bg:"bg-amber-50", label:"Pending"   },
  cancelled: { dot:"bg-slate-400", text:"text-slate-500", bg:"bg-slate-50", label:"Cancelled" },
  rejected:  { dot:"bg-red-500",   text:"text-red-600",   bg:"bg-red-50",   label:"Rejected"  },
};

export default function EmpLeavesOverviewPage() {
  const invalidate = useInvalidate();
  const { data: balances = [], isLoading: balLoading } = useLeaveBalance();
  const { data: leaveTypes = [] } = useLeaveConfig();
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data: leaves = [] } = useLeaves({ limit: 50, search, from_date: fromDate, to_date: toDate });
  const { data: holidays = [] } = useHolidays({ year: new Date().getFullYear(), limit: 100 });

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [applyForm, setApplyForm] = useState({ leave_type_code:"", start_date:"", end_date:"", reason:"", is_half_day:false, half_day_type:"first_half" });
  const [applyError, setApplyError] = useState("");

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),type==="error"?6000:4000); };

  const todayStr = todayIST();
  const upcomingHolidays = holidays.filter(h=>h.date>=todayStr).slice(0,5);
  const pendingCount = leaves.filter(l=>l.status==="pending").length;
  const approvedCount = leaves.filter(l=>l.status==="approved").length;

  const handleApply = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { leave_type_code:applyForm.leave_type_code, start_date:applyForm.start_date, end_date:applyForm.end_date, reason:applyForm.reason, is_half_day:applyForm.is_half_day };
    if (applyForm.is_half_day) payload.half_day_type = applyForm.half_day_type;
    const res = await applyLeave(payload);
    if (res.ok) { setApplyError(""); showToast("Leave request submitted!"); setShowApplyModal(false); setApplyForm({leave_type_code:"",start_date:"",end_date:"",reason:"",is_half_day:false,half_day_type:"first_half"}); invalidate("leaves"); invalidate("leave-balance"); }
    else { const err=typeof res.data?.detail==="string"?res.data.detail:Array.isArray(res.data?.detail)?res.data.detail.map(e=>e.msg).join(", "):"Failed to apply leave"; setApplyError(err); }
    setFormLoading(false);
  };

  const handleCancel = async (leaveId) => {
    const res = await cancelLeave(leaveId);
    if (res.ok) { showToast("Leave cancelled"); invalidate("leaves"); invalidate("leave-balance"); }
    else showToast(res.data?.detail||"Cannot cancel","error");
  };

  if (balLoading) return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>;

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 max-w-md ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4 flex-shrink-0"/>:<CheckCircle2 className="w-4 h-4 flex-shrink-0"/>} <span>{toast.msg}</span></motion.div>)}
      </AnimatePresence>

      {/* Stats + Apply button */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {label:"Total Balance",value:balances.reduce((s,b)=>s+(b.total===-1?0:b.balance),0),extra:"days",color:"from-brand-600 to-indigo-600",white:true},
            {label:"Pending",      value:pendingCount,  extra:"awaiting",  color:"",white:false,cls:"text-amber-600"},
            {label:"Approved",     value:approvedCount, extra:"this year", color:"",white:false,cls:"text-green-600"},
            {label:"Holidays",     value:holidays.length,extra:"this year",color:"",white:false,cls:"text-brand-600"},
          ].map((s,i)=>(
            <div key={i} className={`rounded-2xl p-4 border ${s.white?"bg-gradient-to-br "+s.color+" text-white shadow-lg border-transparent":"bg-white border-slate-100 shadow-sm"}`}>
              <p className={`text-[10px] font-medium ${s.white?"text-white/70":"text-slate-500"}`}>{s.label}</p>
              <p className={`text-2xl font-black mt-0.5 ${s.white?"text-white":s.cls}`}>{s.value}</p>
              <p className={`text-[10px] ${s.white?"text-white/60":"text-slate-400"}`}>{s.extra}</p>
            </div>
          ))}
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{setShowApplyModal(true);setApplyError("");}}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
          <Plus className="w-4 h-4"/> Apply Leave
        </motion.button>
      </div>

      {/* Balance + upcoming holidays */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-5">Leave Balance — {new Date().getFullYear()}</h3>
          <div className="space-y-4">
            {balances.filter(b=>!b.not_applicable).map((bal,i)=>{
              const total=bal.total===-1?999:bal.total;
              const used=bal.used||0;
              const available=bal.total===-1?"∞":bal.balance;
              const pct=total>0?Math.min((used/total)*100,100):0;
              return (
                <motion.div key={bal.leave_type_code||i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">{bal.leave_type_code}</span>
                      <span className="text-xs font-semibold text-slate-800">{bal.leave_type_name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs"><span className="text-slate-400">{used} used</span><span className="font-black text-green-600">{available}</span></div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{delay:0.3+i*0.05,duration:0.6}}
                      className={`h-full rounded-full ${pct>=80?"bg-red-400":pct>=50?"bg-amber-400":"bg-green-500"}`}/>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">Upcoming Holidays</h3></div>
          <div className="p-3 space-y-2">
            {upcomingHolidays.length===0 ? <p className="text-xs text-slate-400 text-center py-6">No upcoming holidays</p>
            : upcomingHolidays.map((h,i)=>(
              <motion.div key={h.id||i} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                className={`flex items-center gap-3 p-3 rounded-xl ${h.type==="mandatory"?"bg-red-50/70":"bg-blue-50/70"}`}>
                <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${h.type==="mandatory"?"bg-red-100":"bg-blue-100"}`}>
                  <span className={`text-[8px] font-bold leading-none ${h.type==="mandatory"?"text-red-500":"text-blue-500"}`}>{new Date(h.date+"T00:00:00").toLocaleDateString("en-US",{month:"short"}).toUpperCase()}</span>
                  <span className={`text-sm font-black leading-tight ${h.type==="mandatory"?"text-red-700":"text-blue-700"}`}>{new Date(h.date+"T00:00:00").getDate()}</span>
                </div>
                <div className="min-w-0"><p className="text-xs font-bold text-slate-800 truncate">{h.name}</p><p className="text-[10px] text-slate-500">{new Date(h.date+"T00:00:00").toLocaleDateString("en-US",{weekday:"short"})}{h.state?` • ${h.state}`:""}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Leave history */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">Recent Leave Requests</h3>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:border-brand-400"/>
            <span className="text-slate-400 text-[10px]">—</span>
            <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:border-brand-400"/>
            <input type="text" placeholder="Search..." value={search} onChange={e=>setSearch(e.target.value)} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:border-brand-400 w-32"/>
          </div>
        </div>
        {leaves.length===0 ? (
          <div className="p-10 text-center"><Palmtree className="w-8 h-8 text-slate-200 mx-auto mb-2"/><p className="text-xs text-slate-400">No leave requests yet</p></div>
        ) : (
          <div className="divide-y divide-slate-50 max-h-[400px] overflow-y-auto">
            {leaves.map((leave,i)=>{
              const sc=statusStyle[leave.status]||{dot:"bg-slate-400",text:"text-slate-500",bg:"bg-slate-50",label:leave.status};
              return (
                <div key={leave.id||i} className="p-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-slate-800">{leave.leave_type_name||leave.leave_type_code}</p>
                        {leave.is_half_day&&<span className="text-[8px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">½ Day</span>}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">{leave.start_date} → {leave.end_date} • {leave.days}d{leave.reason?` • "${leave.reason}"`:""}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text}`}>{sc.label}</span>
                    {leave.status==="pending"&&<button onClick={()=>handleCancel(leave.id)} className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0"><Ban className="w-3.5 h-3.5 text-red-500"/></button>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApplyModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowApplyModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Apply for Leave</h3><button onClick={()=>setShowApplyModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleApply} className="space-y-4">
                {applyError&&<div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5"><AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5"/><p className="text-xs font-semibold text-red-700">{applyError}</p></div>}
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type *</label>
                  <select value={applyForm.leave_type_code} onChange={e=>setApplyForm(f=>({...f,leave_type_code:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select leave type...</option>
                    {leaveTypes.filter(lt=>lt.is_active!==false).map(lt=>{ const bal=balances.find(b=>b.leave_type_code===lt.code); const av=bal?(bal.total===-1?"∞":bal.balance):"—"; return <option key={lt.code} value={lt.code}>{lt.name} ({lt.code}) — {av} left</option>; })}
                  </select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">From *</label><input type="date" value={applyForm.start_date} onChange={e=>setApplyForm(f=>({...f,start_date:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">To *</label><input type="date" value={applyForm.end_date} onChange={e=>setApplyForm(f=>({...f,end_date:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={applyForm.is_half_day} onChange={e=>setApplyForm(f=>({...f,is_half_day:e.target.checked}))} className="w-4 h-4 rounded border-slate-300"/><span className="text-xs font-medium text-slate-700">Half Day</span></label>
                {applyForm.is_half_day&&<select value={applyForm.half_day_type} onChange={e=>setApplyForm(f=>({...f,half_day_type:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"><option value="first_half">First Half</option><option value="second_half">Second Half</option></select>}
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason</label><textarea rows={2} value={applyForm.reason} onChange={e=>setApplyForm(f=>({...f,reason:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Submitting...":"Submit Leave Request"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
