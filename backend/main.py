import datetime
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import dotenv
from backend.util import db
from util.dict_maker import convertDict
from backend.types.body import Post
import hashlib
import bcrypt
import time

dotenv.load_dotenv("../.env")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def test():
    raise HTTPException(404, "Hi")

@app.get("/load-post")
def load_post():
    con = db.connect()
    result = db.executeQuery(con, "SELECT * FROM post.post")
    res = []
    res = convertDict(result, ["id", "title", "author", "written_date", "content", "photo", "views", "likes", "place", "tag"])

    return res

@app.post("/write-post")
def write_post(post: Post):
    id = hashlib.md5(str(time.time()).encode("utf-8")).hexdigest()
    written_date = datetime.datetime.now()
    view, like = 0, 0

    con = db.connect()
    query = "INSERT INTO post.post (id, title, author, written_date, content, photo, views, likes, place, tag) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"
    params = (id, post.title, post.author, written_date, post.content, post.photo, view, like, post.place, post.tag)
    db.executeQuery(con, query, params)

    raise HTTPException(200)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("HOST_PORT")))