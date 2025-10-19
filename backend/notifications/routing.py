# notifications/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # per-user notifications
    re_path(r"ws/notifications/?$", consumers.NotificationConsumer.as_asgi()),

    # business chat and activity
    re_path(r"ws/business/(?P<business_id>\d+)/chat/$", consumers.ChatConsumer.as_asgi()),
    re_path(r"ws/business/(?P<business_id>\d+)/activity/$", consumers.ActivityConsumer.as_asgi()),
]
