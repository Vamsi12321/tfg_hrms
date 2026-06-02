// ============================================
// TFG HRMS - Fake Data for UI Showcase
// ============================================

export const currentUser = {
  id: "usr_001",
  name: "Priya Sharma",
  email: "priya.sharma@tfg.com",
  role: "HR Director",
  avatar: null,
  department: "Human Resources",
  joinDate: "2021-03-15",
};

export const employees = [
  { id: "EMP001", name: "Rahul Verma", email: "rahul.v@tfg.com", department: "Engineering", designation: "Senior Developer", status: "active", joinDate: "2022-01-10", salary: 1800000, avatar: null, mood: "happy", performance: 92, attendance: 96 },
  { id: "EMP002", name: "Ananya Patel", email: "ananya.p@tfg.com", department: "Design", designation: "UI/UX Lead", status: "active", joinDate: "2021-06-20", salary: 1600000, avatar: null, mood: "neutral", performance: 88, attendance: 94 },
  { id: "EMP003", name: "Vikram Singh", email: "vikram.s@tfg.com", department: "Engineering", designation: "Tech Lead", status: "active", joinDate: "2020-09-01", salary: 2400000, avatar: null, mood: "happy", performance: 95, attendance: 98 },
  { id: "EMP004", name: "Sneha Reddy", email: "sneha.r@tfg.com", department: "Marketing", designation: "Marketing Manager", status: "active", joinDate: "2022-04-15", salary: 1400000, avatar: null, mood: "stressed", performance: 78, attendance: 88 },
  { id: "EMP005", name: "Arjun Nair", email: "arjun.n@tfg.com", department: "Sales", designation: "Sales Executive", status: "active", joinDate: "2023-01-05", salary: 900000, avatar: null, mood: "happy", performance: 85, attendance: 92 },
  { id: "EMP006", name: "Kavitha Menon", email: "kavitha.m@tfg.com", department: "Engineering", designation: "Full Stack Developer", status: "on-leave", joinDate: "2022-08-12", salary: 1500000, avatar: null, mood: "neutral", performance: 90, attendance: 91 },
  { id: "EMP007", name: "Deepak Joshi", email: "deepak.j@tfg.com", department: "Finance", designation: "Finance Analyst", status: "active", joinDate: "2021-11-20", salary: 1200000, avatar: null, mood: "happy", performance: 87, attendance: 95 },
  { id: "EMP008", name: "Meera Iyer", email: "meera.i@tfg.com", department: "HR", designation: "HR Executive", status: "active", joinDate: "2023-03-01", salary: 800000, avatar: null, mood: "happy", performance: 82, attendance: 97 },
  { id: "EMP009", name: "Rohan Gupta", email: "rohan.g@tfg.com", department: "Engineering", designation: "DevOps Engineer", status: "active", joinDate: "2022-05-18", salary: 1700000, avatar: null, mood: "neutral", performance: 91, attendance: 93 },
  { id: "EMP010", name: "Pooja Deshmukh", email: "pooja.d@tfg.com", department: "Product", designation: "Product Manager", status: "active", joinDate: "2021-08-10", salary: 2000000, avatar: null, mood: "stressed", performance: 84, attendance: 89 },
  { id: "EMP011", name: "Karthik Rajan", email: "karthik.r@tfg.com", department: "Engineering", designation: "Junior Developer", status: "active", joinDate: "2023-07-01", salary: 700000, avatar: null, mood: "happy", performance: 76, attendance: 94 },
  { id: "EMP012", name: "Nisha Agarwal", email: "nisha.a@tfg.com", department: "Legal", designation: "Legal Counsel", status: "active", joinDate: "2020-12-01", salary: 2200000, avatar: null, mood: "neutral", performance: 93, attendance: 96 },
];

export const departments = [
  { name: "Engineering", headcount: 5, budget: 9100000, head: "Vikram Singh" },
  { name: "Design", headcount: 1, budget: 1600000, head: "Ananya Patel" },
  { name: "Marketing", headcount: 1, budget: 1400000, head: "Sneha Reddy" },
  { name: "Sales", headcount: 1, budget: 900000, head: "Arjun Nair" },
  { name: "Finance", headcount: 1, budget: 1200000, head: "Deepak Joshi" },
  { name: "HR", headcount: 1, budget: 800000, head: "Meera Iyer" },
  { name: "Product", headcount: 1, budget: 2000000, head: "Pooja Deshmukh" },
  { name: "Legal", headcount: 1, budget: 2200000, head: "Nisha Agarwal" },
];

export const attendanceToday = {
  present: 10,
  absent: 1,
  onLeave: 1,
  late: 2,
  wfh: 3,
  total: 12,
};

export const leaveRequests = [
  { id: "LR001", employee: "Kavitha Menon", type: "Sick Leave", from: "2025-05-20", to: "2025-05-23", days: 4, status: "pending", reason: "Medical appointment and recovery" },
  { id: "LR002", employee: "Sneha Reddy", type: "Casual Leave", from: "2025-05-26", to: "2025-05-27", days: 2, status: "pending", reason: "Personal work" },
  { id: "LR003", employee: "Arjun Nair", type: "Earned Leave", from: "2025-06-01", to: "2025-06-05", days: 5, status: "approved", reason: "Family vacation" },
  { id: "LR004", employee: "Rohan Gupta", type: "Work From Home", from: "2025-05-23", to: "2025-05-23", days: 1, status: "approved", reason: "Internet installation at new apartment" },
];

export const payrollSummary = {
  totalPayroll: 18200000,
  processed: 11,
  pending: 1,
  nextPayDate: "2025-05-31",
  avgSalary: 1516667,
  highestDept: "Engineering",
};

export const announcements = [
  { id: 1, title: "Company Town Hall - Q2 Results", date: "2025-05-25", priority: "high", content: "Join us for the quarterly town hall meeting. CEO will share Q2 results and roadmap." },
  { id: 2, title: "New Health Insurance Policy", date: "2025-05-22", priority: "medium", content: "Updated health insurance with better coverage starts June 1st." },
  { id: 3, title: "Hackathon 2025 Registration Open", date: "2025-05-20", priority: "low", content: "Annual hackathon is back! Register your team by May 30th." },
  { id: 4, title: "Office Renovation - Floor 3", date: "2025-05-18", priority: "medium", content: "Floor 3 will be under renovation from June 5-15. Please use Floor 2 meeting rooms." },
];

export const aiInsights = [
  { type: "attrition_risk", title: "Attrition Risk Alert", description: "Sneha Reddy shows signs of disengagement — 3 consecutive low mood scores, declining attendance. Recommend 1-on-1.", severity: "high", employee: "Sneha Reddy" },
  { type: "performance", title: "Star Performer", description: "Vikram Singh has maintained 95%+ performance for 6 months. Consider promotion or retention bonus.", severity: "positive", employee: "Vikram Singh" },
  { type: "workload", title: "Workload Imbalance", description: "Engineering team is logging 15% more hours than average. Risk of burnout detected.", severity: "medium", employee: null },
  { type: "hiring", title: "Hiring Recommendation", description: "Based on project pipeline, you'll need 2 more frontend developers by Q3.", severity: "info", employee: null },
  { type: "wellness", title: "Team Wellness Dip", description: "Marketing department mood scores dropped 20% this month. Suggest team activity.", severity: "medium", employee: null },
];

export const okrs = [
  { id: "OKR001", objective: "Improve Employee Retention", keyResults: [{ title: "Reduce attrition to <5%", progress: 72 }, { title: "Achieve eNPS score of 60+", progress: 85 }, { title: "Complete 100% of stay interviews", progress: 45 }], owner: "Priya Sharma", quarter: "Q2 2025" },
  { id: "OKR002", objective: "Scale Engineering Team", keyResults: [{ title: "Hire 5 senior engineers", progress: 60 }, { title: "Reduce time-to-hire to 21 days", progress: 40 }, { title: "Achieve 90% offer acceptance", progress: 78 }], owner: "Vikram Singh", quarter: "Q2 2025" },
  { id: "OKR003", objective: "Launch Employee Wellness Program", keyResults: [{ title: "Roll out mental health support", progress: 100 }, { title: "Achieve 70% participation", progress: 55 }, { title: "Improve avg mood score by 15%", progress: 30 }], owner: "Meera Iyer", quarter: "Q2 2025" },
];

export const recentActivities = [
  { id: 1, action: "Leave Approved", description: "Arjun Nair's earned leave approved for Jun 1-5", time: "2 hours ago", type: "leave" },
  { id: 2, action: "New Employee Added", description: "Karthik Rajan onboarded to Engineering", time: "5 hours ago", type: "onboarding" },
  { id: 3, action: "Payroll Processed", description: "May 2025 payroll processed for 11 employees", time: "1 day ago", type: "payroll" },
  { id: 4, action: "Performance Review", description: "Q1 reviews completed for Design team", time: "2 days ago", type: "performance" },
  { id: 5, action: "Policy Updated", description: "Remote work policy v2.1 published", time: "3 days ago", type: "policy" },
  { id: 6, action: "AI Alert", description: "Attrition risk detected for 1 employee", time: "3 days ago", type: "ai" },
];

export const monthlyAttendanceData = [
  { month: "Jan", present: 95, absent: 3, late: 2 },
  { month: "Feb", present: 93, absent: 4, late: 3 },
  { month: "Mar", present: 96, absent: 2, late: 2 },
  { month: "Apr", present: 94, absent: 3, late: 3 },
  { month: "May", present: 92, absent: 4, late: 4 },
];

export const headcountTrend = [
  { month: "Jan", count: 9 },
  { month: "Feb", count: 9 },
  { month: "Mar", count: 10 },
  { month: "Apr", count: 11 },
  { month: "May", count: 12 },
];

export const expenseCategories = [
  { name: "Salaries", value: 72, color: "#3b82f6" },
  { name: "Benefits", value: 12, color: "#8b5cf6" },
  { name: "Training", value: 6, color: "#06b6d4" },
  { name: "Recruitment", value: 5, color: "#f59e0b" },
  { name: "Others", value: 5, color: "#64748b" },
];

export const upcomingBirthdays = [
  { name: "Rahul Verma", date: "May 28", department: "Engineering" },
  { name: "Meera Iyer", date: "Jun 3", department: "HR" },
  { name: "Vikram Singh", date: "Jun 12", department: "Engineering" },
];

export const holidays = [
  { name: "Eid al-Adha", date: "2025-06-07", type: "public" },
  { name: "Independence Day", date: "2025-08-15", type: "public" },
  { name: "Company Foundation Day", date: "2025-06-20", type: "company" },
];

export const documents = [
  { id: "DOC001", name: "Employee Handbook v3.2", type: "Policy", uploadedBy: "Priya Sharma", date: "2025-04-10", size: "2.4 MB", visibility: "all" },
  { id: "DOC002", name: "Remote Work Policy", type: "Policy", uploadedBy: "Priya Sharma", date: "2025-05-15", size: "890 KB", visibility: "all" },
  { id: "DOC003", name: "Q1 2025 Performance Report", type: "Report", uploadedBy: "System", date: "2025-04-01", size: "1.8 MB", visibility: "hr" },
  { id: "DOC004", name: "Health Insurance Guide", type: "Benefits", uploadedBy: "Meera Iyer", date: "2025-03-20", size: "3.1 MB", visibility: "all" },
  { id: "DOC005", name: "Onboarding Checklist", type: "Template", uploadedBy: "Meera Iyer", date: "2025-02-10", size: "450 KB", visibility: "hr" },
];

// Document requests HR sends to employees
export const docRequests = [
  { id: "DR001", employeeId: "EMP011", employeeName: "Karthik Rajan", docType: "Aadhaar Card", status: "pending",  requestedOn: "2025-06-01", dueDate: "2025-06-10", note: "Required for BGV verification", uploadedFile: null },
  { id: "DR002", employeeId: "EMP011", employeeName: "Karthik Rajan", docType: "PAN Card",     status: "pending",  requestedOn: "2025-06-01", dueDate: "2025-06-10", note: "Required for payroll tax processing", uploadedFile: null },
  { id: "DR003", employeeId: "EMP011", employeeName: "Karthik Rajan", docType: "Bank Account Details", status: "pending", requestedOn: "2025-06-01", dueDate: "2025-06-08", note: "Salary disbursement setup", uploadedFile: null },
  { id: "DR004", employeeId: "EMP011", employeeName: "Karthik Rajan", docType: "Educational Certificates", status: "pending", requestedOn: "2025-06-01", dueDate: "2025-06-15", note: "Degree/diploma for BGV", uploadedFile: null },
  { id: "DR005", employeeId: "EMP008", employeeName: "Meera Iyer",    docType: "Address Proof", status: "uploaded", requestedOn: "2025-05-20", dueDate: "2025-05-30", note: "Updated address proof needed", uploadedFile: "address_proof_meera.pdf" },
  { id: "DR006", employeeId: "EMP008", employeeName: "Meera Iyer",    docType: "PAN Card",      status: "verified", requestedOn: "2025-03-01", dueDate: "2025-03-10", note: "Tax records", uploadedFile: "pan_meera.pdf" },
  { id: "DR007", employeeId: "EMP005", employeeName: "Arjun Nair",    docType: "Aadhaar Card",  status: "verified", requestedOn: "2025-01-10", dueDate: "2025-01-20", note: "BGV onboarding", uploadedFile: "aadhaar_arjun.pdf" },
  { id: "DR008", employeeId: "EMP005", employeeName: "Arjun Nair",    docType: "Bank Account Details", status: "uploaded", requestedOn: "2025-05-25", dueDate: "2025-06-05", note: "Bank change request", uploadedFile: "bank_arjun.pdf" },
];

// New joinee AI alerts for missing docs (employees joined in last 90 days)
export const newJoineeAlerts = [
  { employeeId: "EMP011", employeeName: "Karthik Rajan", joinDate: "2023-07-01", missingDocs: ["Aadhaar Card", "PAN Card", "Bank Account Details", "Educational Certificates"], daysLeft: 7 },
];

export const shifts = [
  { name: "General", time: "9:00 AM - 6:00 PM", employees: 8 },
  { name: "Early Bird", time: "7:00 AM - 4:00 PM", employees: 2 },
  { name: "Flexible", time: "Core: 11 AM - 4 PM", employees: 2 },
];
