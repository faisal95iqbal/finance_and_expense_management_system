# finance/views.py
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from core.mixins import BusinessQuerysetMixin
from core.permissions import FinancePermission
from .models import Expense, Income
from .serializers import ExpenseSerializer, IncomeSerializer

class ExpenseViewSet(BusinessQuerysetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all().select_related("business")
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, FinancePermission]

class IncomeViewSet(BusinessQuerysetMixin, viewsets.ModelViewSet):
    queryset = Income.objects.all().select_related("business")
    serializer_class = IncomeSerializer
    permission_classes = [IsAuthenticated, FinancePermission]

