BEGIN;

ALTER TABLE place.place
    ADD COLUMN IF NOT EXISTS city text,
    ADD COLUMN IF NOT EXISTS district text;

UPDATE place.place
SET
    city = NULLIF((regexp_split_to_array(btrim(address), E'\\s+'))[1], ''),
    district = NULLIF((regexp_split_to_array(btrim(address), E'\\s+'))[2], '');

COMMIT;
