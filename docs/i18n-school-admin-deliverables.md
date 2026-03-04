# i18n by role: SCHOOL ADMIN – deliverables

## School admin routes covered

| Route | Description |
|-------|-------------|
| `/dashboard/school-admin` | School admin dashboard (title, subtitle, attendance card, KPIs, classes table, needs attention, manage classes) |
| `/dashboard/school-admin/students` | Students page (my classes cards, students across classes table, filters) |
| `/dashboard/school-admin/schedule` | Schedule (title, schedule view) |
| `/dashboard/school-admin/people` | People / class rosters (title, class rosters card, no classes) |
| `/dashboard/school-admin/calendar` | Calendar (title, upcoming classes, filter form, list view, empty state) |

---

## Files changed

### School admin routes (app)

- **`app/(dashboard)/(with-sidebar)/dashboard/school-admin/page.tsx`** – `getTranslations('schoolAdmin.dashboard')`, `getTranslations('schoolAdmin.attendance')`, `getTranslations('common')`, `getLocale()`. Title, subtitle, KPI labels (active students, active classes, avg quiz score, completion rate), classes card (title, click to sort, no classes yet), needs attention (title, low score classes, inactive students 14d, low attempt quizzes, nothing needs attention), manage classes button. Passes translated labels to `SchoolAttendanceMonthCard`. Locale-aware link for Manage classes.

- **`app/(dashboard)/(with-sidebar)/dashboard/school-admin/SchoolAdminClassTable.tsx`** – `useTranslations('schoolAdmin.classTable')`. Table headers: Class, Teacher, Students, Avg score (30d), Attempt rate (30d), Last activity, Status. Status cell title/aria: On track, Needs attention.

- **`app/(dashboard)/(with-sidebar)/dashboard/school-admin/students/page.tsx`** – `getTranslations('schoolAdmin.students')`. Page title, My Classes, description, no classes yet, students count (plural), Roster, Classroom, Students across classes, description, no students match, table headers (Student, Class, Gecko level, Status), status badges (active, paused).

- **`app/(dashboard)/(with-sidebar)/dashboard/school-admin/students/school-admin-students-filters.tsx`** – `useTranslations('schoolAdmin.filters')`, `useLocale()`. Search placeholder, Search sr-only, All classes option, Apply. Locale-aware form submit URL.

- **`app/(dashboard)/(with-sidebar)/dashboard/school-admin/schedule/page.tsx`** – `getTranslations('schoolAdmin.schedule')`. Page title "Schedule".

- **`app/(dashboard)/(with-sidebar)/dashboard/school-admin/people/page.tsx`** – `getTranslations('schoolAdmin.people')`. Title "People", Class rosters, description, no classes yet.

- **`app/(dashboard)/(with-sidebar)/dashboard/school-admin/calendar/page.tsx`** – `getTranslations('schoolAdmin.calendar')`. Title "Calendar", Upcoming classes, next days + timezone subtitle, filter labels and options passed to `CalendarFilterForm`, days label and empty message passed to `CalendarListView`.

### Shared components

- **`components/attendance/AttendanceMonthSummaryCard.tsx`** – `SchoolAttendanceMonthCard`: optional props `title`, `overallLabel`, `lateRateLabel`, `avgParticipationLabel`, `atRiskLabel`, `viewDetailsLabel` (defaults to English). School admin dashboard passes translated strings from `schoolAdmin.attendance` and `common`.

- **`app/(dashboard)/(with-sidebar)/dashboard/teacher/calendar/CalendarFilterForm.tsx`** – Optional props: `classLabel`, `allClassesOption`, `daysLabel`, `option14`, `option30`. School admin calendar page passes translated strings.

- **`components/calendar/CalendarListView.tsx`** – Optional prop `emptyMessage`. School admin calendar page passes translated empty state.

### Messages

- **`messages/en.json`** – New top-level **`schoolAdmin`**: `dashboard` (title, subtitle, activeStudents, activeClasses, avgQuizScoreLabel, completionRate30d, classes, clickToSort, noClassesYet, needsAttention, lowScoreClasses, inactiveStudents14d, lowAttemptQuizzes, nothingNeedsAttention, manageClasses), `classTable` (class, teacher, students, avgScore30d, attemptRate30d, lastActivity, status, onTrackTitle, onTrackAria, needsAttentionTitle, needsAttentionAria), `students` (title, myClasses, myClassesDesc, noClassesYet, studentsCount, studentsCount_other, roster, classroom, studentsAcrossClasses, studentsAcrossDesc, noStudentsMatch, tableStudent, tableClass, geckoLevel, tableStatus, statusActive, statusPaused), `filters` (searchPlaceholder, searchSrOnly, allClasses, apply), `schedule` (title), `people` (title, classRosters, classRostersDesc, noClassesYet), `calendar` (title, upcomingClasses, nextDaysTimezone, nextDaysLabel, filterClass, filterDays, filterAllClasses, days14, days30, emptyRange), `attendance` (titleThisMonth, overall, lateRate, avgParticipation, atRiskStudents).

- **`messages/mn.json`** – Same structure with Mongolian translations.

---

## Namespaces used

- **schoolAdmin.dashboard** – Dashboard page copy and needs-attention labels
- **schoolAdmin.classTable** – Classes table headers and status tooltips/aria
- **schoolAdmin.students** – Students page and table
- **schoolAdmin.filters** – Students page filter form
- **schoolAdmin.schedule** – Schedule page title
- **schoolAdmin.people** – People page
- **schoolAdmin.calendar** – Calendar page and filter/list labels
- **schoolAdmin.attendance** – School-level attendance card labels (used via props on `SchoolAttendanceMonthCard`)
- **common** – viewDetails (for attendance card link)

---

## Remaining hardcoded school-admin–visible strings (not converted)

1. **Day abbreviations** – `DAY_DISPLAY` in `school-admin/students/page.tsx` (Sun, Mon, …) used in `formatScheduleSummary`; could be moved to `common` or `schedule` in a follow-up.
2. **Date/time formatting** – `SchoolAdminClassTable` and other components use `toLocaleDateString` without locale; same as student role, consider passing locale for localized dates.
3. **Dashboard “Manage classes”** – Link target `/dashboard/admin/classes` is correct; locale prefix added. The admin/classes page itself is out of scope for this pass.
4. **Class names, teacher names, student names** – Data from DB; not translated by design.
5. **Enrollment status** – Only “active” and “paused” are translated; any other status value is shown as-is.

---

## Verification

- Visiting `/en/dashboard/school-admin` shows English (e.g. “School Admin Dashboard”, “Active students”, “Needs attention”).
- Visiting `/mn/dashboard/school-admin` shows Mongolian (e.g. “Сургуулийн админы самбар”, “Идэвхтэй сурагчид”, “Анхаарал шаардлагатай”).
- Students, Schedule, People, Calendar pages and filters show translated copy when switching locale.
