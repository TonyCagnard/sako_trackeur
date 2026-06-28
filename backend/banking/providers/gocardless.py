"""Fournisseur GoCardless (Nordigen Bank Account Data API).

Nécessite des identifiants (https://gocardless.com/bank-account-data/),
à renseigner dans .env :
    GOCARDLESS_SECRET_ID=...
    GOCARDLESS_SECRET_KEY=...

L'onboarding complet (création d'une requisition + redirection bancaire)
doit être fait côté frontend ; connection.external_id = id de la requisition.

Non testé en live ici — le chemin vérifié est le provider mock.
"""
import json
import urllib.error
import urllib.request

from django.conf import settings

from .base import BankProvider

BASE = "https://bankaccountdata.gocardless.com/api/v2"


def _request(method, url, payload=None, token=None):
    headers = {"Accept": "application/json", "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(BASE + url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())


class GoCardlessProvider(BankProvider):
    name = "gocardless"

    def _token(self):
        if not settings.GOCARDLESS_SECRET_ID or not settings.GOCARDLESS_SECRET_KEY:
            raise RuntimeError(
                "GoCardless non configuré : renseigner GOCARDLESS_SECRET_ID et "
                "GOCARDLESS_SECRET_KEY dans .env"
            )
        return _request(
            "POST",
            "/token/new/",
            {
                "secret_id": settings.GOCARDLESS_SECRET_ID,
                "secret_key": settings.GOCARDLESS_SECRET_KEY,
            },
        )["access"]

    def list_accounts(self, connection):
        token = self._token()
        requisition = _request("GET", f"/requisitions/{connection.external_id}/", token=token)
        accounts = []
        for account_id in requisition.get("accounts", []):
            details = _request("GET", f"/accounts/{account_id}/", token=token)
            accounts.append(
                {
                    "external_id": account_id,
                    "name": details.get("institution_id") or "Compte",
                    "iban_masked": details.get("iban") or "",
                    "balance": "0",
                    "currency": "EUR",
                }
            )
        return accounts

    def list_transactions(self, connection, account, since=None):
        token = self._token()
        data = _request("GET", f"/accounts/{account.external_id}/transactions/", token=token)
        out = []
        for tx in data.get("transactions", {}).get("booked", []):
            amount = tx.get("transactionAmount", {}).get("amount", "0")
            desc_parts = tx.get("remittanceInformationUnstructuredArray") or []
            description = " ".join(desc_parts) or tx.get("debtorName", "") or tx.get("creditorName", "")
            tx_id = tx.get("transactionId") or f"{tx.get('bookingDate')}-{description[:20]}"
            out.append(
                {
                    "external_id": tx_id,
                    "date": tx.get("bookingDate"),
                    "description": description,
                    "amount": amount,
                }
            )
        return out
