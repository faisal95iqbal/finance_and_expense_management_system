# notifications/admin.py
from django.contrib import admin
from .models import Notification, Activity, ChatMessage

admin.site.register(Notification)
admin.site.register(Activity)
admin.site.register(ChatMessage)
