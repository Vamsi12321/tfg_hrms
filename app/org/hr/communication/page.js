"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, FileText, Settings, Send, Plus, Search, Eye, Pencil, Trash2,
  CheckCircle2, AlertCircle, Clock, XCircle, Users, User, ChevronDown,
  Copy, Save, X, Megaphone, BarChart3, Lock, Unlock
} from "lucide-react";
import TopBar from "@/components/TopBar";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 1, name: "Welcome Email",         slug: "welcome",          category: "Onboarding",  subject: "Welcome to {{company_name}}, {{employee_name}}!", variables: ["employee_name","company_name","joining_date","manager_name","department"] },
  { id: 2, name: "Leave Approved",        slug: "leave_approved",   category: "Leave",       subject: "Your {{leave_type}} leave has been approved", variables: ["employee_name","leave_type","from_date","to_date","days"] },
  { id: 3, name: "Leave Rejected",        slug: "leave_rejected",   category: "Leave",       subject: "Leave Request Update — {{leave_type}}", variables: ["employee_name","leave_type","from_date","to_date","reason"] },
  { id: 4, name: "Payslip Ready",         slug: "payslip",          category: "Payroll",     subject: "Your payslip for {{month}} {{year}} is ready", variables: ["employee_name","month","year","net_pay","company_name"] },
  { id: 5, name: "Birthday Wishes",       slug: "birthday",         category: "Events",      subject: "Happy Birthday, {{employee_name}}! 🎂", variables: ["employee_name","company_name"] },
  { id: 6, name: "Work Anniversary",      slug: "anniversary",      category: "Events",      subject: "Happy {{years}} Year Anniversary, {{employee_name}}! 🎉", variables: ["employee_name","years","company_name","joining_date"] },
  { id: 7, name: "Offer Letter",          slug: "offer_letter",     category: "Onboarding",  subject: "Your Offer Letter — {{company_name}}", variables: ["employee_name","designation","department","joining_date","ctc","company_name"] },
  { id: 8, name: "Promotion Notice",      slug: "promotion",        category: "HR",          subject: "Congratulations on your Promotion, {{employee_name}}!", variables: ["employee_name","old_designation","new_designation","effective_date","company_name"] },
  { id: 9, name: "Experience Letter",     slug: "experience_letter",category: "Exit",        subject: "Experience Letter — {{employee_name}}", variables: ["employee_name","designation","department","joining_date","last_day","company_name"] },
  { id: 10, name: "Relieving Letter",     slug: "relieving_letter", category: "Exit",        subject: "Relieving Letter — {{employee_name}}", variables: ["employee_name","designation","last_day","company_name"] },
  { id: 11, name: "Holiday Notice",       slug: "holiday_notice",   category: "Announcement",subject: "Holiday Notice: {{holiday_name}} on {{date}}", variables: ["holiday_name","date","company_name"] },
  { id: 12, name: "Asset Assigned",       slug: "asset_assigned",   category: "Assets",      subject: "Asset Assigned: {{asset_name}}", variables: ["employee_name","asset_name","asset_id","assigned_date","company_name"] },
];

const CAMPAIGNS = [
  { id: 1, name: "Diwali Wishes 2026",    audience: "All Employees", sent: 142, opened: 98,  status: "sent",      date: "2026-10-20" },
  { id: 2, name: "Q3 Holiday Notice",     audience: "All Employees", sent: 139, opened: 112, status: "sent",      date: "2026-09-15" },
  { id: 3, name: "Health Camp Notice",    audience: "Engineering",   sent: 45,  opened: 32,  status: "sent",      date: "2026-08-10" },
  { id: 4, name: "Office Closure — Aug",  audience: "All Employees", sent: 0,   opened: 0,   status: "draft",     date: "2026-07-20" },
  { id: 5, name: "Year-End Bonus Update", audience: "Finance",       sent: 0,   opened: 0,   status: "scheduled", date: "2026-12-24" },
];

const EMAIL_LOGS = [
  { id: 1, template: "welcome",        to: "raji raji <raji@hsbc.com>",      subject: "Welcome to HSBC, raji!",             status: "delivered", sent_at: "2026-07-08 09:01" },
  { id: 2, template: "leave_approved", to: "Arjun Mehta <arjun@hsbc.com>",   subject: "Your Casual leave has been approved", status: "delivered", sent_at: "2026-07-08 08:45" },
  { id: 3, template: "payslip",        to: "Sneha Roy <sneha@hsbc.com>",      subject: "Your payslip for June 2026 is ready", status: "failed",    sent_at: "2026-07-08 08:30" },
  { id: 4, template: "birthday",       to: "Mike Johnson <mike@hsbc.com>",    subject: "Happy Birthday, Mike! 🎂",           status: "delivered", sent_at: "2026-07-07 09:00" },
  { id: 5, template: "leave_rejected", to: "Priya Singh <priya@hsbc.com>",    subject: "Leave Request Update — Sick Leave",   status: "pending",   sent_at: "2026-07-07 14:00" },
  { id: 6, template: "payslip",        to: "Rahul Verma <rahul@hsbc.com>",    subject: "Your payslip for June 2026 is ready", status: "delivered", sent_at: "2026-07-06 08:30" },
  { id: 7, template: "welcome",        to: "Alice Brown <alice@hsbc.com>",    subject: "Welcome to HSBC, Alice!",             status: "bounced",   sent_at: "2026-07-05 10:15" },
];

const CATEGORY_COLORS = {
  Onboarding:   "bg-blue-50 text-blue-700 border-blue-100",
  Leave:        "bg-amber-50 text-amber-700 border-amber-100",
  Payroll:      "bg-green-50 text-green-700 border-green-100",
  Events:       "bg-purple-50 text-purple-700 border-purple-100",
  HR:           "bg-indigo-50 text-indigo-700 border-indigo-100",
  Exit:         "bg-red-50 text-red-700 border-red-100",
  Announcement: "bg-orange-50 text-orange-700 border-orange-100",
  Assets:       "bg-cyan-50 text-cyan-700 border-cyan-100",
};

const STATUS_CONFIG = {
  delivered: { icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-100", label: "Delivered" },
  failed:    { icon: XCircle,      color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",   label: "Failed"    },
  pending:   { icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100", label: "Pending"   },
  bounced:   { icon: AlertCircle,  color: "text-orange-600", bg: "bg-orange-50", border: "border-orange-100",label: "Bounced"   },
  sent:      { icon: CheckCircle2, color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",  label: "Sent"      },
  draft:     { icon: Pencil,       color: "text-slate-600",  bg: "bg-slate-50",  border: "border-slate-100", label: "Draft"     },
  scheduled: { icon: Clock,        color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100",label: "Scheduled" },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  );
}

// ─── Templates Tab ────────────────────────────────────────────────────────────

function TemplatesTab() {
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");
  const [previewTpl, setPreviewTpl] = useState(null);

  const categories = ["All", ...Array.from(new Set(TEMPLATES.map(t => t.category)))];
  const filtered = TEMPLATES.filter(t =>
    (catFilter === "All" || t.category === catFilter) &&
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates…"
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-400 w-56 shadow-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                catFilter === c ? "bg-brand-50 text-brand-700 border-brand-200 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-brand-200"
              }`}>
              {c}
            </button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-sm transition-all ml-auto">
          <Plus className="w-3.5 h-3.5" /> New Template
        </button>
      </div>

      {/* Grid */}
      <motion.div initial="hidden" animate="visible" variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(tpl => (
          <motion.div key={tpl.id} variants={fadeUp}
            whileHover={{ y: -3, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.09)" }}
            className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-3 cursor-default transition-all">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{tpl.name}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{`CommunicationService.send("${tpl.slug}", employee)`}</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[tpl.category] || "bg-slate-50 text-slate-600 border-slate-100"}`}>
                {tpl.category}
              </span>
            </div>
            <p className="text-[10px] text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 truncate font-medium">
              Subject: {tpl.subject}
            </p>
            <div className="flex flex-wrap gap-1">
              {tpl.variables.map(v => (
                <span key={v} className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">{`{{${v}}}`}</span>
              ))}
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-50">
              <button onClick={() => setPreviewTpl(tpl)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-colors border border-slate-100">
                <Eye className="w-3.5 h-3.5" /> Preview
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold text-brand-600 hover:bg-brand-50 transition-colors border border-brand-100">
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewTpl && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewTpl(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{previewTpl.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{`CommunicationService.send("${previewTpl.slug}", employee)`}</p>
                </div>
                <button onClick={() => setPreviewTpl(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Subject Line</p>
                  <p className="text-sm font-semibold text-slate-800">{previewTpl.subject}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Available Variables</p>
                  <div className="flex flex-wrap gap-2">
                    {previewTpl.variables.map(v => (
                      <span key={v} className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">{`{{${v}}}`}</span>
                    ))}
                  </div>
                </div>
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4">
                  <p className="text-[10px] font-bold text-brand-600 uppercase mb-1">Usage in Code</p>
                  <code className="text-xs text-brand-800 font-mono block">
                    {`CommunicationService.send(\n  template="${previewTpl.slug}",\n  employee=employee\n)`}
                  </code>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Campaigns Tab ────────────────────────────────────────────────────────────

function CampaignsTab() {
  const [showNew, setShowNew] = useState(false);
  const [audience, setAudience] = useState("all");

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-slate-900">Email Campaigns</h3>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-sm transition-all">
          <Plus className="w-3.5 h-3.5" /> New Campaign
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Campaign</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Audience</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase text-center">Sent</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase text-center">Opened</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Status</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Date</th>
              <th className="px-5 py-3.5"></th>
            </tr>
          </thead>
          <tbody>
            {CAMPAIGNS.map((c, i) => (
              <motion.tr key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                      <Megaphone className="w-4 h-4 text-brand-600" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" /> {c.audience}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-center"><span className="text-xs font-black text-slate-800">{c.sent}</span></td>
                <td className="px-5 py-3.5 text-center">
                  {c.sent > 0 ? (
                    <span className="text-xs font-black text-green-600">
                      {c.opened} <span className="text-[9px] text-slate-400 font-medium">({Math.round(c.opened / c.sent * 100)}%)</span>
                    </span>
                  ) : <span className="text-slate-300">—</span>}
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                <td className="px-5 py-3.5 text-[10px] font-semibold text-slate-500">{c.date}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <button className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors">
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                    {c.status === "draft" && (
                      <button className="w-7 h-7 rounded-lg hover:bg-brand-50 flex items-center justify-center transition-colors">
                        <Send className="w-3.5 h-3.5 text-brand-500" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Campaign Drawer */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowNew(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">New Campaign</h3>
                <button onClick={() => setShowNew(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Campaign Name</label>
                  <input type="text" placeholder="e.g. Holiday Notice — Diwali 2026"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Template</label>
                  <select className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-brand-400 transition-colors">
                    <option value="">Select a template…</option>
                    {TEMPLATES.filter(t => t.category === "Announcement" || t.category === "Events").map(t => (
                      <option key={t.id} value={t.slug}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Send To</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: "all", label: "All Employees", icon: Users },
                      { val: "dept", label: "Department", icon: BarChart3 },
                      { val: "select", label: "Select Employees", icon: User },
                    ].map(opt => {
                      const Icon = opt.icon;
                      return (
                        <button key={opt.val} onClick={() => setAudience(opt.val)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            audience === opt.val ? "bg-brand-50 border-brand-200 text-brand-700" : "bg-slate-50 border-slate-100 text-slate-500 hover:border-brand-200"
                          }`}>
                          <Icon className="w-4 h-4 mx-auto mb-1" />
                          <p className="text-[9px] font-bold">{opt.label}</p>
                        </button>
                      );
                    })}
                  </div>
                  {audience === "dept" && (
                    <select className="mt-2 w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-brand-400 transition-colors">
                      <option>Engineering</option><option>HR</option><option>Finance</option><option>Sales</option><option>Design</option>
                    </select>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Schedule (optional)</label>
                  <input type="datetime-local"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-slate-100">
                <button onClick={() => setShowNew(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors">
                  Save as Draft
                </button>
                <button className="flex-1 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 shadow-sm transition-all flex items-center justify-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Send Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Email Logs Tab ───────────────────────────────────────────────────────────

function EmailLogsTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = EMAIL_LOGS.filter(l =>
    (statusFilter === "all" || l.status === statusFilter) &&
    (l.to.toLowerCase().includes(search.toLowerCase()) || l.subject.toLowerCase().includes(search.toLowerCase()))
  );

  const statusCounts = EMAIL_LOGS.reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All", count: EMAIL_LOGS.length, color: "bg-slate-100 text-slate-700 border-slate-200" },
          { key: "delivered", label: "Delivered", count: statusCounts.delivered || 0, color: "bg-green-50 text-green-700 border-green-200" },
          { key: "pending",   label: "Pending",   count: statusCounts.pending   || 0, color: "bg-amber-50 text-amber-700 border-amber-200" },
          { key: "failed",    label: "Failed",    count: statusCounts.failed    || 0, color: "bg-red-50 text-red-700 border-red-200" },
          { key: "bounced",   label: "Bounced",   count: statusCounts.bounced   || 0, color: "bg-orange-50 text-orange-700 border-orange-200" },
        ].map(opt => (
          <button key={opt.key} onClick={() => setStatusFilter(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              statusFilter === opt.key ? opt.color + " shadow-sm ring-1 ring-offset-1 ring-current/20" : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
            }`}>
            {opt.label} <span className="ml-1 opacity-70">({opt.count})</span>
          </button>
        ))}
        <div className="relative ml-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs…"
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-brand-400 w-52 shadow-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Recipient</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Subject</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Template</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Status</th>
              <th className="px-5 py-3.5 text-[10px] font-bold text-slate-400 uppercase">Sent At</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-sm text-slate-400 font-semibold">No logs found</td></tr>
            ) : filtered.map((log, i) => (
              <motion.tr key={log.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 text-xs font-semibold text-slate-700 max-w-[180px] truncate">{log.to}</td>
                <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[220px] truncate">{log.subject}</td>
                <td className="px-5 py-3.5">
                  <span className="font-mono text-[9px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">{log.template}</span>
                </td>
                <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                <td className="px-5 py-3.5 text-[10px] font-semibold text-slate-400">{log.sent_at}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SMTP Settings Tab ────────────────────────────────────────────────────────

function SMTPSettingsTab() {
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    provider: "smtp",
    host: "smtp.gmail.com",
    port: "587",
    username: "no-reply@company.com",
    password: "••••••••••••",
    from_name: "HRMS System",
    from_email: "no-reply@company.com",
    encryption: "TLS",
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Provider selector */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-500" /> SMTP Configuration
        </h3>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Email Provider</label>
          <div className="grid grid-cols-3 gap-3">
            {["smtp", "sendgrid", "mailgun"].map(p => (
              <button key={p} onClick={() => setForm(f => ({ ...f, provider: p }))}
                className={`py-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                  form.provider === p ? "bg-brand-50 border-brand-300 text-brand-700 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-500 hover:border-brand-200"
                }`}>
                {p === "smtp" ? "Custom SMTP" : p === "sendgrid" ? "SendGrid" : "Mailgun"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">SMTP Host</label>
            <input value={form.host} onChange={e => setForm(f => ({ ...f, host: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Port</label>
            <select value={form.port} onChange={e => setForm(f => ({ ...f, port: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-brand-400 transition-colors">
              <option value="587">587 (TLS)</option>
              <option value="465">465 (SSL)</option>
              <option value="25">25 (Plain)</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Username / Email</label>
            <input value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Password / API Key</label>
            <div className="relative">
              <input type={showPass ? "text" : "password"} value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
              <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {showPass ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Encryption</label>
            <select value={form.encryption} onChange={e => setForm(f => ({ ...f, encryption: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-brand-400 transition-colors">
              <option>TLS</option><option>SSL</option><option>None</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sender Info */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Mail className="w-4 h-4 text-brand-500" /> Sender Identity
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">From Name</label>
            <input value={form.from_name} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">From Email</label>
            <input value={form.from_email} onChange={e => setForm(f => ({ ...f, from_email: e.target.value }))}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-brand-400 transition-colors" />
          </div>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
          <p className="text-[10px] text-slate-500 font-semibold">Preview: Emails will appear as</p>
          <p className="text-sm font-bold text-slate-800 mt-1">{form.from_name} &lt;{form.from_email}&gt;</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition-colors shadow-sm">
          <Send className="w-3.5 h-3.5" /> Send Test Email
        </button>
        <button onClick={handleSave}
          className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
            saved ? "bg-green-600 text-white" : "bg-brand-600 hover:bg-brand-700 text-white"
          }`}>
          {saved ? <><CheckCircle2 className="w-3.5 h-3.5" /> Saved!</> : <><Save className="w-3.5 h-3.5" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "templates",  label: "Templates",   icon: FileText  },
  { key: "campaigns",  label: "Campaigns",   icon: Megaphone },
  { key: "logs",       label: "Email Logs",  icon: Mail      },
  { key: "smtp",       label: "SMTP Settings", icon: Settings },
];

export default function CommunicationCenter() {
  const [activeTab, setActiveTab] = useState("templates");

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Communication Center" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Tab Nav */}
        <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeTab === tab.key
                    ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {activeTab === "templates" && <TemplatesTab />}
            {activeTab === "campaigns" && <CampaignsTab />}
            {activeTab === "logs"      && <EmailLogsTab />}
            {activeTab === "smtp"      && <SMTPSettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
