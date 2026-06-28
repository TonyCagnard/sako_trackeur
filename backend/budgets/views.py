from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import viewsets

from .models import Budget
from .serializers import BudgetSerializer


class BudgetViewSet(viewsets.ModelViewSet):
    """CRUD des budgets + calcul du 'dépensé ce mois-ci' par annotation."""

    serializer_class = BudgetSerializer

    def get_queryset(self):
        today = timezone.now().date()
        month_q = Q(
            category__expenses__date__year=today.year,
            category__expenses__date__month=today.month,
        )
        return (
            Budget.objects.filter(user=self.request.user)
            .annotate(spent=Sum("category__expenses__amount", filter=month_q))
            .select_related("category")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
