import datetime
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from util.maker import convertDict
from util.body import *
from auth.checker import *
from auth.email_manager import *
from auth.jwt_manager import create_access_token, get_current_user_id
import hashlib
import bcrypt
import time
import shutil

dotenv.load_dotenv("../.env")

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

@app.get('/')
def test():
    raise HTTPException(404, "Hi")

@app.get("/load-post")
def load_post(_uid: str = Depends(get_current_user_id)):
    con = db.connect()
    result = db.executeQuery(con, "SELECT * FROM post.post")
    res = []
    res = convertDict(result, ["id", "title", "author", "written_date", "content", "photo", "views", "likes", "place", "tag"])

    return res

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
    db.executeQuery(con, query, params)

    raise HTTPException(200)


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
    db.executeQuery(con, query, params)

    raise HTTPException(200)

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
    db.executeQuery(con, query, params)

    raise HTTPException(200)

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
    return {
        "uid": uid
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
    destination = f"../image/{filename}.{filetype}"

    # Save the file to disk safely
    with open(destination, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "filename": file.filename,
        "content_type": file.content_type
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("HOST_PORT")))
