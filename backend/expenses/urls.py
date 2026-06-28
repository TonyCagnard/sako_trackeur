from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ExpenseViewSet

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("expenses", ExpenseViewSet, basename="expense")

urlpatterns = [
    path("", include(router.urls)),
]
