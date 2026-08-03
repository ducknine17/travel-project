import dotenv
import requests
import util.db as db
import os
from pathlib import Path

dotenv.load_dotenv(Path(__file__).resolve().parent / ".env")

TYPE_CODE_TO_TEXT = {
    '12': 'tour',
    '14': 'culture',
    '15': 'festival',
    '28': 'sports',
    '32': 'stay',
    '38': 'shopping',
    '39': 'food'
}

r = requests.get(f"https://apis.data.go.kr/B551011/KorWithService2/areaBasedSyncList2?MobileOS=IOS&MobileApp=bef&_type=json&serviceKey={os.environ.get("OPENAPI_KEY")}&numOfRows=20000")
place_list = r.json()['response']['body']['items']['item']

for place in place_list:
    id = place['contentid']
    name = place['title']
    address = place['addr1'] + ' ' + place['addr2']
    _type = TYPE_CODE_TO_TEXT[place['contenttypeid']]
    lat = place['mapx']
    lng = place['mapy']
    con = db.connect()
    query = "SELECT * FROM place.place WHERE id = %s"
    res = db.executeQuery(con, query, (id,))
    if res == []:
        tags = []
        tags_raw = requests.get(f"https://apis.data.go.kr/B551011/KorWithService2/detailWithTour2?serviceKey={os.environ.get('OPENAPI_KEY')}&MobileOS=IOS&MobileApp=bef&_type=json&contentId={id}").json()["response"]["body"]["items"]
        if tags_raw == '':
            continue
        tags_raw = tags_raw["item"][0]
        for key in tags_raw:
            if key == "contentid":
                continue
            if tags_raw[key] != "":
                tags.append(key)
        if tags != []:
            query = "INSERT INTO place.place (id, name, lat, lng, post, tag, address, type) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
            params = (id, name, lat, lng, [], tags, address, _type)
            db.executeQuery(con, query, params)
            print(f"{name} : {tags}")
    else:
        continue
        query = "UPDATE place.place SET name = %s, lat = %s, lng = %s, tag = %s, address = %s, type = %s"
        params = (name, lat, lng, tags, address, _type)

