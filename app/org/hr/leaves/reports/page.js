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

  const renderTable = (rows, headers) => rows?.length>0 ? (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead><tr className="bg-slate-50/80">{headers.map(h=><th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-3 whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r,i)=>(
          <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50">
            {Object.values(r).slice(0,headers.length).map((v,j)=>(
              <td key={j} className="px-4 py-2.5 text-xs text-slate-700">{v??""}</td>
            ))}
          </tr>
        ))}</tbody>
      </table>
    </div>
  ) : <div className="p-8 text-center text-xs text-slate-400">No data available</div>;

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
            {reportType==="utilization"&&reportData.utilization&&(
              <>
                <p className="text-xs text-slate-500 mb-3">{reportData.total_employees} employees • {reportData.year}</p>
                <div className="space-y-3">
                  {reportData.utilization.map((u,i)=>(
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full w-12 text-center flex-shrink-0">{u.leave_type_code}</span>
                      <div className="flex-1"><div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>{u.leave_type_name}</span><span>{u.used}/{u.total} days used</span></div><div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full bg-brand-500" style={{width:`${Math.min((u.used/(u.total||1))*100,100)}%`}}/></div></div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {reportType==="balance"&&reportData.balances&&renderTable(reportData.balances,["Employee","Leave Type","Total","Used","Balance"])}
            {reportType==="monthly"&&reportData.monthly&&renderTable(reportData.monthly,["Month","Total Requests","Approved","Rejected","Pending"])}
            {reportType==="department"&&reportData.departments&&renderTable(reportData.departments,["Department","Total","Approved","Pending","Avg Days"])}
            {reportType==="lop"&&reportData.employees&&renderTable(reportData.employees,["Employee","Department","LOP Days","Month","Year"])}
            {reportType==="employee-history"&&reportData.leaves&&renderTable(reportData.leaves,["Leave Type","Start","End","Days","Status"])}
            {/* Fallback for unknown structure */}
            {!["utilization","balance","monthly","department","lop","employee-history"].includes(reportType)&&(
              <pre className="text-[10px] text-slate-600 overflow-x-auto">{JSON.stringify(reportData,null,2)}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
