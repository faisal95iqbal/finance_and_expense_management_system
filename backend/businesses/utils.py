# businesses/utils.py
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.template.loader import render_to_string
from django.conf import settings
from django.core.mail import send_mail, EmailMessage

def build_invite_link(user, frontend_url):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    link = f"{frontend_url.rstrip('/')}/invite-set-password/?uid={uid}&token={token}"
    return uid, token, link

def send_invite_email(user, frontend_url, subject="You're invited to join", from_email=None):
    uid, token, link = build_invite_link(user, frontend_url)
    context = {
        "user": user,
        "invite_link": link,
        "site_name": getattr(settings, "SITE_NAME", "Finance App"),
    }
    html_message = render_to_string("emails/invite_email.html", context)
    text_message = render_to_string("emails/invite_email.txt", context)

    email = EmailMessage(
        subject=subject,
        body=html_message,
        from_email=from_email or settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    email.content_subtype = "html"
    email.send(fail_silently=False)
