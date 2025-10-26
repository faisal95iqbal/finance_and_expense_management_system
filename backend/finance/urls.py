from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, IncomeViewSet, CategoryViewSet
from .dashboard_api import FinanceDashboardAPIView, FinanceExportCSVView, FinanceExportPDFView
from django.urls import path

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="categories")
router.register(r"expenses", ExpenseViewSet, basename="expenses")
router.register(r"incomes", IncomeViewSet, basename="incomes")

urlpatterns = router.urls

urlpatterns += [
    path("dashboard/", FinanceDashboardAPIView.as_view(), name="finance-dashboard"),
    path("analytics/export/csv/", FinanceExportCSVView.as_view(), name="finance-export-csv"),
    path("analytics/export/pdf/", FinanceExportPDFView.as_view(), name="finance-export-pdf"),
]

