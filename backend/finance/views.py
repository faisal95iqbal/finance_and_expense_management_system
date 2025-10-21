from rest_framework import viewsets, filters, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Expense, Income, Category
from .serializers import ExpenseSerializer, IncomeSerializer, CategorySerializer
from core.mixins import TenantQuerysetMixin
from core.permissions import IsBusinessMember

class CategoryViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsBusinessMember]

    def perform_create(self, serializer):
        # ensure business is set automatically from user's business
        user = self.request.user
        if user.is_superuser:
            serializer.save()
        else:
            serializer.save(business=user.business)


class ExpenseViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsBusinessMember]
    parser_classes = [MultiPartParser, FormParser]  # support file upload
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["category", "date", "recurrent", "is_deleted"]
    search_fields = ["description"]
    ordering_fields = ["date", "amount", "created_at"]

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            serializer.save()
        else:
            serializer.save(business=user.business, created_by=user)
    def perform_update(self, serializer):
        user = self.request.user
        serializer.save(updated_by=user)
    def perform_destroy(self, instance):
        """
        Soft delete or remove expense with deleted_by tracking.
        """
        instance.deleted_by = self.request.user
        instance.save()
        instance.delete()


class IncomeViewSet(TenantQuerysetMixin, viewsets.ModelViewSet):
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    permission_classes = [IsBusinessMember]
    parser_classes = [MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ["category", "date", "is_deleted"]
    search_fields = ["description", "source"]
    ordering_fields = ["date", "amount", "created_at"]

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            serializer.save()
        else:
            serializer.save(business=user.business, created_by=user)
    def perform_update(self, serializer):
        user = self.request.user
        serializer.save(updated_by=user)
    def perform_destroy(self, instance):
        """
        Soft delete or remove income with deleted_by tracking.
        """
        instance.deleted_by = self.request.user
        instance.save()
        instance.delete()