from django.contrib import admin

from .models import Goal


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "target_amount", "current_amount", "created_at")
    search_fields = ("name", "user__username")
    list_filter = ("created_at",)
