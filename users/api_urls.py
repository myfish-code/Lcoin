from django.urls import path
from users.api_views import (
    LoginAPIView,
    RegisterAPIView,
    ProfileAPIView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', LoginAPIView.as_view()),
    path('register/', RegisterAPIView.as_view()),
    path('profile/', ProfileAPIView.as_view()),
    
    path('token/refresh/', TokenRefreshView.as_view()),
    
]
