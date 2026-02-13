from importlib.readers import FileReader
import math

from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta

from django.db.models import Q, Case, When, IntegerField

from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from chat.models import Conversation, Message
from homework.models import HomeworkOrder, ResponseBid, OrderReview, OrderDispute, DisputeMessage
from homework.serializers import ResponseBidSerializer, HomeworkOrderSerializer, OrderReviewSerializer, DisputeMessageSerializer, OrderDisputeSerializer

from chat.serializers import MessageSerializer

from django.db import transaction
# Create your views here.

class SearchOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 5))
        
            if page < 1:
                page = 1
            if page_size < 1:
                page_size = 5
                
        except (ValueError, TypeError):

            page = 1
            page_size = 5
        
        start = (page - 1) * page_size
        end = start + page_size

        try:
            price_min = float(request.query_params.get('price_min', None))
        
            if price_min and price_min < 1:
                price_min = None
                
        except (ValueError, TypeError):
            price_min = None

        try:
            bids_max = int(request.query_params.get('bids_max', None))
        
            if bids_max and bids_max < 1:
                bids_max = None
                
        except (ValueError, TypeError):
            bids_max = None

        subjects = request.query_params.getlist("subjects", None)

        filters = Q()

        filters &= Q(status="open") | Q(status="pending")

        if price_min:
            filters &= Q(price__gte=price_min)
        
        if bids_max:
            filters &= Q(bids_count__lte=bids_max)
        
        if subjects:
            filters &= Q(subject__in=subjects)

        maxPage = math.ceil(HomeworkOrder.objects.filter(
            filters
        ).count() / page_size)

        status_priority = Case(
            When(author__verification_status="verified", then=1),
            When(author__verification_status="pending", then=2),
            When(author__verification_status="unverified", then=3),
            When(author__verification_status="rejected", then=4),
            default=5,
            output_field=IntegerField(),

        )
        orders = HomeworkOrder.objects.filter(
            filters
        ).annotate(
            priority=status_priority
        ).order_by(
            "priority", "-created_at"
        )[start: end].select_related('author', 'executor').prefetch_related('reviews')
        #if query:
        #    orders = orders.filter(Q(name__icontains=query) | Q(description__icontains=query))
        #if subject:
        #    orders = orders.filter(subject=subject)
    
        serializer_orders = HomeworkOrderSerializer(orders, many=True)
        return Response({
            "orders": serializer_orders.data,
            "maxPage": maxPage
        }, status=status.HTTP_200_OK)


class SearchOrderDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        
        order = get_object_or_404(HomeworkOrder.objects.select_related('author', 'executor').prefetch_related('reviews'), id=order_id)

        priority_status = Case(
            When(author__verification_status="verified", then=1),
            When(author__verification_status="pending", then=2),
            When(author__verification_status="unverified", then=3),
            When(author__verification_status="rejected", then=4),
            default=5,
            output_field=IntegerField()
        )

        bids = ResponseBid.objects.filter(order=order).annotate(
            priority=priority_status
        ).order_by(
            "priority","-created_at"
        ).select_related(
            'order', 'author'
        )
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
        bid = get_object_or_404(ResponseBid.objects.select_related('order', 'order__author', 'order__executor').prefetch_related('order__reviews'), id=bid_id)
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

        chat, _ = Conversation.objects.get_or_create(user1=user1, user2=user2)
        
        try:
            with transaction.atomic():
                bid.status = "offer"
                bid.save(update_fields=['status'])

                order.status = "pending"
                order.selected_bid = bid
                order.final_price = final_price
                order.final_days = final_days
                order.save(update_fields=['status', 'selected_bid', 'final_price', 'final_days'])

                message = Message.objects.create(
                    chat=chat,
                    sender=request.user,
                    text="OFFER",
                    type='offer',
                    order=order
                )

                chat.last_message = message
                chat.save(update_fields=['last_message'])
        
        
                return Response({
                    "order": HomeworkOrderSerializer(order).data 
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка назначения исполнителя: {e}")
            return Response({
                "error": "Ошибка назначения исполнителя"
            }, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, order_id):
        order = get_object_or_404(HomeworkOrder.objects.select_related(
            'author', 'selected_bid', 'executor'
            ).prefetch_related('reviews'), id=order_id)
        
        message_to_delete = get_object_or_404(Message, order=order, type='offer')

        chat = message_to_delete.chat

        bid = order.selected_bid

        if order.author != request.user:
            return Response({
                "error": "У вас  нет права отправлять офер"
            }, status=status.HTTP_403_FORBIDDEN)
    
        try:
            with transaction.atomic():
                if bid:
                    bid.status = "pending"
                    bid.save(update_fields=['status'])

                order.status = "open"
                order.selected_bid = None
                order.final_price = None
                order.final_days = None
                order.save(update_fields=['status', 'selected_bid', 'final_price', 'final_days'])

                message_id = message_to_delete.id

                if chat:
                    if message_id == chat.last_message.id:
                        new_last_message = chat.messages.exclude(id=message_id).order_by("-created_at").first()
                        chat.last_message = new_last_message
                        chat.save(update_fields=['last_message'])

                message_to_delete.delete()

                return Response({
                    "order": HomeworkOrderSerializer(order).data
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка назначения исполнителя: {e}")
            return Response({
                "error": "Ошибка назначения исполнителя"
            }, status=status.HTTP_400_BAD_REQUEST)
        
class OrderConfirmationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id, message_id):
        order = get_object_or_404(HomeworkOrder.objects.select_related(
            'selected_bid', 'author', 'selected_bid__author', 'executor'
        ), id=order_id)
        message = get_object_or_404(Message.objects.select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ), id=message_id, order=order)

        if order.status != "pending":
            return Response({
                "error": "Заказ уже в работе или завершен"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not order.selected_bid:
            return Response({"error": "Ставка не выбрана"}, status=400)
        
        bid = order.selected_bid
        bid_author = bid.author
        
        if bid_author != request.user:
            return Response({
                "error": "У вас  нет права принимать ставку"
            }, status=status.HTTP_403_FORBIDDEN)
        try:
            with transaction.atomic():

                bid.status = "accepted"
                bid.save(update_fields=['status'])

                ResponseBid.objects.filter(order=order).exclude(id=bid.id).update(status="rejected")

                order.executor = bid_author
                order.status = "in_progress"

                now = timezone.now()
                order.started_at = now
                if order.final_days:
                    order.expected_finish_at = now + timedelta(days=order.final_days)
                order.save(update_fields=['status', 'executor', 'started_at', 'expected_finish_at'])

                message.type = "offer_accepted"
                message.save(update_fields=['type'])

                return Response({
                    "message": MessageSerializer(message,context={'request': request}).data if message else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка потверждения исполнителя: {e}")
            return Response({
                "error": "Ошибка удаления оффера"
            }, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, order_id, message_id):
        order = get_object_or_404(HomeworkOrder.objects.select_related(
            'selected_bid', 'author', 'executor', 'selected_bid__author'
        ), id=order_id)
        message = get_object_or_404(Message.objects.select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ), id=message_id, order=order)

        if (not order.selected_bid or order.selected_bid.author != request.user):
            return Response({
                "error": "У вас  нет права отклонять ставку"
            }, status=status.HTTP_403_FORBIDDEN)
        
        bid = order.selected_bid

        try:
            with transaction.atomic():
                bid.status = "pending"
                bid.save(update_fields=['status'])

                order.status = "open"
                order.selected_bid = None
                order.final_price = None
                order.final_days = None
                order.save(update_fields=['status', 'selected_bid', 'final_price', 'final_days'])

                message.type = "offer_declined"
                message.save(update_fields=['type'])

                return Response({
                    "message": MessageSerializer(message,context={'request': request}).data if message else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка удаления оффера: {e}")
            return Response({
                "error": "Ошибка удаления оффера"
            }, status=status.HTTP_400_BAD_REQUEST)

class OrderCompletionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id, message_id):
        order = get_object_or_404(HomeworkOrder.objects.select_related(
            'author', 'executor', 'selected_bid'
        ), id=order_id)
        message = get_object_or_404(Message.objects.select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ), id=message_id, order=order)

        if request.user != order.author:
            return Response({
                "error": "У вас  нет права потверждать выполнения заказа"
            }, status=status.HTTP_403_FORBIDDEN)

        if order.status != "in_progress":
            return Response({
                "error": "Можно подтвердить выполнение только того заказа, который находится в работе"
            }, status=status.HTTP_400_BAD_REQUEST)
        

        bid = order.selected_bid
        if not bid:
            return Response({
                "error": "Исполнитель не найден"
                }, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                bid.status = "completed"
                bid.save(update_fields=['status'])

                order.status = 'completed'
                order.save(update_fields=['status'])
                
                message.type = "order_completed"
                message.save(update_fields=['type'])
                
                return Response({
                    "message": MessageSerializer(message,context={'request': request}).data if message else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка потверждения выполнения заказа: {e}")
            return Response({
                "error": "Ошибка потверждения выполнения заказа"
            }, status=status.HTTP_400_BAD_REQUEST)
    
class OrderReviewAPIView(APIView):
    def post(self, request, order_id, message_id):
        
        order = get_object_or_404(HomeworkOrder.objects.select_related(
            'author', 'executor'
        ), id=order_id)
        message = get_object_or_404(Message.objects.select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ), id=message_id, order=order)

        text = request.data.get("text")
        grade = request.data.get("grade")
        
        if not text or not grade:
            return Response({
                "error": "Нет всех данных"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:   
            grade = int(grade) 
            if not (1 <= grade <= 5):
                raise ValueError
        except (TypeError, ValueError):
            return Response({
                "error": "Оценка должна быть числом"
                }, status=400)

        type_user = ""
        
        try:
            with transaction.atomic():
                if request.user == order.author:     
                    type_user = "customer"

                    user = order.executor
                    user.executor_stars_sum += grade
                    user.executor_stars_count += 1
                    user.executor_rating = round(user.executor_stars_sum / user.executor_stars_count, 2)
                    user.save(update_fields=['executor_stars_sum', 'executor_stars_count', 'executor_rating'])

                elif request.user == order.executor:
                    type_user = "executor"

                    user = order.author
                    user.customer_stars_sum += grade
                    user.customer_stars_count += 1
                    user.customer_rating = round(user.customer_stars_sum / user.customer_stars_count, 2)
                    user.save(update_fields=['customer_stars_sum', 'customer_stars_count', 'customer_rating'])

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
        except Exception as e:
            print(f"Ошибка отправки отзыва: {e}")
            return Response({
                "error": "Ошибка отправки отзыва"
            }, status=status.HTTP_400_BAD_REQUEST)

class OrderDisputeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id, message_id):
        order = get_object_or_404(HomeworkOrder.objects.select_related(
            'author', 'executor'
        ), id=order_id)
        message = get_object_or_404(Message, id=message_id, order=order)

        if order.status != "in_progress":
            return Response({
                "error": "Спор можно открыть только для заказов в статусе 'В работе'"
            }, status=status.HTTP_403_FORBIDDEN)

        if request.user not in (order.author, order.executor):
            return Response({
                "error": "У вас нет прав открывать спор по этому заказу"
            }, status=status.HTTP_403_FORBIDDEN)
        
        if OrderDispute.objects.filter(order=order).exists():
             return Response({
                 "error": "Спор по этому заказу уже открыт"
                 }, status=status.HTTP_400_BAD_REQUEST)
        
        opponent = order.executor if order.author == request.user else order.author

        try:
            with transaction.atomic():
                dispute = OrderDispute.objects.create(
                    order=order,
                    author=request.user,
                    opponent=opponent
                )

                message.type = "dispute"
                message.save(update_fields=['type'])

                order.status = "dispute"
                order.save(update_fields=['status'])

                return Response({
                    "message": MessageSerializer(message,context={'request': request}).data if message else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка создания диспута: {e}")
            return Response({
                "error": "Ошибка создания диспута"
            }, status=status.HTTP_400_BAD_REQUEST)
        
class MyOrdersAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_status):
        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 3))
        
            if page < 1:
                page = 1
            if page_size < 1:
                page_size = 3
                
        except (ValueError, TypeError):

            page = 1
            page_size = 3
        
        start = (page - 1) * page_size
        end = start + page_size

        maxPage = math.ceil(HomeworkOrder.objects.filter(author=request.user, status=order_status).count() / page_size)

        myOrders = HomeworkOrder.objects.filter(author=request.user, status=order_status).select_related(
            'author', 'executor'
        ).prefetch_related('reviews').order_by("-created_at")[start:end]
        
        if maxPage == 0:
            maxPage = 1

        serializer_myOrders = HomeworkOrderSerializer(myOrders, many=True)
        return Response({
            "myOrders": serializer_myOrders.data,
            "maxPage": maxPage
        }, status=status.HTTP_200_OK)
    
    def post(self, request):     
        
        name = request.data.get("name")
        description = request.data.get("description")
        price = request.data.get("price")
        deadline_time = request.data.get("deadline_time")
        subject = request.data.get("subject")

        current_status = request.data.get("currentStatus")

        try:
            page = int(request.data.get("page", 1))
            page_size = int(request.data.get("page_size", 3))
        
            if page < 1:
                page = 1
            if page_size < 1:
                page_size = 3
                
        except (ValueError, TypeError):

            page = 1
            page_size = 3
        
        start = (page - 1) * page_size
        end = start + page_size

        if not current_status:
            current_status = "open"
        
        if not all([name, price, deadline_time, subject]):
            return Response({"error": "Заполните все обязательные поля"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            days = int(deadline_time)
            price = int(price)

            if days < 1 or price < 1:
                raise ValueError
            deadline_date = timezone.now() + timedelta(days=days)
        except (TypeError, ValueError):
            return Response({"error": "Срок должен быть числом (количество дней)"}, status=status.HTTP_400_BAD_REQUEST)
        

        try:
            with transaction.atomic():
                HomeworkOrder.objects.create(
                    name=name,
                    description=description,
                    price=price,
                    deadline_time=deadline_date,
                    subject=subject,
                    author=request.user
                )
                maxPage = math.ceil(HomeworkOrder.objects.filter(author=request.user, status="open").count() / page_size)
                if maxPage == 0:
                    maxPage = 1

                orders = HomeworkOrder.objects.filter(author=request.user, status="open").order_by(
                    "-created_at"
                ).select_related(
                    'author', 'executor'
                ).prefetch_related('reviews').order_by("-created_at")[start: end]
                #делаем возврат только опен ордерс ведь только он изменился 
                serializer_orders = HomeworkOrderSerializer(orders, many=True)

                
                return Response({
                    "myOrders": serializer_orders.data,
                    "maxPage": maxPage
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка создания заказа: {e}")
            return Response({
                "error": "Ошибка создания заказа"
            }, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, order_id):
        user = request.user

        order = get_object_or_404(HomeworkOrder.objects.select_related(
            'author', 'executor'
        ), id=order_id, author=user)

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

        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 3))
        
            if page < 1:
                page = 1
            if page_size < 1:
                page_size = 3
                
        except (ValueError, TypeError):

            page = 1
            page_size = 3
        
        start = (page - 1) * page_size
        end = start + page_size

        maxPage = math.ceil(ResponseBid.objects.filter(author=request.user, status=bid_status).count() / page_size)
        if maxPage == 0:
            maxPage = 1

        bids = ResponseBid.objects.filter(author=request.user, status=bid_status).order_by("-created_at").select_related(
            'author', 'order'
        )[start: end]

        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "bids": serializer_bids.data,
            "maxPage": maxPage
        },status=status.HTTP_200_OK)

    def post(self, request, order_id):
        
        order = get_object_or_404(HomeworkOrder.objects, id=order_id)

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
        price = request.data.get("price")
        days_to_complete = request.data.get("days_to_complete")

        if not all([description, price, days_to_complete]):
            return Response({"error": "Заполните все обязательные поля"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            days = int(days_to_complete)
            price = int(price)
            if days < 1 or price < 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"error": "Срок должен быть числом (количество дней)"}, status=status.HTTP_400_BAD_REQUEST)
        
        user_bid = ResponseBid.objects.create(
            description=description,
            author=request.user,
            price=price,
            order=order,
            days_to_complete=days
        )

        bids = ResponseBid.objects.filter(order=order).select_related(
            'author', 'order'
        )
        serializer_bids = ResponseBidSerializer(bids, many=True)

        return Response({
            "bids": serializer_bids.data,
            "bidId": user_bid.id
        }, status=status.HTTP_201_CREATED)
    
    def delete(self, request, bid_id):
        bid = ResponseBid.objects.filter(id=bid_id, author=request.user).select_related(
            'order'
        ).first()

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
        
        remaining_bids = order.bids.select_related('order', 'author').all()

        return Response({
            "bids": ResponseBidSerializer(remaining_bids, many=True).data
        }, status=status.HTTP_200_OK)
    

class MyDisputesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, dispute_status="open"):
        user = request.user

        user_participant = Q(author=user) | Q(opponent=user)

        status_to_filter = dispute_status or "open"

        try:
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 3))
        
            if page < 1:
                page = 1
            if page_size < 1:
                page_size = 3
                
        except (ValueError, TypeError):

            page = 1
            page_size = 3
        
        start = (page - 1) * page_size
        end = start + page_size

        maxPage = math.ceil(OrderDispute.objects.filter(user_participant & Q(status=status_to_filter)).count() / page_size)
        if maxPage == 0:
            maxPage = 1

        if dispute_status:
            disputes = OrderDispute.objects.filter(user_participant & Q(status=dispute_status)).order_by(
                "-created_at"
            )[start: end].select_related(
                'opponent', 'author', 'order', 'last_message'
            )
        
        else:
            disputes = OrderDispute.objects.filter(user_participant & Q(status="open")).order_by(
                "-created_at"
            )[start: end].select_related(
                'opponent', 'author'
            )

        return Response({
            "disputes": OrderDisputeSerializer(disputes, many=True).data,
            "maxPage": maxPage
        }, status=status.HTTP_200_OK)

class DisputeDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, dispute_id, last_message_id, limit):
        user = request.user

        dispute = get_object_or_404(OrderDispute.objects.select_related(
            'order', 'author', 'opponent', 'order__author', 'order__executor','last_message'
        ).prefetch_related(
            'messages'
        ), (Q(author=user) | Q(opponent=user)) & Q(id=dispute_id))

        if not dispute.order:
            return Response({
                "error": "Нет данных заказа"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order = dispute.order

        if last_message_id:
            filters = Q(dispute=dispute) & Q(id__lt=last_message_id)
        else: 
            filters = Q(dispute=dispute)

        count_messages = DisputeMessage.objects.filter(filters).count()
        
        limit = min(limit, count_messages)
        messages_query = DisputeMessage.objects.filter(filters).select_related(
            "author"
        ).order_by("-created_at")[:limit]

        messages = list(messages_query)[::-1]

        return Response({
            "order": HomeworkOrderSerializer(order).data,
            "dispute": OrderDisputeSerializer(dispute).data,
            "messages": DisputeMessageSerializer(messages, many=True).data,
            "messageRemain": count_messages - len(messages),
            "user_id": request.user.id
        }, status=status.HTTP_200_OK)

    def post(self, request, dispute_id):
        user = request.user

        dispute = get_object_or_404(OrderDispute, (Q(author=user) | Q(opponent=user)) & Q(id=dispute_id))

        description = request.data.get("description")

        if not description or description.strip() == "":
            return Response({
                "error": "Сообщение не может быть пустым"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                new_message = DisputeMessage.objects.create(
                    dispute=dispute,
                    description=description,
                    author=request.user
                )
                
                dispute.last_message = new_message
                update_fields = ['last_message']

                if dispute.status == "open":
                    dispute.status = "on_review"
                    update_fields.append('status')

                dispute.save(update_fields=update_fields)

                return Response({
                    "message": DisputeMessageSerializer(new_message).data
                }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"Ошибка отправки сообщения в диспуте: {e}")
            return Response({
                "error": "Ошибка отправки сообщения в диспуте"
            }, status=status.HTTP_400_BAD_REQUEST)
    