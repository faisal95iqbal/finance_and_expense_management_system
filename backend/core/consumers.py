# core/consumers.py
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from core.presence import mark_user_online, mark_user_offline
from asgiref.sync import sync_to_async

class AuthConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_authenticated:
            # mark presence for user's business
            await sync_to_async(mark_user_online)(user.id, getattr(user, "business_id", None))
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, code):
        user = self.scope["user"]
        if user.is_authenticated:
            await sync_to_async(mark_user_offline)(user.id, getattr(user, "business_id", None))
