from pydantic import BaseModel

class Post(BaseModel):
    title: str
    author: str
    content: str
    photo: list
    place: str
    tag: list

class PostEdit(BaseModel):
    id: str
    author: str
    title: str
    content: str
    photo: list
    place: str
    tag: list

class UserRegister(BaseModel):
    id: str
    password: str
    email: str

class UserLogin(BaseModel):
    id: str
    password: str

class EmailRequest(BaseModel):
    id: str