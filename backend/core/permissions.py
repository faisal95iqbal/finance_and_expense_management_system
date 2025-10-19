from rest_framework.permissions import BasePermission, SAFE_METHODS

ROLE_HIERARCHY = {
    "owner": 4,
    "manager": 3,
    "accountant": 2,
    "staff": 1,
}

def role_level(role):
    return ROLE_HIERARCHY.get(role, 0)

class IsBusinessMember(BasePermission):
    """
    Basic: user must be authenticated and have business (for scoped endpoints).
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, "business", None))

    def has_object_permission(self, request, view, obj):
        user_biz = getattr(request.user, "business_id", None)
        obj_biz = getattr(obj, "business_id", None) or getattr(getattr(obj, "business", None), "id", None)
        return user_biz and obj_biz and user_biz == obj_biz
    

class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "owner")


class IsManagerOrAbove(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and role_level(request.user.role) >= role_level("manager"))

class ReadOnlyForStaff(BasePermission):
    """
    Staff only read access.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role == "staff":
            return request.method in SAFE_METHODS
        return True

class FinancePermission(BasePermission):
    """
    Finance endpoints:
      - owner & manager & accountant => full CRUD
      - staff => read-only
    Also checks obj.business == request.user.business when object-level check is needed.
    """
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.user.role in ("owner", "manager", "accountant"):
            return True
        if request.user.role == "staff":
            return request.method in SAFE_METHODS
        return False

    def has_object_permission(self, request, view, obj):
        user_biz = getattr(request.user, "business_id", None)
        obj_biz = getattr(obj, "business_id", None) or getattr(getattr(obj, "business", None), "id", None)
        return user_biz and obj_biz and user_biz == obj_biz


class IsSuperUserOnly(BasePermission):
    """Only allow superusers."""
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.is_superuser)


from rest_framework.permissions import BasePermission, SAFE_METHODS

class CanManageBusinessUsers(BasePermission):
    """
    - Owner: full access
    - Manager: can view all users, can create staff/accountant
    - Staff/Accountant: no access
    """
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.business):
            return False

        # Owner has full access
        if user.role == "owner":
            return True

        # Manager: allow read-only + create
        if user.role == "manager":
            if request.method in SAFE_METHODS:
                return True
            if request.method == "POST":
                return True  # actual role check happens in perform_create
            return False

        # Staff/accountant: no access
        return False

