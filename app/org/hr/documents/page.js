"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Search, Download, Eye, X, Plus,
  Brain, AlertTriangle, CheckCircle2, Clock, User,
  ChevronDown, Shield, BookOpen, File, Bell, Filter
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { documents, docRequests, newJoineeAlerts, employees } from "@/lib/fakeData";

const statusCfg = {
  pending:  { cls: "bg-amber-50 text-amber-600 border-amber-200",  label: "Pending"  },
  uploaded: { cls: "bg-blue-50 text-blue-600 border-blue-200",     label: "Uploaded" },
  verified: { cls: "bg-green-50 text-green-600 border-green-200",  label: "Verified" },
};

const docTypeIcons = {
  Policy: { icon: Shield, color: "blue" }, Report: { icon: FileText, color: "purple" },
  Benefits: { icon: BookOpen, color: "green" }, Template: { icon: File, color: "amber" },
};

export default function DocumentsPage() {
  const [tab, setTab]                     = useState("requests");
  const [requests, setRequests]           = useState(docRequests);
  const [selectedEmp, setSelectedEmp]     = useState("all");
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showUploadModal, setShowUploadModal]   = useState(null);
  const [reqForm, setReqForm]             = useState({ employee: "", docType: "", dueDate: "", note: "" });
  const [toast, setToast]                 = useState(null);
  const [search, setSearch]               = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendRequest = (e) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === reqForm.employee);
    if (!emp) return;
    const newReq = {
      id: `DR00${requests.length + 1}`,
      employeeId: emp.id, employeeName: emp.name,
      docType: reqForm.docType, status: "pending",
      requestedOn: new Date().toISOString().split("T")[0],
      dueDate: reqForm.dueDate, note: reqForm.note, uploadedFile: null,
    };
    setRequests(prev => [newReq, ...prev]);
    setShowRequestModal(false);
    setReqForm({ employee: "", docType: "", dueDate: "", note: "" });
    showToast(`Document request sent to ${emp.name}`);
  };

  const handleMarkVerified = (id) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "verified" } : r));
    showToast("Document marked as verified");
  };

  const filteredRequests = requests.filter(r => {
    const matchEmp    = selectedEmp === "all" || r.employeeId === selectedEmp;
    const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      r.docType.toLowerCase().includes(search.toLowerCase());
    return matchEmp && matchSearch;
  });

  const pendingCount   = requests.filter(r => r.status === "pending").length;
  const uploadedCount  = requests.filter(r => r.status === "uploaded").length;
  const verifiedCount  = requests.filter(r => r.status === "verified").length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Documents" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* AI New Joinee Alert */}
        {newJoineeAlerts.length > 0 && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold bg-yellow-400/20 text-yellow-200 px-2 py-0.5 rounded-full border border-yellow-400/30">AI Alert</span>
                  <span className="text-xs text-purple-200">New Joinee Document Incomplete</span>
                </div>
                {newJoineeAlerts.map((alert, i) => (
                  <div key={i}>
                    <p className="text-sm font-bold">
                      {alert.employeeName} is missing {alert.missingDocs.length} required document{alert.missingDocs.length > 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {alert.missingDocs.map((doc, j) => (
                        <span key={j} className="text-[10px] font-semibold bg-white/10 border border-white/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-yellow-300" /> {doc}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-purple-200 mt-2">Due in {alert.daysLeft} days — send a reminder or request now.</p>
                  </div>
                ))}
              </div>
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => { setReqForm(f => ({...f, employee: newJoineeAlerts[0].employeeId})); setShowRequestModal(true); }}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold border border-white/30 flex-shrink-0 transition-colors">
                Send Request
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"Pending Requests", value:pendingCount,  color:"amber" },
            { label:"Uploaded (Review)", value:uploadedCount, color:"blue"  },
            { label:"Verified",          value:verifiedCount, color:"green" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className={`text-2xl font-black text-${s.color}-600`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          {[
            { key:"requests", label:"Document Requests" },
            { key:"library",  label:"Company Library"  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t.key?"bg-brand-600 text-white shadow-md":"text-slate-600 hover:bg-slate-50"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Document Requests Tab */}
        {tab === "requests" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900">Document Requests</h3>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee or doc..."
                    className="bg-transparent text-xs outline-none w-36 text-slate-700" />
                </div>
                {/* Employee filter dropdown */}
                <div className="relative">
                  <select value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none focus:border-brand-400 pr-8 appearance-none cursor-pointer">
                    <option value="all">All Employees</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={() => setShowRequestModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20">
                  <Plus className="w-3.5 h-3.5" /> Request Document
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    {["Employee","Document Type","Requested","Due Date","Note","Status","Action"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((req, i) => {
                    const sc = statusCfg[req.status];
                    return (
                      <motion.tr key={req.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                        className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                              {req.employeeName.split(" ").map(n=>n[0]).join("")}
                            </div>
                            <span className="text-xs font-semibold text-slate-800">{req.employeeName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-medium text-slate-700">{req.docType}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{req.requestedOn}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium ${new Date(req.dueDate)<new Date()&&req.status==="pending"?"text-red-500":"text-slate-600"}`}>
                            {req.dueDate}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate">{req.note}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {req.status === "uploaded" && (
                              <>
                                <button className="flex items-center gap-1 text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100 transition-colors">
                                  <Eye className="w-3 h-3" /> View
                                </button>
                                <button onClick={() => handleMarkVerified(req.id)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100 transition-colors">
                                  <CheckCircle2 className="w-3 h-3" /> Verify
                                </button>
                              </>
                            )}
                            {req.status === "pending" && (
                              <button className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                                <Bell className="w-3 h-3" /> Remind
                              </button>
                            )}
                            {req.status === "verified" && (
                              <button className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-100">
                                <Download className="w-3 h-3" /> Download
                              </button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Company Library Tab */}
        {tab === "library" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Company Document Library</h3>
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
                <Upload className="w-4 h-4" /> Upload Document
              </motion.button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc, i) => {
                const cfg = docTypeIcons[doc.type] || docTypeIcons.Template;
                const Icon = cfg.icon;
                return (
                  <motion.div key={doc.id} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    whileHover={{ y:-3 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-${cfg.color}-50 flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 text-${cfg.color}-500`} />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full bg-${cfg.color}-50 text-${cfg.color}-600`}>{doc.type}</span>
                        <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${doc.visibility==="all"?"bg-green-50 text-green-600":"bg-slate-100 text-slate-500"}`}>
                          {doc.visibility==="all"?"All Staff":"HR Only"}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">{doc.name}</h4>
                    <p className="text-[10px] text-slate-400 mb-3">By {doc.uploadedBy} • {doc.date} • {doc.size}</p>
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline"><Eye className="w-3 h-3" /> Preview</button>
                      <button className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:underline ml-auto"><Download className="w-3 h-3" /> Download</button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* Request Document Modal */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRequestModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Request Document</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Employee will be notified to upload</p>
                </div>
                <button onClick={() => setShowRequestModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSendRequest} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select Employee</label>
                  <select value={reqForm.employee} onChange={e=>setReqForm(f=>({...f,employee:e.target.value}))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Choose employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Document Type</label>
                  <select value={reqForm.docType} onChange={e=>setReqForm(f=>({...f,docType:e.target.value}))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select document...</option>
                    {["Aadhaar Card","PAN Card","Bank Account Details","Educational Certificates","Previous Employment Letter","Address Proof","Passport","Driving License","Medical Certificate"].map(d => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date</label>
                  <input type="date" value={reqForm.dueDate} onChange={e=>setReqForm(f=>({...f,dueDate:e.target.value}))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Note to Employee</label>
                  <textarea rows={3} value={reqForm.note} onChange={e=>setReqForm(f=>({...f,note:e.target.value}))}
                    placeholder="e.g. Required for BGV verification, please upload a clear scan..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" />
                </div>
                <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20">
                  Send Request
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
