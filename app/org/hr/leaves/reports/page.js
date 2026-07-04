"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, CheckCircle2, AlertCircle } from "lucide-react";
import { getUtilizationReport, getBalanceReport, getMonthlyReport, getDepartmentReport, getLOPReport, getEmployeeLeaveHistory, listEmployees } from "@/lib/api";

const REPORT_TYPES = [
  { key:"utilization",      label:"Utilization"       },
  { key:"balance",          label:"Balance"           },
  { key:"monthly",          label:"Monthly"           },
  { key:"department",       label:"Department"        },
  { key:"lop",              label:"LOP"               },
  { key:"employee-history", label:"Employee History"  },
];

export default function LeaveReportsPage() {
  const [reportType,   setReportType]   = useState("utilization");
  const [reportData,   setReportData]   = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [employees,    setEmployees]    = useState([]);
  const [empFilter,    setEmpFilter]    = useState("");
  const [toast,        setToast]        = useState(null);

  const showToast = (msg,type="success")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),4000); };

  useEffect(()=>{
    listEmployees({limit:100}).then(r=>{ if(r.ok) setEmployees(r.data?.employees||[]); });
    fetchReport("utilization");
  },[]);

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

  const handleEmpHistory = () => { if (empFilter) fetchReport("employee-history",{employee_id:empFilter}); };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {toast&&(<motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>{toast.type==="error"?<AlertCircle className="w-4 h-4"/>:<CheckCircle2 className="w-4 h-4"/>} {toast.msg}</motion.div>)}
      </AnimatePresence>

      {/* Report type selector */}
      <div className="flex flex-wrap gap-2">
        {REPORT_TYPES.map(r=>(
          <button key={r.key} onClick={()=>{ setReportType(r.key); if(r.key!=="employee-history") fetchReport(r.key); }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${reportType===r.key?"bg-brand-600 text-white shadow-md":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {r.label}
          </button>
        ))}
      </div>

      {/* Employee selector for employee history */}
      {reportType==="employee-history"&&(
        <div className="flex items-center gap-3">
          <select value={empFilter} onChange={e=>setEmpFilter(e.target.value)} className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white outline-none focus:border-brand-400">
            <option value="">Select employee...</option>
            {employees.map(e=><option key={e.id||e._id} value={e.id||e._id}>{e.first_name} {e.last_name} — {e.department}</option>)}
          </select>
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleEmpHistory} disabled={!empFilter}
            className="px-4 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-semibold disabled:opacity-40">Load</motion.button>
        </div>
      )}

      {/* Report output */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
        ) : !reportData ? (
          <div className="p-12 text-center"><BarChart3 className="w-8 h-8 text-slate-200 mx-auto mb-2"/><p className="text-xs text-slate-400">Select a report type to load data</p></div>
        ) : (
          <div className="p-5">
            {/* Utilization Report */}
            {reportType==="utilization"&&reportData.utilization&&(
              <>
                <p className="text-xs text-slate-500 mb-4">{reportData.total_employees} employees • {reportData.year}</p>
                <div className="space-y-3">
                  {reportData.utilization.map((u,i)=>(
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full w-12 text-center flex-shrink-0">{u.leave_type_code}</span>
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] text-slate-600 mb-1.5">
                          <span className="font-semibold">{u.leave_type_name}</span>
                          <span>{u.total_used}/{u.total_entitlement} days • {u.utilization_percentage}% • {u.request_count} requests</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${u.utilization_percentage>=80?"bg-red-400":u.utilization_percentage>=50?"bg-amber-400":"bg-brand-500"}`}
                            style={{width:`${Math.min(u.utilization_percentage,100)}%`}}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Balance Report */}
            {reportType==="balance"&&reportData.employees&&(
              <>
                <p className="text-xs text-slate-500 mb-4">{reportData.total} employees • {reportData.year}</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50/80">
                      {["Employee","Department","Leave Type","Total","Used","Balance"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {reportData.employees.map((emp,i)=>
                        (emp.balances||[]).map((bal,j)=>(
                          <tr key={`${i}-${j}`} className="border-t border-slate-50 hover:bg-slate-50/50">
                            {j===0&&<td rowSpan={emp.balances.length} className="px-4 py-2.5 text-xs font-semibold text-slate-800 align-top">{emp.name}</td>}
                            {j===0&&<td rowSpan={emp.balances.length} className="px-4 py-2.5 text-xs text-slate-600 align-top">{emp.department}</td>}
                            <td className="px-4 py-2.5"><span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{bal.code}</span></td>
                            <td className="px-4 py-2.5 text-xs text-slate-700">{bal.total}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-red-500">{bal.used}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-green-600">{bal.balance}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Monthly Report */}
            {reportType==="monthly"&&reportData.breakdown&&(
              <>
                <p className="text-xs text-slate-500 mb-4">{reportData.year} • Month {reportData.month} • {reportData.total_requests} requests • {reportData.total_days} days</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50/80">
                      {["Leave Type","Total Days","Requests","Unique Employees"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {reportData.breakdown.map((b,i)=>(
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5"><span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{b.leave_type_code}</span></td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{b.total_days}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{b.request_count}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{b.unique_employees}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Department Report */}
            {reportType==="department"&&reportData.departments&&(
              <>
                <p className="text-xs text-slate-500 mb-4">{reportData.year} • {reportData.departments.length} departments</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50/80">
                      {["Department","Total Days","Requests","Employees on Leave","Total Employees","Avg Days/Employee"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {reportData.departments.map((d,i)=>(
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{d.department}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{d.total_days}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{d.request_count}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{d.unique_employees_on_leave}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{d.total_employees}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-amber-600">{d.avg_days_per_employee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* LOP Report */}
            {reportType==="lop"&&reportData.employees&&(
              <>
                <p className="text-xs text-slate-500 mb-4">{reportData.year} • {reportData.total_lop_days} total LOP days • {reportData.total_employees_with_lop} employees</p>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50/80">
                      {["Employee","Department","LOP Days","LOP Count"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {reportData.employees.map((e,i)=>(
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{e.employee_name}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{e.department}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-red-500">{e.total_lop_days}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{e.lop_count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Employee History */}
            {reportType==="employee-history"&&reportData.leaves&&(
              <>
                <p className="text-xs text-slate-500 mb-4">{reportData.employee_name} • {reportData.department} • {reportData.year} • {reportData.total_leaves} total leaves</p>
                {/* Type summary */}
                {reportData.type_summary && (
                  <div className="flex flex-wrap gap-3 mb-4">
                    {Object.entries(reportData.type_summary).map(([code, ts])=>(
                      <div key={code} className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-brand-600">{code}</span>
                        <span className="text-[10px] text-slate-500 ml-2">
                          {ts.approved} approved{ts.pending>0?` • ${ts.pending} pending`:""}
                          {ts.rejected>0?` • ${ts.rejected} rejected`:""}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead><tr className="bg-slate-50/80">
                      {["Leave Type","From","To","Days","Reason","Status","Applied On"].map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {reportData.leaves.map((l,i)=>{
                        const sc = {approved:"bg-green-50 text-green-600 border-green-200",pending:"bg-amber-50 text-amber-600 border-amber-200",rejected:"bg-red-50 text-red-500 border-red-200",cancelled:"bg-slate-50 text-slate-400 border-slate-200"};
                        return (
                          <tr key={l.id||i} className="border-t border-slate-50 hover:bg-slate-50/50">
                            <td className="px-4 py-2.5"><span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{l.leave_type_code}</span></td>
                            <td className="px-4 py-2.5 text-xs text-slate-700">{l.start_date}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-700">{l.end_date}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-slate-800">{l.days}d{l.is_half_day?" (½)":""}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[150px] truncate">{l.reason||"—"}</td>
                            <td className="px-4 py-2.5"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${sc[l.status]||sc.pending}`}>{l.status}</span></td>
                            <td className="px-4 py-2.5 text-xs text-slate-400">{l.applied_at?new Date(l.applied_at).toLocaleDateString("en-IN",{day:"numeric",month:"short"}):"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Fallback */}
            {!reportData.utilization&&!reportData.employees&&!reportData.breakdown&&!reportData.departments&&!reportData.leaves&&(
              <pre className="text-[10px] text-slate-600 overflow-x-auto whitespace-pre-wrap">{JSON.stringify(reportData,null,2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
