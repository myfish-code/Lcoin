from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from django.db.models import Q

from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import Conversation, Message
from homework.models import HomeworkOrder, ResponseBid
from homework.serializers import ResponseBidSerializer, HomeworkOrderSerializer

# Create your views here.

class SearchOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        query = request.GET.get('query', '')
        subject = request.GET.get('subject', '')

        orders = HomeworkOrder.objects.filter(status="open")
        if query:
            orders = orders.filter(Q(name__icontains=query) | Q(description__icontains=query))
        if subject:
            orders = orders.filter(subject=subject)

        serializer_orders = HomeworkOrderSerializer(orders, many=True)
        return Response({
            "orders": serializer_orders.data,
        }, status=status.HTTP_200_OK)


class SearchOrderDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        order = get_object_or_404(HomeworkOrder, id=order_id)
        bids = ResponseBid.objects.filter(order=order)
        user_has_bid = bids.filter(author=request.user).exists() 

        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "order": HomeworkOrderSerializer(order).data,
            "bids": serializer_bids.data,
            "user_had_bid": user_has_bid
        }, status=status.HTTP_200_OK)


class CreateBidAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        
        order = get_object_or_404(HomeworkOrder, id=order_id)

        if order.status != "open":
            return Response({
                "error": "Заказ закрыт"
            },status=status.HTTP_400_BAD_REQUEST)

        if order.bids.filter(author=request.user).exists():
            return Response({
                "error": "Вы уже сделали ставку на этот заказ"
            },status=status.HTTP_400_BAD_REQUEST)

        description = request.data.get("description")
        price = int(request.data.get("price"))
        days_to_complete = int(request.data.get("days_to_complete"))

        ResponseBid.objects.create(
            description=description,
            author=request.user,
            price=price,
            order=order,
            days_to_complete=days_to_complete
        )

        bids = ResponseBid.objects.filter(order=order)
        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "bids": serializer_bids.data
        }, status=status.HTTP_201_CREATED)


class AssignExecutorAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, bid_id):
        bid = get_object_or_404(ResponseBid, id=bid_id)
        order = bid.order

        if order.author != request.user:
            return Response({
                "error": "У вас  нет права отправлять офер"
            }, status=status.HTTP_403_FORBIDDEN)


        user1, user2 = bid.author, order.author

        if user1.id > user2.id:
            user1, user2 = user2, user1

        chat = Conversation.objects.filter(user1=user1, user2=user2).first()

        if not chat:
            chat = Conversation.objects.create(user1=user1, user2=user2)
        
        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            text=f"Вы получили офер на выполнение задания: '{order.name}'. Примите или отклоните.",
            message_type='offer',
            order=order
        )

        chat.last_message = message
        chat.save()
        
        
        return Response({
            "success": True 
        }, status=status.HTTP_200_OK)


class MyOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        myOrders = HomeworkOrder.objects.filter(author=request.user)
        serializer_myOrders = HomeworkOrderSerializer(myOrders, many=True)
        return Response({
            "myOrders": serializer_myOrders.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        user = request.user
             
        name = request.POST.get("name")
        description = request.POST.get("description")
        price = request.POST.get("price")
        deadline_time = request.POST.get("deadline_time")
        subject = request.POST.get("subject")

        if int(price) > user.coins:
            return Response({
                "error": "Недостаточно монет для создания заказа"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        deadline_time = timezone.now() + timedelta(days=int(deadline_time))
        HomeworkOrder.objects.create(
            name=name,
            description=description,
            price=price,
            deadline_time=deadline_time,
            subject=subject,
            author=request.user
        )

        user.coins -= int(price)
        user.save()



        orders = HomeworkOrder.objects.filter(author=request.user)

        serializer_orders = HomeworkOrderSerializer(orders, many=True)

        return Response({
            "orders": serializer_orders.data,
            "coins": user.coins

        })

class DeleteMyOrderAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        user = request.user

        order = get_object_or_404(HomeworkOrder, id=order_id, author=user)

        user.coins += int(order.price)

        order.delete()
        user.save()

        return Response({
            "success": True
        }, status=status.HTTP_204_NO_CONTENT)
    
    
class MyBidsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        bids = ResponseBid.objects.filter(author=request.user)
        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "bids": serializer_bids.data
        },status=status.HTTP_200_OK)

