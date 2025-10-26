# notifications/utils.py
from .models import Notification, Activity
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import get_user_model
from django.core.cache import cache
from decimal import Decimal
import json

User = get_user_model()
channel_layer = get_channel_layer()

# cache key list name (stores list of registered cache keys per business)
_DASHBOARD_CACHE_LIST_KEY = "dashboard_cache_keys_for_business:{}"
_DASHBOARD_CACHE_TTL = 3600  # keep record of keys for 1 hour

def _serialize_for_json(data):
    """Recursively convert Decimals and other non-serializable types."""
    if isinstance(data, Decimal):
        return float(data)
    elif isinstance(data, dict):
        return {k: _serialize_for_json(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_serialize_for_json(v) for v in data]
    else:
        return data


def register_dashboard_cache_key(business, cache_key):
    """
    Keep a list of dashboard cache keys for this business so we can invalidate them on changes.
    business: Business instance or id
    cache_key: key string
    """
    business_id = business.id if hasattr(business, "id") else business
    list_key = _DASHBOARD_CACHE_LIST_KEY.format(business_id)
    existing = cache.get(list_key) or []
    if cache_key not in existing:
        existing.append(cache_key)
    cache.set(list_key, existing, _DASHBOARD_CACHE_TTL)


def invalidate_dashboard_cache(business):
    """
    Delete all registered dashboard cache keys for this business and notify via channels.
    """
    business_id = business.id if hasattr(business, "id") else business
    list_key = _DASHBOARD_CACHE_LIST_KEY.format(business_id)
    keys = cache.get(list_key) or []
    for k in keys:
        try:
            cache.delete(k)
        except Exception:
            pass
    # clear list
    cache.delete(list_key)

    # notify websocket clients subscribed to business notifications to refresh dashboard
    try:
        async_to_sync(channel_layer.group_send)(
            f"business_{business_id}_notifications",
            {"type": "dashboard.update", "payload": {"action": "invalidate"}}
        )
    except Exception:
        # non-fatal: logging optional
        pass


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

    # Send notification event
    if recipient:
        async_to_sync(channel_layer.group_send)(
            f"user_{recipient.id}_notifications",
            {"type": "notification_new", "notification": payload},
        )
    else:
        async_to_sync(channel_layer.group_send)(
            f"business_{business.id}_notifications",
            {"type": "notification_new", "notification": payload},
        )
    return n


def log_activity(business, actor, action_type, model_name="", object_id="", before=None, after=None):
    """Store DB activity + broadcast websocket event."""
    before = _serialize_for_json(before)
    after = _serialize_for_json(after)

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
        "actor": {
            "id": actor.id if actor else None,
            "email": getattr(actor, "email", None),
            "role": getattr(actor, "role", None),
        },
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
