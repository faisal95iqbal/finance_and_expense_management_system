from rest_framework import serializers
from .models import User, Business
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = "superuser" if user.is_superuser else user.role
        if getattr(user, "business", None):
            token["business_id"] = user.business.id
        return token

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(request=self.context.get("request"), email=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password")

        data = super().validate(attrs)

        # Flatten user info for frontend
        role = "superuser" if user.is_superuser else user.role
        data.update({
            "email": user.email,
            "role": role,
            "business_id": user.business_id,
        })

        return data


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["id", "name", "address", "phone", "timezone", "created_at", "is_active"]
        read_only_fields = ["id", "created_at"]

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_null=True)

    business = BusinessSerializer(read_only=True)
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "password",
            "role",
            "phone",
            "agency_name",
            "business",
            "is_active",
            "is_staff",
            "first_name",
            "last_name",
        )
        read_only_fields = ["id"]

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        request = self.context.get("request", None)
        # If creator has a business, force new user business to same unless explicitly set
        if request and getattr(request.user, "business", None) and not validated_data.get("business"):
            validated_data["business"] = request.user.business
        user = User(**validated_data)
        if password:
            user.set_password(password)
            user.is_active = True
        else:
            user.set_unusable_password()
            # if not explicit is_active set, ensure False to enforce invite flow
            user.is_active = validated_data.get("is_active", False)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
    

        

        