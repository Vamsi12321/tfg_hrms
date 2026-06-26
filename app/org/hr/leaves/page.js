"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, CheckCircle2, XCircle, Calendar, Plus, X,
  Search, Filter, Download, Eye, MessageSquare,
  Palmtree, Stethoscope, Coffee, Home, Users, AlertCircle,
  Settings, Edit, Trash2, Upload, CalendarDays,
  ArrowRight, BarChart3, Send, CreditCard, RefreshCw
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  listLeaves, getLeaveConfig, getLeaveBalance,
  approveLeave, rejectLeave, applyLeave, listEmployees,
  addLeaveType, updateLeaveType, deleteLeaveType,
  createHoliday, listHolidays, updateHoliday, deleteHoliday, importHolidaysCSV,
  adjustLeaveBalance, getBalanceHistory, forwardLeave, addLeaveComment,
  getLeaveWorkflow, createLeaveWorkflow, updateLeaveWorkflow, deleteLeaveWorkflow,
  getUtilizationReport, getBalanceReport, getMonthlyReport, getDepartmentReport, getLOPReport
} from "@/lib/api";

export default function LeavesPage() {
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [addForm, setAddForm] = useState({
    employee_id: "", leave_type_code: "", start_date: "",
    end_date: "", reason: "", is_half_day: false, half_day_type: "first_half"
  });

  // Summary counts
  const [summary, setSummary] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });

  // Leave type config management
  const [tab, setTab] = useState("requests"); // requests | config | holidays
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showEditTypeModal, setShowEditTypeModal] = useState(null);
  const [typeForm, setTypeForm] = useState({
    name: "", code: "", days_per_year: "", is_paid: true,
    carry_forward: false, max_carry_forward_days: 0, applicable_after_days: 0, description: ""
  });

  // Holiday calendar management
  const [holidays, setHolidays] = useState([]);
  const [holidayTotal, setHolidayTotal] = useState(0);
  const [holidayYear, setHolidayYear] = useState(new Date().getFullYear());
  const [holidayTypeFilter, setHolidayTypeFilter] = useState("");
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [showEditHolidayModal, setShowEditHolidayModal] = useState(null);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", state: "", type: "mandatory", description: "" });
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  // Balance adjust
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ employee_id: "", leave_type_code: "", action: "credit", days: "", reason: "" });

  // Workflow
  const [workflow, setWorkflow] = useState(null);
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({ name: "", levels: [{ level: 1, approver_type: "reporting_manager", can_skip: true }], auto_approval: { enabled: false, max_days: 0, leave_types: null } });

  // Reports
  const [reportType, setReportType] = useState("utilization");
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Forward & Comment
  const [showForwardModal, setShowForwardModal] = useState(null);
  const [forwardForm, setForwardForm] = useState({ forward_to: "", notes: "" });
  const [commentText, setCommentText] = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 4000);
  };

  // Fetch leave config (types) on mount
  useEffect(() => {
    fetchConfigOnMount();
  }, []);

  const fetchConfigOnMount = async () => {
    const res = await getLeaveConfig();
    if (res.ok && res.data) {
      setLeaveTypes(res.data.leave_types || []);
    }
  };

  // Fetch employees for the add modal
  useEffect(() => {
    async function fetchEmps() {
      const res = await listEmployees({ limit: 100 });
      if (res.ok && res.data) setEmployees(res.data.employees || []);
    }
    fetchEmps();
  }, []);

  // Fetch leave requests
  useEffect(() => {
    fetchLeaves();
  }, [page, statusFilter]);

  const fetchLeaves = async () => {
    setLoading(true);
    const params = { page, limit: 20 };
    if (statusFilter) params.status = statusFilter;
    const res = await listLeaves(params);
    if (res.ok && res.data) {
      setRequests(res.data.leaves || []);
      setTotalRequests(res.data.total || 0);
    }
    // Also get counts for summary
    const [pRes, aRes, rRes] = await Promise.all([
      listLeaves({ status: "pending", limit: 1 }),
      listLeaves({ status: "approved", limit: 1 }),
      listLeaves({ status: "rejected", limit: 1 }),
    ]);
    setSummary({
      pending: pRes.ok ? pRes.data?.total || 0 : 0,
      approved: aRes.ok ? aRes.data?.total || 0 : 0,
      rejected: rRes.ok ? rRes.data?.total || 0 : 0,
      total: totalRequests,
    });
    setLoading(false);
  };

  const handleApprove = async (id) => {
    const res = await approveLeave(id);
    if (res.ok) {
      showToast("Leave request approved");
      setShowDetailModal(null);
      fetchLeaves();
    } else { showToast(res.data?.detail || "Failed to approve", "error"); }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) { showToast("Please provide a reason", "error"); return; }
    const res = await rejectLeave(id, rejectReason);
    if (res.ok) {
      showToast("Leave request rejected");
      setShowRejectModal(null);
      setRejectReason("");
      fetchLeaves();
    } else { showToast(res.data?.detail || "Failed to reject", "error"); }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      leave_type_code: addForm.leave_type_code,
      start_date: addForm.start_date,
      end_date: addForm.end_date,
      reason: addForm.reason,
      is_half_day: addForm.is_half_day,
    };
    if (addForm.is_half_day) payload.half_day_type = addForm.half_day_type;
    // HR applies on behalf — pass employee_id
    const params = {};
    const body = { ...payload, employee_id: addForm.employee_id };
    const res = await applyLeave(body, params);
    if (res.ok) {
      showToast("Leave request submitted");
      setShowAddModal(false);
      setAddForm({ employee_id: "", leave_type_code: "", start_date: "", end_date: "", reason: "", is_half_day: false, half_day_type: "first_half" });
      fetchLeaves();
    } else { showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed to apply", "error"); }
    setFormLoading(false);
  };

  // Filter locally by search (employee name/dept)
  const filtered = requests.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (r.employee_name || "").toLowerCase().includes(s) ||
           (r.department || "").toLowerCase().includes(s);
  });

  // Leave type config handlers
  const fetchConfig = async () => {
    const res = await getLeaveConfig();
    if (res.ok && res.data) setLeaveTypes(res.data.leave_types || []);
  };

  const handleAddType = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = {
      name: typeForm.name,
      code: typeForm.code.toUpperCase(),
      days_per_year: parseInt(typeForm.days_per_year) || 0,
      is_paid: typeForm.is_paid,
      carry_forward: typeForm.carry_forward,
      max_carry_forward_days: parseInt(typeForm.max_carry_forward_days) || 0,
      applicable_after_days: parseInt(typeForm.applicable_after_days) || 0,
      description: typeForm.description,
    };
    const res = await addLeaveType(payload);
    if (res.ok) {
      showToast("Leave type added");
      setShowAddTypeModal(false);
      setTypeForm({ name: "", code: "", days_per_year: "", is_paid: true, carry_forward: false, max_carry_forward_days: 0, applicable_after_days: 0, description: "" });
      fetchConfig();
    } else { showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed to add", "error"); }
    setFormLoading(false);
  };

  const handleEditType = async (e) => {
    e.preventDefault();
    if (!showEditTypeModal) return;
    setFormLoading(true);
    const payload = {
      name: typeForm.name,
      code: typeForm.code.toUpperCase(),
      days_per_year: parseInt(typeForm.days_per_year) || 0,
      is_paid: typeForm.is_paid,
      carry_forward: typeForm.carry_forward,
      max_carry_forward_days: parseInt(typeForm.max_carry_forward_days) || 0,
      applicable_after_days: parseInt(typeForm.applicable_after_days) || 0,
      description: typeForm.description,
    };
    const res = await updateLeaveType(showEditTypeModal.id, payload);
    if (res.ok) {
      showToast("Leave type updated");
      setShowEditTypeModal(null);
      fetchConfig();
    } else { showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed to update", "error"); }
    setFormLoading(false);
  };

  const handleDeleteType = async (lt) => {
    if (!confirm(`Delete "${lt.name}"? This cannot be undone if no active requests exist.`)) return;
    const res = await deleteLeaveType(lt.id);
    if (res.ok) {
      showToast(`"${lt.name}" deleted`);
      fetchConfig();
    } else { showToast(res.data?.detail || "Cannot delete — active requests may exist. Deactivate instead.", "error"); }
  };

  // Holiday handlers
  useEffect(() => {
    if (tab === "holidays") fetchHolidays();
  }, [tab, holidayYear, holidayTypeFilter]);

  const fetchHolidays = async () => {
    const params = { year: holidayYear, limit: 100 };
    if (holidayTypeFilter) params.type = holidayTypeFilter;
    const res = await listHolidays(params);
    if (res.ok && res.data) {
      setHolidays(res.data.holidays || []);
      setHolidayTotal(res.data.total || 0);
    }
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await createHoliday(holidayForm);
    if (res.ok) {
      showToast("Holiday added");
      setShowAddHolidayModal(false);
      setHolidayForm({ name: "", date: "", state: "", type: "mandatory", description: "" });
      fetchHolidays();
    } else { showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed", "error"); }
    setFormLoading(false);
  };

  const handleEditHoliday = async (e) => {
    e.preventDefault();
    if (!showEditHolidayModal) return;
    setFormLoading(true);
    const res = await updateHoliday(showEditHolidayModal.id, holidayForm);
    if (res.ok) {
      showToast("Holiday updated");
      setShowEditHolidayModal(null);
      fetchHolidays();
    } else { showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed", "error"); }
    setFormLoading(false);
  };

  const handleDeleteHoliday = async (h) => {
    if (!confirm(`Delete "${h.name}" (${h.date})?`)) return;
    const res = await deleteHoliday(h.id);
    if (res.ok) { showToast("Holiday deleted"); fetchHolidays(); }
    else { showToast(res.data?.detail || "Failed to delete", "error"); }
  };

  const handleImportCSV = async () => {
    if (!importFile) { showToast("Select a CSV file first", "error"); return; }
    setFormLoading(true);
    const res = await importHolidaysCSV(importFile);
    if (res.ok && res.data) {
      setImportResult(res.data);
      showToast(`Imported ${res.data.imported} holidays${res.data.failed ? `, ${res.data.failed} failed` : ""}`);
      fetchHolidays();
    } else { showToast(res.data?.detail || "Import failed", "error"); }
    setFormLoading(false);
  };

  // Balance adjustment handler
  const handleAdjustBalance = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await adjustLeaveBalance({
      employee_id: adjustForm.employee_id,
      leave_type_code: adjustForm.leave_type_code,
      action: adjustForm.action,
      days: parseInt(adjustForm.days) || 1,
      reason: adjustForm.reason,
    });
    if (res.ok) {
      showToast(`Balance ${adjustForm.action}ed: ${res.data?.new_balance ?? ""} days remaining`);
      setShowAdjustModal(false);
      setAdjustForm({ employee_id: "", leave_type_code: "", action: "credit", days: "", reason: "" });
    } else { showToast(res.data?.detail?.[0]?.msg || res.data?.detail || "Failed", "error"); }
    setFormLoading(false);
  };

  // Workflow handlers
  const fetchWorkflow = async () => {
    const res = await getLeaveWorkflow();
    if (res.ok && res.data) setWorkflow(res.data);
  };

  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    const payload = { ...workflowForm, levels: workflowForm.levels.map((l, i) => ({ ...l, level: i + 1 })) };
    const res = workflow?.id
      ? await updateLeaveWorkflow(workflow.id, payload)
      : await createLeaveWorkflow(payload);
    if (res.ok) {
      showToast(workflow?.id ? "Workflow updated" : "Workflow created");
      setShowWorkflowForm(false);
      fetchWorkflow();
    } else { showToast(res.data?.detail || "Failed", "error"); }
    setFormLoading(false);
  };

  // Report handler
  const fetchReport = async (type) => {
    setReportLoading(true);
    setReportType(type);
    let res;
    switch (type) {
      case "utilization": res = await getUtilizationReport(); break;
      case "balance": res = await getBalanceReport(); break;
      case "monthly": res = await getMonthlyReport(); break;
      case "department": res = await getDepartmentReport(); break;
      case "lop": res = await getLOPReport(); break;
      default: res = await getUtilizationReport();
    }
    if (res.ok && res.data) setReportData(res.data);
    else setReportData(null);
    setReportLoading(false);
  };

  // Forward handler
  const handleForward = async () => {
    if (!showForwardModal || !forwardForm.forward_to) { showToast("Select a user to forward to", "error"); return; }
    setFormLoading(true);
    const res = await forwardLeave(showForwardModal.id, forwardForm);
    if (res.ok) {
      showToast("Leave forwarded");
      setShowForwardModal(null);
      setForwardForm({ forward_to: "", notes: "" });
      fetchLeaves();
    } else { showToast(res.data?.detail || "Failed to forward", "error"); }
    setFormLoading(false);
  };

  // Comment handler
  const handleAddComment = async (leaveId) => {
    if (!commentText.trim()) return;
    const res = await addLeaveComment(leaveId, commentText);
    if (res.ok) {
      showToast("Comment added");
      setCommentText("");
      // Refresh detail modal data
      if (showDetailModal?.id === leaveId) {
        setShowDetailModal(res.data || { ...showDetailModal, comments: [...(showDetailModal.comments || []), { comment: commentText, created_at: new Date().toISOString() }] });
      }
    } else { showToast(res.data?.detail || "Failed", "error"); }
  };

  const statusCfg = {
    pending:   { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Pending" },
    approved:  { cls: "bg-green-50 text-green-600 border-green-200", label: "Approved" },
    rejected:  { cls: "bg-red-50 text-red-600 border-red-200", label: "Rejected" },
    cancelled: { cls: "bg-slate-50 text-slate-500 border-slate-200", label: "Cancelled" },
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Leave Management" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Pending", value: summary.pending, color: "amber" },
            { label: "Approved", value: summary.approved, color: "green" },
            { label: "Rejected", value: summary.rejected, color: "red" },
            { label: "Total", value: totalRequests, color: "blue" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setStatusFilter(s.label === "Total" ? "" : s.label.toLowerCase())}>
              <p className={`text-2xl font-black text-${s.color}-600`}>{s.value}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tabs: Requests | Configuration | Holidays | Workflow | Reports */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 w-fit shadow-sm overflow-x-auto">
          {[
            { key: "requests", label: "Requests", icon: Clock },
            { key: "config", label: "Leave Types", icon: Settings },
            { key: "holidays", label: "Holidays", icon: CalendarDays },
            { key: "workflow", label: "Workflow", icon: ArrowRight },
            { key: "reports", label: "Reports", icon: BarChart3 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { setTab(t.key); if (t.key === "workflow") fetchWorkflow(); if (t.key === "reports") fetchReport(reportType); }}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${tab === t.key ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Configuration Tab */}
        {tab === "config" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Leave Types Configuration</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Add, edit, or remove leave types for your organization</p>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setTypeForm({ name: "", code: "", days_per_year: "", is_paid: true, carry_forward: false, max_carry_forward_days: 0, applicable_after_days: 0, description: "" }); setShowAddTypeModal(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20">
                <Plus className="w-3.5 h-3.5" /> Add Leave Type
              </motion.button>
            </div>
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  {["Code", "Name", "Days/Year", "Paid", "Carry Forward", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveTypes.map((lt, i) => (
                  <tr key={lt.id || i} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">{lt.code}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-800">{lt.name}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{lt.days_per_year === -1 ? "Unlimited" : lt.days_per_year}</td>
                    <td className="px-4 py-3 text-xs">{lt.is_paid !== false ? <span className="text-green-600">Yes</span> : <span className="text-slate-400">No</span>}</td>
                    <td className="px-4 py-3 text-xs">
                      {lt.carry_forward ? <span className="text-blue-600">Yes ({lt.max_carry_forward_days}d max)</span> : <span className="text-slate-400">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${lt.is_active !== false ? "bg-green-50 text-green-600 border-green-200" : "bg-slate-50 text-slate-400 border-slate-200"}`}>
                        {lt.is_active !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setTypeForm({ name: lt.name, code: lt.code, days_per_year: lt.days_per_year, is_paid: lt.is_paid !== false, carry_forward: !!lt.carry_forward, max_carry_forward_days: lt.max_carry_forward_days || 0, applicable_after_days: lt.applicable_after_days || 0, description: lt.description || "" }); setShowEditTypeModal(lt); }}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                          <Edit className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        <button onClick={() => handleDeleteType(lt)}
                          className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

        {/* Holiday Calendar Tab */}
        {tab === "holidays" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Holiday Calendar</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{holidayTotal} holidays for {holidayYear}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select value={holidayYear} onChange={e => setHolidayYear(parseInt(e.target.value))}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none">
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select value={holidayTypeFilter} onChange={e => setHolidayTypeFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none">
                  <option value="">All Types</option>
                  <option value="mandatory">Mandatory</option>
                  <option value="optional">Optional</option>
                </select>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">
                  <Upload className="w-3.5 h-3.5" /> Import CSV
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { setHolidayForm({ name: "", date: "", state: "", type: "mandatory", description: "" }); setShowAddHolidayModal(true); }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20">
                  <Plus className="w-3.5 h-3.5" /> Add Holiday
                </motion.button>
              </div>
            </div>
            {holidays.length === 0 ? (
              <div className="p-12 text-center">
                <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No holidays found for {holidayYear}</p>
                <p className="text-xs text-slate-400 mt-1">Add holidays or import from CSV.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    {["Date", "Holiday", "State/Region", "Type", "Description", "Actions"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h, i) => (
                    <tr key={h.id || i} className="border-t border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold text-slate-800">{h.date}</span>
                        <p className="text-[10px] text-slate-400">{new Date(h.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</p>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-800">{h.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{h.state || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${h.type === "mandatory" ? "bg-red-50 text-red-600 border-red-200" : "bg-blue-50 text-blue-600 border-blue-200"}`}>
                          {h.type === "mandatory" ? "Mandatory" : "Optional"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate">{h.description || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => { setHolidayForm({ name: h.name, date: h.date, state: h.state || "", type: h.type || "mandatory", description: h.description || "" }); setShowEditHolidayModal(h); }}
                            className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 flex items-center justify-center">
                            <Edit className="w-3.5 h-3.5 text-blue-600" />
                          </button>
                          <button onClick={() => handleDeleteHoliday(h)}
                            className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        )}

        {/* Workflow Tab */}
        {tab === "workflow" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Approval Workflow</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Configure leave approval levels</p>
              </div>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { if (workflow) setWorkflowForm({ name: workflow.name || "", levels: workflow.levels || [{ level: 1, approver_type: "reporting_manager", can_skip: true }], auto_approval: workflow.auto_approval || { enabled: false, max_days: 0, leave_types: null } }); setShowWorkflowForm(true); }}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
                <Edit className="w-3.5 h-3.5" /> {workflow ? "Edit Workflow" : "Create Workflow"}
              </motion.button>
            </div>
            <div className="p-5">
              {!workflow ? (
                <div className="text-center py-8">
                  <ArrowRight className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No workflow configured. Using default: Employee → HR Admin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs font-bold text-slate-700">{workflow.name}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${workflow.is_active ? "bg-green-50 text-green-600 border border-green-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                      {workflow.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">Employee</div>
                    {(workflow.levels || []).map((lvl, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <ArrowRight className="w-4 h-4 text-slate-300" />
                        <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                          Level {lvl.level}: <span className="font-bold capitalize">{lvl.approver_type?.replace("_", " ")}</span>
                          {lvl.can_skip && <span className="text-[9px] text-slate-400 ml-1">(skippable)</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {workflow.auto_approval?.enabled && (
                    <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700">
                      Auto-approval enabled for leaves ≤ {workflow.auto_approval.max_days} day(s)
                      {workflow.auto_approval.leave_types && <span> • Types: {workflow.auto_approval.leave_types.join(", ")}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Reports Tab */}
        {tab === "reports" && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "utilization", label: "Utilization" },
                { key: "monthly", label: "Monthly" },
                { key: "department", label: "Department" },
                { key: "lop", label: "LOP" },
              ].map(r => (
                <button key={r.key} onClick={() => fetchReport(r.key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${reportType === r.key ? "bg-brand-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {reportLoading ? (
                <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
              ) : !reportData ? (
                <div className="p-12 text-center"><BarChart3 className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">Select a report type</p></div>
              ) : (
                <div className="p-5">
                  {reportType === "utilization" && reportData.utilization && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">{reportData.total_employees} employees • {reportData.year}</p>
                      <table className="w-full"><thead><tr className="bg-slate-50/80">
                        {["Type", "Entitlement", "Used", "Utilization %", "Requests"].map(h => <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2">{h}</th>)}
                      </tr></thead><tbody>
                        {reportData.utilization.map((u, i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{u.leave_type_name} ({u.leave_type_code})</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{u.total_entitlement}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{u.total_used}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-brand-600">{u.utilization_percentage?.toFixed(1)}%</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{u.request_count}</td>
                          </tr>
                        ))}
                      </tbody></table>
                    </div>
                  )}
                  {reportType === "monthly" && reportData.breakdown && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">{reportData.year}/{reportData.month} • {reportData.total_days} days • {reportData.total_requests} requests</p>
                      <table className="w-full"><thead><tr className="bg-slate-50/80">
                        {["Type", "Days", "Requests", "Employees"].map(h => <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2">{h}</th>)}
                      </tr></thead><tbody>
                        {reportData.breakdown.map((b, i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{b.leave_type_code}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{b.total_days}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{b.request_count}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{b.unique_employees}</td>
                          </tr>
                        ))}
                      </tbody></table>
                    </div>
                  )}
                  {reportType === "department" && reportData.departments && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">{reportData.year}</p>
                      <table className="w-full"><thead><tr className="bg-slate-50/80">
                        {["Department", "Total Days", "Requests", "Employees", "Avg/Employee"].map(h => <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2">{h}</th>)}
                      </tr></thead><tbody>
                        {reportData.departments.map((d, i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{d.department}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{d.total_days}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{d.request_count}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{d.unique_employees_on_leave}/{d.total_employees}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-brand-600">{d.avg_days_per_employee?.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody></table>
                    </div>
                  )}
                  {reportType === "lop" && reportData.employees && (
                    <div>
                      <p className="text-xs text-slate-500 mb-3">{reportData.total_lop_days} LOP days • {reportData.total_employees_with_lop} employees</p>
                      <table className="w-full"><thead><tr className="bg-slate-50/80">
                        {["Employee", "Department", "LOP Days", "Count"].map(h => <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2">{h}</th>)}
                      </tr></thead><tbody>
                        {reportData.employees.map((e, i) => (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{e.employee_name}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{e.department}</td>
                            <td className="px-4 py-2.5 text-xs font-bold text-red-600">{e.total_lop_days}</td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">{e.lop_count}</td>
                          </tr>
                        ))}
                      </tbody></table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Requests Tab content */}
        {tab === "requests" && (
          <>
        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900">Leave Requests</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search employee..."
                  className="bg-transparent text-xs outline-none w-32 text-slate-700" />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 outline-none">
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-500/20">
                <Plus className="w-3.5 h-3.5" /> Add Request
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setShowAdjustModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50">
                <CreditCard className="w-3.5 h-3.5" /> Adjust Balance
              </motion.button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-400">No leave requests found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    {["Employee", "Leave Type", "Duration", "Days", "Applied On", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, i) => {
                    const sc = statusCfg[req.status] || statusCfg.pending;
                    return (
                      <motion.tr key={req.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white text-[10px] font-bold">
                              {(req.employee_name || "?").split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">{req.employee_name}</p>
                              <p className="text-[10px] text-slate-400">{req.department}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-700 font-medium">{req.leave_type_name || req.leave_type_code}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{req.start_date} → {req.end_date}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-full">
                            {req.days}{req.is_half_day ? " (½)" : "d"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{req.applied_at ? new Date(req.applied_at).toLocaleDateString() : "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setShowDetailModal(req)} className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 flex items-center justify-center">
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                            </button>
                            {req.status === "pending" && (
                              <>
                                <button onClick={() => handleApprove(req.id)}
                                  className="w-7 h-7 rounded-lg bg-green-50 hover:bg-green-100 flex items-center justify-center">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                </button>
                                <button onClick={() => setShowRejectModal(req)}
                                  className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center">
                                  <XCircle className="w-3.5 h-3.5 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Leave Request Detail</h3>
                <button onClick={() => setShowDetailModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3 mb-5">
                {[
                  ["Employee", showDetailModal.employee_name],
                  ["Department", showDetailModal.department],
                  ["Leave Type", showDetailModal.leave_type_name || showDetailModal.leave_type_code],
                  ["Duration", `${showDetailModal.start_date} → ${showDetailModal.end_date} (${showDetailModal.days} day${showDetailModal.days > 1 ? "s" : ""}${showDetailModal.is_half_day ? ", half day" : ""})`],
                  ["Applied On", showDetailModal.applied_at ? new Date(showDetailModal.applied_at).toLocaleDateString() : "—"],
                  ["Reason", showDetailModal.reason],
                  ...(showDetailModal.rejection_reason ? [["Rejection Reason", showDetailModal.rejection_reason]] : []),
                  ...(showDetailModal.approved_by_name ? [["Approved By", showDetailModal.approved_by_name]] : []),
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                    <span className="text-[10px] font-bold text-slate-400 uppercase w-24 flex-shrink-0 mt-0.5">{k}</span>
                    <span className="text-sm text-slate-800 font-medium">{v || "—"}</span>
                  </div>
                ))}
              </div>
              {showDetailModal.status === "pending" && (
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleApprove(showDetailModal.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { setShowRejectModal(showDetailModal); setShowDetailModal(null); }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </motion.button>
                </div>
              )}
              {showDetailModal.status === "pending" && (
                <button onClick={() => { setShowForwardModal(showDetailModal); setShowDetailModal(null); }}
                  className="w-full mt-2 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2">
                  <Send className="w-3.5 h-3.5" /> Forward to Another Approver
                </button>
              )}
              {/* Comments section */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Comments</p>
                {(showDetailModal.comments || []).length > 0 ? (
                  <div className="space-y-2 mb-3 max-h-32 overflow-y-auto">
                    {showDetailModal.comments.map((c, i) => (
                      <div key={i} className="p-2 rounded-lg bg-slate-50 text-xs text-slate-700">
                        {typeof c === "string" ? c : c.comment}
                        {c.created_at && <span className="text-[9px] text-slate-400 ml-2">{new Date(c.created_at).toLocaleDateString()}</span>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[10px] text-slate-400 mb-2">No comments yet</p>}
                <div className="flex gap-2">
                  <input value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-brand-400" />
                  <button onClick={() => handleAddComment(showDetailModal.id)}
                    className="px-3 py-2 bg-brand-50 border border-brand-200 rounded-lg text-[10px] font-bold text-brand-600 hover:bg-brand-100">Send</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Reason Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRejectModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Reject Leave Request</h3>
                <button onClick={() => setShowRejectModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Rejecting <strong>{showRejectModal?.employee_name}</strong>&apos;s {showRejectModal?.leave_type_name || showRejectModal?.leave_type_code}
              </p>
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason for rejection *</label>
                <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 resize-none"
                  placeholder="Provide a reason..." />
              </div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => handleReject(showRejectModal.id)}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                Confirm Rejection
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Leave Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add Leave Request</h3>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={addForm.employee_id} onChange={e => setAddForm(f => ({ ...f, employee_id: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>
                        {emp.first_name} {emp.last_name} — {emp.department}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type *</label>
                  <select value={addForm.leave_type_code} onChange={e => setAddForm(f => ({ ...f, leave_type_code: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                    <option value="">Select leave type...</option>
                    {leaveTypes.filter(lt => lt.is_active !== false).map(lt => (
                      <option key={lt.code} value={lt.code}>{lt.name} ({lt.code})</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">From *</label>
                    <input type="date" value={addForm.start_date} onChange={e => setAddForm(f => ({ ...f, start_date: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">To *</label>
                    <input type="date" value={addForm.end_date} onChange={e => setAddForm(f => ({ ...f, end_date: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={addForm.is_half_day}
                      onChange={e => setAddForm(f => ({ ...f, is_half_day: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                    <span className="text-xs font-medium text-slate-700">Half Day</span>
                  </label>
                  {addForm.is_half_day && (
                    <select value={addForm.half_day_type} onChange={e => setAddForm(f => ({ ...f, half_day_type: e.target.value }))}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none">
                      <option value="first_half">First Half</option>
                      <option value="second_half">Second Half</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label>
                  <textarea rows={3} value={addForm.reason} onChange={e => setAddForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                    placeholder="Reason for leave..." required />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Submitting..." : "Submit Request"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Balance Adjust Modal */}
      <AnimatePresence>
        {showAdjustModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAdjustModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Adjust Leave Balance</h3>
                <button onClick={() => setShowAdjustModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAdjustBalance} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={adjustForm.employee_id} onChange={e => setAdjustForm(f => ({ ...f, employee_id: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                    <option value="">Select employee...</option>
                    {employees.map(emp => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>{emp.first_name} {emp.last_name} — {emp.department}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Leave Type *</label>
                    <select value={adjustForm.leave_type_code} onChange={e => setAdjustForm(f => ({ ...f, leave_type_code: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                      <option value="">Select...</option>
                      {leaveTypes.filter(lt => lt.is_active !== false).map(lt => (
                        <option key={lt.code} value={lt.code}>{lt.name} ({lt.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Action *</label>
                    <select value={adjustForm.action} onChange={e => setAdjustForm(f => ({ ...f, action: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="credit">Credit (Add)</option>
                      <option value="deduct">Deduct (Remove)</option>
                      <option value="reset">Reset to Default</option>
                    </select>
                  </div>
                </div>
                {adjustForm.action !== "reset" && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Days *</label>
                    <input type="number" min="1" value={adjustForm.days} onChange={e => setAdjustForm(f => ({ ...f, days: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required placeholder="2" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label>
                  <textarea rows={2} value={adjustForm.reason} onChange={e => setAdjustForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" required
                    placeholder="e.g. Comp off for weekend work" />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Processing..." : `${adjustForm.action === "credit" ? "Credit" : adjustForm.action === "deduct" ? "Deduct" : "Reset"} Balance`}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forward Leave Modal */}
      <AnimatePresence>
        {showForwardModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowForwardModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Forward Leave Request</h3>
                <button onClick={() => setShowForwardModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Forward <strong>{showForwardModal?.employee_name}</strong>&apos;s leave to another approver.</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Forward To *</label>
                  <select value={forwardForm.forward_to} onChange={e => setForwardForm(f => ({ ...f, forward_to: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" required>
                    <option value="">Select approver...</option>
                    {employees.map(emp => (
                      <option key={emp.id || emp._id} value={emp.id || emp._id}>{emp.first_name} {emp.last_name} — {emp.designation}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Notes</label>
                  <textarea rows={2} value={forwardForm.notes} onChange={e => setForwardForm(f => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                    placeholder="Optional notes for the approver..." />
                </div>
                <motion.button type="button" disabled={formLoading} onClick={handleForward} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Forwarding..." : "Forward Request"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Workflow Form Modal */}
      <AnimatePresence>
        {showWorkflowForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowWorkflowForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{workflow?.id ? "Edit" : "Create"} Approval Workflow</h3>
                <button onClick={() => setShowWorkflowForm(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleSaveWorkflow} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Workflow Name *</label>
                  <input value={workflowForm.name} onChange={e => setWorkflowForm(f => ({ ...f, name: e.target.value }))} required placeholder="Standard 2-Level Approval"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-2">Approval Levels</p>
                  {workflowForm.levels.map((lvl, i) => (
                    <div key={i} className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 w-6">L{i + 1}</span>
                      <select value={lvl.approver_type} onChange={e => { const n = [...workflowForm.levels]; n[i].approver_type = e.target.value; setWorkflowForm(f => ({ ...f, levels: n })); }}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-brand-400">
                        <option value="reporting_manager">Reporting Manager</option>
                        <option value="hr_admin">HR Admin</option>
                        <option value="org_admin">Org Admin</option>
                        <option value="specific_user">Specific User</option>
                      </select>
                      <label className="flex items-center gap-1 text-[10px] text-slate-500">
                        <input type="checkbox" checked={lvl.can_skip} onChange={e => { const n = [...workflowForm.levels]; n[i].can_skip = e.target.checked; setWorkflowForm(f => ({ ...f, levels: n })); }}
                          className="w-3 h-3 rounded" /> Skip
                      </label>
                      {i > 0 && <button type="button" onClick={() => setWorkflowForm(f => ({ ...f, levels: f.levels.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600 text-xs">✕</button>}
                    </div>
                  ))}
                  <button type="button" onClick={() => setWorkflowForm(f => ({ ...f, levels: [...f.levels, { level: f.levels.length + 1, approver_type: "hr_admin", can_skip: false }] }))}
                    className="text-[10px] font-bold text-brand-600 hover:underline">+ Add Level</button>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={workflowForm.auto_approval.enabled}
                      onChange={e => setWorkflowForm(f => ({ ...f, auto_approval: { ...f.auto_approval, enabled: e.target.checked } }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                    Enable auto-approval for short leaves
                  </label>
                  {workflowForm.auto_approval.enabled && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">Auto-approve leaves ≤</span>
                      <input type="number" min="1" max="5" value={workflowForm.auto_approval.max_days}
                        onChange={e => setWorkflowForm(f => ({ ...f, auto_approval: { ...f.auto_approval, max_days: parseInt(e.target.value) || 0 } }))}
                        className="w-14 px-2 py-1 rounded-lg border border-slate-200 text-xs text-center" />
                      <span className="text-[10px] text-slate-500">day(s)</span>
                    </div>
                  )}
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Saving..." : "Save Workflow"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Holiday Modal */}
      <AnimatePresence>
        {showAddHolidayModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddHolidayModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add Holiday</h3>
                <button onClick={() => setShowAddHolidayModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddHoliday} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Holiday Name *</label>
                  <input value={holidayForm.name} onChange={e => setHolidayForm(f => ({ ...f, name: e.target.value }))} required placeholder="Republic Day"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date *</label>
                    <input type="date" value={holidayForm.date} onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                    <select value={holidayForm.type} onChange={e => setHolidayForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="mandatory">Mandatory</option>
                      <option value="optional">Optional</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">State/Region</label>
                  <input value={holidayForm.state} onChange={e => setHolidayForm(f => ({ ...f, state: e.target.value }))} placeholder="All India / Telangana"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={holidayForm.description} onChange={e => setHolidayForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" placeholder="Optional description..." />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Adding..." : "Add Holiday"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Holiday Modal */}
      <AnimatePresence>
        {showEditHolidayModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditHolidayModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Edit Holiday</h3>
                <button onClick={() => setShowEditHolidayModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleEditHoliday} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Holiday Name</label>
                  <input value={holidayForm.name} onChange={e => setHolidayForm(f => ({ ...f, name: e.target.value }))} placeholder="Holiday name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date</label>
                    <input type="date" value={holidayForm.date} onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                    <select value={holidayForm.type} onChange={e => setHolidayForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="mandatory">Mandatory</option>
                      <option value="optional">Optional</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">State/Region</label>
                  <input value={holidayForm.state} onChange={e => setHolidayForm(f => ({ ...f, state: e.target.value }))} placeholder="All India / Telangana"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={holidayForm.description} onChange={e => setHolidayForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" placeholder="Optional description..." />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Saving..." : "Save Changes"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import CSV Modal */}
      <AnimatePresence>
        {showImportModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Import Holidays from CSV</h3>
                <button onClick={() => { setShowImportModal(false); setImportResult(null); setImportFile(null); }} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">CSV Format:</p>
                  <code className="text-[10px] text-slate-500 block leading-relaxed">name,date,state,type,description<br/>Republic Day,2025-01-26,All India,mandatory,National holiday<br/>Holi,2025-03-14,All India,mandatory,Festival of colors</code>
                </div>
                <button type="button" onClick={() => {
                  const csv = `name,date,state,type,description\nRepublic Day,2025-01-26,All India,mandatory,National holiday\nHoli,2025-03-14,All India,mandatory,Festival of colors\nUgadi,2025-03-30,Telangana,optional,Telugu New Year\nEid ul-Fitr,2025-03-31,All India,optional,End of Ramadan\nIndependence Day,2025-08-15,All India,mandatory,National holiday\nGanesh Chaturthi,2025-08-27,Telangana,optional,Festival\nDussehra,2025-10-02,All India,mandatory,Victory of good over evil\nDiwali,2025-10-20,All India,mandatory,Festival of lights\nChristmas,2025-12-25,All India,mandatory,Christmas Day`;
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a"); a.href = url; a.download = "holidays_template.csv"; a.click(); URL.revokeObjectURL(url);
                }}
                  className="w-full py-2.5 border border-brand-200 bg-brand-50 text-brand-700 rounded-xl text-xs font-bold hover:bg-brand-100 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Download Sample CSV Template
                </button>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Select CSV File *</label>
                  <input type="file" accept=".csv" onChange={e => setImportFile(e.target.files[0])}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600 hover:file:bg-brand-100" />
                </div>
                {importResult && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                    <p className="text-xs font-bold text-green-700">Imported: {importResult.imported} | Failed: {importResult.failed}</p>
                    {importResult.errors?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {importResult.errors.map((err, i) => (
                          <p key={i} className="text-[10px] text-red-600">Row {err.row}: {err.name} — {err.error}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <motion.button type="button" disabled={formLoading || !importFile} onClick={handleImportCSV}
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Importing..." : "Upload & Import"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Leave Type Modal */}
      <AnimatePresence>
        {showAddTypeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddTypeModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Add Leave Type</h3>
                <button onClick={() => setShowAddTypeModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleAddType} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name *</label>
                    <input value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} required placeholder="Work From Home"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Code *</label>
                    <input value={typeForm.code} onChange={e => setTypeForm(f => ({ ...f, code: e.target.value }))} required placeholder="WFH"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Days/Year *</label>
                    <input type="number" value={typeForm.days_per_year} onChange={e => setTypeForm(f => ({ ...f, days_per_year: e.target.value }))} required placeholder="12 (-1 for unlimited)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Available After (days)</label>
                    <input type="number" value={typeForm.applicable_after_days} onChange={e => setTypeForm(f => ({ ...f, applicable_after_days: e.target.value }))} placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={typeForm.is_paid} onChange={e => setTypeForm(f => ({ ...f, is_paid: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                    <span className="text-xs font-medium text-slate-700">Paid Leave</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={typeForm.carry_forward} onChange={e => setTypeForm(f => ({ ...f, carry_forward: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                    <span className="text-xs font-medium text-slate-700">Carry Forward</span>
                  </label>
                </div>
                {typeForm.carry_forward && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Max Carry Forward Days</label>
                    <input type="number" value={typeForm.max_carry_forward_days} onChange={e => setTypeForm(f => ({ ...f, max_carry_forward_days: e.target.value }))} placeholder="5"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" placeholder="Optional description..." />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Adding..." : "Add Leave Type"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Leave Type Modal */}
      <AnimatePresence>
        {showEditTypeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowEditTypeModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Edit Leave Type</h3>
                <button onClick={() => setShowEditTypeModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleEditType} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Name</label>
                    <input value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} placeholder="Leave name"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Code</label>
                    <input value={typeForm.code} onChange={e => setTypeForm(f => ({ ...f, code: e.target.value }))} placeholder="CODE"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 uppercase" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Days/Year</label>
                    <input type="number" value={typeForm.days_per_year} onChange={e => setTypeForm(f => ({ ...f, days_per_year: e.target.value }))} placeholder="12"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Available After (days)</label>
                    <input type="number" value={typeForm.applicable_after_days} onChange={e => setTypeForm(f => ({ ...f, applicable_after_days: e.target.value }))} placeholder="0"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={typeForm.is_paid} onChange={e => setTypeForm(f => ({ ...f, is_paid: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                    <span className="text-xs font-medium text-slate-700">Paid Leave</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={typeForm.carry_forward} onChange={e => setTypeForm(f => ({ ...f, carry_forward: e.target.checked }))}
                      className="w-4 h-4 rounded border-slate-300 text-brand-600" />
                    <span className="text-xs font-medium text-slate-700">Carry Forward</span>
                  </label>
                </div>
                {typeForm.carry_forward && (
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Max Carry Forward Days</label>
                    <input type="number" value={typeForm.max_carry_forward_days} onChange={e => setTypeForm(f => ({ ...f, max_carry_forward_days: e.target.value }))} placeholder="5"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                  <textarea rows={2} value={typeForm.description} onChange={e => setTypeForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" placeholder="Optional description..." />
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Saving..." : "Save Changes"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
