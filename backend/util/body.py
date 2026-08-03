from pydantic import BaseModel, Field

class Post(BaseModel):
    title: str
    content: str
    photo: list
    place: str
    tag: list

class PostEdit(BaseModel):
    id: str
    title: str
    content: str
    photo: list
    place: str
    tag: list

class PostDelete(BaseModel):
    id: str

class UserRegister(BaseModel):
    id: str
    password: str
    email: str

class UserLogin(BaseModel):
    id: str
    password: str

class EmailRequest(BaseModel):
    id: str

class UserEdit(BaseModel):
    password: str = Field(min_length=8, max_length=128)
    verification_token: str


class PlaceSummary(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    address: str
    type: str
    tags: list[str]


class PlaceFilterResponse(BaseModel):
    items: list[PlaceSummary]
    total: int
    page: int
    page_size: int
    filters: list[str]
