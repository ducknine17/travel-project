import datetime
import os
from pathlib import Path

import dotenv
import requests
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from util.maker import convertDict
from util.body import *
from auth.checker import *
from auth.email_manager import *
from auth.jwt_manager import (
    create_access_token,
    get_current_user_id,
    verify_password_change_token,
)
import hashlib
import bcrypt
import time
import shutil
from bus_api import (
    get_osm_bus_stations,
    get_response_items,
    get_seoul_bus_locations,
    get_seoul_bus_stations,
    get_seoul_station_routes,
    get_service_key,
    is_seoul_coordinate,
)
from place_filter import (
    ACCESSIBILITY_FILTER_GROUPS,
    AccessibilityFilter,
    get_posts_for_place,
    search_place_options,
    search_places,
)

dotenv.load_dotenv(Path(__file__).resolve().parents[1] / ".env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://bef-trip.my",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/bus-location")
def get_bus_location(
    city_code: str,
    route_id: str
):
    if city_code == "11":
        try:
            return get_seoul_bus_locations(route_id)
        except (requests.RequestException, RuntimeError, ValueError):
            raise HTTPException(
                status_code=502,
                detail=(
                    "서울 실시간 버스 위치 API 요청에 실패했습니다. "
                    "서울 버스위치정보조회 서비스 활용 승인을 확인하세요."
                ),
            )

    url = "https://apis.data.go.kr/1613000/BusLcInfoInqireService/getRouteAcctoBusLcList"

    params = {
        "serviceKey": get_service_key(),
        "pageNo": 1,
        "numOfRows": 100,
        "_type": "json",
        "cityCode": city_code,
        "routeId": route_id,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()

        data = response.json()

        items = get_response_items(data)

        buses = []

        for bus in items:
            buses.append({
                "routeName": bus.get("routenm"),
                "latitude": bus.get("gpslati"),
                "longitude": bus.get("gpslong"),
                "nodeOrder": bus.get("nodeord"),
                "nodeName": bus.get("nodenm"),
                "nodeId": bus.get("nodeid"),
                "routeType": bus.get("routetp"),
                "vehicleNumber": bus.get("vehicleno"),
            })

        return buses

    except (requests.RequestException, ValueError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"버스 API 요청 실패: {str(e)}"
        )


@app.get("/bus-routes")
def get_bus_routes(
    city_code: str,
    node_id: str,
    ars_id: str = None,
):
    if city_code == "11":
        if not ars_id:
            raise HTTPException(status_code=400, detail="서울 정류장 ARS ID가 필요합니다.")
        try:
            return get_seoul_station_routes(ars_id)
        except (requests.RequestException, RuntimeError, ValueError):
            raise HTTPException(
                status_code=502,
                detail=(
                    "서울 정류장별 노선 API 요청에 실패했습니다. "
                    "서울 버스 정류소정보조회 서비스 활용 승인을 확인하세요."
                ),
            )

    url = (
        "https://apis.data.go.kr/1613000/BusRouteInfoInqireService/"
        "getSttnThrghRouteList"
    )
    params = {
        "serviceKey": get_service_key(),
        "pageNo": 1,
        "numOfRows": 100,
        "_type": "json",
        "cityCode": city_code,
        "nodeId": node_id,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        return [
            {
                "routeId": item.get("routeid"),
                "routeName": item.get("routeno"),
                "routeType": item.get("routetp"),
                "startName": item.get("startnodenm"),
                "endName": item.get("endnodenm"),
            }
            for item in get_response_items(response.json())
            if item.get("routeid") is not None
        ]
    except (requests.RequestException, RuntimeError, ValueError) as e:
        raise HTTPException(
            status_code=502,
            detail=f"정류장별 노선 API 요청 실패: {str(e)}",
        )


@app.get("/bus-stations")
def get_bus_stations(
    latitude: float,
    longitude: float
):
    if is_seoul_coordinate(latitude, longitude):
        try:
            stations = get_seoul_bus_stations(latitude, longitude)
            if stations:
                return stations
        except (requests.RequestException, RuntimeError, ValueError):
            pass

        return get_osm_bus_stations(latitude, longitude)

    url = "https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList"

    params = {
        "serviceKey": get_service_key(),
        "pageNo": 1,
        "numOfRows": 100,
        "_type": "json",
        "gpsLati": latitude,
        "gpsLong": longitude,
    }

    try:
        response = requests.get(
            url,
            params=params,
            timeout=3
        )

        response.raise_for_status()

        data = response.json()

        items = get_response_items(data)

        stations = []

        for station in items:
            stations.append({
                "id": station.get("nodeid"),
                "name": station.get("nodenm"),
                "latitude": station.get("gpslati"),
                "longitude": station.get("gpslong"),
                "cityCode": station.get("citycode"),
                "routes": [],
                "arrivalSupported": True,
                "locationSupported": True,
                "source": "public-data",
            })

        if stations:
            return stations

        return get_osm_bus_stations(latitude, longitude)

    except (requests.RequestException, ValueError) as e:
        try:
            return get_osm_bus_stations(latitude, longitude)
        except (requests.RequestException, ValueError) as fallback_error:
            raise HTTPException(
                status_code=502,
                detail=(
                    f"버스 정류장 API 요청 실패: {str(e)}; "
                    f"보조 정류장 API 요청 실패: {str(fallback_error)}"
                ),
            )


@app.get("/bus-arrival")
def get_bus_arrival(
    city_code: str,
    node_id: str,
):
    url = "https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList"

    params = {
        # OPENAPI_KEY is stored in its encoded form. Decode it here because
        # requests encodes params; otherwise '%' becomes '%25'.
        "serviceKey": get_service_key(),
        "pageNo": 1,
        "numOfRows": 100,
        "_type": "json",
        "cityCode": city_code,
        "nodeId": node_id,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        items = get_response_items(response.json())

        return [
            {
                "stationId": item.get("nodeid"),
                "stationName": item.get("nodenm"),
                "routeId": item.get("routeid"),
                "routeName": item.get("routeno"),
                "routeType": item.get("routetp"),
                "remainingStops": item.get("arrprevstationcnt"),
                "vehicleType": item.get("vehicletp"),
                "arrivalTime": item.get("arrtime"),
            }
            for item in items
        ]
    except (requests.RequestException, ValueError) as e:
        raise HTTPException(
            status_code=500,
            detail=f"버스 도착정보 API 요청 실패: {str(e)}",
        )


@app.get('/')
def test():
    raise HTTPException(404, "Hi")


@app.get("/places/filters")
def get_place_filters():
    """Return filter keys and Korean labels used by the client."""
    return {"groups": ACCESSIBILITY_FILTER_GROUPS}


@app.get("/places", response_model=PlaceFilterResponse)
def get_places(
    filters: list[AccessibilityFilter] = Query(default=[]),
    q: str = Query(default="", max_length=100),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=5000),
):
    """
    Filter tourist places by accessibility facilities.

    Repeat the filters query parameter to select multiple facilities. A place
    must contain every selected facility (AND semantics).
    """
    return search_places(filters, page, page_size, q)


@app.get("/places/{place_id}/posts")
def get_place_posts(place_id: str):
    """Return posts written for a place selected from the place database."""
    return get_posts_for_place(place_id)


@app.get("/place-options", response_model=list[PlaceOption])
def get_place_options(q: str = Query(default="", max_length=100)):
    """Return all lightweight DB place options for the post editor."""
    return search_place_options(q)

@app.get("/load-post")
def load_post():
    con = db.connect()
    try:
        result = db.executeQuery(
            con,
            """
            SELECT id, title, author, written_date, content, photo,
                   views, likes, place, tag
            FROM post.post
            ORDER BY written_date DESC, id DESC
            """,
        )
        return convertDict(result, ["id", "title", "author", "written_date", "content", "photo", "views", "likes", "place", "tag"])
    finally:
        con.close()


@app.get("/posts/{post_id}")
def get_post(post_id: str):
    con = db.connect()
    try:
        result = db.executeQuery(
            con,
            """
            SELECT id, title, author, written_date, content, photo,
                   views, likes, place, tag
            FROM post.post
            WHERE id = %s
            """,
            (post_id,),
        )
        if not result:
            raise HTTPException(404, "post not found")
        return convertDict(result, ["id", "title", "author", "written_date", "content", "photo", "views", "likes", "place", "tag"])[0]
    finally:
        con.close()

@app.post("/write-post")
def write_post(post: Post, uid: str = Depends(get_current_user_id)):
    id = hashlib.md5(str(time.time()).encode("utf-8")).hexdigest()
    written_date = datetime.datetime.now()
    view, like = 0, 0

    con = db.connect()
    user_result = db.executeQuery(
        con,
        'SELECT id FROM "user".user WHERE uid = %s',
        (uid,),
    )
    if not user_result:
        raise HTTPException(401, "user not found")

    author = user_result[0][0]
    query = "INSERT INTO post.post (id, title, author, written_date, content, photo, views, likes, place, tag) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
    params = (id, post.title, author, written_date, post.content, post.photo, view, like, post.place, post.tag)
    try:
        db.executeQuery(con, query, params)
        return {"id": id, "message": "success"}
    finally:
        con.close()


@app.put("/edit-post")
def edit_post(post: PostEdit, uid: str = Depends(get_current_user_id)):
    written_date = datetime.datetime.now()

    con = db.connect()
    user_result = db.executeQuery(
        con,
        'SELECT id FROM "user".user WHERE uid = %s',
        (uid,),
    )
    if not user_result:
        raise HTTPException(401, "user not found")

    author = user_result[0][0]
    if not postChecker(post.id, author):
        raise HTTPException(404, "post not found")

    query = "UPDATE post.post SET title = %s, written_date = %s, content = %s, place = %s, photo = %s,  tag = %s WHERE id = %s AND author = %s"
    params = (post.title, written_date, post.content, post.place, post.photo, post.tag, post.id, author)
    try:
        db.executeQuery(con, query, params)
        return {"id": post.id, "message": "success"}
    finally:
        con.close()

@app.delete("/delete-post")
def delete_post(post: PostDelete, uid: str = Depends(get_current_user_id)):
    con = db.connect()
    user_result = db.executeQuery(
        con,
        'SELECT id FROM "user".user WHERE uid = %s',
        (uid,),
    )
    if not user_result:
        raise HTTPException(401, "user not found")

    author = user_result[0][0]
    if not postChecker(post.id, author):
        raise HTTPException(404, "post not found")

    query = "DELETE FROM post.post WHERE id = %s AND author = %s"
    params = (post.id, author)
    try:
        db.executeQuery(con, query, params)
        return {"id": post.id, "message": "success"}
    finally:
        con.close()


def update_post_like(post_id: str, uid: str, liked: bool):
    con = db.connect()
    cur = con.cursor()

    try:
        cur.execute(
            'SELECT liked_post FROM "user".user WHERE uid = %s FOR UPDATE',
            (uid,),
        )
        user = cur.fetchone()
        if user is None:
            raise HTTPException(401, "user not found")

        cur.execute(
            "SELECT likes FROM post.post WHERE id = %s FOR UPDATE",
            (post_id,),
        )
        post = cur.fetchone()
        if post is None:
            raise HTTPException(404, "post not found")

        liked_posts = user[0] or []
        likes = post[0] or 0

        if liked and post_id not in liked_posts:
            liked_posts.append(post_id)
            likes += 1
        elif not liked and post_id in liked_posts:
            liked_posts.remove(post_id)
            likes = max(0, likes - 1)
        else:
            return {"post_id": post_id, "liked": liked, "likes": likes}

        cur.execute(
            'UPDATE "user".user SET liked_post = %s WHERE uid = %s',
            (liked_posts, uid),
        )
        cur.execute(
            "UPDATE post.post SET likes = %s WHERE id = %s",
            (likes, post_id),
        )
        con.commit()

        return {"post_id": post_id, "liked": liked, "likes": likes}
    except Exception:
        con.rollback()
        raise
    finally:
        cur.close()
        con.close()


@app.post("/posts/{post_id}/like")
def like_post(post_id: str, uid: str = Depends(get_current_user_id)):
    return update_post_like(post_id, uid, True)


@app.delete("/posts/{post_id}/like")
def unlike_post(post_id: str, uid: str = Depends(get_current_user_id)):
    return update_post_like(post_id, uid, False)


@app.get("/liked-posts")
def get_liked_posts(uid: str = Depends(get_current_user_id)):
    con = db.connect()
    cur = con.cursor()

    try:
        cur.execute(
            'SELECT liked_post FROM "user".user WHERE uid = %s',
            (uid,),
        )
        user = cur.fetchone()
        if user is None:
            raise HTTPException(401, "user not found")

        liked_posts = user[0] or []
        if not liked_posts:
            return []

        cur.execute(
            """
            SELECT id, title, author, written_date, content, photo,
                   views, likes, place, tag
            FROM post.post
            WHERE id = ANY(%s::varchar[])
            ORDER BY array_position(%s::varchar[], id) DESC
            """,
            (liked_posts, liked_posts),
        )
        return convertDict(
            cur.fetchall(),
            [
                "id", "title", "author", "written_date", "content",
                "photo", "views", "likes", "place", "tag",
            ],
        )
    finally:
        cur.close()
        con.close()

@app.get("/check-id/{id}")
def check_id(id: str):
    exists = registerChecker(id)

    return {
        "available": not exists
    }

@app.post("/register")
def register(user: UserRegister):
    uid = idMaker()
    password_hashed = bcrypt.hashpw(user.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    if registerChecker(user.id):
        raise HTTPException(409, "id already exists")

    con = db.connect()
    query = "INSERT INTO \"user\".user (uid, id, password, written_post, liked_post, email, is_available) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    params = (uid, user.id, password_hashed, [], [], user.email, False)
    db.executeQuery(con, query, params)

    raise HTTPException(200)

@app.post("/password-change/send-email")
def send_password_change_email(uid: str = Depends(get_current_user_id)):
    con = db.connect()
    result = db.executeQuery(
        con,
        'SELECT email FROM "user".user WHERE uid = %s',
        (uid,),
    )
    if not result:
        raise HTTPException(404, "user not found")

    send_password_change_link(uid, result[0][0])
    return {
        "message": "비밀번호 변경 인증 메일을 발송했습니다."
    }


@app.put("/edit-user", include_in_schema=False)
@app.put("/password-change")
def edit_user(user: UserEdit, uid: str = Depends(get_current_user_id)):
    verification_id = verify_password_change_token(user.verification_token, uid)
    con = db.connect()
    password_hashed = bcrypt.hashpw(
        user.password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")

    cur = con.cursor()
    try:
        cur.execute(
            '''
            SELECT id
            FROM "user".validate
            WHERE id = %s AND uid = %s AND is_used = false
            FOR UPDATE
            ''',
            (verification_id, uid),
        )
        if cur.fetchone() is None:
            raise HTTPException(403, "email verification failed")

        cur.execute(
            'UPDATE "user".user SET password = %s WHERE uid = %s',
            (password_hashed, uid),
        )
        if cur.rowcount != 1:
            raise HTTPException(404, "user not found")

        cur.execute(
            'UPDATE "user".validate SET is_used = true WHERE id = %s',
            (verification_id,),
        )
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        cur.close()
        con.close()

    return {
        "message": "success"
    }


@app.post("/send-email")
def send_email_link(req: EmailRequest):
    con = db.connect()

    query = 'SELECT uid, email FROM "user".user WHERE id = %s'
    result = db.executeQuery(con, query, (req.id,))

    if len(result) == 0:
        raise HTTPException(404, "user not found")

    uid = result[0][0]
    email = result[0][1]

    send_link(uid, email)

    return {
        "message": "인증 메일을 발송했습니다."
    }

@app.post("/login")
def login(user: UserLogin):
    uid = loginChecker(user.id, user.password)
    if uid is None:
        raise HTTPException(403, "not valid user")

    access_token = create_access_token(uid)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "uid": uid
        }
    }

@app.get("/me")
def me(uid: str = Depends(get_current_user_id)):
    con = db.connect()

    query = (
        'SELECT uid, id, profile_image_id, character '
        'FROM "user".user WHERE uid = %s'
    )
    result = db.executeQuery(con, query, (uid,))

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "uid": result[0][0],
        "username": result[0][1],
        "profile_image_id": result[0][2],
        "character": result[0][3],
    }


@app.put("/profile")
def update_profile(
    profile: UserProfileEdit,
    uid: str = Depends(get_current_user_id),
):
    con = db.connect()
    cur = con.cursor()
    try:
        cur.execute(
            '''
            UPDATE "user".user
            SET profile_image_id = %s, character = %s
            WHERE uid = %s
            RETURNING profile_image_id, character
            ''',
            (profile.profile_image_id, profile.character, uid),
        )
        updated = cur.fetchone()
        if updated is None:
            raise HTTPException(status_code=404, detail="User not found")
        con.commit()
    except Exception:
        con.rollback()
        raise
    finally:
        cur.close()
        con.close()

    return {
        "profile_image_id": updated[0],
        "character": updated[1],
    }

@app.get("/validate/{id}")
def validate(id):
    if not validateChecker(id):
        raise HTTPException(403, "not valid link")

    raise HTTPException(200)

@app.get("/image/{id}")
def image(id):
    for img in os.listdir("../image"):
        if id in img:
            return FileResponse(f"../image/{img}")

    raise HTTPException(404, "image does not exist")


@app.post("/upload-image/")
async def upload_image(
    file: UploadFile = File(...),
    _uid: str = Depends(get_current_user_id),
):
    # Validate that the file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    filetype = file.filename.split(".")[-1]
    filename = idMaker()
    saved_filename = f"{filename}.{filetype}"
    destination = f"../image/{filename}.{filetype}"

    # Save the file to disk safely
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "id": filename,
        "filename": saved_filename,
        "content_type": file.content_type
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("HOST_PORT")))
