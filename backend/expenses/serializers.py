from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .models import Category, Expense


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "kind", "color", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_name(self, value):
        user = self.context["request"].user
        qs = Category.objects.filter(user=user, name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Vous avez déjà une catégorie avec ce nom."
            )
        return value


class ExpenseSerializer(serializers.ModelSerializer):
    # Infos de la catégorie, dénormalisées pour l'affichage (lecture seule)
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    kind = serializers.CharField(source="category.kind", read_only=True)

    class Meta:
        model = Expense
        fields = (
            "id",
            "category",
            "category_name",
            "category_color",
            "kind",
            "amount",
            "date",
            "description",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "category_name",
            "category_color",
            "kind",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # La catégorie doit appartenir à l'utilisateur connecté
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            self.fields["category"].queryset = Category.objects.filter(
                user=request.user
            )

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "Le montant doit être strictement positif."
            )
        return value

    def validate_date(self, value):
        horizon = timezone.now().date() + timedelta(days=365)
        if value > horizon:
            raise serializers.ValidationError(
                "La date ne peut pas être plus d'un an dans le futur."
            )
        return value
