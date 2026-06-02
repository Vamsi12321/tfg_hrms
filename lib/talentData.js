// ============================================
// TFG HRMS - Internal Talent & JD Matching Data
// ============================================

export const internalRoles = [
  {
    id: "JD001",
    title: "Engineering Manager",
    department: "Engineering",
    level: "L6",
    postedOn: "2025-06-01",
    status: "active",
    priority: "high",
    description: "Lead a team of 8+ engineers, own the technical roadmap, drive architecture decisions, and mentor senior engineers towards leadership.",
    requiredSkills: ["Team Leadership", "System Design", "Node.js", "React", "DevOps", "Agile", "Communication", "Mentoring"],
    niceToHave: ["AWS", "Kubernetes", "Product Sense"],
    minExperience: 6,
    targetTimeline: "30 days",
  },
  {
    id: "JD002",
    title: "Senior Product Manager",
    department: "Product",
    level: "L5",
    postedOn: "2025-05-28",
    status: "active",
    priority: "high",
    description: "Own the product strategy for our core HRMS platform. Work with engineering, design, and customers to define and ship impactful features.",
    requiredSkills: ["Product Strategy", "Data Analysis", "Communication", "Roadmap Planning", "Stakeholder Management", "User Research"],
    niceToHave: ["SQL", "Figma", "B2B SaaS"],
    minExperience: 5,
    targetTimeline: "21 days",
  },
  {
    id: "JD003",
    title: "Lead UI/UX Designer",
    department: "Design",
    level: "L5",
    postedOn: "2025-06-03",
    status: "active",
    priority: "medium",
    description: "Define the visual and interaction design language for TFG products. Lead a small design team and collaborate closely with product and engineering.",
    requiredSkills: ["Figma", "Design Systems", "User Research", "Prototyping", "Leadership", "Visual Design"],
    niceToHave: ["Motion Design", "Accessibility", "Front-end basics"],
    minExperience: 5,
    targetTimeline: "45 days",
  },
  {
    id: "JD004",
    title: "DevOps / Platform Engineer",
    department: "Engineering",
    level: "L4",
    postedOn: "2025-05-20",
    status: "filled",
    priority: "low",
    description: "Own CI/CD pipelines, cloud infrastructure, and platform reliability. Reduce deployment friction and improve developer experience.",
    requiredSkills: ["AWS", "Kubernetes", "CI/CD", "Terraform", "Docker", "Linux", "Monitoring"],
    niceToHave: ["GCP", "Security", "Cost Optimization"],
    minExperience: 4,
    targetTimeline: "30 days",
  },
];

// Employee profiles with skills for matching
export const employeeProfiles = [
  {
    id: "EMP001",
    name: "Rahul Verma",
    designation: "Senior Developer",
    department: "Engineering",
    experience: 4,
    joinDate: "2022-01-10",
    skills: ["React", "Node.js", "TypeScript", "System Design", "Communication", "Agile"],
    currentPerformance: 92,
    potentialRating: "high",
    lastPromotion: "2024-01",
    readiness: "ready-now",
    managerNotes: "Consistently delivers high quality. Strong ownership mindset. Good with cross-functional communication.",
  },
  {
    id: "EMP002",
    name: "Ananya Patel",
    designation: "UI/UX Lead",
    department: "Design",
    experience: 5,
    joinDate: "2021-06-20",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Visual Design", "Leadership", "Accessibility"],
    currentPerformance: 88,
    potentialRating: "high",
    lastPromotion: "2023-06",
    readiness: "ready-now",
    managerNotes: "Strong design instincts. Beginning to mentor junior designers. Good candidate for lead role.",
  },
  {
    id: "EMP003",
    name: "Vikram Singh",
    designation: "Tech Lead",
    department: "Engineering",
    experience: 7,
    joinDate: "2020-09-01",
    skills: ["Team Leadership", "System Design", "React", "Node.js", "DevOps", "Agile", "Mentoring", "Communication", "AWS"],
    currentPerformance: 95,
    potentialRating: "exceptional",
    lastPromotion: "2023-09",
    readiness: "ready-now",
    managerNotes: "Natural leader. Already managing 4 engineers informally. Perfect for EM role.",
  },
  {
    id: "EMP004",
    name: "Sneha Reddy",
    designation: "Marketing Manager",
    department: "Marketing",
    experience: 4,
    joinDate: "2022-04-15",
    skills: ["Communication", "Stakeholder Management", "Data Analysis", "User Research", "Content Strategy"],
    currentPerformance: 78,
    potentialRating: "medium",
    lastPromotion: "2023-04",
    readiness: "needs-development",
    managerNotes: "Good communicator but needs more product exposure before PM transition.",
  },
  {
    id: "EMP005",
    name: "Arjun Nair",
    designation: "Sales Executive",
    department: "Sales",
    experience: 2,
    joinDate: "2023-01-05",
    skills: ["Communication", "Negotiation", "CRM", "Presentation"],
    currentPerformance: 85,
    potentialRating: "medium",
    lastPromotion: null,
    readiness: "needs-development",
    managerNotes: "High energy, good learner. Too early for senior IC or management.",
  },
  {
    id: "EMP009",
    name: "Rohan Gupta",
    designation: "DevOps Engineer",
    department: "Engineering",
    experience: 4,
    joinDate: "2022-05-18",
    skills: ["AWS", "Kubernetes", "CI/CD", "Terraform", "Docker", "Linux", "Monitoring", "Security"],
    currentPerformance: 91,
    potentialRating: "high",
    lastPromotion: "2024-05",
    readiness: "ready-now",
    managerNotes: "Expert in platform engineering. Strong AWS and K8s skills. Ready for senior/lead role.",
  },
  {
    id: "EMP010",
    name: "Pooja Deshmukh",
    designation: "Product Manager",
    department: "Product",
    experience: 6,
    joinDate: "2021-08-10",
    skills: ["Product Strategy", "Roadmap Planning", "Data Analysis", "Stakeholder Management", "User Research", "Communication", "SQL", "Figma"],
    currentPerformance: 84,
    potentialRating: "high",
    lastPromotion: "2023-08",
    readiness: "ready-soon",
    managerNotes: "Solid PM with strong data skills. Ready for senior PM in 6 months with right exposure.",
  },
  {
    id: "EMP012",
    name: "Nisha Agarwal",
    designation: "Legal Counsel",
    department: "Legal",
    experience: 6,
    joinDate: "2020-12-01",
    skills: ["Communication", "Stakeholder Management", "Negotiation", "Research"],
    currentPerformance: 93,
    potentialRating: "high",
    lastPromotion: "2023-12",
    readiness: "not-applicable",
    managerNotes: "Excellent performer but skills are domain-specific to legal.",
  },
];

// Score an employee against a JD
export function scoreCandidate(employee, jd) {
  const matched = [];
  const missing = [];

  for (const skill of jd.requiredSkills) {
    const found = employee.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()));
    if (found) matched.push(skill);
    else missing.push(skill);
  }

  const niceMatched = (jd.niceToHave || []).filter(skill =>
    employee.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(s.toLowerCase()))
  );

  const skillScore     = Math.round((matched.length / jd.requiredSkills.length) * 70);
  const expScore       = employee.experience >= jd.minExperience ? 20 : Math.round((employee.experience / jd.minExperience) * 20);
  const niceScore      = Math.round((niceMatched.length / Math.max(jd.niceToHave?.length || 1, 1)) * 10);
  const totalScore     = Math.min(skillScore + expScore + niceScore, 100);

  const readinessBoost = { "ready-now": 0, "ready-soon": -5, "needs-development": -15, "not-applicable": -30 };
  const finalScore     = Math.max(0, totalScore + (readinessBoost[employee.readiness] || 0));

  return { matched, missing, niceMatched, skillScore, expScore, niceScore, totalScore, finalScore };
}
