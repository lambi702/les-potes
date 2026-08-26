from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])


def _event_out(event: models.Event, current_user_id: int) -> schemas.EventOut:
    my_status = next((r.status for r in event.rsvps if r.user_id == current_user_id), None)
    return schemas.EventOut(
        id=event.id,
        title=event.title,
        description=event.description,
        location=event.location,
        starts_at=event.starts_at,
        created_by=event.created_by,
        rsvps=[schemas.RsvpOut(status=r.status, user=r.user) for r in event.rsvps],
        my_status=my_status,
        created_at=event.created_at,
    )


@router.get("", response_model=list[schemas.EventOut])
def list_events(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    events = db.query(models.Event).order_by(models.Event.starts_at.asc()).all()
    return [_event_out(e, user.id) for e in events]


@router.post("", response_model=schemas.EventOut)
def create_event(
    payload: schemas.EventCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Titre requis")
    event = models.Event(
        title=payload.title.strip(),
        description=payload.description.strip(),
        location=payload.location.strip(),
        starts_at=payload.starts_at,
        created_by_id=user.id,
    )
    db.add(event)
    db.flush()
    db.add(models.EventRSVP(event_id=event.id, user_id=user.id, status=models.RsvpStatus.yes))
    db.commit()
    db.refresh(event)
    return _event_out(event, user.id)


@router.patch("/{event_id}", response_model=schemas.EventOut)
def update_event(
    event_id: int,
    payload: schemas.EventUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Introuvable")
    if event.created_by_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Seul l'organisateur ou le staff peut modifier cet événement")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(event, field, value)
    db.commit()
    db.refresh(event)
    return _event_out(event, user.id)


@router.delete("/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Introuvable")
    if event.created_by_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Seul l'organisateur ou le staff peut supprimer cet événement")
    db.delete(event)
    db.commit()
    return {"ok": True}


@router.put("/{event_id}/rsvp", response_model=schemas.EventOut)
def set_rsvp(
    event_id: int,
    payload: schemas.RsvpRequest,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Introuvable")
    rsvp = (
        db.query(models.EventRSVP)
        .filter(models.EventRSVP.event_id == event_id, models.EventRSVP.user_id == user.id)
        .first()
    )
    if rsvp:
        rsvp.status = payload.status
    else:
        db.add(models.EventRSVP(event_id=event_id, user_id=user.id, status=payload.status))
    db.commit()
    db.refresh(event)
    return _event_out(event, user.id)
