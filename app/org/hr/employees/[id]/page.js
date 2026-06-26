"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, User, Mail, Phone, Building, Calendar,
  MapPin, CreditCard, Shield, GraduationCap, Briefcase,
  CheckCircle2, XCircle, Clock, AlertCircle,
  Edit, Download, Heart, UserCheck, IndianRupee, X,
  Save, Camera, Globe, Fingerprint, BookOpen, RefreshCw
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getEmployeeDetail, updateEmployee, verifyEmployee, deactivateEmployee, listEditRequests, approveEditRequest, rejectEditRequest } from "@/lib/api";

const statusConfig = {
  active:                 { label:"Active",      cls:"bg-green-50 text-green-600 border-green-200" },
  onboarding_in_progress: { label:"Onboarding", cls:"bg-blue-50 text-blue-600 border-blue-200"   },
  pending_onboarding:     { label:"Pending",     cls:"bg-amber-50 text-amber-600 border-amber-200"},
  inactive:               { label:"Inactive",    cls:"bg-red-50 text-red-500 border-red-200"      },
};

const deptColors = {
  Engineering:"bg-blue-600", Design:"bg-purple-600", Marketing:"bg-pink-500",
  Sales:"bg-green-600", Finance:"bg-amber-500", HR:"bg-teal-600",
  Product:"bg-indigo-600", Legal:"bg-slate-600",
};

const tabs = [
  { key:"overview",    label:"Overview",          icon:Building     },
  { key:"personal",    label:"Personal",          icon:User         },
  { key:"address",     label:"Address",           icon:MapPin       },
  { key:"bank",        label:"Bank & IDs",        icon:CreditCard   },
  { key:"education",   label:"Education",         icon:GraduationCap},
  { key:"experience",  label:"Experience",        icon:Briefcase    },
  { key:"salary",      label:"Salary",            icon:IndianRupee  },
  { key:"onboarding",  label:"Onboarding",        icon:CheckCircle2 },
  { key:"editRequests",label:"Edit Requests",     icon:Edit         },
];

const sectionMeta = {
  personal_details:  "Personal Details",
  address:           "Address",
  emergency_contact: "Emergency Contact",
  bank_details:      "Bank Details",
  government_ids:    "Government IDs",
  education:         "Education",
  experience:        "Experience",
  policy_acceptance: "Policy Acceptance",
};

export default function EmployeeDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [emp, setEmp]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState("overview");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm]     = useState({});
  const [toast, setToast]           = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [showRequestChangesModal, setShowRequestChangesModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [changeSections, setChangeSections] = useState([]);
  const [changeNotes, setChangeNotes] = useState("");

  // Edit requests state
  const [editReqs, setEditReqs] = useState([]);
  const [showRejectReqModal, setShowRejectReqModal] = useState(null);
  const [rejectReqReason, setRejectReqReason] = useState("");

  const showToast = (msg, type="success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Fetch employee
  useEffect(() => {
    async function fetchEmp() {
      setLoading(true);
      try {
        const res = await getEmployeeDetail(id);
        if (res.data && typeof res.data === "object" && !Array.isArray(res.data)) {
          setEmp(res.data);
        }
        // Fetch edit requests for this employee
        const reqRes = await listEditRequests({ employee_id: id, limit: 50 });
        if (reqRes.ok && reqRes.data) setEditReqs(reqRes.data.requests || []);
      } catch (err) {
        console.error("Failed to fetch employee:", err);
      }
      setLoading(false);
    }
    if (id) fetchEmp();
  }, [id]);

  // Edit request handlers
  const handleApproveEditReq = async (reqId, hours = 3) => {
    const res = await approveEditRequest(reqId, { hours });
    if (res.ok) {
      showToast("Edit request approved — employee can now edit");
      const r = await listEditRequests({ employee_id: id, limit: 50 });
      if (r.ok) setEditReqs(r.data.requests || []);
    } else { showToast(res.data?.detail || "Failed to approve", "error"); }
  };

  const handleRejectEditReq = async (reqId) => {
    if (!rejectReqReason.trim()) { showToast("Provide a rejection reason", "error"); return; }
    const res = await rejectEditRequest(reqId, rejectReqReason);
    if (res.ok) {
      showToast("Edit request rejected");
      setShowRejectReqModal(null);
      setRejectReqReason("");
      const r = await listEditRequests({ employee_id: id, limit: 50 });
      if (r.ok) setEditReqs(r.data.requests || []);
    } else { showToast(res.data?.detail || "Failed to reject", "error"); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!emp) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-bold text-slate-700">Employee not found</p>
          <button onClick={() => router.back()} className="mt-3 text-sm text-brand-600 hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const sc = statusConfig[emp.status] || statusConfig.active;
  const avBg = deptColors[emp.department] || "bg-slate-600";
  const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
  const fmt = (v) => `₹${(v||0).toLocaleString("en-IN")}`;

  const openEdit = () => {
    setEditForm({
      employee_id: emp.employee_id || "",
      first_name: emp.first_name || "",
      last_name: emp.last_name || "",
      official_email: emp.official_email || "",
      phone: emp.phone || "",
      department: emp.department || "",
      designation: emp.designation || "",
      reporting_manager: emp.reporting_manager || "",
      employment_type: emp.employment_type || "full-time",
      shift: emp.shift || "",
      work_location: emp.work_location || "",
      basic: emp.salary_structure?.basic || "",
      hra: emp.salary_structure?.hra || "",
      special_allowance: emp.salary_structure?.special_allowance || "",
      ctc: emp.salary_structure?.ctc || "",
    });
    setShowEditModal(true);
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      department: editForm.department,
      designation: editForm.designation,
      reporting_manager: editForm.reporting_manager || undefined,
      employment_type: editForm.employment_type,
      shift: editForm.shift || undefined,
      work_location: editForm.work_location || undefined,
      salary_structure: {
        basic: parseInt(editForm.basic) || 0,
        hra: parseInt(editForm.hra) || 0,
        special_allowance: parseInt(editForm.special_allowance) || 0,
        ctc: parseInt(editForm.ctc) || 0,
      },
    };
    try {
      const res = await updateEmployee(id, payload);
      if (res.ok) {
        showToast("Employee updated successfully");
        setShowEditModal(false);
        // Refresh data
        const refreshed = await getEmployeeDetail(id);
        if (refreshed.ok) setEmp(refreshed.data);
      } else {
        showToast(res.data?.detail || "Update failed", "error");
      }
    } catch {
      showToast("Network error", "error");
    }
    setFormLoading(false);
  };

  const handleVerifySection = async (section) => {
    const res = await verifyEmployee(id, { action: "verify_section", section });
    if (res.ok) {
      showToast(`${sectionMeta[section]} verified`);
      const refreshed = await getEmployeeDetail(id);
      if (refreshed.ok) setEmp(refreshed.data);
    } else {
      showToast("Verification failed", "error");
    }
  };

  const handleApprove = async () => {
    const res = await verifyEmployee(id, { action: "approve" });
    if (res.ok) {
      showToast("Employee approved & activated!");
      const refreshed = await getEmployeeDetail(id);
      if (refreshed.ok) setEmp(refreshed.data);
    } else {
      showToast(res.data?.detail || "Approval failed", "error");
    }
  };

  // Onboarding sections from API response
  const onboarding = emp.onboarding || emp.onboarding_sections || {};
  const sections = onboarding.sections || emp.onboarding_sections || {};
  const progress = onboarding.progress || emp.onboarding_progress || 0;

  const handleRequestChanges = async () => {
    if (changeSections.length === 0) return;
    const res = await verifyEmployee(id, {
      action: "request_changes",
      sections: changeSections,
      notes: changeNotes || undefined,
    });
    if (res.ok) {
      showToast("Change request sent to employee");
      setShowRequestChangesModal(false);
      setChangeSections([]);
      setChangeNotes("");
      const refreshed = await getEmployeeDetail(id);
      if (refreshed.data) setEmp(refreshed.data);
    } else {
      showToast(res.data?.detail || "Failed to request changes", "error");
    }
  };

  const toggleChangeSection = (key) => {
    setChangeSections(prev => prev.includes(key) ? prev.filter(s=>s!==key) : [...prev, key]);
  };

  const handleDeactivate = async () => {
    const res = await deactivateEmployee(id);
    if (res.ok) {
      showToast("Employee deactivated");
      setShowDeactivateModal(false);
      router.push("/org/hr/employees");
    } else {
      showToast(res.data?.detail || "Deactivation failed", "error");
      setShowDeactivateModal(false);
    }
  };

  // Render helpers per tab
  const InfoRow = ({ label, value, mono }) => (
    <div className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-500 font-medium">{label}</span>
      <span className={`text-xs font-semibold text-slate-800 ${mono ? "font-mono" : ""}`}>{value || "—"}</span>
    </div>
  );

  const EmptyState = ({ text }) => (
    <div className="py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
        <Clock className="w-5 h-5 text-slate-300" />
      </div>
      <p className="text-xs text-slate-400 italic">{text}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Employee Detail" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </button>

        {/* Header */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Top gradient accent */}
          <div className={`h-2 ${avBg}`} />
          <div className="p-6 flex items-start gap-5 flex-wrap">
            <div className={`w-16 h-16 rounded-2xl ${avBg} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{emp.employee_id}</span>
              </div>
              <p className="text-sm text-slate-500">{emp.designation} • {emp.department}</p>
              <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-slate-400">
                <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{emp.official_email}</span>
                <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{emp.phone}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {emp.joining_date}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{emp.work_location}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={openEdit}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:border-brand-300 transition-all">
                <Edit className="w-3.5 h-3.5" /> Edit
              </motion.button>
              {emp.status !== "inactive" && (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => setShowDeactivateModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all">
                  <XCircle className="w-3.5 h-3.5" /> Deactivate
                </motion.button>
              )}
              {emp.status !== "active" && progress === 100 && (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-green-500/20">
                  <UserCheck className="w-3.5 h-3.5" /> Approve
                </motion.button>
              )}
            </div>
          </div>
          {/* Onboarding progress bar in header */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500 font-medium">Onboarding</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width:0 }} animate={{ width:`${progress}%` }} transition={{ duration:0.8 }}
                  className={`h-full rounded-full ${progress===100?"bg-green-500":progress>=50?"bg-blue-500":"bg-amber-500"}`} />
              </div>
              <span className={`text-xs font-bold ${progress===100?"text-green-600":progress>=50?"text-blue-600":"text-amber-600"}`}>{progress}%</span>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto hide-scrollbar bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab===tab.key ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}>
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Building className="w-4 h-4 text-brand-500" /> Employment Details</h3>
                  <InfoRow label="Employee ID" value={emp.employee_id} mono />
                  <InfoRow label="Gender" value={emp.gender} />
                  <InfoRow label="Department" value={emp.department} />
                  <InfoRow label="Designation" value={emp.designation} />
                  <InfoRow label="Reporting Manager" value={emp.reporting_manager} />
                  <InfoRow label="Employment Type" value={emp.employment_type} />
                  <InfoRow label="Shift" value={emp.shift} />
                  <InfoRow label="Work Location" value={emp.work_location} />
                  <InfoRow label="Joining Date" value={emp.joining_date} />
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" /> Emergency Contact</h3>
                  {emp.emergency_contact ? (
                    <>
                      <InfoRow label="Name" value={emp.emergency_contact.name} />
                      <InfoRow label="Relation" value={emp.emergency_contact.relation} />
                      <InfoRow label="Phone" value={emp.emergency_contact.phone} />
                    </>
                  ) : <EmptyState text="Not yet filled by employee" />}
                </div>
              </div>
            )}

            {/* PERSONAL TAB */}
            {activeTab === "personal" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-brand-500" /> Personal Information</h3>
                {emp.personal_details ? (
                  <div className="grid sm:grid-cols-2 gap-x-8">
                    <InfoRow label="Date of Birth" value={emp.personal_details.date_of_birth} />
                    <InfoRow label="Gender" value={emp.personal_details.gender} />
                    <InfoRow label="Blood Group" value={emp.personal_details.blood_group} />
                    <InfoRow label="Marital Status" value={emp.personal_details.marital_status} />
                    <InfoRow label="Email" value={emp.official_email} />
                    <InfoRow label="Phone" value={emp.phone} />
                  </div>
                ) : <EmptyState text="Employee has not completed personal details" />}
              </div>
            )}

            {/* ADDRESS TAB */}
            {activeTab === "address" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Current Address</h3>
                  {emp.address ? (
                    <>
                      <InfoRow label="Street" value={emp.address.current.line1} />
                      <InfoRow label="City" value={emp.address.current.city} />
                      <InfoRow label="State" value={emp.address.current.state} />
                      <InfoRow label="Pincode" value={emp.address.current.pincode} mono />
                    </>
                  ) : <EmptyState text="Not yet filled" />}
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4">Permanent Address</h3>
                  {emp.address ? (
                    <>
                      <InfoRow label="Street" value={emp.address.permanent.line1} />
                      <InfoRow label="City" value={emp.address.permanent.city} />
                      <InfoRow label="State" value={emp.address.permanent.state} />
                      <InfoRow label="Pincode" value={emp.address.permanent.pincode} mono />
                    </>
                  ) : <EmptyState text="Not yet filled" />}
                </div>
              </div>
            )}

            {/* BANK & IDS TAB */}
            {activeTab === "bank" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-brand-500" /> Bank Details</h3>
                  {emp.bank_details ? (
                    <>
                      <InfoRow label="Bank Name" value={emp.bank_details.bank_name} />
                      <InfoRow label="Account No." value={emp.bank_details.account_number} mono />
                      <InfoRow label="IFSC Code" value={emp.bank_details.ifsc} mono />
                    </>
                  ) : <EmptyState text="Not yet filled" />}
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-brand-500" /> Government IDs</h3>
                  {emp.government_ids ? (
                    <>
                      <div className="flex items-center justify-between py-3 border-b border-slate-50">
                        <span className="text-xs text-slate-500">PAN Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 font-mono">{emp.government_ids.pan?.number || "Not uploaded"}</span>
                          {emp.government_ids.pan?.document_url && (
                            <a href={emp.government_ids.pan.document_url} target="_blank" rel="noopener noreferrer"
                              className="text-[9px] text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-lg hover:bg-brand-100 font-bold">View</a>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3">
                        <span className="text-xs text-slate-500">Aadhaar Number</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800 font-mono">{emp.government_ids.aadhaar?.number || "Not uploaded"}</span>
                          {emp.government_ids.aadhaar?.document_url && (
                            <a href={emp.government_ids.aadhaar.document_url} target="_blank" rel="noopener noreferrer"
                              className="text-[9px] text-brand-600 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-lg hover:bg-brand-100 font-bold">View</a>
                          )}
                        </div>
                      </div>
                    </>
                  ) : <EmptyState text="Not yet filled" />}
                </div>
              </div>
            )}

            {/* EDUCATION TAB */}
            {activeTab === "education" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-3xl">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-brand-500" /> Education</h3>
                {(emp.education?.entries || emp.education || []).length > 0 ? (
                  <div className="space-y-3">
                    {(emp.education?.entries || emp.education || []).map((edu, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{edu.degree}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{edu.institution || edu.university} • {edu.field_of_study || ""} {edu.end_year || edu.year ? `• ${edu.end_year || edu.year}` : ""}</p>
                          {edu.grade && <p className="text-[10px] text-slate-400 mt-0.5">Grade: {edu.grade}</p>}
                        </div>
                        {edu.document_url && (
                          <a href={edu.document_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 font-bold">
                            <Download className="w-3 h-3" /> Certificate
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <EmptyState text="No education records yet" />}
              </div>
            )}

            {/* EXPERIENCE TAB */}
            {activeTab === "experience" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-3xl">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Briefcase className="w-4 h-4 text-brand-500" /> Work Experience</h3>
                {(emp.experience?.entries || emp.experience || []).length > 0 ? (
                  <div className="space-y-3">
                    {(emp.experience?.entries || emp.experience || []).map((exp, i) => (
                      <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{exp.designation || exp.role}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{exp.company} {exp.start_date ? `• ${exp.start_date}` : ""} {exp.end_date ? `– ${exp.end_date}` : exp.is_current ? "– Present" : ""}</p>
                        </div>
                        {exp.document_url && (
                          <a href={exp.document_url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[10px] text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100 font-bold">
                            <Download className="w-3 h-3" /> Experience Letter
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : <EmptyState text={emp.status === "active" ? "Fresher — no prior experience" : "Not yet filled by employee"} />}
              </div>
            )}

            {/* SALARY TAB */}
            {activeTab === "salary" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><IndianRupee className="w-4 h-4 text-brand-500" /> Salary Structure</h3>
                <div className="space-y-1">
                  <InfoRow label="Basic" value={fmt(emp.salary_structure?.basic)} />
                  <InfoRow label="HRA" value={fmt(emp.salary_structure?.hra)} />
                  <InfoRow label="Special Allowance" value={fmt(emp.salary_structure?.special_allowance)} />
                  <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Annual CTC</span>
                    <span className="text-lg font-black text-brand-600">{fmt(emp.salary_structure?.ctc)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-slate-100">
                    <span className="text-xs text-slate-500">Monthly Gross</span>
                    <span className="text-sm font-bold text-slate-800">{fmt(Math.round((emp.salary_structure?.ctc || 0) / 12))}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ONBOARDING TAB */}
            {activeTab === "onboarding" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-brand-500" /> Onboarding Checklist</h3>
                  <span className={`text-xs font-bold ${progress===100?"text-green-600":"text-blue-600"}`}>
                    {progress}% Complete
                  </span>
                </div>
                <div className="space-y-2.5">
                  {Object.entries(sections).filter(([key]) => key !== "documents").map(([key, section]) => (
                    <div key={key} className={`p-4 rounded-xl border flex items-center justify-between ${
                      section.verified ? "bg-green-50/60 border-green-200" :
                      section.status==="completed" ? "bg-blue-50/60 border-blue-200" :
                      "bg-slate-50 border-slate-200"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                          section.verified ? "bg-green-500" : section.status==="completed" ? "bg-blue-500" : "bg-slate-300"
                        }`}>
                          {section.verified ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> :
                           section.status==="completed" ? <Clock className="w-3.5 h-3.5 text-white" /> :
                           <XCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{sectionMeta[key] || key}</p>
                          <p className={`text-[10px] ${section.verified ? "text-green-600" : section.status==="completed" ? "text-blue-600" : "text-slate-400"}`}>
                            {section.verified ? "Verified by HR" : section.status==="completed" ? "Submitted — awaiting verification" : "Not yet submitted"}
                          </p>
                        </div>
                      </div>
                      {section.status === "completed" && !section.verified && (
                        <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                          onClick={() => handleVerifySection(key)}
                          className="text-[10px] font-bold text-green-600 bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors">
                          ✓ Verify
                        </motion.button>
                      )}
                    </div>
                  ))}
                </div>
                {emp.status !== "active" && (
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
                    <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                      onClick={handleApprove}
                      className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 flex items-center gap-2">
                      <UserCheck className="w-4 h-4" /> Approve & Activate
                    </motion.button>
                    <button onClick={() => setShowRequestChangesModal(true)}
                      className="px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100">
                      Request Changes
                    </button>
                    <button className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100">
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* EDIT REQUESTS TAB */}
            {activeTab === "editRequests" && (
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-5">
                  <Edit className="w-4 h-4 text-brand-500" /> Profile Edit Requests
                </h3>
                {editReqs.length === 0 ? (
                  <div className="text-center py-10">
                    <Edit className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No edit requests from this employee</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {editReqs.map((req, i) => {
                      const statusMap = {
                        pending:  { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Pending" },
                        approved: { cls: "bg-green-50 text-green-600 border-green-200", label: "Approved" },
                        rejected: { cls: "bg-red-50 text-red-600 border-red-200", label: "Rejected" },
                        expired:  { cls: "bg-slate-50 text-slate-500 border-slate-200", label: "Expired" },
                      };
                      const sc = statusMap[req.status] || statusMap.pending;
                      return (
                        <div key={req.id || i} className={`p-4 rounded-xl border ${req.status === "pending" ? "border-amber-200 bg-amber-50/30" : "border-slate-100 bg-slate-50/30"}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="text-xs font-bold text-slate-800">{sectionMeta[req.section] || req.section}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{req.reason}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <span>Requested: {req.created_at ? new Date(req.created_at).toLocaleString() : "—"}</span>
                            {req.approved_by_name && <span>• Approved by: {req.approved_by_name}</span>}
                            {req.edit_allowed_until && <span>• Edit until: {new Date(req.edit_allowed_until).toLocaleString()}</span>}
                          </div>
                          {req.status === "pending" && (
                            <div className="flex items-center gap-2 mt-3">
                              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                onClick={() => handleApproveEditReq(req.id)}
                                className="text-[10px] font-bold text-green-600 bg-green-100 border border-green-200 px-4 py-1.5 rounded-lg hover:bg-green-200">
                                ✓ Approve (3hrs)
                              </motion.button>
                              <button onClick={() => { setShowRejectReqModal(req); setRejectReqReason(""); }}
                                className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100">
                                ✗ Reject
                              </button>
                            </div>
                          )}
                          {req.rejection_reason && (
                            <p className="text-[10px] text-red-500 mt-2">Rejection reason: {req.rejection_reason}</p>
                          )}
                          {req.edit_completed && (
                            <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Edit completed at {new Date(req.edit_completed_at).toLocaleString()}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Edit Employee Modal ── */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex items-center justify-between z-10">
                <h3 className="text-lg font-bold text-slate-900">Edit Employee</h3>
                <button onClick={() => setShowEditModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleEditSave} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">First Name</label>
                    <input value={editForm.first_name} onChange={e=>setEditForm(f=>({...f,first_name:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Last Name</label>
                    <input value={editForm.last_name} onChange={e=>setEditForm(f=>({...f,last_name:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Email</label>
                  <input type="email" value={editForm.official_email} onChange={e=>setEditForm(f=>({...f,official_email:e.target.value}))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Phone</label>
                    <input value={editForm.phone} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Employee ID</label>
                    <input value={editForm.employee_id} readOnly
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-400 font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Department</label>
                    <select value={editForm.department} onChange={e=>setEditForm(f=>({...f,department:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      {["Engineering","Design","Marketing","Sales","Finance","HR","Product","Legal"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Designation</label>
                    <input value={editForm.designation} onChange={e=>setEditForm(f=>({...f,designation:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Reporting Manager</label>
                    <input value={editForm.reporting_manager} onChange={e=>setEditForm(f=>({...f,reporting_manager:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Employment Type</label>
                    <select value={editForm.employment_type} onChange={e=>setEditForm(f=>({...f,employment_type:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      {["full-time","part-time","contract","intern"].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Shift</label>
                    <input value={editForm.shift} onChange={e=>setEditForm(f=>({...f,shift:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Work Location</label>
                    <input value={editForm.work_location} onChange={e=>setEditForm(f=>({...f,work_location:e.target.value}))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1.5 block">Joining Date</label>
                  <input type="date" value={editForm.joining_date} onChange={e=>setEditForm(f=>({...f,joining_date:e.target.value}))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>

                {/* Salary Section */}
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Salary Structure (Monthly)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Basic</label>
                      <input type="number" value={editForm.basic} onChange={e=>setEditForm(f=>({...f,basic:e.target.value}))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">HRA</label>
                      <input type="number" value={editForm.hra} onChange={e=>setEditForm(f=>({...f,hra:e.target.value}))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Special Allowance</label>
                      <input type="number" value={editForm.special_allowance} onChange={e=>setEditForm(f=>({...f,special_allowance:e.target.value}))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Annual CTC</label>
                      <input type="number" value={editForm.ctc} onChange={e=>setEditForm(f=>({...f,ctc:e.target.value}))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setShowEditModal(false)}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">
                    Cancel
                  </button>
                  <motion.button type="submit" disabled={formLoading} whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                    className="flex-1 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center justify-center gap-2 disabled:opacity-70">
                    {formLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    {formLoading ? "Saving..." : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Request Changes Modal ── */}
      <AnimatePresence>
        {showRequestChangesModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRequestChangesModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-5 text-white">
                <h3 className="text-base font-bold">Request Changes</h3>
                <p className="text-xs text-amber-100 mt-0.5">Employee will be notified via email and in-app to revise selected sections.</p>
              </div>

              <div className="p-5 space-y-4">
                {/* Section selection */}
                <div>
                  <p className="text-xs font-bold text-slate-700 mb-3">Select sections that need revision:</p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {Object.entries(sectionMeta).map(([key, label]) => {
                      const sec = sections[key];
                      const isSelected = changeSections.includes(key);
                      const isCompleted = sec?.status === "completed";
                      return (
                        <label key={key} className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected ? "border-amber-400 bg-amber-50 shadow-sm" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                        }`}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleChangeSection(key)}
                            className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                          <div className="flex-1">
                            <span className="text-xs font-semibold text-slate-700">{label}</span>
                            {isCompleted && <span className="ml-2 text-[9px] text-green-600 font-bold">Submitted</span>}
                          </div>
                          {isSelected && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Revision</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 mb-2 block">Notes to Employee</label>
                  <textarea rows={3} value={changeNotes} onChange={e => setChangeNotes(e.target.value)}
                    placeholder="e.g. PAN card image is blurry, please re-upload a clear scan. Bank IFSC code doesn't match the bank name."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 resize-none transition-all" />
                  <p className="text-[10px] text-slate-400 mt-1.5">This will be visible to the employee on their onboarding page.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <button onClick={() => setShowRequestChangesModal(false)}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                    Cancel
                  </button>
                  <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                    onClick={handleRequestChanges} disabled={changeSections.length === 0}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 disabled:opacity-40 flex items-center justify-center gap-2 transition-all">
                    <AlertCircle className="w-4 h-4" /> Send Request ({changeSections.length})
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Deactivate Employee Modal ── */}
      <AnimatePresence>
        {showDeactivateModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeactivateModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Deactivate Employee</h3>
                  <p className="text-xs text-slate-500">This is a soft delete — data is retained.</p>
                </div>
              </div>
              <p className="text-sm text-slate-700 mb-2">
                Are you sure you want to deactivate <strong>{fullName}</strong>?
              </p>
              <ul className="text-xs text-slate-500 space-y-1 mb-5 pl-4 list-disc">
                <li>Employee will be unable to login</li>
                <li>Status will be set to <strong>Inactive</strong></li>
                <li>All data is retained for records</li>
                <li>This can be reversed by updating status later</li>
              </ul>
              <div className="flex gap-3">
                <button onClick={() => setShowDeactivateModal(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50">
                  Cancel
                </button>
                <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                  onClick={handleDeactivate}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                  <XCircle className="w-4 h-4" /> Deactivate
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Edit Request Modal */}
      <AnimatePresence>
        {showRejectReqModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRejectReqModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Reject Edit Request</h3>
                <button onClick={() => setShowRejectReqModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Rejecting edit request for <strong>{sectionMeta[showRejectReqModal?.section] || showRejectReqModal?.section}</strong>
              </p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label>
                <textarea rows={3} value={rejectReqReason} onChange={e => setRejectReqReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 resize-none"
                  placeholder="Why are you rejecting this request?" />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => handleRejectEditReq(showRejectReqModal.id)}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                Confirm Rejection
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
