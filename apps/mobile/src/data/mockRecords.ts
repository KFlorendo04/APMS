import { classes, logs, students } from "@/data/demo";

export type MockScreenData = { columns: string[]; rows: string[][] };

export const MOCK_SCREEN_RECORDS: Record<string, MockScreenData> = {
  students: {
    columns: ["Student ID", "Student", "Program", "Year Level", "Risk"],
    rows: students,
  },
  records: {
    columns: ["Code", "Class", "Section", "Students", "Status"],
    rows: classes,
  },
  logs: { columns: ["Timestamp", "Actor", "Action", "Status"], rows: logs },
  grades: {
    columns: ["Subject", "Assessment", "Score", "Weighted Grade", "Status"],
    rows: [
      [
        "IT-401 Systems Administration and Maintenance",
        "Midterm Examination",
        "88 / 100",
        "35.2%",
        "Approved",
      ],
      [
        "IT-305 Database Systems",
        "Laboratory Exercises",
        "92 / 100",
        "27.6%",
        "Approved",
      ],
      ["GE-104 Ethics", "Final Project", "—", "—", "Pending"],
    ],
  },
  feedback: {
    columns: ["Date", "Subject", "Summary", "Channel", "Status"],
    rows: [
      [
        "Aug 4, 2026",
        "VALIDATION FEEDBACK",
        "Strong algorithm analysis; improve runtime documentation.",
        "Demo only",
        "Saved",
      ],
      [
        "Jul 29, 2026",
        "IT-305 Database Systems",
        "Review normalization and join selection.",
        "In-app",
        "Read",
      ],
    ],
  },
  faculty: {
    columns: ["Employee ID", "Faculty", "Department", "Classes", "Status"],
    rows: [
      ["F-0102", "Elena Cruz", "CIT", "3", "Active"],
      ["F-0108", "Marco Villanueva", "CIT", "4", "Active"],
      ["F-0121", "Anne Sy", "Business School", "2", "Active"],
    ],
  },
  criteria: {
    columns: ["Criteria Set", "Scope", "Weights", "Effective Date", "Status"],
    rows: [
      [
        "CIT Undergraduate v2",
        "CIT",
        "40 / 30 / 30",
        "Aug 3, 2026",
        "Published",
      ],
      [
        "BSBA Standard v1",
        "Business School",
        "35 / 35 / 30",
        "Aug 3, 2026",
        "Draft",
      ],
    ],
  },
  events: {
    columns: ["Event", "Date", "Audience", "Owner", "Status"],
    rows: [
      [
        "Midterm grade deadline",
        "Sep 25, 2026",
        "Faculty",
        "Dean – CIT",
        "Scheduled",
      ],
      [
        "Performance review week",
        "Oct 5–9, 2026",
        "All programs",
        "Academic Admin",
        "Scheduled",
      ],
    ],
  },
  roles: {
    columns: ["Role", "Users", "Permissions", "Scope", "Status"],
    rows: [
      ["Student", "1,284", "6", "Own records", "Active"],
      ["Faculty", "86", "12", "Assigned classes", "Active"],
      ["Dean", "4", "12", "Department", "Active"],
      ["System Operator", "3", "7", "Technical", "Active"],
    ],
  },
  admins: {
    columns: ["Admin", "Email", "Role", "Last Active", "Status"],
    rows: [
      [
        "Paolo Tan",
        "operator@demo.apms.local",
        "System Operator",
        "5 min ago",
        "Active",
      ],
      [
        "Julia Ong",
        "j.ong@demo.apms.local",
        "System Operator",
        "Yesterday",
        "Active",
      ],
    ],
  },
  backup: {
    columns: ["Backup", "Started", "Size", "Verification", "Status"],
    rows: [
      ["backup-20260806-0800", "Aug 6, 08:00", "482 MB", "Passed", "Completed"],
      ["backup-20260805-0800", "Aug 5, 08:00", "478 MB", "Passed", "Completed"],
    ],
  },
};

export const EMPTY_SCREEN_RECORDS: MockScreenData = {
  columns: ["Item", "Description", "Owner", "Updated", "Status"],
  rows: [],
};
