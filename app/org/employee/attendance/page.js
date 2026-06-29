"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Clock, Camera, CheckCircle2, AlertCircle, X,
  ChevronLeft, ChevronRight, Calendar, LogIn, LogOut
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
  // Camera
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAction, setCameraAction] = useState(null); // "check_in" | "check_out"
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [gpsCoords, setGpsCoords] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [enlargedPhoto, setEnlargedPhoto] = useState(null);
  const [punchError, setPunchError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  // Regularization
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

  // GPS
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject("Geolocation not supported"); return; }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        err => reject(err.message || "Location access denied"),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  // Camera
  const startCamera = async (action) => {
    setCameraAction(action);
    setCapturedPhoto(null);
    setGpsError(null);
    setPunchError("");
    setShowCamera(true);
    // Get GPS
    try {
      const coords = await getLocation();
      setGpsCoords(coords);
    } catch (err) {
      setGpsError(typeof err === "string" ? err : "Unable to get location. Please enable GPS.");
    }
    // Start video
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      showToast("Camera access denied. Please allow camera.", "error");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    // Reduce resolution for smaller payload
    canvas.width = 320; canvas.height = 240;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0, 320, 240);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.4);
    setCapturedPhoto(dataUrl);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedPhoto(null);
    setCameraAction(null);
  };

  const handlePunch = async () => {
    if (!capturedPhoto) { setPunchError("Please capture a photo first"); return; }
    if (!gpsCoords) { setPunchError("GPS location required. Please enable location."); return; }
    setPunchError("");
    setActionLoading(true);
    const payload = { latitude: gpsCoords.latitude, longitude: gpsCoords.longitude, photo_url: capturedPhoto, notes: "" };
    const res = cameraAction === "check_in" ? await attendanceCheckIn(payload) : await attendanceCheckOut(payload);
    if (res.ok) {
      showToast(cameraAction === "check_in" ? "Checked in successfully!" : "Checked out successfully!");
      stopCamera();
      fetchData();
    } else {
      const errMsg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed to process";
      setPunchError(errMsg);
    }
    setActionLoading(false);
  };

  // Regularization
  const handleRegularize = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    const res = await requestRegularization(regForm);
    if (res.ok) {
      showToast("Regularization request submitted!");
      setShowRegModal(false);
      setRegForm({ date: "", type: "missed_check_in", proposed_time: "", reason: "" });
      fetchData();
    } else {
      const errMsg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") : "Failed to submit";
      setRegError(errMsg);
    }
    setActionLoading(false);
  };

  // Helpers
  const holidayDates = {};
  holidays.forEach(h => { holidayDates[h.date] = h; });
  const historyDates = {};
  history.forEach(r => { historyDates[r.date] = r; });

  if (loading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  const isCheckedIn = todayStatus?.check_in != null;
  const hasCheckedOut = todayStatus?.check_out != null;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Attendance" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-start gap-2 max-w-md ${toast.type === "error" ? "bg-red-500" : "bg-green-500"}`}>
            {toast.type === "error" ? <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />}
            <span>{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-5">
        {/* Today's Status Card */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl p-5 shadow-lg bg-gradient-to-r from-brand-600 to-indigo-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/60 uppercase tracking-wider font-medium">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</p>
              <h2 className="text-xl font-black mt-0.5">
                {!isCheckedIn ? "Not Checked In" : hasCheckedOut ? "Day Complete ✓" : "Working..."}
              </h2>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-white/80">
                {todayStatus?.check_in && <span>In: {new Date(todayStatus.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                {todayStatus?.check_out && <span>Out: {new Date(todayStatus.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                {todayStatus?.total_hours != null && <span>{todayStatus.total_hours.toFixed(1)}h</span>}
              </div>
              {todayStatus?.is_late && <p className="text-[10px] text-amber-200 mt-1">Late by {todayStatus.late_by_minutes} min</p>}
              {todayStatus?.check_in_location?.matched_office && (
                <p className="text-[10px] text-white/50 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{todayStatus.check_in_location.matched_office}</p>
              )}
            </div>
            {!hasCheckedOut && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => startCamera(isCheckedIn ? "check_out" : "check_in")}
                className={`px-5 py-3 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 ${isCheckedIn ? "bg-white text-red-600" : "bg-white text-green-700"}`}>
                {isCheckedIn ? <><LogOut className="w-4 h-4" /> Check Out</> : <><LogIn className="w-4 h-4" /> Check In</>}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Two Column: Records (left) | Calendar (right) */}
        <div className="flex gap-5 items-start">
          {/* LEFT — Attendance Records */}
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-900">Attendance Records</h3>
                <select value={`${calYear}-${calMonth}`} onChange={e => { const [y, m] = e.target.value.split("-"); setCalYear(parseInt(y)); setCalMonth(parseInt(m)); }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 outline-none focus:border-brand-400">
                  {Array.from({ length: 12 }, (_, i) => {
                    const y = new Date().getFullYear();
                    const m = i;
                    return <option key={i} value={`${y}-${m}`}>{new Date(y, m).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</option>;
                  })}
                </select>
              </div>
              <button onClick={() => { setShowRegModal(true); setRegError(""); }}
                className="text-[10px] font-bold text-brand-600 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-lg hover:bg-brand-100">
                Request Regularization
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden max-h-[calc(100vh-280px)] overflow-y-auto">
              {history.length === 0 ? (
                <div className="p-10 text-center"><Clock className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No records for this month</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {history.map((r, i) => {
                    const colors = { present: "border-l-green-500 bg-green-50/30", late: "border-l-amber-500 bg-amber-50/30", absent: "border-l-red-500 bg-red-50/30", half_day: "border-l-orange-500 bg-orange-50/30", on_leave: "border-l-purple-500 bg-purple-50/30" };
                    const statusLabels = { present: "Present", late: "Late", absent: "Absent", half_day: "Half Day", on_leave: "On Leave" };
                    const c = colors[r.status] || "border-l-slate-300";
                    return (
                      <div key={r.id || i} className={`flex items-center gap-4 px-4 py-3 border-l-4 ${c}`}>
                        <div className="w-10 text-center flex-shrink-0">
                          <p className="text-sm font-black text-slate-800">{new Date(r.date + "T00:00:00").getDate()}</p>
                          <p className="text-[9px] text-slate-400 uppercase">{new Date(r.date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short" })}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 text-xs text-slate-600">
                            {r.check_in && <span className="flex items-center gap-1"><LogIn className="w-3 h-3 text-green-500" />{new Date(r.check_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                            {r.check_out && <span className="flex items-center gap-1"><LogOut className="w-3 h-3 text-red-400" />{new Date(r.check_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>}
                            {r.total_hours != null && <span className="font-bold text-slate-700">{r.total_hours.toFixed(1)}h</span>}
                          </div>
                          {r.check_in_location?.matched_office && <p className="text-[9px] text-slate-400 mt-0.5">{r.check_in_location.matched_office}</p>}
                        </div>
                        <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full capitalize ${
                          r.status === "present" ? "bg-green-100 text-green-700" :
                          r.status === "late" ? "bg-amber-100 text-amber-700" :
                          r.status === "absent" ? "bg-red-100 text-red-700" :
                          r.status === "half_day" ? "bg-orange-100 text-orange-700" :
                          "bg-slate-100 text-slate-600"
                        }`}>{statusLabels[r.status] || r.status}</span>
                        {/* Selfie Photos */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {r.check_in_photo && <img src={r.check_in_photo} alt="In" onClick={() => setEnlargedPhoto(r.check_in_photo)} className="w-7 h-7 rounded-lg object-cover border border-green-200 cursor-pointer hover:ring-2 hover:ring-green-400" />}
                          {r.check_out_photo && <img src={r.check_out_photo} alt="Out" onClick={() => setEnlargedPhoto(r.check_out_photo)} className="w-7 h-7 rounded-lg object-cover border border-red-200 cursor-pointer hover:ring-2 hover:ring-red-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* My Regularization Requests */}
            {myRegs.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-4">
                <div className="p-3 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-900">My Regularization Requests</h3>
                </div>
                <div className="divide-y divide-slate-50 max-h-48 overflow-y-auto">
                  {myRegs.map((r, i) => {
                    const sc = {
                      pending: { cls: "bg-amber-50 text-amber-600", label: "Pending" },
                      approved: { cls: "bg-green-50 text-green-600", label: "Approved" },
                      rejected: { cls: "bg-red-50 text-red-600", label: "Rejected" },
                    };
                    const s = sc[r.status] || sc.pending;
                    return (
                      <div key={r.id || i} className="flex items-center gap-3 px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800">{r.date} — {r.type?.replace(/_/g, " ")}</p>
                          <p className="text-[9px] text-slate-500">Proposed: {r.proposed_time || "—"} • &quot;{r.reason}&quot;</p>
                          {r.rejection_reason && <p className="text-[9px] text-red-500">Rejected: {r.rejection_reason}</p>}
                        </div>
                        <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — Compact Calendar */}
          <div className="w-72 flex-shrink-0 sticky top-20">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                </button>
                <span className="text-xs font-bold text-slate-800">
                  {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
              <div className="p-3">
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={i} className="text-center text-[9px] font-bold text-slate-400 py-0.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: new Date(calYear, calMonth, 1).getDay() }).map((_, i) => <div key={`e-${i}`} />)}
                  {Array.from({ length: new Date(calYear, calMonth + 1, 0).getDate() }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const record = historyDates[dateStr];
                    const holiday = holidayDates[dateStr];
                    const isSunday = new Date(calYear, calMonth, day).getDay() === 0;
                    const isSaturday = new Date(calYear, calMonth, day).getDay() === 6;
                    const isToday = new Date().getFullYear() === calYear && new Date().getMonth() === calMonth && new Date().getDate() === day;

                    let bg = "";
                    if (holiday) bg = "bg-blue-100 text-blue-700";
                    else if (record?.status === "present") bg = "bg-green-100 text-green-700";
                    else if (record?.status === "late") bg = "bg-amber-100 text-amber-700";
                    else if (record?.status === "half_day") bg = "bg-orange-100 text-orange-700";
                    else if (record?.status === "absent") bg = "bg-red-100 text-red-700";
                    else if (record?.status === "on_leave") bg = "bg-purple-100 text-purple-700";
                    else if (isSunday || isSaturday) bg = "bg-slate-50 text-slate-400";
                    else bg = "text-slate-600";

                    return (
                      <div key={day} title={holiday?.name || record?.status || ""}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold ${bg} ${isToday ? "ring-1.5 ring-brand-500 ring-offset-1" : ""}`}>
                        {day}
                      </div>
                    );
                  })}
                </div>
                {/* Legend */}
                <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-slate-100">
                  {[
                    { cls: "bg-green-100", label: "Present" },
                    { cls: "bg-amber-100", label: "Late" },
                    { cls: "bg-red-100", label: "Absent" },
                    { cls: "bg-purple-100", label: "Leave" },
                    { cls: "bg-blue-100", label: "Holiday" },
                    { cls: "bg-slate-50", label: "Weekend" },
                  ].map(l => (
                    <span key={l.label} className="flex items-center gap-1 text-[8px] text-slate-500">
                      <span className={`w-2 h-2 rounded-sm ${l.cls}`} />{l.label}
                    </span>
                  ))}
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
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{cameraAction === "check_in" ? "Check In" : "Check Out"} — Capture Selfie</h3>
                <button onClick={stopCamera} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="p-4 space-y-4">
                {/* GPS Status */}
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${gpsCoords ? "bg-green-50 text-green-700 border border-green-200" : gpsError ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {gpsCoords ? `Location: ${gpsCoords.latitude.toFixed(4)}, ${gpsCoords.longitude.toFixed(4)}` : gpsError ? gpsError : "Fetching GPS..."}
                </div>

                {/* Error inside modal */}
                {punchError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700 flex-1">{punchError}</p>
                    <button onClick={() => setPunchError("")} className="text-red-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Video / Captured Photo */}
                <div className="relative w-full aspect-[4/3] bg-slate-900 rounded-xl overflow-hidden">
                  {!capturedPhoto ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {!capturedPhoto ? (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={capturePhoto}
                      className="flex-1 py-3 bg-brand-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" /> Capture Photo
                    </motion.button>
                  ) : (
                    <>
                      <button onClick={() => setCapturedPhoto(null)}
                        className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Retake
                      </button>
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handlePunch} disabled={actionLoading || !gpsCoords}
                        className={`flex-1 py-3 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 ${cameraAction === "check_in" ? "bg-green-600" : "bg-red-500"}`}>
                        {actionLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> :
                          cameraAction === "check_in" ? <><LogIn className="w-4 h-4" /> Confirm Check In</> : <><LogOut className="w-4 h-4" /> Confirm Check Out</>}
                      </motion.button>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowRegModal(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-slate-900">Request Regularization</h3>
                <button onClick={() => setShowRegModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleRegularize} className="space-y-4">
                {regError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700 flex-1">{regError}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Date *</label>
                  <input type="date" value={regForm.date} onChange={e => setRegForm(f => ({ ...f, date: e.target.value }))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type *</label>
                  <select value={regForm.type} onChange={e => setRegForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400">
                    <option value="missed_check_in">Missed Check-In</option>
                    <option value="missed_check_out">Missed Check-Out</option>
                    <option value="wrong_time">Wrong Time</option>
                    <option value="work_from_home">Work From Home</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Proposed Time</label>
                  <input type="time" value={regForm.proposed_time} onChange={e => setRegForm(f => ({ ...f, proposed_time: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Reason *</label>
                  <textarea rows={2} value={regForm.reason} onChange={e => setRegForm(f => ({ ...f, reason: e.target.value }))} required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none" placeholder="Why do you need regularization?" />
                </div>
                <motion.button type="submit" disabled={actionLoading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 disabled:opacity-70">
                  {actionLoading ? "Submitting..." : "Submit Request"}
                </motion.button>
              </form>
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
              className="relative max-w-sm w-full">
              <img src={enlargedPhoto} alt="Selfie" className="w-full rounded-2xl shadow-2xl" />
              <button onClick={() => setEnlargedPhoto(null)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-100">
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
