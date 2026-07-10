"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Pin, X, Search, Bell, Calendar,
  AlertTriangle, PartyPopper, Sparkles, Clock, ChevronRight,
  User, ExternalLink
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { listAnnouncements, getAnnouncementDetail, markAnnouncementRead } from "@/lib/api";

const typeCfg = {
  general:     { cls:"bg-slate-100 text-slate-600",  icon:Megaphone,    gradient:"from-slate-500 to-slate-600",    lightBg:"bg-slate-50"    },
  urgent:      { cls:"bg-red-100 text-red-700",       icon:AlertTriangle,gradient:"from-red-500 to-rose-600",      lightBg:"bg-red-50"      },
  event:       { cls:"bg-purple-100 text-purple-700", icon:Calendar,     gradient:"from-purple-500 to-indigo-600", lightBg:"bg-purple-50"   },
  policy:      { cls:"bg-blue-100 text-blue-700",     icon:Sparkles,     gradient:"from-blue-500 to-cyan-600",     lightBg:"bg-blue-50"     },
  celebration: { cls:"bg-amber-100 text-amber-700",   icon:PartyPopper,  gradient:"from-amber-500 to-orange-500",  lightBg:"bg-amber-50"    },
};

export default function MyAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnn, setSelectedAnn] = useState(null);
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => { fetchAnnouncements(); }, [typeFilter]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const params = { limit: 100 };
    if (typeFilter) params.type = typeFilter;
    const res = await listAnnouncements(params);
    if (res.ok && res.data) setAnnouncements(res.data.announcements || []);
    setLoading(false);
  };

  const handleOpen = async (ann) => {
    const res = await getAnnouncementDetail(ann.id);
    if (res.ok && res.data) {
      setSelectedAnn(res.data);
      setAnnouncements(prev => prev.map(a => a.id === ann.id ? { ...a, is_read: true } : a));
      // Mark read in background
      markAnnouncementRead(ann.id);
    } else {
      setSelectedAnn(ann);
    }
  };

  const filtered = announcements.filter(a =>
    !search || a.title?.toLowerCase().includes(search.toLowerCase()) || a.content?.toLowerCase().includes(search.toLowerCase())
  );
  const unreadCount = announcements.filter(a => !a.is_read).length;
  const pinned = filtered.filter(a => a.is_pinned);
  const regular = filtered.filter(a => !a.is_pinned);

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Announcements" />

      <div className="p-4 md:p-6 space-y-5">
        {/* Header with stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Announcements</h2>
            <p className="text-xs text-slate-500">
              {announcements.length} total{unreadCount > 0 && <span className="text-brand-600 font-bold"> · {unreadCount} unread</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-brand-400 w-56">
              <Search className="w-3.5 h-3.5 text-slate-400"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
                className="bg-transparent text-xs outline-none w-full text-slate-700 placeholder:text-slate-400"/>
            </div>
          </div>
        </div>

        {/* Type Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[{key:"",label:"All",count:filtered.length},{key:"urgent",label:"🔴 Urgent"},{key:"event",label:"📅 Events"},{key:"policy",label:"📋 Policy"},{key:"celebration",label:"🎉 Celebrations"},{key:"general",label:"📢 General"}].map(t=>(
            <button key={t.key} onClick={()=>setTypeFilter(t.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${typeFilter===t.key?"bg-brand-600 text-white shadow-md shadow-brand-500/20":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/>
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Megaphone className="w-8 h-8 text-slate-200"/>
            </div>
            <p className="text-sm font-bold text-slate-700 mb-1">{search?"No results found":"No announcements yet"}</p>
            <p className="text-xs text-slate-400">{search?"Try a different search term":"Your HR team will post updates here"}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {/* Pinned Section */}
            {pinned.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Pin className="w-3.5 h-3.5 text-amber-500"/>
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Pinned</span>
                  <div className="flex-1 h-px bg-amber-100"/>
                </div>
                {pinned.map((ann,i)=>(
                  <AnnouncementCard key={ann.id||i} ann={ann} delay={i*0.05} onClick={()=>handleOpen(ann)}/>
                ))}
              </div>
            )}

            {/* Regular */}
            {regular.length > 0 && (
              <div className="space-y-3">
                {pinned.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400"/>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Recent</span>
                    <div className="flex-1 h-px bg-slate-100"/>
                  </div>
                )}
                {regular.map((ann,i)=>(
                  <AnnouncementCard key={ann.id||i} ann={ann} delay={(pinned.length+i)*0.03} onClick={()=>handleOpen(ann)}/>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAnn && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={()=>setSelectedAnn(null)}>
            <motion.div
              initial={{opacity:0, y:60}} animate={{opacity:1, y:0}} exit={{opacity:0, y:60}}
              transition={{type:"spring",damping:28,stiffness:320}}
              onClick={e=>e.stopPropagation()}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Gradient Header */}
              {(()=>{
                const tc = typeCfg[selectedAnn.type]||typeCfg.general;
                const Icon = tc.icon;
                return (
                  <div className={`bg-gradient-to-r ${tc.gradient} px-6 pt-5 pb-6 relative overflow-hidden flex-shrink-0`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"/>
                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                            <Icon className="w-5 h-5 text-white"/>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-white/80 uppercase tracking-wider">{tc.cls.split(" ")[1]?.replace("text-","")?.replace("-700","")?.replace("-600","") || selectedAnn.type}</span>
                            {selectedAnn.is_pinned && <Pin className="w-3 h-3 text-yellow-300 inline ml-1.5"/>}
                          </div>
                        </div>
                        <button onClick={()=>setSelectedAnn(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                          <X className="w-4 h-4 text-white"/>
                        </button>
                      </div>
                      <h2 className="text-xl font-bold text-white leading-tight">{selectedAnn.title}</h2>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-white/70"/>
                          <span className="text-[10px] font-medium text-white/80">{selectedAnn.created_by_name||"HR Team"}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-white/70"/>
                          <span className="text-[10px] font-medium text-white/80">{selectedAnn.created_at?new Date(selectedAnn.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"}):""}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedAnn.content}</p>
                {selectedAnn.target_departments?.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">For Departments</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAnn.target_departments.map(d=>(
                        <span key={d} className="text-[10px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 px-2.5 py-1 rounded-full">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedAnn.expires_at && (
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3"/>
                    <span>Expires: {new Date(selectedAnn.expires_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AnnouncementCard({ ann, delay = 0, onClick }) {
  const tc = typeCfg[ann.type] || typeCfg.general;
  const Icon = tc.icon;
  const isUnread = !ann.is_read;
  const timeAgo = ann.created_at ? getTimeAgo(new Date(ann.created_at)) : "";

  return (
    <motion.div
      initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{delay}}
      whileHover={{y:-2, boxShadow:"0 8px 25px -5px rgba(0,0,0,0.08)"}}
      onClick={onClick}
      className={`relative bg-white rounded-2xl p-5 border shadow-sm transition-all cursor-pointer group overflow-hidden ${isUnread?"border-brand-100":"border-slate-100"}`}>
      {/* Unread indicator */}
      {isUnread && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-brand-500 to-indigo-500"/>
      )}
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`w-11 h-11 rounded-xl ${tc.lightBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={`w-5 h-5 ${tc.cls.split(" ")[1]}`}/>
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${tc.cls}`}>{(typeCfg[ann.type]||typeCfg.general).cls.includes("red")?"Urgent":ann.type?.charAt(0).toUpperCase()+ann.type?.slice(1)||"General"}</span>
            {ann.is_pinned && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-0.5"><Pin className="w-2.5 h-2.5"/>Pinned</span>}
            {ann.priority==="high"&&<span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">HIGH</span>}
            {isUnread && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"/></span>}
          </div>
          <h4 className={`text-sm leading-snug ${isUnread?"font-bold text-slate-900":"font-medium text-slate-700"}`}>{ann.title}</h4>
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{ann.content}</p>
          <div className="flex items-center gap-3 mt-3">
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><User className="w-3 h-3"/>{ann.created_by_name||"HR"}</span>
            <span className="text-[10px] text-slate-400">{timeAgo}</span>
          </div>
        </div>
        {/* Arrow */}
        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-1"/>
      </div>
    </motion.div>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day:"numeric", month:"short" });
}
