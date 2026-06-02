"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Download, Eye, X, AlertTriangle,
  CheckCircle2, Clock, Shield, BookOpen, File, Bell,
  CloudUpload, Lock
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { docRequests, documents } from "@/lib/fakeData";

// My personal documents (already in locker)
const myPersonalDocs = [
  { name:"Offer Letter",              type:"Personal",  date:"2023-07-01", size:"450 KB",  status:"verified" },
  { name:"Appointment Letter",        type:"Personal",  date:"2023-07-05", size:"380 KB",  status:"verified" },
  { name:"Salary Revision - FY2025",  type:"Personal",  date:"2025-04-01", size:"220 KB",  status:"verified" },
  { name:"PAN Card",                  type:"KYC",       date:"2023-07-08", size:"890 KB",  status:"verified" },
];

export default function MyDocumentsPage() {
  const { user } = useAuth();

  // Show only requests for logged-in employee (using EMP011 as demo for "vikram" role)
  // In real app this would filter by user.employeeId
  const myRequests = docRequests.filter(r => r.employeeId === "EMP011");

  const [requests, setRequests]         = useState(myRequests);
  const [showUploadModal, setUploadModal] = useState(null); // holds the request being uploaded
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [toast, setToast]               = useState(null);
  const [tab, setTab]                   = useState("requests");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!uploadedFileName.trim()) return;
    setRequests(prev => prev.map(r =>
      r.id === showUploadModal.id ? { ...r, status:"uploaded", uploadedFile: uploadedFileName } : r
    ));
    setUploadModal(null);
    setUploadedFileName("");
    showToast("Document uploaded successfully — HR will review shortly");
  };

  const pendingCount  = requests.filter(r => r.status === "pending").length;
  const uploadedCount = requests.filter(r => r.status === "uploaded").length;
  const verifiedCount = requests.filter(r => r.status === "verified").length;

  const statusCfg = {
    pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200",  label:"Action Required", icon:AlertTriangle },
    uploaded: { cls:"bg-blue-50 text-blue-600 border-blue-200",     label:"Under Review",    icon:Clock         },
    verified: { cls:"bg-green-50 text-green-600 border-green-200",  label:"Verified ✓",      icon:CheckCircle2  },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Documents" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold bg-green-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">

        {/* Pending action banner */}
        {pendingCount > 0 && (
          <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
            className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Action Required</h3>
                <p className="text-amber-100 text-xs mt-0.5">
                  HR has requested {pendingCount} document{pendingCount > 1 ? "s" : ""} from you. Please upload before the due date to avoid delays in payroll and BGV.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:"Pending Upload",  value:pendingCount,  color:"amber" },
            { label:"Under Review",    value:uploadedCount, color:"blue"  },
            { label:"Verified",        value:verifiedCount, color:"green" },
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
            { key:"requests", label:"HR Requests"      },
            { key:"locker",   label:"My Document Locker" },
            { key:"company",  label:"Company Policies"  },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab===t.key?"bg-brand-600 text-white shadow-md":"text-slate-600 hover:bg-slate-50"}`}>
              {t.label}
              {t.key==="requests" && pendingCount>0 && (
                <span className="ml-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold inline-flex items-center justify-center">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* HR Requests Tab */}
        {tab === "requests" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} className="space-y-3">
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">No pending document requests from HR.</p>
              </div>
            ) : (
              requests.map((req, i) => {
                const sc = statusCfg[req.status];
                const StatusIcon = sc.icon;
                const isOverdue = new Date(req.dueDate) < new Date() && req.status === "pending";
                return (
                  <motion.div key={req.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
                    className={`bg-white rounded-2xl p-5 border shadow-sm ${isOverdue ? "border-red-200 bg-red-50/30" : "border-slate-100"}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          req.status==="pending" ? "bg-amber-100" : req.status==="uploaded" ? "bg-blue-100" : "bg-green-100"
                        }`}>
                          <StatusIcon className={`w-5 h-5 ${
                            req.status==="pending" ? "text-amber-600" : req.status==="uploaded" ? "text-blue-600" : "text-green-600"
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-bold text-slate-900">{req.docType}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                            {isOverdue && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Overdue</span>}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Requested by HR • Due: <span className={`font-semibold ${isOverdue?"text-red-500":""}`}>{req.dueDate}</span></p>
                          {req.note && <p className="text-xs text-slate-400 mt-1 italic">"{req.note}"</p>}
                          {req.uploadedFile && (
                            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                              <FileText className="w-3 h-3" /> {req.uploadedFile}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {req.status === "pending" && (
                          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                            onClick={() => setUploadModal(req)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-500/20">
                            <CloudUpload className="w-3.5 h-3.5" /> Upload
                          </motion.button>
                        )}
                        {req.status === "uploaded" && (
                          <span className="text-xs text-blue-600 font-semibold">Awaiting HR review</span>
                        )}
                        {req.status === "verified" && (
                          <button className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-2 rounded-xl hover:bg-green-100">
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}

        {/* My Document Locker Tab */}
        {tab === "locker" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">My Document Locker</h3>
                <p className="text-xs text-slate-500">Your personal HR documents — only visible to you and HR</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Lock className="w-3.5 h-3.5" /> Encrypted & Secure
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myPersonalDocs.map((doc, i) => (
                <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                  whileHover={{ y:-2 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-1 rounded-full ${doc.status==="verified"?"bg-green-50 text-green-600":"bg-amber-50 text-amber-600"}`}>
                      {doc.status==="verified" ? "✓ Verified" : "Pending"}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{doc.type} • {doc.date} • {doc.size}</p>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline"><Eye className="w-3 h-3" /> View</button>
                    <button className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:underline ml-auto"><Download className="w-3 h-3" /> Download</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Company Policies Tab */}
        {tab === "company" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            <p className="text-xs text-slate-500 mb-4">Published by HR — read-only access</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.filter(d => d.visibility==="all").map((doc, i) => (
                <motion.div key={doc.id} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}
                  whileHover={{ y:-2 }} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
                    <Shield className="w-5 h-5 text-purple-500" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{doc.date} • {doc.size}</p>
                  <button className="mt-3 flex items-center gap-1 text-[10px] font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Download className="w-3 h-3" /> Download
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setUploadModal(null)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Upload Document</h3>
                <button onClick={() => setUploadModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs font-bold text-amber-800">{showUploadModal.docType}</p>
                <p className="text-[10px] text-amber-600 mt-0.5">Due: {showUploadModal.dueDate}</p>
                {showUploadModal.note && <p className="text-[10px] text-amber-600 mt-1 italic">"{showUploadModal.note}"</p>}
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {/* Drag & drop area */}
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors cursor-pointer">
                  <CloudUpload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">Drag & drop file here</p>
                  <p className="text-xs text-slate-400 mt-0.5">PDF, JPG, PNG up to 10MB</p>
                  <button type="button" className="mt-3 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
                    Browse Files
                  </button>
                </div>

                {/* Simulate file name input */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">File name (demo)</label>
                  <input value={uploadedFileName} onChange={e=>setUploadedFileName(e.target.value)} required
                    placeholder={`e.g. aadhaar_${user?.name?.split(" ")[0]?.toLowerCase()}.pdf`}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>

                <motion.button type="submit" whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2">
                  <CloudUpload className="w-4 h-4" /> Submit Document
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
