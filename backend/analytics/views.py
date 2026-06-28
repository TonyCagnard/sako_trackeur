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


class InsightsView(APIView):
    """GET /api/analytics/insights/ — intelligence : prédiction, abonnements, anomalies, conseils."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .insights import (
            detect_subscriptions,
            detect_unusual,
            predict_month_end,
            propose_savings,
        )

        return Response(
            {
                "prediction": predict_month_end(request.user),
                "subscriptions": detect_subscriptions(request.user),
                "unusual": detect_unusual(request.user),
                "savings_tips": propose_savings(request.user),
            }
        )


class NetWorthView(APIView):
    """GET /api/analytics/net-worth/?months=12 — série du patrimoine net par mois."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .insights import net_worth_series

        try:
            months = int(request.query_params.get("months", 12))
        except ValueError:
            months = 12
        months = min(max(months, 2), 36)
        series = net_worth_series(request.user, months)
        return Response(
            {"series": series, "current": series[-1]["value"] if series else 0}
        )


class BreakdownView(APIView):
    """GET /api/analytics/expense-breakdown/ — dépenses par catégorie (mois courant)."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .insights import expense_breakdown

        return Response(expense_breakdown(request.user))
