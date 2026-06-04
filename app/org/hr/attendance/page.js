"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, XCircle, Clock, Home, AlertTriangle,
  Calendar, MapPin, Wifi, Fingerprint, Camera, X,
  Navigation, Users, Download, Filter, Search
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { employees, attendanceToday, shifts } from "@/lib/fakeData";

const todayLogData = [
  { id:"EMP001", name:"Rahul Verma", department:"Engineering", checkIn:"09:02 AM", checkOut:null, method:"Biometric", location:"Office - Floor 2", status:"present", isLate:false },
  { id:"EMP002", name:"Ananya Patel", department:"Design", checkIn:"09:15 AM", checkOut:null, method:"Face ID", location:"Office - Floor 3", status:"present", isLate:false },
  { id:"EMP003", name:"Vikram Singh", department:"Engineering", checkIn:"08:55 AM", checkOut:null, method:"Biometric", location:"Office - Floor 2", status:"present", isLate:false },
  { id:"EMP004", name:"Sneha Reddy", department:"Marketing", checkIn:"09:48 AM", checkOut:null, method:"WiFi", location:"Office - Floor 1", status:"late", isLate:true },
  { id:"EMP005", name:"Arjun Nair", department:"Sales", checkIn:"09:05 AM", checkOut:null, method:"Geo-fence", location:"Remote - Home", status:"wfh", isLate:false },
  { id:"EMP006", name:"Kavitha Menon", department:"Engineering", checkIn:null, checkOut:null, method:"—", location:"—", status:"on-leave", isLate:false },
  { id:"EMP007", name:"Deepak Joshi", department:"Finance", checkIn:"09:00 AM", checkOut:null, method:"Biometric", location:"Office - Floor 2", status:"present", isLate:false },
  { id:"EMP008", name:"Meera Iyer", department:"HR", checkIn:"08:50 AM", checkOut:null, method:"Face ID", location:"Office - Floor 2", status:"present", isLate:false },
  { id:"EMP009", name:"Rohan Gupta", department:"Engineering", checkIn:"09:10 AM", checkOut:null, method:"WiFi", location:"Remote - Home", status:"wfh", isLate:false },
  { id:"EMP010", name:"Pooja Deshmukh", department:"Product", checkIn:"09:35 AM", checkOut:null, method:"Geo-fence", location:"Office - Floor 3", status:"late", isLate:true },
  { id:"EMP011", name:"Karthik Rajan", department:"Engineering", checkIn:"09:00 AM", checkOut:null, method:"Biometric", location:"Office - Floor 2", status:"present", isLate:false },
  { id:"EMP012", name:"Nisha Agarwal", department:"Legal", checkIn:null, checkOut:null, method:"—", location:"—", status:"absent", isLate:false },
];

const methodIcons = {
  "Biometric": Fingerprint,
  "Geo-fence": MapPin,
  "Face ID": Camera,
  "WiFi": Wifi,
};

export default function AttendancePage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({ employee:"", date:"", checkIn:"", checkOut:"", reason:"" });
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = todayLogData.filter(log => {
    const matchSearch = log.name.toLowerCase().includes(search.toLowerCase()) || log.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || log.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setShowManualModal(false);
    showToast("Manual attendance marked successfully");
    setManualForm({ employee:"", date:"", checkIn:"", checkOut:"", reason:"" });
  };

  const statusConfig = {
    present: { label:"Present", cls:"bg-green-50 text-green-600" },
    late: { label:"Late", cls:"bg-orange-50 text-orange-600" },
    "on-leave": { label:"On Leave", cls:"bg-amber-50 text-amber-600" },
    absent: { label:"Absent", cls:"bg-red-50 text-red-600" },
    wfh: { label:"WFH", cls:"bg-blue-50 text-blue-600" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Attendance" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label:"Present", value:attendanceToday.present, icon:CheckCircle2, color:"green" },
            { label:"Absent", value:attendanceToday.absent, icon:XCircle, color:"red" },
            { label:"On Leave", value:attendanceToday.onLeave, icon:Clock, color:"amber" },
            { label:"WFH", value:attendanceToday.wfh, icon:Home, color:"blue" },
            { label:"Late", value:attendanceToday.late, icon:AlertTriangle, color:"orange" },
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setFilterStatus(stat.label.toLowerCase().replace(" ",""))}>
                <Icon className={`w-5 h-5 text-${stat.color}-500 mx-auto mb-2`} />
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                <p className="text-[10px] text-slate-500 font-medium">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Shifts */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Active Shifts</h3>
          <div className="grid sm:grid-cols-3 gap-3">
            {shifts.map((shift, i) => (
              <div key={i} className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100">
                <p className="text-sm font-bold text-slate-800">{shift.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{shift.time}</p>
                <p className="text-xs text-brand-600 font-semibold mt-2">{shift.employees} employees</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Anomaly */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">AI Anomaly Detected</h4>
              <p className="text-xs text-amber-700 mt-0.5">Sneha Reddy has been arriving late 4 out of last 5 days. Pooja Deshmukh shows similar pattern this week. Consider a check-in conversation.</p>
            </div>
          </div>
        </motion.div>

        {/* Table Controls */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.35 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-slate-900">Today's Log</h3>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">June 3, 2025</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="bg-transparent text-xs outline-none w-28 text-slate-700" />
              </div>
              {/* Filter */}
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400">
                <option value="all">All Status</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="absent">Absent</option>
                <option value="on-leave">On Leave</option>
                <option value="wfh">WFH</option>
              </select>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => setShowManualModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Manual
              </motion.button>
              <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  {["Employee","Check In","Check Out","Duration","Method","Location","Status","Action"].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((log, i) => {
                  const MethodIcon = methodIcons[log.method] || Fingerprint;
                  const sc = statusConfig[log.status] || statusConfig.present;
                  return (
                    <motion.tr key={log.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.02 }}
                      className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold">
                            {log.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">{log.name}</p>
                            <p className="text-[10px] text-slate-400">{log.department}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium">{log.checkIn || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-700 font-medium">{log.checkOut || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{log.checkIn && !log.checkOut ? "In progress" : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {log.method !== "—" && <MethodIcon className="w-3.5 h-3.5 text-slate-400" />}
                          <span className="text-xs text-slate-600">{log.method}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {log.location !== "—" && <MapPin className="w-3 h-3 text-slate-300" />}
                          <span className="text-xs text-slate-600">{log.location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${sc.cls}`}>{sc.label}</span>
                      </td>
                      <td className="px-4 py-3">
                        {log.status === "absent" && (
                          <button onClick={() => { setManualForm(f => ({...f, employee: log.name})); setShowManualModal(true); }}
                            className="text-[10px] font-bold text-brand-600 hover:underline">Mark Present</button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Manual Attendance Modal */}
      <AnimatePresence>
        {showManualModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowManualModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Mark Manual Attendance</h3>
                <button onClick={() => setShowManualModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee</label>
                  <select value={manualForm.employee} onChange={e => setManualForm(f => ({...f, employee: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.name}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date</label>
                  <input type="date" value={manualForm.date} onChange={e => setManualForm(f => ({...f, date: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check In</label>
                    <input type="time" value={manualForm.checkIn} onChange={e => setManualForm(f => ({...f, checkIn: e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check Out</label>
                    <input type="time" value={manualForm.checkOut} onChange={e => setManualForm(f => ({...f, checkOut: e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason for Manual Entry</label>
                  <textarea rows={3} value={manualForm.reason} onChange={e => setManualForm(f => ({...f, reason: e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                    placeholder="e.g. Device malfunction, forgot to check in..." required />
                </div>
                <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20">
                  Submit
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
