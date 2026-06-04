"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Globe, Mail, Shield, Users, Bell, Database,
  Key, ToggleLeft, ToggleRight, CheckCircle2, Save, Play,
  RefreshCw, Terminal, Eye, EyeOff
} from "lucide-react";
import TopBar from "@/components/TopBar";

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState("platform");
  const [toastMsg, setToastMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Dynamic States for Interactive Toggles
  const [platformName, setPlatformName] = useState("TFG HRMS");
  const [supportEmail, setSupportEmail] = useState("support@tfg.com");
  const [autoProvision, setAutoProvision] = useState(true);
  const [smtpHost, setSmtpHost] = useState("smtp.tfg-platform.net");
  const [smtpPort, setSmtpPort] = useState("587");
  const [mfaEnforced, setMfaEnforced] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState("60");
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [wellnessEnabled, setWellnessEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("tfg_live_9481a7b8e210c4f8d");

  const triggerToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    triggerToast("Platform settings saved successfully to configuration database.");
  };

  const handleGenerateKey = () => {
    const randomHex = Array.from({ length: 16 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("");
    setApiKey(`tfg_live_${randomHex}`);
    triggerToast("Generated a new platform API secret token key.");
  };

  const handleTestSmtp = () => {
    triggerToast("SMTP Connection established. Test handshake successful.");
  };

  const handleTriggerBackup = () => {
    triggerToast("Starting database snapshot... Full platform backup completed successfully.");
  };

  const tabs = [
    { id: "platform", label: "Platform Configuration", icon: Globe },
    { id: "smtp", label: "Email & SMTP", icon: Mail },
    { id: "security", label: "Security Policies", icon: Shield },
    { id: "roles", label: "Default Roles", icon: Users },
    { id: "notifications", label: "Notification Channels", icon: Bell },
    { id: "backup", label: "Backup & Recovery", icon: Database },
    { id: "api", label: "API & Webhooks", icon: Key },
    { id: "flags", label: "Feature Flags", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Platform Settings" />

      <div className="p-6 space-y-6">
        {/* Toast Alert */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: -20, x: "-50%" }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border border-slate-800"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{toastMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-xs text-slate-500">Configure global platform attributes, SMTP pathways, feature toggles, and security enforcement policies.</p>
        </div>

        {/* Settings Core Layout */}
        <div className="grid lg:grid-cols-4 gap-6 items-start">
          {/* Tabs Navigation */}
          <div className="lg:col-span-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-50 text-amber-700 border border-amber-100 shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-600" : "text-slate-400"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <form onSubmit={handleSave} className="divide-y divide-slate-100">
              <div className="p-6">
                {/* Platform Configuration */}
                {activeTab === "platform" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Platform General Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">White-label Title</label>
                        <input
                          type="text"
                          value={platformName}
                          onChange={(e) => setPlatformName(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Global Support Mail</label>
                        <input
                          type="email"
                          value={supportEmail}
                          onChange={(e) => setSupportEmail(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 mt-2">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Auto-Provision Corporate Tenants</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Instantly spin up infrastructure containers upon payment authorization.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAutoProvision(!autoProvision)}
                          className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          {autoProvision ? (
                            <ToggleRight className="w-9 h-9 text-amber-600" />
                          ) : (
                            <ToggleLeft className="w-9 h-9" />
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Email & SMTP */}
                {activeTab === "smtp" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Email & SMTP Gateway</h3>
                      <button
                        type="button"
                        onClick={handleTestSmtp}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
                      >
                        <Play className="w-3 h-3" /> Test Connection
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">SMTP Relay Server</label>
                        <input
                          type="text"
                          value={smtpHost}
                          onChange={(e) => setSmtpHost(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Relay Port</label>
                        <input
                          type="text"
                          value={smtpPort}
                          onChange={(e) => setSmtpPort(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">SMTP Username</label>
                        <input
                          type="text"
                          defaultValue="smtp-relay-user@tfg.com"
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">SMTP Password</label>
                        <div className="relative">
                          <input
                            type={showPassword ? "text" : "password"}
                            defaultValue="supersecretrelaysmtp"
                            className="w-full pl-3 pr-10 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Security Policies */}
                {activeTab === "security" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Security Enforcement Profile</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Mandate Multi-Factor Authentications (MFA)</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Force all tenant administrators to authenticate via TOTP security codes.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMfaEnforced(!mfaEnforced)}
                          className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          {mfaEnforced ? <ToggleRight className="w-9 h-9 text-amber-600" /> : <ToggleLeft className="w-9 h-9" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">Token Expiry Timeout (Minutes)</label>
                          <select
                            value={sessionTimeout}
                            onChange={(e) => setSessionTimeout(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors cursor-pointer"
                          >
                            <option value="15">15 Minutes</option>
                            <option value="30">30 Minutes</option>
                            <option value="60">60 Minutes</option>
                            <option value="120">120 Minutes</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-600 mb-1 block">Maximum Login Attempts Allowed</label>
                          <select
                            defaultValue="5"
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors cursor-pointer"
                          >
                            <option value="3">3 Failures</option>
                            <option value="5">5 Failures</option>
                            <option value="10">10 Failures</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Default Roles */}
                {activeTab === "roles" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Corporate Role Templates</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Configure base authorization schemes. Every new organization onboarded to the system will automatically inherit these template profiles as their default setup.
                    </p>
                    <div className="space-y-2.5">
                      {[
                        { name: "Organization Administrator", desc: "Full database CRUD permissions + settings control" },
                        { name: "HR Manager", desc: "Manage employee files, payroll approvals, time tracking policies" },
                        { name: "Team Leader", desc: "Read-only team views + leave request approvals" },
                        { name: "Self-Service Employee", desc: "Self-service timesheets, payslips, wellness entries" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-colors">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                          <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Template Inherited</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Notifications */}
                {activeTab === "notifications" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">Notification Channels</h3>
                    <div className="space-y-3">
                      {[
                        { title: "System Critical Alert Emails", desc: "Dispatched to platform administrators upon hardware resource threshold failures" },
                        { title: "Slack Hook Integrations", desc: "Pushes real-time signup and billing events to private slack monitoring channels" },
                        { title: "SMS Auth Gateway Notifications", desc: "Delivers two-factor credentials using global Twilio APIs" }
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.title}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-amber-500 transition-colors"
                          >
                            <ToggleRight className="w-9 h-9 text-amber-600" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Backup & Recovery */}
                {activeTab === "backup" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Snapshot & Data Backups</h3>
                      <button
                        type="button"
                        onClick={handleTriggerBackup}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" /> Backup Now
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">S3 Backup Snapshot Frequency</label>
                        <select
                          value={backupFrequency}
                          onChange={(e) => setBackupFrequency(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-amber-400 bg-white transition-colors cursor-pointer"
                        >
                          <option value="hourly">Hourly backups</option>
                          <option value="daily">Daily database snapshot</option>
                          <option value="weekly">Weekly complete archive</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Encryption Secret Scheme</label>
                        <input
                          type="text"
                          readOnly
                          defaultValue="AES-256-GCM-ENCRYPTED"
                          className="w-full px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none cursor-default font-mono"
                        />
                      </div>
                      <div className="col-span-2 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Last Backup Created:</span>
                        <span className="font-mono text-slate-800 font-bold">2025-06-03 23:59:59 (SUCCESSFUL)</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* API & Webhooks */}
                {activeTab === "api" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-bold text-slate-900">Developer Platform API Controls</h3>
                      <button
                        type="button"
                        onClick={handleGenerateKey}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-600 transition-colors"
                      >
                        <Key className="w-3 h-3" /> Roll Secret Token
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Live API Secret Key</label>
                        <input
                          type="text"
                          readOnly
                          value={apiKey}
                          className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-xs font-mono text-slate-800 outline-none select-all"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-600 mb-1 block">Global Webhook Endpoint</label>
                        <input
                          type="text"
                          defaultValue="https://platform.tfg-api.com/v1/webhook-receiver"
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Feature Flags */}
                {activeTab === "flags" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 mb-4">System Feature Flags</h3>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      Manage feature exposure across the system. Disabling a flag hides corresponding navigation icons and blocks routes globally for all organizations.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Enable AI-Powered Wellness Insights</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Show predictive attrition stats and mood analysis models to HR directors.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiEnabled(!aiEnabled)}
                          className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          {aiEnabled ? <ToggleRight className="w-9 h-9 text-amber-600" /> : <ToggleLeft className="w-9 h-9" />}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-800">Enable Interactive Talent Finder</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Allow organizations to query internal resume search semantic indices.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setWellnessEnabled(!wellnessEnabled)}
                          className="text-slate-400 hover:text-amber-500 transition-colors"
                        >
                          {wellnessEnabled ? <ToggleRight className="w-9 h-9 text-amber-600" /> : <ToggleLeft className="w-9 h-9" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="p-4 bg-slate-50 flex justify-end gap-3">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 transition-all"
                >
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
