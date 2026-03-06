CREATE TABLE "gecko_placement_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" integer NOT NULL,
	"placement_score" integer NOT NULL,
	"placement_level" varchar(1) NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb,
	"writing_responses" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gecko_placement_results" ADD CONSTRAINT "gecko_placement_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gecko_placement_results_user_idx" ON "gecko_placement_results" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gecko_placement_results_created_idx" ON "gecko_placement_results" USING btree ("created_at");