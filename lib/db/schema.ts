import {
  pgTable,
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
  },
  (table) => [
    index('users_platform_role_idx').on(table.platformRole),
    index('users_school_id_idx').on(table.schoolId),
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
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [index('edu_classes_join_code_idx').on(table.joinCode)]
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

export const eduClassesRelations = relations(eduClasses, ({ many }) => ({
  classTeachers: many(eduClassTeachers),
  enrollments: many(eduEnrollments),
  sessions: many(eduSessions),
  classroomPosts: many(classroomPosts),
  quizClasses: many(eduQuizClasses),
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
