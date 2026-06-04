"use client";

import { motion } from "framer-motion";
import {
  Settings, User, Bell, Shield, Palette, Globe,
  Database, Key, Mail, Smartphone, ChevronRight
} from "lucide-react";
import TopBar from "@/components/TopBar";

export default function SettingsPage() {
  const settingSections = [
    { title: "Profile Settings", desc: "Update your personal information", icon: User, color: "blue" },
    { title: "Notifications", desc: "Configure email and push notifications", icon: Bell, color: "amber" },
    { title: "Security", desc: "Password, 2FA, and session management", icon: Shield, color: "red" },
    { title: "Appearance", desc: "Theme, layout, and display preferences", icon: Palette, color: "purple" },
    { title: "Organization", desc: "Company details, departments, and roles", icon: Globe, color: "green" },
    { title: "Integrations", desc: "Connect third-party apps and services", icon: Database, color: "cyan" },
    { title: "API Keys", desc: "Manage API access and webhooks", icon: Key, color: "indigo" },
    { title: "Email Templates", desc: "Customize system email templates", icon: Mail, color: "pink" },
  ];

  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Settings" />

      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Settings</h2>
          <p className="text-sm text-slate-500">Manage your account and organization preferences</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {settingSections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
                className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm cursor-pointer group flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl bg-${section.color}-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 text-${section.color}-500`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{section.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{section.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
