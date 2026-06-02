"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarCheck, Clock, CheckCircle2, MapPin, Fingerprint,
  Timer, Navigation, Wifi, AlertCircle, X, Calendar,
  TrendingUp, Home, Download
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";

const attendanceHistory = [
  { date:"Jun 3, 2025",  day:"Tue", checkIn:"09:02 AM", checkOut:null,       hours:"In progress", status:"present" },
  { date:"Jun 2, 2025",  day:"Mon", checkIn:"08:55 AM", checkOut:"06:20 PM", hours:"9h 25m",      status:"present" },
  { date:"May 30, 2025", day:"Fri", checkIn:"09:10 AM", checkOut:"06:05 PM", hours:"8h 55m",      status:"present" },
  { date:"May 29, 2025", day:"Thu", checkIn:"09:31 AM", checkOut:"06:45 PM", hours:"9h 14m",      status:"late"    },
  { date:"May 28, 2025", day:"Wed", checkIn:"—",        checkOut:"—",        hours:"—",           status:"leave"   },
  { date:"May 27, 2025", day:"Tue", checkIn:"08:50 AM", checkOut:"05:55 PM", hours:"9h 05m",      status:"present" },
  { date:"May 26, 2025", day:"Mon", checkIn:"09:00 AM", checkOut:"06:30 PM", hours:"9h 30m",      status:"present" },
];

export default function MyAttendancePage() {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [elapsed, setElapsed] = useState("0h 0m");
  const [location, setLocation] = useState(null);
  const [locError, setLocError] = useState(null);
  const [gettingLoc, setGettingLoc] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [workMode, setWorkMode] = useState("office");
  const [toast, setToast] = useState(null);

  // Live elapsed timer
  useEffect(() => {
    if (!checkedIn || !checkInTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - checkInTime) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;
      setElapsed(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkedIn, checkInTime]);

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject("Geolocation not supported"); return; }
      setGettingLoc(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGettingLoc(false);
          const coords = { lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5), accuracy: Math.round(pos.coords.accuracy) };
          setLocation(coords);
          resolve(coords);
        },
        (err) => {
          setGettingLoc(false);
          const msg = err.code === 1 ? "Location permission denied. Please allow location access." : "Could not fetch location.";
          setLocError(msg);
          reject(msg);
        },
        { timeout: 8000, maximumAge: 60000 }
      );
    });
  };

  const handleCheckIn = async () => {
    setShowCheckInModal(true);
    try { await getLocation(); } catch {}
  };

  const confirmCheckIn = () => {
    setCheckedIn(true);
    setCheckInTime(Date.now());
    setShowCheckInModal(false);
    showToast("✓ Checked in successfully with location verified");
  };

  const handleCheckOut = () => {
    setShowCheckOutModal(true);
  };

  const confirmCheckOut = () => {
    setCheckedIn(false);
    setShowCheckOutModal(false);
    showToast("✓ Checked out successfully. Great work today!");
    setCheckInTime(null);
    setElapsed("0h 0m");
  };

  const stats = { present:19, late:2, leave:1, avgHours:"9h 10m", streak:12, percentage:96 };

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="My Attendance" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20, x:20 }} animate={{ opacity:1, y:0, x:0 }} exit={{ opacity:0, y:-20 }}
            className="fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold bg-green-500 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">

        {/* Check-in Card */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className={`rounded-2xl p-6 border shadow-sm transition-all ${checkedIn ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-400" : "bg-white border-slate-100"}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className={`text-lg font-bold ${checkedIn ? "text-white" : "text-slate-900"}`}>
                {checkedIn ? "You're clocked in ✓" : "Ready to start your day?"}
              </h3>
              {checkedIn ? (
                <div className="space-y-1 mt-2">
                  <p className="text-green-100 text-sm flex items-center gap-2">
                    <Timer className="w-4 h-4" /> Working: <span className="font-bold text-white">{elapsed}</span>
                  </p>
                  {location && (
                    <p className="text-green-100 text-xs flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {location.lat}, {location.lng} (±{location.accuracy}m)
                    </p>
                  )}
                  <p className="text-green-100 text-xs">Mode: <span className="font-semibold capitalize">{workMode}</span></p>
                </div>
              ) : (
                <p className="text-slate-500 text-sm mt-0.5">Your location will be captured on check-in.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!checkedIn ? (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={handleCheckIn}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25">
                  Check In
                </motion.button>
              ) : (
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  onClick={handleCheckOut}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-white/20 hover:bg-white/30 text-white border border-white/30">
                  Check Out
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Monthly Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            { label:"Present",    value:`${stats.present}/22`,   color:"green"  },
            { label:"Late",       value:stats.late,              color:"amber"  },
            { label:"On Leave",   value:stats.leave,             color:"blue"   },
            { label:"Avg Hours",  value:stats.avgHours,          color:"purple" },
            { label:"Streak",     value:`${stats.streak} days`,  color:"indigo" },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.07 }}
              className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
              <p className={`text-lg font-black text-${s.color}-600`}>{s.value}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* History Table */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Attendance History</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">June 2025</span>
              <button className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
                <Download className="w-3.5 h-3.5" /> Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/80">
                  {["Date","Check In","Check Out","Total Hours","Status"].map(h => (
                    <th key={h} className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attendanceHistory.map((row, i) => (
                  <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-xs font-semibold text-slate-800">{row.date}</p>
                      <p className="text-[10px] text-slate-400">{row.day}</p>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-600">{row.checkIn}</td>
                    <td className="px-5 py-3 text-xs text-slate-600">{row.checkOut || <span className="text-green-500 font-semibold">Active</span>}</td>
                    <td className="px-5 py-3 text-xs font-medium text-slate-700">{row.hours}</td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        row.status==="present" ? "bg-green-50 text-green-600" :
                        row.status==="late"    ? "bg-amber-50 text-amber-600" :
                        "bg-blue-50 text-blue-600"
                      }`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Check-In Modal */}
      <AnimatePresence>
        {showCheckInModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCheckInModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Check In</h3>
                <button onClick={() => setShowCheckInModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Work Mode */}
              <div className="mb-5">
                <label className="text-xs font-semibold text-slate-600 mb-2 block">Work Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val:"office", label:"Office", icon:"🏢" },
                    { val:"wfh",    label:"WFH",    icon:"🏠" },
                    { val:"field",  label:"Field",  icon:"📍" },
                  ].map(m => (
                    <button key={m.val} onClick={() => setWorkMode(m.val)}
                      className={`p-3 rounded-xl border text-center transition-all ${workMode===m.val ? "border-brand-400 bg-brand-50" : "border-slate-200 hover:border-slate-300"}`}>
                      <span className="text-lg">{m.icon}</span>
                      <p className={`text-[10px] font-semibold mt-1 ${workMode===m.val ? "text-brand-600" : "text-slate-600"}`}>{m.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="mb-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-brand-500" /> Location Verification
                  </span>
                  {!location && !gettingLoc && (
                    <button onClick={getLocation} className="text-[10px] font-bold text-brand-600 hover:underline">Get Location</button>
                  )}
                </div>
                {gettingLoc && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-3 h-3 border border-brand-400 border-t-brand-600 rounded-full animate-spin" />
                    Fetching your location...
                  </div>
                )}
                {location && (
                  <div className="text-xs text-slate-700">
                    <p className="font-semibold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Location captured</p>
                    <p className="text-[10px] text-slate-500 mt-1">Lat: {location.lat}, Lng: {location.lng}</p>
                    <p className="text-[10px] text-slate-500">Accuracy: ±{location.accuracy}m</p>
                  </div>
                )}
                {locError && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-700">{locError} — you can still check in without location.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mb-4 px-1">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date().toLocaleTimeString()}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date().toLocaleDateString()}</span>
              </div>

              <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                onClick={confirmCheckIn}
                className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-500/20 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Confirm Check In
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Check-Out Modal */}
      <AnimatePresence>
        {showCheckOutModal && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCheckOutModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.95, y:20 }} animate={{ opacity:1, scale:1, y:0 }} exit={{ opacity:0, scale:0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900">Check Out</h3>
                <button onClick={() => setShowCheckOutModal(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 mb-5">
                <p className="text-xs text-slate-600 mb-1">Time worked today</p>
                <p className="text-2xl font-black text-green-600">{elapsed}</p>
                <p className="text-[10px] text-slate-500 mt-1">Checked in at {new Date(checkInTime).toLocaleTimeString()}</p>
              </div>

              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Work Summary (optional)</label>
                <textarea rows={3} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none"
                  placeholder="What did you work on today?" />
              </div>

              <motion.button whileHover={{ scale:1.01 }} whileTap={{ scale:0.99 }}
                onClick={confirmCheckOut}
                className="w-full py-3.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-500/20">
                Confirm Check Out
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
