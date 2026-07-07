"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Search, Download, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { requestDocument, reviewDocumentRequest, getDefaultDocumentTitles } from "@/lib/api";
import { useDocumentRequests, useEmployees, useInvalidate } from "@/lib/queries";
import { downloadCSV, EXPORT_CONFIGS } from "@/lib/excel";

const PAGE_SIZE = 15;

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"Pending"  },
  uploaded: { cls:"bg-blue-50 text-blue-600 border-blue-200",    label:"Uploaded" },
  approved: { cls:"bg-green-50 text-green-600 border-green-200", label:"Approved" },
  rejected: { cls:"bg-red-50 text-red-500 border-red-200",       label:"Rejected" },
};

export default function DocRequestsPage() {
  const invalidate = useInvalidate();
  const { data: requests = [], isLoading } = useDocumentRequests({ limit: 200 });
  const { data: empData } = useEmployees({ limit: 100 });
  const employees = empData?.employees || [];
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ employee_id:"", title:"", description:"", category:"other", due_date:"" });
  const [defaultTitles, setDefaultTitles] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  useEffect(()=>{ getDefaultDocumentTitles().then(r=>{ if(r.ok&&r.data) setDefaultTitles(r.data.titles||r.data||[]); }); },[]);

  const filtered = requests.filter(r => {
    const matchSearch = !search || r.employee_name?.toLowerCase().includes(search.toLowerCase()) || r.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await requestDocument(form);
    if (res.ok) { showToast("Request sent to employee"); setShowCreate(false); setForm({employee_id:"",title:"",description:"",category:"other",due_date:""}); invalidate("document-requests"); }
    else showToast(res.data?.detail?.[0]?.msg||"Failed","error");
    setFormLoading(false);
  };

  const handleReview = async (reqId, action) => {
    const res = await reviewDocumentRequest(reqId, action, action==="reject"?"Please re-upload":"");
    if (res.ok) { showToast(`Document ${action}d`); invalidate("document-requests"); }
    else showToast("Action failed","error");
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
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} placeholder="Search employee or document..." className="bg-transparent text-sm placeholder:text-slate-400 outline-none w-full"/>
        </div>
        <select value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="uploaded">Uploaded</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {filtered.length > 0 && (
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
            onClick={()=>downloadCSV(filtered, EXPORT_CONFIGS.doc_requests, `doc_requests_${new Date().toISOString().slice(0,10)}.csv`)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold shadow-md">
            <Download className="w-4 h-4"/> Export
          </motion.button>
        )}
        <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20 ml-auto">
          <Plus className="w-4 h-4"/> Request Document
        </motion.button>
      </div>

      {isLoading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      : paged.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">{search||statusFilter?"No requests match your search":"No document requests"}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80">
                {["Employee","Document","Category","Due Date","Status","Actions"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-5 py-3 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {paged.map((req,i)=>{
                  const sc=statusCfg[req.status]||statusCfg.pending;
                  return (
                    <motion.tr key={req.id||req._id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-5 py-3 text-sm font-semibold text-slate-800">{req.employee_name||req.employee_id}</td>
                      <td className="px-5 py-3 text-xs text-slate-700">{req.title}</td>
                      <td className="px-5 py-3 text-xs text-slate-500 capitalize">{req.category}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">{req.due_date||"—"}</td>
                      <td className="px-5 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {req.status==="uploaded"&&<>
                            {req.file_url&&<a href={req.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100">View</a>}
                            <button onClick={()=>handleReview(req.id||req._id,"approve")} className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg hover:bg-green-100">Approve</button>
                            <button onClick={()=>handleReview(req.id||req._id,"reject")} className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg hover:bg-red-100">Reject</button>
                          </>}
                          {req.status==="pending"&&<span className="text-[10px] text-slate-400">Awaiting upload</span>}
                          {req.status==="approved"&&<div className="flex gap-1.5">
                            {req.file_url&&<a href={req.file_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg hover:bg-brand-100 flex items-center gap-1"><Download className="w-3 h-3"/> Download</a>}
                            <span className="text-[10px] text-green-600 font-bold">✓ Approved</span>
                          </div>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({filtered.length} requests)</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronLeft className="w-4 h-4 text-slate-500"/></button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40"><ChevronRight className="w-4 h-4 text-slate-500"/></button>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <div><h3 className="text-lg font-bold text-slate-900">Request Document</h3><p className="text-xs text-slate-500 mt-0.5">Employee will be notified to upload</p></div>
                <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button>
              </div>
              <form onSubmit={handleCreate} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={form.employee_id} onChange={e=>setForm(f=>({...f,employee_id:e.target.value}))} required className={inputCls}>
                    <option value="">Select employee...</option>{employees.map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name} — {e.department}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Document Title *</label>
                  <select value={form.title} onChange={e=>{ const v=e.target.value; setForm(f=>({...f,title:v})); const m=defaultTitles.find(t=>t.title===v); if(m) setForm(f=>({...f,title:v,category:m.category})); }} required className={inputCls}>
                    <option value="">Select document...</option>
                    {defaultTitles.map((t,i)=><option key={i} value={t.title}>{t.title}</option>)}
                    <option value="custom">Other (custom)</option>
                  </select>
                  {form.title==="custom"&&<input value="" onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Enter title..." className={`${inputCls} mt-2`}/>}
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category</label>
                  <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className={inputCls}>
                    <option value="id_proof">ID Proof</option><option value="certificate">Certificate</option><option value="experience_letter">Experience Letter</option><option value="offer_letter">Offer Letter</option><option value="payslip">Payslip</option><option value="other">Other</option>
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className={inputCls}/></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label><textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} className={`${inputCls} resize-none`}/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Sending...":"Send Request"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
