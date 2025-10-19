
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from core.activity_logger import log_activity
from .models import Expense

@receiver(post_save, sender=Expense)
def log_expense_update(sender, instance, created, **kwargs):
    if created:
        log_activity(instance.created_by, "created expense", instance)
    else:
        log_activity(instance.updated_by, "updated expense", instance, changes={"amount": instance.amount})

@receiver(post_delete, sender=Expense)
def log_expense_delete(sender, instance, **kwargs):
    log_activity(instance.deleted_by, "deleted expense", instance)
