from datetime import timedelta

from django.db.models import Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from expenses.models import Expense


def _sum(queryset):
    """Somme des montants d'un queryset (0 si vide)."""
    return queryset.aggregate(total=Sum("amount"))["total"] or 0


class SummaryView(APIView):
    """GET /api/analytics/summary/ — agrégats des dépenses de l'utilisateur."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())  # lundi

        expenses = Expense.objects.filter(user=user, category__kind="expense")
        incomes = Expense.objects.filter(user=user, category__kind="income")

        month_expenses = _sum(
            expenses.filter(date__year=today.year, date__month=today.month)
        )
        month_income = _sum(
            incomes.filter(date__year=today.year, date__month=today.month)
        )
        total_expenses = _sum(expenses)
        total_income = _sum(incomes)

        return Response(
            {
                "today": _sum(expenses.filter(date=today)),
                "week": _sum(expenses.filter(date__gte=start_of_week)),
                "month": month_expenses,
                "total": total_expenses,
                "income_month": month_income,
                "balance": month_income - month_expenses,
                "income_total": total_income,
                "savings_total": total_income - total_expenses,
            }
        )
