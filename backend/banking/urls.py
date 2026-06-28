from django.urls import path

from .views import BankListView, ConnectView, ConnectionDetailView, SyncView

urlpatterns = [
    path("", BankListView.as_view(), name="bank-list"),
    path("connect/", ConnectView.as_view(), name="bank-connect"),
    path("sync/", SyncView.as_view(), name="bank-sync"),
    path("<int:pk>/", ConnectionDetailView.as_view(), name="bank-connection-detail"),
]
