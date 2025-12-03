
from django.db import models
from django.conf import settings

from homework.models import HomeworkOrder

# Create your models here.

class Conversation(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL,
                              on_delete=models.CASCADE,
                              related_name="conversations_as_user1")

    user2 = models.ForeignKey(settings.AUTH_USER_MODEL,
                              on_delete=models.CASCADE,
                              related_name="conversations_as_user2")
    
    last_message = models.ForeignKey('Message',
                                    on_delete=models.CASCADE,
                                    null=True,
                                    blank=True,
                                    related_name="+")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-last_message__created_at', '-created_at']
        unique_together = [['user1', 'user2']]

class Message(models.Model):
    chat = models.ForeignKey(Conversation,
                             on_delete=models.CASCADE,
                             related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL,
                               on_delete=models.CASCADE,
                               related_name="sent_messages")
    text = models.TextField()

    message_type = models.CharField(max_length=20,
                                    choices=[('text', 'Обычное сообщение'),
                                              ('offer', 'Офер'),
                                              ('offer_accepted', 'Офер - принят'),
                                              ('offer_declined', "Офер - отклонен")],
                                      default='text')
    order = models.ForeignKey(HomeworkOrder,
                              on_delete=models.CASCADE,
                              null=True,
                              blank=True,
                              related_name="messages")
    created_at = models.DateTimeField(auto_now_add=True)