from rest_framework import serializers

from .models import Category


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
