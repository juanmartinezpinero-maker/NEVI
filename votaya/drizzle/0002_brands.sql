CREATE TABLE "sponsor_members" (
	"sponsor_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "polls" ADD COLUMN "visibility" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "sponsor_members" ADD CONSTRAINT "sponsor_members_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "public"."sponsors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_members" ADD CONSTRAINT "sponsor_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sponsor_members_uq" ON "sponsor_members" USING btree ("sponsor_id","user_id");--> statement-breakpoint
CREATE INDEX "sponsor_members_user_idx" ON "sponsor_members" USING btree ("user_id");