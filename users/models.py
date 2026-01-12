from django.contrib.auth.models import AbstractUser
from django.db import models

class Client(AbstractUser):
    coins = models.IntegerField(default=100)

    customer_stars_sum = models.PositiveIntegerField(default=0)
    customer_stars_count = models.PositiveIntegerField(default=0)
    customer_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)
    
    executor_stars_sum = models.PositiveIntegerField(default=0)
    executor_stars_count = models.PositiveIntegerField(default=0)
    executor_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.0)