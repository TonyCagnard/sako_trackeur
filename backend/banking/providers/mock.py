"""Fournisseur sandbox (mock) — fonctionne sans identifiants.

Renvoie des comptes et transactions de démonstration dont les libellés
couvrent les règles de catégorisation automatique.
"""
from datetime import date, timedelta

from .base import BankProvider

_MOCK_ACCOUNTS = [
    {
        "external_id": "mock-compte-courant",
        "name": "Compte courant",
        "iban_masked": "FR76 •••• •••• •••• 1234",
        "balance": "2450.75",
        "currency": "EUR",
    }
]


def _mock_transactions():
    today = date.today()
    yesterday = today - timedelta(days=1)
    return [
        {"external_id": "m1", "date": today, "description": "CARREFOUR MARKET", "amount": "-67.40"},
        {"external_id": "m2", "date": today, "description": "MCDONALD'S PARIS", "amount": "-12.50"},
        {"external_id": "m3", "date": today, "description": "TOTALENERGIES STATION", "amount": "-58.10"},
        {"external_id": "m4", "date": today, "description": "NETFLIX.COM", "amount": "-13.49"},
        {"external_id": "m5", "date": today, "description": "AMAZON.FR", "amount": "-34.99"},
        {"external_id": "m6", "date": yesterday, "description": "VIREMENT SALAIRE ENTREPRISE", "amount": "2500.00"},
        {"external_id": "m7", "date": yesterday, "description": "SPOTIFY AB", "amount": "-10.99"},
    ]


class MockBankProvider(BankProvider):
    name = "mock"

    def list_accounts(self, connection):
        return [dict(a) for a in _MOCK_ACCOUNTS]

    def list_transactions(self, connection, account, since=None):
        # Toujours les mêmes transactions : la déduplication (BankTransaction.external_id)
        # garantit qu'une re-synchro n'importe rien de nouveau.
        return _mock_transactions()
