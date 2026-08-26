from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user
from stats import compute_all_stats, compute_badges

router = APIRouter(prefix="/api/stats", tags=["stats"])


def _top(all_stats: dict, metric: str, limit: int = 5) -> list[schemas.LeaderboardEntry]:
    ranked = sorted(all_stats.values(), key=lambda s: s[metric], reverse=True)
    ranked = [s for s in ranked if s[metric] > 0][:limit]
    return [schemas.LeaderboardEntry(user=s["user"], value=s[metric]) for s in ranked]


@router.get("/leaderboard", response_model=schemas.LeaderboardOut)
def leaderboard(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    all_stats = compute_all_stats(db)
    return schemas.LeaderboardOut(
        most_posts=_top(all_stats, "posts_count"),
        most_reactions=_top(all_stats, "reactions_received"),
        most_items=_top(all_stats, "items_count"),
        longest_streak=_top(all_stats, "event_streak"),
        most_points=_top(all_stats, "points"),
    )


@router.get("/me", response_model=schemas.UserStats)
def my_stats(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    all_stats = compute_all_stats(db)
    mine = all_stats[user.id]
    badges = compute_badges(db, user.id, all_stats)
    return schemas.UserStats(
        points=mine["points"],
        level_title=mine["level_title"],
        posts_count=mine["posts_count"],
        reactions_received=mine["reactions_received"],
        items_count=mine["items_count"],
        events_attended=mine["events_attended"],
        event_streak=mine["event_streak"],
        comments_count=mine["comments_count"],
        chat_messages_count=mine["chat_messages_count"],
        badges=[schemas.BadgeOut(**b) for b in badges],
    )


@router.get("/user/{user_id}", response_model=schemas.UserStats)
def user_stats(user_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    all_stats = compute_all_stats(db)
    mine = all_stats.get(user_id)
    if not mine:
        return schemas.UserStats(
            points=0, level_title="Nouveau", posts_count=0, reactions_received=0,
            items_count=0, events_attended=0, event_streak=0, comments_count=0,
            chat_messages_count=0, badges=[],
        )
    badges = compute_badges(db, user_id, all_stats)
    return schemas.UserStats(
        points=mine["points"],
        level_title=mine["level_title"],
        posts_count=mine["posts_count"],
        reactions_received=mine["reactions_received"],
        items_count=mine["items_count"],
        events_attended=mine["events_attended"],
        event_streak=mine["event_streak"],
        comments_count=mine["comments_count"],
        chat_messages_count=mine["chat_messages_count"],
        badges=[schemas.BadgeOut(**b) for b in badges],
    )


@router.get("/activity", response_model=schemas.ActivityOut)
def activity(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    since = user.last_seen_at or user.created_at
    new_posts = db.query(models.Post).filter(models.Post.created_at > since).count()
    new_comments = db.query(models.PostComment).filter(models.PostComment.created_at > since).count()
    new_events = db.query(models.Event).filter(models.Event.created_at > since).count()
    new_chat = db.query(models.ChatMessage).filter(models.ChatMessage.created_at > since).count()
    total = new_posts + new_comments + new_events + new_chat
    return schemas.ActivityOut(
        new_posts=new_posts, new_comments=new_comments,
        new_events=new_events, new_chat_messages=new_chat, total=total,
    )


@router.post("/mark-seen")
def mark_seen(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    user.last_seen_at = datetime.utcnow()
    db.commit()
    return {"ok": True}
