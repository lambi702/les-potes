import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Enum
)
from sqlalchemy.orm import relationship

from database import Base


class ItemStatus(str, enum.Enum):
    available = "available"
    borrowed = "borrowed"


class FeedbackCategory(str, enum.Enum):
    bug = "bug"
    idee = "idee"
    autre = "autre"


class FeedbackStatus(str, enum.Enum):
    open = "open"
    resolved = "resolved"


class RsvpStatus(str, enum.Enum):
    yes = "yes"
    maybe = "maybe"
    no = "no"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    display_name = Column(String(80), nullable=False)
    real_name = Column(String(120), nullable=False, default="")
    role_label = Column(String(60), nullable=False, default="Bleu")
    avatar_emoji = Column(String(8), nullable=False, default="🙂")
    bio = Column(Text, nullable=False, default="")
    is_admin = Column(Boolean, nullable=False, default=False)
    can_manage_money = Column(Boolean, nullable=False, default=False)
    must_change_password = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owned_items = relationship("Item", foreign_keys="Item.owner_id", back_populates="owner")
    borrowed_items = relationship("Item", foreign_keys="Item.borrower_id", back_populates="borrower")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=False, default="")
    location = Column(String(160), nullable=False, default="")
    starts_at = Column(DateTime, nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    created_by = relationship("User")
    rsvps = relationship("EventRSVP", back_populates="event", cascade="all, delete-orphan")


class EventRSVP(Base):
    __tablename__ = "event_rsvps"

    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    status = Column(Enum(RsvpStatus), nullable=False, default=RsvpStatus.yes)

    event = relationship("Event", back_populates="rsvps")
    user = relationship("User")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False, default="")
    category = Column(String(60), nullable=False, default="")
    status = Column(Enum(ItemStatus), nullable=False, default=ItemStatus.available)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    borrower_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_items")
    borrower = relationship("User", foreign_keys=[borrower_id], back_populates="borrowed_items")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True)
    message = Column(Text, nullable=False)
    category = Column(Enum(FeedbackCategory), nullable=False, default=FeedbackCategory.autre)
    status = Column(Enum(FeedbackStatus), nullable=False, default=FeedbackStatus.open)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User")


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(60), primary_key=True)
    value = Column(String(255), nullable=False)


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    author = relationship("User")
    tags = relationship("PostTag", back_populates="post", cascade="all, delete-orphan")
    reactions = relationship("PostReaction", back_populates="post", cascade="all, delete-orphan")


class PostTag(Base):
    __tablename__ = "post_tags"

    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    post = relationship("Post", back_populates="tags")
    user = relationship("User")


class PostReaction(Base):
    __tablename__ = "post_reactions"

    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    emoji = Column(String(8), primary_key=True)

    post = relationship("Post", back_populates="reactions")
    user = relationship("User")
