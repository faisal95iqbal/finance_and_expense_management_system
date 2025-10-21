# finance/signals.py

from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from core.activity_logger import log_activity
from notifications.utils import send_business_notification
from .models import Expense, Income


# ------------------------------
#  Expense Signals
# ------------------------------

@receiver(pre_save, sender=Expense)
def expense_pre_save(sender, instance, **kwargs):
    """Capture 'before' snapshot for updates."""
    if instance.pk:
        try:
            old = Expense.objects.get(pk=instance.pk)
            instance._before_snapshot = {
                "amount": old.amount,
                "description": old.description,
            }
        except Expense.DoesNotExist:
            instance._before_snapshot = None
    else:
        instance._before_snapshot = None


@receiver(post_save, sender=Expense)
def log_expense_update(sender, instance, created, **kwargs):
    # Skip if object no longer exists (just deleted)
    if not Expense.objects.filter(pk=instance.pk).exists():
        return

    business = instance.business
    actor = getattr(instance, "updated_by", getattr(instance, "created_by", None))

    if created:
        # Create activity + notification
        log_activity(
            business=business,
            actor=actor,
            action_type="create",
            model_name="Expense",
            object_id=instance.pk,
            before=None,
            after={"amount": float(instance.amount), "description": instance.description},
        )
        send_business_notification(
            business,
            verb=f"Expense created: {instance.amount}",
            notification_type="finance_created",
            data={"expense_id": instance.pk},
        )
    else:
        before = getattr(instance, "_before_snapshot", None)
        after = {"amount": float(instance.amount), "description": instance.description}

        # Only log if the record actually changed (not a delete)
        if before != after:
            log_activity(
                business=business,
                actor=actor,
                action_type="update",
                model_name="Expense",
                object_id=instance.pk,
                before=before,
                after=after,
            )
            send_business_notification(
                business,
                verb=f"Expense updated: {instance.amount}",
                notification_type="finance_updated",
                data={"expense_id": instance.pk},
            )


@receiver(post_delete, sender=Expense)
def log_expense_delete(sender, instance, **kwargs):
    """Log and broadcast when an Expense is deleted."""
    business = instance.business
    actor = getattr(instance, "deleted_by", None)

    if not business:
        return

    log_activity(
        business=business,
        actor=actor,
        action_type="delete",
        model_name="Expense",
        object_id=instance.pk,
        before={"amount": instance.amount, "description": instance.description},
        after=None,
    )
    send_business_notification(
        business,
        verb=f"Expense deleted: {instance.amount}",
        notification_type="activity",
        data={"expense_id": instance.pk},
    )


# ------------------------------
#  Income Signals
# ------------------------------

@receiver(pre_save, sender=Income)
def income_pre_save(sender, instance, **kwargs):
    """Capture 'before' snapshot for updates."""
    if instance.pk:
        try:
            old = Income.objects.get(pk=instance.pk)
            instance._before_snapshot = {
                "amount": old.amount,
                "description": old.description,
            }
        except Income.DoesNotExist:
            instance._before_snapshot = None
    else:
        instance._before_snapshot = None


@receiver(post_save, sender=Income)
def log_income_update(sender, instance, created, **kwargs):
    # Skip if object no longer exists (just deleted)
    if not Income.objects.filter(pk=instance.pk).exists():
        return

    business = instance.business
    actor = getattr(instance, "updated_by", getattr(instance, "created_by", None))

    if created:
        log_activity(
            business=business,
            actor=actor,
            action_type="create",
            model_name="Income",
            object_id=instance.pk,
            before=None,
            after={"amount": float(instance.amount), "description": instance.description},
        )
        send_business_notification(
            business,
            verb=f"Income created: {instance.amount}",
            notification_type="finance_created",
            data={"income_id": instance.pk},
        )
    else:
        before = getattr(instance, "_before_snapshot", None)
        after = {"amount": float(instance.amount), "description": instance.description}

        if before != after:
            log_activity(
                business=business,
                actor=actor,
                action_type="update",
                model_name="Income",
                object_id=instance.pk,
                before=before,
                after=after,
            )
            send_business_notification(
                business,
                verb=f"Income updated: {instance.amount}",
                notification_type="finance_updated",
                data={"income_id": instance.pk},
            )


@receiver(post_delete, sender=Income)
def log_income_delete(sender, instance, **kwargs):
    """Log and broadcast when an Income is deleted."""
    business = instance.business
    actor = getattr(instance, "deleted_by", None)

    if not business:
        return

    log_activity(
        business=business,
        actor=actor,
        action_type="delete",
        model_name="Income",
        object_id=instance.pk,
        before={"amount": instance.amount, "description": instance.description},
        after=None,
    )
    send_business_notification(
        business,
        verb=f"Income deleted: {instance.amount}",
        notification_type="activity",
        data={"income_id": instance.pk},
    )
