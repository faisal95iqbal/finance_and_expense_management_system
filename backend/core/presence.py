# core/presence.py
import redis
from django.conf import settings
from datetime import timedelta

r = redis.StrictRedis.from_url(getattr(settings, "REDIS_URL", "redis://127.0.0.1:6379"))
PRESENCE_TTL = 120  # seconds

def mark_user_online(user_id):
    r.setex(f"presence:{user_id}", timedelta(seconds=PRESENCE_TTL), "1")

def mark_user_offline(user_id):
    r.delete(f"presence:{user_id}")

def get_online_users(business_id, user_ids):
    online = []
    for uid in user_ids:
        if r.get(f"presence:{uid}"):
            online.append(uid)
    return online



