"""Fournisseur Bridge (https://docs.bridgeapi.io/).

Nécessite des identifiants dans .env :
    BRIDGE_CLIENT_ID=...
    BRIDGE_CLIENT_SECRET=...

L'onboarding (création d'un utilisateur Bridge + connect item via redirection)
doit être fait au préalable ; connection.external_id = id de l'item.

Non testé en live ici — le chemin vérifié est le provider mock.
"""
import json
import urllib.request

from django.conf import settings

from .base import BankProvider

BASE = "https://api.bridgeapi.io/v3"


def _request(method, url, payload=None, token=None):
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Bridge-Version": "2021-06-01",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


class BridgeProvider(BankProvider):
    name = "bridge"

    def _token(self):
        if not settings.BRIDGE_CLIENT_ID or not settings.BRIDGE_CLIENT_SECRET:
            raise RuntimeError(
                "Bridge non configuré : renseigner BRIDGE_CLIENT_ID et "
                "BRIDGE_CLIENT_SECRET dans .env"
            )
        # L'authentification Bridge nécessite un user ; à adapter à votre onboarding.
        return _request(
            "POST",
            "/authenticate",
            {
                "client_id": settings.BRIDGE_CLIENT_ID,
                "client_secret": settings.BRIDGE_CLIENT_SECRET,
            },
        )["access_token"]

    def list_accounts(self, connection):
        token = self._token()
        data = _request("GET", f"/items/{connection.external_id}/accounts", token=token)
        accounts = []
        for acc in data.get("resources", []):
            balances = acc.get("balances", [])
            balance = balances[0].get("amount") if balances else "0"
            accounts.append(
                {
                    "external_id": str(acc.get("id", "")),
                    "name": acc.get("name") or "Compte",
                    "iban_masked": acc.get("iban") or "",
                    "balance": str(balance),
                    "currency": acc.get("currency_code") or "EUR",
                }
            )
        return accounts

    def list_transactions(self, connection, account, since=None):
        token = self._token()
        url = f"/accounts/{account.external_id}/transactions"
        if since:
            url += f"?updated_at_min={since.isoformat()}"
        data = _request("GET", url, token=token)
        out = []
        for tx in data.get("resources", []):
            amount = tx.get("amount", "0")
            cleaned_amount = tx.get("clean_description") or tx.get("raw_description", "")
            out.append(
                {
                    "external_id": str(tx.get("id", "")),
                    "date": tx.get("booking_date"),
                    "description": cleaned_amount,
                    "amount": str(amount),
                }
            )
        return out
