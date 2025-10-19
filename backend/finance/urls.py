from rest_framework.routers import DefaultRouter
from .views import ExpenseViewSet, IncomeViewSet, CategoryViewSet

router = DefaultRouter()
router.register(r"categories", CategoryViewSet, basename="categories")
router.register(r"expenses", ExpenseViewSet, basename="expenses")
router.register(r"incomes", IncomeViewSet, basename="incomes")

urlpatterns = router.urls
