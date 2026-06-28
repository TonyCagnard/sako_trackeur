import django_filters

from .models import Expense


class ExpenseFilter(django_filters.FilterSet):
    """Filtres : ?category=<id>&year=2026&month=6"""

    category = django_filters.NumberFilter(field_name="category_id")
    year = django_filters.NumberFilter(field_name="date__year")
    month = django_filters.NumberFilter(field_name="date__month")

    class Meta:
        model = Expense
        fields = ["category", "year", "month"]
