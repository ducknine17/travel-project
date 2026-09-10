from enum import Enum

import util.db as db


class AccessibilityFilter(str, Enum):
    # 지체장애
    parking = "parking"
    publictransport = "publictransport"
    route = "route"
    ticketoffice = "ticketoffice"
    promotion = "promotion"
    wheelchair = "wheelchair"
    exit = "exit"
    elevator = "elevator"
    restroom = "restroom"
    auditorium = "auditorium"
    room = "room"
    handicapetc = "handicapetc"

    # 시각장애 (한국관광공사 원본 필드명의 braile 철자를 그대로 사용)
    braileblock = "braileblock"
    helpdog = "helpdog"
    guidehuman = "guidehuman"
    audioguide = "audioguide"
    bigprint = "bigprint"
    brailepromotion = "brailepromotion"
    guidesystem = "guidesystem"
    blindhandicapetc = "blindhandicapetc"

    # 청각장애
    signguide = "signguide"
    videoguide = "videoguide"
    hearingroom = "hearingroom"
    hearinghandicapetc = "hearinghandicapetc"

    # 영유아가족
    stroller = "stroller"
    lactationroom = "lactationroom"
    babysparechair = "babysparechair"
    infantsfamilyetc = "infantsfamilyetc"


ACCESSIBILITY_FILTER_GROUPS = [
    {
        "key": "physical_disability",
        "label": "지체장애",
        "filters": [
            {"key": "parking", "label": "주차 여부"},
            {"key": "publictransport", "label": "대중교통"},
            {"key": "route", "label": "접근로"},
            {"key": "ticketoffice", "label": "매표소"},
            {"key": "promotion", "label": "홍보물"},
            {"key": "wheelchair", "label": "휠체어"},
            {"key": "exit", "label": "출입통로"},
            {"key": "elevator", "label": "엘리베이터"},
            {"key": "restroom", "label": "화장실"},
            {"key": "auditorium", "label": "관람석"},
            {"key": "room", "label": "객실"},
            {"key": "handicapetc", "label": "지체장애 기타 상세"},
        ],
    },
    {
        "key": "visual_disability",
        "label": "시각장애",
        "filters": [
            {"key": "braileblock", "label": "점자블록"},
            {"key": "helpdog", "label": "보조견 동반"},
            {"key": "guidehuman", "label": "안내요원"},
            {"key": "audioguide", "label": "오디오 가이드"},
            {"key": "bigprint", "label": "큰 활자 홍보물"},
            {"key": "brailepromotion", "label": "점자 홍보물 및 점자 표지판"},
            {"key": "guidesystem", "label": "유도 안내 설비"},
            {"key": "blindhandicapetc", "label": "시각장애 기타 상세"},
        ],
    },
    {
        "key": "hearing_disability",
        "label": "청각장애",
        "filters": [
            {"key": "signguide", "label": "수화 안내"},
            {"key": "videoguide", "label": "자막 비디오 가이드 및 영상 자막 안내"},
            {"key": "hearingroom", "label": "객실"},
            {"key": "hearinghandicapetc", "label": "청각장애 기타 상세"},
        ],
    },
    {
        "key": "infant_family",
        "label": "영유아가족",
        "filters": [
            {"key": "stroller", "label": "유모차"},
            {"key": "lactationroom", "label": "수유실"},
            {"key": "babysparechair", "label": "유아용 보조의자"},
            {"key": "infantsfamilyetc", "label": "영유아가족 기타 상세"},
        ],
    },
]


def search_places(filters, page, page_size, query=""):
    """Return places containing every requested accessibility tag."""
    selected = list(dict.fromkeys(item.value for item in filters))
    keyword = query.strip()
    offset = (page - 1) * page_size
    conditions = []
    params = []

    if selected:
        conditions.append("COALESCE(tag, ARRAY[]::varchar[]) @> %s::varchar[]")
        params.append(selected)

    if keyword:
        conditions.append("(name ILIKE %s OR address ILIKE %s)")
        search_pattern = f"%{keyword}%"
        params.extend([search_pattern, search_pattern])

    where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    connection = db.connect()
    cursor = connection.cursor()
    try:
        cursor.execute(
            f"SELECT COUNT(*) FROM place.place {where_sql}",
            tuple(params),
        )
        total = cursor.fetchone()[0]

        cursor.execute(
            f"""
            SELECT id, name, lat, lng, address, type, tag
            FROM place.place
            {where_sql}
            ORDER BY name ASC, id ASC
            LIMIT %s OFFSET %s
            """,
            tuple(params + [page_size, offset]),
        )
        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

    items = [
        {
            "id": row[0],
            "name": row[1],
            "lat": row[2],
            "lng": row[3],
            "address": row[4],
            "type": row[5],
            "tags": row[6] or [],
        }
        for row in rows
    ]
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "filters": selected,
    }


def search_place_options(query=""):
    """Return every lightweight place option matching a name or address."""
    keyword = query.strip()
    where_sql = ""
    params = []

    if keyword:
        where_sql = "WHERE name ILIKE %s OR address ILIKE %s"
        search_pattern = f"%{keyword}%"
        params.extend([search_pattern, search_pattern])

    connection = db.connect()
    cursor = connection.cursor()
    try:
        cursor.execute(
            f"""
            SELECT id, name, address, type, city, district
            FROM place.place
            {where_sql}
            ORDER BY name ASC, id ASC
            """,
            tuple(params),
        )
        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

    return [
        {
            "id": row[0],
            "name": row[1],
            "address": row[2],
            "type": row[3],
            "city": row[4],
            "district": row[5],
        }
        for row in rows
    ]


def get_posts_for_place(place_id):
    """Return posts whose selected place matches the requested DB place."""
    connection = db.connect()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT p.id, p.title, p.author, p.written_date, p.content,
                   p.photo, p.views, p.likes, p.place, p.tag
            FROM post.post AS p
            JOIN place.place AS pl
              ON pl.id = %s AND p.place = pl.name
            ORDER BY p.written_date DESC, p.id DESC
            """,
            (place_id,),
        )
        rows = cursor.fetchall()
    finally:
        cursor.close()
        connection.close()

    keys = (
        "id", "title", "author", "written_date", "content",
        "photo", "views", "likes", "place", "tag",
    )
    return [dict(zip(keys, row)) for row in rows]
