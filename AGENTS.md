# AGENTS.md — Les Potes

Hub quotidien pour la bande (pas lié à un événement précis). Fork de [dour-crew](https://github.com/lambi702/dour-crew) — mêmes fondations, quelques divergences volontaires listées ci-dessous. Voir aussi `/root/AGENTS.md` pour le contexte serveur partagé.

## Stack
Identique à dour-crew : FastAPI + SQLAlchemy + PostgreSQL, React/Vite + Tailwind, une seule image Docker (build multi-stage). Déployé derrière Caddy sur `potes.lambi-house.be`, port hôte `127.0.0.1:8091`.

## Divergences volontaires par rapport à dour-crew
- **Pas de camping** (`Tent`/`TentOccupant`) — remplacé par un **Calendrier** (`Event`/`EventRSVP`, `routers/events_router.py`) : n'importe qui propose un événement, les autres répondent yes/maybe/no
- **`role_label` éditable par tout le monde** sur sa propre fiche (pas juste l'admin) — c'est un surnom fun, pas une permission ; seuls `is_admin`/`can_manage_money` restent admin-only (voir `users_router.py::update_participant`)
- **`display_name` (pseudo, affiché partout) et `real_name` (nom complet, plus formel) sont deux champs distincts**, tous les deux éditables par soi-même — ne pas les confondre en modifiant le modèle
- Palette Tailwind `potes-*` (rouge/or, thème Liège) au lieu de `dour-*`
- Rôles suggérés (juste des suggestions, texte libre) : Tchantchès, Nanesse, Peket Master, Rouche, Bleu

## Déployer un changement
```bash
docker compose build app && docker compose up -d app
```

## ⚠️ Pas de système de migration (pas d'Alembic) — déjà rencontré une fois ici
`Base.metadata.create_all()` ne modifie jamais une table existante. L'ajout de `real_name` à `User` a nécessité cet ALTER TABLE manuel avant de redéployer — même réflexe pour toute future colonne :
```bash
docker compose exec -T db psql -U potes -d potes -c "ALTER TABLE users ADD COLUMN IF NOT EXISTS xxx VARCHAR(120) NOT NULL DEFAULT '';"
```

## Conventions
Identiques à dour-crew pour tout le reste : auth par cookie JWT httpOnly, inscription par code d'invitation global (table `settings`), pas de state manager frontend externe.

## Secrets
`.env` (jamais commité, voir `.env.example`). Admin seedé une seule fois si `users` est vide.

## Git
Remote SSH via la deploy key du serveur (voir `/root/AGENTS.md`) :
```bash
git add -A && git commit -m "..." && git push
```
