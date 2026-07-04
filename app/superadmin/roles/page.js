"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Check, X, Info, Users, Shield } from "lucide-react";
import TopBar from "@/components/TopBar";

// Current actual permissions enforced by the system
const ROLES = [
  { key: "org_admin",  label: "Org Admin",   desc: "Full organization access",              color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  { key: "hr_admin",   label: "HR Manager",  desc: "Manage employees, leaves, payroll",     color: "bg-blue-100 text-blue-700 border-blue-200"      },
  { key: "team_lead",  label: "Team Lead",   desc: "Manage team work, approve timesheets",  color: "bg-teal-100 text-teal-700 border-teal-200"      },
  { key: "employee",   label: "Employee",    desc: "Self-service access only",              color: "bg-green-100 text-green-700 border-green-200"   },
];

const PERMISSIONS = [
  // Employees
  { section: "EMPLOYEES",        policy: "employees.view",       org_admin: true,  hr_admin: true,  team_lead: true,  employee: false },
  { section: "EMPLOYEES",        policy: "employees.create",     org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "EMPLOYEES",        policy: "employees.update",     org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "EMPLOYEES",        policy: "employees.delete",     org_admin: true,  hr_admin: false, team_lead: false, employee: false },
  { section: "EMPLOYEES",        policy: "employees.verify",     org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  // Attendance
  { section: "ATTENDANCE",       policy: "attendance.view_all",  org_admin: true,  hr_admin: true,  team_lead: true,  employee: false },
  { section: "ATTENDANCE",       policy: "attendance.mark",      org_admin: true,  hr_admin: true,  team_lead: false, employee: true  },
  { section: "ATTENDANCE",       policy: "attendance.config",    org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "ATTENDANCE",       policy: "attendance.regularize_approve", org_admin: true, hr_admin: true, team_lead: false, employee: false },
  // Leaves
  { section: "LEAVES",           policy: "leaves.apply",         org_admin: true,  hr_admin: true,  team_lead: true,  employee: true  },
  { section: "LEAVES",           policy: "leaves.approve",       org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "LEAVES",           policy: "leaves.config",        org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "LEAVES",           policy: "leaves.balance_adjust",org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  // Payroll
  { section: "PAYROLL",          policy: "payroll.view_all",     org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "PAYROLL",          policy: "payroll.run",          org_admin: true,  hr_admin: false, team_lead: false, employee: false },
  { section: "PAYROLL",          policy: "payroll.approve",      org_admin: true,  hr_admin: false, team_lead: false, employee: false },
  { section: "PAYROLL",          policy: "payroll.config",       org_admin: true,  hr_admin: false, team_lead: false, employee: false },
  { section: "PAYROLL",          policy: "payroll.view_own",     org_admin: true,  hr_admin: true,  team_lead: true,  employee: true  },
  // Work Management
  { section: "WORK MANAGEMENT",  policy: "work.projects.create", org_admin: true,  hr_admin: true,  team_lead: true,  employee: false },
  { section: "WORK MANAGEMENT",  policy: "work.items.create",    org_admin: true,  hr_admin: true,  team_lead: true,  employee: false },
  { section: "WORK MANAGEMENT",  policy: "work.items.assign",    org_admin: true,  hr_admin: true,  team_lead: true,  employee: false },
  { section: "WORK MANAGEMENT",  policy: "work.items.status_all",org_admin: true,  hr_admin: true,  team_lead: true,  employee: false },
  { section: "WORK MANAGEMENT",  policy: "work.items.close",     org_admin: true,  hr_admin: true,  team_lead: true,  employee: false },
  { section: "WORK MANAGEMENT",  policy: "work.items.status_own",org_admin: true,  hr_admin: true,  team_lead: true,  employee: true  },
  { section: "WORK MANAGEMENT",  policy: "work.timesheets.approve", org_admin: true, hr_admin: true, team_lead: true, employee: false },
  // Documents
  { section: "DOCUMENTS",        policy: "documents.upload_company", org_admin: true, hr_admin: true, team_lead: false, employee: false },
  { section: "DOCUMENTS",        policy: "documents.request",    org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "DOCUMENTS",        policy: "documents.upload_own", org_admin: true,  hr_admin: true,  team_lead: true,  employee: true  },
  // Announcements
  { section: "ANNOUNCEMENTS",    policy: "announcements.create", org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "ANNOUNCEMENTS",    policy: "announcements.view",   org_admin: true,  hr_admin: true,  team_lead: true,  employee: true  },
  // Wellness
  { section: "WELLNESS",         policy: "wellness.view_team",   org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "WELLNESS",         policy: "wellness.submit_mood", org_admin: true,  hr_admin: true,  team_lead: true,  employee: true  },
  // AI & Analytics
  { section: "AI & ANALYTICS",   policy: "analytics.dashboard",  org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "AI & ANALYTICS",   policy: "ai_insights.view",     org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  { section: "AI & ANALYTICS",   policy: "talent_finder.search", org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
  // Settings
  { section: "SETTINGS",         policy: "org_settings.manage",  org_admin: true,  hr_admin: false, team_lead: false, employee: false },
  { section: "SETTINGS",         policy: "user_management",      org_admin: true,  hr_admin: false, team_lead: false, employee: false },
  { section: "SETTINGS",         policy: "departments.manage",   org_admin: true,  hr_admin: true,  team_lead: false, employee: false },
];

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState("org_admin");

  // Group permissions by section
  const sections = {};
  PERMISSIONS.forEach(p => {
    if (!sections[p.section]) sections[p.section] = [];
    sections[p.section].push(p);
  });

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Roles & Permissions" />

      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-bold text-slate-900">Permission Matrix</h2>
          <p className="text-xs text-slate-500">Current access control rules enforced across the platform</p>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-amber-800">These permissions are system-enforced. Roles are assigned during user creation. Team Lead status is set when a team is created via the Work Management module.</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left — Role Cards */}
          <div className="lg:col-span-1 space-y-3">
            <p className="text-xs font-bold text-slate-700 mb-2">Roles ({ROLES.length})</p>
            {ROLES.map((role, i) => (
              <motion.button key={role.key} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                onClick={() => setSelectedRole(role.key)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedRole===role.key?"ring-2 ring-brand-300 border-brand-200 bg-white shadow-md":"border-slate-100 bg-white hover:shadow-sm"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Shield className={`w-4 h-4 ${selectedRole===role.key?"text-brand-600":"text-slate-400"}`}/>
                  <span className="text-sm font-bold text-slate-900">{role.label}</span>
                </div>
                <p className="text-[10px] text-slate-500">{role.desc}</p>
                <div className="mt-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${role.color}`}>
                    {PERMISSIONS.filter(p=>p[role.key]).length} permissions
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Right — Permission Matrix */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Interactive Permission Matrix</h3>
              <p className="text-[10px] text-slate-400">Audit permission allocations side-by-side</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50/80">
                    <th className="text-left text-[10px] font-bold text-slate-500 uppercase px-5 py-3 min-w-[200px]">Permission Policy</th>
                    {ROLES.map(r=>(
                      <th key={r.key} className={`text-center text-[10px] font-bold uppercase px-4 py-3 whitespace-nowrap ${selectedRole===r.key?"text-brand-700 bg-brand-50/50":"text-slate-500"}`}>
                        {r.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(sections).map(([section, perms]) => (
                    <>
                      <tr key={section}>
                        <td colSpan={5} className="px-5 py-2 bg-slate-50/50">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{section}</span>
                        </td>
                      </tr>
                      {perms.map((perm, i) => (
                        <tr key={perm.policy} className="border-t border-slate-50 hover:bg-slate-50/50">
                          <td className="px-5 py-2.5 text-xs text-slate-700 font-medium">{perm.policy}</td>
                          {ROLES.map(r => (
                            <td key={r.key} className={`text-center px-4 py-2.5 ${selectedRole===r.key?"bg-brand-50/30":""}`}>
                              {perm[r.key] ? (
                                <span className="inline-flex w-5 h-5 rounded-full bg-green-100 items-center justify-center">
                                  <Check className="w-3 h-3 text-green-600"/>
                                </span>
                              ) : (
                                <span className="inline-flex w-5 h-5 rounded-full bg-slate-100 items-center justify-center">
                                  <X className="w-3 h-3 text-slate-300"/>
                                </span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
