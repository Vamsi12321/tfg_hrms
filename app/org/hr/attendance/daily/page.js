"use client";

import { todayIST } from "@/lib/date";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, CheckCircle2, AlertCircle, X, Search, Users, XCircle, Clock } from "lucide-react";
import { markAttendance } from "@/lib/api";
import { useDailyAttendanceReport, useEmployees, useInvalidate, useDepartments } from "@/lib/queries";
import ExportButton from "@/components/ExportButton";

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
  const { data: deptList = [] } = useDepartments();

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const getDept = (id, name) => {
    const emp = employees.find(e => (e.id || e._id) === id || `${e.first_name} ${e.last_name}`.trim() === name?.trim());
    return emp ? emp.department : "";
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const p = name.split(" ");
    if (p.length >= 2) return p[0][0] + p[1][0];
    return name.substring(0,2).toUpperCase();
  };

  const presentEmployees = (dailyReport?.present || []).map(p => ({ ...p, department: getDept(p.employee_id, p.employee_name || p.name) })).filter(p => {
    const matchSearch = !search || (p.employee_name || p.name || "").toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || p.department === deptFilter;
    return matchSearch && matchDept;
  });

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
    <div className="space-y-6 pb-10">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>
            {toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Daily Attendance</h3>
          <p className="text-sm text-slate-500">Monitor today's presence and check-in times</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-sm">
              <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 outline-none" />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-sm">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name..."
                className="bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none w-32 md:w-48" />
            </div>
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-sm cursor-pointer">
              <option value="">All Departments</option>
              {deptList.map(d => <option key={d.id||d.name} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <ExportButton 
              data={presentEmployees} 
              filename={`attendance_${date}.csv`}
              columns={[
                { header: "Employee Name", key: "employee_name", render: p => p.employee_name || p.name },
                { header: "Department", key: "department" },
                { header: "Check In", key: "check_in", render: p => p.check_in ? new Date(p.check_in).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "" },
                { header: "Check Out", key: "check_out", render: p => p.check_out ? new Date(p.check_out).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "" },
                { header: "Total Hours", key: "total_hours", render: p => p.total_hours ? p.total_hours.toFixed(1) : "" },
                { header: "Status", key: "status", render: p => p.is_late ? "Late" : (p.status || "Present") }
              ]}
            />
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowMarkModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25">
              <Plus className="w-4 h-4"/> Mark Attendance
            </motion.button>
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Present", value: dailyReport?.present_count || 0, color: "text-emerald-700", bg: "bg-emerald-50/60", border: "border-emerald-100/40", dot: "bg-emerald-500" },
          { label: "Absent", value: dailyReport?.absent_count || 0, color: "text-rose-700", bg: "bg-rose-50/60", border: "border-rose-100/40", dot: "bg-rose-500" },
          { label: "Late", value: dailyReport?.late_count || (dailyReport?.present || []).filter(p=>p.is_late).length, color: "text-amber-700", bg: "bg-amber-50/60", border: "border-amber-100/40", dot: "bg-amber-500" },
          { label: "Total", value: dailyReport?.total_employees || 0, color: "text-indigo-700", bg: "bg-indigo-50/60", border: "border-indigo-100/40", dot: "bg-indigo-500" },
        ].map(k => (
          <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
            <div>
              <p className={`text-[10px] font-bold ${k.color.replace('700', '500')} uppercase tracking-wider`}>{k.label}</p>
              <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
            </div>
            <span className={`w-3 h-3 rounded-full ${k.dot}`} />
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : dailyReport ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {(dailyReport.present||[]).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                  {["Employee","Check In","Check Out","Hours","Status","Location","Photos"].map(h=>
                    <th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {presentEmployees.map((p,i)=>(
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-600">
                            {getInitials(p.employee_name || p.name)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{p.employee_name||p.name}</p>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5">{p.department || "No Dept"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{p.check_in?new Date(p.check_in).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">{p.check_out?new Date(p.check_out).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"—"}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-700">{p.total_hours?`${p.total_hours.toFixed(1)}h`:"—"}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.is_late?"bg-amber-50 text-amber-700 border border-amber-200/50":"bg-emerald-50 text-emerald-700 border border-emerald-200/50"}`}>
                          {p.is_late ? "Late" : (p.status || "Present")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">{p.check_in_location?.matched_office||"—"}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {p.check_in_photo&&<img src={p.check_in_photo} alt="In" onClick={()=>setEnlargedPhoto(p.check_in_photo)} className="w-9 h-9 rounded-lg object-cover border-2 border-emerald-100 cursor-pointer hover:border-emerald-300 transition-colors shadow-sm"/>}
                          {p.check_out_photo&&<img src={p.check_out_photo} alt="Out" onClick={()=>setEnlargedPhoto(p.check_out_photo)} className="w-9 h-9 rounded-lg object-cover border-2 border-rose-100 cursor-pointer hover:border-rose-300 transition-colors shadow-sm"/>}
                          {!p.check_in_photo&&!p.check_out_photo&&<span className="text-xs text-slate-300">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Users className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-500">No attendance marked today.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-16 border border-slate-100 shadow-sm text-center">
          <p className="text-sm font-semibold text-slate-400">No data for {date}</p>
        </div>
      )}

      {/* Mark Attendance Modal */}
      <AnimatePresence>
        {showMarkModal && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={()=>setShowMarkModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 border border-brand-100/50 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Mark Attendance</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Manually record an entry</p>
                  </div>
                </div>
                <button onClick={() => setShowMarkModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <form id="mark-form" onSubmit={handleMark} className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Employee *</label>
                    <select value={markForm.employee_id} onChange={e=>setMarkForm(f=>({...f,employee_id:e.target.value}))} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white cursor-pointer transition-all">
                      <option value="">Select employee...</option>
                      {employees.map(emp=><option key={emp.id||emp._id} value={emp.id||emp._id}>{emp.first_name} {emp.last_name} — {emp.department || "No Dept"}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Date *</label>
                      <input type="date" value={markForm.date} onChange={e=>setMarkForm(f=>({...f,date:e.target.value}))} required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Status</label>
                      <select value={markForm.status} onChange={e=>setMarkForm(f=>({...f,status:e.target.value}))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 bg-white cursor-pointer transition-all">
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="half_day">Half Day</option>
                        <option value="late">Late</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Check In Time</label>
                      <input type="time" value={markForm.check_in} onChange={e=>setMarkForm(f=>({...f,check_in:e.target.value}))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white"/>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Check Out Time</label>
                      <input type="time" value={markForm.check_out} onChange={e=>setMarkForm(f=>({...f,check_out:e.target.value}))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Reason / Notes</label>
                    <textarea rows={2} value={markForm.reason} onChange={e=>setMarkForm(f=>({...f,reason:e.target.value}))}
                      placeholder="Optional remarks..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all bg-white resize-none"/>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 flex gap-3 bg-slate-50">
                <button type="button" onClick={() => setShowMarkModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-white transition-colors">
                  Cancel
                </button>
                <motion.button type="submit" form="mark-form" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/25 disabled:opacity-70 flex items-center justify-center gap-2">
                  {formLoading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Marking...</> : <><CheckCircle2 className="w-4 h-4" /> Save Entry</>}
                </motion.button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo enlarge */}
      <AnimatePresence>
        {enlargedPhoto && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={()=>setEnlargedPhoto(null)}>
            <motion.div initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.8, opacity:0}} className="relative max-w-md w-full">
              <img src={enlargedPhoto} alt="Selfie" className="w-full rounded-2xl shadow-2xl"/>
              <button onClick={()=>setEnlargedPhoto(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-600"/>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
