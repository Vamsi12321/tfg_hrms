"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Download, Upload, Users, Eye,
  CheckCircle2, Clock, AlertCircle, XCircle,
  ChevronRight, ChevronLeft, Building, Calendar, X, Save,
  RefreshCw, FileText, User, Briefcase, Wallet, ArrowRight, ArrowLeft
} from "lucide-react";
import TopBar from "@/components/TopBar";
import ExportButton from "@/components/ExportButton";
import { createEmployee, importEmployeesCSV } from "@/lib/api";
import { useDepartments, useEmployees, useInvalidate, usePayrollConfig } from "@/lib/queries";
import { validateEmployeeCreation, parseApiErrors, hasErrors, getFirstError } from "@/lib/validations";

const statusConfig = {
  active:                  { label:"Active",      dot:"bg-emerald-500", cls:"bg-emerald-50 text-emerald-700 border-emerald-200/50" },
  onboarding_in_progress:  { label:"Onboarding", dot:"bg-blue-500",    cls:"bg-blue-50 text-blue-700 border-blue-200/50"   },
  pending_onboarding:      { label:"Pending",     dot:"bg-amber-500",   cls:"bg-amber-50 text-amber-700 border-amber-200/50"},
  inactive:                { label:"Inactive",    dot:"bg-slate-400",   cls:"bg-slate-100 text-slate-500 border-slate-200/50"},
};

const premiumGradients = [
  "from-indigo-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-violet-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-brand-500 to-indigo-600",
];

const getGradient = (str) => {
  if (!str) return "from-slate-500 to-slate-600";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return premiumGradients[Math.abs(hash) % premiumGradients.length];
};

export default function EmployeesPage() {
  const router = useRouter();
  const invalidate = useInvalidate();

  // Filters
  const [page, setPage]                 = useState(1);
  const [limit]                         = useState(10);
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter]     = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // React Query
  const { data: deptList = [] } = useDepartments();
  const { data: employeeData, isLoading: loading } = useEmployees({
    page, limit,
    status: statusFilter || undefined,
    department: deptFilter || undefined,
    search: search || undefined,
    include_deleted: includeDeleted,
  });
  const employees = employeeData?.employees || [];
  const total = employeeData?.total || 0;
  const totalPages = employeeData?.pages || 1;

  const { data: config } = usePayrollConfig();

  // UI
  const [showAddModal, setShowAddModal] = useState(false);
  const [addStep, setAddStep]           = useState(1);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [toast, setToast]               = useState(null);
  const [formLoading, setFormLoading]   = useState(false);
  const [formError, setFormError]       = useState("");
  const [csvFile, setCsvFile]           = useState(null);
  const [csvResult, setCsvResult]       = useState(null);

  // Add form
  const [addForm, setAddForm] = useState({
    employee_id:"", first_name:"", last_name:"", official_email:"", phone:"",
    gender:"male", department:"", designation:"",
    joining_date:"", employment_type:"full-time", shift:"General",
    work_location:"", ctc:"",
    is_fresher: false,
    pf_applicable: false, uan_number: "",
    esi_applicable: false, esic_number: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});

  const ctcVal = parseInt(addForm.ctc) || 0;
  const basicPay = config ? (ctcVal * config.basic_percentage) / 100 : 0;
  const hraPay = config ? (ctcVal * config.hra_percentage) / 100 : 0;
  const specialPay = config ? (ctcVal * config.special_allowance_percentage) / 100 : 0;

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(()=>setToast(null), 4000); };

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Create employee
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    // Client-side validation
    const validationErrors = validateEmployeeCreation(addForm);
    if (hasErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      setFormError(getFirstError(validationErrors));
      return;
    }

    setFormLoading(true);

    const payload = {
      employee_id: addForm.employee_id,
      first_name: addForm.first_name,
      last_name: addForm.last_name,
      official_email: addForm.official_email,
      phone: addForm.phone,
      gender: addForm.gender,
      department: addForm.department,
      designation: addForm.designation,
      joining_date: addForm.joining_date,
      employment_type: addForm.employment_type,
      shift: addForm.shift || undefined,
      work_location: addForm.work_location || undefined,
      is_fresher: addForm.is_fresher === true || addForm.is_fresher === "true",
      pf_applicable: addForm.pf_applicable === true || addForm.pf_applicable === "true",
      uan_number: addForm.pf_applicable ? addForm.uan_number : undefined,
      esi_applicable: addForm.esi_applicable === true || addForm.esi_applicable === "true",
      esic_number: addForm.esi_applicable ? addForm.esic_number : undefined,
      salary_structure: {
        ctc: parseInt(addForm.ctc) || 0,
      },
    };

    try {
      const res = await createEmployee(payload);
      if (res.ok) {
        showToast(`${addForm.first_name} ${addForm.last_name} created — invite sent!`);
        setShowAddModal(false);
        setAddStep(1);
        setAddForm({ employee_id:"", first_name:"", last_name:"", official_email:"", phone:"", gender:"male", department:"", designation:"", joining_date:"", employment_type:"full-time", shift:"General", work_location:"", ctc:"", is_fresher:false, pf_applicable:false, uan_number:"", esi_applicable:false, esic_number:"" });
        invalidate("employees");
      } else {
        const apiErrors = parseApiErrors(res.data);
        setFieldErrors(apiErrors);
        const msg = apiErrors._general || getFirstError(apiErrors) || "Failed to create employee";
        setFormError(msg);
        showToast(msg, "error");
      }
    } catch {
      setFormError("Network error");
    } finally {
      setFormLoading(false);
    }
  };

  // CSV Import
  const handleCSVImport = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setFormLoading(true);
    setFormError("");
    setCsvResult(null);
    try {
      const res = await importEmployeesCSV(csvFile);
      if (res.ok) {
        setCsvResult(res.data);
        showToast(`${res.data.imported} employees imported`);
        invalidate("employees");
      } else {
        setFormError(res.data?.detail?.[0]?.msg || res.data?.error || "Import failed");
      }
    } catch {
      setFormError("Network error during import");
    } finally {
      setFormLoading(false);
    }
  };

  // Stats from current data
  const counts = {
    total: total,
    active: employees.filter(e => e.status === "active").length,
    onboarding: employees.filter(e => e.status === "onboarding_in_progress" || e.status === "pending_onboarding").length,
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Employees" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-emerald-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-5">
        {/* Controls */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Employee Directory</h2>
            <p className="text-sm text-slate-500">Manage your workforce, roles, and profiles</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => invalidate("employees")} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading?"animate-spin":""}`} />
            </button>
            <ExportButton 
              data={employees} 
              filename="employees_export.csv"
              columns={[
                { header: "Employee ID", key: "employee_id" },
                { header: "First Name", key: "first_name" },
                { header: "Last Name", key: "last_name" },
                { header: "Email", key: "official_email" },
                { header: "Phone", key: "phone" },
                { header: "Department", key: "department" },
                { header: "Designation", key: "designation" },
                { header: "Joining Date", key: "joining_date" },
                { header: "Gender", key: "gender" },
                { header: "Status", key: "status" }
              ]}
            />
            <button onClick={() => setShowCSVModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Upload className="w-4 h-4" /> CSV Import
            </button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => { setShowAddModal(true); setFormError(""); setAddStep(1); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Plus className="w-4 h-4" /> Add Employee
            </motion.button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label:"Total Employees", value:total, color:"text-indigo-700", bg:"bg-indigo-50/60", border:"border-indigo-100/40", dot:"bg-indigo-500" },
            { label:"Active",          value:employees.filter(e=>e.status==="active").length, color:"text-emerald-700", bg:"bg-emerald-50/60", border:"border-emerald-100/40", dot:"bg-emerald-500" },
            { label:"Onboarding",      value:employees.filter(e=>e.status==="onboarding_in_progress"||e.status==="pending_onboarding").length, color:"text-blue-700", bg:"bg-blue-50/60", border:"border-blue-100/40", dot:"bg-blue-500" },
          ].map(k => (
            <div key={k.label} className={`${k.bg} border ${k.border} rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm`}>
              <div>
                <p className={`text-[10px] font-bold ${k.color.replace('700', '500')} uppercase tracking-wider`}>{k.label}</p>
                <p className={`text-2xl font-black ${k.color} mt-1`}>{k.value}</p>
              </div>
              <span className={`w-3 h-3 rounded-full ${k.dot}`} />
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex-1 max-w-xs focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/15 transition-all shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search name, email, ID..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500 shadow-sm cursor-pointer">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending_onboarding">Pending Onboarding</option>
            <option value="onboarding_in_progress">Onboarding In Progress</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none focus:border-brand-500 shadow-sm cursor-pointer">
            <option value="">All Departments</option>
            {deptList.map(d => <option key={d.id||d.name} value={d.name}>{d.name}</option>)}
          </select>
          <label className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 shadow-sm transition-colors">
            <input type="checkbox" checked={includeDeleted} onChange={e => { setIncludeDeleted(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-slate-300 accent-brand-600" />
            <span className="text-xs font-medium text-slate-600">Include inactive</span>
          </label>
        </div>

        {/* Table */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
            </div>
          ) : employees.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">{search ? "No employees match your search" : "No employees found"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600">
                    {["Employee","Department","Designation","Joining Date","Gender & Exp","Status","Onboarding",""].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-white uppercase tracking-wide px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const sc = statusConfig[emp.status] || statusConfig.active;
                    const grad = getGradient(emp.department || emp.first_name || emp.official_email);
                    const name = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.official_email;
                    const initials = emp.first_name && emp.last_name ? `${emp.first_name[0]}${emp.last_name[0]}` : "?";
                    const prog = emp.onboarding_progress || 0;
                    return (
                      <motion.tr key={emp.id || emp._id || i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                        onClick={() => router.push(`/org/hr/employees/${emp.id || emp._id}`)}
                        className="border-t border-slate-50 hover:bg-brand-50/20 transition-colors cursor-pointer group">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{name}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{emp.employee_id} · {emp.official_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {emp.department
                            ? <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${grad} text-white shadow-sm`}>{emp.department}</span>
                            : <span className="text-xs text-slate-400">—</span>}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-700">{emp.designation || "—"}</td>
                        <td className="px-5 py-4 text-xs text-slate-500">{emp.joining_date || "—"}</td>
                        <td className="px-5 py-4">
                          <p className="text-xs font-medium text-slate-700 capitalize">{emp.gender || "—"}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{emp.is_fresher ? "Fresher" : "Experienced"}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{sc.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${prog===100?"bg-emerald-500":prog>=50?"bg-blue-500":"bg-amber-500"}`}
                                style={{ width:`${prog}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{prog}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-400">Page {page} of {totalPages} ({total} employees)</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button onClick={() => setPage(p=>Math.min(totalPages,p+1))} disabled={page>=totalPages}
                  className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 disabled:opacity-40">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Add Employee Modal ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-5 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold text-white">Add New Employee</h3>
                  <p className="text-sm text-white/80 mt-0.5">Welcome email with credentials will be sent automatically.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Stepper */}
              <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex-shrink-0 relative">
                {[
                  { step: 1, label: "Basic Details", icon: User },
                  { step: 2, label: "Role & Dept", icon: Briefcase },
                  { step: 3, label: "Salary & Docs", icon: Wallet }
                ].map((s, i) => (
                  <div key={s.step} className="flex flex-col items-center relative z-10 w-1/3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all duration-300 ${addStep >= s.step ? "bg-brand-600 text-white shadow-lg shadow-brand-500/30" : "bg-white border-2 border-slate-200 text-slate-400"}`}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <span className={`text-xs font-bold ${addStep >= s.step ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
                  </div>
                ))}
                {/* Connecting Line */}
                <div className="absolute top-[3rem] left-[20%] right-[20%] h-0.5 bg-slate-200 z-0 hidden sm:block">
                  <motion.div className="h-full bg-brand-600" initial={{ width: "0%" }} animate={{ width: addStep === 1 ? "0%" : addStep === 2 ? "50%" : "100%" }} transition={{ duration: 0.3 }} />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8">
                {formError && (
                  <div className="mb-6 flex items-center gap-2 p-4 rounded-2xl bg-red-50 border border-red-100">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-800">{formError}</span>
                  </div>
                )}

                <form id="add-employee-form" onSubmit={handleCreate} className="space-y-6">
                  {addStep === 1 && (
                    <motion.div initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Employee ID *</label>
                          <input value={addForm.employee_id} onChange={e=>{setAddForm(f=>({...f,employee_id:e.target.value})); setFieldErrors(fe=>({...fe,employee_id:undefined}));}} required
                            placeholder="EMP006" className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 font-mono transition-all bg-slate-50 focus:bg-white ${fieldErrors.employee_id ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                          {fieldErrors.employee_id && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.employee_id}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Gender *</label>
                          <div className="flex gap-2">
                            {["male", "female", "other"].map(g => (
                              <button key={g} type="button" onClick={()=>{setAddForm(f=>({...f,gender:g})); setFieldErrors(fe=>({...fe,gender:undefined}));}}
                                className={`flex-1 py-3 px-2 rounded-xl text-sm font-semibold capitalize border transition-all ${addForm.gender === g ? "bg-brand-50 border-brand-500 text-brand-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                                {g}
                              </button>
                            ))}
                          </div>
                          {fieldErrors.gender && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.gender}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">First Name *</label>
                          <input value={addForm.first_name} onChange={e=>{setAddForm(f=>({...f,first_name:e.target.value})); setFieldErrors(fe=>({...fe,first_name:undefined}));}} required placeholder="Rahul"
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white ${fieldErrors.first_name ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                          {fieldErrors.first_name && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.first_name}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Last Name *</label>
                          <input value={addForm.last_name} onChange={e=>{setAddForm(f=>({...f,last_name:e.target.value})); setFieldErrors(fe=>({...fe,last_name:undefined}));}} required placeholder="Verma"
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white ${fieldErrors.last_name ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                          {fieldErrors.last_name && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.last_name}</p>}
                        </div>
                        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Official Email *</label>
                            <input type="email" value={addForm.official_email} onChange={e=>{setAddForm(f=>({...f,official_email:e.target.value})); setFieldErrors(fe=>({...fe,official_email:undefined}));}} required placeholder="rahul@company.com"
                              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white ${fieldErrors.official_email ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                            {fieldErrors.official_email && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.official_email}</p>}
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Phone Number *</label>
                            <input value={addForm.phone} onChange={e=>{setAddForm(f=>({...f,phone:e.target.value})); setFieldErrors(fe=>({...fe,phone:undefined}));}} required placeholder="9876543210" maxLength={10}
                              className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white ${fieldErrors.phone ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                            {fieldErrors.phone && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.phone}</p>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {addStep === 2 && (
                    <motion.div initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Department *</label>
                          <select value={addForm.department} onChange={e=>{setAddForm(f=>({...f,department:e.target.value})); setFieldErrors(fe=>({...fe,department:undefined}));}} required
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white cursor-pointer ${fieldErrors.department ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`}>
                            <option value="">Select department...</option>
                            {deptList.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                          </select>
                          {fieldErrors.department && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.department}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Designation *</label>
                          <input value={addForm.designation} onChange={e=>{setAddForm(f=>({...f,designation:e.target.value})); setFieldErrors(fe=>({...fe,designation:undefined}));}} required placeholder="Senior Developer"
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white ${fieldErrors.designation ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                          {fieldErrors.designation && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.designation}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Joining Date *</label>
                          <input type="date" value={addForm.joining_date} onChange={e=>{setAddForm(f=>({...f,joining_date:e.target.value})); setFieldErrors(fe=>({...fe,joining_date:undefined}));}} required
                            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all bg-slate-50 focus:bg-white cursor-pointer ${fieldErrors.joining_date ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                          {fieldErrors.joining_date && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.joining_date}</p>}
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Employment Type</label>
                          <select value={addForm.employment_type} onChange={e=>setAddForm(f=>({...f,employment_type:e.target.value}))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white cursor-pointer">
                            <option value="full-time">Full Time</option><option value="part-time">Part Time</option>
                            <option value="contract">Contract</option><option value="intern">Intern</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Shift</label>
                          <input value={addForm.shift} onChange={e=>setAddForm(f=>({...f,shift:e.target.value}))} placeholder="General"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Work Location</label>
                          <input value={addForm.work_location} onChange={e=>setAddForm(f=>({...f,work_location:e.target.value}))} placeholder="Hyderabad Office"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all bg-slate-50 focus:bg-white" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {addStep === 3 && (
                    <motion.div initial={{ opacity:0, x: 20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}>
                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                          <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Annual CTC (₹) *</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input type="number" value={addForm.ctc} onChange={e=>{setAddForm(f=>({...f,ctc:e.target.value})); setFieldErrors(fe=>({...fe,ctc:undefined}));}} required placeholder="1200000"
                              className={`w-full pl-9 pr-4 py-3 rounded-xl border text-lg font-bold outline-none focus:ring-4 transition-all bg-white ${fieldErrors.ctc ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-300 focus:border-brand-500 focus:ring-brand-500/10"}`} />
                          </div>
                          {fieldErrors.ctc && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.ctc}</p>}
                          
                          {ctcVal > 0 && config && (
                            <div className="mt-4 grid grid-cols-3 gap-3">
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                                <p className="text-[10px] text-slate-500 font-bold mb-1">BASIC ({config.basic_percentage}%)</p>
                                <p className="text-sm font-black text-slate-800">₹{basicPay.toLocaleString("en-IN")}</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                                <p className="text-[10px] text-slate-500 font-bold mb-1">HRA ({config.hra_percentage}%)</p>
                                <p className="text-sm font-black text-slate-800">₹{hraPay.toLocaleString("en-IN")}</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm text-center">
                                <p className="text-[10px] text-slate-500 font-bold mb-1">SPECIAL ({config.special_allowance_percentage}%)</p>
                                <p className="text-sm font-black text-slate-800">₹{specialPay.toLocaleString("en-IN")}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-slate-200 hover:border-brand-400 transition-colors bg-white group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${addForm.pf_applicable ? 'bg-brand-600 border-brand-600' : 'border-slate-300 group-hover:border-brand-400'}`}>
                                {addForm.pf_applicable && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={addForm.pf_applicable} onChange={e=>setAddForm(f=>({...f,pf_applicable:e.target.checked}))} />
                              <span className="text-sm font-bold text-slate-700">PF Applicable</span>
                            </label>
                            <AnimatePresence>
                              {addForm.pf_applicable && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">UAN Number</label>
                                  <input value={addForm.uan_number} onChange={e=>{setAddForm(f=>({...f,uan_number:e.target.value})); setFieldErrors(fe=>({...fe,uan_number:undefined}));}} required={addForm.pf_applicable} placeholder="Enter 12-digit UAN" maxLength={12}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all ${fieldErrors.uan_number ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30" : "border-brand-200 focus:border-brand-500 focus:ring-brand-500/10 bg-brand-50/30"}`} />
                                  {fieldErrors.uan_number && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.uan_number}</p>}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border-2 border-slate-200 hover:border-brand-400 transition-colors bg-white group">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${addForm.esi_applicable ? 'bg-brand-600 border-brand-600' : 'border-slate-300 group-hover:border-brand-400'}`}>
                                {addForm.esi_applicable && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={addForm.esi_applicable} onChange={e=>setAddForm(f=>({...f,esi_applicable:e.target.checked}))} />
                              <span className="text-sm font-bold text-slate-700">ESI Applicable</span>
                            </label>
                            <AnimatePresence>
                              {addForm.esi_applicable && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">ESIC Number</label>
                                  <input value={addForm.esic_number} onChange={e=>{setAddForm(f=>({...f,esic_number:e.target.value})); setFieldErrors(fe=>({...fe,esic_number:undefined}));}} required={addForm.esi_applicable} placeholder="Enter 17-digit ESIC" maxLength={17}
                                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-4 transition-all ${fieldErrors.esic_number ? "border-red-400 focus:border-red-500 focus:ring-red-500/10 bg-red-50/30" : "border-brand-200 focus:border-brand-500 focus:ring-brand-500/10 bg-brand-50/30"}`} />
                                  {fieldErrors.esic_number && <p className="text-[10px] text-red-500 font-semibold mt-1">{fieldErrors.esic_number}</p>}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                        
                        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl border-2 border-slate-200 hover:border-brand-400 transition-colors bg-slate-50 group">
                          <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${addForm.is_fresher ? 'bg-brand-600 border-brand-600' : 'border-slate-300 group-hover:border-brand-400'}`}>
                            {addForm.is_fresher && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={addForm.is_fresher} onChange={e=>setAddForm(f=>({...f,is_fresher:e.target.checked}))} />
                          <div>
                            <span className="text-sm font-bold text-slate-800 block mb-1">Fresher Candidate</span>
                            <span className="text-xs text-slate-500">Check this if the employee has no prior work experience.</span>
                          </div>
                        </label>
                      </div>
                    </motion.div>
                  )}
                </form>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between flex-shrink-0">
                <button type="button" onClick={() => addStep > 1 ? setAddStep(s => s - 1) : setShowAddModal(false)}
                  className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors flex items-center gap-2">
                  {addStep > 1 ? <><ArrowLeft className="w-4 h-4" /> Back</> : "Cancel"}
                </button>
                
                {addStep < 3 ? (
                  <button type="button" onClick={() => {
                    // Very basic validation before continuing to next step
                    if (addStep === 1) {
                      if (!addForm.employee_id || !addForm.first_name || !addForm.last_name || !addForm.official_email || !addForm.phone) {
                        setFormError("Please fill in all required basic details.");
                        return;
                      }
                    } else if (addStep === 2) {
                      if (!addForm.department || !addForm.designation || !addForm.joining_date) {
                        setFormError("Please fill in all required role details.");
                        return;
                      }
                    }
                    setFormError("");
                    setAddStep(s => s + 1);
                  }}
                    className="px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-all flex items-center gap-2 hover:opacity-90">
                    Continue <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button type="submit" form="add-employee-form" disabled={formLoading}
                    className="px-8 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                    {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {formLoading ? "Creating..." : "Create Employee"}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CSV Import Modal ── */}
      <AnimatePresence>
        {showCSVModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowCSVModal(false); setCsvResult(null); setCsvFile(null); setFormError(""); }}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Import via CSV</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Bulk add employees from a CSV file</p>
                </div>
                <button onClick={() => { setShowCSVModal(false); setCsvResult(null); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {formError && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{formError}</span>
                </div>
              )}

              {/* Template info */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                <p className="text-[10px] font-bold text-slate-600 mb-1">Required CSV columns:</p>
                <p className="text-[10px] text-slate-500 font-mono leading-relaxed">employee_id, first_name, last_name, official_email, phone, department, designation, joining_date, ctc</p>
                <p className="text-[10px] text-slate-400 mt-1">Optional: employment_type, shift, work_location</p>
              </div>

              <form onSubmit={handleCSVImport} className="space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-400 transition-colors">
                  <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  {csvFile ? (
                    <p className="text-sm font-semibold text-brand-600 flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4" /> {csvFile.name}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">Drop CSV file or click to browse</p>
                  )}
                  <input type="file" accept=".csv" onChange={e => setCsvFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer" style={{ position:"relative" }} />
                </div>

                {/* Result */}
                {csvResult && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-sm font-bold text-green-700">✓ {csvResult.imported} imported, {csvResult.failed} failed</p>
                    {csvResult.errors && csvResult.errors.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {csvResult.errors.slice(0,5).map((err, i) => (
                          <p key={i} className="text-[10px] text-red-600">Row {err.row}: {err.error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <motion.button type="submit" disabled={!csvFile || formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                  {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
                  {formLoading ? "Importing..." : "Upload & Import"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}