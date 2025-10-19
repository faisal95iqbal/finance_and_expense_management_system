from rest_framework import serializers
from .models import Expense, Income, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "type"]


class ExpenseSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Expense
        fields = [
            "id",
            "business",
            "created_by",
            "amount",
            "category",
            "date",
            "description",
            "receipt",
            "recurrent",
            "recurrent_rule",
            "next_run_at",
            "is_deleted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "business", "created_by", "created_at", "updated_at"]


class IncomeSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Income
        fields = [
            "id",
            "business",
            "created_by",
            "amount",
            "category",
            "source",
            "date",
            "description",
            "receipt",
            "is_deleted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "business", "created_by", "created_at", "updated_at"]
