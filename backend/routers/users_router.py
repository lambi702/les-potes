from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user, require_admin, hash_password

router = APIRouter(prefix="/api/participants", tags=["participants"])


@router.get("", response_model=list[schemas.UserPublic])
def list_participants(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.User).order_by(models.User.display_name).all()


@router.get("/{user_id}", response_model=schemas.UserPublic)
def get_participant(user_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Introuvable")
    return target


@router.post("", response_model=schemas.UserPublic)
def create_participant(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    username = payload.username.strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="Nom d'utilisateur requis")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Ce nom d'utilisateur existe déjà")
    new_user = models.User(
        username=username,
        display_name=payload.display_name.strip() or username,
        real_name=payload.real_name.strip(),
        password_hash=hash_password(payload.password),
        role_label=payload.role_label,
        avatar_emoji=payload.avatar_emoji,
        is_admin=payload.is_admin,
        can_manage_money=payload.can_manage_money,
        must_change_password=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.patch("/{user_id}", response_model=schemas.UserPublic)
def update_participant(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Introuvable")

    is_self = target.id == user.id
    if not user.is_admin and not is_self:
        raise HTTPException(status_code=403, detail="Tu ne peux modifier que ta propre fiche")

    data = payload.model_dump(exclude_unset=True)
    # Only admins can grant/revoke permissions. role_label is fair game for
    # self-edit (or admin) — everyone picks their own fun title.
    if not user.is_admin:
        for field in ("is_admin", "can_manage_money"):
            data.pop(field, None)

    for field, value in data.items():
        setattr(target, field, value)
    db.commit()
    db.refresh(target)
    return target


@router.delete("/{user_id}")
def delete_participant(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Tu ne peux pas te supprimer toi-même")
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Introuvable")
    db.delete(target)
    db.commit()
    return {"ok": True}


@router.post("/{user_id}/reset-password")
def reset_password(
    user_id: int,
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin),
):
    target = db.query(models.User).filter(models.User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Introuvable")
    import secrets
    temp_password = secrets.token_urlsafe(6)
    target.password_hash = hash_password(temp_password)
    target.must_change_password = True
    db.commit()
    return {"temp_password": temp_password}
