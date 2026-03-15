from django.urls import path
from users.api_views import (
    LoginAPIView,
    ProfileAPIView, 
    LanguageAPIView,
    VerifyPhotoAPIView,
    ContactFormView,
    PreRegisterAPIView
)
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('login/', LoginAPIView.as_view()),
    path('pre-register/', PreRegisterAPIView.as_view()),
    path('profile/<int:user_id>/<str:choice_info>/', ProfileAPIView.as_view()),
    path('change-language/', LanguageAPIView.as_view()),
    path('change-language/<str:lang>/', LanguageAPIView.as_view()),
    path('verify/', VerifyPhotoAPIView.as_view()),
    path('contact/', ContactFormView.as_view()),
    path('token/refresh/', TokenRefreshView.as_view()),
    
]
