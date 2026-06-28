from django.urls import path

from .views import BreakdownView, InsightsView, NetWorthView, SummaryView

urlpatterns = [
    path("summary/", SummaryView.as_view(), name="summary"),
    path("insights/", InsightsView.as_view(), name="insights"),
    path("net-worth/", NetWorthView.as_view(), name="net-worth"),
    path("expense-breakdown/", BreakdownView.as_view(), name="expense-breakdown"),
]
