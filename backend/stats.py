"""Calcul à la volée des stats/gamification — rien n'est stocké, tout est recalculé
depuis les tables existantes (posts, items, events, chat...). Simple et toujours
cohérent, largement suffisant à l'échelle d'un groupe de potes."""

from collections import Counter
from datetime import datetime

from sqlalchemy.orm import Session

import models

POINTS_PER_POST = 2
POINTS_PER_REACTION_RECEIVED = 1
POINTS_PER_ITEM = 2
POINTS_PER_EVENT_ATTENDED = 5
POINTS_PER_COMMENT = 1
POINTS_PER_CHAT_MESSAGE = 1

LEVELS = [
    (0, "Nouveau"),
    (10, "Habitué"),
    (30, "Pilier du groupe"),
    (60, "Légende"),
    (100, "Mythique"),
]


def level_title(points: int) -> str:
    title = LEVELS[0][1]
    for threshold, name in LEVELS:
        if points >= threshold:
            title = name
    return title


def _counts_by_user(db: Session):
    """Une seule passe sur les tables pour construire tous les compteurs par user_id."""
    posts = db.query(models.Post).all()
    items = db.query(models.Item).all()
    comments = db.query(models.PostComment).all()
    chat_messages = db.query(models.ChatMessage).all()
    reactions = db.query(models.PostReaction).all()
    post_author = {p.id: p.author_id for p in posts}

    posts_count = Counter(p.author_id for p in posts)
    items_count = Counter(i.owner_id for i in items)
    comments_count = Counter(c.author_id for c in comments)
    chat_count = Counter(m.author_id for m in chat_messages)
    reactions_received = Counter()
    for r in reactions:
        author_id = post_author.get(r.post_id)
        if author_id:
            reactions_received[author_id] += 1

    return posts_count, items_count, comments_count, chat_count, reactions_received


def compute_all_stats(db: Session):
    """Retourne un dict user_id -> UserStats-like dict pour tout le monde, en une passe."""
    users = db.query(models.User).all()
    posts_count, items_count, comments_count, chat_count, reactions_received = _counts_by_user(db)

    all_events = db.query(models.Event).filter(models.Event.starts_at <= datetime.utcnow()).order_by(
        models.Event.starts_at.desc()
    ).all()

    result = {}
    for user in users:
        streak = 0
        for event in all_events:
            rsvp = next((r for r in event.rsvps if r.user_id == user.id), None)
            if rsvp and rsvp.status == models.RsvpStatus.yes:
                streak += 1
            else:
                break

        events_attended = sum(
            1 for e in all_events for r in e.rsvps if r.user_id == user.id and r.status == models.RsvpStatus.yes
        )

        p = posts_count.get(user.id, 0)
        it = items_count.get(user.id, 0)
        rr = reactions_received.get(user.id, 0)
        cm = comments_count.get(user.id, 0)
        chm = chat_count.get(user.id, 0)

        points = (
            p * POINTS_PER_POST
            + rr * POINTS_PER_REACTION_RECEIVED
            + it * POINTS_PER_ITEM
            + events_attended * POINTS_PER_EVENT_ATTENDED
            + cm * POINTS_PER_COMMENT
            + chm * POINTS_PER_CHAT_MESSAGE
        )

        result[user.id] = {
            "user": user,
            "posts_count": p,
            "items_count": it,
            "reactions_received": rr,
            "comments_count": cm,
            "chat_messages_count": chm,
            "events_attended": events_attended,
            "event_streak": streak,
            "points": points,
            "level_title": level_title(points),
        }
    return result


def compute_badges(db: Session, user_id: int, all_stats: dict) -> list[dict]:
    mine = all_stats.get(user_id)
    if not mine:
        return []

    def is_top(metric: str) -> bool:
        values = [(uid, s[metric]) for uid, s in all_stats.items() if s[metric] > 0]
        if not values:
            return False
        best = max(v for _, v in values)
        return mine[metric] == best and best > 0

    # "Oiseau de nuit" : a déjà posté un ragot après minuit et avant 6h.
    night_owl = (
        db.query(models.Post)
        .filter(models.Post.author_id == user_id)
        .all()
    )
    posted_at_night = any(p.created_at.hour < 6 for p in night_owl)

    is_newcomer = (datetime.utcnow() - mine["user"].created_at).days < 7

    badges = [
        {
            "key": "plume_or", "emoji": "📝", "label": "Plume d'or",
            "description": "A posté le plus de ragots",
            "earned": is_top("posts_count"),
        },
        {
            "key": "roi_troc", "emoji": "🔧", "label": "Roi·ne du Troc",
            "description": "A proposé le plus d'objets au Troc",
            "earned": is_top("items_count"),
        },
        {
            "key": "chambreur", "emoji": "🎙️", "label": "Chambreur en chef",
            "description": "Ses ragots ont reçu le plus de réactions",
            "earned": is_top("reactions_received"),
        },
        {
            "key": "toujours_partant", "emoji": "🔥", "label": "Toujours partant",
            "description": "Le plus grand streak d'événements d'affilée",
            "earned": is_top("event_streak") and mine["event_streak"] > 0,
        },
        {
            "key": "bavard", "emoji": "💬", "label": "Bavard·e",
            "description": "A envoyé le plus de messages dans le chat",
            "earned": is_top("chat_messages_count"),
        },
        {
            "key": "oiseau_nuit", "emoji": "🦉", "label": "Oiseau de nuit",
            "description": "A posté un ragot entre minuit et 6h",
            "earned": posted_at_night,
        },
        {
            "key": "petit_nouveau", "emoji": "🐣", "label": "Petit·e nouveau·elle",
            "description": "Inscrit·e depuis moins de 7 jours",
            "earned": is_newcomer,
        },
        {
            "key": "mythique", "emoji": "👑", "label": "Statut mythique",
            "description": "100 points ou plus",
            "earned": mine["points"] >= 100,
        },
    ]
    return badges
