BEGIN;

-- The application now calls this value `avatar`. Preserve any legacy data by
-- renaming the old column instead of dropping and recreating it.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'user'
          AND table_name = 'user'
          AND column_name = 'profile_picture'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'user'
          AND table_name = 'user'
          AND column_name = 'avatar'
    ) THEN
        ALTER TABLE "user"."user"
            RENAME COLUMN profile_picture TO avatar;
    END IF;
END $$;

ALTER TABLE "user"."user"
    ADD COLUMN IF NOT EXISTS display_name varchar(24),
    ADD COLUMN IF NOT EXISTS avatar varchar(255);

-- These fields are required by the API contracts and all existing rows have
-- valid values before this migration is applied.
ALTER TABLE place.place
    ALTER COLUMN id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS place_id_unique_idx
    ON place.place (id);

ALTER TABLE post.post
    ALTER COLUMN author SET NOT NULL;

-- Rows whose user no longer exists cannot be used for verification. Removing
-- them lets PostgreSQL fully validate the existing foreign key.
DELETE FROM "user".validate AS validation
WHERE NOT EXISTS (
    SELECT 1
    FROM "user"."user" AS account
    WHERE account.uid = validation.uid
);

ALTER TABLE "user".validate
    VALIDATE CONSTRAINT validate_uid_fkey;

COMMIT;
