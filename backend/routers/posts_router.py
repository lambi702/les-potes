from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/posts", tags=["posts"])

ALLOWED_EMOJIS = {"❤️", "🔥", "😂", "👀", "😱"}


def _post_out(post: models.Post, current_user_id: int) -> schemas.PostOut:
    reaction_counts = Counter(r.emoji for r in post.reactions)
    my_reactions = [r.emoji for r in post.reactions if r.user_id == current_user_id]
    return schemas.PostOut(
        id=post.id,
        content=post.content,
        author=post.author,
        tagged=[t.user for t in post.tags],
        reactions=dict(reaction_counts),
        my_reactions=my_reactions,
        created_at=post.created_at,
    )


@router.get("", response_model=list[schemas.PostOut])
def list_posts(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    posts = db.query(models.Post).order_by(models.Post.created_at.desc()).all()
    return [_post_out(p, user.id) for p in posts]


@router.post("", response_model=schemas.PostOut)
def create_post(
    payload: schemas.PostCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Le potin est vide")
    post = models.Post(content=content, author_id=user.id)
    db.add(post)
    db.flush()
    for uid in set(payload.tagged_ids):
        if db.query(models.User).filter(models.User.id == uid).first():
            db.add(models.PostTag(post_id=post.id, user_id=uid))
    db.commit()
    db.refresh(post)
    return _post_out(post, user.id)


@router.delete("/{post_id}")
def delete_post(post_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Introuvable")
    if post.author_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Seul l'auteur ou le staff peut supprimer ce potin")
    db.delete(post)
    db.commit()
    return {"ok": True}


@router.post("/{post_id}/react", response_model=schemas.PostOut)
def toggle_reaction(
    post_id: int,
    payload: schemas.ReactRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if payload.emoji not in ALLOWED_EMOJIS:
        raise HTTPException(status_code=400, detail="Emoji non supporté")
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Introuvable")

    existing = (
        db.query(models.PostReaction)
        .filter(
            models.PostReaction.post_id == post_id,
            models.PostReaction.user_id == user.id,
            models.PostReaction.emoji == payload.emoji,
        )
        .first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(models.PostReaction(post_id=post_id, user_id=user.id, emoji=payload.emoji))
    db.commit()
    db.refresh(post)
    return _post_out(post, user.id)
