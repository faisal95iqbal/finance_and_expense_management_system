# notifications/models.py
from django.db import models
from django.conf import settings
from users.models import User, Business

class Notification(models.Model):
    """
    A notification. If recipient is null it's a broadcast for the business.
    Keep forever (no automatic deletion).
    """
    NOTIFY_TYPES = [
        ("user_invited", "User invited"),
        ("user_joined", "User joined"),
        ("finance_created", "Finance created"),
        ("finance_updated", "Finance updated"),
        ("announcement", "Announcement"),
        ("activity", "Activity"),
        ("chat_message", "Chat message"),
    ]

    business = models.ForeignKey(Business, null=True, blank=True, on_delete=models.CASCADE, related_name="notifications")
    recipient = models.ForeignKey(User, null=True, blank=True, on_delete=models.CASCADE, related_name="notifications")
    notification_type = models.CharField(max_length=50, choices=NOTIFY_TYPES, default="announcement")
    verb = models.CharField(max_length=255)
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.notification_type} → {self.recipient_id or 'broadcast'}"


class Activity(models.Model):
    """
    Audit trail / activity feed for a business.
    Store before/after snapshots as JSON (null allowed).
    """
    business = models.ForeignKey(Business, null=True, blank=True, on_delete=models.CASCADE, related_name="activities")
    actor = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="activities")
    action_type = models.CharField(max_length=100)  # e.g. create/update/delete
    model_name = models.CharField(max_length=100, blank=True)
    object_id = models.CharField(max_length=100, blank=True)
    before = models.JSONField(null=True, blank=True)
    after = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"[{self.business_id}] {self.action_type} {self.model_name}:{self.object_id}"


class ChatMessage(models.Model):
    """
    Business-wide chat messages (one chat room per business).
    Messages are permanent.
    """
    business = models.ForeignKey(Business, on_delete=models.CASCADE, related_name="chat_messages")
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chat_messages")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.business_id}] {self.sender_id}: {self.content[:40]}"
