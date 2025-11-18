from django.urls import path
from homework.views import search_view, orders_view, order_delete_view, order_detail_view, create_bid, bids_view

app_name = 'homework'

urlpatterns = [
    path("search/", search_view, name="search"),
    path("search/<int:order_id>/", order_detail_view, name="order_detail"),
    path("search/<int:order_id>/bid", create_bid, name="create_bid"),

    path("orders/", orders_view, name="orders"),
    path("orders/<int:order_id>/delete", order_delete_view, name="order_delete"),

    path("bids/", bids_view, name="bids"),
    
]

