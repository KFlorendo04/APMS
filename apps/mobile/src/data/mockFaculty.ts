export type FacultyStudent = {
  id: string; name: string; email: string; phone: string; year: string; section: string;
  remarks: 'approved' | 'pending' | 'under review' | 'at risk'; status: 'complete' | 'incomplete'; score: number;
};

export type FacultyRecord = {
  subject: string; section: string; semester: string; students: number; passed: number; failed: number;
  average: number; lowest: number; highest: number; date: string;
};

export const FACULTY_STUDENTS: FacultyStudent[] = [
  { id: 'SWU-001', name: 'Maria Santos', email: 'maria.santos@email.com', phone: '+63 912 345 6789', year: 'Y1', section: 'A1', remarks: 'approved', status: 'complete', score: 87 },
  { id: 'SWU-002', name: 'Juan Dela Cruz', email: 'juan.delacruz@email.com', phone: '+63 923 456 7890', year: 'Y2', section: 'B2', remarks: 'pending', status: 'incomplete', score: 72 },
  { id: 'SWU-003', name: 'Ana Reyes', email: 'ana.reyes@email.com', phone: '+63 934 567 8901', year: 'Y3', section: 'C1', remarks: 'under review', status: 'complete', score: 91 },
  { id: 'SWU-004', name: 'Pedro Garcia', email: 'pedro.garcia@email.com', phone: '+63 945 678 9012', year: 'Y3', section: 'C2', remarks: 'approved', status: 'complete', score: 84 },
  { id: 'SWU-005', name: 'Carmen Lopez', email: 'carmen.lopez@email.com', phone: '+63 956 789 0123', year: 'Y2', section: 'B1', remarks: 'at risk', status: 'incomplete', score: 58 },
  { id: 'SWU-006', name: 'Rico Tan', email: 'rico.tan@email.com', phone: '+63 967 890 1234', year: 'Y1', section: 'A2', remarks: 'approved', status: 'complete', score: 79 },
  { id: 'SWU-007', name: 'Lisa Martinez', email: 'lisa.martinez@email.com', phone: '+63 978 901 2345', year: 'Y2', section: 'B3', remarks: 'at risk', status: 'incomplete', score: 62 },
  { id: 'SWU-008', name: 'Carlos Ramos', email: 'carlos.ramos@email.com', phone: '+63 989 012 3456', year: 'Y3', section: 'C3', remarks: 'approved', status: 'complete', score: 88 },
];

export const FACULTY_RECORDS: FacultyRecord[] = [
  { subject: 'Data Structures', section: 'BSCS-3A', semester: '1st Semester', students: 42, passed: 36, failed: 6, average: 82, lowest: 45, highest: 96, date: 'Oct 15, 2025' },
  { subject: 'Database Systems', section: 'BSIT-2B', semester: '1st Semester', students: 38, passed: 30, failed: 8, average: 76, lowest: 51, highest: 93, date: 'Oct 16, 2025' },
  { subject: 'Web Development', section: 'BSCS-2A', semester: '1st Semester', students: 45, passed: 40, failed: 5, average: 85, lowest: 62, highest: 98, date: 'Nov 2, 2025' },
  { subject: 'Operating Systems', section: 'BSCS-3B', semester: '1st Semester', students: 40, passed: 32, failed: 8, average: 74, lowest: 48, highest: 91, date: 'Nov 10, 2025' },
  { subject: 'Software Engineering', section: 'BSIT-3A', semester: '2nd Semester', students: 35, passed: 31, failed: 4, average: 88, lowest: 67, highest: 99, date: 'Mar 5, 2026' },
  { subject: 'Capstone Project', section: 'BSCS-4A', semester: '2nd Semester', students: 30, passed: 28, failed: 2, average: 91, lowest: 70, highest: 100, date: 'Mar 20, 2026' },
  { subject: 'Networking', section: 'BSIT-2A', semester: '2nd Semester', students: 44, passed: 35, failed: 9, average: 73, lowest: 42, highest: 90, date: 'Apr 1, 2026' },
];

export const FACULTY_FEEDBACK_TEMPLATES = [
  ['Excellent Performance', 'score >= 90', 'Outstanding work! Keep up the excellent academic performance.'],
  ['Good Performance', 'score >= 80 && score < 90', 'Great job! You are performing well. Keep building on this progress.'],
  ['Needs Improvement', 'score >= 70 && score < 80', 'You are making progress, but focused practice will improve your results.'],
  ['At Risk', 'score < 70', 'Your performance requires immediate attention. Please schedule a consultation.'],
  ['Low Participation', 'participation < 70', 'Increase your class participation and complete all assigned activities.'],
  ['Attendance Warning', 'attendance < 75', 'Your attendance is below the required level. Please contact your instructor.'],
] as const;

export const FACULTY_TRENDS = {
  average: [78, 80, 82, 79, 83, 85, 84],
  passing: [72, 75, 79, 74, 82, 84, 81],
  failing: [18, 14, 11, 16, 8, 6, 9],
};

export const FACULTY_EVENTS = [
  { title: 'Midterm Examination Period', date: 'Sep 22, 2026', time: '8:00 AM - 5:00 PM', location: 'All Classrooms', attendees: 240, type: 'Assessment' },
  { title: 'Faculty Consultation Day', date: 'Oct 3, 2026', time: '9:00 AM - 3:00 PM', location: 'Conference Room A', attendees: 45, type: 'Meeting' },
];
