ALTER TABLE "edu_class_teachers" ADD COLUMN "role" varchar(20) DEFAULT 'primary' NOT NULL;--> statement-breakpoint
ALTER TABLE "edu_class_teachers" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "edu_class_teachers" ADD COLUMN "assigned_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "edu_class_teachers" ADD COLUMN "removed_at" timestamp;