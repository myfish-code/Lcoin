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
# Create your views here.

class MyChatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        chats = Conversation.objects.filter(Q(user1=request.user) | Q(user2=request.user))
                                            
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

        chat = Conversation.objects.filter(user1=user1, user2=user2).first()

        if not chat:
            chat = Conversation.objects.create(user1=user1, user2=user2)

        messages = chat.messages.all().order_by("created_at")

        return Response({
            "chat": ConversationSerializer(chat).data,
            "messages": MessageSerializer(messages, many=True).data
        }, status=status.HTTP_200_OK)

class ChatAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, chat_id):
        

        chat = get_object_or_404(Conversation, id=chat_id)

        if request.user not in [chat.user1, chat.user2]:
            return Response({
                "error": "У вас нет права на эту переписку"
            }, status=status.HTTP_403_FORBIDDEN)
        
        
        text = request.data.get("text")

        if not text:
            messages = Message.objects.filter(chat=chat).order_by("created_at")

            return Response({
                "chat": ConversationSerializer(chat).data,
                "messages": MessageSerializer(messages, many=True).data
            }, status=status.HTTP_200_OK)
        
        last_message = Message.objects.create(
            chat=chat,
            sender=request.user,
            text=text
        )
        chat.last_message = last_message
        chat.save()

                

        messages = Message.objects.filter(chat=chat).order_by("created_at") #или просто chat.message.all() потому что related_name="message"
        #или просто messages = chat.messages.all().order_by("created_at")

        return Response({
            "chat": ConversationSerializer(chat).data,
            "messages": MessageSerializer(messages, many=True).data
        }, status=status.HTTP_200_OK)
    
    def get(self, request, chat_id):
        chat = get_object_or_404(Conversation, id=chat_id)

        if request.user not in [chat.user1, chat.user2]:
            return Response({
                "error": "У вас нет права на эту переписку"
            }, status=status.HTTP_403_FORBIDDEN)
        

        messages = Message.objects.filter(chat=chat).order_by("created_at")

        return Response({
            "chat": ConversationSerializer(chat).data,
            "messages": MessageSerializer(messages, many=True).data
        })
    
class HandleOfferAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        message = get_object_or_404(Message, id=message_id)

        if message.sender == request.user:
            return Response({
                "error": "Вы не можете принимать или отклонять свой же офер"
            }, status=status.HTTP_403_FORBIDDEN)
        
        if request.user not in (message.chat.user1, message.chat.user2):
            return Response({
                "error": "У вас нет доступа к этому чату"
            }, status=status.HTTP_403_FORBIDDEN)
            
        if message.message_type != 'offer':
            return Response({
                "error": "Это не офер"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order = message.order
        
        
        answer = request.data.get("action")
            
        bid = ResponseBid.objects.filter(order=order, author=request.user).first()
        if not bid:
            return Response({
                "error": "Ставка не найдена"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if answer == "accept":
            order.executor = request.user
            order.status = 'in_progress'
            order.save()

            message.message_type = 'offer_accepted'
            message.save()

            bid.status = 'accepted'
            bid.save()

        else:
            message.message_type = 'offer_declined'
            message.save()
        
        return Response({
            "chat": ConversationSerializer(message.chat).data,
            "messages": MessageSerializer(
                message.chat.messages.all().order_by("created_at"),
                many=True
            ).data
        }, status=status.HTTP_200_OK)