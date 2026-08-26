from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

from models import ItemStatus, FeedbackCategory, FeedbackStatus, RsvpStatus


# ---- Auth ----
class LoginRequest(BaseModel):
    username: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str


class SignupRequest(BaseModel):
    invite_code: str
    username: str
    display_name: str
    password: str


class InviteCodeOut(BaseModel):
    invite_code: str


# ---- User / Participant ----
class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    display_name: str
    real_name: str
    role_label: str
    avatar_emoji: str
    bio: str
    is_admin: bool
    can_manage_money: bool


class UserMe(UserPublic):
    must_change_password: bool


class UserCreate(BaseModel):
    username: str
    display_name: str
    real_name: str = ""
    password: str
    role_label: str = "Bleu"
    avatar_emoji: str = "🙂"
    is_admin: bool = False
    can_manage_money: bool = False


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    real_name: Optional[str] = None
    role_label: Optional[str] = None
    avatar_emoji: Optional[str] = None
    bio: Optional[str] = None
    is_admin: Optional[bool] = None
    can_manage_money: Optional[bool] = None


# ---- Événements ----
class RsvpOut(BaseModel):
    status: RsvpStatus
    user: UserPublic


class EventOut(BaseModel):
    id: int
    title: str
    description: str
    location: str
    starts_at: datetime
    created_by: UserPublic
    rsvps: list[RsvpOut]
    my_status: Optional[RsvpStatus] = None
    created_at: datetime


class EventCreate(BaseModel):
    title: str
    description: str = ""
    location: str = ""
    starts_at: datetime


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    starts_at: Optional[datetime] = None


class RsvpRequest(BaseModel):
    status: RsvpStatus


# ---- Items ----
class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    description: str
    category: str
    status: ItemStatus
    owner: UserPublic
    borrower: Optional[UserPublic] = None
    created_at: datetime


class ItemCreate(BaseModel):
    name: str
    description: str = ""
    category: str = ""


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None


# ---- Feedback (UAT) ----
class FeedbackOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    message: str
    category: FeedbackCategory
    status: FeedbackStatus
    author: UserPublic
    created_at: datetime


class FeedbackCreate(BaseModel):
    message: str
    category: FeedbackCategory = FeedbackCategory.autre


# ---- Journal / Ragots ----
class PostOut(BaseModel):
    id: int
    content: str
    author: UserPublic
    tagged: list[UserPublic]
    reactions: dict[str, int]
    my_reactions: list[str]
    created_at: datetime


class PostCreate(BaseModel):
    content: str
    tagged_ids: list[int] = []


class ReactRequest(BaseModel):
    emoji: str
