from django.contrib import admin

from .models import BankAccount, BankConnection, BankTransaction


@admin.register(BankConnection)
class BankConnectionAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "status", "last_synced_at", "created_at")
    list_filter = ("provider", "status")


@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ("name", "connection", "balance", "currency")
    search_fields = ("name", "iban_masked")


@admin.register(BankTransaction)
class BankTransactionAdmin(admin.ModelAdmin):
    list_display = ("description", "amount", "date", "connection", "expense")
    list_filter = ("date",)
    search_fields = ("description",)
