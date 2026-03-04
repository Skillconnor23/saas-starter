# Remaining hardcoded strings — punch list (after Schools)

**Format:** `path` → string(s)

---

## Marketing (next priority)

### Schools pricing — `app/(marketing)/schools/pricing/page.tsx`
- Hero: `"GeckoTeach — Pricing for Schools"`, subtitle paragraph, `"Book a Demo"`, `"For students? View Gecko Academy pricing"`
- Section headings: `"Compare plans"`, `"Frequently asked questions"`
- FAQ array: all `question` / `answer` (4 items)
- `PricingCtaBanner`: `headline="Ready to bring Gecko to your school?"`, `subline="Book a demo to see the platform..."`, `primaryLabel="Book a Demo"`, `secondaryLabel="Contact us"`

### Student pricing — `app/(marketing)/pricing/page.tsx`
- Hero: `"Gecko Academy — Pricing"`, subtitle, `"Start Free Trial"`, `"For schools? View GeckoTeach pricing"`
- Section headings: `"Compare plans"`, `"Add-ons"`, `"Optional extras to deepen your learning..."`, `"Frequently asked questions"`
- FAQ array: all `question` / `answer` (4 items)
- `PricingCtaBanner`: `headline="Start learning with Gecko Academy"`, `subline="Join a small group..."`, `primaryLabel="Start Free Trial"`, `secondaryLabel="Contact us"`

### Pricing client components
- `app/(marketing)/pricing/PricingPageClient.tsx` → `billingToggleLabel = "Billing"`
- Tier names/descriptions in `lib/pricing/tiers` if rendered as-is (may need keys in pricingStudents / pricingSchools)

### Trial — `app/(marketing)/trial/page.tsx`
- Hero title, subtitle, bullets (e.g. `"Small groups (8–12 students)"`, `"Real speaking practice"`, `"No payment required"`), CTAs
- Level labels: `"Choose Your Level"`, `"Beginner"`, `"Intermediate / Advanced"`
- Booking title/subtitle, FAQ q/a strings

---

## Login / auth

- `app/(login)/login/Login.tsx` (or sign-in component): form labels, placeholders, button text, error messages, “Forgot password?”, “Sign up” link text

---

## Dashboard (sample; full list in `i18n-hardcoded-checklist.md`)

- `app/(dashboard)/(with-sidebar)/dashboard/dashboard-sidebar.tsx` → `'My class'`, `'Join class'`, `"Close menu"`
- `app/(dashboard)/(with-sidebar)/dashboard/student/homework/page.tsx` → `'No due date'`, `'Not submitted'`
- `app/(dashboard)/(with-sidebar)/dashboard/student/page.tsx` → welcome text, `"On track"`, `"Keep improving"`, `"Needs attention"`, `"Average score not available"`
- `app/(dashboard)/(with-sidebar)/dashboard/homework/create/create-homework-form.tsx` → `'Something went wrong.'`, placeholder, `'Create homework'`
- `app/(dashboard)/(with-sidebar)/dashboard/team/page.tsx` → `"Billed monthly"`, `"Trial period"`, `"No active subscription"`, placeholder `"Enter email"`
- `app/(dashboard)/(with-sidebar)/dashboard/general/page.tsx` → placeholders `"Enter your name"`, `"Enter your email"`
- `app/(dashboard)/(with-sidebar)/dashboard/activity/page.tsx` → `"You signed up"`, `"You signed in"`, `"You signed out"`, etc.
- `app/(dashboard)/(with-sidebar)/classroom/[classId]/TeacherCard.tsx` → `'Your teacher will post recordings, homework, and quizzes here.'`

---

## Shared components

- `components/pricing/PricingCtaBanner.tsx` — accepts `headline`, `subline`, `primaryLabel`, `secondaryLabel`; callers pass translated strings (no change to component if parents use `t()`).
- `components/pricing/PricingFAQ.tsx` — receives `items` with `question`/`answer`; pass translated items from parent.

---

**Done:** Academy, Schools landing, MarketingHeader/nav (nav.*, common where used).
