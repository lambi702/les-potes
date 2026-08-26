from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import (
    verify_password, hash_password, create_token, get_current_user, COOKIE_NAME
)
from routers.settings_router import get_invite_code

router = APIRouter(prefix="/api/auth", tags=["auth"])

COOKIE_KWARGS = dict(httponly=True, samesite="lax", secure=True, path="/")


@router.post("/signup", response_model=schemas.UserMe)
def signup(payload: schemas.SignupRequest, response: Response, db: Session = Depends(get_db)):
    if payload.invite_code.strip() != get_invite_code(db):
        raise HTTPException(status_code=403, detail="Code d'invitation incorrect")

    username = payload.username.strip().lower()
    if not username:
        raise HTTPException(status_code=400, detail="Pseudo requis")
    if len(payload.password) < 4:
        raise HTTPException(status_code=400, detail="Mot de passe trop court (4 caractères min)")
    if db.query(models.User).filter(models.User.username == username).first():
        raise HTTPException(status_code=400, detail="Ce pseudo est déjà pris")

    user = models.User(
        username=username,
        display_name=payload.display_name.strip() or username,
        password_hash=hash_password(payload.password),
        role_label="Bleu",
        avatar_emoji="🙂",
        is_admin=False,
        can_manage_money=False,
        must_change_password=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    response.set_cookie(COOKIE_NAME, token, max_age=60 * 60 * 24 * 30, **COOKIE_KWARGS)
    return user


@router.post("/login", response_model=schemas.UserMe)
def login(payload: schemas.LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Identifiants incorrects")
    token = create_token(user.id)
    response.set_cookie(COOKIE_NAME, token, max_age=60 * 60 * 24 * 30, **COOKIE_KWARGS)
    return user


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"ok": True}


@router.get("/me", response_model=schemas.UserMe)
def me(user: models.User = Depends(get_current_user)):
    return user


@router.post("/change-password")
def change_password(
    payload: schemas.ChangePasswordRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not user.must_change_password:
        if not payload.current_password or not verify_password(payload.current_password, user.password_hash):
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    if len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="Mot de passe trop court (4 caractères min)")
    user.password_hash = hash_password(payload.new_password)
    user.must_change_password = False
    db.commit()
    return {"ok": True}
