CREATE TABLE "categories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"name" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#6B7280' NOT NULL,
	"todos_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"commentable_type" varchar(50) NOT NULL,
	"commentable_id" bigint NOT NULL,
	"content" text NOT NULL,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "files_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"attachable_type" varchar(50) NOT NULL,
	"attachable_id" bigint NOT NULL,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(100),
	"byte_size" bigint NOT NULL,
	"storage_key" varchar(500) NOT NULL,
	"thumb_key" varchar(500),
	"medium_key" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jwt_denylists" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "jwt_denylists_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"jti" varchar(255),
	"exp" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "note_revisions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "note_revisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"note_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"title" varchar(150),
	"body_md" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"title" varchar(150),
	"body_md" text,
	"body_plain" text,
	"pinned" boolean DEFAULT false NOT NULL,
	"archived_at" timestamp,
	"trashed_at" timestamp,
	"last_edited_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"name" varchar(30) NOT NULL,
	"color" varchar(7) DEFAULT '#6B7280',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_histories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "todo_histories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"todo_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"field_name" varchar(50) NOT NULL,
	"old_value" text,
	"new_value" text,
	"action" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todo_tags" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "todo_tags_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"todo_id" bigint NOT NULL,
	"tag_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "todos_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"user_id" bigint NOT NULL,
	"category_id" bigint,
	"title" varchar(255) NOT NULL,
	"description" text,
	"completed" boolean DEFAULT false,
	"position" integer,
	"priority" integer DEFAULT 1 NOT NULL,
	"status" integer DEFAULT 0 NOT NULL,
	"due_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"email" varchar(255) DEFAULT '' NOT NULL,
	"encrypted_password" varchar(255) DEFAULT '' NOT NULL,
	"reset_password_token" varchar(255),
	"reset_password_sent_at" timestamp,
	"remember_created_at" timestamp,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_note_id_notes_id_fk" FOREIGN KEY ("note_id") REFERENCES "public"."notes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note_revisions" ADD CONSTRAINT "note_revisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_histories" ADD CONSTRAINT "todo_histories_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_histories" ADD CONSTRAINT "todo_histories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_tags" ADD CONSTRAINT "todo_tags_todo_id_todos_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo_tags" ADD CONSTRAINT "todo_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_user_id_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_user_id_name_idx" ON "categories" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "comments_user_id_idx" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "comments_commentable_idx" ON "comments" USING btree ("commentable_type","commentable_id");--> statement-breakpoint
CREATE INDEX "comments_commentable_deleted_at_idx" ON "comments" USING btree ("commentable_type","commentable_id","deleted_at");--> statement-breakpoint
CREATE INDEX "comments_deleted_at_idx" ON "comments" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "files_user_id_idx" ON "files" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "files_attachable_idx" ON "files" USING btree ("attachable_type","attachable_id");--> statement-breakpoint
CREATE INDEX "files_storage_key_idx" ON "files" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "jwt_denylists_jti_idx" ON "jwt_denylists" USING btree ("jti");--> statement-breakpoint
CREATE INDEX "note_revisions_note_id_idx" ON "note_revisions" USING btree ("note_id");--> statement-breakpoint
CREATE INDEX "note_revisions_user_id_idx" ON "note_revisions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "note_revisions_note_id_created_at_idx" ON "note_revisions" USING btree ("note_id","created_at");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_user_id_archived_at_idx" ON "notes" USING btree ("user_id","archived_at");--> statement-breakpoint
CREATE INDEX "notes_user_id_trashed_at_idx" ON "notes" USING btree ("user_id","trashed_at");--> statement-breakpoint
CREATE INDEX "notes_user_id_pinned_idx" ON "notes" USING btree ("user_id","pinned");--> statement-breakpoint
CREATE INDEX "notes_user_id_last_edited_at_idx" ON "notes" USING btree ("user_id","last_edited_at");--> statement-breakpoint
CREATE INDEX "notes_archived_at_idx" ON "notes" USING btree ("archived_at");--> statement-breakpoint
CREATE INDEX "notes_trashed_at_idx" ON "notes" USING btree ("trashed_at");--> statement-breakpoint
CREATE INDEX "notes_pinned_idx" ON "notes" USING btree ("pinned");--> statement-breakpoint
CREATE INDEX "notes_last_edited_at_idx" ON "notes" USING btree ("last_edited_at");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_id_name_idx" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "todo_histories_todo_id_idx" ON "todo_histories" USING btree ("todo_id");--> statement-breakpoint
CREATE INDEX "todo_histories_user_id_idx" ON "todo_histories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "todo_histories_todo_id_created_at_idx" ON "todo_histories" USING btree ("todo_id","created_at");--> statement-breakpoint
CREATE INDEX "todo_histories_field_name_idx" ON "todo_histories" USING btree ("field_name");--> statement-breakpoint
CREATE INDEX "todo_tags_todo_id_idx" ON "todo_tags" USING btree ("todo_id");--> statement-breakpoint
CREATE INDEX "todo_tags_tag_id_idx" ON "todo_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "todo_tags_todo_id_tag_id_idx" ON "todo_tags" USING btree ("todo_id","tag_id");--> statement-breakpoint
CREATE INDEX "todos_user_id_idx" ON "todos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "todos_category_id_idx" ON "todos" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "todos_user_id_category_id_idx" ON "todos" USING btree ("user_id","category_id");--> statement-breakpoint
CREATE INDEX "todos_user_id_due_date_idx" ON "todos" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "todos_user_id_position_idx" ON "todos" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "todos_user_id_priority_idx" ON "todos" USING btree ("user_id","priority");--> statement-breakpoint
CREATE INDEX "todos_user_id_status_idx" ON "todos" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "todos_title_idx" ON "todos" USING btree ("title");--> statement-breakpoint
CREATE INDEX "todos_due_date_idx" ON "todos" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "todos_position_idx" ON "todos" USING btree ("position");--> statement-breakpoint
CREATE INDEX "todos_priority_idx" ON "todos" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "todos_status_idx" ON "todos" USING btree ("status");--> statement-breakpoint
CREATE INDEX "todos_created_at_idx" ON "todos" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "todos_updated_at_idx" ON "todos" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_reset_password_token_idx" ON "users" USING btree ("reset_password_token");