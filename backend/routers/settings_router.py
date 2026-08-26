import secrets

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import require_admin

router = APIRouter(prefix="/api/settings", tags=["settings"])

INVITE_CODE_KEY = "invite_code"


def get_invite_code(db: Session) -> str:
    setting = db.query(models.Setting).filter(models.Setting.key == INVITE_CODE_KEY).first()
    if not setting:
        setting = models.Setting(key=INVITE_CODE_KEY, value=secrets.token_urlsafe(6))
        db.add(setting)
        db.commit()
    return setting.value


@router.get("/invite-code", response_model=schemas.InviteCodeOut)
def read_invite_code(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    return schemas.InviteCodeOut(invite_code=get_invite_code(db))


@router.post("/invite-code/regenerate", response_model=schemas.InviteCodeOut)
def regenerate_invite_code(db: Session = Depends(get_db), admin: models.User = Depends(require_admin)):
    setting = db.query(models.Setting).filter(models.Setting.key == INVITE_CODE_KEY).first()
    new_code = secrets.token_urlsafe(6)
    if setting:
        setting.value = new_code
    else:
        setting = models.Setting(key=INVITE_CODE_KEY, value=new_code)
        db.add(setting)
    db.commit()
    return schemas.InviteCodeOut(invite_code=new_code)
