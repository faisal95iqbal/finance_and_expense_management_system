# core/presence.py
import redis
from django.conf import settings
from datetime import timedelta

# you already have REDIS_URL in settings (if not, set it)
REDIS_URL = getattr(settings, "REDIS_URL", "redis://127.0.0.1:6379")
r = redis.StrictRedis.from_url(REDIS_URL)

PRESENCE_TTL = 120  # seconds

def presence_key(business_id, user_id):
    return f"presence:{business_id}:{user_id}"

def mark_user_online(user_id, business_id=None):
    """
    If business_id provided, store presence under business scope; otherwise attempt to find business via DB (avoid here).
    """
    if business_id is None:
        # fallback key without business
        key = f"presence:{user_id}"
    else:
        key = presence_key(business_id, user_id)
    r.setex(key, timedelta(seconds=PRESENCE_TTL), "1")

def mark_user_offline(user_id, business_id=None):
    if business_id is None:
        key = f"presence:{user_id}"
    else:
        key = presence_key(business_id, user_id)
    r.delete(key)

def get_online_users(business_id, user_ids):
    """
    Returns list of user ids that have presence key for the business.
    """
    online = []
    # pipeline for efficiency
    pipe = r.pipeline()
    keys = [presence_key(business_id, uid) for uid in user_ids]
    for k in keys:
        pipe.exists(k)
    results = pipe.execute()
    for uid, exists in zip(user_ids, results):
        if exists:
            online.append(uid)
    return online
