from django.urls import path
from chat.api_views import (
    MyChatsAPIView,
    CreateChatAPIView,
    ChatAPIView,
    MessageDetailAPIView,

)

urlpatterns = [
    path('chats/', MyChatsAPIView.as_view()),
    path('chats/create/<int:user_id>/', CreateChatAPIView.as_view()),
    path('chats/<int:chat_id>/', ChatAPIView.as_view()),
    path('messages/<int:message_id>/', MessageDetailAPIView.as_view()),
]
