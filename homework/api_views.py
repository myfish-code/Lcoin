from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from django.db.models import Q

from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import Conversation, Message
from homework.models import HomeworkOrder, ResponseBid, OrderReview, OrderDisput
from homework.serializers import ResponseBidSerializer, HomeworkOrderSerializer, OrderReviewSerializer

from chat.serializers import MessageSerializer
# Create your views here.

class SearchOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        #query = request.GET.get('query', '')
        #subject = request.GET.get('subject', '')

        orders = HomeworkOrder.objects.filter(Q(status="open") | Q(status="pending") | Q(status="in_progress")).order_by("-created_at")
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

class OrderAssignmentAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, bid_id):
        bid = get_object_or_404(ResponseBid, id=bid_id)
        order = bid.order
        final_price = request.data.get("final_price")
        final_days = request.data.get("final_days")

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
        
        bid.status = "offer"
        bid.save()

        order.status = "pending"
        order.selected_bid = bid
        order.final_price = final_price
        order.final_days = final_days
        order.save()

        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            text="OFFER",
            type='offer',
            order=order
        )

        chat.last_message = message
        chat.save()
        
        
        return Response({
            "order": HomeworkOrderSerializer(order).data 
        }, status=status.HTTP_200_OK)
    
    def delete(self, request, order_id):
        order = get_object_or_404(HomeworkOrder, id=order_id)
        bid = order.selected_bid

        offer_message = Message.objects.filter(order=order).first()
        chat = offer_message.chat if offer_message else None

        if order.author != request.user:
            return Response({
                "error": "У вас  нет права отправлять офер"
            }, status=status.HTTP_403_FORBIDDEN)
        bid.status = "pending"
        bid.save()

        order.status = "open"
        order.selected_bid = None
        order.final_price = None
        order.final_days = None
        order.save()

        Message.objects.filter(order=order).delete()

        if chat:
            chat.last_message = chat.messages.order_by("-created_at").first()
            chat.save()
        return Response({
            "order": HomeworkOrderSerializer(order).data
        }, status=status.HTTP_200_OK)

class OrderConfirmationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(HomeworkOrder, id=order_id)

        if order.status != "pending":
            return Response({
                "error": "Заказ уже в работе или завершен"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not order.selected_bid:
            return Response({"error": "Ставка не выбрана"}, status=400)
        
        bid = order.selected_bid
        bid.status = "accepted"
        bid.save()

        ResponseBid.objects.filter(order=order).exclude(id=bid.id).update(status="rejected")

        bid_author = bid.author
        
        if bid_author != request.user:
            return Response({
                "error": "У вас  нет права принимать ставку"
            }, status=status.HTTP_403_FORBIDDEN)

        order.executor = bid_author
        order.status = "in_progress"

        order.started_at = timezone.now()
        if order.final_days:
            order.expected_finish_at = timezone.now() + timedelta(days=order.final_days)
        order.save()

        message = Message.objects.filter(order=order, type="offer").last()
        if message:
            message.type = "offer_accepted"
            message.save()

        return Response({
            "message": MessageSerializer(message,context={'request': request}).data if message else None
        }, status=status.HTTP_200_OK)

    def delete(self, request, order_id):
        order = get_object_or_404(HomeworkOrder, id=order_id)

        if (not order.selected_bid or order.selected_bid.author != request.user):
            return Response({
                "error": "У вас  нет права отклонять ставку"
            }, status=status.HTTP_200_OK)
        
        bid = order.selected_bid
        bid.status = "pending"
        bid.save()

        order.status = "open"
        order.selected_bid = None
        order.final_price = None
        order.final_days = None
        order.save()

        message = Message.objects.filter(order=order, type="offer").last()
        if message:
            message.type = "offer_declined"
            message.save()

        return Response({
            "message": MessageSerializer(message,context={'request': request}).data if message else None
        }, status=status.HTTP_200_OK)

class OrderCompletionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(HomeworkOrder, id=order_id)
        
        if request.user != order.author:
            return Response({
                "error": "У вас  нет права потверждать выполнения заказа"
            }, status=status.HTTP_403_FORBIDDEN)

        if order.status != "in_progress":
            return Response({
                "error": "Можно подтвердить выполнение только того заказа, который находится в работе"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        bid = order.selected_bid
        bid.status = "completed"
        bid.save()

        order.status = 'completed'
        order.save()

        message = Message.objects.filter(order=order, type="offer_accepted").last()
        if message:
            message.type = "order_completed"
            message.save()
        
        return Response({
            "message": MessageSerializer(message,context={'request': request}).data if message else None
        }, status=status.HTTP_200_OK)
    
class OrderReviewAPIView(APIView):
    def post(self, request, order_id):
        
        order = get_object_or_404(HomeworkOrder, id=order_id)
        message = Message.objects.filter(order=order, type='order_completed').last()

        text = request.data.get("text")
        grade = request.data.get("grade")
        
        if not text or not grade:
            return Response({
                "error": "Нет всех данных"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:   
            grade = int(grade) 
        except (TypeError, ValueError):
            return Response({
                "error": "Оценка должна быть числом"
                }, status=400)
        
        if not message:
            return Response({
                "error": "Такого сообщения не существует"
            }, status=status.HTTP_400_BAD_REQUEST)

        type_user = ""

        if request.user == order.author:     
            type_user = "customer"

            user = order.executor
            user.executor_stars_sum += grade
            user.executor_stars_count += 1
            user.executor_rating = round(user.executor_stars_sum / user.executor_stars_count, 2)
            user.save()

        elif request.user == order.executor:
            type_user = "executor"

            user = order.author
            user.customer_stars_sum += grade
            user.customer_stars_count += 1
            user.customer_rating = round(user.customer_stars_sum / user.customer_stars_count, 2)
            user.save()

        else:
            return Response({
                "error": "У вас нет прав выполнять это действие"
            }, status=status.HTTP_403_FORBIDDEN)

        OrderReview.objects.create(
            order=order,
            author=request.user,
            text=text,
            grade=grade,
            review_type=type_user
        )

        return Response({
            "message": MessageSerializer(message,context={'request': request}).data if message else None
        }, status=status.HTTP_200_OK)


class OrderDisputAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        order = get_object_or_404(HomeworkOrder, id=order_id)

        if order.status not in ("in_progress", "dispute"):
            return Response({
                "error": "Спор можно открыть только для заказов в статусе 'В работе'"
            }, status=status.HTTP_403_FORBIDDEN)
        
        text = request.data.get("text")

        if request.user not in (order.author, order.executor):
            return Response({
                "error": "У вас нет прав открывать спор по этому заказу"
            }, status=status.HTTP_403_FORBIDDEN)
        
        OrderDisput.objects.create(
            order=order,
            description=text,
            author=request.user
        )

        order.status = "dispute"
        order.save()

        return Response({
            "success": True
        }, status=status.HTTP_200_OK)

class MyOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_status):
        myOrders = HomeworkOrder.objects.filter(author=request.user, status=order_status).order_by("-created_at")
            
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

        if order.status not in ("open", "pending"):
            return Response({
                "error": "Вы не можете удалять заказ на этом уровне"
            }, status=status.HTTP_403_FORBIDDEN)
        
        order.delete()

        return Response({
            "success": True
        }, status=status.HTTP_200_OK)    
    
class MyBidsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, bid_status):
        
        if not bid_status:
            bid_status = "pending"

        bids = ResponseBid.objects.filter(author=request.user, status=bid_status)
        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "bids": serializer_bids.data
        },status=status.HTTP_200_OK)

    def post(self, request, order_id):
        
        order = get_object_or_404(HomeworkOrder, id=order_id)

        if order.status not in ("open", "pending"):
            return Response({
                "error": "Заказ уже в работе или завершен"
            },status=status.HTTP_400_BAD_REQUEST)

        if order.author == request.user:
            return Response({
                "error": "Нельзя делать ставку на свой заказ"
                }, status=status.HTTP_403_FORBIDDEN)
    
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
    
    def delete(self, request, bid_id):
        bid = ResponseBid.objects.filter(id=bid_id, author=request.user).first()

        if not bid:
            return Response({
                "error": "У вас нет прав выполнять это действие"
            }, status=status.HTTP_403_FORBIDDEN)

        order = bid.order

        if order.status not in ("open", "pending"):
            return Response({
                "error": "Вы не можете удалять ставку на этом уровне"
            }, status=status.HTTP_403_FORBIDDEN)
        
        bid.delete()

        return Response({
            "bids": ResponseBidSerializer(order.bids.all(), many=True).data
        }, status=status.HTTP_200_OK)
    
