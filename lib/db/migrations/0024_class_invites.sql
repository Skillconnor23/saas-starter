-- Class invite links for student onboarding (shareable /join/TOKEN URLs)
CREATE TABLE IF NOT EXISTS "class_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"class_id" uuid NOT NULL REFERENCES "edu_classes"("id") ON DELETE CASCADE,
	"token" text NOT NULL UNIQUE,
	"created_by_user_id" integer NOT NULL REFERENCES "users"("id"),
	"expires_at" timestamptz,
	"max_uses" integer,
	"uses_count" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_invites_class_id_idx" ON "class_invites" ("class_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "class_invites_token_idx" ON "class_invites" ("token");
