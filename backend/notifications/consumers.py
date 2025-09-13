import jwt
from django.conf import settings
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

User = get_user_model()

class NotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        # token via query string ?token=<access_token>
        query = self.scope.get("query_string", b"").decode()
        token = None
        if "token=" in query:
            token = query.split("token=")[1].split("&")[0]
        if not token:
            await self.close()
            return
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = payload.get("user_id")
            user = await database_sync_to_async(User.objects.get)(id=user_id)
            self.user = user
        except Exception:
            await self.close()
            return

        self.group_name = f"business_{self.user.business_id}_user_{self.user.id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def notify(self, event):
        # event contains 'payload'
        await self.send_json(event.get("payload", {}))
