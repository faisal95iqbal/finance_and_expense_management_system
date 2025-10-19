# backend/finance/models.py
from django.db import models
from django.conf import settings
from django.utils import timezone
from users.models import Business

# Abstract tenant base model
class TenantModel(models.Model):
    business = models.ForeignKey(
        Business,
        on_delete=models.CASCADE,
        related_name="%(class)s_business",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ["-created_at"]


class Category(TenantModel):
    TYPE_CHOICES = (("expense", "Expense"), ("income", "Income"))
    name = models.CharField(max_length=200)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)

    class Meta:
        unique_together = ("business", "name", "type")
        indexes = [
            models.Index(fields=["business", "type"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.type})"


class Expense(TenantModel):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="expenses_created"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="expenses")
    date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    receipt = models.FileField(upload_to="receipts/%Y/%m/%d/", null=True, blank=True)
    recurrent = models.BooleanField(default=False)
    recurrent_rule = models.CharField(max_length=100, blank=True, null=True)  # e.g., 'monthly'
    next_run_at = models.DateField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["business", "date"]),
            models.Index(fields=["business", "category"]),
        ]

    def __str__(self):
        return f"Expense {self.amount} - {self.category} - {self.date}"


class Income(TenantModel):
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="incomes_created"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name="incomes")
    source = models.CharField(max_length=255, blank=True)
    date = models.DateField(default=timezone.now)
    description = models.TextField(blank=True)
    receipt = models.FileField(upload_to="incomes/%Y/%m/%d/", null=True, blank=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["business", "date"]),
            models.Index(fields=["business", "category"]),
        ]

    def __str__(self):
        return f"Income {self.amount} - {self.source} - {self.date}"
