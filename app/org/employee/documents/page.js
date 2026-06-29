"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Download, Shield, File, Bell,
  CheckCircle2, AlertCircle, Clock, X, CloudUpload, Lock
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  acknowledgeDocument,
  uploadEmployeeDocument,
  uploadRequestedDocument
} from "@/lib/api";
import { useCompanyDocuments, useEmployeeDocuments, useTemplates, useDocumentRequests, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"Action Required", icon:AlertCircle },
  uploaded: { cls:"bg-blue-50 text-blue-600 border-blue-200",    label:"Under Review",    icon:Clock },
  approved: { cls:"bg-green-50 text-green-600 border-green-200", label:"Approved ✓",      icon:CheckCircle2 },
  rejected: { cls:"bg-red-50 text-red-500 border-red-200",       label:"Rejected",        icon:AlertCircle },
};

export default function MyDocumentsPage() {
  const [tab, setTab] = useState("requests");
  const [toast, setToast] = useState(null);
  const invalidate = useInvalidate();

  // React Query hooks
  const { data: requests = [], isLoading: requestsLoading } = useDocumentRequests();
  const { data: myDocs = [], isLoading: myDocsLoading } = useEmployeeDocuments();
  const { data: companyDocs = [], isLoading: companyLoading } = useCompanyDocuments();
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();

  const loading = tab === "requests" ? requestsLoading : tab === "my-docs" ? myDocsLoading : tab === "company" ? companyLoading : templatesLoading;

  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ title:"", category:"other" });
  const [uploadingReqId, setUploadingReqId] = useState(null);
  const fileRef = useRef(null);
  const reqFileRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  const handleUploadMyDoc = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setFormLoading(true);
    const res = await uploadEmployeeDocument(file, uploadForm.title, uploadForm.category);
    if (res.ok) { showToast("Document uploaded"); setShowUpload(false); invalidate("employee-documents"); }
    else showToast("Upload failed", "error");
    setFormLoading(false);
  };

  const handleUploadRequested = async (reqId) => {
    const file = reqFileRef.current?.files?.[0];
    if (!file) return;
    setFormLoading(true);
    const res = await uploadRequestedDocument(reqId, file);
    if (res.ok) { showToast("Document submitted for review"); setUploadingReqId(null); invalidate("document-requests"); }
    else showToast("Upload failed", "error");
    setFormLoading(false);
  };

  const handleAcknowledge = async (docId) => {
    const res = await acknowledgeDocument(docId);
    if (res.ok) {
      showToast("Document acknowledged ✓");
      invalidate("company-documents");
    } else {
      const msg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") :
        res.data?.message || "Failed to acknowledge";
      showToast(msg, "error");
    }
  };

  const pendingCount = requests.filter(r => r.status === "pending" || r.status === "rejected").length;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Documents" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
            {[
              { key:"requests", label:"HR Requests", icon:Bell, badge:pendingCount },
              { key:"my-docs", label:"My Uploads", icon:FileText },
              { key:"company", label:"Company Docs", icon:Shield },
              { key:"templates", label:"Templates", icon:File },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    tab===t.key ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                  {t.badge > 0 && <span className="w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center">{t.badge}</span>}
                </button>
              );
            })}
          </div>
          {tab === "my-docs" && (
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Upload className="w-4 h-4" /> Upload Document
            </motion.button>
          )}
        </div>

        {/* Requests Tab */}
        {tab === "requests" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} className="space-y-3">
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No pending requests</p>
              </div>
            ) : requests.map((req, i) => {
              const sc = statusCfg[req.status] || statusCfg.pending;
              const StatusIcon = sc.icon;
              return (
                <motion.div key={req.id||req._id||i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        req.status==="pending"||req.status==="rejected"?"bg-amber-100":"bg-blue-100"
                      }`}><StatusIcon className={`w-5 h-5 ${req.status==="pending"||req.status==="rejected"?"text-amber-600":"text-blue-600"}`} /></div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{req.title}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>{sc.label}</span>
                        </div>
                        {req.description && <p className="text-xs text-slate-500">{req.description}</p>}
                        {req.due_date && <p className="text-[10px] text-slate-400 mt-1">Due: {req.due_date}</p>}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {(req.status === "pending" || req.status === "rejected") && (
                        uploadingReqId === (req.id||req._id) ? (
                          <div className="flex items-center gap-2">
                            <input ref={reqFileRef} type="file" className="text-xs w-40" />
                            <button onClick={() => handleUploadRequested(req.id||req._id)} disabled={formLoading}
                              className="text-[10px] font-bold text-white bg-brand-600 px-3 py-1.5 rounded-lg">{formLoading?"...":"Submit"}</button>
                            <button onClick={() => setUploadingReqId(null)} className="text-[10px] text-slate-400">Cancel</button>
                          </div>
                        ) : (
                          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => setUploadingReqId(req.id||req._id)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md">
                            <CloudUpload className="w-3.5 h-3.5" /> Upload
                          </motion.button>
                        )
                      )}
                      {req.status === "uploaded" && <span className="text-xs text-blue-600 font-semibold">Under review</span>}
                      {req.status === "approved" && <span className="text-xs text-green-600 font-bold">✓ Approved</span>}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* My Uploads Tab */}
        {tab === "my-docs" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : myDocs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDocs.map((doc, i) => (
                  <motion.div key={doc.id||doc._id||i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm group hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3"><FileText className="w-5 h-5 text-brand-500" /></div>
                    <h4 className="text-sm font-bold text-slate-900 mb-0.5">{doc.title}</h4>
                    <p className="text-[10px] text-slate-400">{doc.category} • {doc.created_at?.split("T")[0]}</p>
                    {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline"><Download className="w-3 h-3" /> Download</a>}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Company Docs Tab */}
        {tab === "company" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : companyDocs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No company documents</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyDocs.map((doc, i) => (
                  <motion.div key={doc.id||doc._id||i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Shield className="w-5 h-5 text-purple-500" /></div>
                      {doc.is_mandatory && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">Mandatory</span>}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{doc.title}</h4>
                    {doc.description && <p className="text-xs text-slate-500 mb-2">{doc.description}</p>}
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                      {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Download</a>}
                      {doc.is_mandatory && !doc.acknowledged && (
                        <button onClick={() => handleAcknowledge(doc.id||doc._id)} className="ml-auto text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-100">Acknowledge</button>
                      )}
                      {doc.acknowledged && <span className="ml-auto text-[10px] text-green-600 font-bold">✓ Acknowledged</span>}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Templates Tab */}
        {tab === "templates" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : templates.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <File className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No templates available</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((tpl, i) => (
                  <motion.div key={tpl.id||tpl._id||i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><File className="w-5 h-5 text-amber-500" /></div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{tpl.title}</h4>
                    {tpl.description && <p className="text-xs text-slate-500 mb-2">{tpl.description}</p>}
                    {tpl.file_url && <a href={tpl.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] font-bold text-brand-600 hover:underline"><Download className="w-3 h-3" /> Download Template</a>}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Upload My Doc Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
                <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleUploadMyDoc} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label>
                  <input value={uploadForm.title} onChange={e=>setUploadForm(f=>({...f,title:e.target.value}))} required placeholder="B.Tech Certificate"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                  <select value={uploadForm.category} onChange={e=>setUploadForm(f=>({...f,category:e.target.value}))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="certificate">Certificate</option><option value="id_proof">ID Proof</option><option value="offer_letter">Offer Letter</option><option value="experience_letter">Experience Letter</option><option value="other">Other</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label>
                  <input ref={fileRef} type="file" required className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Uploading..." : "Upload"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
