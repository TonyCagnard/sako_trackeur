from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Utilisateur Sako Trackeur : authentification + profil réunis."""

    # email rendu unique : un compte = une adresse e-mail
    email = models.EmailField("e-mail", unique=True)
    phone = models.CharField("téléphone", max_length=20, blank=True, default="")
    currency = models.CharField("devise préférée", max_length=3, default="EUR")
    updated_at = models.DateTimeField("mis à jour le", auto_now=True)

    class Meta:
        ordering = ["-date_joined"]
        verbose_name = "utilisateur"
        verbose_name_plural = "utilisateurs"

    def __str__(self):
        return self.username
