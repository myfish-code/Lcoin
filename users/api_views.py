import math

from rest_framework.response import Response
from django.contrib.auth import authenticate
from users.models import Client
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from homework.models import HomeworkOrder, OrderReview

from homework.serializers import HomeworkOrderSerializer, OrderReviewSerializer
from users.serializers import ClientSerializer
from django.shortcuts import get_object_or_404
from django.db import transaction

class LoginAPIView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
    
        if (not username or not password):
            return Response({"error": "no_all_data"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({"error": "incorrect_data"}, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken.for_user(user)


        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": ClientSerializer(user).data
            })

class RegisterAPIView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        password2 = request.data.get("password2")

        email = request.data.get("email")
        
        if (not username or not password or not password2 or not email):
            return Response({"error": "no_all_data"}, status=status.HTTP_400_BAD_REQUEST)
        
        if password != password2:
            return Response({"error": "password_no_match"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                if Client.objects.filter(username=username).exists():
                    return Response({"error": "user_has"}, status=status.HTTP_400_BAD_REQUEST)

                if Client.objects.filter(email=email).exists():
                    return Response({"error": "email_has"}, status=status.HTTP_400_BAD_REQUEST)

                user = Client.objects.create_user(
                    username=username,
                    password=password,
                    email=email
                )

                refresh = RefreshToken.for_user(user)

                return Response({
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": ClientSerializer(user).data
                    }, status=status.HTTP_201_CREATED)
        except Exception as e:
            print(f"Ошибка регистрации: {e}")
            return Response({"error": "error_register"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id, choice_info):

        user = get_object_or_404(Client, id=user_id)

        if choice_info not in ("executor", "customer"):
            choice_info = "executor"

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

        if choice_info == "executor": 
            maxPage = math.ceil(HomeworkOrder.objects.filter(
                status="completed", executor=user.id
            ).count() / page_size)

            orders = HomeworkOrder.objects.filter(
                status="completed", executor=user.id
            ).order_by("-created_at")[start: end]
        else:
            maxPage = math.ceil(HomeworkOrder.objects.filter(
                status="completed", author=user.id
            ).count() / page_size)

            orders = HomeworkOrder.objects.filter(
                status="completed", author=user.id
            ).order_by("-created_at")[start: end]

        if maxPage == 0:
            maxPage = 1

        orders = orders.select_related('author', 'executor').prefetch_related('reviews')
        
        return Response({
            "user": ClientSerializer(user).data,
            "orders": HomeworkOrderSerializer(orders, many=True).data,
            "maxPage": maxPage
        }, status=status.HTTP_200_OK)


class LanguageAPIView(APIView):
    permission_classes=[IsAuthenticated]

    def patch(self, request, lang):
        lang_lists = ["uk", "ru", "sk", "en"]

        if lang not in lang_lists:
            return Response({
                "error": "Некорректные данные языка"
            }, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        user.language = lang
        user.save(update_fields=['language'])

        return Response({
            "user": ClientSerializer(user).data,
        }, status=status.HTTP_200_OK)
    
class VerifyPhotoAPIView(APIView):
    permission_classes=[IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        photo_file = request.FILES.get('photo')

        if not photo_file:
            return Response({
                "error": "No photo uploaded"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if photo_file.size > 5 * 1024 * 1024:
            return Response({"error": "File too large (max 5MB)"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not photo_file.name.lower().endswith(('.png', '.jpg', '.jpeg')):
            return Response({"error": "Invalid file type"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user

        if user.verification_photo:
            user.verification_photo.delete(save=False)

        if user.verification_status not in ('unverified', 'rejected'):
            return Response({
                "error": "Invalid verification status"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.verification_photo = photo_file
        user.verification_status = "pending"

        user.save(update_fields=['verification_photo', 'verification_status'])

        return Response({
            "error": None
        }, status=status.HTTP_200_OK)