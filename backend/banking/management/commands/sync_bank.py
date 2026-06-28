"""Synchronise les transactions de toutes les connexions bancaires actives.

À planifier toutes les heures, par exemple (Linux/cron) :
    0 * * * * cd /chemin/backend && .venv/bin/python manage.py sync_bank

Sous Windows : Planificateur de tâches -> exécuter toutes les heures :
    E:\\sako_trackeur\\backend\\.venv\\Scripts\\python.exe E:\\sako_trackeur\\backend\\manage.py sync_bank
"""
from django.core.management.base import BaseCommand

from banking.models import BankConnection
from banking.services import sync_connection


class Command(BaseCommand):
    help = "Synchronise les transactions bancaires de toutes les connexions actives."

    def handle(self, *args, **options):
        connections = BankConnection.objects.filter(status="active").select_related("user")
        if not connections.exists():
            self.stdout.write("Aucune connexion bancaire active.")
            return

        total = 0
        for connection in connections:
            try:
                count = sync_connection(connection)
            except Exception as exc:
                self.stderr.write(f"  Échec {connection} : {exc}")
                continue
            total += count
            self.stdout.write(
                f"  {connection.user.username} ({connection.provider}) : +{count} transaction(s)"
            )
        self.stdout.write(
            self.style.SUCCESS(f"Synchro terminée : +{total} transaction(s).")
        )
