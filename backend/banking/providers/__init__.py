"""Fabrique de fournisseurs bancaires (Partie 17).

Pour activer un vrai agrégateur : renseigner les identifiants dans .env
puis connecter avec provider="gocardless" ou "bridge".
"""
from .mock import MockBankProvider


def get_provider(name):
    name = name or "mock"
    if name == "mock":
        return MockBankProvider()
    if name == "gocardless":
        from .gocardless import GoCardlessProvider

        return GoCardlessProvider()
    if name == "bridge":
        from .bridge import BridgeProvider

        return BridgeProvider()
    raise ValueError(f"Fournisseur bancaire inconnu : {name}")
