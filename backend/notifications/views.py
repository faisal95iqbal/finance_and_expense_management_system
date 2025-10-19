# notifications/views.py
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from django.shortcuts import get_object_or_404
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework.exceptions import PermissionDenied
from core.presence import get_online_users

from .models import Notification, Activity, ChatMessage
from .serializers import NotificationSerializer, ActivitySerializer, ChatMessageSerializer

from users.models import Business,User  # uses your existing Business model
from core.permissions import IsBusinessMember  # use your existing permission

channel_layer = get_channel_layer()

class SmallPagePagination(PageNumberPagination):
    page_size = 10

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    List notifications for the logged-in user (recipient or broadcast to their business).
    """
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    pagination_class = PageNumberPagination

    def get_queryset(self):
        user = self.request.user
        # recipient-specific OR broadcasts for user's business
        qs = Notification.objects.filter(
            Q(recipient=user) | Q(recipient__isnull=True, business=user.business)
        ).order_by("-created_at")
        return qs

    @action(detail=False, methods=["get"])
    def unread_count(self, request):
        user = request.user
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"unread": count})

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        note = self.get_object()
        if note.recipient and note.recipient != request.user:
            raise PermissionDenied()
        note.is_read = True
        note.save()
        return Response({"status": "ok"})

    @action(detail=False, methods=["post"])
    def mark_all_read(self, request):
        qs = self.get_queryset().filter(is_read=False)
        qs.update(is_read=True)
        return Response({"status": "ok"})


class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated, IsBusinessMember]
    serializer_class = ActivitySerializer
    pagination_class = SmallPagePagination

    def get_queryset(self):
        user = self.request.user
        # business-scoped activity feed
        return Activity.objects.filter(business=user.business).order_by("-timestamp")


class ChatMessageViewSet(mixins.ListModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    Business-scoped chat message list/create.
    URL pattern expects business_id in kwargs (see businesses.urls).
    """
    serializer_class = ChatMessageSerializer
    permission_classes = [IsAuthenticated, IsBusinessMember]
    pagination_class = PageNumberPagination  # we'll use page_size=15 in settings or pass ?page_size

    def get_queryset(self):
        business_id = self.kwargs.get("business_id")
        return ChatMessage.objects.filter(business_id=business_id).order_by("-created_at")

    def perform_create(self, serializer):
        business_id = self.kwargs.get("business_id")
        business = get_object_or_404(Business, pk=business_id)

        # Check creator is member of the business (IsBusinessMember permission already ensures)
        if not self.request.user.is_superuser and self.request.user.business_id != business.id:
            raise PermissionDenied("Not allowed to post to this business chat")

        message = serializer.save(business=business, sender=self.request.user)

        # Broadcast to websocket group
        payload = ChatMessageSerializer(message).data
        async_to_sync(channel_layer.group_send)(
            f"business_{business_id}_chat",
            {
                "type": "chat.message",  # handled by consumer
                "message": payload,
            },
        )
    @action(detail=False, methods=["get"])
    def online_users(self, request):
        business = request.user.business
        user_ids = list(business.users.values_list("id", flat=True))
        online_ids = get_online_users(business.id, user_ids)
        users = User.objects.filter(id__in=online_ids)
        return Response([{"id": u.id, "email": u.email} for u in users])
