"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Upload, Search, Download, Trash2, FileText, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { uploadCompanyDocument, deleteCompanyDocument } from "@/lib/api";
import { useCompanyDocuments, useDepartments, useInvalidate } from "@/lib/queries";
import { downloadCSV, EXPORT_CONFIGS } from "@/lib/excel";

const PAGE_SIZE = 12;

export default function CompanyDocsPage() {
  const invalidate = useInvalidate();
  const { data: companyDocs = [], isLoading } = useCompanyDocuments({ limit: 200 });
  const { data: deptList = [] } = useDepartments();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showUpload, setShowUpload] = useState(false);
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

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 transition-all";

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-400">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input value={searchQuery} onChange={e=>{ setSearchQuery(e.target.value); setPage(1); }} placeholder="Search documents..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"/>
        </div>
        <select value={categoryFilter} onChange={e=>{ setCategoryFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400">
          <option value="">All Categories</option>
          {["policy","handbook","template","form","other"].map(c=><option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
        {filtered.length > 0 && (
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            onClick={()=>downloadCSV(filtered, EXPORT_CONFIGS.documents, `company_documents_${new Date().toISOString().slice(0,10)}.csv`)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md">
            <Download className="w-4 h-4"/> Export
          </motion.button>
        )}
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
          <Upload className="w-4 h-4"/> Upload Document
        </motion.button>
      </div>

      {!isLoading && filtered.length > 0 && (
        <p className="text-xs text-slate-500">{filtered.length} document{filtered.length!==1?"s":""}</p>
      )}

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : paged.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">{searchQuery||categoryFilter?"No documents match your search":"No company documents yet"}</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((doc,i)=>(
              <motion.div key={doc.id||doc._id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-500"/></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 capitalize">{doc.category||"other"}</span>
                    {doc.is_mandatory&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Mandatory</span>}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{doc.title}</h4>
                {doc.description&&<p className="text-xs text-slate-500 mb-2 line-clamp-2">{doc.description}</p>}
                {doc.target_departments?.length > 0 && (
                  <p className="text-[10px] text-brand-600 mb-2">{doc.target_departments.join(", ")}</p>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                  {doc.file_url&&<a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Download className="w-3 h-3"/> Download</a>}
                  <button onClick={()=>handleDelete(doc.id||doc._id)} className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
              </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white rounded-2xl px-5 py-3 border border-slate-100 shadow-sm">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({filtered.length} docs)</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-500"/></button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-500"/></button>
              </div>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showUpload&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowUpload(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Upload Company Document</h3><button onClick={()=>setShowUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Employee Handbook v3" className={inputCls}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                    <option value="policy">Policy</option><option value="handbook">Handbook</option><option value="template">Template</option><option value="form">Form</option><option value="other">Other</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={`${inputCls} resize-none`}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Target Departments <span className="text-slate-400 font-normal">(empty = all)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {deptList.map(dept=>(
                      <label key={dept.id||dept.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer border transition-all ${form.target_departments.includes(dept.name)?"bg-brand-50 border-brand-300 text-brand-700":"bg-white border-slate-200 text-slate-600"}`}>
                        <input type="checkbox" checked={form.target_departments.includes(dept.name)} onChange={e=>{if(e.target.checked)setForm(f=>({...f,target_departments:[...f.target_departments,dept.name]}));else setForm(f=>({...f,target_departments:f.target_departments.filter(d=>d!==dept.name)}));}} className="w-3 h-3 rounded"/>
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_mandatory} onChange={e=>setForm(f=>({...f,is_mandatory:e.target.checked}))} className="w-4 h-4 rounded border-slate-300"/><span className="text-xs font-semibold text-slate-700">Mandatory (employees must acknowledge)</span></label>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Uploading...":"Upload Document"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CompanyDocsPage() {
  const invalidate = useInvalidate();
  const { data: companyDocs = [], isLoading } = useCompanyDocuments({ limit: 50 });
  const { data: deptList = [] } = useDepartments();
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ title:"", category:"policy", description:"", target_departments:[], is_mandatory:false });
  const fileRef = useRef(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const filtered = companyDocs.filter(d=>d.title?.toLowerCase().includes(searchQuery.toLowerCase()));

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
    const res = await deleteCompanyDocument(id);
    if (res.ok) { showToast("Deleted"); invalidate("company-documents"); }
    else showToast("Failed","error");
  };

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 transition-all";

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 w-64 focus-within:border-brand-400">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search documents..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full"/>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
          <Upload className="w-4 h-4"/> Upload Document
        </motion.button>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : filtered.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">{searchQuery?"No documents match your search":"No company documents yet"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc,i)=>(
            <motion.div key={doc.id||doc._id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-500"/></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{doc.category||"other"}</span>
                  {doc.is_mandatory&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500">Mandatory</span>}
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{doc.title}</h4>
              {doc.description&&<p className="text-xs text-slate-500 mb-2">{doc.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                {doc.file_url&&<a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Download className="w-3 h-3"/> Download</a>}
                <button onClick={()=>handleDelete(doc.id||doc._id)} className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowUpload(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Upload Company Document</h3><button onClick={()=>setShowUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Employee Handbook v3" className={inputCls}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                    <option value="policy">Policy</option><option value="handbook">Handbook</option><option value="template">Template</option><option value="form">Form</option><option value="other">Other</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={`${inputCls} resize-none`}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Target Departments <span className="text-slate-400 font-normal">(empty = all)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {deptList.map(dept=>(
                      <label key={dept.id||dept.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold cursor-pointer border transition-all ${form.target_departments.includes(dept.name)?"bg-brand-50 border-brand-300 text-brand-700":"bg-white border-slate-200 text-slate-600"}`}>
                        <input type="checkbox" checked={form.target_departments.includes(dept.name)} onChange={e=>{if(e.target.checked)setForm(f=>({...f,target_departments:[...f.target_departments,dept.name]}));else setForm(f=>({...f,target_departments:f.target_departments.filter(d=>d!==dept.name)}));}} className="w-3 h-3 rounded"/>
                        {dept.name}
                      </label>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_mandatory} onChange={e=>setForm(f=>({...f,is_mandatory:e.target.checked}))} className="w-4 h-4 rounded border-slate-300"/><span className="text-xs font-semibold text-slate-700">Mandatory (employees must acknowledge)</span></label>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label><input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" required className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Uploading...":"Upload Document"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
