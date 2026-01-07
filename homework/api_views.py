
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
        
        #query = request.GET.get('query', '')
        #subject = request.GET.get('subject', '')

        orders = HomeworkOrder.objects.filter(Q(status="open") | Q(status="pending")).order_by("-created_at")
        #if query:
        #    orders = orders.filter(Q(name__icontains=query) | Q(description__icontains=query))
        #if subject:
        #    orders = orders.filter(subject=subject)

        serializer_orders = HomeworkOrderSerializer(orders, many=True)
        return Response({
            "orders": serializer_orders.data,
        }, status=status.HTTP_200_OK)


class SearchOrderDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        
        order = get_object_or_404(HomeworkOrder, id=order_id)
    
        bids = ResponseBid.objects.filter(order=order)
        user_bid = bids.filter(author=request.user).first()
        
        is_author = (order.author == request.user)

        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "order": HomeworkOrderSerializer(order).data,
            "bids": serializer_bids.data,
            "is_author": is_author,
            "user_bid_id": user_bid.id if user_bid else None,

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

        user_bid = ResponseBid.objects.create(
            description=description,
            author=request.user,
            price=price,
            order=order,
            days_to_complete=days_to_complete
        )

        bids = ResponseBid.objects.filter(order=order)
        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "bids": serializer_bids.data,
            "bidId": user_bid.id
        }, status=status.HTTP_201_CREATED)


class OrderAssignmentAPIView(APIView):

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
        
        order.status = "pending"
        order.selected_bid = bid
        order.save()
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
            "order": HomeworkOrderSerializer(order).data 
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, order_id):
        order = get_object_or_404(HomeworkOrder, id=order_id)

        offer_message = Message.objects.filter(order=order).first()
        chat = offer_message.chat if offer_message else None

        if order.author != request.user:
            return Response({
                "error": "У вас  нет права отправлять офер"
            }, status=status.HTTP_403_FORBIDDEN)
        
        order.status = "open"
        order.selected_bid = None
        order.save()

        Message.objects.filter(order=order).delete()

        if chat:
            chat.last_message = chat.messages.order_by("-created_at").first()
            chat.save()
        return Response({
            "order": HomeworkOrderSerializer(order).data
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
        
        name = request.POST.get("name")
        description = request.POST.get("description")
        price = request.POST.get("price")
        deadline_time = request.POST.get("deadline_time")
        subject = request.POST.get("subject")
        
        deadline_time = timezone.now() + timedelta(days=int(deadline_time))
        HomeworkOrder.objects.create(
            name=name,
            description=description,
            price=price,
            deadline_time=deadline_time,
            subject=subject,
            author=request.user
        )
        orders = HomeworkOrder.objects.filter(author=request.user)

        serializer_orders = HomeworkOrderSerializer(orders, many=True)

        return Response({
            "myOrders": serializer_orders.data,
        }, status=status.HTTP_200_OK)

    def delete(self, request, order_id):
        user = request.user

        order = get_object_or_404(HomeworkOrder, id=order_id, author=user)

        order.delete()
        user.save()

        return Response({
            "success": True
        }, status=status.HTTP_200_OK)    
    
class MyBidsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        bids = ResponseBid.objects.filter(author=request.user)
        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "bids": serializer_bids.data
        },status=status.HTTP_200_OK)

    def delete(self, request, bid_id):
        bid = ResponseBid.objects.filter(id=bid_id, author=request.user).first()

        if not bid:
            return Response({
                "error": "У вас нет прав выполнять это действие"
            }, status=status.HTTP_403_FORBIDDEN)

        order = bid.order
        bid.delete()

        return Response({
            "bids": ResponseBidSerializer(order.bids.all(), many=True).data
        }, status=status.HTTP_200_OK)