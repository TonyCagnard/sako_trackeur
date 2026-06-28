"""Interface commune aux agrégateurs bancaires."""


class BankProvider:
    """Tout fournisseur (Bridge, GoCardless, mock) implémente ces méthodes.

    Les dates sont renvoyées au format ``YYYY-MM-DD`` (ou objet date).
    Les montants sont signés : négatif = dépense, positif = revenu.
    """

    name = ""

    def list_accounts(self, connection):
        """Liste de dicts : {external_id, name, iban_masked, balance, currency}."""
        raise NotImplementedError

    def list_transactions(self, connection, account, since=None):
        """Liste de dicts : {external_id, date, description, amount (signé)}."""
        raise NotImplementedError
