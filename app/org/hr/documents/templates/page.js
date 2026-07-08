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
  const [form, setForm] = useState({ title:"", description:"" });
  const fileRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const filtered = templates.filter(t=>t.title?.toLowerCase().includes(searchQuery.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const [page, setPage] = useState(1);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return showToast("Select a file","error");
    setFormLoading(true);
    const res = await uploadTemplate(file, form.title, form.description);
    if (res.ok) { showToast("Template uploaded"); setShowUpload(false); setForm({title:"",description:""}); invalidate("templates"); }
    else showToast(res.data?.detail?.[0]?.msg||"Upload failed","error");
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this template?")) return;
    const res = await deleteTemplate(id);
    if (res.ok) { showToast("Deleted"); invalidate("templates"); }
    else showToast("Failed","error");
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all";

  // KPIs
  const kpiTotal = templates.length;
  const kpiActive = templates.length; // all active by default
  const kpiForms = templates.filter(t => t.title?.toLowerCase().includes("form")).length;
  const kpiOthers = kpiTotal - kpiForms;

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto p-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Page Title at Top */}
      <div>
        <h3 className="text-2xl font-bold text-slate-800">Document Templates</h3>
        <p className="text-sm font-medium text-slate-500">Standard forms and letters for your organization.</p>
      </div>

      {/* Stat Cards (Exactly matches layout in Projects workspace) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Templates</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{kpiTotal}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-blue-500" />
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{kpiActive}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Forms</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{kpiForms}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-purple-500" />
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Others</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{kpiOthers}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-slate-400" />
        </div>
      </div>

      {/* Section Title with action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h4 className="text-lg font-bold text-slate-800">Templates Workspace</h4>
          <p className="text-xs font-medium text-slate-500">Access and download custom document templates</p>
        </div>
        <button onClick={()=>setShowUpload(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors self-start sm:self-auto shadow-sm">
          <Upload className="w-4 h-4"/> Upload Template
        </button>
      </div>

      {/* Structured Filter Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1 min-w-[250px] transition-all focus-within:border-brand-500 focus-within:bg-white">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search templates..." className="bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none w-full"/>
          {searchQuery && <button onClick={()=>setSearchQuery("")}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600"/></button>}
        </div>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"/>
        </div>
      ) : filtered.length===0 ? (
        <div className="flex justify-center py-10">
          <div className="bg-white rounded-3xl p-10 border border-slate-200/60 shadow-sm text-center max-w-lg w-full">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <LayoutTemplate className="w-8 h-8"/>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">{searchQuery?"No matching templates":"No templates uploaded yet"}</h3>
            <p className="text-sm font-medium text-slate-500 mb-5">Click 'Upload Template' to add standard forms for your team.</p>
            <button onClick={()=>setShowUpload(true)}
              className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
              Upload Template
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {paged.map((tpl,i)=>(
              <motion.div key={tpl.id||tpl._id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
                
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50/50 flex items-center justify-center border border-amber-100/30 flex-shrink-0">
                      <File className="w-5 h-5 text-amber-500"/>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">{tpl.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">Standard template file</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold bg-emerald-50 text-emerald-600 border-emerald-100">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-amber-50/30 border border-amber-100/20 rounded-2xl p-4 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">Type</p>
                    <p className="text-xl font-black text-amber-700">Template</p>
                  </div>
                  <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-4 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Format</p>
                    <p className="text-xl font-black text-blue-700">Document</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-400">Created On</span>
                    <span className="text-slate-900 font-bold">{tpl.created_at ? new Date(tpl.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                  </div>
                  {tpl.description && (
                    <div className="flex flex-col text-sm py-1 gap-1">
                      <span className="text-slate-400">Description</span>
                      <span className="text-slate-600 font-medium text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">{tpl.description}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                  {tpl.file_url && (
                    <a href={tpl.file_url} target="_blank" rel="noopener noreferrer" 
                      className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-sm">
                      Download Template
                    </a>
                  )}
                  <button onClick={()=>handleDelete(tpl.id||tpl._id)} 
                    className="w-11 h-11 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </div>

              </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl px-6 py-4 border border-slate-100 shadow-sm mt-4">
              <p className="text-sm font-semibold text-slate-500">Showing page <span className="text-slate-900">{page}</span> of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Clean White Modal */}
      <AnimatePresence>
        {showUpload&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" 
            onClick={()=>setShowUpload(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} transition={{duration:0.2}}
              onClick={e=>e.stopPropagation()} 
              className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Upload Template</h3>
                  <p className="text-xs font-medium text-slate-500">Add a new standard form</p>
                </div>
                <button onClick={()=>setShowUpload(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleUpload} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Title *</label>
                    <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="e.g. Leave Application Form" className={inputCls}/>
                  </div>
                  
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Description</label>
                    <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief summary..." className={`${inputCls} resize-none`}/>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Upload File *</label>
                    <div className="relative group cursor-pointer">
                      <div className="absolute inset-0 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 group-hover:border-brand-400 group-hover:bg-brand-50 transition-colors pointer-events-none"/>
                      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required className="relative w-full z-10 px-6 py-8 opacity-0 cursor-pointer"/>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-brand-500 mb-2 transition-colors"/>
                        <p className="text-sm font-semibold text-slate-700">Click or drag file here</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={()=>setShowUpload(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={formLoading}
                      className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-70 transition-colors">
                      {formLoading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
