CREATE TYPE "public"."post_visibility" AS ENUM('public', 'followers', 'private');--> statement-breakpoint
CREATE TABLE "post_bookmarks" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_likes" (
	"post_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"is_deleted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ux_post_bookmarks_post_user" ON "post_bookmarks" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_post_bookmarks_user" ON "post_bookmarks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_bookmarks_post" ON "post_bookmarks" USING btree ("post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ux_post_likes_post_user" ON "post_likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_post_likes_user" ON "post_likes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_post_likes_post" ON "post_likes" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "idx_posts_author_created_at" ON "posts" USING btree ("author_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_posts_created_at" ON "posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_posts_visibility" ON "posts" USING btree ("visibility");