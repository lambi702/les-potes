from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_user

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=list[schemas.ItemOut])
def list_items(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return db.query(models.Item).order_by(models.Item.created_at.desc()).all()


@router.post("", response_model=schemas.ItemOut)
def create_item(
    payload: schemas.ItemCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = models.Item(
        name=payload.name.strip(),
        description=payload.description.strip(),
        category=payload.category.strip(),
        owner_id=user.id,
        status=models.ItemStatus.available,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=schemas.ItemOut)
def update_item(
    item_id: int,
    payload: schemas.ItemUpdate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Objet introuvable")
    if item.owner_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Seul le proprio (ou l'admin) peut modifier cet objet")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.post("/{item_id}/borrow", response_model=schemas.ItemOut)
def borrow_item(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Objet introuvable")
    if item.status == models.ItemStatus.borrowed:
        raise HTTPException(status_code=400, detail="Déjà emprunté")
    if item.owner_id == user.id:
        raise HTTPException(status_code=400, detail="C'est déjà ton objet !")
    item.status = models.ItemStatus.borrowed
    item.borrower_id = user.id
    db.commit()
    db.refresh(item)
    return item


@router.post("/{item_id}/return", response_model=schemas.ItemOut)
def return_item(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Objet introuvable")
    if item.borrower_id != user.id and item.owner_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Tu n'es ni l'emprunteur ni le proprio")
    item.status = models.ItemStatus.available
    item.borrower_id = None
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_item(item_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    item = db.query(models.Item).filter(models.Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Objet introuvable")
    if item.owner_id != user.id and not user.is_admin:
        raise HTTPException(status_code=403, detail="Seul le proprio (ou l'admin) peut supprimer cet objet")
    db.delete(item)
    db.commit()
    return {"ok": True}
