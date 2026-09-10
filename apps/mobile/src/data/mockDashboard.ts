import type { Role } from "@apms/domain";
import type { ChartDatum, SelectOption } from "@/components/ui";

export type RiskDatum = {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
};

export type DashboardMock = {
  trendTitle: string;
  trendSubtitle: string;
  trend: ChartDatum[];
  risk: RiskDatum[];
  tableTitle: string;
  tableColumns: string[];
  tableRows: string[][];
};

export const DASHBOARD_MOCKS: Record<Role, DashboardMock> = {
  faculty: {
    trendTitle: "Assigned Class Performance",
    trendSubtitle: "Fictional average score by grading period",
    trend: [
      { label: "P1", value: 76 },
      { label: "P2", value: 79 },
      { label: "P3", value: 82 },
      { label: "P4", value: 85 },
    ],
    risk: [
      { label: "Low", value: 26, tone: "success" },
      { label: "Medium", value: 8, tone: "warning" },
      { label: "High", value: 4, tone: "danger" },
    ],
    tableTitle: "Recent Classes",
    tableColumns: ["Code", "Class", "Section", "Students", "Status"],
    tableRows: [
      ["IT-301", "Data Structures and Algorithms", "BSIT 2A", "38", "Active"],
      ["IT-305", "Database Systems", "BSIT 2B", "35", "Active"],
      ["BA-210", "Operations Management", "BSBA 2A", "42", "Active"],
    ],
  },
  academic_admin: {
    trendTitle: "Institution Performance Trend",
    trendSubtitle: "Fictional program averages · First Semester 2026–2027",
    trend: [
      { label: "Jun", value: 76 },
      { label: "Jul", value: 78 },
      { label: "Aug", value: 81 },
      { label: "Sep", value: 80 },
      { label: "Oct", value: 84 },
      { label: "Nov", value: 86 },
    ],
    risk: [
      { label: "Low", value: 78, tone: "success" },
      { label: "Medium", value: 17, tone: "warning" },
      { label: "High", value: 5, tone: "danger" },
    ],
    tableTitle: "Recent Classes",
    tableColumns: ["Code", "Class", "Section", "Students", "Status"],
    tableRows: [
      ["IT-301", "Data Structures and Algorithms", "BSIT 2A", "38", "Active"],
      ["IT-305", "Database Systems", "BSIT 2B", "35", "Active"],
      ["BA-210", "Operations Management", "BSBA 2A", "42", "Active"],
    ],
  },
  system_admin: {
    trendTitle: "Active User Trend",
    trendSubtitle: "Fictional user activity in the last seven days",
    trend: [
      { label: "Thu", value: 191 },
      { label: "Fri", value: 205 },
      { label: "Sat", value: 142 },
      { label: "Sun", value: 130 },
      { label: "Mon", value: 228 },
      { label: "Tue", value: 236 },
      { label: "Wed", value: 240 },
    ],
    risk: [
      { label: "Students", value: 240, tone: "success" },
      { label: "Faculty", value: 15, tone: "success" },
      { label: "Dean", value: 8, tone: "warning" },
      { label: "Operators", value: 3, tone: "danger" },
    ],
    tableTitle: "Recent Activity",
    tableColumns: ["Activity", "Subject", "When", "Status"],
    tableRows: [
      [
        "New user registered",
        "Juan Dela Cruz (Student)",
        "5 min ago",
        "Success",
      ],
      ["Password reset", "Dr. Sarah Kim", "1 hour ago", "Success"],
      ["Role updated", "Ana Garcia → Inactive", "3 hours ago", "Success"],
      [
        "System settings updated",
        "Session timeout changed",
        "1 day ago",
        "Success",
      ],
    ],
  },
};

export const ANALYTICS_SERIES: Record<string, ChartDatum[]> = {
  Overview: [
    { label: "Jun", value: 76 },
    { label: "Jul", value: 78 },
    { label: "Aug", value: 81 },
    { label: "Sep", value: 80 },
    { label: "Oct", value: 84 },
    { label: "Nov", value: 86 },
  ],
  Trends: [
    { label: "P1", value: 74 },
    { label: "P2", value: 79 },
    { label: "P3", value: 83 },
    { label: "Final", value: 86 },
  ],
  "Risk Factors": [
    { label: "Attendance", value: 18 },
    { label: "Assessments", value: 12 },
    { label: "Missing work", value: 8 },
    { label: "Engagement", value: 5 },
  ],
};

export const TIMEZONE_OPTIONS: SelectOption[] = [
  { label: "Asia/Manila (UTC+08:00)", value: "Asia/Manila" },
  { label: "Asia/Singapore (UTC+08:00)", value: "Asia/Singapore" },
  { label: "Asia/Tokyo (UTC+09:00)", value: "Asia/Tokyo" },
  { label: "Australia/Sydney", value: "Australia/Sydney" },
  { label: "Europe/London", value: "Europe/London" },
  { label: "America/New_York", value: "America/New_York" },
];

export const LANGUAGE_OPTIONS: SelectOption[] = [
  { label: "English", value: "en" },
  { label: "Filipino", value: "fil" },
  { label: "Spanish", value: "es" },
  { label: "Japanese", value: "ja" },
];

export const SESSION_OPTIONS: SelectOption[] = ["15", "30", "60", "120"].map(
  (value) => ({ label: `${value} minutes`, value }),
);
export const LOCKOUT_OPTIONS: SelectOption[] = ["3", "5", "10"].map(
  (value) => ({ label: `${value} failed attempts`, value }),
);
export const AUTH_PROVIDER_OPTIONS: SelectOption[] = [
  "Supabase Auth",
  "Institution SSO",
  "Email OTP",
].map((value) => ({ label: value, value }));
export const RETENTION_OPTIONS: SelectOption[] = [
  "1 year",
  "2 years",
  "5 years",
].map((value) => ({ label: value, value }));

export const SYSTEM_DEFAULTS = {
  systemName: "APMS – AI-Powered Student Performance Monitoring",
  institutionName: "Southwestern University PHINMA",
  contactEmail: "apms-admin@swu.edu.ph",
  timezone: "Asia/Manila",
  language: "en",
  sessionMinutes: "60",
  lockoutThreshold: "5",
  dataRetention: "2 years",
  provider: "Supabase Auth",
};

export const EVENT_DEPARTMENT_OPTIONS: SelectOption[] = [
  "College of Information Technology",
  "School of Business",
  "General Education",
].map((value) => ({ label: value, value }));
export const EVENT_CATEGORY_OPTIONS: SelectOption[] = [
  "assessment",
  "meeting",
  "training",
  "seminar",
  "event",
].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value }));
export const EVENT_PRIORITY_OPTIONS: SelectOption[] = [
  "low",
  "medium",
  "high",
  "urgent",
].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value }));
export const EVENT_AUDIENCE_OPTIONS: SelectOption[] = [
  "All students",
  "Faculty",
  "Students and faculty",
  "Department administrators",
].map((value) => ({ label: value, value }));
export const EVENT_STATUS_OPTIONS: SelectOption[] = [
  { label: "Draft", value: "draft" },
  { label: "Scheduled", value: "scheduled" },
];
export const EVENT_FORM_DEFAULTS = {
  title: "Academic Performance Review",
  description: "Review approved assessment results and intervention plans.",
  department: EVENT_DEPARTMENT_OPTIONS[0].value,
  category: "meeting",
  priority: "medium",
  audience: "Students and faculty",
  status: "scheduled",
  startsAt: "2026-09-15 09:00",
  endsAt: "2026-09-15 11:00",
};
