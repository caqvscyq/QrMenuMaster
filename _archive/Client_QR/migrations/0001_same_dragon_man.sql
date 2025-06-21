CREATE TABLE "shop_admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_id" integer,
	"user_id" integer,
	"role" text DEFAULT 'manager' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "shop_admins" ADD CONSTRAINT "shop_admins_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_admins" ADD CONSTRAINT "shop_admins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;