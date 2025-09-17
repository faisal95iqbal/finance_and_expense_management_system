from rest_framework import serializers
from users.models import Business, User
from users.serializers import UserSerializer


class BusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = ["id", "name", "address", "phone", "timezone", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class BusinessUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "role", "phone", "is_active"]


class BusinessCreateSerializer(serializers.ModelSerializer):
    # Accept owner details on business creation (used by superuser)
    owner_email = serializers.EmailField(write_only=True, required=True)
    owner_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = Business
        fields = ["id", "name", "address", "phone", "timezone", "owner_email", "owner_password"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        owner_email = validated_data.pop("owner_email")
        owner_password = validated_data.pop("owner_password")

        business = super().create(validated_data)

        # Create owner user
        owner_user = User.objects.create_user(
            email=owner_email,
            password=owner_password,
            role="owner",
            business=business,
            is_active=True,  # Owner is active immediately
        )

        return business
