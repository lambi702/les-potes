import json

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db, SessionLocal
from auth import get_current_user, get_current_user_ws

router = APIRouter(tags=["chat"])


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, payload: dict):
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(json.dumps(payload))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(ws)


manager = ConnectionManager()


def _message_out(msg: models.ChatMessage) -> dict:
    return schemas.ChatMessageOut.model_validate(msg, from_attributes=True).model_dump(mode="json")


@router.get("/api/chat/messages", response_model=list[schemas.ChatMessageOut])
def list_messages(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    return (
        db.query(models.ChatMessage)
        .order_by(models.ChatMessage.created_at.desc())
        .limit(100)
        .all()[::-1]
    )


@router.post("/api/chat/messages", response_model=schemas.ChatMessageOut)
async def send_message(
    payload: schemas.ChatMessageCreate,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    content = payload.content.strip()
    if not content:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Message vide")
    msg = models.ChatMessage(author_id=user.id, content=content)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    await manager.broadcast(_message_out(msg))
    return msg


@router.websocket("/ws/chat")
async def chat_ws(websocket: WebSocket):
    db = SessionLocal()
    try:
        user = get_current_user_ws(websocket, db)
    except Exception:
        await websocket.close(code=4401)
        db.close()
        return
    await manager.connect(websocket)
    try:
        while True:
            # On ne fait rien des messages entrants (envoi via POST) — on garde juste
            # la connexion ouverte pour recevoir les broadcasts.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    finally:
        db.close()
