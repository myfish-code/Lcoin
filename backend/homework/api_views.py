from importlib.readers import FileReader
import math
import stat

from django.shortcuts import get_object_or_404
from django.http import Http404
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
        
        try:
            order_id = int(order_id) 
        except ValueError:
            raise Http404("Invalid ID format")
        
        order = get_object_or_404(HomeworkOrder.objects.select_related('author', 'executor').prefetch_related('reviews'), id=order_id)

        priority_status = Case(
            #When(id=order.selected_bid.id, then=0),
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

        message_order = Message.objects.filter(
            order=order
        ).first()
        chat = message_order.chat.id if message_order else None

        order_data = HomeworkOrderSerializer(order, context={'request': request}).data
        order_data['chatId'] = chat
                        
        return Response({
            "order": order_data,
            "bids": serializer_bids.data,
            "is_author": is_author,
            "user_bid_id": user_bid.id if user_bid else None,

        }, status=status.HTTP_200_OK)

class OrderAssignmentAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, bid_id):
        
        bid = ResponseBid.objects.filter(id=bid_id).select_related(
            'order', 'order__author', 'order__executor'
        ).prefetch_related(
            'order__reviews'
        ).first()

        if not bid:
            return Response({
                "error": "not_found_bid"
            }, status=status.HTTP_400_BAD_REQUEST)
        order = bid.order
        final_price = request.data.get("final_price")
        final_days = request.data.get("final_days")

        if order.author != request.user:
            return Response({
                "error": "not_allow"
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
                order.save(update_fields=['status', 'selected_bid'])

                message = Message.objects.create(
                    chat=chat,
                    sender=request.user,
                    text="OFFER",
                    type='offer',
                    order=order,
                    final_price = final_price,
                    final_days = final_days
                )

                chat.last_message = message
                chat.save(update_fields=['last_message'])

                order_data = HomeworkOrderSerializer(order).data
                order_data['chatId'] = chat.id
                        
                return Response({
                    "order": order_data
                }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": "assignment_post"
            }, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, order_id):

        order = HomeworkOrder.objects.filter(id=order_id).select_related(
            'author', 'selected_bid', 'executor'
            ).prefetch_related('reviews').first()
        if not order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message_to_delete = Message.objects.filter(order=order, type='offer').first()
        if not message_to_delete or message_to_delete.type == "deleted":
            return Response({
                "error": "not_found_message"
            }, status=status.HTTP_400_BAD_REQUEST)

        chat = message_to_delete.chat

        bid = order.selected_bid

        if order.author != request.user:
            return Response({
                "error": "not_allow"
            }, status=status.HTTP_403_FORBIDDEN)
    
        try:
            with transaction.atomic():
                if bid:
                    bid.status = "pending"
                    bid.save(update_fields=['status'])

                order.status = "open"
                order.selected_bid = None
            
                order.save(update_fields=['status', 'selected_bid'])

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
            return Response({
                "error": "assignment_delete"
            }, status=status.HTTP_400_BAD_REQUEST)
        
class OrderConfirmationAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id, message_id):
        
        order = HomeworkOrder.objects.filter(id=order_id).select_related(
            'selected_bid', 'author', 'selected_bid__author', 'executor'
        ).first()
        if not order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)
        

        if order.status != "pending":
            return Response({
                "error": "order_in_work"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not order.selected_bid:
            return Response({"error": "not_found_bid"}, status=400)
        
        message = Message.objects.filter(id=message_id, order=order).select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ).first()
        if not message or message.type == "deleted":
            return Response({
                "error": "not_found_message"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        final_price = message.final_price
        final_days = message.final_days

        if not final_days or not final_price:
            return Response({
                "error": "no_data"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        bid = order.selected_bid
        bid_author = bid.author
        
        if bid_author != request.user:
            return Response({
                "error": "not_allow"
            }, status=status.HTTP_403_FORBIDDEN)
        try:
            with transaction.atomic():

                bid.status = "accepted"
                bid.save(update_fields=['status'])

                ResponseBid.objects.filter(order=order).exclude(id=bid.id).update(status="rejected")

                order.executor = bid_author
                order.status = "in_progress"
                order.final_price = final_price
                order.final_days = final_days

                now = timezone.now()
                order.started_at = now

                
                order.expected_finish_at = now + timedelta(days=final_days)

                order.save(update_fields=['status', 'executor', 'started_at', 'expected_finish_at', 'final_price', 'final_days'])

                message.type = "offer_accepted"
                message.save(update_fields=['type'])

                return Response({
                    "message": MessageSerializer(message,context={'request': request}).data if message else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": "confirm_order_post"
            }, status=status.HTTP_400_BAD_REQUEST)
        
    def delete(self, request, order_id, message_id):

        order = HomeworkOrder.objects.filter(id=order_id).select_related(
            'selected_bid', 'author', 'selected_bid__author', 'executor'
        ).first()
        if not order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message = Message.objects.filter(id=message_id, order=order).select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ).first()
        if not message:
            return Response({
                "error": "not_found_message"
            }, status=status.HTTP_400_BAD_REQUEST)

        if (not order.selected_bid or order.selected_bid.author != request.user):
            return Response({
                "error": "not_allow"
            }, status=status.HTTP_403_FORBIDDEN)
        
        bid = order.selected_bid

        try:
            with transaction.atomic():
                bid.status = "pending"
                bid.save(update_fields=['status'])

                order.status = "open"
                order.selected_bid = None

                order.save(update_fields=['status', 'selected_bid'])

                message.type = "offer_declined"
                message.save(update_fields=['type'])

                return Response({
                    "message": MessageSerializer(message,context={'request': request}).data if message else None
                }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                "error": "confirm_order_delete"
            }, status=status.HTTP_400_BAD_REQUEST)

class OrderCompletionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id, message_id):

        order = HomeworkOrder.objects.filter(id=order_id).select_related(
            'selected_bid', 'author', 'executor'
        ).first()
        if not order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message = Message.objects.filter(id=message_id, order=order).select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ).first()
        if not message or message.type == "deleted":
            return Response({
                "error": "not_found_message"
            }, status=status.HTTP_400_BAD_REQUEST)

        if request.user != order.author:
            return Response({
                "error": "not_allow"
            }, status=status.HTTP_403_FORBIDDEN)

        if order.status != "in_progress":
            return Response({
                "error": "incorrect_order_status"
            }, status=status.HTTP_400_BAD_REQUEST)
        

        bid = order.selected_bid
        if not bid:
            return Response({
                "error": "not_found_executor"
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
            return Response({
                "error": "confirm_order_complete"
            }, status=status.HTTP_400_BAD_REQUEST)
    
class OrderReviewAPIView(APIView):
    def post(self, request, order_id, message_id):
        
        order = HomeworkOrder.objects.filter(id=order_id).select_related(
            'author', 'executor'
        ).first()
        if not order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        message = Message.objects.filter(id=message_id, order=order).select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ).first()
        if not message or message.type == "deleted":
            return Response({
                "error": "not_found_message"
            }, status=status.HTTP_400_BAD_REQUEST)

        text = request.data.get("text")
        grade = request.data.get("grade")
        
        if not text or not grade:
            return Response({
                "error": "no_data"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:   
            grade = int(grade) 
            if not (1 <= grade <= 5):
                raise ValueError
        except (TypeError, ValueError):
            return Response({
                "error": "price_abs"
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
                        "error": "not_allow"
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
            return Response({
                "error": "no_message_send"
            }, status=status.HTTP_400_BAD_REQUEST)

class OrderDisputeAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id, message_id):
        
        order = HomeworkOrder.objects.filter(id=order_id).select_related(
            'author', 'executor'
        ).first()
        if not order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.filter(id=message_id, order=order).select_related(
            'order',
            'sender',
            'order__dispute'
        ).prefetch_related(
            'order__reviews'
        ).first()
        if not message or message.type == "deleted":
            return Response({
                "error": "not_found_message"
            }, status=status.HTTP_400_BAD_REQUEST)

        if order.status != "in_progress":
            return Response({
                "error": "incorrect_order_status"
            }, status=status.HTTP_403_FORBIDDEN)

        if request.user not in (order.author, order.executor):
            return Response({
                "error": "not_allow"
            }, status=status.HTTP_403_FORBIDDEN)
        
        if OrderDispute.objects.filter(order=order).exists():
             return Response({
                 "error": "dispute_exist"
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
            return Response({
                "error": "create_dispute_chat"
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

        file_upload = request.FILES.get("file_upload")

        if file_upload:
            if file_upload.size > 10 * 1024 * 1024:
                return Response({"error": "to_large_file_10mb"}, status=status.HTTP_400_BAD_REQUEST)
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
            return Response({"error": "fields_empty"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            price = int(price)
            if price < 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response({
                "error": "price_abs"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            days = int(deadline_time)
            if days < 1:
                raise ValueError
            deadline_date = timezone.now() + timedelta(days=days)
        except (TypeError, ValueError):
            return Response({"error": "term_abs"}, status=status.HTTP_400_BAD_REQUEST)
        

        try:
            with transaction.atomic():

                HomeworkOrder.objects.create(
                    name=name,
                    description=description,
                    price=price,
                    deadline_time=deadline_date,
                    subject=subject,
                    author=request.user,
                    order_file=file_upload if file_upload else None
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
            return Response({
                "error": "order_create" 
            }, status=status.HTTP_400_BAD_REQUEST)
        "Ошибка создания заказа"

    def delete(self, request, order_id):
        
        user = request.user
        order = HomeworkOrder.objects.filter(id=order_id, author=user).select_related(
            'author', 'executor'
        ).first()
        
        if not order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)

        if order.status not in ("open", "pending"):
            return Response({
                "error": "not_allow"
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
                "error": "order_already_has_candidate"
            },status=status.HTTP_400_BAD_REQUEST)

        if order.author == request.user:
            return Response({
                "error": "not_allow"
                }, status=status.HTTP_403_FORBIDDEN)
    
        if order.bids.filter(author=request.user).exists():
            return Response({
                "error": "not_allow"
            },status=status.HTTP_400_BAD_REQUEST)

        description = request.data.get("description")
        price = request.data.get("price")
        days_to_complete = request.data.get("days_to_complete")

        if not all([description, price, days_to_complete]):
            return Response({"error": "fields_empty"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            price = int(price)
            if price < 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response({
                "error": "price_abs"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            days = int(days_to_complete)
            if days < 1:
                raise ValueError
        except (TypeError, ValueError):
            return Response({"error": "term_abs"}, status=status.HTTP_400_BAD_REQUEST)
        
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
                "error": "not_found_bid"
            }, status=status.HTTP_403_FORBIDDEN)

        order = bid.order

        if order.status != "open":
            return Response({
                "error": "order_already_has_candidate"
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

    def get(self, request, dispute_id):
        user = request.user

        dispute = get_object_or_404(OrderDispute.objects.select_related(
            'order', 'author', 'opponent', 'order__author', 'order__executor','last_message'
        ).prefetch_related(
            'messages'
        ), (Q(author=user) | Q(opponent=user)) & Q(id=dispute_id))

        if not dispute.order:
            return Response({
                "error": "not_found_order"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        order = dispute.order

        first_message_id = request.query_params.get("first_message_id", None)
        if first_message_id:
            first_message_id = int(first_message_id)

        last_message_id = request.query_params.get("last_message_id", None)
        if last_message_id:
            last_message_id = int(last_message_id)

        limit = int(request.query_params.get("limit", 50))
        mode = request.query_params.get("mode", None)

        if mode == "getMyDisputeDetail" or mode == "getMoreDisputeMessages":
            filters = Q(dispute=dispute)
            if mode == "getMoreDisputeMessages":
                filters &= Q(id__lt=last_message_id)

            count_messages = DisputeMessage.objects.filter(filters).count()
        
            limit = min(limit, count_messages)
            messages_query = DisputeMessage.objects.filter(filters).select_related(
                "author"
            ).order_by("-created_at")[:limit]

            messages = list(messages_query)[::-1]

            if mode == "getMyDisputeDetail":
                return Response({
                    "order": HomeworkOrderSerializer(order).data,
                    "dispute": OrderDisputeSerializer(dispute).data,
                    "messages": DisputeMessageSerializer(messages, many=True).data,
                    "messageRemain": count_messages - len(messages),
                    "user_id": request.user.id
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "messages": DisputeMessageSerializer(messages, many=True).data,
                    "messageRemain": count_messages - len(messages),
                    "user_id": request.user.id
                }, status=status.HTTP_200_OK)
        
        elif mode == "getUpdatedDisputeMessages":
            filters = Q(dispute=dispute)

            count_messages = DisputeMessage.objects.filter(filters).count()
        
            limit = min(limit, count_messages)

            messages_query = DisputeMessage.objects.filter(filters).select_related(
                "author"
            ).order_by("-created_at")[:limit]

            messages = list(messages_query)[::-1]
            
            return Response({
                "messages": DisputeMessageSerializer(messages, many=True).data,
            }, status=status.HTTP_200_OK)
        
        else:
            return Response({
                "error": "incorrect_data"
            }, status=status.HTTP_400_BAD_REQUEST)


    def post(self, request, dispute_id):
        user = request.user
    
        dispute = OrderDispute.objects.filter((Q(author=user) | Q(opponent=user)) & Q(id=dispute_id)).first()
        if not dispute:
            return Response({
                "error": "not_found_dispute"
            }, status=status.HTTP_400_BAD_REQUEST)
    

        description = request.data.get("description")

        if not description or description.strip() == "":
            return Response({
                "error": "text_empty"
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
            return Response({
                "error": "no_message_send"
            }, status=status.HTTP_400_BAD_REQUEST)
    