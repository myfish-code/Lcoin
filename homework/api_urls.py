from django.urls import path
from homework.api_views import (
    SearchOrdersAPIView,
    SearchOrderDetailAPIView,
    CreateBidAPIView,
    AssignExecutorAPIView,
    MyOrdersAPIView,
    DeleteMyOrderAPIView,
    MyBidsAPIView
)

urlpatterns = [
    path("search/", SearchOrdersAPIView.as_view()),
    path("search/<int:order_id>/", SearchOrderDetailAPIView.as_view()),
    path("search/<int:order_id>/bid/", CreateBidAPIView.as_view()),
    
    path("search/bids/assign/<int:bid_id>/", AssignExecutorAPIView.as_view()),

    path("orders/", MyOrdersAPIView.as_view()),
    path("orders/<int:order_id>/delete/", DeleteMyOrderAPIView.as_view()),

    path("bids/", MyBidsAPIView.as_view()),
    
]
