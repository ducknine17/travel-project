-- Apply before deploying the profile editor. Existing login IDs stay unchanged.
ALTER TABLE "user".user ADD COLUMN IF NOT EXISTS display_name varchar(24);
ALTER TABLE "user".user ADD COLUMN IF NOT EXISTS avatar varchar(255);
