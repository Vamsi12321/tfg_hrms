"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, AlertTriangle, AlertCircle, Info, Sparkles,
  RefreshCw, Users, Clock, ListTodo, Heart,
  Briefcase, Wallet, ChevronRight, Lightbulb
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { getAIInsights } from "@/lib/api";

const severityCfg = {
  critical: { color: "border-l-red-500",    bg: "bg-red-50/50",    badge: "bg-red-100 text-red-700 border-red-200",    icon: AlertTriangle, iconColor: "text-red-500",    label: "Critical" },
  warning:  { color: "border-l-amber-500",  bg: "bg-amber-50/30",  badge: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle,   iconColor: "text-amber-500",  label: "Warning"  },
  info:     { color: "border-l-blue-500",   bg: "bg-blue-50/30",   badge: "bg-blue-100 text-blue-700 border-blue-200",    icon: Info,          iconColor: "text-blue-500",   label: "Info"     },
  positive: { color: "border-l-green-500",  bg: "bg-green-50/30",  badge: "bg-green-100 text-green-700 border-green-200",  icon: Sparkles,      iconColor: "text-green-500",  label: "Positive" },
};

const categoryCfg = {
  attendance: { icon: Clock,     color: "bg-green-50 text-green-600 border-green-200"  },
  leave:      { icon: Clock,     color: "bg-amber-50 text-amber-600 border-amber-200"  },
  work:       { icon: ListTodo,  color: "bg-blue-50 text-blue-600 border-blue-200"     },
  wellness:   { icon: Heart,     color: "bg-pink-50 text-pink-600 border-pink-200"     },
  onboarding: { icon: Briefcase, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  payroll:    { icon: Wallet,    color: "bg-purple-50 text-purple-600 border-purple-200" },
  team:       { icon: Users,     color: "bg-teal-50 text-teal-600 border-teal-200"     },
};

const CATEGORIES = ["attendance","leave","work","wellness","onboarding","payroll","team"];

export default function AIInsightsPage() {
  const [insights, setInsights] = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [catFilter, setCatFilter] = useState("");
  const [sevFilter, setSevFilter] = useState("");

  const fetchInsights = async () => {
    setLoading(true);
    const params = {};
    if (catFilter) params.category = catFilter;
    if (sevFilter) params.severity = sevFilter;
    const res = await getAIInsights(params);
    if (res.ok && res.data) {
      setInsights(res.data.insights || []);
      setSummary(res.data.summary || null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchInsights(); }, [catFilter, sevFilter]);

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="AI Insights" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Hero */}
        <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-700 p-6 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"/>
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <motion.div animate={{rotate:[0,5,-5,0]}} transition={{duration:4,repeat:Infinity}}>
                <Brain className="w-8 h-8 text-purple-200"/>
              </motion.div>
              <div>
                <h2 className="text-xl font-bold">AI Insights</h2>
                <p className="text-purple-200 text-xs mt-0.5">Rules-based intelligence across all modules</p>
              </div>
            </div>
            <button onClick={fetchInsights} className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-sm font-semibold transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/> Refresh
            </button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key:"critical", value:summary.critical, color:"text-red-600",    bg:"bg-red-50",    border:"border-red-200",   icon:"🔴" },
              { key:"warning",  value:summary.warning,  color:"text-amber-600",  bg:"bg-amber-50",  border:"border-amber-200", icon:"🟡" },
              { key:"info",     value:summary.info,     color:"text-blue-600",   bg:"bg-blue-50",   border:"border-blue-200",  icon:"🔵" },
              { key:"positive", value:summary.positive, color:"text-green-600",  bg:"bg-green-50",  border:"border-green-200", icon:"🟢" },
            ].map((s,i)=>(
              <motion.button key={s.key} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                onClick={()=>setSevFilter(sevFilter===s.key?"":s.key)}
                className={`p-4 rounded-2xl border text-center transition-all ${sevFilter===s.key?"ring-2 ring-brand-300 shadow-md":""} ${s.bg} ${s.border}`}>
                <p className="text-lg mb-0.5">{s.icon}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value||0}</p>
                <p className="text-[10px] text-slate-500 capitalize mt-0.5">{s.key}</p>
              </motion.button>
            ))}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={()=>setCatFilter("")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${!catFilter?"bg-brand-600 text-white border-brand-600 shadow-md":"bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
            All
          </button>
          {CATEGORIES.map(cat=>{
            const cfg = categoryCfg[cat];
            const Icon = cfg?.icon || Brain;
            return (
              <button key={cat} onClick={()=>setCatFilter(catFilter===cat?"":cat)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all border capitalize ${catFilter===cat?"bg-brand-600 text-white border-brand-600 shadow-md":"bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                <Icon className="w-3.5 h-3.5"/> {cat}
              </button>
            );
          })}
        </div>

        {/* Insights List */}
        {loading ? (
          <div className="p-12 flex justify-center"><div className="w-8 h-8 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
        ) : insights.length === 0 ? (
          <motion.div initial={{opacity:0}} animate={{opacity:1}}
            className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm text-center">
            <Brain className="w-12 h-12 text-slate-200 mx-auto mb-3"/>
            <p className="text-sm font-semibold text-slate-400">No insights for the current filter</p>
            <p className="text-xs text-slate-400 mt-1">Try a different category or check back later</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight, i) => {
              const sev = severityCfg[insight.severity] || severityCfg.info;
              const cat = categoryCfg[insight.category];
              const SevIcon = sev.icon;
              const CatIcon = cat?.icon || Brain;

              return (
                <motion.div key={insight.id||i} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden border-l-4 ${sev.color}`}>
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${sev.bg}`}>
                        <SevIcon className={`w-4 h-4 ${sev.iconColor}`}/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{insight.title}</h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${sev.badge}`}>{sev.label}</span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${cat?.color||"bg-slate-50 text-slate-500 border-slate-200"}`}>
                            {insight.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{insight.message}</p>

                        {/* Suggestion */}
                        {insight.suggestion && (
                          <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl bg-brand-50/50 border border-brand-100">
                            <Lightbulb className="w-3.5 h-3.5 text-brand-500 flex-shrink-0 mt-0.5"/>
                            <p className="text-[11px] text-brand-800 leading-relaxed">{insight.suggestion}</p>
                          </div>
                        )}

                        {/* Meta */}
                        <div className="flex items-center gap-3 mt-3 flex-wrap">
                          {insight.affected_employees && insight.affected_employees.length > 0 && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Users className="w-3 h-3"/> {insight.affected_employees.length} employee{insight.affected_employees.length>1?"s":""}
                            </span>
                          )}
                          {insight.created_at && (
                            <span className="text-[10px] text-slate-400">
                              {new Date(insight.created_at).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric",timeZone:"Asia/Kolkata"})}
                            </span>
                          )}
                          {insight.priority && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${insight.priority==="high"?"bg-red-50 text-red-600 border border-red-200":insight.priority==="medium"?"bg-amber-50 text-amber-600 border border-amber-200":"bg-slate-50 text-slate-500 border border-slate-200"}`}>
                              {insight.priority} priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
