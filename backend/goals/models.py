from django.conf import settings
from django.db import models


class Goal(models.Model):
    """Objectif d'épargne (ex : Vacances, Voiture, PC, Maison)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="goals",
        verbose_name="utilisateur",
    )
    name = models.CharField("nom", max_length=50)
    target_amount = models.DecimalField(
        "montant cible", max_digits=12, decimal_places=2
    )
    current_amount = models.DecimalField(
        "montant actuel", max_digits=12, decimal_places=2, default=0
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "objectif"
        verbose_name_plural = "objectifs"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"], name="unique_goal_per_user"
            ),
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name} ({self.current_amount}/{self.target_amount} €)"
