from django.apps import AppConfig


class ExpensesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "expenses"

    def ready(self):
        # Connecte les signaux (seed des catégories à l'inscription)
        from . import signals  # noqa: F401
