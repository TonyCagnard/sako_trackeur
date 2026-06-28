from django.conf import settings
from django.db import models


class Budget(models.Model):
    """Plafond mensuel de dépenses pour une catégorie (récurrent chaque mois)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets",
        verbose_name="utilisateur",
    )
    category = models.ForeignKey(
        "expenses.Category",
        on_delete=models.CASCADE,
        related_name="budgets",
        verbose_name="catégorie",
    )
    amount = models.DecimalField("montant mensuel", max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "budget"
        verbose_name_plural = "budgets"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "category"], name="unique_budget_per_user_category"
            ),
        ]
        ordering = ["category__name"]

    def __str__(self):
        return f"{self.amount} € / mois (cat. {self.category_id})"
