from decimal import Decimal

from rest_framework import serializers

from .models import Goal


class GoalSerializer(serializers.ModelSerializer):
    progression = serializers.SerializerMethodField()
    is_reached = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()

    class Meta:
        model = Goal
        fields = (
            "id",
            "name",
            "target_amount",
            "current_amount",
            "progression",
            "is_reached",
            "remaining",
            "created_at",
        )
        read_only_fields = (
            "id",
            "progression",
            "is_reached",
            "remaining",
            "created_at",
        )

    def get_progression(self, obj):
        if not obj.target_amount or obj.target_amount <= 0:
            return 0
        return round(obj.current_amount / obj.target_amount * 100, 1)

    def get_is_reached(self, obj):
        return obj.current_amount >= obj.target_amount

    def get_remaining(self, obj):
        return obj.target_amount - obj.current_amount

    def validate_name(self, value):
        user = self.context["request"].user
        qs = Goal.objects.filter(user=user, name__iexact=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Tu as déjà un objectif avec ce nom."
            )
        return value

    def validate_target_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le montant cible doit être positif.")
        return value

    def validate_current_amount(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Le montant actuel ne peut pas être négatif."
            )
        return value


class ContributionSerializer(serializers.Serializer):
    """Montant à ajouter à un objectif (action 'contribute')."""

    amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, min_value=Decimal("0.01")
    )
