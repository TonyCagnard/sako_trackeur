from django.conf import settings
from django.db import models


class BankConnection(models.Model):
    """Lien entre un utilisateur et un agrégateur bancaire (Bridge / GoCardless / mock)."""

    PROVIDERS = (
        ("mock", "Sandbox (mock)"),
        ("gocardless", "GoCardless (Nordigen)"),
        ("bridge", "Bridge"),
    )
    STATUSES = (
        ("active", "Active"),
        ("disconnected", "Déconnectée"),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="bank_connections",
        verbose_name="utilisateur",
    )
    provider = models.CharField(
        "fournisseur", max_length=20, choices=PROVIDERS, default="mock"
    )
    external_id = models.CharField("id fournisseur", max_length=128, blank=True, default="")
    status = models.CharField("statut", max_length=20, choices=STATUSES, default="active")
    last_synced_at = models.DateTimeField("dernière synchro", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "connexion bancaire"
        verbose_name_plural = "connexions bancaires"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.provider} — {self.user}"


class BankAccount(models.Model):
    connection = models.ForeignKey(
        BankConnection, on_delete=models.CASCADE, related_name="accounts"
    )
    external_id = models.CharField(max_length=128)
    name = models.CharField("nom", max_length=128)
    iban_masked = models.CharField("IBAN masqué", max_length=64, blank=True, default="")
    balance = models.DecimalField("solde", max_digits=14, decimal_places=2, default=0)
    currency = models.CharField("devise", max_length=3, default="EUR")

    class Meta:
        verbose_name = "compte bancaire"
        verbose_name_plural = "comptes bancaires"
        constraints = [
            models.UniqueConstraint(
                fields=["connection", "external_id"], name="unique_account_per_connection"
            ),
        ]
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.balance} {self.currency})"


class BankTransaction(models.Model):
    """Transaction importée depuis la banque (dédupliquée par external_id)."""

    connection = models.ForeignKey(
        BankConnection, on_delete=models.CASCADE, related_name="transactions"
    )
    expense = models.OneToOneField(
        "expenses.Expense",
        on_delete=models.CASCADE,
        related_name="bank_transaction",
        null=True,
        blank=True,
    )
    external_id = models.CharField(max_length=128)
    date = models.DateField("date")
    description = models.CharField("libellé", max_length=200)
    amount = models.DecimalField(
        "montant signé", max_digits=12, decimal_places=2
    )  # négatif = dépense, positif = revenu
    imported_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "transaction bancaire"
        verbose_name_plural = "transactions bancaires"
        constraints = [
            models.UniqueConstraint(
                fields=["connection", "external_id"], name="unique_banktx_per_connection"
            ),
        ]
        ordering = ["-date"]

    def __str__(self):
        return f"{self.amount} — {self.description[:30]} ({self.date})"
