CREATE TABLE "api_apps" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(24) NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"app_id" varchar(24) NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"token_prefix" varchar(12) NOT NULL,
	"scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(24),
	"user_id" varchar(24),
	"action" text NOT NULL,
	"resource_type" text,
	"resource_id" varchar(24),
	"details" jsonb,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beta_invites" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"source" text DEFAULT 'manual' NOT NULL,
	"granted_plan" text DEFAULT 'pro' NOT NULL,
	"is_founder" boolean DEFAULT false NOT NULL,
	"note" text,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"accepted_by_user_id" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "beta_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"guestbook_id" varchar(24) NOT NULL,
	"name" text NOT NULL,
	"message" text NOT NULL,
	"photo_url" text,
	"answers" jsonb,
	"status" text DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guestbooks" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(24) NOT NULL,
	"name" text NOT NULL,
	"type" text DEFAULT 'permanent' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenant_invites" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(24) NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'co_owner' NOT NULL,
	"invited_by" varchar(24) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_invites_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tenant_members" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"tenant_id" varchar(24) NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"role" text NOT NULL,
	"invited_by" varchar(24),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"owner_id" varchar(24) NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"plan_granted_reason" text,
	"encryption_salt" varchar(64),
	"key_version" varchar(10) DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor_tokens" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "two_factor_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_two_factor" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"user_id" varchar(24) NOT NULL,
	"method" text NOT NULL,
	"secret" text,
	"backup_codes" text,
	"enabled" text DEFAULT 'false' NOT NULL,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"avatar_url" text,
	"beta_invite_id" varchar(24),
	"is_founder" boolean DEFAULT false NOT NULL,
	"beta_participant" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" varchar(24) PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"use_case" text,
	"source" text,
	"referred_by_user_id" varchar(24),
	"referral_code" text,
	"position" serial NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"invited_at" timestamp with time zone,
	"registered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email"),
	CONSTRAINT "waitlist_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
ALTER TABLE "api_apps" ADD CONSTRAINT "api_apps_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_apps" ADD CONSTRAINT "api_apps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_app_id_api_apps_id_fk" FOREIGN KEY ("app_id") REFERENCES "public"."api_apps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beta_invites" ADD CONSTRAINT "beta_invites_accepted_by_user_id_users_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_guestbook_id_guestbooks_id_fk" FOREIGN KEY ("guestbook_id") REFERENCES "public"."guestbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guestbooks" ADD CONSTRAINT "guestbooks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_invites" ADD CONSTRAINT "tenant_invites_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_invites" ADD CONSTRAINT "tenant_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor_tokens" ADD CONSTRAINT "two_factor_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_two_factor" ADD CONSTRAINT "user_two_factor_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_referred_by_user_id_users_id_fk" FOREIGN KEY ("referred_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_api_apps_tenant" ON "api_apps" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_api_apps_user" ON "api_apps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_api_tokens_app" ON "api_tokens" USING btree ("app_id");--> statement-breakpoint
CREATE INDEX "idx_api_tokens_hash" ON "api_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_tenant" ON "audit_logs" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_beta_invites_token" ON "beta_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_beta_invites_email" ON "beta_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_entries_guestbook" ON "entries" USING btree ("guestbook_id");--> statement-breakpoint
CREATE INDEX "idx_guestbooks_tenant" ON "guestbooks" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_invites_token" ON "tenant_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_tenant_invites_email" ON "tenant_invites" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_tenant_members_unique" ON "tenant_members" USING btree ("tenant_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_members_tenant" ON "tenant_members" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "idx_tenant_members_user" ON "tenant_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_user_two_factor_user" ON "user_two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_waitlist_email" ON "waitlist" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_waitlist_referral_code" ON "waitlist" USING btree ("referral_code");--> statement-breakpoint
CREATE INDEX "idx_waitlist_status" ON "waitlist" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_waitlist_priority" ON "waitlist" USING btree ("priority");