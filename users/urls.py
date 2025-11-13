from django.urls import path
from users.views import login_view, register_view, profile_view, log_out

app_name = 'users' 

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('profile/', profile_view, name='profile'),
    path('logout/', log_out, name="logout")
]
