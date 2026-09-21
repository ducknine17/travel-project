BEGIN;

ALTER TABLE "user"."user"
    ADD COLUMN IF NOT EXISTS character integer;

ALTER TABLE "user"."user"
    DROP CONSTRAINT IF EXISTS user_character_allowed_check;

ALTER TABLE "user"."user"
    ALTER COLUMN character DROP DEFAULT;

-- 기존 json/문자열 값도 0~3 정수로 안전하게 변환한다.
DO $$
DECLARE
    character_type text;
BEGIN
    SELECT data_type
    INTO character_type
    FROM information_schema.columns
    WHERE table_schema = 'user'
      AND table_name = 'user'
      AND column_name = 'character';

    IF character_type IN ('json', 'jsonb') THEN
        ALTER TABLE "user"."user"
            ALTER COLUMN character TYPE integer
            USING (
                CASE COALESCE(
                    CASE
                        WHEN jsonb_typeof(character::jsonb) = 'string'
                            THEN character::jsonb #>> '{}'
                        WHEN jsonb_typeof(character::jsonb) = 'object'
                            THEN COALESCE(
                                character::jsonb ->> 'id',
                                character::jsonb ->> 'character'
                            )
                    END,
                    'retriever'
                )
                    WHEN 'retriever' THEN 0
                    WHEN 'poodle' THEN 1
                    WHEN 'shiba' THEN 2
                    WHEN 'dachshund' THEN 3
                    WHEN '0' THEN 0
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    WHEN '3' THEN 3
                    ELSE 0
                END
            );
    ELSIF character_type <> 'integer' THEN
        ALTER TABLE "user"."user"
            ALTER COLUMN character TYPE integer
            USING (
                CASE trim(both '"' from character::text)
                    WHEN 'retriever' THEN 0
                    WHEN 'poodle' THEN 1
                    WHEN 'shiba' THEN 2
                    WHEN 'dachshund' THEN 3
                    WHEN '0' THEN 0
                    WHEN '1' THEN 1
                    WHEN '2' THEN 2
                    WHEN '3' THEN 3
                    ELSE 0
                END
            );
    END IF;
END $$;

UPDATE "user"."user"
SET character = 0
WHERE character IS NULL OR character NOT BETWEEN 0 AND 3;

ALTER TABLE "user"."user"
    ALTER COLUMN character SET DEFAULT 0,
    ALTER COLUMN character SET NOT NULL;

ALTER TABLE "user"."user"
    ADD CONSTRAINT user_character_allowed_check
    CHECK (character BETWEEN 0 AND 3);

COMMIT;
