# Hardcoded user-facing strings – i18n checklist

## app/(marketing)

| File | Exact string(s) | Recommended namespace + key | Status |
|------|-----------------|-----------------------------|--------|
| `academy/page.tsx` | Image alts | `marketing.home.heroImageAlt`, `platformImageAlt` | ✅ Done |
| `schools/page.tsx` | Hero, trust strip, problem/solution, how it works, features, teacher addon, footer CTA | `marketing.schools.*` | ✅ Done |
| `schools/pricing/page.tsx` | Hero, "Book a Demo", "For students? View Gecko Academy pricing", section headings, FAQ, CTA banner | `pricingSchools.*` + `common.cta.*` | ✅ Done |
| `pricing/page.tsx` | Hero, "Start Free Trial", "For schools? View GeckoTeach pricing", section headings, FAQ, CTA banner | `pricingStudents.*` + `common.cta.*` | ✅ Done |
| `pricing/PricingPageClient.tsx` | `billingToggleLabel = "Billing"` | Parent passes `pricingStudents.billingToggleLabel` | ✅ Done |
| `schools/pricing/SchoolsPricingPageClient.tsx` | (tiers from parent; no local strings) | — | ✅ N/A |
| `trial/page.tsx` | Hero, bullets, level labels, booking copy, FAQ q/a | `marketing.trial.*` | ✅ Done |

## components/layout

| File | Exact string(s) | Recommended namespace + key | Status |
|------|-----------------|-----------------------------|--------|
| `MarketingHeader.tsx` | Open/Close menu (aria), Account, role labels | `nav.openMenu`, `nav.closeMenu`, `nav.account`, `nav.roleUser`, `nav.roleSchoolAdmin` | ✅ Done |

## app/(login)

| File | Exact string(s) | Recommended namespace + key | Status |
|------|-----------------|-----------------------------|--------|
| `login.tsx` (Login component) | Form labels, placeholders, buttons, switch links, error messages | `auth.login.*`, `nav.brand`, `errors.auth.*` | ✅ Done |
| Login actions | Return error keys (`invalidCredentials`, `createUserFailed`, etc.) so client can translate | — | ✅ Done |

## app/(dashboard) – small batch done

| File | Exact string(s) | Recommended namespace + key | Status |
|------|-----------------|-----------------------------|--------|
| `dashboard-sidebar.tsx` | 'My class', 'Join class', "Close menu", "Menu", all nav group/item labels | `dashboard.sidebar.{student,teacher,schoolAdmin,admin}.*`, `nav.closeMenu`, `nav.mobileMenu` | ✅ Done |

## app/(dashboard) – remaining

| File | Exact string(s) | Recommended namespace + key |
|------|-----------------|-----------------------------|
| `student/homework/page.tsx` | `'No due date'`, `'Not submitted'` | `dashboard.homework.noDueDate`, `dashboard.homework.notSubmitted` |
| `student/homework/.../HomeworkDetailClient.tsx` | `'No due date'`, `'Resubmit'`, `'Submit homework'`, placeholder | `dashboard.homework.*` |
| `homework/page.tsx`, `homework/[homeworkId]/page.tsx` | `'No due date'` | `dashboard.homework.noDueDate` |
| `homework/create/create-homework-form.tsx` | `'Something went wrong.'`, placeholder, `'Create homework'` | `errors.generic`, `dashboard.homework.*` |
| `homework/.../HomeworkSubmissionRow.tsx` | placeholder "Teacher feedback...", `'Save feedback'` | `dashboard.homework.*` |
| `learning/[quizId]/page.tsx` | placeholder "Type your answer" | `dashboard.learning.answerPlaceholder` |
| `teacher/learning/flashcards/page.tsx` | placeholder "Optional note for students.", `'Global'`, `'Class deck'` | `dashboard.flashcards.*` |
| `teacher/learning/flashcards/[deckId]/page.tsx` | placeholders (English word, Meaning, etc.) | `dashboard.flashcards.*` |
| `student/page.tsx` | Welcome text, status labels ("On track", etc.), "Average score not available" | `dashboard.student.*` |
| `student/learning/page.tsx` | "This month" | `dashboard.learning.thisMonth` |
| `student/learning/flashcards/saved/page.tsx` | emptyMessage | `dashboard.flashcards.noSavedWords` |
| `student/learning/flashcards/[deckId]/page.tsx` | emptyMessage "This deck has no cards yet." | `dashboard.flashcards.emptyDeck` |
| `profile/profile-card.tsx` | Upload errors, placeholder "Your name" | `dashboard.profile.*`, `common.yourName` |
| `classroom/.../TeacherCard.tsx` | Teacher placeholder text | `classroom.teacherPlaceholder` |
| `school-admin/SchoolAdminClassTable.tsx` | "On track", "Needs attention: low activity..." | `dashboard.status.*` |
| `teacher/classes/ClassHealthCards.tsx` | "No upcoming session", "Needs attention", "Active today" | `dashboard.schedule.*`, `dashboard.status.*` |
| `teacher/quizzes/[quizId]/edit/page.tsx` | "Add at least one question to publish." | `dashboard.quizzes.addQuestionToPublish` |
| `teacher/quizzes/new/page.tsx` | placeholder "Short note about this quiz." | `dashboard.quizzes.quizNotePlaceholder` |
| `messages/messages-view.tsx` | "Back to conversations", placeholder "Type a message..." | `dashboard.messages.*` |
| `classroom/.../classroom-quick-status.tsx` | `'Next class'` | `dashboard.schedule.nextClass` |
| `admin/users/admin-users-table.tsx` | "Select all users" (aria-label) | `dashboard.admin.selectAllUsers` |
| `school-admin/students/...-filters.tsx` | placeholder "Search by name or email" | `common.searchByNameOrEmail` |
| `admin/users/admin-users-filters.tsx` | placeholder "Search by name or email" | `common.searchByNameOrEmail` |
| `admin/users/assign-student-modal.tsx` | placeholder "Search classes..." | `dashboard.admin.searchClasses` |
| `teacher/students/teacher-students-filters.tsx` | placeholder "Search by name or email" | `common.searchByNameOrEmail` |
| `admin/classes/.../WeeklyScheduleCard.tsx` | "Saving...", "Save schedule" | `common.saving`, `dashboard.schedule.saveSchedule` |
| `admin/classes/.../assign-teacher-section.tsx` | "Enter at least 1 character", placeholder "Search teachers..." | `errors.minSearchLength`, `dashboard.admin.searchTeachers` |
| `student/join/join-class-form.tsx` | "Joining...", "Join class" | `common.joining`, `dashboard.joinClass` |
| `admin/classes/.../add-teacher-form.tsx` | "Adding...", "Add teacher" | `common.adding`, `dashboard.admin.addTeacher` |
| `admin/classes/.../add-student-form.tsx` | "Adding...", "Add student" | same pattern |
| `admin/classes/.../add-session-form.tsx` | "Adding...", "Add session" | same pattern |
| `admin/classes/new/create-class-form.tsx` | placeholder "Optional description", "Creating...", "Create class" | `dashboard.admin.*`, `common.creating` |
| `team/page.tsx` | "Billed monthly", "Trial period", "No active subscription", placeholder "Enter email" | `dashboard.team.*`, `common.enterEmail` |
| `general/page.tsx` | placeholders "Enter your name", "Enter your email" | `common.enterYourName`, `common.enterYourEmail` |
| `activity/page.tsx` | "You signed up", "You signed in", "You signed out", etc. | `dashboard.activity.*` |
| `terminal.tsx` | "Copy to clipboard" (aria-label) | `common.copyToClipboard` |

---

**Completed in this pass:** Trial page, Pricing (students) page + PricingPageClient, Schools pricing page, Login UI (auth.login + errors.auth), Dashboard sidebar (nav labels + all role menus).

**FAQ structure:** All pricing/trial FAQs use consistent `faq.q1`, `faq.a1`, … keys in JSON; pages build FAQ arrays from these and pass to `PricingFAQ` (callers pass translated strings; component unchanged).

**Newly noted:** Login actions now return error keys (`invalidCredentials`, `createUserFailed`, `createTeamFailed`, `invalidOrExpiredInvitation`) for client-side translation. `errors.auth.createTeamFailed` added to en/mn.
