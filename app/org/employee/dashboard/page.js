"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  ListTodo, AlertTriangle, CheckCircle2, CalendarCheck, Users,
  Clock, ClipboardList, FileText, Wallet, Bell, ChevronRight,
  Sparkles, RefreshCw, Activity, Heart, ArrowUpRight, Camera, LogIn, LogOut
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAuth } from "@/context/AuthContext";
import { useDashboard, useInvalidate } from "@/lib/queries";
import { formatDate } from "@/lib/date";
import { submitMood, attendanceCheckIn, attendanceCheckOut, getAttendanceToday } from "@/lib/api";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

const MOODS = [
  { value: 5, emoji: "😊", label: "Happy" },
  { value: 4, emoji: "🙂", label: "Okay" },
  { value: 3, emoji: "😐", label: "Sad" },
  { value: 2, emoji: "😠", label: "Angry" },
  { value: 1, emoji: "😰", label: "Stressed" },
];

export default function MyDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const invalidate = useInvalidate();
  const [moodSubmitting, setMoodSubmitting] = useState(false);
  const [moodDone, setMoodDone] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [checkedIn, setCheckedIn] = useState(null); // null = loading, true/false
  const [checkedOut, setCheckedOut] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [checkToast, setCheckToast] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const activeUser = user || { name: "Employee" };

  // Check today's attendance status on mount
  useState(() => {
    getAttendanceToday().then(res => {
      if (res.ok && res.data) {
        setCheckedIn(!!res.data.check_in);
        setCheckedOut(!!res.data.check_out);
      } else {
        setCheckedIn(false);
      }
    });
  });

  const startCamera = async () => {
    setShowCamera(true);
    setCapturedPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = stream;
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch { setCheckToast("Camera access denied"); setTimeout(() => setCheckToast(null), 3000); setShowCamera(false); }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL("image/jpeg", 0.7));
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
  };

  const doCheckIn = async () => {
    setCheckLoading(true);
    let coords = {};
    try {
      const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 8000 }));
      coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
    } catch {}
    const payload = { ...coords, photo_url: capturedPhoto || "", notes: "" };
    const apiFn = checkedIn ? attendanceCheckOut : attendanceCheckIn;
    const res = await apiFn(payload);
    if (res.ok) {
      if (checkedIn) { setCheckedIn(false); setCheckedOut(true); setCheckToast("✓ Checked out! Day complete."); }
      else { setCheckedIn(true); setCheckToast("✓ Checked in!"); }
    } else {
      const detail = res.data?.detail;
      setCheckToast(typeof detail === "string" ? detail : Array.isArray(detail) ? detail.map(e => e.msg).join(", ") : checkedIn ? "Check-out failed" : "Check-in failed");
    }
    setCheckLoading(false);
    setShowCamera(false);
    setCapturedPhoto(null);
    setTimeout(() => setCheckToast(null), 3000);
  };

  const handleMood = async (score) => {
    setMoodSubmitting(true);
    await submitMood({ score });
    setMoodDone(true);
    setMoodSubmitting(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Dashboard" />
        <div className="p-6">
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-slate-200 rounded-2xl" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-slate-200 rounded-2xl" />)}
            </div>
            <div className="grid lg:grid-cols-3 gap-5">
              <div className="h-56 bg-slate-200 rounded-2xl" />
              <div className="h-56 bg-slate-200 rounded-2xl" />
              <div className="h-56 bg-slate-200 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-surface-100">
        <TopBar title="Dashboard" />
        <div className="p-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Unable to load dashboard</p>
            <button onClick={() => invalidate(["dashboard"])} className="mt-4 px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700">
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isTeamLead = data.is_team_lead === true;
  const greeting = data.greeting || `Good day, ${activeUser.name}`;
  const myInfo = data.my_info || {};
  const myWork = data.my_work || {};
  const myAttendance = data.my_attendance || {};
  const leaveBalance = myAttendance.leave_balance || {};
  const myTimesheets = data.my_timesheets || {};
  const recentNotifs = data.recent_notifications || [];
  const upcomingHolidays = data.upcoming_holidays || [];
  const teamSummary = data.team_summary || {};
  const pendingApprovals = data.pending_approvals || {};
  const recentActivity = data.recent_activity || [];

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }).toUpperCase();
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" });

  // Work items chart data
  const workChartData = [
    { name: "Assigned", value: myWork.assigned_to_me || 0, fill: "#3b82f6" },
    { name: "Overdue", value: myWork.overdue || 0, fill: "#ef4444" },
    { name: "Done", value: myWork.completed_this_week || 0, fill: "#10b981" },
  ];

  // Timesheets donut
  const tsSubmitted = myTimesheets.submitted_this_week || 0;
  const tsPending = myTimesheets.pending || 0;
  const tsTotal = tsSubmitted + tsPending;
  const tsData = [
    { name: "Submitted", value: tsSubmitted || 1 },
    { name: "Pending", value: tsPending || 0 },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Dashboard" />

      <div className="p-4 md:p-6 space-y-5">
        {/* ─── Hero Banner ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 px-5 py-5 text-white shadow-xl">
          <img src="/emp-dashboard.png" alt="" className="absolute left-1/2 -translate-x-1/2 bottom-[-17%] h-[95%] object-contain pointer-events-none z-0 opacity-60 hidden md:block" />
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-4">
            {/* Left: Greeting + Badges + Mood */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-md bg-white/15 flex items-center justify-center border border-white/20">
                  <Sparkles className="w-3 h-3 text-white/80" />
                </div>
                <span className="text-[11px] font-medium text-white/90">{data.org_name || ""}</span>
              </div>
              <h2 className="text-lg font-bold text-white">{greeting} 👋</h2>
              <p className="text-[11px] text-white/70">{dateStr}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {myInfo.designation && <span className="text-[9px] font-bold bg-white/15 border border-white/20 px-2 py-0.5 rounded-md text-white">{myInfo.designation}</span>}
                {myInfo.department && <span className="text-[9px] font-bold bg-white/15 border border-white/20 px-2 py-0.5 rounded-md text-white">{myInfo.department}</span>}
                {myInfo.employee_id && <span className="text-[9px] font-bold bg-white/15 border border-white/20 px-2 py-0.5 rounded-md text-white">{myInfo.employee_id}</span>}
                {isTeamLead && <span className="text-[9px] font-bold bg-yellow-400/20 border border-yellow-300/30 text-yellow-200 px-2 py-0.5 rounded-md">⭐ Team Lead</span>}
              </div>
              {/* Mood — below badges on left */}
              <div className="mt-2.5">
                {!moodDone ? (
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-white/80 bg-white/10 border border-white/15 px-3 py-1.5 rounded-full">
                    <Heart className="w-3 h-3" /> How are you feeling today?
                  </span>
                ) : (
                  <span className="text-[10px] text-green-200 font-semibold">✓ Mood submitted! Have a great day.</span>
                )}
              </div>
            </div>

            {/* Right: Clock + Check-in top, Emojis bottom */}
            <div className="flex flex-col items-end gap-3 flex-shrink-0">
              {/* Clock + Check In — same row */}
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-2xl font-black text-white tracking-tight">{timeStr}</p>
                  <p className="text-[10px] text-white/70">{dateStr}</p>
                </div>
                {checkedOut ? (
                  <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-green-600 rounded-full text-xs font-bold shadow-sm border border-green-200">
                    <CheckCircle2 className="w-4 h-4" /> Day Complete ✓
                  </span>
                ) : checkedIn ? (
                  <button onClick={startCamera} disabled={checkLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-red-600 rounded-full text-xs font-bold shadow-sm border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-60">
                    <LogOut className="w-4 h-4" /> Check Out
                  </button>
                ) : (
                  <button onClick={startCamera} disabled={checkLoading}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white text-indigo-700 rounded-full text-xs font-bold shadow-sm hover:bg-blue-50 transition-colors disabled:opacity-60">
                    <Clock className="w-4 h-4" /> Check In
                  </button>
                )}
              </div>
              {/* Emojis row — right-aligned, hidden after mood submitted */}
              {!moodDone && (
                <div className="flex items-center gap-3 mr-8">
                  {MOODS.map(m => (
                    <div key={m.value} className="flex flex-col items-center">
                      <button onClick={() => handleMood(m.value)} disabled={moodSubmitting}
                        className="text-3xl hover:scale-125 transition-transform">
                        {m.emoji}
                      </button>
                      <span className="text-[8px] text-white/60 font-medium mt-1">{m.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {moodDone && (
                <span className="text-[10px] text-white font-semibold bg-white/20 border border-white/30 px-3 py-1.5 rounded-full">✓ Mood logged</span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Check-in toast */}
        {checkToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 text-white text-xs font-semibold px-5 py-3 rounded-xl shadow-lg">
            {checkToast}
          </div>
        )}

        {/* Camera Modal for Check-in */}
        {showCamera && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowCamera(false); if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }}>
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
                <div><h3 className="text-sm font-bold text-white">{checkedIn ? "Check Out" : "Check In"}</h3><p className="text-[10px] text-blue-100">Take a selfie to confirm attendance</p></div>
                <button onClick={() => { setShowCamera(false); if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()); }} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><span className="text-white text-sm">✕</span></button>
              </div>
              <div className="p-5 space-y-4">
                {!capturedPhoto ? (
                  <>
                    <div className="rounded-xl overflow-hidden bg-black aspect-[4/3]">
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    </div>
                    <button onClick={capturePhoto} className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" /> Capture Photo
                    </button>
                  </>
                ) : (
                  <>
                    <div className="rounded-xl overflow-hidden aspect-[4/3]">
                      <img src={capturedPhoto} alt="Selfie" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setCapturedPhoto(null); startCamera(); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50">Retake</button>
                      <button onClick={doCheckIn} disabled={checkLoading} className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                        {checkLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : checkedIn ? <LogOut className="w-3.5 h-3.5" /> : <LogIn className="w-3.5 h-3.5" />} {checkedIn ? "Confirm Check Out" : "Confirm Check In"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── KPI Cards ──────────────────────────────────────────── */}
        <motion.div initial="hidden" animate="visible" variants={stagger}
          className={`grid grid-cols-2 ${isTeamLead ? "lg:grid-cols-6" : "lg:grid-cols-4"} gap-3`}>
          {[
            { label: "Tasks Assigned", value: myWork.assigned_to_me ?? 0, sub: `${myWork.overdue || 0} Due Today`, icon: ListTodo, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { label: "Overdue", value: myWork.overdue ?? 0, sub: myWork.overdue > 0 ? "Needs Attention" : "All clear!", icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-500", subColor: myWork.overdue > 0 ? "text-red-500" : "text-green-500" },
            { label: "Done This Week", value: myWork.completed_this_week ?? 0, sub: myWork.completed_this_week > 0 ? "Great going! 🎉" : "", icon: CheckCircle2, iconBg: "bg-green-50", iconColor: "text-green-600" },
            { label: "Present Days", value: myAttendance.present_this_month ?? 0, sub: "This Month", icon: CalendarCheck, iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
            ...(isTeamLead ? [
              { label: "Team Members", value: teamSummary.total_members ?? 0, sub: "", icon: Users, iconBg: "bg-purple-50", iconColor: "text-purple-600" },
              { label: "Approvals", value: pendingApprovals.total ?? 0, sub: `${pendingApprovals.timesheets || 0} timesheets`, icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
            ] : []),
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={i} variants={fadeUp}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-xl ${kpi.iconBg} flex items-center justify-center mb-2.5`}>
                  <Icon className={`w-4.5 h-4.5 ${kpi.iconColor}`} />
                </div>
                <p className="text-xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">{kpi.label}</p>
                {kpi.sub && <p className={`text-[9px] mt-0.5 font-semibold ${kpi.subColor || "text-slate-400"}`}>{kpi.sub}</p>}
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── Row: Work Items + Timesheets + Holidays ──────────────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* My Work Items */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">My Work Items</h3>
              <Link href="/org/employee/work/my-tasks" className="text-[10px] font-bold text-brand-600 hover:underline">View All Tasks</Link>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={workChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 11 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {workChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Timesheets */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Timesheets</h3>
              <Link href="/org/employee/work/timesheets" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="relative">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={tsData} innerRadius={38} outerRadius={55} dataKey="value" startAngle={90} endAngle={-270}>
                      <Cell fill="#6366f1" />
                      <Cell fill="#e2e8f0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-black text-indigo-600">{tsTotal}</p>
                    <p className="text-[8px] text-slate-400">Total Entries</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Submitted</p>
                    <p className="text-[10px] text-slate-400">{tsSubmitted} ({tsTotal > 0 ? Math.round((tsSubmitted/tsTotal)*100) : 0}%)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-200" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Pending</p>
                    <p className="text-[10px] text-slate-400">{tsPending} ({tsTotal > 0 ? Math.round((tsPending/tsTotal)*100) : 0}%)</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upcoming Holidays */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Upcoming Holidays</h3>
              <Link href="/org/employee/leaves/overview" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
            </div>
            {upcomingHolidays.length === 0 ? (
              <div className="py-6 text-center"><CalendarCheck className="w-6 h-6 text-slate-200 mx-auto mb-2" /><p className="text-[10px] text-slate-400">No upcoming holidays</p></div>
            ) : (
              <div className="space-y-2.5">
                {upcomingHolidays.slice(0, 5).map((h, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🎉</span>
                      <p className="text-xs font-semibold text-slate-800">{h.name}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{formatDate(h.date, { day: "numeric", month: "short" })}</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Row: Attendance + Leave Balance + Notifications ──────── */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* My Attendance (This Month) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">My Attendance (This Month)</h3>
              <Link href="/org/employee/attendance" className="text-[10px] font-bold text-brand-600 hover:underline">View Details</Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Present", value: myAttendance.present_this_month ?? 0, suffix: " Days", color: "text-green-600", ring: "border-green-400" },
                { label: "Absent", value: myAttendance.absent ?? 0, suffix: " Days", color: "text-red-500", ring: "border-red-400" },
                { label: "Late", value: myAttendance.late ?? 0, suffix: " Days", color: "text-amber-500", ring: "border-amber-400" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className={`w-14 h-14 rounded-full border-4 ${item.ring} flex items-center justify-center mx-auto mb-2`}>
                    <span className={`text-sm font-black ${item.color}`}>{item.value > 0 && myAttendance.present_this_month > 0 ? Math.round((item.value / (myAttendance.present_this_month + (myAttendance.absent||0) + (myAttendance.late||0))) * 100) : 0}%</span>
                  </div>
                  <p className={`text-xs font-bold ${item.color}`}>{item.label}</p>
                  <p className="text-[10px] text-slate-400">{item.value}{item.suffix}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Leave Balance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Leave Balance</h3>
              <Link href="/org/employee/leaves/overview" className="text-[10px] font-bold text-brand-600 hover:underline">Apply Leave</Link>
            </div>
            {Object.keys(leaveBalance).length === 0 ? (
              <div className="py-4 text-center"><p className="text-[10px] text-slate-400">No leave types configured</p></div>
            ) : (
              <div className="space-y-3">
                {Object.entries(leaveBalance).map(([type, remaining]) => {
                  const total = type === "CL" ? 12 : type === "SL" ? 12 : type === "EL" ? 15 : 12;
                  const pct = Math.min(100, ((remaining || 0) / total) * 100);
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{type}</span>
                        <span className="text-[10px] text-slate-500 font-medium">{remaining}/{total} left</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${pct > 50 ? "bg-green-400" : pct > 25 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Recent Notifications / Announcements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900">Notifications</h3>
              <Link href="/org/employee/announcements" className="text-[10px] font-bold text-brand-600 hover:underline">View All</Link>
            </div>
            {recentNotifs.length === 0 ? (
              <div className="py-6 text-center"><Bell className="w-6 h-6 text-slate-200 mx-auto mb-2" /><p className="text-[10px] text-slate-400">No notifications</p></div>
            ) : (
              <div className="space-y-0 divide-y divide-slate-50">
                {recentNotifs.slice(0, 5).map((n, i) => (
                  <div key={i} className="flex items-start gap-2.5 py-2.5">
                    <span className="text-sm flex-shrink-0 mt-0.5">
                      {n.category === "work_item" ? "🔧" : n.category === "leave" ? "🌴" : n.category === "attendance" ? "📅" : "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{n.title}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* ─── Team Lead Sections ──────────────────────────────────── */}
        {isTeamLead && (
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Team Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900">Team Summary</h3>
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">{teamSummary.total_members ?? 0} members</span>
                </div>
                <Link href="/org/employee/work/team-tasks" className="text-[10px] font-bold text-brand-600 hover:underline">View</Link>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "To Do", value: teamSummary.todo ?? 0, bg: "bg-slate-50", color: "text-slate-700" },
                  { label: "In Progress", value: teamSummary.in_progress ?? 0, bg: "bg-blue-50", color: "text-blue-700" },
                  { label: "Blocked", value: teamSummary.blocked ?? 0, bg: "bg-red-50", color: "text-red-700" },
                  { label: "Done", value: teamSummary.done_this_week ?? 0, bg: "bg-green-50", color: "text-green-700" },
                ].map((item, i) => (
                  <div key={i} className={`${item.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-lg font-black ${item.color}`}>{item.value}</p>
                    <p className="text-[9px] text-slate-500 font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
              {(pendingApprovals.total ?? 0) > 0 && (
                <Link href="/org/employee/work/approve-sheets">
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-amber-50/50 border border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-slate-700 flex-1">{pendingApprovals.timesheets ?? 0} timesheets pending your approval</p>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </Link>
              )}
            </motion.div>

            {/* Team Activity */}
            {recentActivity.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-brand-500" /> Team Activity
                </h3>
                <div className="space-y-0 divide-y divide-slate-100">
                  {recentActivity.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{item.module === "timesheet" ? "⏱️" : item.module === "work" ? "🔧" : "📋"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700">{item.description}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ─── Quick Links ─────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-3">Quick Links</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {[
              { label: "My Tasks", href: "/org/employee/work/my-tasks", icon: ClipboardList, color: "bg-blue-50 text-blue-600" },
              { label: "Leaves", href: "/org/employee/leaves/overview", icon: CalendarCheck, color: "bg-green-50 text-green-600" },
              { label: "Attendance", href: "/org/employee/attendance", icon: Clock, color: "bg-amber-50 text-amber-600" },
              { label: "Timesheets", href: "/org/employee/work/timesheets", icon: ListTodo, color: "bg-indigo-50 text-indigo-600" },
              { label: "Documents", href: "/org/employee/documents/my-docs", icon: FileText, color: "bg-purple-50 text-purple-600" },
              { label: "Payslips", href: "/org/employee/payslips", icon: Wallet, color: "bg-emerald-50 text-emerald-600" },
            ].map((link, i) => {
              const Icon = link.icon;
              return (
                <Link key={i} href={link.href}>
                  <div className={`${link.color} rounded-xl p-3 text-center hover:shadow-sm hover:scale-[1.02] transition-all cursor-pointer`}>
                    <Icon className="w-[18px] h-[18px] mx-auto mb-1.5" />
                    <p className="text-[10px] font-bold">{link.label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
