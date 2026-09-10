# Figma Screen Inventory

Source: live Figma file `fonSaD6QrrmutBP86Exo75`, page `0:1` (`Prototypes`). Re-read through the Figma Plugin API on 2026-08-06. The page currently has 20 top-level groups/frames. Values below come from the actual frame tree, not inferred screenshots.

The live file currently selects an additional ungrouped `Login` frame (`354:208`, 1194×826). It is newer than the grouped authentication variants and includes email/password, Remember me, Forgot password, Sign In, an `or` divider, and **Sign In with Google**. Implementation work treats `354:208` as the current login reference while retaining the older role-state frames as interaction references.

## Primary screens

| Role/group | Figma node | Screen | Viewport |
|---|---|---|---|
| Authentication | `309:4094` | Login / role selector | 1194x826 |
| Authentication (current ungrouped) | `354:208` | Login with Google option | 1194x826 |
| Authentication | `309:4161` | Faculty/Admin login state | 1194x826 |
| Authentication | `309:4228` | Institutional Admin login state | 1194x826 |
| Authentication | `309:4295` | System Operator login state | 1194x826 |
| Authentication | `309:4362` | Super Admin login state | 1194x826 |
| Faculty | `309:4915` | Faculty Overview | 1179x871 |
| Faculty | `309:5312` | Student Management | 1179x871 |
| Faculty | `309:5626` | Class Records | 1194x871 |
| Faculty | `309:6244` | Performance Feedback | 1179x871 |
| Faculty | `309:6459` | Analytics & Insights | 1179x871 |
| Faculty | `309:6020` | Settings | 1179x871 |
| Faculty | `309:4626` | Settings - Password | 1179x869 |
| Faculty | `309:4430` | APMS AI Assistant | 1179x871 |
| Student | `281:938` | Dashboard Overview | 1179x826 |
| Student | `281:446` | Grades | 1179x826 |
| Student | `281:250` | Performance Feedback | 1179x826 |
| Student | `281:747` | Settings | 1179x836 |
| Student | `281:166` | Login (legacy/alternate) | 1194x826 |
| Grader | `281:3059` | Dashboard Overview | 1179x826 |
| Grader | `281:1743` | Grades - collection/entry state | 1179x826 |
| Grader | `281:2160` | Grades - submission state | 1179x826 |
| Grader | `281:2484` | Grades - status/review state | 1179x826 |
| Grader | `281:2873` | Settings | 1179x836 |
| Grader | `281:1463` | Login (legacy/alternate) | 1194x826 |
| Dean | `309:10690` | Dean's Dashboard | 1179x871 |
| Dean | `309:7559` | Student Management | 1179x871 |
| Dean | `309:7897` | Faculty Directory | 1179x871 |
| Dean | `309:8362` | Class Records | 1194x871 |
| Dean | `309:8660` | Performance Evaluation Criteria | 1194x871 |
| Dean | `309:10268` | Performance Evaluation & Prediction | 1194x871 |
| Dean | `309:8927` | Analytics & Insights | 1179x871 |
| Dean | `309:11386` | Events & Calendar | 1179x871 |
| Dean | `309:9487` | Settings | 1179x871 |
| Dean | `309:9735` | Settings - Password | 1179x871 |
| Dean | `309:10048` | APMS AI Assistant | 1179x871 |
| System Operator | `309:11797` | System Operator Dashboard | 1194x871 |
| System Operator | `309:12046` | System Settings | 1194x871 |
| System Operator | `309:12246` | Roles & Permissions | 1194x871 |
| System Operator | `309:12673` | Access & System Logs | 1179x871 |
| System Operator | `309:12455` | Settings | 1179x871 |
| System Operator | `309:13037` | Settings - Password | 1179x871 |
| System Operator | `309:13320` | Additional password/security state | 1179x871 |
| Super Admin | `309:13511` | System Backup | 1194x871 |
| Super Admin | `309:13767` | Admin Accounts | 1194x871 |
| Super Admin | `309:14026` | Access & System Logs | 1194x871 |
| Super Admin | `309:14383` | APMS AI Assistant | 1194x871 |
| Super Admin | `309:14577` | System Settings | 1194x871 |
| Super Admin | `309:14980` | System Settings - Security | 1194x871 |
| Super Admin | `309:15175` | System Settings - Notifications | 1194x871 |
| Super Admin | `309:15356` | System Settings - Backup | 1194x871 |
| Super Admin | `309:15536` | System Settings - System Info | 1194x871 |
| Super Admin | `309:14759` | Settings | 1194x871 |
| Super Admin | `309:15724` | Settings - Password | 1179x871 |

## Modal, popup, toast, and state inventory

- Shared: notification drawer `309:16222`, profile dropdown `309:16321`.
- Student: notification and profile overlays; semester dropdown and mid/bottom selection variants.
- Grader: success toast, notification/profile overlays, assessment-entry dialog, assessment/type dropdown variants.
- Faculty: create/edit event, event success toasts, add student, add/edit class record, security reminder.
- Dean: add/unenroll student, student success/unenroll toasts, student overview/performance/assessments/AI-insights panels, faculty profile, add/edit/delete class record, export toast, add/edit/delete criteria, success toasts, security reminder.
- System Operator: add/edit/delete role, success/removal toasts, export toast, log details, security reminder.
- Super Admin: create backup chooser plus full/database/files variants; restore backup plus variants; backup details/settings; add/edit/delete admin/user; log details; export and success/removal toasts; security reminder.
- Component sets: year levels, departments, event types, positions, categories, priorities, login role dropdowns, semester, assessment, and type selectors with their visible variants.

## Exact design foundation

- Primary font: Inter (Regular, Medium, Semi Bold, Bold). Consolas Regular is used for code/system-style values.
- Common font sizes/line heights: 10/15, 11/16.5, 12/16, 13/19.5, 14/20, 16/24, 18/28, 20/28, 24/32.
- Core palette: brand `#6B2C1F`; brand gradient `#6B2C1F` to `#8B3A2A`; white `#FFFFFF`; surfaces `#F9FAFB`, `#F5F5F7`, `#F3F4F6`, `#F3F3F5`; headings `#101828`; body `#1E2939`; muted `#4A5565`, `#6A7282`, `#99A1AF`; success `#009966`/`#22C55E`; danger `#FB2C36`/`#EF4444`; warning `#FFB900`/`#BB4D00`; info `#155DFC`.
- Common radii: 4, 8, 10, 14, and 16px; large pill values represent fully rounded shapes.
- Common gaps/padding: 4, 6, 8, 10, 12, 16, 20, and 24px; frequent button/input padding is 8x16, 6x12, 4x12, or 10x16.
- Common shadows: cards combine `0 1px 2px -1px rgba(0,0,0,.1)` and `0 1px 3px rgba(0,0,0,.1)`; elevated controls use `0 4px 6px -4px` plus `0 10px 15px -3px`; login panel uses `0 25px 50px -12px rgba(0,0,0,.25)`.
- Desktop shell: left sidebar approximately 208-232px, top header approximately 65-76px, light gray content background, white cards, maroon active navigation.
- Figma defines desktop canvases only. Responsive breakpoints are not encoded and must be implemented as documented assumptions.

## State coverage gaps

The prototype explicitly includes many populated, modal, dropdown, success, and review states. It does not consistently provide dedicated loading skeletons, network/server errors, empty results, access-denied, offline, destructive failure, or mobile frames. These required application states will reuse the approved visual language and are tracked as assumptions rather than omitted.
