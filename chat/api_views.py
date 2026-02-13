
from chat.serializers import ConversationSerializer, MessageSerializer

from rest_framework import status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView


from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from chat.models import Conversation, Message
from homework.models import ResponseBid
from users.models import Client

from django.db import transaction
# Create your views here.

class MyChatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        chats = Conversation.objects.filter(
            Q(user1=request.user) | Q(user2=request.user)
        ).select_related('user1', 'user2', 'last_message')
            
        return Response({
            "chats": ConversationSerializer(chats, many=True).data
        }, status=status.HTTP_200_OK)

class CreateChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        if request.user.id == user_id:
            return Response({
                "error": "Вы не можете создавать чат с самим собой"
            }, status=status.HTTP_403_FORBIDDEN)
        
        user1 = request.user
        user2 = get_object_or_404(Client, id=user_id)
        
        if user1.id > user2.id:
            user1,user2 = user2, user1
        try:
            with transaction.atomic():
                #chat = Conversation.objects.filter(user1=user1, user2=user2).first()
                #if not chat:
                #    chat = Conversation.objects.create(user1=user1, user2=user2)   
                chat, _ = Conversation.objects.get_or_create(user1=user1, user2=user2)
                return Response({
                    "chatId": chat.id
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Ошибка создания чата: {e}")
            return Response({
                "error": "Ошибка создания чата"
            }, status=status.HTTP_400_BAD_REQUEST)

class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, chat_id):
        chat = get_object_or_404(
            Conversation.objects.select_related(
                'user1',
                'user2',
                'last_message'
                ),
            id=chat_id
        )

        if request.user not in [chat.user1, chat.user2]:
            return Response({
                "error": "У вас нет права на эту переписку"
            }, status=status.HTTP_403_FORBIDDEN)
        
        
        text = request.data.get("text")

        if not text:
            return Response({
                "error": "No message send"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try: 
            with transaction.atomic():
                last_message = Message.objects.create(
                    chat=chat,
                    sender=request.user,
                    text=text
                )
                chat.last_message = last_message
                chat.save()
                return Response({
                    "message": MessageSerializer(last_message,context={'request': request}).data
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"Ошибка создания чата: {e}")
            return Response({
                "error": "Ошибка отправки сообщения"
            }, status=status.HTTP_400_BAD_REQUEST)
        
    def get(self, request, chat_id, last_message_id, limit):
        chat = get_object_or_404(Conversation, id=chat_id)

        if request.user not in [chat.user1, chat.user2]:
            return Response({
                "error": "У вас нет права на эту переписку"
            }, status=status.HTTP_403_FORBIDDEN)
        
        if last_message_id:
            filters = Q(chat=chat) & Q(id__lt=last_message_id)
        else:
            filters = Q(chat=chat)

        count_messages = Message.objects.filter(filters).count()

        limit = min(limit, count_messages)

        messages_query = Message.objects.filter(filters).select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ).order_by("-created_at")[:limit]
        
        messages = list(messages_query)[::-1]

        return Response({
            "messages": MessageSerializer(messages, many=True,context={'request': request}).data,
            "messageRemain": count_messages - len(messages),
            "userId": request.user.id
        })

class MessageDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, message_id):
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        chat = message.chat

        try:
            with transaction.atomic():
                message.type = "deleted"
                message.save(update_fields=['type'])

                new_last_message = Message.objects.filter(chat=chat).exclude(type="deleted").order_by("created_at").last()

                chat.last_message = new_last_message
                chat.save()

        except Exception as e:
            print(f"Ошибка создания чата: {e}")
            return Response({
                "error": "Ошибка удаления сообщения"
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "message_delete": MessageSerializer(message,context={'request': request}).data
        }, status=status.HTTP_200_OK)



    def patch(self, request, message_id):
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        
        messageText = request.data.get("text")
    
        if messageText:
            message.text = messageText
            message.save(update_fields=['text'])

        return Response({
            "message_patch": MessageSerializer(message, context={'request': request}).data
        }, status=status.HTTP_200_OK)
