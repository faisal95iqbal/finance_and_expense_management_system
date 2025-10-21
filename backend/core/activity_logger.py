# core/activity_logger.py
# NOTE: simple wrapper to call the notifications app helper so every activity
# is stored and broadcasted consistently (and notifications can be created).
from notifications.utils import log_activity as _notif_log_activity

def log_activity(business, actor, action_type, model_name="", object_id="", before=None, after=None):
    """
    Proxy to notifications.utils.log_activity
    Params:
      - business: Business instance
      - actor: User instance (can be None)
      - action_type: string e.g. "create", "update", "delete" or custom verb
      - model_name, object_id: optional strings
      - before / after: snapshot dicts
    """
    return _notif_log_activity(
        business=business,
        actor=actor,
        action_type=action_type,
        model_name=model_name,
        object_id=object_id,
        before=before,
        after=after,
    )
