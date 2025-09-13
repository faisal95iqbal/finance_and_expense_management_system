from rest_framework import permissions

class IsBusinessMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (request.user.is_superuser or request.user.business is not None)

class TenantQuerysetMixin:
    def get_queryset(self):
        qs = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return qs
        if not getattr(user, "business", None):
            return qs.none()
        return qs.filter(business=user.business)

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_superuser:
            serializer.save()
        else:
            serializer.save(business=user.business, created_by=getattr(user, "id", None))
