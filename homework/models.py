from django.db import models
from django.conf import settings
# Create your models here.

class HomeworkOrder(models.Model):
    
    SUBJECT_CHOICES = [
        ('MATH', 'Математика'),
        ('ENG', 'Английский'),
        ('PHYS', 'Физика'),
        ('CHEM', 'Химия'),
    ]

    name = models.CharField(max_length=255)
    description = models.TextField()

    price = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    deadline_time = models.IntegerField()

    subject = models.CharField(max_length=10, choices=SUBJECT_CHOICES)
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                  related_name='orders')


class ResponseBid(models.Model):

    description = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                  related_name="responses")
    
    price = models.PositiveIntegerField()

    order = models.ForeignKey(HomeworkOrder,
                              on_delete=models.CASCADE,
                              related_name="bids")
    
    status_choice = {
        "pending": "Ожидает",
        "acepted": "Принят",
        "declined": "Отклонен"        
    }

    status = models.CharField(max_length=20,
                              choices=status_choice,
                              default="pending")
    
    days_to_complete = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)