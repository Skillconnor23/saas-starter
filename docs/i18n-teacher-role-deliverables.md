# i18n by role: TEACHER – deliverables

## Teacher routes covered

| Route | Description |
|-------|-------------|
| `/dashboard/teacher` | Teacher dashboard (title, subtitle, My Classes, Next session, KPIs, Needs attention, View all) |
| `/dashboard/teacher/students` | Students across classes (filters, table: Student, Class, Gecko level, Status, Message) |
| `/dashboard/teacher/schedule` | Schedule (title, ScheduleView) |
| `/dashboard/teacher/people` | People / class rosters (title, Class rosters, no classes yet) |
| `/dashboard/teacher/calendar` | Calendar (title, Upcoming classes, filter form, list view, empty state) |
| `/dashboard/teacher/learning/flashcards` | Flashcards list (create deck form, your decks, manage, publish/unpublish) |
| `/dashboard/teacher/learning/flashcards/[deckId]` | Deck detail (deck details, add card, cards list, save/remove) |
| `/teacher/classes` | Classes (title, subtitle, ClassHealthCards: filters, roster, open classroom) |
| `/teacher/quizzes` | Quizzes list (Drafts, Published, New quiz, Edit, Results) |
| `/teacher/quizzes/new` | New quiz (quiz details, assign to classes, save quiz) |
| `/teacher/quizzes/[quizId]/edit` | Edit quiz (quiz details, questions, add question, publish, remove) |
| `/teacher/quizzes/[quizId]/results` | Quiz results (submissions, average score, student scores table) |

---

## Files changed

### Teacher dashboard (app)

- **`app/.../dashboard/teacher/page.tsx`** – `getTranslations('teacher.dashboard')`, `getLocale()`. Title, subtitle, next session card, join, KPI labels, needs attention (all labels), view all link (locale-aware).
- **`app/.../dashboard/teacher/teacher-my-classes.tsx`** – Made async, `getTranslations('teacher.myClasses')`. My Classes title, desc, no classes yet, students count (plural), Roster, Classroom, 30 Days label on ScoreRing.
- **`app/.../dashboard/teacher/students/page.tsx`** – `getTranslations('teacher.students')`. Title, students across classes, table headers, status badges (active/paused), Message button.
- **`app/.../dashboard/teacher/students/teacher-students-filters.tsx`** – `useTranslations('teacher.filters')`, `useLocale()`. Search placeholder, sr-only, All classes, Apply; locale-aware submit URL.
- **`app/.../dashboard/teacher/schedule/page.tsx`** – `getTranslations('teacher.schedule')`. Title.
- **`app/.../dashboard/teacher/people/page.tsx`** – `getTranslations('teacher.people')`. Title, Class rosters, description, no classes yet.
- **`app/.../dashboard/teacher/calendar/page.tsx`** – `getTranslations('teacher.calendar')`. Title, upcoming classes, next days + timezone, filter labels and options for CalendarFilterForm, days label and empty message for CalendarListView.

### Teacher learning (flashcards)

- **`app/.../dashboard/teacher/learning/flashcards/page.tsx`** – `getTranslations('teacher.flashcards')`. Title, subtitle, create new deck (labels, scope, select class, create deck), your decks, no decks yet, cards count, global/class deck, published/draft, manage, publish/unpublish.
- **`app/.../dashboard/teacher/learning/flashcards/[deckId]/page.tsx`** – `getTranslations('teacher.flashcards')`. Back to Flashcards, cards in deck, deck details, save deck, add card (front/back/example labels and placeholders), cards, no cards yet, save card, remove, publish/unpublish.

### Teacher classes & quizzes (app)

- **`app/.../teacher/classes/page.tsx`** – `getTranslations('teacher.classes')`. Title, subtitle.
- **`app/.../teacher/classes/ClassHealthCards.tsx`** – `useTranslations('teacher.classes')`. No classes yet, filter tabs (All, Needs attention, Active today), ofClasses count, no upcoming session / today / tomorrow in formatNextSession, student(s), quiz(s), homework, roster, open classroom, no classes match filter.
- **`app/.../teacher/quizzes/page.tsx`** – `getTranslations('teacher.quizzes')`. Title, subtitle, New quiz, Drafts, Published, no drafts/no published, Edit, Results.
- **`app/.../teacher/quizzes/new/page.tsx`** – `getTranslations('teacher.quizzes')`. Back to Quizzes, new quiz title/subtitle, quiz details, title/description labels and placeholders, assign to classes, select at least one, save quiz.
- **`app/.../teacher/quizzes/[quizId]/edit/page.tsx`** – `getTranslations('teacher.quizzes')`. Back to Quizzes, edit quiz title, published/draft, publish quiz, quiz details form, questions section (add one to publish, questions count, no questions yet), question number, (correct), remove.
- **`app/.../teacher/quizzes/[quizId]/results/page.tsx`** – `getTranslations('teacher.quizzes')`. Back to Quizzes, results title, submissions, average score, student scores, no submissions yet, student, submitted, score.

### Shared components

- **`components/quizzes/AddQuestionModal.tsx`** – Uses `useTranslations('quizzes.addQuestion')`. Title, promptLabel, optionsLabel, optionPlaceholder (with letter), correctLabel, cancel, saveQuestion, saving.
- **`components/quizzes/AddQuestionButton.tsx`** – `useTranslations('quizzes.addQuestion')` for button label (title).

### Messages

- **`messages/en.json`** – Removed duplicate root `quizzes` block; merged `addQuestion` (full keys) into main `quizzes`. New top-level **`teacher`**: `dashboard`, `myClasses`, `students`, `filters`, `schedule`, `people`, `calendar`, `flashcards` (with `scopeClass`), `classes`, `quizzes`.
- **`messages/mn.json`** – Same: single `quizzes` with `addQuestion`, and full `teacher` namespace with Mongolian translations.

---

## Namespaces used

- **teacher.dashboard** – Dashboard page and next session card
- **teacher.myClasses** – My Classes card and ScoreRing label
- **teacher.students** – Students page and table
- **teacher.filters** – Students filter form (shared pattern with schoolAdmin)
- **teacher.schedule** – Schedule page title
- **teacher.people** – People page
- **teacher.calendar** – Calendar page and filter/list labels
- **teacher.flashcards** – Flashcards list and deck detail (create deck, your decks, deck details, add card, cards)
- **teacher.classes** – Classes page and ClassHealthCards (filters, formatNextSession, roster, open classroom)
- **teacher.quizzes** – Quizzes list, new, edit, results (all labels and buttons)
- **quizzes.addQuestion** – Add question modal and button (title, promptLabel, optionsLabel, optionPlaceholder, correctLabel, cancel, saveQuestion, saving)

---

## Remaining hardcoded teacher-visible strings (not converted)

1. **Day abbreviations** – `DAY_DISPLAY` in teacher-my-classes.tsx and ClassHealthCards (Sun, Mon, …); same as school admin, could go to `schedule` or `common` later.
2. **Error messages** – Flashcard and quiz server actions that redirect with `?error=...` still use English strings; can be switched to error keys + client translation in a follow-up.
3. **Date/time formatting** – toLocaleDateString / toLocaleTimeString without locale; consider passing locale for localized dates.
4. **Quiz results** – Submitted date cell is formatted server-side; label "Submitted" is translated, value format is not locale-aware.

---

## Verification

- `/en/dashboard/teacher` and `/mn/dashboard/teacher` show translated title, subtitle, next session, KPIs, needs attention.
- Teacher Students, Schedule, People, Calendar, Flashcards, Classes, Quizzes (list/new/edit/results) show translated copy when switching locale.
- Add question modal and button use `quizzes.addQuestion` and display in the current locale.
