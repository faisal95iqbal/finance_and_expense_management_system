from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404


from core.mixins import BusinessQuerysetMixin
from core.permissions import (
    IsSuperUserOnly,
    CanManageBusinessUsers,
    IsBusinessMember,
    IsOwner
)
from users.models import Business, User
from .serializers import BusinessSerializer, BusinessUserSerializer, BusinessCreateSerializer

FRONTEND_URL = getattr(settings, "FRONTEND_URL", "http://localhost:5173")

class BusinessViewSet(viewsets.ModelViewSet):
    queryset = Business.objects.all()
    serializer_class = BusinessSerializer
    
    def get_serializer_class(self):
        if self.action == "create":
            return BusinessCreateSerializer
        return BusinessSerializer

    def get_permissions(self):
        if self.action in ["create", "destroy", "reactivate"]:
            return [IsSuperUserOnly()]
        if self.action in ["update", "partial_update"]:
            # Only owner can edit business details
            return [IsOwner()]
        return [IsAuthenticated()]

    def perform_destroy(self, instance):
        # Soft delete: mark inactive + deactivate users
        instance.is_active = False
        instance.save()
        instance.users.update(is_active=False)

    @action(detail=True, methods=["post"], permission_classes=[IsSuperUserOnly])
    def reactivate(self, request, pk=None):
        business = self.get_object()
        business.is_active = True
        business.save()
        business.users.update(is_active=True)
        return Response({"status": "business reactivated"})


class BusinessUserViewSet(BusinessQuerysetMixin, viewsets.ModelViewSet):
    queryset = User.objects.all().select_related("business")
    serializer_class = BusinessUserSerializer
    permission_classes = [IsAuthenticated, CanManageBusinessUsers]

    def get_queryset(self):
        business_id = self.kwargs.get("business_pk")
        return User.objects.filter(business_id=business_id).select_related("business")

    def perform_create(self, serializer):
        creator = self.request.user
        role = serializer.validated_data.get("role")

        if creator.role == "manager" and role not in ("staff", "accountant"):
            raise PermissionDenied("Managers can only create staff or accountants.")

        business = get_object_or_404(Business, pk=self.kwargs["business_pk"])
        user = serializer.save(business=business, is_active=False)
        self.send_invitation(user)

    def send_invitation(self, user):
        """Send email invitation with 48h expiry."""
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        invite_link = f"{settings.FRONTEND_URL}/set-password/{uid}/{token}/"

        message = f"Hello,\n\nYou have been invited to join {user.business.name}. Click the link to set your password: {invite_link}\n\nThis link expires in 48 hours."
        send_mail(
            subject="You are invited",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
        )

    @action(detail=True, methods=["post"], permission_classes=[CanManageBusinessUsers])
    def resend_invite(self, request,business_pk = None, pk=None):
        user = self.get_object()
        if not user.is_active:
            self.send_invitation(user)
            return Response({"status": "invitation resent"})
        return Response({"error": "User already active"}, status=status.HTTP_400_BAD_REQUEST)
    
class SetPasswordAPIView(generics.GenericAPIView):
    """
    Accepts POST { uid, token, new_password }.
    Validates token, sets password, activates user and returns JWT tokens (access, refresh)
    along with user info (role, business_id, email).
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        uidb64 = request.data.get("uid")
        token = request.data.get("token")
        new_password = request.data.get("new_password")
        if not uidb64 or not token or not new_password:
            return Response(
                {"detail": "uid, token and new_password required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except Exception:
            return Response({"detail": "Invalid uid."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response(
                {"detail": "Invalid or expired token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Set new password & activate user
        user.set_password(new_password)
        user.is_active = True
        user.save()

        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "email": user.email,
                "role": user.role,
                "business_id": user.business_id,
            },
            status=status.HTTP_200_OK,
        )