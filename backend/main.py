import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from database import Base, engine, SessionLocal
import models
from auth import hash_password
from routers import (
    auth_router, users_router, events_router, items_router,
    feedback_router, settings_router, posts_router,
    comments_router, chat_router, stats_router,
)

app = FastAPI(title="Les Potes")

Base.metadata.create_all(bind=engine)

# --- Seed the first admin ("Tchantchès") if the DB is empty ---
db = SessionLocal()
try:
    if db.query(models.User).count() == 0:
        admin_username = os.environ.get("ADMIN_USERNAME", "admin").lower()
        admin_password = os.environ["ADMIN_PASSWORD"]
        admin = models.User(
            username=admin_username,
            password_hash=hash_password(admin_password),
            display_name=os.environ.get("ADMIN_DISPLAY_NAME", "Tchantchès"),
            role_label="Tchantchès",
            avatar_emoji="🔥",
            is_admin=True,
            can_manage_money=True,
            must_change_password=True,
        )
        db.add(admin)
        db.commit()
finally:
    db.close()

app.include_router(auth_router.router)
app.include_router(users_router.router)
app.include_router(events_router.router)
app.include_router(items_router.router)
app.include_router(feedback_router.router)
app.include_router(settings_router.router)
app.include_router(posts_router.router)
app.include_router(comments_router.router)
app.include_router(chat_router.router)
app.include_router(stats_router.router)

STATIC_DIR = "/app/static"

if os.path.isdir(STATIC_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")

    @app.exception_handler(StarletteHTTPException)
    async def spa_fallback(request, exc):
        if exc.status_code == 404 and not request.url.path.startswith("/api"):
            return FileResponse(os.path.join(STATIC_DIR, "index.html"))
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.get("/")
    async def index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
