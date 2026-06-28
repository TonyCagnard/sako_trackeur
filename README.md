<<<<<<< HEAD
# sako_trackeur
=======
# Sako Trackeur 💸

Application web moderne de **gestion de budget personnel** : suivi des dépenses,
définition de budgets et analytique.

**Stack** : Django REST Framework (backend) · React + Vite + TypeScript + Tailwind CSS (frontend).

---

## 📁 Structure du projet

```
sako_trackeur/
├── backend/          # API Django + DRF
│   ├── config/         # settings (env-aware), urls, wsgi
│   ├── users/          # comptes & authentification
│   ├── expenses/       # dépenses
│   ├── budgets/        # budgets
│   ├── analytics/      # analytique & tableaux de bord
│   ├── manage.py
│   └── requirements.txt
└── frontend/         # SPA React
    └── src/            # App.tsx, Tailwind, proxy API
```

## ✅ Prérequis

- **Python 3.12+**
- **Node.js 20.19+** recommandé *(fonctionne avec 20.17 — voir la note Node ci-dessous)*
- (Optionnel, production) **PostgreSQL**

> **Note Node** : le frontend est calé sur **Vite 6** (compatible Node 20.17+).
> Pour passer à Vite 7/8 (moteur Rolldown, builds plus rapides), migrez vers
> **Node 22 LTS** puis `npm install vite@latest -D` dans `frontend/`.

---

## 🚀 Démarrage — Backend

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Git Bash (Windows). macOS/Linux : source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # SQLite par défaut — ajuster au besoin
python manage.py migrate
python manage.py runserver    # → http://localhost:8000
```

Sonde de santé : `GET http://localhost:8000/api/health/` → `{"status":"ok","service":"sako-trackeur-api"}`

### Base de données

| Mode | Configuration |
|------|----------------|
| **SQLite** (défaut) | Rien à faire — fichier `backend/db.sqlite3` créé automatiquement. |
| **PostgreSQL** | Dans `.env` : `DATABASE_URL=postgres://USER:PASSWORD@HOST:5432/DB_NAME` |

---

## 🚀 Démarrage — Frontend

```bash
cd frontend
npm install
npm run dev                   # → http://localhost:5173
```

Le serveur Vite proxifie automatiquement `/api/*` vers `http://localhost:8000`
(voir `frontend/vite.config.ts`) — pas de souci de CORS en développement.

---

## 🛠️ Scripts utiles

| Côté | Commande | Rôle |
|------|----------|------|
| backend | `python manage.py runserver` | Serveur de dev API |
| backend | `python manage.py makemigrations` / `migrate` | Migrations |
| backend | `python manage.py createsuperuser` | Créer un accès admin (`/admin/`) |
| frontend | `npm run dev` | Serveur de dev Vite |
| frontend | `npm run build` | Build de production (`dist/`) |
| frontend | `npm run lint` | Vérification ESLint |

---

## 🗺️ Roadmap

- ✅ **Phase 1 — Fondations** : projet Django + DRF, 4 apps, frontend React + Tailwind, Git.
- ⏳ **Phase 2** — Utilisateurs (authentification JWT, profil).
- ⏳ **Phase 3** — Dépenses & budgets (CRUD, catégories).
- ⏳ **Phase 4** — Analytique (tableaux de bord, graphiques).
>>>>>>> 6a6d688 (Phase 1 : fondations du projet Sako Trackeur)
