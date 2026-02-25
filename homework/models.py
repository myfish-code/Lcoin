from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator

from django.db.models import Count
# Create your models here.

class OrderManager(models.Manager):
    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset().annotate(bids_count=Count("bids"))
    
class HomeworkOrder(models.Model):
    
    objects = OrderManager()
    
    SUBJECT_CHOICES = [
        ('math', 'Математика'),
        ('inf', 'Информатика'),
        ('phys', 'Физика'),
        ('biology', 'Биология'),
        ('economy', 'Економика'),
        ('eng', 'Английский'),
        ('chem', 'Химия'),
        ('history', 'История'),
        ('art', 'Исскуство'),
        ('other', 'Другое'),
    ]

    STATUS_CHOICES = [
        ('open', "Открыт"),
        ('pending', 'Ожидает'),
        ('in_progress', 'В работе'),
        ('dispute', 'Спор'),
        ('canceled', "Отменен"),
        ('completed', "Выполнен"),
    ]
    
    name = models.CharField(max_length=255)
    description = models.TextField()

    price = models.IntegerField()

    created_at = models.DateTimeField(auto_now_add=True)
    deadline_time = models.DateTimeField()

    subject = models.CharField(max_length=10, choices=SUBJECT_CHOICES)
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                  related_name='orders')
    
    executor = models.ForeignKey(settings.AUTH_USER_MODEL,
                                 null=True,
                                 blank=True,
                                 on_delete=models.SET_NULL,
                                 related_name="taken_orders")

    status = models.CharField(max_length=20, default="open", choices=STATUS_CHOICES)

    selected_bid = models.ForeignKey('ResponseBid',
                                      null=True,
                                      blank=True,
                                      on_delete=models.SET_NULL,
                                      related_name="selected_in_order")
    
    final_price = models.PositiveIntegerField(null=True, blank=True)
    final_days = models.PositiveIntegerField(null=True, blank=True)    

    started_at = models.DateTimeField(null=True, blank=True)
    expected_finish_at = models.DateTimeField(null=True, blank=True)

class ResponseBid(models.Model):

    description = models.TextField()
    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                                on_delete=models.CASCADE,
                                  related_name="responses")
    
    price = models.PositiveIntegerField()

    order = models.ForeignKey(HomeworkOrder,
                              on_delete=models.CASCADE,
                              related_name="bids")
    
    status_choice = (
        ("pending", "Ожидает"),
        ("offer", "Предложение"),
        ("accepted", "Принята"),
        ("rejected", "Отклонена"),  
        ("canceled", "Отозвана"),
        ("completed", "Завершена")
    )

    status = models.CharField(max_length=20,
                              choices=status_choice,
                              default="pending")
    
    days_to_complete = models.PositiveIntegerField(default=1)

    created_at = models.DateTimeField(auto_now_add=True)

class OrderReview(models.Model):

    TYPES = [
        ("customer", "заказчик"),
        ("executor", "исполнитель")
    ]
    order = models.ForeignKey(HomeworkOrder,
                               on_delete=models.CASCADE,
                               related_name="reviews")
    
    text = models.TextField()
    
    grade = models.IntegerField(
        validators=[
            MinValueValidator(1),
            MaxValueValidator(5)
        ]
    )

    author = models.ForeignKey(settings.AUTH_USER_MODEL, 
                               on_delete=models.CASCADE)
    
    review_type = models.CharField(max_length=10, choices=TYPES)

    created_at = models.DateTimeField(auto_now_add=True)

class OrderDispute(models.Model):
    STATUS_CHOICES = (
        ("open", "Открыт"),
        ("on_review", "На рассмотрении"),
        ("resolved", "Решен"),
        ("closed", "Закрыт"),
    )

    order = models.OneToOneField(
        HomeworkOrder, 
        on_delete=models.CASCADE, 
        related_name="dispute",
        verbose_name="Заказ"
    )

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="initiated_disputes",
        verbose_name="Инициатор"
    )

    opponent = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name="received_disputes",
        verbose_name="Ответчик"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="open",
        verbose_name="Статус спора"
    )

    last_message = models.ForeignKey('DisputeMessage',
                                     on_delete=models.SET_NULL,
                                     null=True,
                                     blank=True)
    admin_decision = models.TextField(blank=True, null=True, verbose_name="Решение админа")
    
    created_at = models.DateTimeField(auto_now_add=True)

class DisputeMessage(models.Model):

    class Meta:
        ordering = ['created_at']
        
    CHOICES = [
        ("user", "Пользователь"),
        ("admin", "Админ")
    ]
    dispute = models.ForeignKey(OrderDispute,
                                related_name="messages",
                                on_delete=models.CASCADE)
    description = models.TextField()

    author = models.ForeignKey(settings.AUTH_USER_MODEL,
                                related_name="my_dispute_messages",
                                on_delete=models.CASCADE)
    
    type = models.CharField(max_length=20, 
                            choices=CHOICES,
                            default="user")
    
    created_at = models.DateTimeField(auto_now_add=True)