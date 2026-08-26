from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.get("", response_model=list[schemas.FeedbackOut])
def list_feedback(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Feedback).order_by(models.Feedback.created_at.desc()).all()


@router.post("", response_model=schemas.FeedbackOut)
def create_feedback(
    payload: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message vide")
    fb = models.Feedback(message=message, category=payload.category, author_id=user.id)
    db.add(fb)
    db.commit()
    db.refresh(fb)
    return fb


@router.post("/{feedback_id}/resolve", response_model=schemas.FeedbackOut)
def toggle_resolve(
    feedback_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fb = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Introuvable")
    if not user.is_admin and fb.author_id != user.id:
        raise HTTPException(status_code=403, detail="Seul l'auteur ou le staff peut changer le statut")
    fb.status = (
        models.FeedbackStatus.open if fb.status == models.FeedbackStatus.resolved
        else models.FeedbackStatus.resolved
    )
    db.commit()
    db.refresh(fb)
    return fb


@router.delete("/{feedback_id}")
def delete_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    fb = db.query(models.Feedback).filter(models.Feedback.id == feedback_id).first()
    if not fb:
        raise HTTPException(status_code=404, detail="Introuvable")
    if not user.is_admin and fb.author_id != user.id:
        raise HTTPException(status_code=403, detail="Seul l'auteur ou le staff peut supprimer")
    db.delete(fb)
    db.commit()
    return {"ok": True}
