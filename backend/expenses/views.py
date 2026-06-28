from django.db.models import ProtectedError
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError

from .models import Category, Expense
from .serializers import CategorySerializer, ExpenseSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    """CRUD des catégories de l'utilisateur connecté (isolation par user)."""

    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            raise ValidationError(
                "Cette catégorie est utilisée par des dépenses et ne peut pas "
                "être supprimée."
            )


class ExpenseViewSet(viewsets.ModelViewSet):
    """CRUD des dépenses de l'utilisateur connecté (isolation par user)."""

    serializer_class = ExpenseSerializer

    def get_queryset(self):
        return (
            Expense.objects.filter(user=self.request.user)
            .select_related("category")
            .order_by("-date", "-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
