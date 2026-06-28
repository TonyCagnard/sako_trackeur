from django.contrib import admin

from .models import Budget


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ("category", "user", "amount", "created_at")
    search_fields = ("category__name", "user__username")
    list_filter = ("created_at",)
