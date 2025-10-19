# core/mixins.py
class BusinessQuerysetMixin:
    """
    Filter list queries to request.user.business
    Use in viewsets that have a 'business' FK on models.
    """
    business_field = "business"

    def get_queryset(self):
        qs = super().get_queryset()
        user = getattr(self.request, "user", None)
        if not user or not user.is_authenticated:
            return qs.none()
        biz = getattr(user, "business", None)
        if not biz:
            return qs.none()
        filter_kwargs = {self.business_field: biz}
        return qs.filter(**filter_kwargs)


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