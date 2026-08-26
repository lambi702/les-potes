# Les Potes 🏛️

Hub quotidien pour la bande — rôles fun, calendrier d'événements, troc d'objets, ragots, feedback... auto-hébergé. Identité rétro-arcade aux couleurs de Liège (rouge/or, clin d'œil au Perron et à Tchantchès).

Dérivé de [dour-crew](https://github.com/lambi702/dour-crew), pensé pour un usage permanent plutôt qu'un événement précis (pas de carte de camping ici, remplacée par un calendrier).

## Stack
- **Backend** : FastAPI + SQLAlchemy + PostgreSQL, auth par cookie JWT
- **Frontend** : React (Vite) + Tailwind CSS, police Press Start 2P
- **Déploiement** : Docker Compose (backend+frontend buildés dans une seule image, Postgres à part), Caddy en reverse proxy avec HTTPS automatique

## Développement local
```bash
cp .env.example .env  # puis remplis les valeurs
docker compose up --build
```

## Variables d'environnement (`.env`, jamais commité)
- `DB_PASSWORD`
- `JWT_SECRET`
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME` — compte admin créé automatiquement au premier démarrage

## Fonctionnalités
- Authentification + inscription libre par code d'invitation
- Rôles fun personnalisables, éditables par chacun sur sa propre fiche
- Pseudo (affiché partout) + nom complet (plus formel), séparés et éditables
- Calendrier d'événements avec RSVP (✅/🤔/❌)
- Troc d'objets entre participants (recherche, emprunt, retour)
- Fil de ragots avec tags, réactions emoji et commentaires
- Chat de groupe en direct (WebSocket)
- Gamification : points/niveaux, badges, streaks d'événements, classement
- Profil enrichi : anniversaire, statut de dispo, carte "qui habite où" (Leaflet/OSM, sans clé API)
- Cloche de notifications in-app (nouveautés depuis la dernière visite)
- Espace feedback pour la phase de test (UAT)
- Panneau admin (staff) : gestion des participants, droits, lien d'invitation

## Migrations manuelles
Pas d'Alembic — le schéma se crée via `Base.metadata.create_all()` au démarrage (tables neuves uniquement). Toute évolution du modèle sur une base existante nécessite un `ALTER TABLE` manuel avant de redéployer.

## Déployé sur
https://potes.lambi-house.be
