
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import viewsets, permissions
from .models import User
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsSuperUserOnly

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# 🔹 Superuser-only User management (global, not scoped by business)
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related("business")
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperUserOnly]


