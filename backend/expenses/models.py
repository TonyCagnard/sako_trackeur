from django.conf import settings
from django.db import models


class Category(models.Model):
    """Catégorie de dépense ou de revenu, propre à chaque utilisateur."""

    class Kind(models.TextChoices):
        EXPENSE = "expense", "Dépense"
        INCOME = "income", "Revenu"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories",
        verbose_name="utilisateur",
    )
    name = models.CharField("nom", max_length=50)
    kind = models.CharField(
        "type", max_length=10, choices=Kind.choices, default=Kind.EXPENSE
    )
    color = models.CharField("couleur", max_length=7, default="#6366f1")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "catégorie"
        verbose_name_plural = "catégories"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="unique_category_per_user"
            ),
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()})"
