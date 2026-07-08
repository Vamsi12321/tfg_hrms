"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, CheckCircle2, XCircle, Calendar, Plus, X, Search, Eye, AlertCircle, Send, MessageSquare, CreditCard, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { listLeaves, approveLeave, rejectLeave, applyLeave, listEmployees, getLeaveConfig, forwardLeave, addLeaveComment, adjustLeaveBalance } from "@/lib/api";
import { downloadCSV, EXPORT_CONFIGS } from "@/lib/excel";

const statusCfg = {
  pending:   { cls:"bg-amber-50 text-amber-600 border-amber-200",  label:"Pending"   },
  approved:  { cls:"bg-green-50 text-green-600 border-green-200",  label:"Approved"  },
  rejected:  { cls:"bg-red-50 text-red-600 border-red-200",        label:"Rejected"  },
  cancelled: { cls:"bg-slate-50 text-slate-500 border-slate-200",  label:"Cancelled" },
};

const statusColors = {
  pending:   { bg:"from-amber-500 to-orange-500",  badge:"bg-amber-100 text-amber-700",  dot:"bg-amber-400"  },
  approved:  { bg:"from-green-500 to-emerald-500", badge:"bg-green-100 text-green-700",  dot:"bg-green-400"  },
  rejected:  { bg:"from-red-500 to-rose-500",      badge:"bg-red-100 text-red-700",      dot:"bg-red-400"    },
  cancelled: { bg:"from-slate-400 to-slate-500",   badge:"bg-slate-100 text-slate-500",  dot:"bg-slate-400"  },
};

export default function LeaveRequestsPage() {
  const [requests, setRequests]         = useState([]);
  const [totalRequests, setTotal]       = useState(0);
  const [totalPages, setTotalPages]     = useState(1);
  const [page, setPage]                 = useState(1);
  const [loading, setLoading]           = useState(true);
  const [toast, setToast]               = useState(null);
  const [formLoading, setFormLoading]   = useState(false);
  const [employees, setEmployees]       = useState([]);
  const [leaveTypes, setLeaveTypes]     = useState([]);
  const [summary, setSummary]           = useState({ pending:0, approved:0, rejected:0 });

  // pending filter state (user is still typing / selecting)
  const [pSearch, setPSearch]   = useState("");
  const [pStatus, setPStatus]   = useState("");
  const [pType,   setPType]     = useState("");
  const [pFrom,   setPFrom]     = useState("");
  const [pTo,     setPTo]       = useState("");
  // applied filter state (what was last submitted)
  const [aSearch, setASearch]   = useState("");
  const [aStatus, setAStatus]   = useState("");
  const [aType,   setAType]     = useState("");
  const [aFrom,   setAFrom]     = useState("");
  const [aTo,     setATo]       = useState("");

  const [showAddModal,     setShowAddModal]     = useState(false);
  const [showDetailModal,  setShowDetailModal]  = useState(null);
  const [showRejectModal,  setShowRejectModal]  = useState(null);
  const [showForwardModal, setShowForwardModal] = useState(null);
  const [showAdjustModal,  setShowAdjustModal]  = useState(false);
  const [rejectReason,     setRejectReason]     = useState("");
  const [forwardForm,      setForwardForm]      = useState({ forward_to:"", notes:"" });
  const [adjustForm,       setAdjustForm]       = useState({ employee_id:"", leave_type_code:"", action:"credit", days:"", reason:"" });
  const [commentText,      setCommentText]      = useState("");
  const [addForm, setAddForm] = useState({ employee_id:"", leave_type_code:"", start_date:"", end_date:"", reason:"", is_half_day:false, half_day_type:"first_half" });

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  const fetchLeaves = async (params = {}) => {
    setLoading(true);
    const p = { page, limit:20, ...params };
    const res = await listLeaves(p);
    if (res.ok && res.data) {
      setRequests(res.data.leaves||[]);
      setTotal(res.data.total||0);
      setTotalPages(res.data.pages||Math.ceil((res.data.total||0)/20)||1);
    }
    setLoading(false);
  };

  const fetchSummaryCounts = async () => {
    const [pRes,aRes,rRes] = await Promise.all([
      listLeaves({status:"pending",limit:1}),
      listLeaves({status:"approved",limit:1}),
      listLeaves({status:"rejected",limit:1}),
    ]);
    setSummary({
      pending:  pRes.ok ? pRes.data?.total||0 : 0,
      approved: aRes.ok ? aRes.data?.total||0 : 0,
      rejected: rRes.ok ? rRes.data?.total||0 : 0,
    });
  };

  useEffect(() => {
    fetchLeaves();
    fetchSummaryCounts();
    listEmployees({limit:100}).then(r=>{ if(r.ok) setEmployees(r.data?.employees||[]); });
    getLeaveConfig().then(r=>{ if(r.ok) setLeaveTypes(r.data?.leave_types||[]); });
  }, []);

  const handleApplyFilters = () => {
    setASearch(pSearch); setAStatus(pStatus); setAType(pType); setAFrom(pFrom); setATo(pTo);
    const params = {};
    if (pSearch) params.search    = pSearch;
    if (pStatus) params.status    = pStatus;
    if (pType)   params.leave_type_code = pType;
    if (pFrom)   params.from_date = pFrom;
    if (pTo)     params.to_date   = pTo;
    fetchLeaves(params);
  };

  const handleClearFilters = () => {
    setPSearch(""); setPStatus(""); setPType(""); setPFrom(""); setPTo("");
    setASearch(""); setAStatus(""); setAType(""); setAFrom(""); setATo("");
    fetchLeaves();
  };

  const handleSummaryClick = (status) => {
    setPStatus(status); setAStatus(status);
    fetchLeaves(status ? {status} : {});
  };

  const handleApprove = async (id) => {
    const res = await approveLeave(id);
    if (res.ok) { showToast("Leave approved"); setShowDetailModal(null); fetchLeaves({status:aStatus,search:aSearch,from_date:aFrom,to_date:aTo}); fetchSummaryCounts(); }
    else showToast(res.data?.detail||"Failed to approve","error");
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { showToast("Provide a reason","error"); return; }
    const res = await rejectLeave(id, rejectReason);
    if (res.ok) { showToast("Leave rejected"); setShowRejectModal(null); setRejectReason(""); fetchLeaves({status:aStatus,search:aSearch}); fetchSummaryCounts(); }
    else showToast(res.data?.detail||"Failed to reject","error");
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { ...addForm };
    if (!payload.is_half_day) delete payload.half_day_type;
    const res = await applyLeave(payload);
    if (res.ok) { showToast("Leave submitted"); setShowAddModal(false); setAddForm({employee_id:"",leave_type_code:"",start_date:"",end_date:"",reason:"",is_half_day:false,half_day_type:"first_half"}); fetchLeaves(); fetchSummaryCounts(); }
    else showToast(res.data?.detail?.[0]?.msg||res.data?.detail||"Failed","error");
    setFormLoading(false);
  };

  const handleForward = async () => {
    if (!forwardForm.forward_to) { showToast("Select a user","error"); return; }
    setFormLoading(true);
    const res = await forwardLeave(showForwardModal.id, forwardForm);
    if (res.ok) { showToast("Forwarded"); setShowForwardModal(null); setForwardForm({forward_to:"",notes:""}); }
    else showToast(res.data?.detail||"Failed","error");
    setFormLoading(false);
  };

  const handleComment = async (leaveId) => {
    if (!commentText.trim()) return;
    const res = await addLeaveComment(leaveId, commentText);
    if (res.ok) {
      showToast("Comment added"); setCommentText("");
      if (showDetailModal?.id===leaveId) setShowDetailModal(d=>({...d, comments:[...(d.comments||[]),{comment:commentText,created_at:new Date().toISOString(),author:"You"}]}));
    } else showToast(res.data?.detail||"Failed","error");
  };

  const handleAdjust = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await adjustLeaveBalance({...adjustForm, days:parseInt(adjustForm.days)||1});
    if (res.ok) { showToast(`Balance ${adjustForm.action}ed`); setShowAdjustModal(false); setAdjustForm({employee_id:"",leave_type_code:"",action:"credit",days:"",reason:""}); }
    else showToast(res.data?.detail||"Failed","error");
    setFormLoading(false);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast && (
          <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Pending",  value: summary.pending,  icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-100/50",   status: "pending"  },
          { label: "Approved", value: summary.approved, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100/50", status: "approved" },
          { label: "Rejected", value: summary.rejected, icon: XCircle,      color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-100/50",    status: "rejected" },
          { label: "Total",    value: totalRequests,    icon: Calendar,     color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-100/50",    status: ""         },
        ].map((s,i)=>(
          <motion.div key={i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
            onClick={()=>handleSummaryClick(s.status)}
            className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer flex items-center justify-between ${aStatus===s.status&&s.status?"ring-2 ring-brand-300 shadow-md scale-[1.02]":""}`}>
            <div>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${s.bg} ${s.border}`}>
              <s.icon className={`w-5 h-5 ${s.color} opacity-80 group-hover:scale-110 transition-transform`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters + actions bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
            <input value={pSearch} onChange={e=>setPSearch(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleApplyFilters()}
              placeholder="Search employee..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all w-44"/>
          </div>
          <select value={pStatus} onChange={e=>setPStatus(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all bg-white cursor-pointer">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={pType} onChange={e=>setPType(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all bg-white cursor-pointer">
            <option value="">All Leave Types</option>
            {leaveTypes.map(lt=><option key={lt.code} value={lt.code}>{lt.name}</option>)}
          </select>
          <input type="date" value={pFrom} onChange={e=>setPFrom(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all"/>
          <span className="text-slate-400 text-xs">—</span>
          <input type="date" value={pTo} onChange={e=>setPTo(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-sm transition-all"/>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleApplyFilters}
            className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold shadow-md">Apply</motion.button>
          {(aSearch||aStatus||aFrom||aTo) && (
            <button onClick={handleClearFilters} className="px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-500 hover:bg-slate-50">Clear</button>
          )}
          <div className="ml-auto flex gap-2">
            {requests.length > 0 && (
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                onClick={()=>downloadCSV(requests, EXPORT_CONFIGS.leave_requests, `leave_requests_${new Date().toISOString().slice(0,10)}.csv`)}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-semibold shadow-md">
                <Download className="w-3.5 h-3.5"/> Export
              </motion.button>
            )}
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowAdjustModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">
              <CreditCard className="w-3.5 h-3.5"/> Adjust Balance
            </motion.button>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowAddModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
              <Plus className="w-3.5 h-3.5"/> Add Request
            </motion.button>
          </div>
        </div>
      </div>

      {/* Requests table */}
      {loading ? (
        <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
      ) : requests.length===0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3"/>
          <p className="text-sm font-semibold text-slate-400">No leave requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                {["Employee","Leave Type","Duration","Days","Applied On","Status","Actions"].map(h=>
                  <th key={h} className="text-left text-[10px] font-bold text-white/70 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
              </tr></thead>
              <tbody>
                {requests.map((r,i)=>{
                  const sc=statusCfg[r.status]||statusCfg.pending;
                  return (
                    <motion.tr key={r.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}
                      className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">
                            {(r.employee_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2)}
                          </div>
                          <div><p className="text-xs font-semibold text-slate-800">{r.employee_name}</p><p className="text-[10px] text-slate-400">{r.department}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">{r.leave_type_name||r.leave_type_code}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{r.start_date} → {r.end_date}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-700">{r.days}d{r.is_half_day?" (½)":""}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{r.applied_at?new Date(r.applied_at).toLocaleDateString():"—"}</td>
                      <td className="px-4 py-3"><span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={()=>setShowDetailModal(r)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center" title="View">
                          <Eye className="w-3.5 h-3.5 text-slate-500"/>
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({totalRequests} requests)</p>
              <div className="flex items-center gap-2">
                <button onClick={()=>{ const p=Math.max(1,page-1); setPage(p); fetchLeaves({status:aStatus,search:aSearch,from_date:aFrom,to_date:aTo,page:p}); }} disabled={page===1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4 text-slate-500"/>
                </button>
                <button onClick={()=>{ const p=Math.min(totalPages,page+1); setPage(p); fetchLeaves({status:aStatus,search:aSearch,from_date:aFrom,to_date:aTo,page:p}); }} disabled={page>=totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4 text-slate-500"/>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (()=>{
          const lv=showDetailModal;
          const sc=statusColors[lv.status]||statusColors.pending;
          const initials=(lv.employee_name||"?").split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
          return (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
              onClick={()=>setShowDetailModal(null)}>
              <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} exit={{opacity:0,y:60}}
                transition={{type:"spring",damping:28,stiffness:320}}
                onClick={e=>e.stopPropagation()}
                className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
                <div className={`bg-gradient-to-br ${sc.bg} px-6 pt-5 pb-6 flex-shrink-0`}>
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${sc.badge}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${sc.dot} mr-1.5 align-middle`}/>{lv.status}
                    </span>
                    <button onClick={()=>setShowDetailModal(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="w-4 h-4 text-white"/></button>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/25 flex items-center justify-center text-white text-lg font-black flex-shrink-0">{initials}</div>
                    <div>
                      <h3 className="text-white font-black text-xl leading-tight">{lv.employee_name}</h3>
                      <p className="text-white/75 text-xs mt-0.5">{lv.department}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{lv.leave_type_name||lv.leave_type_code}</span>
                        <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{lv.days} day{lv.days!==1?"s":""}{lv.is_half_day?" (half)":""}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">From</p><p className="text-sm font-black text-slate-800">{new Date(lv.start_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p></div>
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100"><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">To</p><p className="text-sm font-black text-slate-800">{new Date(lv.end_date).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</p></div>
                  </div>
                  <div className="space-y-3">
                    {lv.applied_at&&<div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0"><Calendar className="w-4 h-4 text-brand-500"/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Applied On</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{new Date(lv.applied_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</p></div></div>}
                    {lv.reason&&<div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0"><MessageSquare className="w-4 h-4 text-indigo-500"/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Reason</p><p className="text-sm text-slate-700 mt-0.5">{lv.reason}</p></div></div>}
                    {lv.approved_by_name&&<div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-4 h-4 text-green-500"/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Approved By</p><p className="text-sm font-semibold text-slate-800 mt-0.5">{lv.approved_by_name}</p></div></div>}
                    {lv.rejection_reason&&<div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0"><XCircle className="w-4 h-4 text-red-500"/></div><div><p className="text-[10px] font-bold text-slate-400 uppercase">Rejection Reason</p><p className="text-sm text-red-600 font-medium mt-0.5">{lv.rejection_reason}</p></div></div>}
                  </div>
                  <div className="rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100"><p className="text-xs font-bold text-slate-700">Workflow</p></div>
                    <div className="px-4 py-4">
                      {(()=>{const st=lv.status==="approved"?"approved":lv.status==="rejected"?"rejected":"pending";const colors={approved:"bg-green-100 text-green-700 border-green-200",rejected:"bg-red-100 text-red-600 border-red-200",pending:"bg-amber-100 text-amber-600 border-amber-200"};const dots={approved:"bg-green-500",rejected:"bg-red-500",pending:"bg-amber-400 animate-pulse"};return(<div className="flex items-center gap-3"><div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-xs font-black flex-shrink-0 ${colors[st]}`}>{st==="approved"?"✓":st==="rejected"?"✕":"…"}</div><div className="flex-1"><p className="text-xs font-bold text-slate-800">Reporting Manager</p><p className="text-[10px] text-slate-500 capitalize">{st}</p></div><span className={`w-2 h-2 rounded-full ${dots[st]}`}/></div>);})()}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-3">Comments</p>
                    <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                      {(lv.comments||[]).length>0?(lv.comments.map((c,i)=>(
                        <div key={i} className="flex gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-bold text-brand-600 flex-shrink-0">{(c.author||"U")[0].toUpperCase()}</div>
                          <div className="flex-1 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                            <div className="flex items-center justify-between mb-1"><span className="text-[10px] font-bold text-slate-700">{c.author||"User"}</span><span className="text-[9px] text-slate-400">{new Date(c.created_at).toLocaleString("en-IN",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"})}</span></div>
                            <p className="text-xs text-slate-600">{c.comment}</p>
                          </div>
                        </div>
                      ))):(
                        <div className="text-center py-4"><MessageSquare className="w-6 h-6 text-slate-200 mx-auto mb-1"/><p className="text-[10px] text-slate-400">No comments yet</p></div>
                      )}
                    </div>
                    <div className="flex gap-2 items-center bg-slate-50 rounded-xl border border-slate-200 px-3 py-2 focus-within:border-brand-400 focus-within:bg-white transition-all">
                      <input value={commentText} onChange={e=>setCommentText(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleComment(lv.id)} placeholder="Add a comment…" className="flex-1 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"/>
                      <button onClick={()=>handleComment(lv.id)} disabled={!commentText.trim()} className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:bg-slate-200 flex items-center justify-center transition-colors"><Send className="w-3.5 h-3.5 text-white"/></button>
                    </div>
                  </div>
                </div>
                {lv.status==="pending"&&(
                  <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0 space-y-2 bg-white">
                    <div className="flex gap-3">
                      <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>handleApprove(lv.id)}
                        className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4"/> Approve
                      </motion.button>
                      <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>{setShowRejectModal(lv);setShowDetailModal(null);}}
                        className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2">
                        <XCircle className="w-4 h-4"/> Reject
                      </motion.button>
                    </div>
                    <button onClick={()=>{setShowForwardModal(lv);setShowDetailModal(null);}} className="w-full py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                      <Send className="w-3.5 h-3.5"/> Forward
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowRejectModal(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h3 className="text-base font-bold text-slate-900">Reject Leave</h3><button onClick={()=>setShowRejectModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <p className="text-xs text-slate-500 mb-4">Rejecting <strong>{showRejectModal?.employee_name}</strong>&apos;s {showRejectModal?.leave_type_name||showRejectModal?.leave_type_code}</p>
              <textarea rows={3} value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="Reason *" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 resize-none mb-4"/>
              <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={()=>handleReject(showRejectModal.id)} className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg">Confirm Rejection</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Modal */}
      <AnimatePresence>
        {showForwardModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowForwardModal(null)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4"><h3 className="text-base font-bold text-slate-900">Forward Leave</h3><button onClick={()=>setShowForwardModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <div className="space-y-3 mb-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Forward To *</label>
                  <select value={forwardForm.forward_to} onChange={e=>setForwardForm(f=>({...f,forward_to:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select employee...</option>
                    {employees.map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes</label>
                  <textarea rows={2} value={forwardForm.notes} onChange={e=>setForwardForm(f=>({...f,notes:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"/></div>
              </div>
              <motion.button whileHover={{scale:1.01}} whileTap={{scale:0.99}} onClick={handleForward} disabled={formLoading} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Forwarding...":"Forward"}</motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Request Modal */}
      <AnimatePresence>
        {showAddModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAddModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Apply Leave for Employee</h3><button onClick={()=>setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={addForm.employee_id} onChange={e=>setAddForm(f=>({...f,employee_id:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select employee...</option>
                    {employees.map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type *</label>
                  <select value={addForm.leave_type_code} onChange={e=>setAddForm(f=>({...f,leave_type_code:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select type...</option>
                    {leaveTypes.map(lt=><option key={lt.code} value={lt.code}>{lt.name}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Start Date *</label><input type="date" value={addForm.start_date} onChange={e=>setAddForm(f=>({...f,start_date:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">End Date *</label><input type="date" value={addForm.end_date} onChange={e=>setAddForm(f=>({...f,end_date:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason</label><input value={addForm.reason} onChange={e=>setAddForm(f=>({...f,reason:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={addForm.is_half_day} onChange={e=>setAddForm(f=>({...f,is_half_day:e.target.checked}))} className="w-4 h-4 rounded border-slate-300"/> Half Day
                </label>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Submitting...":"Submit Request"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Adjust Balance Modal */}
      <AnimatePresence>
        {showAdjustModal&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAdjustModal(false)}>
            <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95}} onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-bold text-slate-900">Adjust Leave Balance</h3><button onClick={()=>setShowAdjustModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400"/></button></div>
              <form onSubmit={handleAdjust} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={adjustForm.employee_id} onChange={e=>setAdjustForm(f=>({...f,employee_id:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select...</option>{employees.map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name}</option>)}
                  </select></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type *</label>
                  <select value={adjustForm.leave_type_code} onChange={e=>setAdjustForm(f=>({...f,leave_type_code:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select...</option>{leaveTypes.map(lt=><option key={lt.code} value={lt.code}>{lt.name}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Action</label>
                    <select value={adjustForm.action} onChange={e=>setAdjustForm(f=>({...f,action:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="credit">Credit</option><option value="debit">Debit</option>
                    </select></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Days *</label>
                    <input type="number" min="1" value={adjustForm.days} onChange={e=>setAdjustForm(f=>({...f,days:e.target.value}))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason</label>
                  <input value={adjustForm.reason} onChange={e=>setAdjustForm(f=>({...f,reason:e.target.value}))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400"/></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{scale:1.01}} whileTap={{scale:0.99}} className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-70">{formLoading?"Saving...":"Adjust Balance"}</motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}