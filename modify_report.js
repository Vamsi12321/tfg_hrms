const fs = require('fs');
const file = 'c:/Users/vamsi/OneDrive/Documents/Desktop/newbgv/tfghrms/app/org/hr/leaves/reports/page.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  'import { BarChart3, CheckCircle2, AlertCircle, FileText, User, Calendar, PieChart, Users, AlertOctagon } from "lucide-react";',
  'import { BarChart3, CheckCircle2, AlertCircle, FileText, User, Calendar, PieChart, Users, AlertOctagon, Search, Download } from "lucide-react";\nimport ExportButton from "@/components/ExportButton";'
);

// 2. Add searchQuery state
content = content.replace(
  'const [toast,        setToast]        = useState(null);',
  'const [toast,        setToast]        = useState(null);\n  const [searchQuery, setSearchQuery] = useState("");'
);

// 3. Clear search on tab switch
content = content.replace(
  'setReportType(r.key); setReportData(null); if(r.key!=="employee-history") fetchReport(r.key);',
  'setReportType(r.key); setReportData(null); setSearchQuery(""); if(r.key!=="employee-history") fetchReport(r.key);'
);

// 4. Inject filtering logic before the return statement
const filterLogic = `
  let filteredData = [];
  let exportCols = [];
  if (reportData) {
    if (reportType === "utilization" && reportData.utilization) {
      filteredData = reportData.utilization.filter(u => 
        !searchQuery || 
        u.leave_type_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.leave_type_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header: "Leave Type", key: "leave_type_name" },
        { header: "Code", key: "leave_type_code" },
        { header: "Total Entitlement", key: "total_entitlement" },
        { header: "Total Used", key: "total_used" },
        { header: "Utilization %", key: "utilization_percentage" },
        { header: "Requests", key: "request_count" },
      ];
    } else if (reportType === "balance" && reportData.employees) {
      filteredData = reportData.employees.filter(e => 
        !searchQuery || 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (e.department || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header: "Employee", key: "name" },
        { header: "Department", key: "department" },
        { header: "Leave Type", key: "code" },
        { header: "Total", key: "total" },
        { header: "Used", key: "used" },
        { header: "Balance", key: "balance" },
      ];
    } else if (reportType === "monthly" && reportData.breakdown) {
      filteredData = reportData.breakdown.filter(b => 
        !searchQuery || b.leave_type_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header: "Leave Type Code", key: "leave_type_code" },
        { header: "Total Days", key: "total_days" },
        { header: "Requests", key: "request_count" },
        { header: "Unique Employees", key: "unique_employees" },
      ];
    } else if (reportType === "department" && reportData.departments) {
      filteredData = reportData.departments.filter(d => 
        !searchQuery || (d.department || "No Department").toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header: "Department", key: "department", render: d => d.department || "No Department" },
        { header: "Total Days", key: "total_days" },
        { header: "Requests", key: "request_count" },
        { header: "On Leave", key: "unique_employees_on_leave" },
        { header: "Total Team", key: "total_employees" },
        { header: "Avg Days/Member", key: "avg_days_per_employee", render: d => parseFloat(d.avg_days_per_employee).toFixed(1) },
      ];
    } else if (reportType === "lop" && reportData.employees) {
      filteredData = reportData.employees.filter(e => 
        !searchQuery || 
        e.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.department || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header: "Employee", key: "employee_name" },
        { header: "Department", key: "department" },
        { header: "LOP Days", key: "total_lop_days" },
        { header: "LOP Entries", key: "lop_count" },
      ];
    } else if (reportType === "employee-history" && reportData.leaves) {
      filteredData = reportData.leaves.filter(l => 
        !searchQuery || 
        l.leave_type_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.reason || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
      exportCols = [
        { header: "Leave Type", key: "leave_type_code" },
        { header: "From", key: "start_date" },
        { header: "To", key: "end_date" },
        { header: "Days", key: "days" },
        { header: "Reason", key: "reason" },
        { header: "Status", key: "status" },
        { header: "Applied On", key: "applied_at", render: l => l.applied_at ? new Date(l.applied_at).toLocaleDateString() : "" },
      ];
    }
  }

  const exportData = reportType === "balance" ? 
    filteredData.flatMap(emp => (emp.balances||[]).map(b => ({ name: emp.name, department: emp.department, ...b }))) :
    filteredData;

  return (
`;

content = content.replace('  return (', filterLogic);

// 5. Replace header info with Search & ExportButton
const oldHeader = '<div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">\n' +
'              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">\n' +
'                <FileText className="w-4 h-4 text-brand-600" />\n' +
'                {REPORT_TYPES.find(r=>r.key===reportType)?.label} Data Summary\n' +
'              </h4>\n' +
'              <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-200">\n' +
'                Year: {reportData.year || new Date().getFullYear()}\n' +
'              </span>\n' +
'            </div>';

const newHeader = '<div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">\n' +
'              <div className="flex items-center gap-3">\n' +
'                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">\n' +
'                  <FileText className="w-4 h-4 text-brand-600" />\n' +
'                  {REPORT_TYPES.find(r=>r.key===reportType)?.label} Data Summary\n' +
'                </h4>\n' +
'                <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 rounded-full bg-slate-200">\n' +
'                  Year: {reportData.year || new Date().getFullYear()}\n' +
'                </span>\n' +
'              </div>\n' +
'              <div className="flex items-center gap-3 w-full md:w-auto">\n' +
'                <div className="flex flex-1 items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all">\n' +
'                  <Search className="w-4 h-4 text-slate-400 mr-2" />\n' +
'                  <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search report..."\n' +
'                    className="bg-transparent text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none w-full" />\n' +
'                </div>\n' +
'                {exportData?.length > 0 && (\n' +
'                  <ExportButton data={exportData} filename={`leave_report_${reportType}.csv`} columns={exportCols} />\n' +
'                )}\n' +
'              </div>\n' +
'            </div>';

content = content.replace(oldHeader, newHeader);

// 6. Map changes to use filteredData
content = content.replace(/reportData\.utilization\.map/g, 'filteredData.map');
content = content.replace(/reportData\.employees\.map/g, 'filteredData.map');
content = content.replace(/reportData\.breakdown\.map/g, 'filteredData.map');
content = content.replace(/reportData\.departments\.map/g, 'filteredData.map');
content = content.replace(/reportData\.leaves\.map/g, 'filteredData.map');

// Also update the total employee counts in balance report since we are filtering
content = content.replace(
  '<span className="text-slate-800 font-bold">{reportData.total}</span> employees',
  '<span className="text-slate-800 font-bold">{filteredData.length}</span> employees'
);

// LOP total count update
content = content.replace(
  '<p className="text-lg font-black text-slate-800">{reportData.total_employees_with_lop} members</p>',
  '<p className="text-lg font-black text-slate-800">{filteredData.length} members</p>'
);

fs.writeFileSync(file, content);
console.log("Done");
