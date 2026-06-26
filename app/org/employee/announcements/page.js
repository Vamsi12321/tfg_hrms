"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Megaphone, Pin, X, CheckCircle2, AlertCircle, Search } from "lucide-react";
import TopBar from "@/components/TopBar";
import { listAnnouncements, getAnnouncementDetail, markAnnouncementRead } from "@/lib/api";

export default function MyAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => { fetchAnnouncements(); }, [typeFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const params = { limit: 50 };
    if (typeFilter) params.type = typeFilter;
    const res = await listAnnouncements(params);
    if (res.ok && res.data) setAnnouncements(res.data.announcements || []);
    setLoading(false);
  };

  const handleOpen = async (ann) => {
    const res = await getAnnouncementDetail(ann.id);
    if (res.ok && res.data) {
      setSelectedAnn(res.data);
      // Mark as read locally
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_read: true } : a));
    } else {
      setSelectedAnn(ann);
    }
  };

  const filtered = announcements.filter(a => {
    if (!search) return true;
    return a.title?.toLowerCase().includes(search.toLowerCase()) || a.content?.toLowerCase().includes(search.toLowerCase());
  });

  const pinned = filtered.filter(a => a.is_pinned);
  const regular = filtered.filter(a => !a.is_pinned);

  const typeCfg = {
    general: { cls: "bg-slate-100 text-slate-600", label: "General" },
    urgent: { cls: "bg-red-100 text-red-700", label: "Urgent" },
    event: { cls: "bg-purple-100 text-purple-700", label: "Event" },
    policy: { cls: "bg-blue-100 text-blue-700", label: "Policy" },
    celebration: { cls: "bg-amber-100 text-amber-700", label: "Celebration" },
  };

  const priorityCfg = {
    high: "border-l-red-500",
    normal: "border-l-brand-500",
    low: "border-l-slate-300",
  };

  if (loading) return (
    <div className="min-h-screen bg-surface-100 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Announcements" />

      <div className="p-6 space-y-5">
        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search announcements..."
              className="bg-transparent text-xs outline-none w-40 text-slate-700" />
          </div>
          <div className="flex gap-1">
            {[{ key: "", label: "All" }, { key: "urgent", label: "Urgent" }, { key: "event", label: "Events" }, { key: "policy", label: "Policy" }, { key: "celebration", label: "Celebrations" }].map(t => (
              <button key={t.key} onClick={() => setTypeFilter(t.key)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${typeFilter === t.key ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><Pin className="w-3 h-3" /> Pinned</h3>
            {pinned.map((ann, i) => (
              <AnnouncementCard key={ann.id || i} ann={ann} typeCfg={typeCfg} priorityCfg={priorityCfg} onClick={() => handleOpen(ann)} />
            ))}
          </div>
        )}

        {/* Regular */}
        <div className="space-y-3">
          {pinned.length > 0 && <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent</h3>}
          {regular.length === 0 && pinned.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
              <Megaphone className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No announcements yet</p>
            </div>
          ) : regular.map((ann, i) => (
            <AnnouncementCard key={ann.id || i} ann={ann} typeCfg={typeCfg} priorityCfg={priorityCfg} onClick={() => handleOpen(ann)} />
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAnn && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnn(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${(typeCfg[selectedAnn.type] || typeCfg.general).cls}`}>
                      {(typeCfg[selectedAnn.type] || typeCfg.general).label}
                    </span>
                    {selectedAnn.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedAnn.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    By {selectedAnn.created_by_name || "HR"} • {selectedAnn.created_at ? new Date(selectedAnn.created_at).toLocaleDateString() : ""}
                  </p>
                </div>
                <button onClick={() => setSelectedAnn(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="p-6">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedAnn.content}</p>
                {selectedAnn.expires_at && (
                  <p className="text-[10px] text-slate-400 mt-4">Expires: {selectedAnn.expires_at}</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnnouncementCard({ ann, typeCfg, priorityCfg, onClick }) {
  const tc = typeCfg[ann.type] || typeCfg.general;
  const pc = priorityCfg[ann.priority] || priorityCfg.normal;
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-100 border-l-4 ${pc} shadow-sm hover:shadow-md transition-all cursor-pointer`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tc.cls}`}>{tc.label}</span>
            {ann.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
            {!ann.is_read && <span className="w-2 h-2 rounded-full bg-brand-500" />}
          </div>
          <h4 className={`text-sm ${ann.is_read ? "font-medium text-slate-700" : "font-bold text-slate-900"}`}>{ann.title}</h4>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ann.content}</p>
          <p className="text-[10px] text-slate-400 mt-2">
            {ann.created_by_name || "HR"} • {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ""}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
