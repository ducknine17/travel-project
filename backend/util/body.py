from pydantic import BaseModel, Field
from typing import Optional

class Post(BaseModel):
    title: str
    content: str
    photo: list[str]
    place: str
    tag: list[str]

class PostEdit(BaseModel):
    id: str
    title: str
    content: str
    photo: list[str]
    place: str
    tag: list[str]

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


class UserProfileEdit(BaseModel):
    profile_image_id: Optional[str] = Field(default=None, max_length=64)
    character: int = Field(ge=0, le=3)


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


class PlaceOption(BaseModel):
    id: str
    name: str
    address: Optional[str] = None
    type: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
