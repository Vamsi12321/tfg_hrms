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
    role: "admin",
    name: "Rajesh Kumar",
    designation: "Super Admin",
    department: "Management",
    employeeId: "EMP_ADMIN001",
  },
];

// Role-based access configuration
// Pages each role can access
export const roleAccess = {
  admin: ["/hr/", "/employee/"],
  hr: ["/hr/"],
  employee: ["/employee/"],
};

// Sidebar items per role
export const sidebarConfig = {
  admin: [
    { label: "Dashboard",         href: "/hr/dashboard",    icon: "LayoutDashboard" },
    { label: "Employees",         href: "/hr/employees",    icon: "Users"           },
    { label: "Attendance",        href: "/hr/attendance",   icon: "CalendarCheck"   },
    { label: "Leave Management",  href: "/hr/leaves",       icon: "Clock"           },
    { label: "Payroll",           href: "/hr/payroll",      icon: "Wallet"          },
    { label: "Performance & OKRs",href: "/hr/performance",  icon: "Target"          },
    { label: "AI Insights",       href: "/hr/ai-insights",  icon: "Brain"           },
    { label: "Talent Finder",     href: "/hr/talent",       icon: "Sparkles"        },
    { label: "Wellness & Mood",   href: "/hr/wellness",     icon: "Heart"           },
    { label: "Analytics",         href: "/hr/analytics",    icon: "BarChart3"       },
    { label: "Documents",         href: "/hr/documents",    icon: "FileText"        },
    { label: "Announcements",     href: "/hr/announcements",icon: "Megaphone"       },
    { label: "Settings",          href: "/hr/settings",     icon: "Settings"        },
  ],
  hr: [
    { label: "Dashboard",         href: "/hr/dashboard",    icon: "LayoutDashboard" },
    { label: "Employees",         href: "/hr/employees",    icon: "Users"           },
    { label: "Attendance",        href: "/hr/attendance",   icon: "CalendarCheck"   },
    { label: "Leave Management",  href: "/hr/leaves",       icon: "Clock"           },
    { label: "Payroll",           href: "/hr/payroll",      icon: "Wallet"          },
    { label: "Performance & OKRs",href: "/hr/performance",  icon: "Target"          },
    { label: "AI Insights",       href: "/hr/ai-insights",  icon: "Brain"           },
    { label: "Talent Finder",     href: "/hr/talent",       icon: "Sparkles"        },
    { label: "Wellness & Mood",   href: "/hr/wellness",     icon: "Heart"           },
    { label: "Analytics",         href: "/hr/analytics",    icon: "BarChart3"       },
    { label: "Documents",         href: "/hr/documents",    icon: "FileText"        },
    { label: "Announcements",     href: "/hr/announcements",icon: "Megaphone"       },
    { label: "Settings",          href: "/hr/settings",     icon: "Settings"        },
  ],
  employee: [
    { label: "My Dashboard",  href: "/employee/dashboard",    icon: "LayoutDashboard" },
    { label: "My Attendance", href: "/employee/attendance",   icon: "CalendarCheck"   },
    { label: "My Leaves",     href: "/employee/leaves",       icon: "Clock"           },
    { label: "My Payslips",   href: "/employee/payslips",     icon: "Wallet"          },
    { label: "My Performance",href: "/employee/performance",  icon: "Target"          },
    { label: "My Documents",  href: "/employee/documents",    icon: "FileText"        },
    { label: "Announcements", href: "/employee/announcements",icon: "Megaphone"       },
    { label: "My Profile",    href: "/employee/profile",      icon: "User"            },
  ],
};

// Helper to check if a role can access a path
export function canAccess(role, path) {
  if (role === "admin") return true;
  if (role === "hr")       return path.startsWith("/hr/") || path === "/hr";
  if (role === "employee") return path.startsWith("/employee/") || path === "/employee";
  return false;
}

// Get redirect path based on role
export function getDefaultRoute(role) {
  switch (role) {
    case "admin":
    case "hr":       return "/hr/dashboard";
    case "employee": return "/employee/dashboard";
    default:         return "/login";
  }
}
