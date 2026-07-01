"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Download, Upload, Users, Eye,
  CheckCircle2, Clock, AlertCircle, XCircle,
  ChevronRight, ChevronLeft, Building, Calendar, X, Save,
  RefreshCw, FileText
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { createEmployee, importEmployeesCSV } from "@/lib/api";
import { useDepartments, useEmployees, useInvalidate, usePayrollConfig } from "@/lib/queries";

const statusConfig = {
  active:                  { label:"Active",       cls:"bg-green-50 text-green-600 border-green-200" },
  onboarding_in_progress:  { label:"Onboarding",  cls:"bg-blue-50 text-blue-600 border-blue-200"   },
  pending_onboarding:      { label:"Pending",      cls:"bg-amber-50 text-amber-600 border-amber-200"},
  inactive:                { label:"Inactive",     cls:"bg-red-50 text-red-500 border-red-200"      },
};

const deptColors = {
  Engineering:"bg-blue-600", Design:"bg-purple-600", Marketing:"bg-pink-500",
  Sales:"bg-green-600", Finance:"bg-amber-500", HR:"bg-teal-600",
  Product:"bg-indigo-600", Legal:"bg-slate-600", Operations:"bg-cyan-600", Support:"bg-orange-500",
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
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [toast, setToast]               = useState(null);
  const [formLoading, setFormLoading]   = useState(false);
  const [formError, setFormError]       = useState("");
  const [csvFile, setCsvFile]           = useState(null);
  const [csvResult, setCsvResult]       = useState(null);

  // Add form
  const [addForm, setAddForm] = useState({
    employee_id:"", first_name:"", last_name:"", official_email:"", phone:"",
    gender:"male", department:"", designation:"", reporting_manager:"",
    joining_date:"", employment_type:"full-time", shift:"General",
    work_location:"", ctc:"",
    is_fresher: false,
    pf_applicable: false, uan_number: "",
    esi_applicable: false, esic_number: "",
  });

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
    setFormLoading(true);
    setFormError("");

    const payload = {
      employee_id: addForm.employee_id,
      first_name: addForm.first_name,
      last_name: addForm.last_name,
      official_email: addForm.official_email,
      phone: addForm.phone,
      gender: addForm.gender,
      department: addForm.department,
      designation: addForm.designation,
      reporting_manager: addForm.reporting_manager || undefined,
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
        setAddForm({ employee_id:"", first_name:"", last_name:"", official_email:"", phone:"", gender:"male", department:"", designation:"", reporting_manager:"", joining_date:"", employment_type:"full-time", shift:"General", work_location:"", ctc:"", is_fresher:false, pf_applicable:false, uan_number:"", esi_applicable:false, esic_number:"" });
        invalidate("employees");
      } else {
        const msg = res.data?.detail?.[0]?.msg || res.data?.detail || res.data?.error || "Failed to create employee";
        setFormError(typeof msg === "string" ? msg : JSON.stringify(msg));
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
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Employees</h2>
            <p className="text-sm text-slate-500">{total} total employees</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => invalidate("employees")} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading?"animate-spin":""}`} />
            </button>
            <button onClick={() => setShowCSVModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
              <Upload className="w-4 h-4" /> CSV Import
            </button>
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
              onClick={() => { setShowAddModal(true); setFormError(""); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-brand-500/20">
              <Plus className="w-4 h-4" /> Add Employee
            </motion.button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 w-72 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search name, email, ID..." className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none w-full" />
          </div>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="pending_onboarding">Pending Onboarding</option>
            <option value="onboarding_in_progress">Onboarding In Progress</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-600 outline-none">
            <option value="">All Departments</option>
            {deptList.map(d => <option key={d.id||d.name} value={d.name}>{d.name}</option>)}
          </select>
          <label className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
            <input type="checkbox" checked={includeDeleted} onChange={e => { setIncludeDeleted(e.target.checked); setPage(1); }}
              className="w-4 h-4 rounded border-slate-300 text-brand-600" />
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
                  <tr className="bg-slate-50/80">
                    {["Employee","Department","Designation","Joining Date","Gender & Exp","Status","Onboarding",""].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => {
                    const sc = statusConfig[emp.status] || statusConfig.active;
                    const avBg = deptColors[emp.department] || "bg-slate-600";
                    const name = `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || emp.official_email;
                    const initials = emp.first_name && emp.last_name ? `${emp.first_name[0]}${emp.last_name[0]}` : "?";
                    return (
                      <motion.tr key={emp.id || emp._id || i} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.03 }}
                        onClick={() => router.push(`/org/hr/employees/${emp.id || emp._id}`)}
                        className="border-t border-slate-50 hover:bg-brand-50/30 transition-colors cursor-pointer group">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl ${avBg} flex items-center justify-center text-white text-[10px] font-bold`}>
                              {initials}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800">{name}</p>
                              <p className="text-[10px] text-slate-400">{emp.official_email} • {emp.employee_id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{emp.department || "—"}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{emp.designation || "—"}</td>
                        <td className="px-5 py-3.5 text-xs text-slate-600">{emp.joining_date || "—"}</td>
                        <td className="px-5 py-3.5">
                          <p className="text-xs text-slate-800 capitalize">{emp.gender || "—"}</p>
                          <p className="text-[10px] text-slate-400">{emp.is_fresher ? "Fresher" : "Experienced"}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${(emp.onboarding_progress||0)===100?"bg-green-500":(emp.onboarding_progress||0)>=50?"bg-blue-500":"bg-amber-500"}`}
                                style={{ width:`${emp.onboarding_progress||0}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{emp.onboarding_progress||0}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10 rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Add New Employee</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Welcome email with credentials will be sent automatically.</p>
                </div>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {formError && (
                <div className="mx-5 mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-xs text-red-700">{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreate} className="p-5 space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Information</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Employee ID *</label>
                    <input value={addForm.employee_id} onChange={e=>setAddForm(f=>({...f,employee_id:e.target.value}))} required
                      placeholder="EMP006" className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 font-mono" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Employment Type</label>
                    <select value={addForm.employment_type} onChange={e=>setAddForm(f=>({...f,employment_type:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="full-time">Full Time</option><option value="part-time">Part Time</option>
                      <option value="contract">Contract</option><option value="intern">Intern</option>
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer px-3.5 py-2.5 rounded-xl border border-slate-200 w-full hover:border-brand-300 transition-colors">
                      <input type="checkbox" checked={addForm.is_fresher} onChange={e=>setAddForm(f=>({...f,is_fresher:e.target.checked}))}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      <div>
                        <span className="text-sm font-semibold text-slate-700">Fresher</span>
                        <p className="text-[10px] text-slate-400">No prior work experience</p>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">First Name *</label>
                    <input value={addForm.first_name} onChange={e=>setAddForm(f=>({...f,first_name:e.target.value}))} required placeholder="Rahul"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Last Name *</label>
                    <input value={addForm.last_name} onChange={e=>setAddForm(f=>({...f,last_name:e.target.value}))} required placeholder="Verma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Official Email *</label>
                    <input type="email" value={addForm.official_email} onChange={e=>setAddForm(f=>({...f,official_email:e.target.value}))} required placeholder="rahul@company.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Phone *</label>
                    <input value={addForm.phone} onChange={e=>setAddForm(f=>({...f,phone:e.target.value}))} required placeholder="+919876543210"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Gender *</label>
                    <select value={addForm.gender} onChange={e=>setAddForm(f=>({...f,gender:e.target.value}))} required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Role & Reporting</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Department *</label>
                    <select value={addForm.department} onChange={e=>setAddForm(f=>({...f,department:e.target.value}))} required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="">Select department...</option>
                      {deptList.map(d=><option key={d.id||d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Designation *</label>
                    <input value={addForm.designation} onChange={e=>setAddForm(f=>({...f,designation:e.target.value}))} required placeholder="Senior Developer"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Reporting Manager</label>
                    <input value={addForm.reporting_manager} onChange={e=>setAddForm(f=>({...f,reporting_manager:e.target.value}))} placeholder="Manager name"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Joining Date *</label>
                    <input type="date" value={addForm.joining_date} onChange={e=>setAddForm(f=>({...f,joining_date:e.target.value}))} required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Shift</label>
                    <input value={addForm.shift} onChange={e=>setAddForm(f=>({...f,shift:e.target.value}))} placeholder="General"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Work Location</label>
                    <input value={addForm.work_location} onChange={e=>setAddForm(f=>({...f,work_location:e.target.value}))} placeholder="Hyderabad Office"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>

                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-2">Salary Structure & Compliances</p>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Annual CTC (₹) *</label>
                    <input type="number" value={addForm.ctc} onChange={e=>setAddForm(f=>({...f,ctc:e.target.value}))} required placeholder="1200000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <p className="text-[10px] text-slate-400">Breakdown (Basic, HRA, Special Allowance) is calculated from payroll config percentages during payroll run.</p>
                  {ctcVal > 0 && config && (
                    <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div><p className="text-[10px] text-slate-500">Basic ({config.basic_percentage}%)</p><p className="text-xs font-bold text-slate-800">₹{basicPay.toLocaleString("en-IN")}</p></div>
                      <div><p className="text-[10px] text-slate-500">HRA ({config.hra_percentage}%)</p><p className="text-xs font-bold text-slate-800">₹{hraPay.toLocaleString("en-IN")}</p></div>
                      <div><p className="text-[10px] text-slate-500">Special ({config.special_allowance_percentage}%)</p><p className="text-xs font-bold text-slate-800">₹{specialPay.toLocaleString("en-IN")}</p></div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer px-3.5 py-2.5 rounded-xl border border-slate-200 w-full hover:border-brand-300 transition-colors">
                      <input type="checkbox" checked={addForm.pf_applicable} onChange={e=>setAddForm(f=>({...f,pf_applicable:e.target.checked}))}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      <span className="text-sm font-semibold text-slate-700">PF Applicable</span>
                    </label>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">UAN Number</label>
                    <input value={addForm.uan_number} onChange={e=>setAddForm(f=>({...f,uan_number:e.target.value}))} disabled={!addForm.pf_applicable} placeholder="Required if PF is applicable"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 disabled:bg-slate-50 disabled:text-slate-400" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center">
                    <label className="flex items-center gap-3 cursor-pointer px-3.5 py-2.5 rounded-xl border border-slate-200 w-full hover:border-brand-300 transition-colors">
                      <input type="checkbox" checked={addForm.esi_applicable} onChange={e=>setAddForm(f=>({...f,esi_applicable:e.target.checked}))}
                        className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                      <span className="text-sm font-semibold text-slate-700">ESI Applicable</span>
                    </label>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">ESIC Number</label>
                    <input value={addForm.esic_number} onChange={e=>setAddForm(f=>({...f,esic_number:e.target.value}))} disabled={!addForm.esi_applicable} placeholder="Required if ESI is applicable"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 disabled:bg-slate-50 disabled:text-slate-400" />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-[10px] text-blue-700"><strong>Note:</strong> Employee gets Welcome1 as default password and must complete onboarding after first login.</p>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">Cancel</button>
                  <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                    className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                    {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {formLoading ? "Creating..." : "Create & Send Invite"}
                  </motion.button>
                </div>
              </form>
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
                <p className="text-[10px] text-slate-400 mt-1">Optional: reporting_manager, employment_type</p>
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
