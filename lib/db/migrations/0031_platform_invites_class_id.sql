-- Add class_id to platform_invites for student invites (nullable; teacher/school_admin invites remain unaffected)
ALTER TABLE "platform_invites" ADD COLUMN IF NOT EXISTS "class_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "platform_invites" ADD CONSTRAINT "platform_invites_class_id_edu_classes_id_fk" FOREIGN KEY ("class_id") REFERENCES "public"."edu_classes"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "platform_invites_class_id_idx" ON "platform_invites" USING btree ("class_id");
