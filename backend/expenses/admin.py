from django.contrib import admin

from .models import Category


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "kind", "color", "created_at")
    list_filter = ("kind",)
    search_fields = ("name", "user__username")
    ordering = ("name",)
