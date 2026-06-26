"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, CheckCircle2, AlertCircle, Upload, X, Plus, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import { listCompanyDocuments, acknowledgeDocument, listEmployeeDocuments, uploadEmployeeDocument } from "@/lib/api";

export default function MyDocumentsPage() {
  const [tab, setTab] = useState("company");
  const [companyDocs, setCompanyDocs] = useState([]);
  const [myDocs, setMyDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("other");
  const [uploading, setUploading] = useState(false);
  const [catFilter, setCatFilter] = useState("");

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [cRes, eRes] = await Promise.all([listCompanyDocuments({ limit: 50 }), listEmployeeDocuments({ limit: 50 })]);
    if (cRes.ok && cRes.data) setCompanyDocs(cRes.data.documents || []);
    if (eRes.ok && eRes.data) setMyDocs(eRes.data.documents || []);
    setLoading(false);
  };

  const handleAcknowledge = async (docId) => {
    const res = await acknowledgeDocument(docId);
    if (res.ok) { showToast("Document acknowledged"); fetchAll(); }
    else showToast("Failed", "error");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) { showToast("Select a file", "error"); return; }
    setUploading(true);
    const res = await uploadEmployeeDocument(uploadFile, uploadTitle, uploadCategory);
    if (res.ok) { showToast("Document uploaded!"); setShowUpload(false); setUploadFile(null); setUploadTitle(""); fetchAll(); }
    else showToast(res.data?.detail || "Upload failed", "error");
    setUploading(false);
  };

  const filteredCompany = catFilter ? companyDocs.filter(d => d.category === catFilter) : companyDocs;

  const categoryCfg = {
    policy: { cls: "bg-blue-100 text-blue-700", label: "Policy" },
    handbook: { cls: "bg-purple-100 text-purple-700", label: "Handbook" },
    template: { cls: "bg-green-100 text-green-700", label: "Template" },
    form: { cls: "bg-amber-100 text-amber-700", label: "Form" },
    other: { cls: "bg-slate-100 text-slate-600", label: "Other" },
    offer_letter: { cls: "bg-indigo-100 text-indigo-700", label: "Offer Letter" },
    experience_letter: { cls: "bg-teal-100 text-teal-700", label: "Experience Letter" },
    certificate: { cls: "bg-emerald-100 text-emerald-700", label: "Certificate" },
    id_proof: { cls: "bg-rose-100 text-rose-700", label: "ID Proof" },
  };

  if (loading) return <div className="min-h-screen bg-surface-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Documents" />
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>{toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}</motion.div>)}</AnimatePresence>

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setTab("company")} className={`px-4 py-2 rounded-lg text-xs font-semibold ${tab === "company" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>Company Documents</button>
            <button onClick={() => setTab("my")} className={`px-4 py-2 rounded-lg text-xs font-semibold ${tab === "my" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>My Documents</button>
          </div>
          {tab === "my" && (
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowUpload(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
              <Upload className="w-3.5 h-3.5" /> Upload
            </motion.button>
          )}
        </div>

        {/* Company Docs */}
        {tab === "company" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex gap-1 flex-wrap">
              {[{ key: "", label: "All" }, { key: "policy", label: "Policies" }, { key: "handbook", label: "Handbooks" }, { key: "template", label: "Templates" }, { key: "form", label: "Forms" }].map(c => (
                <button key={c.key} onClick={() => setCatFilter(c.key)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold ${catFilter === c.key ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{c.label}</button>
              ))}
            </div>
            {filteredCompany.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No documents</p></div>
            ) : (
              <div className="space-y-3">
                {filteredCompany.map((doc, i) => {
                  const cc = categoryCfg[doc.category] || categoryCfg.other;
                  return (
                    <div key={doc.id || i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-brand-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${cc.cls}`}>{cc.label}</span>
                          {doc.is_mandatory && !doc.is_acknowledged && <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">ACTION REQUIRED</span>}
                          {doc.is_acknowledged && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                        </div>
                        <p className="text-sm font-bold text-slate-800 truncate">{doc.title}</p>
                        {doc.description && <p className="text-[10px] text-slate-500 truncate">{doc.description}</p>}
                        <p className="text-[9px] text-slate-400 mt-0.5">{doc.uploaded_by_name} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {doc.is_mandatory && !doc.is_acknowledged && (
                          <button onClick={() => handleAcknowledge(doc.id)}
                            className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100">Acknowledge</button>
                        )}
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
                            <Download className="w-4 h-4 text-slate-500" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* My Docs */}
        {tab === "my" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {myDocs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No documents uploaded yet</p></div>
            ) : (
              <div className="space-y-3">
                {myDocs.map((doc, i) => {
                  const cc = categoryCfg[doc.category] || categoryCfg.other;
                  return (
                    <div key={doc.id || i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${cc.cls}`}>{cc.label}</span>
                        <p className="text-sm font-bold text-slate-800 truncate mt-0.5">{doc.title}</p>
                        <p className="text-[9px] text-slate-400">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}</p>
                      </div>
                      {doc.file_url && (
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
                          <Download className="w-4 h-4 text-slate-500" />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
                <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label>
                  <input value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required placeholder="e.g. Offer Letter"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="other">Other</option><option value="offer_letter">Offer Letter</option><option value="experience_letter">Experience Letter</option>
                    <option value="certificate">Certificate</option><option value="id_proof">ID Proof</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label>
                  <input type="file" onChange={e => setUploadFile(e.target.files[0])} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600" /></div>
                <motion.button type="submit" disabled={uploading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {uploading ? "Uploading..." : "Upload Document"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
