from users.serializers import ClientSerializer
from rest_framework.response import Response
from django.contrib.auth import authenticate
from users.models import Client
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated

class LoginAPIView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response({"error": "Неверные данные"}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)


        return Response({
            "user": ClientSerializer(user).data,
            "access": str(refresh.access_token),
            "refresh": str(refresh)
            })

class RegisterAPIView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")
        password2 = request.data.get("password2")

        email = request.data.get("email")

        if password != password2:
            return Response({"error": "Пароли не совпадают"}, status=status.HTTP_400_BAD_REQUEST)

        if Client.objects.filter(username=username).exists():
            return Response({"error": "Пользователь уже существует"}, status=status.HTTP_400_BAD_REQUEST)

        if Client.objects.filter(email=email).exists():
            return Response({"error": "Почта уже используется"}, status=status.HTTP_400_BAD_REQUEST)

        user = Client.objects.create(
            username=username,
            password=password,
            email=email
        )

        refresh = RefreshToken.for_user(user)

        return Response({
            "user": ClientSerializer(user).data,
            "access": str(refresh.access_token),
            "tokens": str(refresh)
            }, status=status.HTTP_201_CREATED)


class ProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "user": ClientSerializer(request.user).data
        }, status=status.HTTP_200_OK)


