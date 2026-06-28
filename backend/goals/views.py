from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Goal
from .serializers import ContributionSerializer, GoalSerializer


class GoalViewSet(viewsets.ModelViewSet):
    """CRUD des objectifs d'épargne + action 'contribuer'."""

    serializer_class = GoalSerializer

    def get_queryset(self):
        return Goal.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def contribute(self, request, pk=None):
        """POST /api/goals/<id>/contribute/ {amount} — ajoute de l'épargne."""
        goal = self.get_object()
        serializer = ContributionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        goal.current_amount += serializer.validated_data["amount"]
        goal.save()
        return Response(
            GoalSerializer(goal, context={"request": request}).data
        )
