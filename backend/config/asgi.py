# config/asgi.py
import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()


from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from notifications import routing as notifications_routing
from django.urls import path



# Custom JWT middleware to authenticate websocket connections using access token in querystring.
from channels.middleware import BaseMiddleware
from urllib.parse import parse_qs
from rest_framework_simplejwt.tokens import AccessToken
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async

User = get_user_model()

@database_sync_to_async
def get_user_by_token(token):
    try:
        validated = AccessToken(token)
        uid = validated["user_id"]
        return User.objects.get(pk=uid)
    except Exception:
        return None

class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # parse token
        query_string = scope.get("query_string", b"").decode()
        qs = parse_qs(query_string)
        token = None
        if "token" in qs:
            token = qs["token"][0]
        else:
            # try headers
            headers = dict((k.decode(), v.decode()) for k, v in scope.get("headers", []))
            auth = headers.get("authorization") or headers.get("Authorization")
            if auth and auth.startswith("Bearer "):
                token = auth.split(" ", 1)[1]

        if token:
            user = await get_user_by_token(token)
            if user:
                scope["user"] = user

        return await super().__call__(scope, receive, send)


django_asgi_app = get_asgi_application()

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(
            URLRouter(
                notifications_routing.websocket_urlpatterns
            )
        ),
    }
)
