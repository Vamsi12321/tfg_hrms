"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { File, Upload, Download, Trash2, Search, CheckCircle2, AlertCircle, X } from "lucide-react";
import { uploadTemplate, deleteTemplate } from "@/lib/api";
import { useTemplates, useInvalidate } from "@/lib/queries";

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
    const res = await deleteTemplate(id);
    if (res.ok) { showToast("Deleted"); invalidate("templates"); }
    else showToast("Failed","error");
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 w-64 focus-within:border-brand-400">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search templates..." className="bg-transparent text-sm placeholder:text-slate-400 outline-none w-full"/>
        </div>
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowUpload(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
          <Upload className="w-4 h-4"/> Upload Template
        </motion.button>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : filtered.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <File className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">{searchQuery?"No templates match":"No templates uploaded yet"}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tpl,i)=>(
            <motion.div key={tpl.id||tpl._id||i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><File className="w-5 h-5 text-amber-500"/></div>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{tpl.title}</h4>
              {tpl.description&&<p className="text-xs text-slate-500 mb-2">{tpl.description}</p>}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                {tpl.file_url&&<a href={tpl.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 hover:underline flex items-center gap-1"><Download className="w-3 h-3"/> Download</a>}
                <button onClick={()=>handleDelete(tpl.id||tpl._id)} className="text-[10px] text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showUpload&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowUpload(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Upload Template</h3><button onClick={()=>setShowUpload(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleUpload} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="Leave Application Form" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">File *</label><input ref={fileRef} type="file" required className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100"/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Uploading...":"Upload Template"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
