BEGIN;

ALTER TABLE "user"."user"
    ADD COLUMN IF NOT EXISTS character_customization jsonb;

UPDATE "user"."user"
SET character_customization = '{"badges":[],"items":[],"friendName":""}'::jsonb
WHERE character_customization IS NULL
   OR jsonb_typeof(character_customization) <> 'object';

ALTER TABLE "user"."user"
    ALTER COLUMN character_customization
        SET DEFAULT '{"badges":[],"items":[],"friendName":""}'::jsonb,
    ALTER COLUMN character_customization SET NOT NULL;

ALTER TABLE "user"."user"
    DROP CONSTRAINT IF EXISTS user_character_customization_object_check;

ALTER TABLE "user"."user"
    ADD CONSTRAINT user_character_customization_object_check
    CHECK (
        jsonb_typeof(character_customization) = 'object'
        AND jsonb_typeof(COALESCE(character_customization -> 'badges', '[]'::jsonb)) = 'array'
        AND jsonb_typeof(COALESCE(character_customization -> 'items', '[]'::jsonb)) = 'array'
        AND jsonb_typeof(COALESCE(character_customization -> 'friendName', '""'::jsonb)) = 'string'
    );

COMMIT;
