
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('users/', include('users.api_urls')),
    path('homework/', include('homework.api_urls')),
    path('chat/', include('chat.api_urls')),
]