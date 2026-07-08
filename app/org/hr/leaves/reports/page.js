"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, CheckCircle2, AlertCircle, FileText, User, Calendar, Users, Search, Download, ChevronDown, X, TrendingUp, Clock, Building, AlertOctagon } from "lucide-react";
import ExportButton from "@/components/ExportButton";
import { getUtilizationReport, getBalanceReport, getMonthlyReport, getDepartmentReport, getLOPReport, getEmployeeLeaveHistory, listEmployees } from "@/lib/api";

const REPORT_TYPES = [
  { key:"utilization",      label:"Utilization",      icon:TrendingUp   },
  { key:"balance",          label:"Balance",           icon:BarChart3    },
  { key:"monthly",          label:"Monthly",           icon:Calendar     },
  { key:"department",       label:"Department",        icon:Building     },
  { key:"lop",              label:"LOP",               icon:AlertOctagon },
  { key:"employee-history", label:"Employee History",  icon:User         },
];

// Searchable Employee Dropdown component
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
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:border-brand-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 transition-all shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                {selected.first_name?.[0]}{selected.last_name?.[0]}
              </div>
              <span className="truncate">{selected.first_name} {selected.last_name}</span>
              <span className="text-slate-400 text-xs flex-shrink-0">· {selected.department || "No Dept"}</span>
            </>
          ) : (
            <span className="text-slate-400">Choose employee...</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="absolute z-30 top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Search inside dropdown */}
            <div className="p-2 border-b border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <input value={q} onChange={e => setQ(e.target.value)} autoFocus
                  placeholder="Search name or department..."
                  className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
                {q && <button onClick={() => setQ("")}><X className="w-3 h-3 text-slate-400" /></button>}
              </div>
            </div>
            <div className="max-h-52 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">No employees found</p>
              ) : filtered.map(e => {
                const id = e.id || e._id;
                const isSelected = id === value;
                return (
                  <button key={id} type="button"
                    onClick={() => { onChange(id); setOpen(false); setQ(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-brand-50/40 transition-colors text-left ${isSelected ? "bg-brand-50" : ""}`}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0">
                      {e.first_name?.[0]}{e.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold truncate ${isSelected ? "text-brand-700" : "text-slate-800"}`}>{e.first_name} {e.last_name}</p>
                      <p className="text-[10px] text-slate-400">{e.department || "No Dept"} · {e.employee_id || ""}</p>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0 ml-auto" />}
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

export default function LeaveReportsPage() {
  const [reportType,   setReportType]   = useState("utilization");
  const [reportData,   setReportData]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [employees,    setEmployees]    = useState([]);
  const [empFilter,    setEmpFilter]    = useState("");
  const [toast,        setToast]        = useState(null);
  const [searchQuery,  setSearchQuery]  = useState("");

  const showToast = (msg, type="success") => { setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  useEffect(() => {
    listEmployees({limit: 100}).then(r => { 
      if (r.ok) setEmployees(r.data?.employees || []); 
      else console.error("Failed to load employees:", r);
    });
    fetchReport("utilization");
  }, []);

  const fetchReport = async (type, params={}) => {
    setLoading(true); setReportType(type);
    const map = { utilization:getUtilizationReport, balance:getBalanceReport, monthly:getMonthlyReport, department:getDepartmentReport, lop:getLOPReport };
    const fn = map[type];
    let res;
    if (type==="employee-history") res = await getEmployeeLeaveHistory(params);
    else if (fn) res = await fn();
    else { setLoading(false); return; }
    if (res.ok && res.data) setReportData(res.data);
    else { setReportData(null); showToast("Failed to load report","error"); }
    setLoading(false);
  };

  // Auto-load when employee selected
  const handleEmpSelect = (id) => {
    setEmpFilter(id);
    if (id) fetchReport("employee-history", { employee_id: id });
    else setReportData(null);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const p = name.split(" ");
    if (p.length >= 2) return p[0][0] + p[1][0];
    return name.substring(0,2).toUpperCase();
  };

  let filteredData = [];
  let exportCols = [];
  if (reportData) {
    if (reportType==="utilization" && reportData.utilization) {
      filteredData = reportData.utilization.filter(u =>
        !searchQuery ||
        u.leave_type_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.leave_type_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header:"Leave Type", key:"leave_type_name" },
        { header:"Code", key:"leave_type_code" },
        { header:"Total Entitlement", key:"total_entitlement" },
        { header:"Total Used", key:"total_used" },
        { header:"Utilization %", key:"utilization_percentage" },
        { header:"Requests", key:"request_count" },
      ];
    } else if (reportType==="balance" && reportData.employees) {
      filteredData = reportData.employees.filter(e =>
        !searchQuery ||
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.department||"").toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header:"Employee", key:"name" }, { header:"Department", key:"department" },
        { header:"Leave Type", key:"code" }, { header:"Total", key:"total" },
        { header:"Used", key:"used" }, { header:"Balance", key:"balance" },
      ];
    } else if (reportType==="monthly" && reportData.breakdown) {
      filteredData = reportData.breakdown.filter(b =>
        !searchQuery || b.leave_type_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header:"Leave Type Code", key:"leave_type_code" }, { header:"Total Days", key:"total_days" },
        { header:"Requests", key:"request_count" }, { header:"Unique Employees", key:"unique_employees" },
      ];
    } else if (reportType==="department" && reportData.departments) {
      filteredData = reportData.departments.filter(d =>
        !searchQuery || (d.department||"No Department").toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header:"Department", key:"department", render: d => d.department||"No Department" },
        { header:"Total Days", key:"total_days" }, { header:"Requests", key:"request_count" },
        { header:"On Leave", key:"unique_employees_on_leave" }, { header:"Total Team", key:"total_employees" },
        { header:"Avg Days/Member", key:"avg_days_per_employee", render: d => parseFloat(d.avg_days_per_employee).toFixed(1) },
      ];
    } else if (reportType==="lop" && reportData.employees) {
      filteredData = reportData.employees.filter(e =>
        !searchQuery ||
        e.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.department||"").toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header:"Employee", key:"employee_name" }, { header:"Department", key:"department" },
        { header:"LOP Days", key:"total_lop_days" }, { header:"LOP Entries", key:"lop_count" },
      ];
    } else if (reportType==="employee-history" && reportData.leaves) {
      filteredData = reportData.leaves;
      exportCols = [
        { header:"Leave Type", key:"leave_type_code" }, { header:"From", key:"start_date" },
        { header:"To", key:"end_date" }, { header:"Days", key:"days" },
        { header:"Reason", key:"reason" }, { header:"Status", key:"status" },
        { header:"Applied On", key:"applied_at", render: l => l.applied_at ? new Date(l.applied_at).toLocaleDateString() : "" },
      ];
    }
  }

  const exportData = reportType==="balance"
    ? filteredData.flatMap(emp => (emp.balances||[]).map(b => ({ name:emp.name, department:emp.department, ...b })))
    : filteredData;

  const isEmpHistory = reportType === "employee-history";

  return (
    <div className="space-y-6 pb-10">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Header + report type tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Leave Reports</h3>
          <p className="text-sm text-slate-500">Track allocations, balances and consumption metrics</p>
        </div>

        <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit flex-wrap gap-1 border border-slate-200/50 shadow-sm">
          {REPORT_TYPES.map(r => {
            const Icon = r.icon;
            return (
              <button key={r.key}
                onClick={() => {
                  setSearchQuery(""); setReportData(null); setEmpFilter("");
                  setReportType(r.key);
                  if (r.key !== "employee-history") fetchReport(r.key);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${reportType===r.key ? "bg-white text-brand-600 shadow-sm border border-slate-200/20" : "text-slate-500 hover:text-slate-700"}`}>
                <Icon className="w-3 h-3" />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Employee selector — only for employee history */}
      {isEmpHistory && (
        <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Employee</label>
          <div className="max-w-sm">
            <EmpDropdown employees={employees} value={empFilter} onChange={handleEmpSelect} />
          </div>
          {!empFilter && (
            <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Choose an employee above to instantly load their leave history
            </p>
          )}
        </motion.div>
      )}

      {/* Report output */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/>
            <p className="text-xs text-slate-400 font-medium">Loading report…</p>
          </div>
        ) : !reportData ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-indigo-300"/>
            </div>
            <p className="text-sm font-bold text-slate-500">
              {isEmpHistory ? "Select an employee to view their history" : "No report loaded"}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {isEmpHistory ? "Use the dropdown above to pick an employee" : "Select a report type above to view data."}
            </p>
          </div>
        ) : (
          <div>
            {/* Result header bar */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-brand-100 flex items-center justify-center">
                  {(() => { const R = REPORT_TYPES.find(r=>r.key===reportType); return R ? <R.icon className="w-4 h-4 text-brand-600"/> : null; })()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">
                    {REPORT_TYPES.find(r=>r.key===reportType)?.label} Report
                    {isEmpHistory && reportData.employee_name && <span className="text-brand-600 ml-1">— {reportData.employee_name}</span>}
                  </h4>
                  <p className="text-[10px] text-slate-400">Year: {reportData.year || new Date().getFullYear()} · {filteredData.length} records</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Search bar — hidden for employee-history (it's individual) */}
                {!isEmpHistory && (
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 transition-all">
                    <Search className="w-3.5 h-3.5 text-slate-400 mr-2 flex-shrink-0"/>
                    <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      className="bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none w-36"/>
                    {searchQuery && <button onClick={()=>setSearchQuery("")}><X className="w-3 h-3 text-slate-400 ml-1"/></button>}
                  </div>
                )}
                <ExportButton data={exportData || []} filename={`leave_report_${reportType}.csv`} columns={exportCols} />
              </div>
            </div>

            <div className="p-6">
              {/* Utilization */}
              {reportType==="utilization" && reportData.utilization && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 bg-brand-50/50 p-4 rounded-xl border border-brand-100/60 w-fit">
                    <Users className="w-5 h-5 text-brand-600"/>
                    <p className="text-xs font-bold text-brand-800">Total Employees tracked: <span className="text-sm font-black text-brand-900 ml-1">{reportData.total_employees}</span></p>
                  </div>
                  <div className="space-y-3">
                    {filteredData.map((u,i)=>(
                      <motion.div key={i} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
                        className="flex items-center gap-4 bg-slate-50/60 p-4 rounded-2xl border border-slate-100 hover:border-brand-100/60 transition-colors">
                        <span className="text-[10px] font-black text-brand-700 bg-brand-50 border border-brand-200/50 px-3 py-1.5 rounded-full w-14 text-center flex-shrink-0">{u.leave_type_code}</span>
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs mb-2">
                            <span className="font-bold text-slate-900">{u.leave_type_name}</span>
                            <span className="font-semibold text-slate-500">{u.total_used}/{u.total_entitlement}d · <span className="text-brand-600 font-bold">{u.request_count} reqs</span></span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200/70 rounded-full overflow-hidden">
                            <motion.div initial={{width:0}} animate={{width:`${Math.min(u.utilization_percentage,100)}%`}} transition={{duration:0.8,delay:i*0.04}}
                              className={`h-full rounded-full bg-gradient-to-r ${u.utilization_percentage>=80?"from-rose-500 to-red-500":u.utilization_percentage>=50?"from-amber-400 to-orange-500":"from-brand-500 to-indigo-500"}`}/>
                          </div>
                          <p className="text-right text-[10px] text-slate-400 mt-1">{u.utilization_percentage}% utilised</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Balance */}
              {reportType==="balance" && reportData.employees && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-500">Showing <span className="text-slate-800 font-bold">{filteredData.length}</span> employees</p>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full">
                      <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                        {["Employee","Department","Leave Type","Total","Used","Balance"].map(h=><th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredData.map((emp,i)=>(emp.balances||[]).map((bal,j)=>(
                          <tr key={`${i}-${j}`} className="hover:bg-slate-50/50 transition-colors">
                            {j===0&&<td rowSpan={emp.balances.length} className="px-6 py-4 align-top border-r border-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{getInitials(emp.name)}</div>
                                <p className="text-sm font-bold text-slate-900">{emp.name}</p>
                              </div>
                            </td>}
                            {j===0&&<td rowSpan={emp.balances.length} className="px-6 py-4 text-xs font-semibold text-slate-500 align-top border-r border-slate-50">{emp.department||"No Dept"}</td>}
                            <td className="px-6 py-3"><span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200/50 px-2.5 py-1 rounded-full">{bal.code}</span></td>
                            <td className="px-6 py-3 text-xs font-semibold text-slate-700">{bal.total}</td>
                            <td className="px-6 py-3"><span className="inline-flex px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs border border-rose-100/50">{bal.used}</span></td>
                            <td className="px-6 py-3"><span className="inline-flex px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100/50">{bal.balance}</span></td>
                          </tr>
                        )))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Monthly */}
              {reportType==="monthly" && reportData.breakdown && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 max-w-xl">
                    {[
                      {label:"Month",value:reportData.month,color:"text-indigo-700",bg:"bg-indigo-50",border:"border-indigo-100"},
                      {label:"Total Requests",value:reportData.total_requests,color:"text-brand-700",bg:"bg-brand-50",border:"border-brand-100"},
                      {label:"Total Days",value:`${reportData.total_days}d`,color:"text-emerald-700",bg:"bg-emerald-50",border:"border-emerald-100"},
                    ].map(s=>(
                      <div key={s.label} className={`${s.bg} border ${s.border} p-4 rounded-2xl`}>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                        <p className={`text-xl font-black ${s.color} mt-1`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full">
                      <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                        {["Leave Type","Total Days","Requests","Unique Employees"].map(h=><th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredData.map((b,i)=>(
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4"><span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200/50 px-2.5 py-1 rounded-full">{b.leave_type_code}</span></td>
                            <td className="px-6 py-4 text-sm font-black text-slate-700">{b.total_days}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">{b.request_count}</td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">{b.unique_employees}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Department */}
              {reportType==="department" && reportData.departments && (
                <div className="overflow-x-auto border border-slate-100 rounded-xl">
                  <table className="w-full">
                    <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                      {["Department","Total Days","Requests","On Leave","Total Team","Avg Days/Member"].map(h=><th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredData.map((d,i)=>(
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-800">{d.department||"No Department"}</td>
                          <td className="px-6 py-4 text-sm font-black text-slate-700">{d.total_days}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">{d.request_count}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">{d.unique_employees_on_leave}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-600">{d.total_employees}</td>
                          <td className="px-6 py-4"><span className="inline-flex px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700 font-bold text-xs border border-amber-100/50">{parseFloat(d.avg_days_per_employee).toFixed(1)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* LOP */}
              {reportType==="lop" && reportData.employees && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 max-w-md">
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl">
                      <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Total LOP Days</p>
                      <p className="text-xl font-black text-rose-700 mt-1">{reportData.total_lop_days}d</p>
                    </div>
                    <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl">
                      <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Impacted Employees</p>
                      <p className="text-xl font-black text-orange-700 mt-1">{filteredData.length}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full">
                      <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                        {["Employee","Department","LOP Days","LOP Entries"].map(h=><th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredData.map((e,i)=>(
                          <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">{getInitials(e.employee_name)}</div>
                                <p className="text-sm font-bold text-slate-900">{e.employee_name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-500">{e.department}</td>
                            <td className="px-6 py-4"><span className="inline-flex px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs border border-rose-100/50">{e.total_lop_days}d</span></td>
                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">{e.lop_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Employee History */}
              {reportType==="employee-history" && reportData.leaves && (
                <div className="space-y-5">
                  {/* Employee profile card */}
                  <div className="flex items-center gap-4 bg-gradient-to-r from-brand-50 to-indigo-50/60 border border-brand-100/60 p-4 rounded-2xl">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center text-base font-bold text-white shadow-lg shadow-brand-500/25">
                      {getInitials(reportData.employee_name)}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-slate-900">{reportData.employee_name}</h4>
                      <p className="text-xs text-slate-500">{reportData.department||"No Dept"} · <span className="font-bold text-brand-600">{reportData.total_leaves} total leave days</span></p>
                    </div>
                    <ExportButton data={exportData || []} filename={`leave_history_${reportData.employee_name}.csv`} columns={exportCols} />
                  </div>

                  {/* Type summary badges */}
                  {reportData.type_summary && (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(reportData.type_summary).map(([code,ts])=>(
                        <div key={code} className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm">
                          <span className="text-[10px] font-black text-brand-600 uppercase tracking-wider block mb-0.5">{code}</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {ts.approved} Approved{ts.pending>0?` · ${ts.pending} Pending`:""}
                            {ts.rejected>0?` · ${ts.rejected} Rejected`:""}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Leaves table */}
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full">
                      <thead><tr className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50/60">
                        {["Leave Type","From","To","Days","Reason","Status","Applied On"].map(h=><th key={h} className="text-left text-[10px] font-bold text-indigo-700 uppercase tracking-wider px-6 py-3 whitespace-nowrap">{h}</th>)}
                      </tr></thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredData.map((l,i)=>{
                          const sc = {approved:"bg-emerald-50 text-emerald-700 border-emerald-200/50",pending:"bg-amber-50 text-amber-700 border-amber-200/50",rejected:"bg-red-50 text-red-700 border-red-200/50",cancelled:"bg-slate-50 text-slate-500 border-slate-200/50"};
                          return (
                            <motion.tr key={l.id||i} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4"><span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-200/50 px-2.5 py-1 rounded-full">{l.leave_type_code}</span></td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-700">{l.start_date}</td>
                              <td className="px-6 py-4 text-xs font-semibold text-slate-700">{l.end_date}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-800">{l.days}d{l.is_half_day?" (½)":""}</td>
                              <td className="px-6 py-4 text-xs text-slate-500 max-w-[180px] truncate" title={l.reason}>{l.reason||"—"}</td>
                              <td className="px-6 py-4 whitespace-nowrap"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${sc[l.status]||sc.pending}`}>{l.status}</span></td>
                              <td className="px-6 py-4 text-xs text-slate-400">{l.applied_at?new Date(l.applied_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):""}</td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Fallback raw */}
              {!reportData.utilization&&!reportData.employees&&!reportData.breakdown&&!reportData.departments&&!reportData.leaves&&(
                <pre className="text-[10px] text-slate-600 overflow-x-auto whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-200">{JSON.stringify(reportData,null,2)}</pre>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
