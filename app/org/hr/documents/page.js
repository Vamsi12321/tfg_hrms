"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, Upload, Plus, X, Trash2, Search, CheckCircle2, AlertCircle, Eye } from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  listCompanyDocuments, uploadCompanyDocument, deleteCompanyDocument,
  listEmployeeDocuments, uploadEmployeeDocument, deleteEmployeeDocument,
  listTemplates, uploadTemplate, deleteTemplate, listEmployees
} from "@/lib/api";

export default function HRDocumentsPage() {
  const [tab, setTab] = useState("company");
  const [companyDocs, setCompanyDocs] = useState([]);
  const [empDocs, setEmpDocs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Upload modals
  const [showCompUpload, setShowCompUpload] = useState(false);
  const [showEmpUpload, setShowEmpUpload] = useState(false);
  const [showTplUpload, setShowTplUpload] = useState(false);
  const [compForm, setCompForm] = useState({ file: null, title: "", category: "other", description: "", target_departments: [], is_mandatory: false });
  const [empForm, setEmpForm] = useState({ file: null, title: "", category: "other", employee_id: "" });
  const [tplForm, setTplForm] = useState({ file: null, title: "", description: "" });
  const [empFilter, setEmpFilter] = useState("");

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (tab === "employee") fetchEmpDocs(); }, [empFilter]);

  const fetchAll = async () => {
    setLoading(true);
    const [cRes, tRes, eRes] = await Promise.all([listCompanyDocuments({ limit: 50 }), listTemplates(), listEmployees({ limit: 100 })]);
    if (cRes.ok && cRes.data) setCompanyDocs(cRes.data.documents || []);
    if (tRes.ok && tRes.data) setTemplates(tRes.data.templates || tRes.data.documents || []);
    if (eRes.ok && eRes.data) setEmployees(eRes.data.employees || []);
    setLoading(false);
  };

  const fetchEmpDocs = async () => {
    if (!empFilter) { setEmpDocs([]); return; }
    const res = await listEmployeeDocuments({ employee_id: empFilter, limit: 50 });
    if (res.ok && res.data) setEmpDocs(res.data.documents || []);
  };

  const handleCompUpload = async (e) => {
    e.preventDefault(); setFormError(""); setFormLoading(true);
    if (!compForm.file) { setFormError("Select a file"); setFormLoading(false); return; }
    const res = await uploadCompanyDocument(compForm.file, compForm.title, compForm.category, compForm.description, compForm.target_departments, compForm.is_mandatory);
    if (res.ok) { showToast("Company document uploaded!"); setShowCompUpload(false); fetchAll(); }
    else { setFormError(res.data?.detail || "Upload failed"); }
    setFormLoading(false);
  };

  const handleEmpUpload = async (e) => {
    e.preventDefault(); setFormError(""); setFormLoading(true);
    if (!empForm.file) { setFormError("Select a file"); setFormLoading(false); return; }
    const res = await uploadEmployeeDocument(empForm.file, empForm.title, empForm.category, empForm.employee_id);
    if (res.ok) { showToast("Employee document uploaded!"); setShowEmpUpload(false); fetchEmpDocs(); }
    else { setFormError(res.data?.detail || "Upload failed"); }
    setFormLoading(false);
  };

  const handleTplUpload = async (e) => {
    e.preventDefault(); setFormError(""); setFormLoading(true);
    if (!tplForm.file) { setFormError("Select a file"); setFormLoading(false); return; }
    const res = await uploadTemplate(tplForm.file, tplForm.title, tplForm.description);
    if (res.ok) { showToast("Template uploaded!"); setShowTplUpload(false); fetchAll(); }
    else { setFormError(res.data?.detail || "Upload failed"); }
    setFormLoading(false);
  };

  const catCfg = { policy: "bg-blue-100 text-blue-700", handbook: "bg-purple-100 text-purple-700", template: "bg-green-100 text-green-700", form: "bg-amber-100 text-amber-700", other: "bg-slate-100 text-slate-600" };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Documents" />
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>{toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}</motion.div>)}</AnimatePresence>

      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {[{ key: "company", label: "Company Docs" }, { key: "employee", label: "Employee Docs" }, { key: "templates", label: "Templates" }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 rounded-lg text-xs font-semibold ${tab === t.key ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{t.label}</button>
            ))}
          </div>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setFormError(""); tab === "company" ? setShowCompUpload(true) : tab === "employee" ? setShowEmpUpload(true) : setShowTplUpload(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
            <Upload className="w-3.5 h-3.5" /> Upload {tab === "company" ? "Document" : tab === "employee" ? "Employee Doc" : "Template"}
          </motion.button>
        </div>

        {/* Company Docs Tab */}
        {tab === "company" && (
          <div className="space-y-3">
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> :
            companyDocs.length === 0 ? <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No company documents</p></div> :
            companyDocs.map((doc, i) => (
              <div key={doc.id || i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0"><FileText className="w-5 h-5 text-brand-500" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${catCfg[doc.category] || catCfg.other}`}>{doc.category || "other"}</span>
                    {doc.is_mandatory && <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">MANDATORY</span>}
                  </div>
                  <p className="text-sm font-bold text-slate-800 truncate">{doc.title}</p>
                  <div className="flex items-center gap-3 text-[9px] text-slate-400 mt-0.5">
                    <span>{doc.uploaded_by_name}</span>
                    <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}</span>
                    {doc.acknowledgement_count != null && <span><Eye className="w-3 h-3 inline" /> {doc.acknowledgement_count}/{doc.total_recipients || "?"}</span>}
                    {doc.target_departments?.length > 0 && <span className="text-brand-600">{doc.target_departments.join(", ")}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center"><Download className="w-3.5 h-3.5 text-slate-500" /></a>}
                  <button onClick={async () => { if (confirm("Delete?")) { await deleteCompanyDocument(doc.id); fetchAll(); } }}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Employee Docs Tab */}
        {tab === "employee" && (
          <div className="space-y-4">
            <select value={empFilter} onChange={e => setEmpFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 w-64">
              <option value="">Select employee...</option>
              {employees.map(emp => <option key={emp.id || emp._id} value={emp.id || emp._id}>{emp.first_name} {emp.last_name} — {emp.department}</option>)}
            </select>
            {empDocs.length === 0 ? <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><p className="text-xs text-slate-400">{empFilter ? "No documents for this employee" : "Select an employee to view their documents"}</p></div> :
            <div className="space-y-3">
              {empDocs.map((doc, i) => (
                <div key={doc.id || i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                  <FileText className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{doc.title}</p>
                    <p className="text-[9px] text-slate-400">{doc.category} • {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ""}</p>
                  </div>
                  {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center"><Download className="w-3.5 h-3.5 text-slate-500" /></a>}
                  <button onClick={async () => { if (confirm("Delete?")) { await deleteEmployeeDocument(doc.id); fetchEmpDocs(); } }}
                    className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                </div>
              ))}
            </div>}
          </div>
        )}

        {/* Templates Tab */}
        {tab === "templates" && (
          <div className="space-y-3">
            {templates.length === 0 ? <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><p className="text-xs text-slate-400">No templates</p></div> :
            templates.map((tpl, i) => (
              <div key={tpl.id || i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                <FileText className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800">{tpl.title}</p>
                  {tpl.description && <p className="text-[9px] text-slate-400">{tpl.description}</p>}
                </div>
                {tpl.file_url && <a href={tpl.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100">Download</a>}
                <button onClick={async () => { if (confirm("Delete?")) { await deleteTemplate(tpl.id); fetchAll(); } }}
                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Company Upload Modal */}
      <AnimatePresence>
        {showCompUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCompUpload(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Upload Company Document</h3><button onClick={() => setShowCompUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button></div>
              <form onSubmit={handleCompUpload} className="space-y-4">
                {formError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">{formError}</div>}
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label><input value={compForm.title} onChange={e => setCompForm(f => ({ ...f, title: e.target.value }))} required placeholder="Employee Handbook" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label><select value={compForm.category} onChange={e => setCompForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"><option value="other">Other</option><option value="policy">Policy</option><option value="handbook">Handbook</option><option value="template">Template</option><option value="form">Form</option></select></div>
                  <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer"><input type="checkbox" checked={compForm.is_mandatory} onChange={e => setCompForm(f => ({ ...f, is_mandatory: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-brand-600" /> Mandatory</label></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><textarea rows={2} value={compForm.description} onChange={e => setCompForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none" placeholder="Brief description..." /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Target Departments</label>
                  <div className="flex flex-wrap gap-2">{["Engineering","Design","Marketing","Sales","Finance","HR","Product","Legal","Operations","Support"].map(d => (
                    <label key={d} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer border ${compForm.target_departments.includes(d) ? "bg-brand-50 border-brand-300 text-brand-700" : "bg-white border-slate-200 text-slate-600"}`}>
                      <input type="checkbox" checked={compForm.target_departments.includes(d)} onChange={e => { if (e.target.checked) setCompForm(f => ({ ...f, target_departments: [...f.target_departments, d] })); else setCompForm(f => ({ ...f, target_departments: f.target_departments.filter(x => x !== d) })); }} className="w-3 h-3 rounded" />{d}
                    </label>
                  ))}</div></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label><input type="file" onChange={e => setCompForm(f => ({ ...f, file: e.target.files[0] }))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading ? "Uploading..." : "Upload Document"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Employee Doc Upload Modal */}
      <AnimatePresence>
        {showEmpUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEmpUpload(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Upload for Employee</h3><button onClick={() => setShowEmpUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button></div>
              <form onSubmit={handleEmpUpload} className="space-y-4">
                {formError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">{formError}</div>}
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label><select value={empForm.employee_id} onChange={e => setEmpForm(f => ({ ...f, employee_id: e.target.value }))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"><option value="">Select...</option>{employees.map(emp => <option key={emp.id||emp._id} value={emp.id||emp._id}>{emp.first_name} {emp.last_name}</option>)}</select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label><input value={empForm.title} onChange={e => setEmpForm(f => ({ ...f, title: e.target.value }))} required placeholder="Offer Letter" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label><select value={empForm.category} onChange={e => setEmpForm(f => ({ ...f, category: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none"><option value="other">Other</option><option value="offer_letter">Offer Letter</option><option value="experience_letter">Experience Letter</option><option value="certificate">Certificate</option><option value="id_proof">ID Proof</option></select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label><input type="file" onChange={e => setEmpForm(f => ({ ...f, file: e.target.files[0] }))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading ? "Uploading..." : "Upload"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Upload Modal */}
      <AnimatePresence>
        {showTplUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTplUpload(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Upload Template</h3><button onClick={() => setShowTplUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button></div>
              <form onSubmit={handleTplUpload} className="space-y-4">
                {formError && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">{formError}</div>}
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label><input value={tplForm.title} onChange={e => setTplForm(f => ({ ...f, title: e.target.value }))} required placeholder="Leave Application Form" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><textarea rows={2} value={tplForm.description} onChange={e => setTplForm(f => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none resize-none" placeholder="Brief description..." /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label><input type="file" onChange={e => setTplForm(f => ({ ...f, file: e.target.files[0] }))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading ? "Uploading..." : "Upload Template"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
