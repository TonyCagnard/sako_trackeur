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


class Expense(models.Model):
    """Une dépense (ou un revenu selon la catégorie) de l'utilisateur."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expenses",
        verbose_name="utilisateur",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,  # ne pas supprimer une catégorie utilisée
        related_name="expenses",
        verbose_name="catégorie",
    )
    amount = models.DecimalField("montant", max_digits=12, decimal_places=2)
    date = models.DateField("date")
    description = models.CharField(
        "description", max_length=200, blank=True, default=""
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "dépense"
        verbose_name_plural = "dépenses"
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"{self.amount} € — {self.category.name} ({self.date})"
