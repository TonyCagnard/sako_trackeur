from rest_framework import serializers

from expenses.models import Category

from .models import Budget


class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_color = serializers.CharField(source="category.color", read_only=True)
    spent = serializers.SerializerMethodField()
    remaining = serializers.SerializerMethodField()
    percentage = serializers.SerializerMethodField()
    is_over = serializers.SerializerMethodField()

    class Meta:
        model = Budget
        fields = (
            "id",
            "category",
            "category_name",
            "category_color",
            "amount",
            "spent",
            "remaining",
            "percentage",
            "is_over",
            "created_at",
        )
        read_only_fields = (
            "id",
            "created_at",
            "category_name",
            "category_color",
            "spent",
            "remaining",
            "percentage",
            "is_over",
        )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Une catégorie de budget doit appartenir à l'utilisateur et être une dépense
        request = self.context.get("request")
        if request and getattr(request, "user", None) and request.user.is_authenticated:
            self.fields["category"].queryset = Category.objects.filter(
                user=request.user, kind="expense"
            )

    def _spent(self, obj):
        # `spent` vient de l'annotation du ViewSet ; 0 si absent (ex: création)
        return getattr(obj, "spent", None) or 0

    def get_spent(self, obj):
        return self._spent(obj)

    def get_remaining(self, obj):
        return obj.amount - self._spent(obj)

    def get_percentage(self, obj):
        if not obj.amount or obj.amount <= 0:
            return 0
        return round(self._spent(obj) / obj.amount * 100, 1)

    def get_is_over(self, obj):
        return self._spent(obj) > obj.amount

    def validate_category(self, value):
        user = self.context["request"].user
        qs = Budget.objects.filter(user=user, category=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                "Tu as déjà un budget pour cette catégorie."
            )
        return value

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Le budget doit être positif.")
        return value
