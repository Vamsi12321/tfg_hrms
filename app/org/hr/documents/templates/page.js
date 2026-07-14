"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { File, Upload, Download, Trash2, Search, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight, LayoutTemplate } from "lucide-react";
import { uploadTemplate, deleteTemplate } from "@/lib/api";
import { useTemplates, useInvalidate } from "@/lib/queries";

const PAGE_SIZE = 12;

export default function TemplatesPage() {
  const invalidate = useInvalidate();
  const { data: templates = [], isLoading } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const fileRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const filtered = templates.filter(t => t.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return showToast("Select a file", "error");
    setFormLoading(true);
    const res = await uploadTemplate(file, form.title, form.description);
    if (res.ok) { showToast("Template uploaded"); setShowUpload(false); setForm({ title: "", description: "" }); invalidate("templates"); }
    else showToast(res.data?.detail?.[0]?.msg || "Upload failed", "error");
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    const res = await deleteTemplate(id);
    if (res.ok) { showToast("Deleted"); invalidate("templates"); }
    else showToast("Failed", "error");
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
          {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />} {toast.msg}
        </motion.div>)}
      </AnimatePresence>

      {/* Header + Action */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Document Templates</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Standard forms and letters for your organization</p>
        </div>
        <button onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20">
          <Upload className="w-3.5 h-3.5" /> Upload Template
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
        <div className="relative flex-1 max-w-[280px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Search templates..." className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10" />
        </div>
        <p className="text-[10px] text-slate-400 ml-auto">{filtered.length} template{filtered.length !== 1 ? "s" : ""}</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <LayoutTemplate className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400 mb-1">{searchQuery ? "No matching templates" : "No templates uploaded yet"}</p>
          <p className="text-xs text-slate-300 mb-4">Upload standard forms for your team to use</p>
          <button onClick={() => setShowUpload(true)} className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100">Upload Template</button>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                  {["Template", "Description", "Created", "Actions"].map(h =>
                    <th key={h} className="text-left text-[10px] font-bold text-white uppercase px-5 py-3 tracking-wide">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {paged.map((tpl, i) => (
                    <motion.tr key={tpl.id || tpl._id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="border-t border-slate-100 hover:bg-slate-50/50 group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                            <File className="w-4 h-4 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{tpl.title}</p>
                            <p className="text-[9px] text-slate-400">Document template</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-[250px] truncate">{tpl.description || "—"}</td>
                      <td className="px-5 py-4 text-[10px] text-slate-500">{tpl.created_at ? new Date(tpl.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {tpl.file_url && (
                            <a href={tpl.file_url} target="_blank" rel="noopener noreferrer"
                              className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center" title="Download">
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                            </a>
                          )}
                          <button onClick={() => handleDelete(tpl.id || tpl._id)}
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUpload(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Upload Template</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Add a new standard form</p>
                </div>
                <button onClick={() => setShowUpload(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                    placeholder="e.g. Leave Application Form"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Description</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief summary..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 resize-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Upload File *</label>
                  <div className="relative group cursor-pointer">
                    <div className="absolute inset-0 rounded-xl border-2 border-dashed border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-colors pointer-events-none" />
                    <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required className="relative w-full z-10 px-6 py-8 opacity-0 cursor-pointer" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                      <p className="text-xs font-semibold text-slate-600">Click or drag file here</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">PDF, DOC, DOCX, XLS, XLSX</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowUpload(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={formLoading}
                    className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-60">
                    {formLoading ? "Uploading..." : "Upload Template"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
