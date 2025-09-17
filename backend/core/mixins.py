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
