"""Configuration d'URL racine de l'API Sako Trackeur."""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import path


def health(request):
    """Sonde de vie/prêt : utilisée par le frontend et les futurs déploiements."""
    return JsonResponse({"status": "ok", "service": "sako-trackeur-api"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="api-health"),
]
