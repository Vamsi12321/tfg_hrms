"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Users, CheckCircle2, XCircle, AlertCircle, X,
  Plus, Search, Calendar, Settings, BarChart3, Edit, Trash2,
  ChevronRight, Eye
} from "lucide-react";
import TopBar from "@/components/TopBar";
import LocationPicker from "@/components/LocationPicker";
import {
  listOfficeLocations, createOfficeLocation, updateOfficeLocation, deleteOfficeLocation,
  listAttendanceRecords, getAttendanceSummary, markAttendance, editAttendanceRecord,
  listRegularizations, approveRegularization, rejectRegularization,
  getAttendanceConfig, updateAttendanceConfig,
  getDailyAttendanceReport, getMonthlyAttendanceReport, listEmployees
} from "@/lib/api";

export default function HRAttendancePage() {
  const [tab, setTab] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Locations
  const [locations, setLocations] = useState([]);
  const [showLocModal, setShowLocModal] = useState(false);
  const [editLoc, setEditLoc] = useState(null);
  const [locForm, setLocForm] = useState({ name: "", address: "", latitude: "", longitude: "", radius_meters: 200, is_active: true });
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);

  // Daily
  const [dailyReport, setDailyReport] = useState(null);
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split("T")[0]);

  // Records
  const [records, setRecords] = useState([]);
  const [recordsTotal, setRecordsTotal] = useState(0);

  // Summary
  const [summary, setSummary] = useState([]);
  const [summaryMonth, setSummaryMonth] = useState(new Date().getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());

  // Regularizations
  const [regs, setRegs] = useState([]);
  const [showRejectRegModal, setShowRejectRegModal] = useState(null);
  const [rejectRegReason, setRejectRegReason] = useState("");

  // Config
  const [config, setConfig] = useState(null);

  // Mark attendance
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markForm, setMarkForm] = useState({ employee_id: "", date: "", status: "present", check_in: "09:00", check_out: "18:00", reason: "" });
  const [employees, setEmployees] = useState([]);

  // Monthly report
  const [monthlyReport, setMonthlyReport] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), type === "error" ? 6000 : 4000); };

  useEffect(() => { fetchLocations(); fetchEmployees(); }, []);
  useEffect(() => {
    if (tab === "daily") fetchDaily();
    if (tab === "summary") fetchSummary();
    if (tab === "regularizations") fetchRegs();
    if (tab === "config") fetchConfig();
    if (tab === "reports") fetchMonthlyReport();
  }, [tab, dailyDate, summaryMonth, summaryYear]);

  const fetchLocations = async () => { const res = await listOfficeLocations(); if (res.ok && res.data) setLocations(res.data.locations || res.data || []); };
  const fetchEmployees = async () => { const res = await listEmployees({ limit: 100 }); if (res.ok && res.data) setEmployees(res.data.employees || []); };
  const fetchDaily = async () => { setLoading(true); const res = await getDailyAttendanceReport({ date: dailyDate }); if (res.ok && res.data) setDailyReport(res.data); setLoading(false); };
  const fetchSummary = async () => { setLoading(true); const res = await getAttendanceSummary({ month: summaryMonth, year: summaryYear }); if (res.ok && res.data) setSummary(res.data.summary || []); setLoading(false); };
  const fetchRegs = async () => { setLoading(true); const res = await listRegularizations({}); if (res.ok && res.data) setRegs(res.data.regularizations || res.data.requests || []); setLoading(false); };
  const fetchConfig = async () => { const res = await getAttendanceConfig(); if (res.ok && res.data) setConfig(res.data); };
  const fetchMonthlyReport = async () => { setLoading(true); const res = await getMonthlyAttendanceReport({ month: summaryMonth, year: summaryYear }); if (res.ok && res.data) setMonthlyReport(res.data); setLoading(false); };

  // Location handlers
  const handleSaveLoc = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const payload = { ...locForm, latitude: parseFloat(locForm.latitude), longitude: parseFloat(locForm.longitude), radius_meters: parseInt(locForm.radius_meters) };
    const res = editLoc ? await updateOfficeLocation(editLoc.id, payload) : await createOfficeLocation(payload);
    if (res.ok) { showToast(editLoc ? "Location updated" : "Location added"); setShowLocModal(false); setEditLoc(null); fetchLocations(); }
    else { showToast(res.data?.detail || "Failed", "error"); }
    setFormLoading(false);
  };
  const handleDeleteLoc = async (loc) => { if (!confirm(`Delete "${loc.name}"?`)) return; const res = await deleteOfficeLocation(loc.id); if (res.ok) { showToast("Deleted"); fetchLocations(); } else showToast("Failed", "error"); };

  // Regularization handlers
  const handleApproveReg = async (id) => { const res = await approveRegularization(id); if (res.ok) { showToast("Approved"); fetchRegs(); } else showToast(res.data?.detail || "Failed", "error"); };
  const handleRejectReg = async () => {
    if (!rejectRegReason.trim()) { showToast("Provide a reason", "error"); return; }
    const res = await rejectRegularization(showRejectRegModal.id, rejectRegReason);
    if (res.ok) { showToast("Rejected"); setShowRejectRegModal(null); setRejectRegReason(""); fetchRegs(); }
    else showToast(res.data?.detail || "Failed", "error");
  };

  // Mark attendance
  const handleMark = async (e) => {
    e.preventDefault(); setFormLoading(true);
    const res = await markAttendance(markForm);
    if (res.ok) { showToast("Attendance marked"); setShowMarkModal(false); fetchDaily(); }
    else { showToast(res.data?.detail || "Failed", "error"); }
    setFormLoading(false);
  };

  // Config save
  const handleSaveConfig = async (e) => {
    e.preventDefault(); setFormLoading(true);
    // Strip organization_id from body — only send editable fields
    const { organization_id, ...configData } = config;
    const res = await updateAttendanceConfig(configData);
    if (res.ok) { showToast("Config saved"); } else showToast(typeof res.data?.detail === "string" ? res.data.detail : "Failed to save config", "error");
    setFormLoading(false);
  };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Attendance Management" />
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-start gap-2 max-w-md ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1.5 w-fit shadow-sm overflow-x-auto">
          {[
            { key: "daily", label: "Daily View", icon: Calendar },
            { key: "summary", label: "Summary", icon: BarChart3 },
            { key: "locations", label: "Locations", icon: MapPin },
            { key: "regularizations", label: "Regularizations", icon: Clock },
            { key: "config", label: "Config", icon: Settings },
            { key: "reports", label: "Reports", icon: BarChart3 },
          ].map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${tab === t.key ? "bg-brand-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        {/* DAILY VIEW */}
        {tab === "daily" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowMarkModal(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
                <Plus className="w-3.5 h-3.5" /> Mark Attendance
              </motion.button>
            </div>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> :
            dailyReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-green-600">{dailyReport.present_count || 0}</p><p className="text-xs text-slate-500">Present</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-red-500">{dailyReport.absent_count || 0}</p><p className="text-xs text-slate-500">Absent</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-amber-600">{dailyReport.late_count || (dailyReport.present || []).filter(p => p.is_late).length}</p><p className="text-xs text-slate-500">Late</p>
                  </div>
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
                    <p className="text-2xl font-black text-blue-600">{dailyReport.total_employees || 0}</p><p className="text-xs text-slate-500">Total</p>
                  </div>
                </div>
                {(dailyReport.present || []).length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100"><h3 className="text-sm font-bold text-slate-900">Present — {dailyDate}</h3></div>
                    <table className="w-full"><thead><tr className="bg-slate-50/80">
                      {["Employee", "Check In", "Check Out", "Hours", "Status", "Location", "Photos"].map(h => <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2.5">{h}</th>)}
                    </tr></thead><tbody>
                      {(dailyReport.present || []).map((p, i) => (
                        <tr key={i} className="border-t border-slate-50">
                          <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{p.employee_name || p.name}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{p.check_in ? new Date(p.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                          <td className="px-4 py-2.5 text-xs text-slate-600">{p.check_out ? new Date(p.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                          <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{p.total_hours ? `${p.total_hours.toFixed(1)}h` : "—"}</td>
                          <td className="px-4 py-2.5"><span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${p.is_late ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}`}>{p.is_late ? "Late" : p.status || "Present"}</span></td>
                          <td className="px-4 py-2.5 text-[10px] text-slate-500">{p.check_in_location?.matched_office || "—"}</td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              {p.check_in_photo && <img src={p.check_in_photo} alt="In" onClick={() => setEnlargedPhoto(p.check_in_photo)} className="w-8 h-8 rounded-lg object-cover border border-green-200 hover:ring-2 hover:ring-brand-400 cursor-pointer" />}
                              {p.check_out_photo && <img src={p.check_out_photo} alt="Out" onClick={() => setEnlargedPhoto(p.check_out_photo)} className="w-8 h-8 rounded-lg object-cover border border-red-200 hover:ring-2 hover:ring-brand-400 cursor-pointer" />}
                              {!p.check_in_photo && !p.check_out_photo && <span className="text-[9px] text-slate-300">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody></table>
                  </div>
                )}
              </div>
            ) : <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><p className="text-xs text-slate-400">No data for this date</p></div>}
          </motion.div>
        )}

        {/* SUMMARY */}
        {tab === "summary" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <select value={summaryMonth} onChange={e => setSummaryMonth(parseInt(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none">
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2025, i).toLocaleDateString("en-US", { month: "long" })}</option>)}
              </select>
              <select value={summaryYear} onChange={e => setSummaryYear(parseInt(e.target.value))} className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> :
            summary.length === 0 ? <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><p className="text-xs text-slate-400">No summary data</p></div> : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full"><thead><tr className="bg-slate-50/80">
                  {["Employee", "Dept", "Present", "Absent", "Half Day", "Late", "Leaves", "Avg Hrs"].map(h => <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2.5">{h}</th>)}
                </tr></thead><tbody>
                  {summary.map((s, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{s.employee_name}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{s.department}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-green-600">{s.present}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-red-500">{s.absent}</td>
                      <td className="px-4 py-2.5 text-xs text-orange-600">{s.half_days || 0}</td>
                      <td className="px-4 py-2.5 text-xs text-amber-600">{s.late_arrivals || 0}</td>
                      <td className="px-4 py-2.5 text-xs text-purple-600">{s.leaves || 0}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{s.avg_hours?.toFixed(1) || "—"}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </motion.div>
        )}

        {/* LOCATIONS */}
        {tab === "locations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Office Locations</h3>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setLocForm({ name: "", address: "", latitude: "", longitude: "", radius_meters: 200, is_active: true }); setEditLoc(null); setShowLocModal(true); }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-xs font-semibold shadow-md">
                <Plus className="w-3.5 h-3.5" /> Add Location
              </motion.button>
            </div>
            {locations.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><MapPin className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No locations configured</p></div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {locations.map((loc, i) => (
                  <div key={loc.id || i} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{loc.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{loc.address}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${loc.is_active ? "bg-green-50 text-green-600 border border-green-200" : "bg-slate-50 text-slate-400 border border-slate-200"}`}>
                        {loc.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                      <span>Lat: {loc.latitude}</span><span>Lng: {loc.longitude}</span><span>Radius: {loc.radius_meters}m</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => { setLocForm({ name: loc.name, address: loc.address || "", latitude: loc.latitude, longitude: loc.longitude, radius_meters: loc.radius_meters, is_active: loc.is_active }); setEditLoc(loc); setShowLocModal(true); }}
                        className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1"><Edit className="w-3 h-3" /> Edit</button>
                      <button onClick={() => handleDeleteLoc(loc)}
                        className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* REGULARIZATIONS */}
        {tab === "regularizations" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> :
            regs.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No pending regularization requests</p></div>
            ) : (
              <div className="space-y-3">
                {regs.map((r, i) => {
                  const statusCfg = {
                    pending: { cls: "bg-amber-50 text-amber-600 border-amber-200", label: "Pending", border: "border-amber-100" },
                    approved: { cls: "bg-green-50 text-green-600 border-green-200", label: "Approved", border: "border-green-100" },
                    rejected: { cls: "bg-red-50 text-red-600 border-red-200", label: "Rejected", border: "border-red-100" },
                  };
                  const sc = statusCfg[r.status] || statusCfg.pending;
                  return (
                  <div key={r.id || i} className={`bg-white rounded-2xl p-5 border ${sc.border} shadow-sm`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{r.employee_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.date} • {r.type?.replace("_", " ")} • Proposed: {r.proposed_time || "—"}</p>
                        <p className="text-xs text-slate-600 mt-1 italic">&quot;{r.reason}&quot;</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${sc.cls}`}>{sc.label}</span>
                    </div>
                    {r.status === "pending" && (
                    <div className="flex gap-2 mt-3">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleApproveReg(r.id)}
                        className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-4 py-1.5 rounded-lg hover:bg-green-100">✓ Approve</motion.button>
                      <button onClick={() => { setShowRejectRegModal(r); setRejectRegReason(""); }}
                        className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-4 py-1.5 rounded-lg hover:bg-red-100">✗ Reject</button>
                    </div>
                    )}
                    {r.status === "rejected" && r.rejection_reason && (
                      <p className="text-[10px] text-red-500 mt-2">Reason: {r.rejection_reason}</p>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* CONFIG */}
        {tab === "config" && config && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <form onSubmit={handleSaveConfig} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm max-w-2xl space-y-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Attendance Policy Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Shift Start</label>
                  <input type="time" value={config.shift_start || "09:00"} onChange={e => setConfig(c => ({ ...c, shift_start: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Shift End</label>
                  <input type="time" value={config.shift_end || "18:00"} onChange={e => setConfig(c => ({ ...c, shift_end: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Grace Period (min)</label>
                  <input type="number" value={config.grace_period_minutes || 15} onChange={e => setConfig(c => ({ ...c, grace_period_minutes: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Min Hours (Full Day)</label>
                  <input type="number" value={config.min_hours_full_day || 8} onChange={e => setConfig(c => ({ ...c, min_hours_full_day: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Min Hours (Half Day)</label>
                  <input type="number" value={config.min_hours_half_day || 4} onChange={e => setConfig(c => ({ ...c, min_hours_half_day: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={config.photo_required || false} onChange={e => setConfig(c => ({ ...c, photo_required: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-brand-600" /> Photo Required
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={config.location_required_for_checkout || false} onChange={e => setConfig(c => ({ ...c, location_required_for_checkout: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-brand-600" /> Location for Check-out
                </label>
              </div>
              <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="px-6 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                {formLoading ? "Saving..." : "Save Configuration"}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* REPORTS */}
        {tab === "reports" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <select value={summaryMonth} onChange={e => { setSummaryMonth(parseInt(e.target.value)); fetchMonthlyReport(); }} className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none">
                {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{new Date(2025, i).toLocaleDateString("en-US", { month: "long" })}</option>)}
              </select>
              <select value={summaryYear} onChange={e => { setSummaryYear(parseInt(e.target.value)); fetchMonthlyReport(); }} className="px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none">
                {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {loading ? <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div> :
            monthlyReport?.departments ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full"><thead><tr className="bg-slate-50/80">
                  {["Department", "Present Days", "Absent Days", "Late Days", "Total Hours"].map(h => <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase px-4 py-2.5">{h}</th>)}
                </tr></thead><tbody>
                  {monthlyReport.departments.map((d, i) => (
                    <tr key={i} className="border-t border-slate-50">
                      <td className="px-4 py-2.5 text-xs font-semibold text-slate-800">{d.department}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-green-600">{d.present_days}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-red-500">{d.absent_days}</td>
                      <td className="px-4 py-2.5 text-xs text-amber-600">{d.late_days}</td>
                      <td className="px-4 py-2.5 text-xs font-bold text-slate-700">{d.total_hours}</td>
                    </tr>
                  ))}
                </tbody></table>
              </div>
            ) : <div className="bg-white rounded-2xl p-12 border shadow-sm text-center"><p className="text-xs text-slate-400">No report data</p></div>}
          </motion.div>
        )}
      </div>

      {/* Location Modal */}
      <AnimatePresence>
        {showLocModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowLocModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">{editLoc ? "Edit" : "Add"} Office Location</h3>
                <button onClick={() => setShowLocModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleSaveLoc} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location Name *</label>
                  <input value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} required placeholder="Hyderabad Office"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Address *</label>
                  <input value={locForm.address} onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))} required placeholder="Plot 42, Madhapur, Hyderabad"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>

                {/* Map Picker */}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Pick Location on Map</label>
                  <LocationPicker
                    latitude={locForm.latitude}
                    longitude={locForm.longitude}
                    radius={locForm.radius_meters}
                    onLocationChange={(lat, lng) => setLocForm(f => ({ ...f, latitude: lat, longitude: lng }))}
                    onAddressChange={(addr) => setLocForm(f => ({ ...f, address: addr }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Radius (meters)</label>
                    <input type="number" value={locForm.radius_meters} onChange={e => setLocForm(f => ({ ...f, radius_meters: e.target.value }))} placeholder="200"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input type="checkbox" checked={locForm.is_active} onChange={e => setLocForm(f => ({ ...f, is_active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-brand-600" /> Active
                    </label>
                  </div>
                </div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Saving..." : editLoc ? "Update Location" : "Add Location"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark Attendance Modal */}
      <AnimatePresence>
        {showMarkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMarkModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Mark Attendance</h3>
                <button onClick={() => setShowMarkModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <form onSubmit={handleMark} className="space-y-4">
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Employee *</label>
                  <select value={markForm.employee_id} onChange={e => setMarkForm(f => ({ ...f, employee_id: e.target.value }))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="">Select employee...</option>
                    {employees.map(emp => <option key={emp.id || emp._id} value={emp.id || emp._id}>{emp.first_name} {emp.last_name} — {emp.department}</option>)}
                  </select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date *</label>
                    <input type="date" value={markForm.date} onChange={e => setMarkForm(f => ({ ...f, date: e.target.value }))} required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status</label>
                    <select value={markForm.status} onChange={e => setMarkForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                      <option value="present">Present</option><option value="absent">Absent</option><option value="half_day">Half Day</option><option value="late">Late</option>
                    </select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check In</label>
                    <input type="time" value={markForm.check_in} onChange={e => setMarkForm(f => ({ ...f, check_in: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                  <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Check Out</label>
                    <input type="time" value={markForm.check_out} onChange={e => setMarkForm(f => ({ ...f, check_out: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                </div>
                <div><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason</label>
                  <textarea rows={2} value={markForm.reason} onChange={e => setMarkForm(f => ({ ...f, reason: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" placeholder="e.g. Client site visit" /></div>
                <motion.button type="submit" disabled={formLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {formLoading ? "Marking..." : "Mark Attendance"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Regularization Modal */}
      <AnimatePresence>
        {showRejectRegModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRejectRegModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900">Reject Regularization</h3>
                <button onClick={() => setShowRejectRegModal(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="mb-4"><label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label>
                <textarea rows={3} value={rejectRegReason} onChange={e => setRejectRegReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-red-400 resize-none" placeholder="Reason for rejection..." /></div>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }} onClick={handleRejectReg}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                Confirm Rejection
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Enlarge Modal */}
      <AnimatePresence>
        {enlargedPhoto && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEnlargedPhoto(null)}>
            <motion.div initial={{ scale:0.8 }} animate={{ scale:1 }} exit={{ scale:0.8 }}
              className="relative max-w-md w-full">
              <img src={enlargedPhoto} alt="Selfie" className="w-full rounded-2xl shadow-2xl" />
              <button onClick={() => setEnlargedPhoto(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-100">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
