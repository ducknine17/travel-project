ALTER TABLE "user"."user"
    ADD COLUMN IF NOT EXISTS profile_image_id varchar(64),
    ADD COLUMN IF NOT EXISTS character smallint NOT NULL DEFAULT 0;

ALTER TABLE "user"."user"
    DROP CONSTRAINT IF EXISTS user_character_range;

ALTER TABLE "user"."user"
    ADD CONSTRAINT user_character_range CHECK (character BETWEEN 0 AND 3);
