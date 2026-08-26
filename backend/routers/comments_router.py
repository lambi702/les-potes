from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/posts", tags=["comments"])


@router.get("/{post_id}/comments", response_model=list[schemas.CommentOut])
def list_comments(post_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.PostComment)
        .filter(models.PostComment.post_id == post_id)
        .order_by(models.PostComment.created_at.asc())
        .all()
    )


@router.post("/{post_id}/comments", response_model=schemas.CommentOut)
def create_comment(
    post_id: int,
    payload: schemas.CommentCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Ragot introuvable")
    content = payload.content.strip()
    if not content:
        raise HTTPException(status_code=400, detail="Commentaire vide")
    comment = models.PostComment(post_id=post_id, author_id=user.id, content=content)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    comment = db.query(models.PostComment).filter(models.PostComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Introuvable")
    if comment.author_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Seul l'auteur ou le staff peut supprimer")
    db.delete(comment)
    db.commit()
    return {"ok": True}
