from django.urls import path

from .views import InsightsView, SummaryView

urlpatterns = [
    path("summary/", SummaryView.as_view(), name="summary"),
    path("insights/", InsightsView.as_view(), name="insights"),
]
