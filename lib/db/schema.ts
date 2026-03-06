import {
  pgTable,
  pgEnum,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  index,
  uuid,
  uniqueIndex,
  date,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const platformRoleEnum = [
  'student',
  'admin',
  'teacher',
  'school_admin',
] as const;
export type PlatformRole = (typeof platformRoleEnum)[number];

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: varchar('role', { length: 20 }).notNull().default('member'), // Team/billing: owner | member (via teamMembers)
    platformRole: varchar('platform_role', { length: 20 }), // Platform: student | admin | teacher | school_admin
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
    deletedAt: timestamp('deleted_at'),
    archivedAt: timestamp('archived_at'), // Archive (hide from default listings)
    timezone: text('timezone'), // IANA e.g. America/New_York
    schoolId: text('school_id'), // School affiliation for school_admin/student scoping
    avatarUrl: text('avatar_url'), // R2 public URL for profile picture
    emailVerified: timestamp('email_verified'), // When the user verified their email (required for login if enforced)
  },
  (table) => [
    index('users_platform_role_idx').on(table.platformRole),
    index('users_school_id_idx').on(table.schoolId),
  ]
);

// --- Schools (organizational layer for classes) ---

export const schools = pgTable(
  'schools',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 200 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('schools_slug_idx').on(table.slug)]
);

export const schoolMemberRoleEnum = ['school_admin'] as const;
export type SchoolMemberRole = (typeof schoolMemberRoleEnum)[number];

export const schoolMemberships = pgTable(
  'school_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: varchar('role', { length: 30 }).notNull().default('school_admin'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('school_memberships_school_user_idx').on(table.schoolId, table.userId),
    index('school_memberships_user_idx').on(table.userId),
    index('school_memberships_school_idx').on(table.schoolId),
  ]
);

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

// --- Gecko schema ---

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 200 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const classes = pgTable('classes', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  meetingLink: text('meeting_link'),
  recordingUrl: text('recording_url'),
  teacherId: integer('teacher_id')
    .notNull()
    .references(() => users.id),
  organizationId: integer('organization_id').references(() => organizations.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const enrollments = pgTable('enrollments', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id')
    .notNull()
    .references(() => users.id),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id),
  enrolledAt: timestamp('enrolled_at').notNull().defaultNow(),
});

export const assignments = pgTable('assignments', {
  id: serial('id').primaryKey(),
  classId: integer('class_id')
    .notNull()
    .references(() => classes.id),
  studentId: integer('student_id')
    .notNull()
    .references(() => users.id),
  title: varchar('title', { length: 200 }).notNull(),
  completed: boolean('completed').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

// --- Education domain (MVP) ---

export const geckoLevelEnum = ['G', 'E', 'C', 'K', 'O'] as const;
export type GeckoLevel = (typeof geckoLevelEnum)[number];

/** Gecko Level Check placement test results - tied to user account */
export const geckoPlacementResults = pgTable(
  'gecko_placement_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    placementScore: integer('placement_score').notNull(),
    placementLevel: varchar('placement_level', { length: 1 })
      .notNull()
      .$type<GeckoLevel>(),
    answers: jsonb('answers').$type<Record<string, unknown>>().default({}),
    writingResponses: jsonb('writing_responses').$type<Record<string, string>>().default({}),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('gecko_placement_results_user_idx').on(table.userId),
    index('gecko_placement_results_created_idx').on(table.createdAt),
  ]
);

export const geckoPlacementResultsRelations = relations(
  geckoPlacementResults,
  ({ one }) => ({
    user: one(users, {
      fields: [geckoPlacementResults.userId],
      references: [users.id],
    }),
  })
);

export const eduClasses = pgTable(
  'edu_classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    level: text('level'),
    timezone: text('timezone').default('Asia/Ulaanbaatar'),
    joinCode: text('join_code').unique(),
    joinCodeEnabled: boolean('join_code_enabled').notNull().default(true),
    // Recurring schedule: days e.g. ["sat","sun"], time "HH:mm", timezone IANA
    geckoLevel: text('gecko_level'),
    scheduleDays: jsonb('schedule_days').$type<string[]>(), // ["sat","sun"]
    scheduleStartTime: text('schedule_start_time'), // "HH:mm"
    scheduleTimezone: text('schedule_timezone').default('Asia/Ulaanbaatar'),
    scheduleStartDate: date('schedule_start_date'),
    scheduleEndDate: date('schedule_end_date'),
    durationMinutes: integer('duration_minutes').notNull().default(50),
    defaultMeetingUrl: text('default_meeting_url'),
    schoolId: uuid('school_id').references(() => schools.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('edu_classes_join_code_idx').on(table.joinCode),
    index('edu_classes_school_id_idx').on(table.schoolId),
  ]
);

export const eduClassTeachers = pgTable(
  'edu_class_teachers',
  {
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    teacherUserId: integer('teacher_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('edu_class_teachers_class_teacher_idx').on(
      table.classId,
      table.teacherUserId
    ),
    index('edu_class_teachers_teacher_idx').on(
      table.teacherUserId,
      table.classId
    ),
  ]
);

export const eduEnrollments = pgTable(
  'edu_enrollments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    studentUserId: integer('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('edu_enrollments_class_student_idx').on(
      table.classId,
      table.studentUserId
    ),
    index('edu_enrollments_student_class_idx').on(
      table.studentUserId,
      table.classId
    ),
  ]
);

/** Shareable invite links for students to join a class. Token in URL e.g. /join/ABC123XYZ */
export const classInvites = pgTable(
  'class_invites',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    token: text('token').notNull().unique(),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    maxUses: integer('max_uses'),
    usesCount: integer('uses_count').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('class_invites_class_id_idx').on(table.classId),
    index('class_invites_token_idx').on(table.token),
  ]
);

export const sessionKindEnum = ['extra', 'override', 'cancel'] as const;
export type SessionKind = (typeof sessionKindEnum)[number];

export const eduSessions = pgTable(
  'edu_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at').notNull(),
    endsAt: timestamp('ends_at').notNull(),
    meetingUrl: text('meeting_url'),
    title: text('title'),
    kind: text('kind'), // "extra" | "override" | "cancel" — null = legacy
    originalStartsAt: timestamp('original_starts_at'), // for override/cancel: matches generated occurrence
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('edu_sessions_class_starts_idx').on(table.classId, table.startsAt)]
);

// --- Attendance (per-class-session tracking) ---
export const attendanceStatusEnum = pgEnum('attendance_status', [
  'present',
  'absent',
  'late',
]);
export type AttendanceStatus = (typeof attendanceStatusEnum.enumValues)[number];

export const classSessions = pgTable(
  'class_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    startsAt: timestamp('starts_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('class_sessions_class_starts_idx').on(table.classId, table.startsAt),
  ]
);

export const attendanceRecords = pgTable(
  'attendance_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => classSessions.id, { onDelete: 'cascade' }),
    studentUserId: integer('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: attendanceStatusEnum('status').notNull(),
    participationScore: integer('participation_score'), // 0–3, nullable
    teacherNote: text('teacher_note'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('attendance_records_session_student_idx').on(
      table.sessionId,
      table.studentUserId
    ),
    index('attendance_records_session_idx').on(table.sessionId),
  ]
);

export const classSessionsRelations = relations(classSessions, ({ one, many }) => ({
  class: one(eduClasses, {
    fields: [classSessions.classId],
    references: [eduClasses.id],
  }),
  attendanceRecords: many(attendanceRecords),
}));

export const attendanceRecordsRelations = relations(
  attendanceRecords,
  ({ one }) => ({
    session: one(classSessions, {
      fields: [attendanceRecords.sessionId],
      references: [classSessions.id],
    }),
    student: one(users, {
      fields: [attendanceRecords.studentUserId],
      references: [users.id],
    }),
  })
);

export type ClassSession = typeof classSessions.$inferSelect;
export type NewClassSession = typeof classSessions.$inferInsert;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert;

// --- Classroom posts ---
export const classroomPostTypeEnum = [
  'homework',
  'test',
  'recording',
  'announcement',
  'document',
  'quiz',
] as const;
export type ClassroomPostType = (typeof classroomPostTypeEnum)[number];

export const classroomPosts = pgTable(
  'classroom_posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    authorUserId: integer('author_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    title: text('title'),
    body: text('body'),
    fileUrl: text('file_url'),
    linkUrl: text('link_url'),
    quizId: uuid('quiz_id').references(() => eduQuizzes.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('classroom_posts_class_created_idx').on(table.classId, table.createdAt),
    index('classroom_posts_quiz_class_idx').on(table.quizId, table.classId),
  ]
);

// --- Learning / quizzes ---

export const quizQuestionTypeEnum = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'] as const;
export type QuizQuestionType = (typeof quizQuestionTypeEnum)[number];

export const eduQuizzes = pgTable(
  'edu_quizzes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status').notNull().default('DRAFT'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('edu_quizzes_published_at_idx').on(table.publishedAt)]
);

export const eduQuizClasses = pgTable(
  'edu_quiz_classes',
  {
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => eduQuizzes.id, { onDelete: 'cascade' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('edu_quiz_classes_quiz_class_idx').on(table.quizId, table.classId),
    index('edu_quiz_classes_class_idx').on(table.classId),
  ]
);

export const eduQuizQuestions = pgTable(
  'edu_quiz_questions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => eduQuizzes.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    prompt: text('prompt').notNull(),
    choices: jsonb('choices'),
    correctAnswer: jsonb('correct_answer').notNull(),
    explanation: text('explanation'),
    order: integer('order').notNull().default(0),
  },
  (table) => [index('edu_quiz_questions_quiz_order_idx').on(table.quizId, table.order)]
);

export const eduQuizSubmissions = pgTable(
  'edu_quiz_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quizId: uuid('quiz_id')
      .notNull()
      .references(() => eduQuizzes.id, { onDelete: 'cascade' }),
    studentUserId: integer('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    score: integer('score').notNull(),
    answers: jsonb('answers').notNull(),
    attemptNumber: integer('attempt_number').notNull().default(1),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('edu_quiz_submissions_quiz_student_idx').on(
      table.quizId,
      table.studentUserId
    ),
    index('edu_quiz_submissions_quiz_idx').on(table.quizId),
    index('edu_quiz_submissions_student_idx').on(table.studentUserId),
  ]
);

export const flashcardDeckScopeEnum = pgEnum('flashcard_deck_scope', [
  'class',
  'global',
]);
export type FlashcardDeckScope = (typeof flashcardDeckScopeEnum.enumValues)[number];

export const flashcardStudyResultEnum = pgEnum('flashcard_study_result', [
  'correct',
  'incorrect',
]);
export type FlashcardStudyResult = (typeof flashcardStudyResultEnum.enumValues)[number];

export const flashcardDecks = pgTable(
  'flashcard_decks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    description: text('description'),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scope: flashcardDeckScopeEnum('scope').notNull().default('class'),
    classId: uuid('class_id').references(() => eduClasses.id, {
      onDelete: 'cascade',
    }),
    isPublished: boolean('is_published').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('flashcard_decks_creator_idx').on(table.createdByUserId),
    index('flashcard_decks_scope_class_idx').on(table.scope, table.classId),
    index('flashcard_decks_published_idx').on(table.isPublished),
  ]
);

export const flashcardCards = pgTable(
  'flashcards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deckId: uuid('deck_id')
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: 'cascade' }),
    front: text('front').notNull(),
    back: text('back').notNull(),
    example: text('example'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('flashcards_deck_sort_idx').on(table.deckId, table.sortOrder),
  ]
);

export const flashcardSaves = pgTable(
  'flashcard_saves',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentUserId: integer('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    cardId: uuid('card_id')
      .notNull()
      .references(() => flashcardCards.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('flashcard_saves_student_card_idx').on(
      table.studentUserId,
      table.cardId
    ),
    index('flashcard_saves_student_idx').on(table.studentUserId),
  ]
);

export const flashcardStudyEvents = pgTable(
  'flashcard_study_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentUserId: integer('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    deckId: uuid('deck_id')
      .notNull()
      .references(() => flashcardDecks.id, { onDelete: 'cascade' }),
    cardId: uuid('card_id')
      .notNull()
      .references(() => flashcardCards.id, { onDelete: 'cascade' }),
    result: flashcardStudyResultEnum('result').notNull(),
    studiedAt: timestamp('studied_at').notNull().defaultNow(),
  },
  (table) => [
    index('flashcard_study_events_student_studied_idx').on(
      table.studentUserId,
      table.studiedAt
    ),
    index('flashcard_study_events_deck_idx').on(table.deckId),
    index('flashcard_study_events_card_idx').on(table.cardId),
  ]
);

// --- Student Reading (MVP) ---

export const eduReadings = pgTable(
  'edu_readings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description'),
    content: text('content').notNull(),
    weekOf: date('week_of'), // optional: used for "this week" grouping
    vocab: jsonb('vocab').$type<string[]>().default([]),
    questions: jsonb('questions').$type<string[]>().default([]),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('edu_readings_class_id_idx').on(table.classId),
    index('edu_readings_week_of_idx').on(table.weekOf),
  ]
);

export const eduReadingCompletions = pgTable(
  'edu_reading_completions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    readingId: uuid('reading_id')
      .notNull()
      .references(() => eduReadings.id, { onDelete: 'cascade' }),
    studentUserId: integer('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('edu_reading_completions_reading_student_idx').on(
      table.readingId,
      table.studentUserId
    ),
    index('edu_reading_completions_reading_idx').on(table.readingId),
    index('edu_reading_completions_student_idx').on(table.studentUserId),
  ]
);

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  classesTeaching: many(classes),
  enrollments: many(enrollments),
  assignments: many(assignments),
  conversationMemberships: many(conversationMembers),
  sentMessages: many(messages),
  notifications: many(notifications),
  flashcardDecksCreated: many(flashcardDecks),
  flashcardSaves: many(flashcardSaves),
  flashcardStudyEvents: many(flashcardStudyEvents),
  schoolMemberships: many(schoolMemberships),
  geckoPlacementResults: many(geckoPlacementResults),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const schoolsRelations = relations(schools, ({ many }) => ({
  memberships: many(schoolMemberships),
  classes: many(eduClasses),
}));

export const schoolMembershipsRelations = relations(schoolMemberships, ({ one }) => ({
  school: one(schools, { fields: [schoolMemberships.schoolId], references: [schools.id] }),
  user: one(users, { fields: [schoolMemberships.userId], references: [users.id] }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  classes: many(classes),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  teacher: one(users, { fields: [classes.teacherId], references: [users.id] }),
  organization: one(organizations, {
    fields: [classes.organizationId],
    references: [organizations.id],
  }),
  enrollments: many(enrollments),
  assignments: many(assignments),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  student: one(users, { fields: [enrollments.studentId], references: [users.id] }),
  class: one(classes, { fields: [enrollments.classId], references: [classes.id] }),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  class: one(classes, { fields: [assignments.classId], references: [classes.id] }),
  student: one(users, { fields: [assignments.studentId], references: [users.id] }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const eduClassesRelations = relations(eduClasses, ({ one, many }) => ({
  school: one(schools, {
    fields: [eduClasses.schoolId],
    references: [schools.id],
  }),
  classTeachers: many(eduClassTeachers),
  enrollments: many(eduEnrollments),
  classInvites: many(classInvites),
  sessions: many(eduSessions),
  classSessions: many(classSessions),
  classroomPosts: many(classroomPosts),
  quizClasses: many(eduQuizClasses),
  flashcardDecks: many(flashcardDecks),
  homework: many(homework),
  readings: many(eduReadings),
  curriculumFiles: many(curriculumFiles),
  curriculumWeeks: many(curriculumWeeks),
}));

export const classInvitesRelations = relations(classInvites, ({ one }) => ({
  class: one(eduClasses, {
    fields: [classInvites.classId],
    references: [eduClasses.id],
  }),
  createdBy: one(users, {
    fields: [classInvites.createdByUserId],
    references: [users.id],
  }),
}));

export const eduClassTeachersRelations = relations(eduClassTeachers, ({ one }) => ({
  class: one(eduClasses, {
    fields: [eduClassTeachers.classId],
    references: [eduClasses.id],
  }),
  teacher: one(users, {
    fields: [eduClassTeachers.teacherUserId],
    references: [users.id],
  }),
}));

export const eduEnrollmentsRelations = relations(eduEnrollments, ({ one }) => ({
  class: one(eduClasses, {
    fields: [eduEnrollments.classId],
    references: [eduClasses.id],
  }),
  student: one(users, {
    fields: [eduEnrollments.studentUserId],
    references: [users.id],
  }),
}));

export const eduSessionsRelations = relations(eduSessions, ({ one }) => ({
  class: one(eduClasses, {
    fields: [eduSessions.classId],
    references: [eduClasses.id],
  }),
}));

export const classroomPostsRelations = relations(classroomPosts, ({ one }) => ({
  class: one(eduClasses, {
    fields: [classroomPosts.classId],
    references: [eduClasses.id],
  }),
  author: one(users, {
    fields: [classroomPosts.authorUserId],
    references: [users.id],
  }),
}));

export const eduQuizzesRelations = relations(eduQuizzes, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [eduQuizzes.createdByUserId],
    references: [users.id],
  }),
  quizClasses: many(eduQuizClasses),
  questions: many(eduQuizQuestions),
  submissions: many(eduQuizSubmissions),
}));

export const eduQuizClassesRelations = relations(eduQuizClasses, ({ one }) => ({
  quiz: one(eduQuizzes, {
    fields: [eduQuizClasses.quizId],
    references: [eduQuizzes.id],
  }),
  class: one(eduClasses, {
    fields: [eduQuizClasses.classId],
    references: [eduClasses.id],
  }),
}));

export const eduQuizQuestionsRelations = relations(
  eduQuizQuestions,
  ({ one }) => ({
    quiz: one(eduQuizzes, {
      fields: [eduQuizQuestions.quizId],
      references: [eduQuizzes.id],
    }),
  })
);

export const eduQuizSubmissionsRelations = relations(
  eduQuizSubmissions,
  ({ one }) => ({
    quiz: one(eduQuizzes, {
      fields: [eduQuizSubmissions.quizId],
      references: [eduQuizzes.id],
    }),
    student: one(users, {
      fields: [eduQuizSubmissions.studentUserId],
      references: [users.id],
    }),
  })
);

export const flashcardDecksRelations = relations(
  flashcardDecks,
  ({ one, many }) => ({
    createdBy: one(users, {
      fields: [flashcardDecks.createdByUserId],
      references: [users.id],
    }),
    class: one(eduClasses, {
      fields: [flashcardDecks.classId],
      references: [eduClasses.id],
    }),
    cards: many(flashcardCards),
    studyEvents: many(flashcardStudyEvents),
  })
);

export const flashcardCardsRelations = relations(
  flashcardCards,
  ({ one, many }) => ({
    deck: one(flashcardDecks, {
      fields: [flashcardCards.deckId],
      references: [flashcardDecks.id],
    }),
    saves: many(flashcardSaves),
    studyEvents: many(flashcardStudyEvents),
  })
);

export const flashcardSavesRelations = relations(flashcardSaves, ({ one }) => ({
  student: one(users, {
    fields: [flashcardSaves.studentUserId],
    references: [users.id],
  }),
  card: one(flashcardCards, {
    fields: [flashcardSaves.cardId],
    references: [flashcardCards.id],
  }),
}));

export const flashcardStudyEventsRelations = relations(
  flashcardStudyEvents,
  ({ one }) => ({
    student: one(users, {
      fields: [flashcardStudyEvents.studentUserId],
      references: [users.id],
    }),
    deck: one(flashcardDecks, {
      fields: [flashcardStudyEvents.deckId],
      references: [flashcardDecks.id],
    }),
    card: one(flashcardCards, {
      fields: [flashcardStudyEvents.cardId],
      references: [flashcardCards.id],
    }),
  })
);

export const eduReadingsRelations = relations(eduReadings, ({ one, many }) => ({
  class: one(eduClasses, {
    fields: [eduReadings.classId],
    references: [eduClasses.id],
  }),
  completions: many(eduReadingCompletions),
}));

export const eduReadingCompletionsRelations = relations(
  eduReadingCompletions,
  ({ one }) => ({
    reading: one(eduReadings, {
      fields: [eduReadingCompletions.readingId],
      references: [eduReadings.id],
    }),
    student: one(users, {
      fields: [eduReadingCompletions.studentUserId],
      references: [users.id],
    }),
  })
);

// --- Homework (uploads-first) ---

export const homework = pgTable(
  'homework',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    instructions: text('instructions'),
    dueDate: timestamp('due_date'),
    attachmentUrl: text('attachment_url'),
    createdByUserId: integer('created_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('homework_class_id_idx').on(table.classId),
    index('homework_created_by_idx').on(table.createdByUserId),
  ]
);

export const homeworkSubmissions = pgTable(
  'homework_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    homeworkId: uuid('homework_id')
      .notNull()
      .references(() => homework.id, { onDelete: 'cascade' }),
    studentUserId: integer('student_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    textNote: text('text_note'),
    files: jsonb('files').$type<{ url: string; mimeType: string; name: string; size: number }[]>().default([]),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
    feedback: text('feedback'),
    score: integer('score'),
  },
  (table) => [
    uniqueIndex('homework_submissions_homework_student_idx').on(
      table.homeworkId,
      table.studentUserId
    ),
    index('homework_submissions_homework_idx').on(table.homeworkId),
    index('homework_submissions_student_idx').on(table.studentUserId),
  ]
);

export const homeworkRelations = relations(homework, ({ one, many }) => ({
  class: one(eduClasses, {
    fields: [homework.classId],
    references: [eduClasses.id],
  }),
  createdBy: one(users, {
    fields: [homework.createdByUserId],
    references: [users.id],
  }),
  submissions: many(homeworkSubmissions),
}));

export const homeworkSubmissionsRelations = relations(
  homeworkSubmissions,
  ({ one }) => ({
    homework: one(homework, {
      fields: [homeworkSubmissions.homeworkId],
      references: [homework.id],
    }),
    student: one(users, {
      fields: [homeworkSubmissions.studentUserId],
      references: [users.id],
    }),
  })
);

export type Homework = typeof homework.$inferSelect;
export type NewHomework = typeof homework.$inferInsert;
export type HomeworkSubmission = typeof homeworkSubmissions.$inferSelect;
export type NewHomeworkSubmission = typeof homeworkSubmissions.$inferInsert;

// --- Curriculum (teacher-only) ---

export const curriculumFiles = pgTable(
  'curriculum_files',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    uploaderUserId: integer('uploader_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title'),
    originalFilename: text('original_filename').notNull(),
    storagePath: text('storage_path').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    tag: text('tag'),
    weekNumber: integer('week_number'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('curriculum_files_class_idx').on(table.classId),
    index('curriculum_files_uploader_idx').on(table.uploaderUserId),
  ]
);

export const curriculumWeeks = pgTable(
  'curriculum_weeks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    classId: uuid('class_id')
      .notNull()
      .references(() => eduClasses.id, { onDelete: 'cascade' }),
    weekNumber: integer('week_number').notNull(),
    topic: text('topic'),
    goals: text('goals'),
    notes: text('notes'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('curriculum_weeks_class_week_idx').on(table.classId, table.weekNumber),
    index('curriculum_weeks_class_idx').on(table.classId),
  ]
);

export const curriculumWeekFiles = pgTable(
  'curriculum_week_files',
  {
    weekId: uuid('week_id')
      .notNull()
      .references(() => curriculumWeeks.id, { onDelete: 'cascade' }),
    fileId: uuid('file_id')
      .notNull()
      .references(() => curriculumFiles.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('curriculum_week_files_week_file_idx').on(table.weekId, table.fileId),
    index('curriculum_week_files_week_idx').on(table.weekId),
  ]
);

export const curriculumFilesRelations = relations(curriculumFiles, ({ one, many }) => ({
  class: one(eduClasses, {
    fields: [curriculumFiles.classId],
    references: [eduClasses.id],
  }),
  uploader: one(users, {
    fields: [curriculumFiles.uploaderUserId],
    references: [users.id],
  }),
  weekAttachments: many(curriculumWeekFiles),
}));

export const curriculumWeeksRelations = relations(
  curriculumWeeks,
  ({ one, many }) => ({
    class: one(eduClasses, {
      fields: [curriculumWeeks.classId],
      references: [eduClasses.id],
    }),
    files: many(curriculumWeekFiles),
  })
);

export const curriculumWeekFilesRelations = relations(
  curriculumWeekFiles,
  ({ one }) => ({
    week: one(curriculumWeeks, {
      fields: [curriculumWeekFiles.weekId],
      references: [curriculumWeeks.id],
    }),
    file: one(curriculumFiles, {
      fields: [curriculumWeekFiles.fileId],
      references: [curriculumFiles.id],
    }),
  })
);

export type CurriculumFile = typeof curriculumFiles.$inferSelect;
export type NewCurriculumFile = typeof curriculumFiles.$inferInsert;
export type CurriculumWeek = typeof curriculumWeeks.$inferSelect;
export type NewCurriculumWeek = typeof curriculumWeeks.$inferInsert;

// --- Messaging (DM) ---

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 20 }).notNull().default('dm'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const conversationMembers = pgTable(
  'conversation_members',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('conversation_members_conversation_user_idx').on(
      table.conversationId,
      table.userId
    ),
    index('conversation_members_user_idx').on(table.userId),
  ]
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('messages_conversation_created_idx').on(
      table.conversationId,
      table.createdAt
    ),
  ]
);

export const conversationsRelations = relations(conversations, ({ many }) => ({
  members: many(conversationMembers),
  messages: many(messages),
}));

export const conversationMembersRelations = relations(
  conversationMembers,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationMembers.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationMembers.userId],
      references: [users.id],
    }),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

// --- Notifications ---

export const notificationTypeEnum = ['message', 'classroom_post'] as const;
export type NotificationType = (typeof notificationTypeEnum)[number];

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    body: text('body'),
    href: text('href').notNull(),
    sourceType: varchar('source_type', { length: 50 }),
    sourceId: text('source_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    seenAt: timestamp('seen_at'),
  },
  (table) => [
    index('notifications_user_created_idx').on(table.userId, table.createdAt),
    index('notifications_user_seen_idx').on(table.userId, table.seenAt),
  ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type GeckoPlacementResult = typeof geckoPlacementResults.$inferSelect;
export type NewGeckoPlacementResult = typeof geckoPlacementResults.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type School = typeof schools.$inferSelect;
export type NewSchool = typeof schools.$inferInsert;
export type SchoolMembership = typeof schoolMemberships.$inferSelect;
export type NewSchoolMembership = typeof schoolMemberships.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type Assignment = typeof assignments.$inferSelect;
export type NewAssignment = typeof assignments.$inferInsert;
export type EduClass = typeof eduClasses.$inferSelect;
export type NewEduClass = typeof eduClasses.$inferInsert;
export type EduClassTeacher = typeof eduClassTeachers.$inferSelect;
export type NewEduClassTeacher = typeof eduClassTeachers.$inferInsert;
export type EduEnrollment = typeof eduEnrollments.$inferSelect;
export type NewEduEnrollment = typeof eduEnrollments.$inferInsert;
export type ClassInvite = typeof classInvites.$inferSelect;
export type NewClassInvite = typeof classInvites.$inferInsert;
export type EduSession = typeof eduSessions.$inferSelect;
export type NewEduSession = typeof eduSessions.$inferInsert;
export type ClassroomPost = typeof classroomPosts.$inferSelect;
export type NewClassroomPost = typeof classroomPosts.$inferInsert;
export type EduQuiz = typeof eduQuizzes.$inferSelect;
export type NewEduQuiz = typeof eduQuizzes.$inferInsert;
export type EduQuizClass = typeof eduQuizClasses.$inferSelect;
export type NewEduQuizClass = typeof eduQuizClasses.$inferInsert;
export type EduQuizQuestion = typeof eduQuizQuestions.$inferSelect;
export type NewEduQuizQuestion = typeof eduQuizQuestions.$inferInsert;
export type EduQuizSubmission = typeof eduQuizSubmissions.$inferSelect;
export type NewEduQuizSubmission = typeof eduQuizSubmissions.$inferInsert;
export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type NewFlashcardDeck = typeof flashcardDecks.$inferInsert;
export type FlashcardCard = typeof flashcardCards.$inferSelect;
export type NewFlashcardCard = typeof flashcardCards.$inferInsert;
export type FlashcardSave = typeof flashcardSaves.$inferSelect;
export type NewFlashcardSave = typeof flashcardSaves.$inferInsert;
export type FlashcardStudyEvent = typeof flashcardStudyEvents.$inferSelect;
export type NewFlashcardStudyEvent = typeof flashcardStudyEvents.$inferInsert;
export type EduReading = typeof eduReadings.$inferSelect;
export type NewEduReading = typeof eduReadings.$inferInsert;
export type EduReadingCompletion = typeof eduReadingCompletions.$inferSelect;
export type NewEduReadingCompletion = typeof eduReadingCompletions.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationMember = typeof conversationMembers.$inferSelect;
export type NewConversationMember = typeof conversationMembers.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export const USER_ROLES = ['admin', 'teacher', 'parent', 'student'] as const;
export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}
