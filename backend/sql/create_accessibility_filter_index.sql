-- place.tag(text[])의 포함(@>) 검색을 빠르게 처리하기 위한 인덱스입니다.
CREATE INDEX IF NOT EXISTS place_tag_gin_idx
ON place.place
USING GIN (tag);
