"use client";

import TopBar from "@/components/TopBar";
import TabNav from "@/components/TabNav";
import { Globe, Mail, Shield, Users, Bell, Database, Key, Settings } from "lucide-react";

const tabs = [
  { label:"Platform",       href:"/superadmin/settings/platform",      icon:Globe    },
  { label:"Email & SMTP",   href:"/superadmin/settings/smtp",          icon:Mail     },
  { label:"Security",       href:"/superadmin/settings/security",      icon:Shield   },
  { label:"Default Roles",  href:"/superadmin/settings/roles",         icon:Users    },
  { label:"Notifications",  href:"/superadmin/settings/notifications", icon:Bell     },
  { label:"Backup",         href:"/superadmin/settings/backup",        icon:Database },
  { label:"API & Webhooks", href:"/superadmin/settings/api",           icon:Key      },
  { label:"Feature Flags",  href:"/superadmin/settings/flags",         icon:Settings },
];

export default function SettingsLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface-100">
      <TopBar title="Platform Settings" />
      <div className="p-4 md:p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Platform Settings</h2>
          <p className="text-xs text-slate-500">Configure global platform attributes, SMTP pathways, feature toggles, and security enforcement policies.</p>
        </div>
        <div className="grid lg:grid-cols-4 gap-6 items-start">
          {/* Vertical tab nav */}
          <div className="lg:col-span-1 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <TabNav tabs={tabs} vertical amber />
          </div>
          {/* Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
