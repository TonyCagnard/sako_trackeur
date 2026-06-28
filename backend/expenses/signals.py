from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .defaults import seed_default_categories


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_categories(sender, instance, created, **kwargs):
    """Seed automatique des catégories par défaut à la création d'un utilisateur."""
    if created:
        seed_default_categories(instance)
