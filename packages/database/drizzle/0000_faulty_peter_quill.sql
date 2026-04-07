CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"journey_id" integer NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"estimated_minutes" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "journey_sessions_journey_order_uniq" UNIQUE("journey_id","order")
);
--> statement-breakpoint
CREATE TABLE "journeys" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"thumbnail_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_prompts" (
	"user_id" text NOT NULL,
	"prompt_id" integer NOT NULL,
	"saved_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "saved_prompts_user_id_prompt_id_pk" PRIMARY KEY("user_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"order" integer NOT NULL,
	"type" text NOT NULL,
	"content_json" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "steps_session_order_uniq" UNIQUE("session_id","order")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean NOT NULL,
	"image" text,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_journey_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"journey_id" integer NOT NULL,
	"current_session_order" integer DEFAULT 1 NOT NULL,
	"completion_rate" real DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_journey_progress_user_journey_uniq" UNIQUE("user_id","journey_id")
);
--> statement-breakpoint
CREATE TABLE "user_session_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" integer NOT NULL,
	"current_step_order" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'locked' NOT NULL,
	"step_responses_json" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_session_progress_user_session_uniq" UNIQUE("user_id","session_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp NOT NULL,
	"updatedAt" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_prompts" (
	"id" serial PRIMARY KEY NOT NULL,
	"prompt_type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"response_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writing_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"writing_id" integer NOT NULL,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"body_json" jsonb NOT NULL,
	"word_count" integer NOT NULL,
	"ai_feedback_json" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "writings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"body_json" jsonb NOT NULL,
	"body_plain_text" text NOT NULL,
	"word_count" integer NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"source_prompt_id" integer,
	"source_session_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_sessions" ADD CONSTRAINT "journey_sessions_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_prompts" ADD CONSTRAINT "saved_prompts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_prompts" ADD CONSTRAINT "saved_prompts_prompt_id_writing_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."writing_prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "steps" ADD CONSTRAINT "steps_session_id_journey_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."journey_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_journey_progress" ADD CONSTRAINT "user_journey_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_journey_progress" ADD CONSTRAINT "user_journey_progress_journey_id_journeys_id_fk" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session_progress" ADD CONSTRAINT "user_session_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session_progress" ADD CONSTRAINT "user_session_progress_session_id_journey_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."journey_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writing_versions" ADD CONSTRAINT "writing_versions_writing_id_writings_id_fk" FOREIGN KEY ("writing_id") REFERENCES "public"."writings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_source_prompt_id_writing_prompts_id_fk" FOREIGN KEY ("source_prompt_id") REFERENCES "public"."writing_prompts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "writings" ADD CONSTRAINT "writings_source_session_id_journey_sessions_id_fk" FOREIGN KEY ("source_session_id") REFERENCES "public"."journey_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "journey_sessions_journey_idx" ON "journey_sessions" USING btree ("journey_id");--> statement-breakpoint
CREATE INDEX "journeys_category_idx" ON "journeys" USING btree ("category");--> statement-breakpoint
CREATE INDEX "saved_prompts_user_saved_idx" ON "saved_prompts" USING btree ("user_id","saved_at");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "steps_session_idx" ON "steps" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_journey_progress_user_idx" ON "user_journey_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_journey_progress_status_idx" ON "user_journey_progress" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "user_session_progress_user_idx" ON "user_session_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_session_progress_status_idx" ON "user_session_progress" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "writing_prompts_type_idx" ON "writing_prompts" USING btree ("prompt_type");--> statement-breakpoint
CREATE INDEX "writing_versions_writing_idx" ON "writing_versions" USING btree ("writing_id","version_number");--> statement-breakpoint
CREATE INDEX "writings_user_updated_idx" ON "writings" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "writings_user_status_idx" ON "writings" USING btree ("user_id","status");