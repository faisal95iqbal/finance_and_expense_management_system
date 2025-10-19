# notifications/urls.py
from django.urls import path
from .views import NotificationViewSet, ActivityViewSet, ChatMessageViewSet

notification_list = NotificationViewSet.as_view({"get": "list"})
notification_detail = NotificationViewSet.as_view({"get": "retrieve"})
notification_unread = NotificationViewSet.as_view({"get": "unread_count"})
notification_mark_read = NotificationViewSet.as_view({"post": "mark_read"})
notification_mark_all = NotificationViewSet.as_view({"post": "mark_all_read"})

activity_list = ActivityViewSet.as_view({"get": "list"})

chat_list_create = ChatMessageViewSet.as_view({"get": "list", "post": "create"})
chat_online_users = ChatMessageViewSet.as_view({"get": "online_users"})

urlpatterns = [
    # Notifications for the authenticated user
    path("", notification_list, name="notifications-list"),
    path("unread-count/", notification_unread, name="notifications-unread"),
    path("<int:pk>/", notification_detail, name="notifications-detail"),
    path("<int:pk>/mark-read/", notification_mark_read, name="notifications-mark-read"),
    path("mark-all-read/", notification_mark_all, name="notifications-mark-all-read"),

    # Activity feed (business-scoped)
    path("activities/", activity_list, name="activity-list"),

    # Chat messages: business-scoped path (alternate to business-level URL)
    path("businesses/<int:business_id>/chat/messages/", chat_list_create, name="notifications-business-chat-messages"),
    path("chat/online_users/", chat_online_users, name="chat-online-users"),
]
