BEGIN;

-- The frontend stores rated tags as strings such as
-- "♿ 휠체어|rating:4", so keep the database type aligned with that contract.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'post'
          AND table_name = 'post'
          AND column_name = 'tag'
          AND udt_name = '_int4'
    ) THEN
        ALTER TABLE post.post
            ALTER COLUMN tag TYPE varchar[]
            USING CASE
                WHEN tag IS NULL THEN NULL
                ELSE string_to_array(array_to_string(tag, ','), ',')::varchar[]
            END;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS post_id_unique_idx
    ON post.post (id);
CREATE INDEX IF NOT EXISTS post_written_date_idx
    ON post.post (written_date DESC);
CREATE UNIQUE INDEX IF NOT EXISTS user_uid_unique_idx
    ON "user"."user" (uid);
CREATE UNIQUE INDEX IF NOT EXISTS user_id_unique_idx
    ON "user"."user" (id);
CREATE UNIQUE INDEX IF NOT EXISTS validate_id_unique_idx
    ON "user".validate (id);
CREATE UNIQUE INDEX IF NOT EXISTS comment_id_unique_idx
    ON post.comment (id);
CREATE INDEX IF NOT EXISTS place_tag_gin_idx
    ON place.place USING gin (tag);
CREATE INDEX IF NOT EXISTS user_liked_post_gin_idx
    ON "user"."user" USING gin (liked_post);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'post_author_fkey') THEN
        ALTER TABLE post.post
            ADD CONSTRAINT post_author_fkey
            FOREIGN KEY (author) REFERENCES "user"."user" (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comment_parent_fkey') THEN
        ALTER TABLE post.comment
            ADD CONSTRAINT comment_parent_fkey
            FOREIGN KEY (parent) REFERENCES post.post (id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'comment_author_fkey') THEN
        ALTER TABLE post.comment
            ADD CONSTRAINT comment_author_fkey
            FOREIGN KEY (author) REFERENCES "user"."user" (id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'validate_uid_fkey') THEN
        ALTER TABLE "user".validate
            ADD CONSTRAINT validate_uid_fkey
            FOREIGN KEY (uid) REFERENCES "user"."user" (uid) ON DELETE CASCADE
            NOT VALID;
    END IF;
END $$;

COMMIT;
