from django.urls import path, include
from rest_framework_nested import routers
from .views import BusinessViewSet, BusinessUserViewSet, SetPasswordAPIView

# main router
router = routers.SimpleRouter()
router.register(r"businesses", BusinessViewSet, basename="business")

# nested router: /businesses/{business_pk}/users/
business_router = routers.NestedSimpleRouter(router, r"businesses", lookup="business")
business_router.register(r"users", BusinessUserViewSet, basename="business-users")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(business_router.urls)),

    # set password (invite + password reset confirmation)
    path("auth/set-password/", SetPasswordAPIView.as_view(), name="set-password"),
]
