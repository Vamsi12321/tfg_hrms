"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Upload, Search, Download, Eye, X, Plus,
  Shield, BookOpen, File, Bell, Trash2, CheckCircle2,
  AlertCircle, Clock, ChevronRight, RefreshCw, Users
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  uploadCompanyDocument, deleteCompanyDocument,
  uploadTemplate, deleteTemplate,
  requestDocument, reviewDocumentRequest,
  getDefaultDocumentTitles
} from "@/lib/api";
import { useCompanyDocuments, useTemplates, useDocumentRequests, useEmployees, useDepartments, useInvalidate } from "@/lib/queries";

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"Pending" },
  uploaded: { cls:"bg-blue-50 text-blue-600 border-blue-200",    label:"Uploaded" },
  approved: { cls:"bg-green-50 text-green-600 border-green-200", label:"Approved" },
  rejected: { cls:"bg-red-50 text-red-500 border-red-200",       label:"Rejected" },
};

export default function DocumentsPage() {
  const [tab, setTab] = useState("company");
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const invalidate = useInvalidate();

  // React Query hooks
  const { data: companyDocs = [], isLoading: companyLoading } = useCompanyDocuments({ limit: 50 });
  const { data: templates = [], isLoading: templatesLoading } = useTemplates();
  const { data: requests = [], isLoading: requestsLoading } = useDocumentRequests({ limit: 50 });
  const { data: employeeData } = useEmployees({ limit: 100 });
  const employees = employeeData?.employees || [];
  const { data: deptList = [] } = useDepartments();

  const loading = tab === "company" ? companyLoading : tab === "templates" ? templatesLoading : requestsLoading;

  // Company docs
  const [showUploadCompany, setShowUploadCompany] = useState(false);
  const [companyForm, setCompanyForm] = useState({ title:"", category:"policy", description:"", target_departments:[], is_mandatory:false });
  const companyFileRef = useRef(null);

  // Templates
  const [showUploadTemplate, setShowUploadTemplate] = useState(false);
  const [templateForm, setTemplateForm] = useState({ title:"", description:"" });
  const templateFileRef = useRef(null);

  // Requests
  const [showCreateRequest, setShowCreateRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ employee_id:"", title:"", description:"", category:"other", due_date:"" });
  const [defaultTitles, setDefaultTitles] = useState([]);

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  // Fetch default titles on mount
  useEffect(() => {
    getDefaultDocumentTitles().then(res => {
      if (res.ok && res.data) setDefaultTitles(res.data.titles || res.data || []);
    });
  }, []);

  // Upload company doc
  const handleUploadCompany = async (e) => {
    e.preventDefault();
    const file = companyFileRef.current?.files?.[0];
    if (!file) return showToast("Please select a file", "error");
    setFormLoading(true);
    const res = await uploadCompanyDocument(file, companyForm.title, companyForm.category, companyForm.description, companyForm.target_departments, companyForm.is_mandatory);
    if (res.ok) { showToast("Document uploaded"); setShowUploadCompany(false); invalidate("company-documents"); }
    else showToast(res.data?.detail?.[0]?.msg || "Upload failed", "error");
    setFormLoading(false);
  };

  // Upload template
  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    const file = templateFileRef.current?.files?.[0];
    if (!file) return showToast("Please select a file", "error");
    setFormLoading(true);
    const res = await uploadTemplate(file, templateForm.title, templateForm.description);
    if (res.ok) { showToast("Template uploaded"); setShowUploadTemplate(false); invalidate("templates"); }
    else showToast(res.data?.detail?.[0]?.msg || "Upload failed", "error");
    setFormLoading(false);
  };

  // Create document request
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await requestDocument(requestForm);
    if (res.ok) { showToast("Document request sent to employee"); setShowCreateRequest(false); setRequestForm({ employee_id:"", title:"", description:"", category:"other", due_date:"" }); invalidate("document-requests"); }
    else showToast(res.data?.detail?.[0]?.msg || "Failed", "error");
    setFormLoading(false);
  };

  // Review request
  const handleReview = async (reqId, action, reason = "") => {
    const res = await reviewDocumentRequest(reqId, action, reason);
    if (res.ok) { showToast(`Document ${action}d`); invalidate("document-requests"); }
    else showToast("Action failed", "error");
  };

  // Delete
  const handleDeleteCompany = async (id) => {
    const res = await deleteCompanyDocument(id);
    if (res.ok) { showToast("Deleted"); invalidate("company-documents"); }
  };
  const handleDeleteTemplate = async (id) => {
    const res = await deleteTemplate(id);
    if (res.ok) { showToast("Deleted"); invalidate("templates"); }
  };

  // Search
  const [searchQuery, setSearchQuery] = useState("");

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 transition-all";

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Documents" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Tabs + Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
            {[
              { key:"company", label:"Company Docs", icon:Shield },
              { key:"templates", label:"Templates", icon:File },
              { key:"requests", label:"Doc Requests", icon:Bell },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    tab===t.key ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
                  }`}>
                  <Icon className="w-3.5 h-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {tab === "company" && (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowUploadCompany(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
                <Upload className="w-4 h-4" /> Upload Document
              </motion.button>
            )}
            {tab === "templates" && (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowUploadTemplate(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
                <Upload className="w-4 h-4" /> Upload Template
              </motion.button>
            )}
            {tab === "requests" && (
              <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }} onClick={() => setShowCreateRequest(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
                <Plus className="w-4 h-4" /> Request Document
              </motion.button>
            )}
          </div>
        </div>

        {/* Company Docs Tab */}
        {tab === "company" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 mb-4 max-w-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search documents by name..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
            </div>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : companyDocs.filter(d => d.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">{searchQuery ? "No documents match your search" : "No company documents yet"}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyDocs.filter(d => d.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((doc, i) => (
                  <motion.div key={doc.id || doc._id || i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-500" /></div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{doc.category || "other"}</span>
                        {doc.is_mandatory && <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Mandatory</span>}
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{doc.title}</h4>
                    {doc.description && <p className="text-xs text-slate-500 mb-2">{doc.description}</p>}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Download</a>}
                      <button onClick={() => handleDeleteCompany(doc.id || doc._id)} className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
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
            {/* Search */}
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 mb-4 max-w-sm focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search templates..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
            </div>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : templates.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <File className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">{searchQuery ? "No templates match" : "No templates uploaded"}</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase())).map((tpl, i) => (
                  <motion.div key={tpl.id || tpl._id || i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
                    className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><File className="w-5 h-5 text-amber-500" /></div>
                    <h4 className="text-sm font-bold text-slate-900 mb-1">{tpl.title}</h4>
                    {tpl.description && <p className="text-xs text-slate-500 mb-2">{tpl.description}</p>}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      {tpl.file_url && <a href={tpl.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Download className="w-3 h-3" /> Download</a>}
                      <button onClick={() => handleDeleteTemplate(tpl.id || tpl._id)} className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Requests Tab */}
        {tab === "requests" && (
          <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            : requests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
                <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No document requests</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-slate-50/80">
                    {["Employee","Document","Category","Due Date","Status","Action"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {requests.map((req, i) => {
                      const sc = statusCfg[req.status] || statusCfg.pending;
                      return (
                        <tr key={req.id || req._id || i} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-5 py-3 text-sm font-semibold text-slate-800">{req.employee_name || req.employee_id}</td>
                          <td className="px-5 py-3 text-xs text-slate-700">{req.title}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{req.category}</td>
                          <td className="px-5 py-3 text-xs text-slate-500">{req.due_date || "—"}</td>
                          <td className="px-5 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1.5">
                              {req.status === "uploaded" && (
                                <>
                                  {req.file_url && <a href={req.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100">View</a>}
                                  <button onClick={() => handleReview(req.id||req._id, "approve")} className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100">Approve</button>
                                  <button onClick={() => handleReview(req.id||req._id, "reject", "Please re-upload")} className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100">Reject</button>
                                </>
                              )}
                              {req.status === "pending" && <span className="text-[10px] text-slate-400">Awaiting upload</span>}
                            {req.status === "approved" && (
                              <div className="flex items-center gap-1.5">
                                {req.file_url && <a href={req.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100 flex items-center gap-1"><Download className="w-3 h-3" /> Download</a>}
                                <span className="text-[10px] text-green-600 font-bold">✓ Approved</span>
                              </div>
                            )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Upload Company Doc Modal */}
      <AnimatePresence>
        {showUploadCompany && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadCompany(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Upload Company Document</h3>
                <button onClick={() => setShowUploadCompany(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleUploadCompany} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label>
                  <input value={companyForm.title} onChange={e=>setCompanyForm(f=>({...f,title:e.target.value}))} required placeholder="Employee Handbook v3" className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                  <select value={companyForm.category} onChange={e=>setCompanyForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                    <option value="policy">Policy</option><option value="handbook">Handbook</option><option value="template">Template</option><option value="form">Form</option><option value="other">Other</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={companyForm.description} onChange={e=>setCompanyForm(f=>({...f,description:e.target.value}))} placeholder="Brief description..." className={`${inputCls} resize-none`} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Target Departments <span className="text-slate-400 font-normal">(empty = all)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {deptList.map(dept => (
                      <label key={dept.id||dept.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer border transition-all ${companyForm.target_departments.includes(dept.name) ? "bg-brand-50 border-brand-300 text-brand-700" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <input type="checkbox" checked={companyForm.target_departments.includes(dept.name)}
                          onChange={e => {
                            if (e.target.checked) setCompanyForm(f => ({...f, target_departments: [...f.target_departments, dept.name]}));
                            else setCompanyForm(f => ({...f, target_departments: f.target_departments.filter(d => d !== dept.name)}));
                          }}
                          className="w-3 h-3 rounded border-slate-300 text-brand-600" />
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={companyForm.is_mandatory} onChange={e=>setCompanyForm(f=>({...f,is_mandatory:e.target.checked}))} className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                  <span className="text-xs font-semibold text-slate-700">Mandatory (employees must acknowledge)</span>
                </label>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label>
                  <input ref={companyFileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Uploading..." : "Upload Document"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Template Modal */}
      <AnimatePresence>
        {showUploadTemplate && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadTemplate(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Upload Template</h3>
                <button onClick={() => setShowUploadTemplate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleUploadTemplate} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label>
                  <input value={templateForm.title} onChange={e=>setTemplateForm(f=>({...f,title:e.target.value}))} required placeholder="Leave Application Form" className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <input value={templateForm.description} onChange={e=>setTemplateForm(f=>({...f,description:e.target.value}))} placeholder="Brief description" className={inputCls} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label>
                  <input ref={templateFileRef} type="file" required className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Uploading..." : "Upload Template"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Document Modal */}
      <AnimatePresence>
        {showCreateRequest && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateRequest(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Request Document</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Employee will be notified to upload</p>
                </div>
                <button onClick={() => setShowCreateRequest(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={requestForm.employee_id} onChange={e=>setRequestForm(f=>({...f,employee_id:e.target.value}))} required className={inputCls}>
                    <option value="">Select employee...</option>
                    {employees.map(emp => <option key={emp.id||emp._id} value={emp.id||emp._id}>{emp.first_name} {emp.last_name} — {emp.department}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Document Title *</label>
                  <select value={requestForm.title} onChange={e => {
                    const selected = e.target.value;
                    setRequestForm(f => ({...f, title: selected}));
                    const match = defaultTitles.find(t => t.title === selected);
                    if (match) setRequestForm(f => ({...f, title: selected, category: match.category}));
                  }} required className={inputCls}>
                    <option value="">Select document...</option>
                    {defaultTitles.map((t, i) => <option key={i} value={t.title}>{t.title}</option>)}
                    <option value="__custom">Other (type manually)</option>
                  </select>
                  {requestForm.title === "__custom" && (
                    <input value="" onChange={e => setRequestForm(f => ({...f, title: e.target.value}))} placeholder="Enter custom title..." className={`${inputCls} mt-2`} />
                  )}
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                  <select value={requestForm.category} onChange={e=>setRequestForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                    <option value="id_proof">ID Proof</option><option value="certificate">Certificate</option><option value="experience_letter">Experience Letter</option><option value="offer_letter">Offer Letter</option><option value="other">Other</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={requestForm.description} onChange={e=>setRequestForm(f=>({...f,description:e.target.value}))} placeholder="Please upload a clear scan..." className={`${inputCls} resize-none`} /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date</label>
                  <input type="date" value={requestForm.due_date} onChange={e=>setRequestForm(f=>({...f,due_date:e.target.value}))} className={inputCls} /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Sending..." : "Send Request"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
