from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BankConnection
from .services import sync_connection


def _serialize_connection(connection):
    return {
        "id": connection.id,
        "provider": connection.provider,
        "status": connection.status,
        "last_synced_at": (
            connection.last_synced_at.isoformat() if connection.last_synced_at else None
        ),
        "accounts": [
            {
                "name": a.name,
                "iban_masked": a.iban_masked,
                "balance": str(a.balance),
                "currency": a.currency,
            }
            for a in connection.accounts.all()
        ],
        "imported_count": connection.transactions.count(),
    }


class BankListView(APIView):
    """GET /api/banking/ — liste les connexions bancaires de l'utilisateur."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        connections = BankConnection.objects.filter(user=request.user)
        return Response({"connections": [_serialize_connection(c) for c in connections]})


class ConnectView(APIView):
    """POST /api/banking/connect/ — connecte une banque et synchronise une 1re fois."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        provider = request.data.get("provider", "mock")
        connection = BankConnection.objects.create(user=request.user, provider=provider)
        try:
            imported = sync_connection(connection)
        except Exception as exc:  # provider réel mal configuré, etc.
            connection.status = "disconnected"
            connection.save()
            return Response({"detail": str(exc)}, status=400)
        return Response(
            {"connection": _serialize_connection(connection), "imported": imported},
            status=201,
        )


class SyncView(APIView):
    """POST /api/banking/sync/ — synchronise toutes les connexions actives."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        total = 0
        for connection in BankConnection.objects.filter(
            user=request.user, status="active"
        ):
            try:
                total += sync_connection(connection)
            except Exception:
                # on continue sur les autres connexions
                continue
        return Response({"imported": total})
