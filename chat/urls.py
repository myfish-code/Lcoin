from django.urls import path
from chat.views import list_chats_view, create_chat, chat_view, handle_offer_view

app_name = "chat"

urlpatterns = [
    path('chats/', list_chats_view, name="list_chats"),
    path('chats/create/<int:user_id>/', create_chat, name="create_chat"),
    path('chats/<int:chat_id>/', chat_view, name="chat_detail"),
    path('chats/offer/<int:message_id>/', handle_offer_view, name="handle_offer")
]
