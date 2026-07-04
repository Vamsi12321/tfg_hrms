"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Clock, Wallet, TrendingUp, AlertTriangle,
  Heart, BarChart3, ArrowUpRight, ArrowDownRight,
  CalendarCheck, ListTodo, RefreshCw
} from "lucide-react";
import TopBar from "@/components/TopBar";
import { useAnalyticsDashboard, useInvalidate } from "@/lib/queries";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

const fmt = (v) => `₹${(v/100000).toFixed(1)}L`;

const STATUS_COLORS = {
  todo: "#94a3b8", in_progress: "#3b82f6", review: "#f59e0b",
  blocked: "#ef4444", done: "#22c55e", closed: "#475569",
};

const MOOD_COLORS = {
  great: "#22c55e", good: "#3b82f6", okay: "#f59e0b",
  low: "#f97316", terrible: "#ef4444",
};

export default function AnalyticsPage() {
  const invalidate = useInvalidate();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { data, isLoading } = useAnalyticsDashboard({
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
  });

  if (isLoading) return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Analytics" />
      <div className="p-12 flex justify-center"><div className="w-10 h-10 border-2 border-brand-200 border-t-brand-600 rounded-full animate-spin"/></div>
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Analytics" />
      <div className="p-12 text-center"><BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3"/><p className="text-sm text-slate-400">Analytics data not available</p></div>
    </div>
  );

  const { kpis, attendance_trend, leave_utilization, department_headcount, work_items_by_status, payroll_trend, mood_distribution, overdue_items } = data;

  // Prepare pie data
  const workItemsPie = work_items_by_status ? Object.entries(work_items_by_status).filter(([,v])=>v>0).map(([k,v])=>({ name:k.replace("_"," "), value:v, color:STATUS_COLORS[k]||"#94a3b8" })) : [];
  const moodPie = mood_distribution ? Object.entries(mood_distribution).filter(([,v])=>v>0).map(([k,v])=>({ name:k, value:v, color:MOOD_COLORS[k]||"#94a3b8" })) : [];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Analytics" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Header + Date Range */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Organization Analytics</h2>
            <p className="text-xs text-slate-500">{fromDate && toDate ? `${fromDate} → ${toDate}` : "Last 7 days (default)"}</p>
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400"/>
            <span className="text-slate-300 text-xs">→</span>
            <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white outline-none focus:border-brand-400"/>
            {(fromDate||toDate)&&<button onClick={()=>{setFromDate("");setToDate("");}} className="text-[10px] text-slate-400 hover:text-red-500 font-bold">Clear</button>}
            <button onClick={()=>invalidate("analytics-dashboard")} className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-50">
              <RefreshCw className="w-4 h-4 text-slate-500"/>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        {kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label:"Employees",     value:kpis.active_employees||kpis.total_employees, icon:Users,         color:"text-brand-600",  bg:"bg-brand-50"   },
              { label:"Present Today", value:kpis.today_present,                         icon:CalendarCheck,  color:"text-green-600",  bg:"bg-green-50"   },
              { label:"Pending Leaves", value:kpis.pending_leaves,                       icon:Clock,          color:"text-amber-600",  bg:"bg-amber-50"   },
              { label:"Net Payroll",   value:kpis.this_month_payroll_net?fmt(kpis.this_month_payroll_net):"—", icon:Wallet, color:"text-indigo-600", bg:"bg-indigo-50" },
              { label:"Open Tasks",    value:kpis.open_work_items,                       icon:ListTodo,       color:"text-purple-600", bg:"bg-purple-50"  },
              { label:"Wellness",      value:kpis.wellness_score?`${kpis.wellness_score}/5`:"—", icon:Heart, color:"text-emerald-600",bg:"bg-emerald-50" },
            ].map((kpi,i)=>{
              const Icon = kpi.icon;
              return (
                <motion.div key={i} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                  <div className={`w-8 h-8 rounded-xl ${kpi.bg} flex items-center justify-center mb-2`}>
                    <Icon className={`w-4 h-4 ${kpi.color}`}/>
                  </div>
                  <p className="text-xl font-black text-slate-900">{kpi.value ?? "—"}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{kpi.label}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Row 1: Attendance Trend + Payroll Trend (side by side) */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Attendance Trend */}
          {attendance_trend && attendance_trend.length > 0 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={attendance_trend}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#94a3b8"}} tickFormatter={v=>new Date(v).toLocaleDateString("en-IN",{day:"numeric",month:"short"})}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#94a3b8"}}/>
                  <Tooltip contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",fontSize:12}}/>
                  <Area type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={2} fill="url(#colorPresent)" name="Present"/>
                  <Area type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} fillOpacity={0} name="Absent"/>
                  <Area type="monotone" dataKey="late" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} name="Late"/>
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Payroll Trend */}
          {payroll_trend && payroll_trend.length > 0 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.25}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Payroll Trend (Net)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={payroll_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#94a3b8"}}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#94a3b8"}} tickFormatter={v=>v>0?`₹${(v/100000).toFixed(0)}L`:"0"}/>
                  <Tooltip contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",fontSize:11}} formatter={v=>[v>0?`₹${(v/100000).toFixed(1)}L`:"₹0","Net Pay"]}/>
                  <Line type="monotone" dataKey="net" stroke="#8b5cf6" strokeWidth={2.5} dot={{fill:"#8b5cf6",r:4}}/>
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Row 2: Leave Utilization + Mood Distribution (bar chart) */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Leave Utilization */}
          {leave_utilization && leave_utilization.length > 0 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Leave Utilization</h3>
              <div className="space-y-4">
                {leave_utilization.map((l,i)=>(
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{l.code}</span>
                        <span className="text-xs font-semibold text-slate-700">{l.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">{l.used}/{l.total} · {l.percent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div initial={{width:0}} animate={{width:`${Math.min(l.percent,100)}%`}} transition={{delay:0.3+i*0.1,duration:0.7}}
                        className={`h-full rounded-full ${l.percent>=80?"bg-red-400":l.percent>=50?"bg-amber-400":"bg-brand-500"}`}/>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Mood Distribution — Bar Chart */}
          {mood_distribution && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.35}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Mood Distribution</h3>
              {moodPie.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name:"😊 Great",    value:mood_distribution.great||0,    fill:"#22c55e" },
                    { name:"🙂 Good",     value:mood_distribution.good||0,     fill:"#3b82f6" },
                    { name:"😐 Okay",     value:mood_distribution.okay||0,     fill:"#f59e0b" },
                    { name:"😔 Low",      value:mood_distribution.low||0,      fill:"#f97316" },
                    { name:"😫 Terrible", value:mood_distribution.terrible||0, fill:"#ef4444" },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#64748b"}}/>
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#94a3b8"}}/>
                    <Tooltip contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",fontSize:11}}/>
                    <Bar dataKey="value" radius={[6,6,0,0]} barSize={32}>
                      {[
                        { fill:"#22c55e" },{ fill:"#3b82f6" },{ fill:"#f59e0b" },{ fill:"#f97316" },{ fill:"#ef4444" },
                      ].map((entry,i)=><Cell key={i} fill={entry.fill}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px]"><p className="text-xs text-slate-400">No mood data yet</p></div>
              )}
            </motion.div>
          )}
        </div>

        {/* Row 3: Work Items Donut + Department Headcount */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Work Items by Status */}
          {workItemsPie.length > 0 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Work Items by Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={workItemsPie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                    {workItemsPie.map((entry,i)=><Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",fontSize:11}} formatter={(v,n)=>[v,n]}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11}}/>
                </PieChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Department Headcount */}
          {department_headcount && department_headcount.length > 0 && (
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.45}}
              className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Department Headcount</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={department_headcount} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false}/>
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#94a3b8"}}/>
                  <YAxis type="category" dataKey="department" axisLine={false} tickLine={false} tick={{fontSize:10,fill:"#64748b"}} width={80}/>
                  <Tooltip contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",fontSize:11}}/>
                  <Bar dataKey="count" fill="#6366f1" radius={[0,6,6,0]} barSize={18}/>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Overdue Work Items */}
        {overdue_items && overdue_items.length > 0 && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.5}}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500"/>
              <h3 className="text-sm font-bold text-slate-900">Overdue Work Items</h3>
              <span className="text-[9px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 ml-2">{overdue_items.length}</span>
            </div>
            <div className="divide-y divide-slate-50">
              {overdue_items.map((item,i)=>(
                <div key={item.id||i} className="flex items-center justify-between px-5 py-3 hover:bg-red-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-500">{item.assigned_to_name} · Due: {item.due_date}</p>
                  </div>
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 flex-shrink-0">
                    {item.days_overdue}d overdue
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
