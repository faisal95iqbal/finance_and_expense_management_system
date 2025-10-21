# notifications/consumers.py
import json
from urllib.parse import parse_qs
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from asgiref.sync import sync_to_async
from .models import Notification, Activity, ChatMessage
from .serializers import NotificationSerializer, ActivitySerializer, ChatMessageSerializer
from django.utils import timezone
from asgiref.sync import sync_to_async
from core.presence import mark_user_online, mark_user_offline

User = get_user_model()

# Helper to resolve token -> user
@database_sync_to_async
def get_user_from_token(token):
    try:
        validated = AccessToken(token)
        uid = validated["user_id"]
        return User.objects.get(pk=uid)
    except Exception:
        return None


class NotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    Per-user notification websocket. Clients connect to: /ws/notifications/?token=<access>
    They will be added to the group of their business so they'll receive business broadcasts.
    """
    async def connect(self):
        qs = parse_qs(self.scope["query_string"].decode())
        token = qs.get("token", [None])[0]
        user = await get_user_from_token(token)
        if not user:
            await self.close()
            return

        self.user = user
        self.business_id = getattr(user, "business_id", None)
        # group per-user & per-business
        await self.channel_layer.group_add(f"user_{self.user.id}_notifications", self.channel_name)
        if self.business_id:
            await self.channel_layer.group_add(f"business_{self.business_id}_notifications", self.channel_name)
            await self.accept()
        else:
            # no business: accept anyway (superuser maybe)
            await self.accept()

    async def disconnect(self, code):
        if hasattr(self, "user"):
            await self.channel_layer.group_discard(f"user_{self.user.id}_notifications", self.channel_name)
            if self.business_id:
                await self.channel_layer.group_discard(f"business_{self.business_id}_notifications", self.channel_name)

    # incoming: client doesn't usually send notifications here – server pushes them
    async def receive_json(self, content, **kwargs):
        # support client marking notification read via WS if desired
        action = content.get("action")
        if action == "mark_read":
            nid = content.get("id")
            from django.contrib.auth import get_user_model
            try:
                n = await database_sync_to_async(Notification.objects.get)(pk=nid)
                if n.recipient_id and n.recipient_id != self.user.id:
                    return
                n.is_read = True
                await database_sync_to_async(n.save)()
                await self.send_json({"type": "notification_marked_read", "id": nid})
            except Notification.DoesNotExist:
                pass

    # handlers for group sends
    async def notification_broadcast(self, event):
        # event should have 'notification' dict
        await self.send_json({"type": "notification", "notification": event.get("notification")})

    async def notification_new(self, event):
        await self.send_json({"type": "notification", "notification": event.get("notification")})


class ActivityConsumer(AsyncJsonWebsocketConsumer):
    """
    Business-scoped live activity feed.
    Connect to: /ws/business/<business_id>/activity/?token=...
    """
    async def connect(self):
        qs = parse_qs(self.scope["query_string"].decode())
        token = qs.get("token", [None])[0]
        self.user = await get_user_from_token(token)
        if not self.user:
            await self.close()
            return

        self.business_id = self.scope["url_route"]["kwargs"].get("business_id")
        if not self.business_id or (not self.user.is_superuser and self.user.business_id != int(self.business_id)):
            await self.close()
            return

        self.group_name = f"business_{self.business_id}_activity"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        # no client sends — feed is server-pushed
        pass

    async def activity_new(self, event):
        await self.send_json({"type": "activity", "activity": event.get("activity")})


class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    Business chat consumer.
    Connect to: /ws/business/<business_id>/chat/?token=<access>
    Client can send {"type":"message","content":"hello"} to post.
    Server will broadcast {"type":"chat_message", "message":{...}} to group.
    """
    async def connect(self):
        qs = parse_qs(self.scope["query_string"].decode())
        token = qs.get("token", [None])[0]
        self.user = await get_user_from_token(token)
        if not self.user:
            await self.close()
            return

        self.business_id = self.scope["url_route"]["kwargs"].get("business_id")
        if not self.business_id or (not self.user.is_superuser and self.user.business_id != int(self.business_id)):
            await self.close()
            return

        self.group_name = f"business_{self.business_id}_chat"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await sync_to_async(mark_user_online)(self.user.id, int(self.business_id))

        # mark user present (presence keys can be set here; optional)
        await self.accept()

    async def disconnect(self, code):
        await sync_to_async(mark_user_offline)(self.user.id, int(self.business_id))
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        """
        Accept: {"type": "message", "content": "..."}
        """
        msg_type = content.get("type")
        if msg_type != "message":
            return

        text = content.get("content", "").strip()
        if not text:
            return

        # persist message
        msg = await database_sync_to_async(ChatMessage.objects.create)(
            business_id=self.business_id, sender=self.user, content=text
        )
        serialized = ChatMessageSerializer(msg).data

        # broadcast to group
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message": serialized,
            },
        )

    # group -> socket handlers
    async def chat_message(self, event):
        await self.send_json({"type": "chat_message", "message": event.get("message")})
