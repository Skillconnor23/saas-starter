CREATE TYPE "public"."flashcard_deck_scope" AS ENUM('class', 'global');--> statement-breakpoint
CREATE TYPE "public"."flashcard_study_result" AS ENUM('correct', 'incorrect');--> statement-breakpoint
CREATE TABLE "flashcard_decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"created_by_user_id" integer NOT NULL,
	"scope" "flashcard_deck_scope" DEFAULT 'class' NOT NULL,
	"class_id" uuid,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"example" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_saves" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" integer NOT NULL,
	"card_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcard_study_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_user_id" integer NOT NULL,
	"deck_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"result" "flashcard_study_result" NOT NULL,
	"studied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_class_id_edu_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."edu_classes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_cards" ADD CONSTRAINT "flashcard_cards_deck_id_flashcard_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."flashcard_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_saves" ADD CONSTRAINT "flashcard_saves_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_saves" ADD CONSTRAINT "flashcard_saves_card_id_flashcard_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."flashcard_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_study_events" ADD CONSTRAINT "flashcard_study_events_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_study_events" ADD CONSTRAINT "flashcard_study_events_deck_id_flashcard_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."flashcard_decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_study_events" ADD CONSTRAINT "flashcard_study_events_card_id_flashcard_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."flashcard_cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcard_decks" ADD CONSTRAINT "flashcard_decks_scope_class_check" CHECK ((("scope" = 'global' AND "class_id" IS NULL) OR ("scope" = 'class' AND "class_id" IS NOT NULL)));--> statement-breakpoint
CREATE INDEX "flashcard_decks_creator_idx" ON "flashcard_decks" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE INDEX "flashcard_decks_scope_class_idx" ON "flashcard_decks" USING btree ("scope", "class_id");--> statement-breakpoint
CREATE INDEX "flashcard_decks_published_idx" ON "flashcard_decks" USING btree ("is_published");--> statement-breakpoint
CREATE INDEX "flashcard_cards_deck_sort_idx" ON "flashcard_cards" USING btree ("deck_id", "sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "flashcard_saves_student_card_idx" ON "flashcard_saves" USING btree ("student_user_id", "card_id");--> statement-breakpoint
CREATE INDEX "flashcard_saves_student_idx" ON "flashcard_saves" USING btree ("student_user_id");--> statement-breakpoint
CREATE INDEX "flashcard_study_events_student_studied_idx" ON "flashcard_study_events" USING btree ("student_user_id", "studied_at");--> statement-breakpoint
CREATE INDEX "flashcard_study_events_deck_idx" ON "flashcard_study_events" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "flashcard_study_events_card_idx" ON "flashcard_study_events" USING btree ("card_id");
