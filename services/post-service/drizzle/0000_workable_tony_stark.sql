CREATE TYPE "public"."post_visibility" AS ENUM('public', 'followers', 'private');--> statement-breakpoint
CREATE TABLE "post_bookmarks" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_bookmarks_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "post_likes_post_id_user_id_pk" PRIMARY KEY("post_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "post_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"shared_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"media_url" varchar(2048),
	"visibility" "post_visibility" DEFAULT 'public' NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "post_bookmarks" ADD CONSTRAINT "post_bookmarks_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_post_bookmarks_user" ON "post_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_bookmarks_post" ON "post_bookmarks" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_likes_user" ON "post_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_likes_post" ON "post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_shares_post" ON "post_shares" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_post_shares_user" ON "post_shares" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_posts_author_created_at" ON "posts" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_posts_created_at" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_posts_visibility" ON "posts" USING btree ("visibility");