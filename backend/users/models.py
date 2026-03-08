from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings
import uuid
import os
LANGUAGE_CHOICES = [
    ("en", "English"),
    ("ru", "Русский"),
    ("uk", "Українська"),
    ("sk", "Slovenčina"),
]

STATUS_CHOICES = [
    ("unverified", "Не верифицирован"),
    ("pending", "Ожидает ответа"),
    ("verified", "Верифицирован"),
    ("rejected", "Отказано"),
]

def get_verification_path(instance, filename):
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('verification_docs', filename)

class Client(AbstractUser):
    coins = models.IntegerField(default=100)

    language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default="sk")

    customer_stars_sum = models.PositiveIntegerField(default=0)
    customer_stars_count = models.PositiveIntegerField(default=0)
    customer_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)

    executor_stars_sum = models.PositiveIntegerField(default=0)
    executor_stars_count = models.PositiveIntegerField(default=0)
    executor_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)

    verification_status = (
        models.CharField(max_length=10, choices=STATUS_CHOICES, default="unverified", db_index=True)
    )
    verification_photo = models.ImageField(
        upload_to=get_verification_path,
        blank=True,
        null=True,
        verbose_name="Фото для верификации",
    )
    verification_rejected_reason = models.CharField(null=True, blank=True)

class FeedBack(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                  related_name='feedbacks')
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)