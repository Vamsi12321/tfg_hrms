"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Upload, Search, Download, Trash2, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight, Book, FileText, ChevronDown } from "lucide-react";
import { uploadCompanyDocument, deleteCompanyDocument } from "@/lib/api";
import { useCompanyDocuments, useDepartments, useInvalidate } from "@/lib/queries";

const PAGE_SIZE = 12;

export default function CompanyDocsPage() {
  const invalidate = useInvalidate();
  const { data: companyDocs = [], isLoading } = useCompanyDocuments({ limit: 100 });
  const { data: deptList = [] } = useDepartments();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
  const [deptDropOpen, setDeptDropOpen] = useState(false);
  const [form, setForm] = useState({ title:"", category:"policy", description:"", target_departments:[], is_mandatory:false });
  const fileRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const filtered = companyDocs.filter(d => {
    const matchSearch = !searchQuery || d.title?.toLowerCase().includes(searchQuery.toLowerCase()) || d.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = !categoryFilter || d.category === categoryFilter;
    return matchSearch && matchCat;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return showToast("Select a file","error");
    setFormLoading(true);
    const res = await uploadCompanyDocument(file, form.title, form.category, form.description, form.target_departments, form.is_mandatory);
    if (res.ok) { showToast("Document uploaded"); setShowUpload(false); setForm({title:"",category:"policy",description:"",target_departments:[],is_mandatory:false}); invalidate("company-documents"); }
    else showToast(res.data?.detail?.[0]?.msg||"Upload failed","error");
    setFormLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this document?")) return;
    const res = await deleteCompanyDocument(id);
    if (res.ok) { showToast("Deleted"); invalidate("company-documents"); }
    else showToast("Failed","error");
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all";

  // KPIs
  const kpiTotal = companyDocs.length;
  const kpiMandatory = companyDocs.filter(d => d.is_mandatory).length;
  const kpiOptional = companyDocs.filter(d => !d.is_mandatory).length;
  const kpiPolicies = companyDocs.filter(d => d.category === "policy").length;

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total", value: kpiTotal, color: "text-blue-600", iconBg: "bg-blue-50", icon: FileText, iconColor: "text-blue-500" },
          { label: "Mandatory", value: kpiMandatory, color: "text-red-600", iconBg: "bg-red-50", icon: Shield, iconColor: "text-red-500" },
          { label: "Optional", value: kpiOptional, color: "text-green-600", iconBg: "bg-green-50", icon: Book, iconColor: "text-green-500" },
          { label: "Policies", value: kpiPolicies, color: "text-slate-700", iconBg: "bg-slate-100", icon: Shield, iconColor: "text-slate-500" },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{s.label}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.iconColor}`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">All Documents</h4>
        </div>
        <button onClick={()=>setShowUpload(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20">
          <Upload className="w-3.5 h-3.5"/> Upload Document
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input value={searchQuery} onChange={e=>{ setSearchQuery(e.target.value); setPage(1); }} placeholder="Search documents..."
            className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10"/>
        </div>
        
        <select value={categoryFilter} onChange={e=>{ setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-white outline-none focus:border-blue-400 cursor-pointer">
          <option value="">All Categories</option>
          {["policy","handbook","template","form","other"].map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"/>
        </div>
      ) : paged.length===0 ? (
        <div className="flex justify-center py-10">
          <div className="bg-white rounded-2xl p-10 border border-slate-200/60 shadow-sm text-center max-w-lg w-full">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Book className="w-8 h-8"/>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">{searchQuery||categoryFilter?"No matching documents":"No company documents uploaded"}</h3>
            <p className="text-sm font-medium text-slate-500 mb-5">Click 'Upload Document' to add your first policy or handbook.</p>
            <button onClick={()=>setShowUpload(true)}
              className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
              Upload Document
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
            {paged.map((doc,i)=>(
              <motion.div key={doc.id||doc._id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.02}}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
                
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50/50 flex items-center justify-center border border-blue-100/30 flex-shrink-0">
                      <Shield className="w-5 h-5 text-blue-600"/>
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-tight">{doc.title}</h4>
                      <p className="text-xs text-slate-400 font-medium">EPF contributions</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold ${doc.is_mandatory ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${doc.is_mandatory ? "bg-red-500" : "bg-emerald-500"}`} />
                    {doc.is_mandatory ? "Mandatory" : "Optional"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="bg-blue-50/30 border border-blue-100/20 rounded-2xl p-4 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Category</p>
                    <p className="text-xl font-black text-blue-700 capitalize">{doc.category || "other"}</p>
                  </div>
                  <div className="bg-indigo-50/30 border border-indigo-100/20 rounded-2xl p-4 flex flex-col justify-center">
                    <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-1">Mandatory</p>
                    <p className="text-xl font-black text-brand-700">{doc.is_mandatory ? "Yes" : "No"}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-400">Target Departments</span>
                    <span className="text-slate-900 font-bold truncate max-w-[160px]">{doc.target_departments?.length > 0 ? doc.target_departments.join(", ") : "All Departments"}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm py-1">
                    <span className="text-slate-400">Uploaded On</span>
                    <span className="text-slate-900 font-bold">{doc.created_at ? new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}</span>
                  </div>
                  {doc.description && (
                    <div className="flex flex-col text-sm py-1 gap-1">
                      <span className="text-slate-400">Description</span>
                      <span className="text-slate-600 font-medium text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">{doc.description}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-100">
                  {doc.file_url && (
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" 
                      className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold text-center transition-colors shadow-sm">
                      Download File
                    </a>
                  )}
                  <button onClick={()=>handleDelete(doc.id||doc._id)} 
                    className="w-11 h-11 rounded-xl border border-slate-200 text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 flex items-center justify-center transition-all">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" 
            onClick={()=>{setShowUpload(false); setDeptDropOpen(false);}}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} transition={{type:"spring",damping:28,stiffness:320}}
              onClick={e=>e.stopPropagation()} 
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Gradient Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-white">Upload Document</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Publish a new policy or handbook</p>
                </div>
                <button onClick={()=>{setShowUpload(false); setDeptDropOpen(false);}} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white"/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form onSubmit={handleUpload} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Title *</label>
                    <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="e.g. Employee Handbook v3" className={inputCls}/>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Category</label>
                      <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className={`${inputCls} cursor-pointer`}>
                        <option value="policy">Policy</option><option value="handbook">Handbook</option><option value="template">Template</option><option value="form">Form</option><option value="other">Other</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl hover:bg-slate-50 border border-slate-100 w-full transition-colors">
                        <input type="checkbox" checked={form.is_mandatory} onChange={e=>setForm(f=>({...f,is_mandatory:e.target.checked}))} 
                          className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"/>
                        <span className="text-sm font-semibold text-slate-700">Mandatory</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Description</label>
                    <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief summary..." className={`${inputCls} resize-none`}/>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Target Departments</label>
                    <div className="relative">
                      <button type="button" onClick={()=>setDeptDropOpen(o=>!o)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${deptDropOpen ? "border-brand-500 bg-white" : "border-slate-200 bg-white hover:border-brand-400"}`}>
                        <span className={form.target_departments.length === 0 ? "text-slate-400" : "text-slate-800"}>
                          {form.target_departments.length === 0 ? "All Departments" : `${form.target_departments.length} selected`}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${deptDropOpen?"rotate-180":""}`}/>
                      </button>
                      
                      <AnimatePresence>
                        {deptDropOpen && (
                          <motion.div initial={{opacity:0, y:-5}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-5}} transition={{duration:0.15}}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-56 overflow-y-auto p-1.5">
                            <button type="button" onClick={()=>{ setForm(f=>({...f,target_departments:[]})); setDeptDropOpen(false); }}
                              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
                              All Departments (Clear)
                            </button>
                            <div className="h-px bg-slate-100 my-1"/>
                            {deptList.map(dept => {
                              const selected = form.target_departments.includes(dept.name);
                              return (
                                <button key={dept.id||dept.name} type="button"
                                  onClick={()=>{ setForm(f=>({ ...f, target_departments: selected ? f.target_departments.filter(d=>d!==dept.name) : [...f.target_departments, dept.name] })); }}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mt-0.5 ${selected?"bg-brand-50 text-brand-700":"text-slate-700 hover:bg-slate-50"}`}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selected ? "bg-brand-600 border-brand-600" : "bg-white border-slate-300"}`}>
                                    {selected && <CheckCircle2 className="w-3 h-3 text-white"/>}
                                  </div>
                                  {dept.name}
                                </button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
                    <button type="button" onClick={()=>{setShowUpload(false); setDeptDropOpen(false);}}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={formLoading}
                      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-60 transition-all">
                      {formLoading ? "Uploading..." : "Upload Document"}
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
