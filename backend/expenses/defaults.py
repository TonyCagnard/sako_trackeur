"""Catégories par défaut, créées automatiquement pour chaque nouvel utilisateur."""
from .models import Category

# (nom, type, couleur) — liste demandée par l'utilisateur
DEFAULT_CATEGORIES = [
    {"name": "Courses", "kind": "expense", "color": "#10b981"},
    {"name": "Loyer", "kind": "expense", "color": "#6366f1"},
    {"name": "Transport", "kind": "expense", "color": "#3b82f6"},
    {"name": "Loisirs", "kind": "expense", "color": "#ec4899"},
    {"name": "Santé", "kind": "expense", "color": "#ef4444"},
    {"name": "Shopping", "kind": "expense", "color": "#f59e0b"},
    {"name": "Restaurants", "kind": "expense", "color": "#8b5cf6"},
    {"name": "Salaire", "kind": "income", "color": "#22c55e"},
    {"name": "Autre", "kind": "expense", "color": "#64748b"},
]


def seed_default_categories(user):
    """Crée les catégories par défaut manquantes pour un utilisateur (idempotent)."""
    existing = set(user.categories.values_list("name", flat=True))
    to_create = [
        Category(user=user, **data)
        for data in DEFAULT_CATEGORIES
        if data["name"] not in existing
    ]
    Category.objects.bulk_create(to_create)
    return len(to_create)
