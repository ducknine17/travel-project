from pydantic import BaseModel
import datetime

class Post(BaseModel):
    title: str
    author: str
    content: str
    photo: list
    place: str
    tag: list