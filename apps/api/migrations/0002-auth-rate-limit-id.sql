ALTER TABLE auth_rate_limit ADD COLUMN id TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE auth_rate_limit SET id = key;
--> statement-breakpoint
CREATE UNIQUE INDEX auth_rate_limit_id_unique ON auth_rate_limit(id);
--> statement-breakpoint
ALTER TABLE admin_auth_rate_limit ADD COLUMN id TEXT NOT NULL DEFAULT '';
--> statement-breakpoint
UPDATE admin_auth_rate_limit SET id = key;
--> statement-breakpoint
CREATE UNIQUE INDEX admin_auth_rate_limit_id_unique ON admin_auth_rate_limit(id);
