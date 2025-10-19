# core/activity_logger.py
from notifications.models import Activity

def log_activity(actor, verb, obj, changes=None):
    Activity.objects.create(
        actor=actor,
        verb=verb,
        target=str(obj),
        changes=changes or {}
    )
