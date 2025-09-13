from django.db import models
from django.contrib.auth.models import AbstractUser

ROLE_CHOICES = [
    ("owner", "Owner"),
    ("manager", "Manager"),
    ("accountant", "Accountant"),
    ("staff", "Staff"),
]

class Business(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    timezone = models.CharField(max_length=50, default="UTC")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class User(AbstractUser):
    business = models.ForeignKey(Business, null=True, blank=True, on_delete=models.CASCADE, related_name="users")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="staff")

    def __str__(self):
        return f"{self.username} ({self.role})"

