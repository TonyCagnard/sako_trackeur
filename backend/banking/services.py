"""Synchronisation des transactions bancaires (Partie 18).

Idempotent : une même transaction (external_id) n'est jamais importée deux fois.
À planifier toutes les heures (voir commande `sync_bank`).
"""
from decimal import Decimal, InvalidOperation

from django.utils import timezone

from expenses.models import Expense

from .categorizer import categorize
from .models import BankAccount, BankTransaction
from .providers import get_provider


def _to_decimal(value):
    try:
        return Decimal(str(value))
    except (InvalidOperation, ValueError, TypeError):
        return Decimal("0")


def sync_connection(connection):
    """Importe les nouvelles transactions d'une connexion. Retourne le nb importé."""
    provider = get_provider(connection.provider)
    user = connection.user
    imported = 0

    for account_data in provider.list_accounts(connection):
        account, _ = BankAccount.objects.update_or_create(
            connection=connection,
            external_id=account_data.get("external_id", ""),
            defaults={
                "name": account_data.get("name", "Compte"),
                "iban_masked": account_data.get("iban_masked", ""),
                "balance": _to_decimal(account_data.get("balance", 0)),
                "currency": account_data.get("currency", "EUR"),
            },
        )
        for tx in provider.list_transactions(connection, account):
            external_id = tx.get("external_id")
            if not external_id:
                continue
            # Idempotence : déjà importé ?
            if BankTransaction.objects.filter(
                connection=connection, external_id=external_id
            ).exists():
                continue

            amount = _to_decimal(tx.get("amount", 0))
            if amount == 0:
                continue  # on ignore les transactions nulles

            description = (tx.get("description") or "")[:200]
            category = categorize(user, description, is_income=amount > 0)
            if category is None:
                continue  # aucune catégorie exploitable

            expense = Expense.objects.create(
                user=user,
                category=category,
                amount=abs(amount),
                date=tx.get("date"),
                description=description,
            )
            BankTransaction.objects.create(
                connection=connection,
                external_id=external_id,
                expense=expense,
                date=tx.get("date"),
                description=description,
                amount=amount,
            )
            imported += 1

    connection.last_synced_at = timezone.now()
    connection.save()
    return imported
