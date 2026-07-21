"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Camera, CheckCircle2, AlertCircle, X,
  ChevronLeft, ChevronRight, LogIn, LogOut, MoreVertical
} from "lucide-react";
import TopBar from "@/components/TopBar";
import {
  getAttendanceToday, getMyAttendanceHistory, attendanceCheckIn,
  attendanceCheckOut, requestRegularization, listRegularizations, listHolidays
} from "@/lib/api";

export default function MyAttendancePage() {
  const [todayStatus, setTodayStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAction, setCameraAction] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [punchError, setPunchError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ date: "", type: "missed_check_in", proposed_time: "", reason: "" });
  const [regError, setRegError] = useState("");
  const [myRegs, setMyRegs] = useState([]);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), type === "error" ? 6000 : 4000); };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchHistory(); }, [calMonth, calYear]);

  const fetchData = async () => {
    setLoading(true);
    const [todayRes, holRes, regRes] = await Promise.all([
      getAttendanceToday(),
      listHolidays({ year: new Date().getFullYear(), limit: 100 }),
      listRegularizations({}),
    ]);
    if (todayRes.ok && todayRes.data) setTodayStatus(todayRes.data);
    if (holRes.ok && holRes.data) setHolidays(holRes.data.holidays || []);
    if (regRes.ok && regRes.data) setMyRegs(regRes.data.regularizations || regRes.data.requests || []);
    await fetchHistory();
    setLoading(false);
  };

  const fetchHistory = async () => {
    const res = await getMyAttendanceHistory({ month: calMonth + 1, year: calYear });
    if (res.ok && res.data) setHistory(res.data.records || []);
  };

  const getLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      err => reject(err.message || "Location access denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const startCamera = async (action) => {
    setCameraAction(action); setCapturedPhoto(null); setGpsError(null); setPunchError(""); setShowCamera(true);
    try { setGpsCoords(await getLocation()); } catch (err) { setGpsError(typeof err === "string" ? err : "Unable to get location"); }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { showToast("Camera access denied", "error"); setShowCamera(false); }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 320; canvas.height = 240;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
    setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.4));
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setShowCamera(false); setCapturedPhoto(null); setCameraAction(null);
  };

  const handlePunch = async () => {
    if (!capturedPhoto) { setPunchError("Please capture a photo first"); return; }
    if (!gpsCoords) { setPunchError("GPS location required"); return; }
    setPunchError(""); setActionLoading(true);
    const payload = { latitude: gpsCoords.latitude, longitude: gpsCoords.longitude, photo_url: capturedPhoto, notes: "" };
    const res = cameraAction === "check_in" ? await attendanceCheckIn(payload) : await attendanceCheckOut(payload);
    if (res.ok) { showToast(cameraAction === "check_in" ? "Checked in!" : "Checked out!"); stopCamera(); fetchData(); }
    else { setPunchError(typeof res.data?.detail === "string" ? res.data.detail : Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed"); }
    setActionLoading(false);
  };

  const handleRegularize = async (e) => {
    e.preventDefault(); setActionLoading(true);
    const res = await requestRegularization(regForm);
    if (res.ok) { showToast("Regularization submitted!"); setShowRegModal(false); setRegForm({ date: "", type: "missed_check_in", proposed_time: "", reason: "" }); fetchData(); }
    else { setRegError(typeof res.data?.detail === "string" ? res.data.detail : "Failed"); }
    setActionLoading(false);
  };

  const holidayDates = {}; holidays.forEach(h => { holidayDates[h.date] = h; });
  const historyDates = {}; history.forEach(r => { historyDates[r.date] = r; });

  if (loading) return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Attendance" />
      <div className="p-6 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>
    </div>
  );

  const isCheckedIn = todayStatus?.check_in != null;
  const hasCheckedOut = todayStatus?.check_out != null;
  const inTime = todayStatus?.check_in ? new Date(todayStatus.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--";
  const outTime = todayStatus?.check_out ? new Date(todayStatus.check_out).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--";
  const totalHrs = todayStatus?.total_hours != null ? `${Math.floor(todayStatus.total_hours)}h ${Math.round((todayStatus.total_hours % 1) * 60)}m` : "--";

  // Monthly summary
  const presentDays = history.filter(r => r.status === "present").length;
  const halfDays = history.filter(r => r.status === "half_day" || r.status === "late").length;
  const absentDays = history.filter(r => r.status === "absent").length;
  const totalHours = history.reduce((s, r) => s + (r.total_hours || 0), 0);
  const punctuality = history.length > 0 ? Math.round((history.filter(r => r.status === "present").length / history.length) * 100) : 0;
  const avgHours = history.filter(r => r.total_hours).length > 0 ? (totalHours / history.filter(r => r.total_hours).length) : 0;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Attendance" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-[200] px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 md:p-6">
        <div className="flex gap-6 items-start">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Hero — Today's Status */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 p-6 text-white shadow-xl">
              <img src="/emp-attendance.png" alt="" className="absolute right-6 top-1/2 -translate-y-1/2 h-[80%] object-contain pointer-events-none hidden md:block mix-blend-luminosity opacity-90" />
              <div className="relative z-10">
                <p className="text-[10px] text-white/60 uppercase tracking-wider font-medium">
                  {new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
                <h2 className="text-2xl font-black mt-1 flex items-center gap-2">
                  {!isCheckedIn ? "Not Checked In" : hasCheckedOut ? "Day Complete" : "Working..."}
                  {hasCheckedOut && <CheckCircle2 className="w-6 h-6 text-green-300" />}
                </h2>
                <div className="flex items-center gap-6 mt-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"><LogIn className="w-4 h-4" /></div>
                    <div><p className="text-[9px] text-white/60">In</p><p className="text-sm font-bold">{inTime}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"><LogOut className="w-4 h-4" /></div>
                    <div><p className="text-[9px] text-white/60">Out</p><p className="text-sm font-bold">{outTime}</p></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center"><Clock className="w-4 h-4" /></div>
                    <div><p className="text-[9px] text-white/60">Total Hours</p><p className="text-sm font-bold">{totalHrs}</p></div>
                  </div>
                </div>
                {todayStatus?.is_late && <p className="text-[10px] text-amber-200 mt-2">Late by {todayStatus.late_by_minutes} min</p>}
                {todayStatus?.check_in_location?.matched_office && (
                  <p className="text-[10px] text-white/50 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" />{todayStatus.check_in_location.matched_office}</p>
                )}
              </div>
              {!hasCheckedOut && (
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => startCamera(isCheckedIn ? "check_out" : "check_in")}
                  className="absolute top-5 right-5 z-10 px-5 py-2.5 bg-white rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 text-indigo-700 hover:bg-blue-50">
                  {isCheckedIn ? <><LogOut className="w-4 h-4 text-red-500" /> Check Out</> : <><LogIn className="w-4 h-4 text-green-600" /> Check In</>}
                </motion.button>
              )}
            </motion.div>

            {/* Records Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-slate-900">Attendance Records</h3>
                <select value={`${calYear}-${calMonth}`} onChange={e => { const [y, m] = e.target.value.split("-"); setCalYear(parseInt(y)); setCalMonth(parseInt(m)); }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 outline-none focus:border-brand-400 bg-white">
                  {Array.from({ length: 12 }, (_, i) => {
                    const y = new Date().getFullYear();
                    return <option key={i} value={`${y}-${i}`}>{new Date(y, i).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</option>;
                  })}
                </select>
              </div>
              <button onClick={() => { setShowRegModal(true); setRegError(""); }}
                className="px-4 py-2 bg-white border-2 border-brand-500 text-brand-600 rounded-xl text-xs font-bold hover:bg-brand-50 transition-colors">
                Request Regularization
              </button>
            </div>

            {/* Records List */}
            <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1 hide-scrollbar">
              {history.length === 0 ? (
                <div className="bg-white rounded-2xl p-10 text-center border border-slate-100"><Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No records for this month</p></div>
              ) : (
                history.map((r, i) => {
                  const statusCls = { present: "bg-green-100 text-green-700", late: "bg-amber-100 text-amber-700", absent: "bg-red-100 text-red-700", half_day: "bg-orange-100 text-orange-700", on_leave: "bg-purple-100 text-purple-700" };
                  const statusLabel = { present: "Present", late: "Late", absent: "Absent", half_day: "Half Day", on_leave: "On Leave" };
                  const dayDate = new Date(r.date + "T00:00:00");
                  const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                  const holiday = holidayDates[r.date];
                  const isOff = isWeekend || holiday;

                  return (
                    <div key={r.id || i} className="bg-white rounded-xl border border-slate-100 px-5 py-4 flex items-center gap-4 hover:shadow-sm transition-shadow">
                      {/* Date */}
                      <div className="w-12 text-center flex-shrink-0">
                        <p className="text-xl font-black text-slate-800">{dayDate.getDate()}</p>
                        <p className="text-[9px] text-slate-400 uppercase font-semibold">{dayDate.toLocaleDateString("en-US", { weekday: "short" })}</p>
                      </div>
                      {/* Divider */}
                      <div className="w-px h-10 bg-slate-200 flex-shrink-0" />
                      {/* Times */}
                      <div className="flex-1 min-w-0">
                        {isOff ? (
                          <p className="text-xs font-semibold text-slate-500">{holiday ? holiday.name : "Weekly Off"}</p>
                        ) : (
                          <div className="flex items-center gap-5">
                            <div>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <LogIn className="w-3 h-3 text-green-500" />
                                {r.check_in ? new Date(r.check_in).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--"}
                              </p>
                              <p className="text-[9px] text-slate-400">In Time</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                                <LogOut className="w-3 h-3 text-red-400" />
                                {r.check_out ? new Date(r.check_out).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "--"}
                              </p>
                              <p className="text-[9px] text-slate-400">Out Time</p>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800">{r.total_hours ? `${Math.floor(r.total_hours)}h ${Math.round((r.total_hours % 1) * 60)}m` : "--"}</p>
                              <p className="text-[9px] text-slate-400">Total Hours</p>
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Status badge */}
                      <span className={`text-[9px] font-bold px-3 py-1 rounded-full flex-shrink-0 ${isOff ? "bg-slate-100 text-slate-500" : (statusCls[r.status] || "bg-slate-100 text-slate-500")}`}>
                        {isOff ? (holiday ? "Holiday" : "Weekly Off") : (statusLabel[r.status] || r.status)}
                      </span>
                      {/* Location + Photos */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {r.check_in_location?.matched_office && <MapPin className="w-3.5 h-3.5 text-slate-300" />}
                        {r.check_in_photo && <img src={r.check_in_photo} alt="" onClick={() => setEnlargedPhoto(r.check_in_photo)} className="w-7 h-7 rounded-lg object-cover border border-slate-200 cursor-pointer hover:ring-2 hover:ring-brand-400" />}
                        {r.check_out_photo && <img src={r.check_out_photo} alt="" onClick={() => setEnlargedPhoto(r.check_out_photo)} className="w-7 h-7 rounded-lg object-cover border border-slate-200 cursor-pointer hover:ring-2 hover:ring-brand-400" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ═══ RIGHT SIDEBAR ═══ */}
          <div className="w-80 flex-shrink-0 sticky top-20 space-y-5 hidden lg:block">
            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 flex items-center justify-between">
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-slate-500" /></button>
                <span className="text-sm font-bold text-slate-800">
                  {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </span>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-slate-500" /></button>
              </div>
              <div className="px-4 pb-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => <div key={`e-${i}`} className="w-9 h-9" />)}
                  {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const record = historyDates[dateStr];
                    const holiday = holidayDates[dateStr];
                    const isToday = new Date().getFullYear() === calYear && new Date().getMonth() === calMonth && new Date().getDate() === day;
                    const dow = new Date(calYear, calMonth, day).getDay();

                    let bg = "text-slate-600";
                    if (isToday) bg = "bg-brand-600 text-white rounded-full";
                    else if (holiday) bg = "bg-blue-50 text-blue-600 rounded-full";
                    else if (record?.status === "present") bg = "bg-green-50 text-green-700 rounded-full";
                    else if (record?.status === "late") bg = "bg-amber-50 text-amber-700 rounded-full";
                    else if (record?.status === "half_day") bg = "bg-orange-50 text-orange-700 rounded-full";
                    else if (record?.status === "absent") bg = "bg-red-50 text-red-700 rounded-full";
                    else if (record?.status === "on_leave") bg = "bg-purple-50 text-purple-700 rounded-full";
                    else if (dow === 0 || dow === 6) bg = "text-slate-300";

                    return (
                      <div key={day} title={holiday?.name || record?.status || ""}
                        className={`w-9 h-9 flex items-center justify-center text-xs font-semibold ${bg}`}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="grid grid-cols-3 gap-x-4 gap-y-1 mt-4 pt-3 border-t border-slate-100">
                  {[
                    { cls: "bg-green-400", label: "Present" },
                    { cls: "bg-amber-400", label: "Late" },
                    { cls: "bg-red-400", label: "Absent" },
                    { cls: "bg-purple-400", label: "Half Day" },
                    { cls: "bg-slate-300", label: "Weekly Off" },
                    { cls: "bg-blue-400", label: "Holiday" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[9px] text-slate-500">
                      <span className={`w-2.5 h-2.5 rounded-full ${l.cls}`} />{l.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Monthly Summary</h3>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center p-2 rounded-xl bg-green-50 border border-green-100">
                  <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center mx-auto mb-1"><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /></div>
                  <p className="text-lg font-black text-green-700">{presentDays}</p>
                  <p className="text-[8px] text-slate-500 font-semibold">Present Days</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-1"><Clock className="w-3.5 h-3.5 text-amber-600" /></div>
                  <p className="text-lg font-black text-amber-700">{halfDays}</p>
                  <p className="text-[8px] text-slate-500 font-semibold">Half Days</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-1"><AlertCircle className="w-3.5 h-3.5 text-red-600" /></div>
                  <p className="text-lg font-black text-red-700">{absentDays}</p>
                  <p className="text-[8px] text-slate-500 font-semibold">Absent Days</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center mx-auto mb-1"><Clock className="w-3.5 h-3.5 text-indigo-600" /></div>
                  <p className="text-sm font-black text-indigo-700">{Math.floor(totalHours)}h {Math.round((totalHours % 1) * 60)}m</p>
                  <p className="text-[8px] text-slate-500 font-semibold">Total Hours</p>
                </div>
              </div>
            </div>

            {/* Attendance Insights */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Attendance Insights</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-600 font-medium">Punctuality</span>
                    <span className="text-xs font-bold text-green-600">{punctuality}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${punctuality}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-600 font-medium">Avg. Work Hours</span>
                    <span className="text-xs font-bold text-indigo-600">{Math.floor(avgHours)}h {Math.round((avgHours % 1) * 60)}m</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${Math.min(100, (avgHours / 9) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                <div><h3 className="text-sm font-bold text-white">{cameraAction === "check_in" ? "Check In" : "Check Out"}</h3><p className="text-[10px] text-blue-100">Capture selfie to confirm</p></div>
                <button onClick={stopCamera} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className={`p-2.5 rounded-xl flex items-center gap-2 text-xs ${gpsCoords ? "bg-green-50 text-green-700 border border-green-200" : gpsError ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {gpsCoords ? `${gpsCoords.latitude.toFixed(4)}, ${gpsCoords.longitude.toFixed(4)}` : gpsError || "Fetching GPS..."}
                </div>
                {punchError && <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">{punchError}</div>}
                <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden">
                  {!capturedPhoto ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /> : <img src={capturedPhoto} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="flex gap-3">
                  {!capturedPhoto ? (
                    <button onClick={capturePhoto} className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"><Camera className="w-4 h-4" /> Capture</button>
                  ) : (
                    <>
                      <button onClick={() => setCapturedPhoto(null)} className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">Retake</button>
                      <button onClick={handlePunch} disabled={actionLoading || !gpsCoords}
                        className={`flex-1 py-3 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${cameraAction === "check_in" ? "bg-green-600" : "bg-red-500"}`}>
                        {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : cameraAction === "check_in" ? "Confirm In" : "Confirm Out"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Regularization Modal */}
      <AnimatePresence>
        {showRegModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRegModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                <div><h3 className="text-sm font-bold text-white">Request Regularization</h3><p className="text-[10px] text-blue-100">Correct a missed/wrong entry</p></div>
                <button onClick={() => setShowRegModal(false)} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><X className="w-4 h-4 text-white" /></button>
              </div>
              <form onSubmit={handleRegularize} className="p-5 space-y-4">
                {regError && <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">{regError}</div>}
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Date *</label><input type="date" value={regForm.date} onChange={e => setRegForm(f => ({ ...f, date: e.target.value }))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Type</label><select value={regForm.type} onChange={e => setRegForm(f => ({ ...f, type: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 bg-white"><option value="missed_check_in">Missed Check-In</option><option value="missed_check_out">Missed Check-Out</option><option value="wrong_time">Wrong Time</option><option value="work_from_home">Work From Home</option></select></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Proposed Time</label><input type="time" value={regForm.proposed_time} onChange={e => setRegForm(f => ({ ...f, proposed_time: e.target.value }))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" /></div>
                <div><label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Reason *</label><textarea rows={2} value={regForm.reason} onChange={e => setRegForm(f => ({ ...f, reason: e.target.value }))} required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" /></div>
                <button type="submit" disabled={actionLoading} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold disabled:opacity-60">{actionLoading ? "Submitting..." : "Submit Request"}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlarged Photo */}
      <AnimatePresence>
        {enlargedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEnlargedPhoto(null)}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} className="relative max-w-sm w-full">
              <img src={enlargedPhoto} alt="" className="w-full rounded-2xl shadow-2xl" />
              <button onClick={() => setEnlargedPhoto(null)} className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">✕</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
