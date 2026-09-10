# Visual verification

Verification uses the natural Figma frame viewport and the local Expo web app in explicit fictional demo mode. Reference images come from actual Figma nodes, not the overview canvas.

| Route | Figma node | Viewport | Status | Remaining difference |
|---|---:|---:|---|---|
| `/` | `309:4094` | 1179×826 | close | Native input glyphs differ slightly; card/layout/tokens and source artwork match. |
| `/portal/student/overview` | `281:938` | 1179×826 | close | Charts are code-native approximations; layout, panels, labels, values, sidebar, and header match. |
| `/portal/student/feedback` | `281:250` | 1179×826 | structural review | Per-screen reference comparison remains. |
| `/portal/student/grades` | `281:446` | 1179×826 | structural review | Per-screen reference comparison remains. |
| `/portal/student/settings` | `281:747` | 1179×826 | structural review | Per-screen reference comparison remains. |
| `/portal/grader/*` | `281:1463–3059` | 1179×826 | runtime tested | Per-frame screenshot comparison remains. |
| `/portal/faculty/*` | `309:4430–6459` | 1179×826 | runtime tested | Per-frame screenshot comparison remains. |
| `/portal/academic_admin/*` | `309:7559–11386` | 1179×826 | runtime tested | Per-frame screenshot comparison remains. |
| `/portal/system_operator/*` | `309:11797–13320` | 1179×826 | runtime tested | Per-frame screenshot comparison remains. |
| `/portal/super_admin/*` | `309:13511–15724` | 1179×826 | runtime tested | Per-frame screenshot comparison remains. |

Captured implementation images: `screenshots/login-implemented.png` and `screenshots/student-overview-implemented.png`. All six portal redirects and protected-route behavior were exercised by Playwright at 1194×836; 10/10 passed.
