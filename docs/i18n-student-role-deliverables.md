# i18n by role: STUDENT – deliverables

## Student routes covered

| Route | Description |
|-------|-------------|
| `/dashboard/student` | Student dashboard overview (welcome, stats, next class, upcoming sessions, what to do next, my progress, needs attention) |
| `/dashboard/student/learning` | Learning hub (quizzes + flashcards tabs, this month, assigned decks, quiz snapshot) |
| `/dashboard/student/learning?tab=quizzes` | Quizzes list (this week, all quizzes, no quizzes yet) |
| `/dashboard/student/learning?tab=flashcards` | Flashcards overview (studied, accuracy, saved words, assigned decks) |
| `/dashboard/student/learning/flashcards/saved` | My Saved Words flashcard study page |
| `/dashboard/student/learning/flashcards/[deckId]` | Study a single deck |
| `/dashboard/student/homework` | Homework list (due, submitted/not submitted, open) |
| `/dashboard/student/homework/[homeworkId]` | Homework detail (instructions, your submission, submit/resubmit form) |
| `/dashboard/student/schedule` | Schedule (timezone, month calendar) |
| `/dashboard/student/join` | Join a class (enter class code form) |
| `/classroom/[classId]` | Classroom page (back to dashboard, people, attendance, quick status: next class, to-do) |

Calendar/schedule panel (day events) and classroom quick status are used on student schedule and classroom pages.

---

## Files changed

### Student dashboard routes (app)

- `app/(dashboard)/(with-sidebar)/dashboard/student/page.tsx` – getTranslations('dashboard.student'), getTranslations('common'); all headings, banners, labels, CTAs, aria-labels
- `app/(dashboard)/(with-sidebar)/dashboard/student/learning/page.tsx` – getTranslations('learning'); title, subtitle, tabs, this month, previous months, studied/accuracy/saved words, assigned decks, no decks, flashcard setup, quiz snapshot labels
- `app/(dashboard)/(with-sidebar)/dashboard/student/learning/flashcards/saved/page.tsx` – getTranslations('learning'); title, subtitle, deckTitle, emptyMessage passed to FlashcardStudyClient
- `app/(dashboard)/(with-sidebar)/dashboard/student/learning/flashcards/[deckId]/page.tsx` – getTranslations('learning'); deckSubtitle, emptyMessage
- `app/(dashboard)/(with-sidebar)/dashboard/student/homework/page.tsx` – getTranslations('homework'), getTranslations('dashboard.sidebar.student'); viewAndSubmit, noHomeworkYet, due, noDueDate, notSubmitted, submittedOn, open
- `app/(dashboard)/(with-sidebar)/dashboard/student/homework/[homeworkId]/page.tsx` – getTranslations('homework'); backToHomework
- `app/(dashboard)/(with-sidebar)/dashboard/student/homework/[homeworkId]/HomeworkDetailClient.tsx` – useTranslations('homework'); instructions, due, noDueDate, downloadWorksheet, yourSubmission, submittedOn, note, files, teacherFeedback, scoreLabel, resubmit, submitHomework, uploadHint, filesLabel, dragDrop, browse, remove, optionalNote, notePlaceholder, submit
- `app/(dashboard)/(with-sidebar)/dashboard/student/schedule/page.tsx` – getTranslations('schedule'), getTranslations('dashboard.sidebar.student'); yourTimezone, schedule title
- `app/(dashboard)/(with-sidebar)/dashboard/student/join/page.tsx` – getTranslations('join'); backToDashboard, joinAClass, enterClassCode, enterClassCodeDesc
- `app/(dashboard)/(with-sidebar)/dashboard/student/join/join-class-form.tsx` – useTranslations('join'); classCode, classCodePlaceholder, joining, joinClass

### Shared components (student-visible)

- `components/learning/StudentQuizList.tsx` – getTranslations('quizzes'), getTranslations('learning'); title, weeklyQuizzes, thisWeek, review, startQuiz, avgScore30d, lastQuiz, completion, allQuizzes, noQuizzesYet, noQuizzesYetDesc, showingCount/showingCountPlural
- `components/learning/FlashcardStudyClient.tsx` – useTranslations('learning'); back, cardOf, sessionComplete, correctOutOf, studyAgain, done, wrongAria, correctAria (emptyMessage/deckTitle from parent)
- `components/attendance/AttendanceMonthSummaryCard.tsx` – 'use client' + useTranslations('common'); attendanceThisMonth, participationAvg, viewDetails, thisMonth
- `components/schedule/MonthCalendar.tsx` – already used schedule.weekdays.short
- `components/schedule/DayEventsPanel.tsx` – useTranslations('schedule'); classesOn, close, join, openClassroom, classTimezone
- `app/(dashboard)/(with-sidebar)/classroom/[classId]/classroom-quick-status.tsx` – 'use client' + useTranslations('classroom'); nextClass, todo, none, pendingCount
- `app/(dashboard)/(with-sidebar)/classroom/[classId]/page.tsx` – getTranslations('classroom'); backToDashboard, people, attendance

### Messages

- `messages/en.json` – added/expanded: dashboard.student (avgScoreAria, avgScoreNotAvailable, attendanceAria, quizzesCompletedAria, needsAttentionPrefix), schedule (yourTimezone, classesOn, close, join, openClassroom, classTimezone), homework.*, learning.*, quizzes.*, join.*, classroom (backToDashboard, people, attendance, nextClass, todo, none, pendingCount, viewDetails), common (participationAvg, thisMonth, attendanceThisMonth, viewDetails)
- `messages/mn.json` – same structure with Mongolian translations

---

## Namespaces used

- **dashboard.student** – overview page (welcome, stats, next class, what to do next, my progress, needs attention, aria)
- **dashboard.sidebar.student** – sidebar labels reused for page titles (homework, schedule)
- **homework** – list and detail (due, noDueDate, notSubmitted, instructions, submit/resubmit, etc.)
- **learning** – learning hub, flashcards, flashcard study UI (back, session complete, study again, done, wrong/correct aria)
- **quizzes** – quiz list (this week, review, start quiz, all quizzes, no quizzes yet, etc.)
- **schedule** – schedule page and day panel (yourTimezone, classesOn, close, join, openClassroom, classTimezone)
- **join** – join class page and form
- **classroom** – classroom page and quick status
- **common** – attendance card (participationAvg, thisMonth, attendanceThisMonth, viewDetails)

---

## Remaining hardcoded student-visible strings (not converted)

1. **app/(dashboard)/(with-sidebar)/dashboard/student/homework/page.tsx** – Page title "Homework" is translated via `tSidebar('homework')`; section title "Homework" in the h1 is the same.
2. **Date/time formatting** – All toLocaleDateString / toLocaleTimeString use 'en-US' or default locale; no locale passed from next-intl. Consider passing locale from useLocale() or getLocale() for client/server for localized date formats in a follow-up.
3. **classroom-feed.tsx, TeacherCard, ClassScoreCard, AddPostMenu, ClassroomComposer** – Not scanned in this pass; may contain student-visible copy (e.g. "Add post", "Send", placeholder text).
4. **Error messages from server actions** – e.g. join class by code errors, homework upload errors; still returned in English from actions. Can be moved to error keys + client-side translation in a later pass.
5. **MonthCalendar** – "Today" button and any other inline strings; only weekdays were already translated. Rest of MonthCalendar not audited in this pass.
6. **Profile/dashboard/profile** – Student profile page was out of scope; may have labels and buttons.
7. **Messages** – `/dashboard/messages` and related message UI were not in scope for this batch.

---

## Verification

- **EN vs MN** – Switching between `/en/...` and `/mn/...` (or locale switcher) should show different text for: welcome/subtitle, class card CTA, stats labels, next class/empty/join/open classroom, upcoming sessions, what to do next, my progress/status, needs attention, learning title/subtitle/tabs, homework viewAndSubmit/noHomeworkYet/due/open, homework detail instructions/submit/resubmit/browse/remove/note placeholder, schedule yourTimezone, join page and form labels, classroom back/people/attendance, quick status next class/todo/none/pending, attendance card title/participation/view details, day panel classes on/close/join/open classroom, quiz list this week/review/start quiz/all quizzes/no quizzes yet, flashcard study back/session complete/study again/done. Well over 10 distinct strings across the student experience.
