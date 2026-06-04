// ============================================
// TFG HRMS - Super Admin Multi-Tenant Data
// ============================================

export const organizations = [
  {
    id: "ORG001",
    name: "TechForge Global",
    domain: "techforge.com",
    plan: "Enterprise",
    status: "active",
    employeeCount: 245,
    adminName: "Rajesh Kumar",
    adminEmail: "rajesh@techforge.com",
    createdAt: "2023-01-15",
    industry: "Technology",
    country: "India",
    monthlyRevenue: 49900,
  },
  {
    id: "ORG002",
    name: "CloudNine Solutions",
    domain: "cloudnine.io",
    plan: "Business",
    status: "active",
    employeeCount: 82,
    adminName: "Meera Kapoor",
    adminEmail: "meera@cloudnine.io",
    createdAt: "2023-06-20",
    industry: "SaaS",
    country: "India",
    monthlyRevenue: 19900,
  },
  {
    id: "ORG003",
    name: "GreenLeaf Farms",
    domain: "greenleaf.co",
    plan: "Starter",
    status: "active",
    employeeCount: 28,
    adminName: "Suresh Patel",
    adminEmail: "suresh@greenleaf.co",
    createdAt: "2024-02-10",
    industry: "Agriculture",
    country: "India",
    monthlyRevenue: 4900,
  },
  {
    id: "ORG004",
    name: "FinEdge Capital",
    domain: "finedge.com",
    plan: "Enterprise",
    status: "active",
    employeeCount: 156,
    adminName: "Anita Desai",
    adminEmail: "anita@finedge.com",
    createdAt: "2023-03-05",
    industry: "Finance",
    country: "Singapore",
    monthlyRevenue: 49900,
  },
  {
    id: "ORG005",
    name: "MediCare Plus",
    domain: "medicareplus.in",
    plan: "Business",
    status: "suspended",
    employeeCount: 64,
    adminName: "Dr. Ravi Shankar",
    adminEmail: "ravi@medicareplus.in",
    createdAt: "2023-09-12",
    industry: "Healthcare",
    country: "India",
    monthlyRevenue: 0,
  },
  {
    id: "ORG006",
    name: "EduBright Academy",
    domain: "edubright.edu",
    plan: "Starter",
    status: "trial",
    employeeCount: 15,
    adminName: "Priya Nair",
    adminEmail: "priya@edubright.edu",
    createdAt: "2025-05-01",
    industry: "Education",
    country: "India",
    monthlyRevenue: 0,
  },
];

export const platformRoles = [
  // TechForge Global roles
  { id: "ROLE001", orgId: "ORG001", orgName: "TechForge Global", name: "Org Admin", description: "Full organization access", usersCount: 3, permissions: ["employees.manage", "payroll.manage", "leave.manage", "performance.manage", "reports.view", "settings.manage", "roles.manage"] },
  { id: "ROLE002", orgId: "ORG001", orgName: "TechForge Global", name: "HR Manager", description: "Manage employees, leaves, payroll", usersCount: 5, permissions: ["employees.manage", "payroll.view", "leave.manage", "performance.view", "reports.view"] },
  { id: "ROLE003", orgId: "ORG001", orgName: "TechForge Global", name: "Team Lead", description: "View team, approve leaves", usersCount: 18, permissions: ["employees.view", "leave.approve", "performance.view"] },
  { id: "ROLE004", orgId: "ORG001", orgName: "TechForge Global", name: "Employee", description: "Self-service access only", usersCount: 219, permissions: ["self.view", "self.leave", "self.attendance"] },
  // CloudNine Solutions roles
  { id: "ROLE005", orgId: "ORG002", orgName: "CloudNine Solutions", name: "Org Admin", description: "Full organization access", usersCount: 2, permissions: ["employees.manage", "payroll.manage", "leave.manage", "performance.manage", "reports.view", "settings.manage", "roles.manage"] },
  { id: "ROLE006", orgId: "ORG002", orgName: "CloudNine Solutions", name: "HR Executive", description: "Day-to-day HR operations", usersCount: 3, permissions: ["employees.manage", "leave.manage", "attendance.manage"] },
  { id: "ROLE007", orgId: "ORG002", orgName: "CloudNine Solutions", name: "Employee", description: "Self-service access only", usersCount: 77, permissions: ["self.view", "self.leave", "self.attendance"] },
  // GreenLeaf Farms roles
  { id: "ROLE008", orgId: "ORG003", orgName: "GreenLeaf Farms", name: "Org Admin", description: "Full organization access", usersCount: 1, permissions: ["employees.manage", "payroll.manage", "leave.manage", "reports.view", "settings.manage"] },
  { id: "ROLE009", orgId: "ORG003", orgName: "GreenLeaf Farms", name: "Employee", description: "Self-service access only", usersCount: 27, permissions: ["self.view", "self.leave", "self.attendance"] },
  // FinEdge Capital roles
  { id: "ROLE010", orgId: "ORG004", orgName: "FinEdge Capital", name: "Org Admin", description: "Full organization access", usersCount: 2, permissions: ["employees.manage", "payroll.manage", "leave.manage", "performance.manage", "reports.view", "settings.manage", "roles.manage"] },
  { id: "ROLE011", orgId: "ORG004", orgName: "FinEdge Capital", name: "Compliance Officer", description: "Audit and compliance access", usersCount: 4, permissions: ["employees.view", "reports.view", "audit.view", "compliance.manage"] },
  { id: "ROLE012", orgId: "ORG004", orgName: "FinEdge Capital", name: "Employee", description: "Self-service access only", usersCount: 150, permissions: ["self.view", "self.leave", "self.attendance"] },
];

export const allPermissions = [
  { category: "Employees", permissions: ["employees.view", "employees.manage", "employees.delete"] },
  { category: "Payroll", permissions: ["payroll.view", "payroll.manage", "payroll.export"] },
  { category: "Leave", permissions: ["leave.view", "leave.manage", "leave.approve"] },
  { category: "Attendance", permissions: ["attendance.view", "attendance.manage"] },
  { category: "Performance", permissions: ["performance.view", "performance.manage"] },
  { category: "Reports", permissions: ["reports.view", "reports.export"] },
  { category: "Settings", permissions: ["settings.view", "settings.manage"] },
  { category: "Roles", permissions: ["roles.view", "roles.manage"] },
  { category: "Self-Service", permissions: ["self.view", "self.leave", "self.attendance"] },
  { category: "Compliance", permissions: ["audit.view", "compliance.manage"] },
];

export const auditLogs = [
  { id: "LOG001", timestamp: "2025-06-03 14:32:10", user: "Rajesh Kumar", orgId: "ORG001", orgName: "TechForge Global", action: "User Login", details: "Logged in from Chrome/Windows", ip: "192.168.1.45", severity: "info" },
  { id: "LOG002", timestamp: "2025-06-03 14:28:05", user: "System", orgId: "ORG005", orgName: "MediCare Plus", action: "Organization Suspended", details: "Auto-suspended due to payment failure (3 retries)", ip: "—", severity: "critical" },
  { id: "LOG003", timestamp: "2025-06-03 13:15:22", user: "Meera Kapoor", orgId: "ORG002", orgName: "CloudNine Solutions", action: "Role Modified", details: "Updated permissions for 'HR Executive' role", ip: "10.0.0.88", severity: "warning" },
  { id: "LOG004", timestamp: "2025-06-03 12:45:00", user: "Anita Desai", orgId: "ORG004", orgName: "FinEdge Capital", action: "Data Export", details: "Exported employee payroll data (Q2 2025)", ip: "172.16.0.12", severity: "warning" },
  { id: "LOG005", timestamp: "2025-06-03 11:30:18", user: "Suresh Patel", orgId: "ORG003", orgName: "GreenLeaf Farms", action: "Employee Added", details: "Added new employee: Amit Kumar (Farm Manager)", ip: "192.168.5.20", severity: "info" },
  { id: "LOG006", timestamp: "2025-06-03 10:22:45", user: "Priya Nair", orgId: "ORG006", orgName: "EduBright Academy", action: "User Login", details: "First login — trial account activated", ip: "103.45.67.89", severity: "success" },
  { id: "LOG007", timestamp: "2025-06-02 18:05:30", user: "System", orgId: "ORG001", orgName: "TechForge Global", action: "Payment Received", details: "Enterprise plan — ₹49,900/mo processed successfully", ip: "—", severity: "success" },
  { id: "LOG008", timestamp: "2025-06-02 16:40:12", user: "Rajesh Kumar", orgId: "ORG001", orgName: "TechForge Global", action: "Role Created", details: "Created new role: 'Intern' with limited permissions", ip: "192.168.1.45", severity: "info" },
  { id: "LOG009", timestamp: "2025-06-02 15:12:00", user: "Anita Desai", orgId: "ORG004", orgName: "FinEdge Capital", action: "Security Policy Updated", details: "Enabled mandatory 2FA for all users", ip: "172.16.0.12", severity: "warning" },
  { id: "LOG010", timestamp: "2025-06-02 14:00:55", user: "System", orgId: "ORG005", orgName: "MediCare Plus", action: "Payment Failed", details: "Business plan payment failed — retry 2/3", ip: "—", severity: "critical" },
  { id: "LOG011", timestamp: "2025-06-02 09:30:20", user: "Meera Kapoor", orgId: "ORG002", orgName: "CloudNine Solutions", action: "Employee Removed", details: "Offboarded: Rahul Mehta (Design team)", ip: "10.0.0.88", severity: "warning" },
  { id: "LOG012", timestamp: "2025-06-01 17:15:42", user: "Super Admin", orgId: null, orgName: "Platform", action: "Platform Update", details: "Deployed v2.4.1 — new audit log filters", ip: "10.0.0.1", severity: "info" },
  { id: "LOG013", timestamp: "2025-06-01 11:20:00", user: "Suresh Patel", orgId: "ORG003", orgName: "GreenLeaf Farms", action: "Payroll Processed", details: "May 2025 payroll processed for 28 employees", ip: "192.168.5.20", severity: "success" },
  { id: "LOG014", timestamp: "2025-05-31 22:00:00", user: "System", orgId: null, orgName: "Platform", action: "Scheduled Backup", details: "Nightly backup completed — all org data secured", ip: "—", severity: "success" },
  { id: "LOG015", timestamp: "2025-05-31 16:48:30", user: "Dr. Ravi Shankar", orgId: "ORG005", orgName: "MediCare Plus", action: "User Login", details: "Logged in from Safari/macOS", ip: "203.12.45.67", severity: "info" },
];

export const subscriptionPlans = [
  {
    id: "PLAN001",
    name: "Starter",
    price: 4900,
    currency: "₹",
    period: "month",
    features: ["Up to 50 employees", "Basic HR modules", "Email support", "5 GB storage", "Standard reports"],
    limits: { maxEmployees: 50, storageGB: 5, customRoles: 3 },
    color: "green",
  },
  {
    id: "PLAN002",
    name: "Business",
    price: 19900,
    currency: "₹",
    period: "month",
    features: ["Up to 200 employees", "All HR modules", "Priority support", "25 GB storage", "Advanced analytics", "Custom roles", "API access"],
    limits: { maxEmployees: 200, storageGB: 25, customRoles: 10 },
    color: "blue",
  },
  {
    id: "PLAN003",
    name: "Enterprise",
    price: 49900,
    currency: "₹",
    period: "month",
    features: ["Unlimited employees", "All modules + AI", "24/7 dedicated support", "Unlimited storage", "Custom integrations", "Unlimited roles", "SSO & SAML", "SLA guarantee"],
    limits: { maxEmployees: -1, storageGB: -1, customRoles: -1 },
    color: "purple",
  },
];

export const platformStats = {
  totalOrganizations: 6,
  activeOrganizations: 4,
  totalUsers: 590,
  activeUsers: 526,
  mrr: 144500,
  arr: 1734000,
  churnRate: 2.1,
  avgRevenuePerOrg: 24083,
  uptime: 99.97,
  activeSessions: 142,
};

export const orgGrowthData = [
  { month: "Jan", orgs: 3, users: 320 },
  { month: "Feb", orgs: 3, users: 345 },
  { month: "Mar", orgs: 4, users: 410 },
  { month: "Apr", orgs: 5, users: 480 },
  { month: "May", orgs: 5, users: 540 },
  { month: "Jun", orgs: 6, users: 590 },
];

export const revenueData = [
  { month: "Jan", revenue: 74700 },
  { month: "Feb", revenue: 74700 },
  { month: "Mar", revenue: 94600 },
  { month: "Apr", revenue: 124500 },
  { month: "May", revenue: 144500 },
  { month: "Jun", revenue: 144500 },
];

export const systemAlerts = [
  { id: "ALT001", type: "payment", title: "Payment Failed — MediCare Plus", description: "Business plan payment failed after 3 retries. Organization auto-suspended.", severity: "critical", time: "2 hours ago" },
  { id: "ALT002", type: "security", title: "Unusual Login Activity", description: "5 failed login attempts from IP 203.45.67.89 for FinEdge Capital.", severity: "warning", time: "4 hours ago" },
  { id: "ALT003", type: "system", title: "Database CPU at 78%", description: "Primary DB instance approaching threshold. Consider scaling.", severity: "warning", time: "6 hours ago" },
  { id: "ALT004", type: "trial", title: "Trial Expiring — EduBright Academy", description: "Trial expires in 7 days. No payment method added yet.", severity: "info", time: "1 day ago" },
  { id: "ALT005", type: "success", title: "Backup Completed", description: "Nightly backup completed successfully for all 6 organizations.", severity: "success", time: "8 hours ago" },
];

export const platformActivity = [
  { id: 1, action: "Organization Suspended", description: "MediCare Plus auto-suspended — payment failure", time: "2 hours ago", type: "critical" },
  { id: 2, action: "New Trial Started", description: "EduBright Academy started 14-day trial", time: "3 days ago", type: "info" },
  { id: 3, action: "Plan Upgrade", description: "FinEdge Capital upgraded from Business → Enterprise", time: "5 days ago", type: "success" },
  { id: 4, action: "Platform Update", description: "Deployed v2.4.1 — audit log filters, performance fixes", time: "1 week ago", type: "info" },
  { id: 5, action: "New Organization", description: "GreenLeaf Farms onboarded with Starter plan", time: "2 weeks ago", type: "success" },
  { id: 6, action: "Security Alert Resolved", description: "Blocked suspicious IP range for CloudNine Solutions", time: "2 weeks ago", type: "warning" },
];

export const crossOrgUsers = [
  { id: "USR001", name: "Rajesh Kumar", email: "rajesh@techforge.com", orgId: "ORG001", orgName: "TechForge Global", role: "Org Admin", status: "active", lastLogin: "2025-06-03 14:32" },
  { id: "USR002", name: "Vikram Singh", email: "vikram@techforge.com", orgId: "ORG001", orgName: "TechForge Global", role: "Team Lead", status: "active", lastLogin: "2025-06-03 13:10" },
  { id: "USR003", name: "Priya Sharma", email: "priya@techforge.com", orgId: "ORG001", orgName: "TechForge Global", role: "HR Manager", status: "active", lastLogin: "2025-06-03 12:45" },
  { id: "USR004", name: "Meera Kapoor", email: "meera@cloudnine.io", orgId: "ORG002", orgName: "CloudNine Solutions", role: "Org Admin", status: "active", lastLogin: "2025-06-03 13:15" },
  { id: "USR005", name: "Rohit Sharma", email: "rohit@cloudnine.io", orgId: "ORG002", orgName: "CloudNine Solutions", role: "HR Executive", status: "active", lastLogin: "2025-06-02 18:20" },
  { id: "USR006", name: "Suresh Patel", email: "suresh@greenleaf.co", orgId: "ORG003", orgName: "GreenLeaf Farms", role: "Org Admin", status: "active", lastLogin: "2025-06-03 11:30" },
  { id: "USR007", name: "Anita Desai", email: "anita@finedge.com", orgId: "ORG004", orgName: "FinEdge Capital", role: "Org Admin", status: "active", lastLogin: "2025-06-03 12:45" },
  { id: "USR008", name: "Karan Malhotra", email: "karan@finedge.com", orgId: "ORG004", orgName: "FinEdge Capital", role: "Compliance Officer", status: "active", lastLogin: "2025-06-02 16:00" },
  { id: "USR009", name: "Dr. Ravi Shankar", email: "ravi@medicareplus.in", orgId: "ORG005", orgName: "MediCare Plus", role: "Org Admin", status: "suspended", lastLogin: "2025-05-31 16:48" },
  { id: "USR010", name: "Priya Nair", email: "priya@edubright.edu", orgId: "ORG006", orgName: "EduBright Academy", role: "Org Admin", status: "trial", lastLogin: "2025-06-03 10:22" },
  { id: "USR011", name: "Sneha Reddy", email: "sneha@techforge.com", orgId: "ORG001", orgName: "TechForge Global", role: "Employee", status: "active", lastLogin: "2025-06-03 09:15" },
  { id: "USR012", name: "Deepak Joshi", email: "deepak@finedge.com", orgId: "ORG004", orgName: "FinEdge Capital", role: "Employee", status: "active", lastLogin: "2025-06-02 17:30" },
];
