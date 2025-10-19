# notifications/serializers.py
from rest_framework import serializers
from .models import Notification, Activity, ChatMessage

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "business", "recipient", "notification_type", "verb", "data", "is_read", "created_at"]
        read_only_fields = ["id", "created_at"]

class ActivitySerializer(serializers.ModelSerializer):
    actor = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = ["id", "business", "actor", "action_type", "model_name", "object_id", "before", "after", "timestamp"]
        read_only_fields = ["id", "timestamp"]

    def get_actor(self, obj):
        if obj.actor:
            return {"id": obj.actor.id, "email": getattr(obj.actor, "email", None), "role": getattr(obj.actor, "role", None)}
        return None

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ["id", "business", "sender", "content", "created_at"]
        read_only_fields = ["id", "created_at", "sender", "business"]

    def get_sender(self, obj):
        return {"id": obj.sender.id, "email": getattr(obj.sender, "email", None), "role": getattr(obj.sender, "role", None)}
