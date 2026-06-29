"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, TrendingUp, CheckCircle2, AlertCircle, Flame } from "lucide-react";
import TopBar from "@/components/TopBar";
import { submitMood, enrollInProgram, unenrollFromProgram } from "@/lib/api";
import { useMoodHistory, useWellnessPrograms, useInvalidate } from "@/lib/queries";

const moods = [
  { score: 1, emoji: "😫", label: "Terrible", bg: "bg-red-50 hover:bg-red-100 border-red-200", activeBg: "bg-red-100 border-red-400 ring-2 ring-red-200" },
  { score: 2, emoji: "😔", label: "Low", bg: "bg-orange-50 hover:bg-orange-100 border-orange-200", activeBg: "bg-orange-100 border-orange-400 ring-2 ring-orange-200" },
  { score: 3, emoji: "😐", label: "Okay", bg: "bg-amber-50 hover:bg-amber-100 border-amber-200", activeBg: "bg-amber-100 border-amber-400 ring-2 ring-amber-200" },
  { score: 4, emoji: "🙂", label: "Good", bg: "bg-blue-50 hover:bg-blue-100 border-blue-200", activeBg: "bg-blue-100 border-blue-400 ring-2 ring-blue-200" },
  { score: 5, emoji: "😊", label: "Great", bg: "bg-green-50 hover:bg-green-100 border-green-200", activeBg: "bg-green-100 border-green-400 ring-2 ring-green-200" },
];

export default function MyWellnessPage() {
  const invalidate = useInvalidate();
  const { data: history, isLoading: historyLoading } = useMoodHistory(30);
  const { data: programs = [], isLoading: progsLoading } = useWellnessPrograms();
  const loading = historyLoading || progsLoading;

  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  const handleSubmit = async () => {
    if (!selectedMood) return;
    setSubmitting(true);
    const res = await submitMood({ score: selectedMood, note: note || undefined });
    if (res.ok) {
      setSubmitted(true);
      showToast("Mood logged! 🎉");
      invalidate("mood-history");
    } else {
      const msg = typeof res.data?.detail === "string" ? res.data.detail :
        Array.isArray(res.data?.detail) ? res.data.detail.map(e => e.msg).join(", ") :
        "Failed to submit";
      showToast(msg, "error");
    }
    setSubmitting(false);
  };

  const handleEnroll = async (programId) => {
    const res = await enrollInProgram(programId);
    if (res.ok) { showToast("Enrolled!"); invalidate("wellness-programs"); }
    else showToast("Failed", "error");
  };

  const handleUnenroll = async (programId) => {
    const res = await unenrollFromProgram(programId);
    if (res.ok) { showToast("Unenrolled"); invalidate("wellness-programs"); }
    else showToast("Failed", "error");
  };

  if (loading) return <div className="min-h-screen bg-surface-100 flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Wellness" />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl text-white text-sm font-semibold flex items-center gap-2 ${toast.type==="error"?"bg-red-500":"bg-green-500"}`}>
            {toast.type==="error" ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-6 space-y-6">

        {/* Mood Check-in Card */}
        <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          {!submitted ? (
            <div className="text-center max-w-md mx-auto">
              <h2 className="text-lg font-bold text-slate-900 mb-1">How are you feeling today?</h2>
              <p className="text-xs text-slate-500 mb-6">Your response is anonymous and helps improve workplace wellness.</p>

              {/* Selected mood label */}
              {selectedMood && (
                <motion.p initial={{ opacity:0, y:-5 }} animate={{ opacity:1, y:0 }}
                  className="text-sm font-bold text-slate-700 mb-3">
                  {moods.find(m => m.score === selectedMood)?.emoji} Feeling <span className="text-brand-600">{moods.find(m => m.score === selectedMood)?.label}</span>
                </motion.p>
              )}

              {/* Emoji Mood Selector */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {moods.map(mood => (
                  <motion.button key={mood.score}
                    whileHover={{ scale:1.15 }} whileTap={{ scale:0.9 }}
                    onClick={() => setSelectedMood(mood.score)}
                    className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl transition-all cursor-pointer ${
                      selectedMood === mood.score ? mood.activeBg : mood.bg
                    }`}>
                    {mood.emoji}
                  </motion.button>
                ))}
              </div>

              {/* Optional note */}
              {selectedMood && (
                <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} className="mb-4">
                  <textarea rows={2} value={note} onChange={e => setNote(e.target.value)}
                    placeholder="Add a note (optional)..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-brand-400 resize-none text-center" />
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={handleSubmit}
                disabled={!selectedMood || submitting}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-40 transition-all">
                {submitting ? "Saving..." : "Log Mood"}
              </motion.button>
            </div>
          ) : (
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }} className="text-center py-4">
              <span className="text-5xl mb-3 block">{moods.find(m=>m.score===selectedMood)?.emoji}</span>
              <h3 className="text-lg font-bold text-slate-900">Mood logged!</h3>
              <p className="text-xs text-slate-500 mt-1">Come back tomorrow to keep your streak going.</p>
              <button onClick={() => { setSubmitted(false); setSelectedMood(null); setNote(""); }}
                className="mt-3 text-xs text-brand-600 font-bold hover:underline">Update today&apos;s mood</button>
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        {history && (
          <div className="grid grid-cols-3 gap-4">
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-black text-brand-600">{history.average?.toFixed(1) || "—"}</p>
              <p className="text-[10px] text-slate-500">30-Day Average</p>
            </motion.div>
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <p className="text-2xl font-black text-orange-600">{history.streak || 0}</p>
              </div>
              <p className="text-[10px] text-slate-500">Day Streak</p>
            </motion.div>
            <motion.div initial={{ opacity:0, y:15 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm text-center">
              <p className="text-2xl font-black text-slate-700">{history.total_entries || 0}</p>
              <p className="text-[10px] text-slate-500">Total Entries</p>
            </motion.div>
          </div>
        )}

        {/* Mood History */}
        {history?.entries?.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Mood History</h3>
            <div className="flex flex-wrap gap-2">
              {history.entries.slice(0, 30).map((entry, i) => (
                <div key={i} className="text-center" title={`${entry.date}: ${entry.score}/5${entry.note ? ` — ${entry.note}` : ""}`}>
                  <span className="text-lg">{moods.find(m=>m.score===entry.score)?.emoji || "❓"}</span>
                  <p className="text-[8px] text-slate-400">{entry.date?.split("-").slice(1).join("/")}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Wellness Programs */}
        {programs.length > 0 && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Wellness Programs</h3>
            <div className="space-y-3">
              {programs.map((prog, i) => (
                <div key={prog.id||i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Heart className="w-5 h-5 text-emerald-500" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{prog.name}</p>
                    {prog.description && <p className="text-xs text-slate-500">{prog.description}</p>}
                    <p className="text-[10px] text-slate-400 mt-0.5">{prog.total_participants || 0} participants</p>
                  </div>
                  {prog.is_enrolled ? (
                    <button onClick={() => handleUnenroll(prog.id||prog._id)}
                      className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100">Leave</button>
                  ) : (
                    <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} onClick={() => handleEnroll(prog.id||prog._id)}
                      className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100">Join</motion.button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
