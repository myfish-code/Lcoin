from django.urls import path
from homework.views import search_view, orders_view

app_name = 'homework'

urlpatterns = [
    path("search/", search_view, name="search"),
    path("orders/", orders_view, name="orders")
]
