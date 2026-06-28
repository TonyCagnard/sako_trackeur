"""Catégorisation automatique des transactions importées (Partie 19).

Associe un libellé de transaction à une catégorie de l'utilisateur
en fonction de règles par mot-clé (insensible à la casse).
"""
from expenses.models import Category

# (mot-clé, catégorie cible) — ordre important : le 1er match gagne.
CATEGORY_RULES = [
    # Restaurants
    ("mcdonald", "Restaurants"),
    ("burger king", "Restaurants"),
    ("uber eats", "Restaurants"),
    ("deliveroo", "Restaurants"),
    # Courses
    ("carrefour", "Courses"),
    ("auchan", "Courses"),
    ("leclerc", "Courses"),
    ("lidl", "Courses"),
    ("intermarché", "Courses"),
    # Transport
    ("totalenergies", "Transport"),
    ("shell", "Transport"),
    ("essence", "Transport"),
    ("sncf", "Transport"),
    ("ratp", "Transport"),
    # Loisirs
    ("netflix", "Loisirs"),
    ("spotify", "Loisirs"),
    ("steam", "Loisirs"),
    # Shopping
    ("amazon", "Shopping"),
    ("zalando", "Shopping"),
    ("ikea", "Shopping"),
    # Santé
    ("doctolib", "Santé"),
    ("pharmacie", "Santé"),
    # Loyer
    ("loyer", "Loyer"),
]


def _category(user, name):
    return Category.objects.filter(user=user, name__iexact=name).first()


def categorize(user, description, is_income):
    """Retourne la Category de l'utilisateur qui correspond au libellé."""
    if is_income:
        return _category(user, "Salaire")
    desc = (description or "").lower()
    for keyword, category_name in CATEGORY_RULES:
        if keyword in desc:
            category = _category(user, category_name)
            if category:
                return category
    return _category(user, "Autre")
