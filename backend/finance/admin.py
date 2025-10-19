from django.contrib import admin
from .models import Category, Expense, Income

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "type", "business")
    list_filter = ("type",)
    search_fields = ("name",)

@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ("id", "business", "amount", "category", "date", "created_by", "is_deleted")
    list_filter = ("date", "category", "is_deleted")
    search_fields = ("description",)

@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ("id", "business", "amount", "source", "date", "created_by", "is_deleted")
    list_filter = ("date", "category", "is_deleted")
    search_fields = ("description", "source")
