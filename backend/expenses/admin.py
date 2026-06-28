from django.contrib import admin

from .models import Category, Expense


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "kind", "color", "created_at")
    list_filter = ("kind",)
    search_fields = ("name", "user__username")
    ordering = ("name",)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("amount", "category", "user", "date", "description")
    list_filter = ("date", "category__kind")
    search_fields = ("description", "category__name", "user__username")
    date_hierarchy = "date"
    ordering = ("-date",)
