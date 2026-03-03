CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'late');--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"student_user_id" integer NOT NULL,
	"status" "attendance_status" NOT NULL,
	"participation_score" integer,
	"teacher_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL,
	"starts_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_class_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."class_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_class_id_edu_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."edu_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_records_session_student_idx" ON "attendance_records" USING btree ("session_id","student_user_id");--> statement-breakpoint
CREATE INDEX "attendance_records_session_idx" ON "attendance_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "class_sessions_class_starts_idx" ON "class_sessions" USING btree ("class_id","starts_at");