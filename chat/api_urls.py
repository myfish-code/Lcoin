from django.urls import path
from chat.api_views import (
    MyChatsAPIView,
    CreateChatAPIView,
    ChatAPIView,
    HandleOfferAPIView
)

urlpatterns = [
    path('chats/', MyChatsAPIView.as_view()),
    path('chats/create/<int:user_id>/', CreateChatAPIView.as_view()),
    path('chats/<int:chat_id>/', ChatAPIView.as_view()),
    path('chats/offer/<int:message_id>/', HandleOfferAPIView.as_view())
]
