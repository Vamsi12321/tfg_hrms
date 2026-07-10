"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Plus, Search, Download, CheckCircle2, AlertCircle, X, ChevronLeft, ChevronRight, FileText, ChevronDown, Clock, CheckCircle } from "lucide-react";
import { requestDocument, reviewDocumentRequest, getDefaultDocumentTitles } from "@/lib/api";
import { useDocumentRequests, useEmployees, useInvalidate } from "@/lib/queries";
import { downloadCSV, EXPORT_CONFIGS } from "@/lib/excel";

const PAGE_SIZE = 15;

const statusCfg = {
  pending:  { cls:"bg-amber-50 text-amber-600 border-amber-200", label:"Pending"  },
  uploaded: { cls:"bg-blue-50 text-blue-600 border-blue-200",    label:"Uploaded" },
  approved: { cls:"bg-emerald-50 text-emerald-600 border-emerald-200", label:"Approved" },
  rejected: { cls:"bg-rose-50 text-rose-600 border-rose-200",       label:"Rejected" },
};

function EmpDropdown({ employees, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef(null);

  const filtered = employees.filter(e => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const dept = (e.department || "").toLowerCase();
    return !q || name.includes(q.toLowerCase()) || dept.includes(q.toLowerCase());
  });

  const selected = employees.find(e => (e.id || e._id) === value);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${open ? "border-brand-500 bg-white" : "border-slate-200 bg-white hover:border-brand-400"}`}>
        <div className="flex items-center gap-3 min-w-0">
          {selected ? (
            <>
              <div className="text-left leading-tight truncate">
                <span className="block truncate text-slate-800 font-bold">{selected.first_name} {selected.last_name}</span>
                <span className="block text-slate-500 text-[10px] font-medium">{selected.department || "No Dept"}</span>
              </div>
            </>
          ) : (
            <span className="text-slate-400 font-medium">Search and select employee...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }}
            className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="p-2 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input value={q} onChange={e => setQ(e.target.value)} autoFocus placeholder="Search name or dept..."
                  className="bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none w-full" />
                {q && <button onClick={() => setQ("")}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600" /></button>}
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto p-1.5 custom-scrollbar">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-slate-400">
                  <p className="text-xs font-semibold">No employees found</p>
                </div>
              ) : filtered.map(e => {
                const id = e.id || e._id;
                const isSelected = id === value;
                return (
                  <button key={id} type="button"
                    onClick={() => { onChange(id); setOpen(false); setQ(""); }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors mt-0.5 ${isSelected ? "bg-brand-50 text-brand-700" : "hover:bg-slate-50 text-slate-700"}`}>
                    <div className="text-left min-w-0">
                      <p className={`text-sm font-bold truncate ${isSelected ? "text-brand-700" : "text-slate-800"}`}>{e.first_name} {e.last_name}</p>
                      <p className="text-[10px] font-medium text-slate-500 truncate">{e.department || "No Dept"} · {e.employee_id}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600 flex-shrink-0 ml-auto" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DocRequestsPage() {
  const invalidate = useInvalidate();
  const { data: requests = [], isLoading } = useDocumentRequests({ limit: 100 });
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

  const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 bg-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all";

  // KPIs
  const kpiTotal = filtered.length;
  const kpiPending = filtered.filter(r=>r.status==="pending").length;
  const kpiUploaded = filtered.filter(r=>r.status==="uploaded").length;
  const kpiApproved = filtered.filter(r=>r.status==="approved").length;

  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto p-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Page Title at Top */}
      <div>
        <h3 className="text-2xl font-bold text-slate-800">Document Requests</h3>
        <p className="text-sm font-medium text-slate-500">Track and manage documents required from employees.</p>
      </div>

      {/* Stat Cards (Exactly matches layout in Projects workspace) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Requests</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{kpiTotal}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-blue-500" />
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Awaiting Upload</p>
            <p className="text-3xl font-black text-amber-600 mt-2">{kpiPending}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-amber-500" />
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Needs Review</p>
            <p className="text-3xl font-black text-blue-600 mt-2">{kpiUploaded}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-purple-500" />
        </div>
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative min-h-[110px]">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approved</p>
            <p className="text-3xl font-black text-emerald-600 mt-2">{kpiApproved}</p>
          </div>
          <div className="absolute top-6 right-6 w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* Section Title with action button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h4 className="text-lg font-bold text-slate-800">Requests Workspace</h4>
          <p className="text-xs font-medium text-slate-500">Coordinate and verify employee document uploads</p>
        </div>
        <button onClick={()=>setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors self-start sm:self-auto shadow-sm">
          <Plus className="w-4 h-4"/> Request Document
        </button>
      </div>

      {/* Structured Filter Card */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 flex-1 min-w-[250px] transition-all focus-within:border-brand-500 focus-within:bg-white">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0"/>
          <input value={search} onChange={e=>{ setSearch(e.target.value); setPage(1); }} placeholder="Search employee or document title..." className="bg-transparent text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none w-full"/>
          {search && <button onClick={()=>setSearch("")}><X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600"/></button>}
        </div>
        <select value={statusFilter} onChange={e=>{ setStatusFilter(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 outline-none shadow-sm focus:border-brand-500 transition-all cursor-pointer min-w-[150px]">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="uploaded">Uploaded (Needs Review)</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        {filtered.length > 0 && (
          <button onClick={()=>downloadCSV(filtered, EXPORT_CONFIGS.doc_requests, `doc_requests_${new Date().toISOString().slice(0,10)}.csv`)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-semibold shadow-sm transition-all ml-auto">
            <Download className="w-4 h-4 text-slate-400"/> Export
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"/>
        </div>
      ) : paged.length===0 ? (
        <div className="flex justify-center py-10">
          <div className="bg-white rounded-3xl p-10 border border-slate-200/60 shadow-sm text-center max-w-lg w-full">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Bell className="w-8 h-8"/>
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">{search||statusFilter?"No matching requests found":"No document requests"}</h3>
            <p className="text-sm font-medium text-slate-500 mb-5">Click 'Request Document' to ask an employee for a file.</p>
            <button onClick={()=>setShowCreate(true)}
              className="px-5 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all">
              Request Document
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50/80 border-b border-slate-100">
                {["Employee","Document Details","Due Date","Status","Actions"].map(h=><th key={h} className="text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider px-6 py-4 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {paged.map((req,i)=>{
                  const sc=statusCfg[req.status]||statusCfg.pending;
                  return (
                    <motion.tr key={req.id||req._id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-800">{req.employee_name||req.employee_id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-800">{req.title}</p>
                        <p className="text-[11px] font-medium text-slate-500 uppercase mt-0.5">{req.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-600">{req.due_date||"—"}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${sc.cls}`}>
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {req.status==="uploaded"&&<>
                            {req.file_url&&<a href={req.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">Review File</a>}
                            <button onClick={()=>handleReview(req.id||req._id,"approve")} className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">Approve</button>
                            <button onClick={()=>handleReview(req.id||req._id,"reject")} className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors">Reject</button>
                          </>}
                          {req.status==="pending"&&<span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">Awaiting upload</span>}
                          {req.status==="approved"&&<div className="flex gap-2">
                            {req.file_url&&<a href={req.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 flex items-center gap-1.5 transition-colors"><Download className="w-3.5 h-3.5"/> Download</a>}
                          </div>}
                          {req.status==="rejected"&&<span className="text-[11px] font-medium text-rose-500 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">Revision needed</span>}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-sm font-medium text-slate-500">Showing page <span className="text-slate-800 font-bold">{page}</span> of {totalPages}</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"><ChevronLeft className="w-4 h-4"/></button>
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"><ChevronRight className="w-4 h-4"/></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clean White Modal */}
      <AnimatePresence>
        {showCreate&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6" 
            onClick={()=>setShowCreate(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} transition={{duration:0.2}}
              onClick={e=>e.stopPropagation()} 
              className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Request Document</h3>
                  <p className="text-xs font-medium text-slate-500">Notify employee to upload file</p>
                </div>
                <button onClick={()=>setShowCreate(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors">
                  <X className="w-4 h-4"/>
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleCreate} className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Employee *</label>
                    <EmpDropdown employees={employees} value={form.employee_id} onChange={id => setForm(f => ({ ...f, employee_id: id }))} />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Document Title *</label>
                      <select value={form.title} onChange={e=>{ const v=e.target.value; setForm(f=>({...f,title:v})); const m=defaultTitles.find(t=>t.title===v); if(m) setForm(f=>({...f,title:v,category:m.category})); }} required 
                        className={`${inputCls} cursor-pointer`}>
                        <option value="">Select document...</option>
                        {defaultTitles.map((t,i)=><option key={i} value={t.title}>{t.title}</option>)}
                        <option value="custom">Other (custom)</option>
                      </select>
                      {form.title==="custom"&&<motion.input initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}} value="" onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Enter title..." className={`${inputCls} mt-3`}/>}
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Category</label>
                      <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className={`${inputCls} cursor-pointer`}>
                        <option value="id_proof">ID Proof</option><option value="certificate">Certificate</option><option value="experience_letter">Experience Letter</option><option value="offer_letter">Offer Letter</option><option value="payslip">Payslip</option><option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Due Date</label>
                      <input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} className={inputCls}/>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1.5 block">Instructions</label>
                    <textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Add any special instructions..." className={`${inputCls} resize-none`}/>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <button type="button" onClick={()=>setShowCreate(false)}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                      Cancel
                    </button>
                    <button type="submit" disabled={formLoading || !form.employee_id}
                      className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-70 transition-colors">
                      {formLoading ? "Sending..." : "Send Request"}
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