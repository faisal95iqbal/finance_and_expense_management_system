# core/consumers.py (base consumer mixin)
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from core.presence import mark_user_online, mark_user_offline

class AuthConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope["user"]
        if user.is_authenticated:
            mark_user_online(user.id)
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, code):
        user = self.scope["user"]
        if user.is_authenticated:
            mark_user_offline(user.id)
