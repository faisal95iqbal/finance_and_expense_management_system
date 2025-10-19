# notifications/utils.py
from .models import Notification, Activity
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model

User = get_user_model()
channel_layer = get_channel_layer()

def send_business_notification(business, verb, notification_type="announcement", data=None, recipient=None):
    """
    Create notification in DB and broadcast to websocket group(s).
    recipient: User instance or None (broadcast to business).
    """
    n = Notification.objects.create(
        business=business,
        recipient=recipient,
        notification_type=notification_type,
        verb=verb,
        data=data or {},
    )
    payload = {
        "id": n.id,
        "business": n.business_id,
        "recipient": n.recipient_id,
        "notification_type": n.notification_type,
        "verb": n.verb,
        "data": n.data,
        "is_read": n.is_read,
        "created_at": n.created_at.isoformat(),
    }

    # if recipient -> send to user_x group; else -> broadcast to business group
    if recipient:
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}_notifications", {"type": "notification_new", "notification": payload}
        )
    else:
        async_to_sync(channel_layer.group_send)(
            f"business_{business.id}_notifications", {"type": "notification_new", "notification": payload}
        )
    return n

def log_activity(business, actor, action_type, model_name="", object_id="", before=None, after=None):
    a = Activity.objects.create(
        business=business,
        actor=actor,
        action_type=action_type,
        model_name=model_name,
        object_id=str(object_id),
        before=before,
        after=after,
    )
    payload = {
        "id": a.id,
        "business": a.business_id,
        "actor": {"id": actor.id, "email": getattr(actor, "email", None), "role": getattr(actor, "role", None)} if actor else None,
        "action_type": a.action_type,
        "model_name": a.model_name,
        "object_id": a.object_id,
        "before": a.before,
        "after": a.after,
        "timestamp": a.timestamp.isoformat(),
    }
    async_to_sync(channel_layer.group_send)(
        f"business_{business.id}_activity",
        {"type": "activity_new", "activity": payload},
    )
    return a
