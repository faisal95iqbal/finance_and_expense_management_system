# finance/urls.py
from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, IncomeViewSet

router = DefaultRouter()
router.register("expenses", ExpenseViewSet, basename="expense")
router.register("incomes", IncomeViewSet, basename="income")

urlpatterns = router.urls
