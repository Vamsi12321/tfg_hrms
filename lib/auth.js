// ============================================
// TFG HRMS - Fake Authentication & Role System
// ============================================

// Fake credentials for login
export const fakeCredentials = [
  {
    email: "priya@tfg.com",
    password: "admin123",
    role: "hr",
    name: "Priya Sharma",
    designation: "HR Director",
    department: "Human Resources",
    employeeId: "EMP_HR001",
  },
  {
    email: "admin@zenith.com",
    password: "org123",
    role: "orgadmin",
    name: "John Zenith",
    designation: "Organization Admin",
    department: "Management",
    employeeId: "EMP_OA001",
  },
  {
    email: "vikram@tfg.com",
    password: "emp123",
    role: "employee",
    name: "Vikram Singh",
    designation: "Tech Lead",
    department: "Engineering",
    employeeId: "EMP003",
  },
  {
    email: "sneha@tfg.com",
    password: "emp123",
    role: "employee",
    name: "Sneha Reddy",
    designation: "Marketing Manager",
    department: "Marketing",
    employeeId: "EMP004",
  },
  {
    email: "admin@tfg.com",
    password: "super123",
    role: "superadmin",
    name: "Rajesh Kumar",
    designation: "Super Admin",
    department: "Platform Management",
    employeeId: "EMP_SA001",
  },
];

// Role-based access configuration
export const roleAccess = {
  superadmin: ["/superadmin/", "/org/hr/", "/org/employee/"],
  orgadmin: ["/org/hr/"],
  hr: ["/org/hr/"],
  employee: ["/org/employee/"],
};

// Sidebar items per role
export const sidebarConfig = {
  superadmin: [
    { label: "Dashboard",           href: "/superadmin/dashboard",      icon: "LayoutDashboard" },
    { label: "Organizations",       href: "/superadmin/organizations",  icon: "Building2"       },
    { label: "Roles & Permissions", href: "/superadmin/roles",          icon: "ShieldCheck"     },
    { label: "User Management",     href: "/superadmin/users",          icon: "Users"           },
    { label: "Audit Logs",          href: "/superadmin/logs",           icon: "ScrollText"      },
    { label: "Billing",             href: "/superadmin/billing",        icon: "CreditCard"      },
    { label: "Platform Settings",   href: "/superadmin/settings",       icon: "Settings"        },
  ],
  orgadmin: [
    { label: "Dashboard",         href: "/org/hr/dashboard",         icon: "LayoutDashboard" },
    { label: "User Management",   href: "/org/hr/user-management",   icon: "ShieldCheck"     },
    { label: "Employees",         href: "/org/hr/employees",         icon: "Users"           },
    { label: "Departments",       href: "/org/hr/departments",       icon: "Building2"       },
    { label: "Attendance",        href: "/org/hr/attendance",        icon: "CalendarCheck"   },
    { label: "Leave Management",  href: "/org/hr/leaves",            icon: "Clock"           },
    { label: "Payroll",           href: "/org/hr/payroll",           icon: "Wallet"          },
    { label: "Asset Management",  href: "/org/hr/assets",            icon: "Package"         },
    { label: "Exit Management",   href: "/org/hr/exit",              icon: "UserMinus"       },
    { label: "Communication",     href: "/org/hr/communication",     icon: "Mail"            },
    { label: "AI Insights",       href: "/org/hr/ai-insights",       icon: "Brain"           },
    { label: "Work Management",   href: "/org/hr/work",              icon: "ClipboardList"   },
    { label: "Talent Finder",     href: "/org/hr/talent",            icon: "Sparkles"        },
    { label: "Wellness & Mood",   href: "/org/hr/wellness",          icon: "Heart"           },
    { label: "Analytics",         href: "/org/hr/analytics",         icon: "BarChart3"       },
    { label: "Documents",         href: "/org/hr/documents",         icon: "FileText"        },
    { label: "Announcements",     href: "/org/hr/announcements",     icon: "Megaphone"       },
    { label: "Org Settings",      href: "/org/hr/settings",          icon: "Settings"        },
    { label: "Org Logs",          href: "/org/hr/logs",              icon: "ScrollText"      },
  ],
  hr: [
    { label: "Dashboard",         href: "/org/hr/dashboard",    icon: "LayoutDashboard" },
    { label: "Employees",         href: "/org/hr/employees",    icon: "Users"           },
    { label: "Attendance",        href: "/org/hr/attendance",   icon: "CalendarCheck"   },
    { label: "Leave Management",  href: "/org/hr/leaves",       icon: "Clock"           },
    { label: "Payroll",           href: "/org/hr/payroll",      icon: "Wallet"          },
    { label: "Asset Management",  href: "/org/hr/assets",       icon: "Package"         },
    { label: "Exit Management",   href: "/org/hr/exit",         icon: "UserMinus"       },
    { label: "Communication",     href: "/org/hr/communication",icon: "Mail"            },
    { label: "Performance & OKRs",href: "/org/hr/performance",  icon: "Target"          },
    { label: "AI Insights",       href: "/org/hr/ai-insights",  icon: "Brain"           },
    { label: "Talent Finder",     href: "/org/hr/talent",       icon: "Sparkles"        },
    { label: "Wellness & Mood",   href: "/org/hr/wellness",     icon: "Heart"           },
    { label: "Analytics",         href: "/org/hr/analytics",    icon: "BarChart3"       },
    { label: "Documents",         href: "/org/hr/documents",    icon: "FileText"        },
    { label: "Announcements",     href: "/org/hr/announcements",icon: "Megaphone"       },
  ],
  employee: [
    { label: "My Dashboard",  href: "/org/employee/dashboard",    icon: "LayoutDashboard" },
    { label: "Onboarding",    href: "/org/employee/onboarding",   icon: "CheckCircle2"    },
    { label: "My Attendance", href: "/org/employee/attendance",   icon: "CalendarCheck"   },
    { label: "My Leaves",     href: "/org/employee/leaves",       icon: "Clock"           },
    { label: "My Payslips",   href: "/org/employee/payslips",     icon: "Wallet"          },
    { label: "My Work",       href: "/org/employee/work",         icon: "ClipboardList"   },
    { label: "My Assets",     href: "/org/employee/assets",       icon: "Package"         },
    { label: "My Documents",  href: "/org/employee/documents",    icon: "FileText"        },
    { label: "Wellness",      href: "/org/employee/wellness",     icon: "Heart"           },
    { label: "Announcements", href: "/org/employee/announcements",icon: "Megaphone"       },
    { label: "My Profile",    href: "/org/employee/profile",      icon: "User"            },
  ],
};

// Helper to check if a role can access a path
export function canAccess(role, path) {
  if (role === "superadmin") return true;
  if (role === "orgadmin") return path.startsWith("/org/hr/") || path === "/org/hr";
  if (role === "hr")       return path.startsWith("/org/hr/") || path === "/org/hr";
  if (role === "employee") return path.startsWith("/org/employee/") || path === "/org/employee";
  return false;
}

// Get redirect path based on role
export function getDefaultRoute(role) {
  switch (role) {
    case "superadmin": return "/superadmin/dashboard";
    case "orgadmin":   return "/org/hr/dashboard";
    case "hr":         return "/org/hr/dashboard";
    case "employee":   return "/org/employee/dashboard";
    default:           return "/login";
  }
}
