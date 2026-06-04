"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, Calendar, Plus, X,
  Search, Filter, Download, Eye, MessageSquare,
  Palmtree, Stethoscope, Coffee, Home, Users
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { employees } from "@/lib/fakeData";

const initialRequests = [
  { id:"LR001", employee:"Kavitha Menon", dept:"Engineering", type:"Sick Leave",    from:"2025-05-20", to:"2025-05-23", days:4, status:"pending",  reason:"Medical appointment and recovery",     appliedOn:"2025-05-18" },
  { id:"LR002", employee:"Sneha Reddy",   dept:"Marketing",   type:"Casual Leave",  from:"2025-05-26", to:"2025-05-27", days:2, status:"pending",  reason:"Personal work",                        appliedOn:"2025-05-20" },
  { id:"LR003", employee:"Arjun Nair",    dept:"Sales",       type:"Earned Leave",  from:"2025-06-01", to:"2025-06-05", days:5, status:"approved", reason:"Family vacation",                      appliedOn:"2025-05-15" },
  { id:"LR004", employee:"Rohan Gupta",   dept:"Engineering", type:"Work From Home", from:"2025-05-23", to:"2025-05-23", days:1, status:"approved", reason:"Internet installation at new apartment",appliedOn:"2025-05-22" },
  { id:"LR005", employee:"Rahul Verma",   dept:"Engineering", type:"Earned Leave",  from:"2025-06-10", to:"2025-06-12", days:3, status:"pending",  reason:"Wedding function",                     appliedOn:"2025-05-25" },
  { id:"LR006", employee:"Deepak Joshi",  dept:"Finance",     type:"Sick Leave",    from:"2025-05-28", to:"2025-05-28", days:1, status:"rejected", reason:"Not feeling well",                     appliedOn:"2025-05-27" },
];

const leaveBalance = [
  { type:"Earned Leave",  total:18, used:5,  color:"blue",   icon:Palmtree },
  { type:"Sick Leave",    total:12, used:3,  color:"red",    icon:Stethoscope },
  { type:"Casual Leave",  total:8,  used:2,  color:"amber",  icon:Coffee },
  { type:"Work From Home",total:24, used:8,  color:"green",  icon:Home },
];

export default function LeavesPage() {
  const [requests, setRequests]     = useState(initialRequests);
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast]           = useState(null);
  const [addForm, setAddForm]       = useState({ employee:"", type:"Earned Leave", from:"", to:"", reason:"" });

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleApprove = (id) => {
    setRequests(prev => prev.map(r => r.id===id ? {...r, status:"approved"} : r));
    showToast("Leave request approved successfully");
    setShowDetailModal(null);
  };

  const handleReject = (id) => {
    setRequests(prev => prev.map(r => r.id===id ? {...r, status:"rejected"} : r));
    setShowRejectModal(null);
    setRejectReason("");
    showToast("Leave request rejected", "error");
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newReq = {
      id: `LR00${requests.length+1}`,
      employee: addForm.employee,
      dept: employees.find(e => e.name===addForm.employee)?.department || "—",
      type: addForm.type,
      from: addForm.from,
      to: addForm.to,
      days: Math.max(1, Math.round((new Date(addForm.to)-new Date(addForm.from))/(1000*60*60*24))+1),
      status: "pending",
      reason: addForm.reason,
      appliedOn: new Date().toISOString().split("T")[0],
    };
    setRequests(prev => [newReq, ...prev]);
    setShowAddModal(false);
    setAddForm({ employee:"", type:"Earned Leave", from:"", to:"", reason:"" });
    showToast("Leave request added");
  };

  const filtered = requests.filter(r => {
    const matchSearch = r.employee.toLowerCase().includes(search.toLowerCase()) || r.dept.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter==="all" || r.status===statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCfg = {
    pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200",   label:"Pending"  },
    approved: { cls:"bg-green-50 text-green-600 border-green-200",   label:"Approved" },
    rejected: { cls:"bg-red-50 text-red-600 border-red-200",         label:"Rejected" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Leave Management" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${toast.type==="error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:"Pending",  value: requests.filter(r=>r.status==="pending").length,  color:"amber" },
            { label:"Approved", value: requests.filter(r=>r.status==="approved").length, color:"green" },
            { label:"Rejected", value: requests.filter(r=>r.status==="rejected").length, color:"red"   },
            { label:"Total",    value: requests.length,                                  color:"blue"  },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter(s.label==="Total" ? "all" : s.label.toLowerCase())}>
              <p className={`text-2xl font-black text-${s.color}-600`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Leave balance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {leaveBalance.map((leave, i) => {
            const Icon = leave.icon;
            const pct = Math.round((leave.used/leave.total)*100);
            return (
              <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1+i*0.07 }}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg bg-${leave.color}-50 flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 text-${leave.color}-500`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{leave.used}/{leave.total}</span>
                </div>
                <p className="text-xs font-bold text-slate-800 mb-2">{leave.type}</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ delay:0.4+i*0.1, duration:0.8 }}
                    className={`h-full rounded-full bg-${leave.color}-500`} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{leave.total-leave.used} days left</p>
              </motion.div>
            );
          })}
        </div>

        {/* Table */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">Leave Requests</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search employee..."
                  className="bg-transparent text-xs outline-none w-32 text-slate-700" />
              </div>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none">
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20">
                <Plus className="w-3.5 h-3.5" /> Add Request
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
                  {["Employee","Leave Type","Duration","Days","Applied On","Status","Actions"].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map((req, i) => {
                    const sc = statusCfg[req.status];
                    return (
                      <motion.tr key={req.id} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ delay:i*0.03 }}
                        className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold">
                              {req.employee.split(" ").map(n=>n[0]).join("")}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{req.employee}</p>
                              <p className="text-[10px] text-slate-400">{req.dept}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 font-medium">{req.type}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{req.from} → {req.to}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">{req.days}d</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{req.appliedOn}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setShowDetailModal(req)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            {req.status==="pending" && (
                              <>
                                <button onClick={() => handleApprove(req.id)}
                                  className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                </button>
                                <button onClick={() => setShowRejectModal(req)}
                                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Leave Request Detail</h3>
                <button onClick={() => setShowDetailModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  ["Employee",  showDetailModal.employee],
                  ["Department",showDetailModal.dept],
                  ["Leave Type",showDetailModal.type],
                  ["Duration",  `${showDetailModal.from} → ${showDetailModal.to} (${showDetailModal.days} days)`],
                  ["Applied On",showDetailModal.appliedOn],
                  ["Reason",    showDetailModal.reason],
                ].map(([k,v]) => (
                  <div key={k} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase w-24 flex-shrink-0 mt-0.5">{k}</span>
                    <span className="text-sm text-slate-800 font-medium">{v}</span>
                  </div>
                ))}
              </div>
              {showDetailModal.status==="pending" && (
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={() => handleApprove(showDetailModal.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </motion.button>
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                    onClick={() => { setShowRejectModal(showDetailModal); setShowDetailModal(null); }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRejectModal(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Reject Leave Request</h3>
                <button onClick={() => setShowRejectModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Rejecting <strong>{showRejectModal?.employee}</strong>'s {showRejectModal?.type}</p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason for rejection</label>
                <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 resize-none"
                  placeholder="Provide a reason..." required />
              </div>
              <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                onClick={() => handleReject(showRejectModal.id)}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                Confirm Rejection
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Leave Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add Leave Request</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee</label>
                  <select value={addForm.employee} onChange={e => setAddForm(f => ({...f, employee:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.name}>{e.name} — {e.department}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type</label>
                  <select value={addForm.type} onChange={e => setAddForm(f => ({...f, type:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option>Earned Leave</option>
                    <option>Sick Leave</option>
                    <option>Casual Leave</option>
                    <option>Work From Home</option>
                    <option>Maternity Leave</option>
                    <option>Paternity Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From</label>
                    <input type="date" value={addForm.from} onChange={e => setAddForm(f => ({...f, from:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To</label>
                    <input type="date" value={addForm.to} onChange={e => setAddForm(f => ({...f, to:e.target.value}))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason</label>
                  <textarea rows={3} value={addForm.reason} onChange={e => setAddForm(f => ({...f, reason:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                    placeholder="Reason for leave..." required />
                </div>
                <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20">
                  Submit Request
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
