"use client";

import { todayIST } from "@/lib/date";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, AlertCircle, X } from "lucide-react";
import { markAttendance } from "@/lib/api";
import { useDailyAttendanceReport, useEmployees, useInvalidate } from "@/lib/queries";

export default function DailyAttendancePage() {
  const today = todayIST();
  const [date, setDate] = useState(today);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markForm, setMarkForm] = useState({ employee_id:"", date:today, status:"present", check_in:"09:00", check_out:"18:00", reason:"" });
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const invalidate = useInvalidate();
  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null), type==="error"?6000:4000); };

  const { data: dailyReport, isLoading } = useDailyAttendanceReport({ date });
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.employees || [];

  const handleMark = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await markAttendance(markForm);
    if (res.ok) {
      showToast("Attendance marked");
      setShowMarkModal(false);
      invalidate("attendance-daily");
    } else showToast(res.data?.detail || "Failed", "error");
    setFormLoading(false);
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white"/>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowMarkModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
          <Plus className="w-3.5 h-3.5"/> Mark Attendance
        </motion.button>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : dailyReport ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {label:"Present", value:dailyReport.present_count||0,          color:"text-green-600"},
              {label:"Absent",  value:dailyReport.absent_count||0,           color:"text-red-500"  },
              {label:"Late",    value:dailyReport.late_count||(dailyReport.present||[]).filter(p=>p.is_late).length, color:"text-amber-600"},
              {label:"Total",   value:dailyReport.total_employees||0,        color:"text-blue-600" },
            ].map(s=>(
              <div key={s.label} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {(dailyReport.present||[]).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Present — {date}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-slate-50/80">
                    {["Employee","Check In","Check Out","Hours","Status","Location","Photos"].map(h=>
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2.5 whitespace-nowrap">{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(dailyReport.present||[]).map((p,i)=>(
                      <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{p.employee_name||p.name}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{p.check_in?new Date(p.check_in).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">{p.check_out?new Date(p.check_out).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</td>
                        <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{p.total_hours?`${p.total_hours.toFixed(1)}h`:"—"}</td>
                        <td className="px-4 py-2.5"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.is_late?"bg-amber-50 text-amber-600":"bg-green-50 text-green-600"}`}>{p.is_late?"Late":p.status||"Present"}</span></td>
                        <td className="px-4 py-2.5 text-[10px] text-slate-500">{p.check_in_location?.matched_office||"—"}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1.5">
                            {p.check_in_photo&&<img src={p.check_in_photo} alt="In" onClick={()=>setEnlargedPhoto(p.check_in_photo)} className="w-8 h-8 rounded-lg object-cover border border-green-200 cursor-pointer hover:ring-2 hover:ring-brand-400"/>}
                            {p.check_out_photo&&<img src={p.check_out_photo} alt="Out" onClick={()=>setEnlargedPhoto(p.check_out_photo)} className="w-8 h-8 rounded-lg object-cover border border-red-200 cursor-pointer hover:ring-2 hover:ring-brand-400"/>}
                            {!p.check_in_photo&&!p.check_out_photo&&<span className="text-[9px] text-slate-300">—</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-400">No data for {date}</p>
        </div>
      )}

      {/* Mark Attendance Modal */}
      <AnimatePresence>
        {showMarkModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={()=>setShowMarkModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Mark Attendance</h3>
                <button onClick={()=>setShowMarkModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
              </div>
              <form onSubmit={handleMark} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={markForm.employee_id} onChange={e=>setMarkForm(f=>({...f,employee_id:e.target.value}))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select employee...</option>
                    {employees.map(emp=><option key={emp.id||emp._id} value={emp.id||emp._id}>{emp.first_name} {emp.last_name} — {emp.department}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date *</label>
                    <input type="date" value={markForm.date} onChange={e=>setMarkForm(f=>({...f,date:e.target.value}))} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status</label>
                    <select value={markForm.status} onChange={e=>setMarkForm(f=>({...f,status:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="present">Present</option><option value="absent">Absent</option>
                      <option value="half_day">Half Day</option><option value="late">Late</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check In</label>
                    <input type="time" value={markForm.check_in} onChange={e=>setMarkForm(f=>({...f,check_in:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check Out</label>
                    <input type="time" value={markForm.check_out} onChange={e=>setMarkForm(f=>({...f,check_out:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason</label>
                  <textarea rows={2} value={markForm.reason} onChange={e=>setMarkForm(f=>({...f,reason:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">
                  {formLoading?"Marking...":"Mark Attendance"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo enlarge */}
      <AnimatePresence>
        {enlargedPhoto && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={()=>setEnlargedPhoto(null)}>
            <motion.div initial={{scale:0.8}} animate={{scale:1}} exit={{scale:0.8}} className="relative max-w-md w-full">
              <img src={enlargedPhoto} alt="Selfie" className="w-full rounded-2xl shadow-2xl"/>
              <button onClick={()=>setEnlargedPhoto(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600"/>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
